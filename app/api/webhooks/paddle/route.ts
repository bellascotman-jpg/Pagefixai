import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCheckoutPlan, type PublicPlanId } from '@/lib/plans';
import { getPaddlePriceId } from '@/lib/billing/paddle';

export const runtime = 'nodejs';

type PaddleEvent = {
  event_id?: string;
  event_type?: string;
  data?: Record<string, any>;
};

function verifySignature(rawBody: string, header: string | null, secret: string) {
  if (!header) return false;
  const parts = Object.fromEntries(header.split(';').map((part) => {
    const index = part.indexOf('=');
    return index > -1 ? [part.slice(0, index).trim(), part.slice(index + 1).trim()] : ['', ''];
  }));
  const timestamp = parts.ts;
  const signature = parts.h1;
  if (!timestamp || !signature || !/^\d+$/.test(timestamp)) return false;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 5 * 60) return false;
  const expected = createHmac('sha256', secret).update(`${timestamp}:${rawBody}`).digest('hex');
  const left = Buffer.from(expected, 'hex');
  const right = Buffer.from(signature, 'hex');
  return left.length === right.length && timingSafeEqual(left, right);
}

function markPlanFeatures(planId: PublicPlanId) {
  return [
    'AUDIT',
    'REPORTS',
    'FIX_CENTER',
    ...(planId === 'growth_monthly' || planId === 'agency_monthly' ? ['COMPETITOR', 'MESSAGE_MATCH', 'COPY_STUDIO'] : []),
    ...(planId === 'agency_monthly' ? ['AGENCY_WORKSPACE'] : []),
  ];
}

async function fulfillCompletedTransaction(data: Record<string, any>, payload: PaddleEvent) {
  if (data.status !== 'completed') throw new Error('PADDLE_TRANSACTION_NOT_COMPLETED');

  const transactionId = String(data.id || '');
  const subscriptionId = String(data.subscription_id || '');
  if (!transactionId || !subscriptionId) throw new Error('PADDLE_SUBSCRIPTION_REFERENCE_MISSING');

  const existingPayment = await db.payment.findUnique({ where: { providerReference: transactionId } });
  if (existingPayment?.status === 'successful') return;

  const customData = data.custom_data && typeof data.custom_data === 'object' ? data.custom_data : {};
  let userId = typeof customData.userId === 'string' ? customData.userId : '';
  let planId = typeof customData.planId === 'string' ? customData.planId as PublicPlanId : undefined;
  let existingSubscription = await db.subscription.findFirst({ where: { provider: 'paddle', providerReference: subscriptionId } });

  if (!userId && existingSubscription) userId = existingSubscription.userId;
  if (!planId && existingSubscription) planId = existingSubscription.planId as PublicPlanId;

  if (!userId || !planId) throw new Error('PADDLE_CUSTOM_DATA_MISSING');
  const plan = getCheckoutPlan(planId);
  if (!plan) throw new Error('PADDLE_PLAN_INVALID');

  const expectedPriceId = getPaddlePriceId(planId);
  const items = Array.isArray(data.items) ? data.items : [];
  if (!expectedPriceId || !items.some((item: Record<string, any>) => item.price_id === expectedPriceId)) {
    throw new Error('PADDLE_PRICE_MISMATCH');
  }
  if (data.currency_code && data.currency_code !== 'USD') throw new Error('PADDLE_CURRENCY_MISMATCH');

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('PADDLE_USER_NOT_FOUND');

  const total = Number(data.details?.totals?.total ?? data.details?.totals?.grand_total ?? 0);
  const amount = Number.isFinite(total) && total > 0 ? total / 100 : plan.amount;
  const expiresAt = new Date(Date.now() + 30 * 86400000);

  await db.$transaction(async (tx) => {
    const payment = await tx.payment.upsert({
      where: { providerReference: transactionId },
      create: {
        userId,
        provider: 'paddle',
        providerReference: transactionId,
        amount,
        currency: data.currency_code || 'USD',
        status: 'successful',
        planId,
        metadata: payload as object,
      },
      update: { status: 'successful', amount, currency: data.currency_code || 'USD', metadata: payload as object },
    });

    const subscription = await tx.subscription.upsert({
      where: { id: `paddle_${subscriptionId}` },
      create: {
        id: `paddle_${subscriptionId}`,
        userId,
        planId,
        status: 'ACTIVE',
        provider: 'paddle',
        providerReference: subscriptionId,
        expiresAt,
      },
      update: { userId, planId, status: 'ACTIVE', expiresAt, cancelledAt: null },
    });

    const referral = await tx.affiliateReferral.findUnique({
      where: { referredUserId: userId },
      include: { affiliate: { select: { id: true, status: true, commissionRate: true } } },
    });
    if (referral?.affiliate.status === 'APPROVED' && referral.affiliate.commissionRate > 0) {
      const priorCommission = await tx.affiliateCommission.findUnique({ where: { paymentId: payment.id } });
      if (!priorCommission) {
        await tx.affiliateCommission.create({
          data: {
            affiliateId: referral.affiliate.id,
            referralId: referral.id,
            paymentId: payment.id,
            amount: Math.round(amount * referral.affiliate.commissionRate) / 100,
            currency: data.currency_code || 'USD',
            commissionRate: referral.affiliate.commissionRate,
            status: 'PENDING',
          },
        });
      }
    }

    for (const feature of markPlanFeatures(planId)) {
      await tx.entitlement.upsert({
        where: { userId_feature: { userId, feature } },
        create: { userId, feature, source: subscription.id, active: true, expiresAt },
        update: { active: true, source: subscription.id, expiresAt },
      });
    }

    await tx.notification.create({
      data: { userId, type: 'PAYMENT_SUCCESS', title: 'Payment confirmed', body: `${plan.name} plan access is now active.` },
    });
  });
}

export async function POST(request: Request) {
  const secret = process.env.PADDLE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: 'WEBHOOK_NOT_CONFIGURED' }, { status: 503 });

  const rawBody = await request.text();
  if (!verifySignature(rawBody, request.headers.get('paddle-signature'), secret)) {
    return NextResponse.json({ error: 'INVALID_SIGNATURE' }, { status: 401 });
  }

  let payload: PaddleEvent;
  try {
    payload = JSON.parse(rawBody) as PaddleEvent;
  } catch {
    return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 });
  }

  const eventId = String(payload.event_id || '');
  const eventType = String(payload.event_type || '');
  const data = payload.data;
  if (!eventId || !eventType || !data) return NextResponse.json({ error: 'INVALID_EVENT' }, { status: 400 });

  const existingEvent = await db.webhookEvent.findUnique({
    where: { provider_providerEventId: { provider: 'paddle', providerEventId: eventId } },
  });
  if (existingEvent?.processedAt) return NextResponse.json({ received: true, duplicate: true });

  await db.webhookEvent.upsert({
    where: { provider_providerEventId: { provider: 'paddle', providerEventId: eventId } },
    create: { provider: 'paddle', providerEventId: eventId, payload: payload as object },
    update: { payload: payload as object },
  });

  try {
    if (eventType === 'transaction.completed') {
      await fulfillCompletedTransaction(data, payload);
    } else if (eventType === 'subscription.canceled' || eventType === 'subscription.updated') {
      const subscriptionId = String(data.id || '');
      if (subscriptionId) {
        const subscription = await db.subscription.findFirst({
          where: { provider: 'paddle', providerReference: subscriptionId },
        });
        if (subscription) {
          const remoteStatus = String(data.status || '');
          const status = eventType === 'subscription.canceled' || remoteStatus === 'canceled'
            ? 'CANCELLED'
            : remoteStatus === 'past_due' || remoteStatus === 'paused'
              ? 'PAST_DUE'
              : remoteStatus === 'active'
                ? 'ACTIVE'
                : subscription.status;
          await db.subscription.update({
            where: { id: subscription.id },
            data: {
              status,
              ...(status === 'CANCELLED' ? { cancelledAt: new Date() } : {}),
            },
          });
        }
      }
    }

    await db.webhookEvent.update({
      where: { provider_providerEventId: { provider: 'paddle', providerEventId: eventId } },
      data: { processedAt: new Date() },
    });
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('paddle_webhook_error', error);
    return NextResponse.json({ error: 'PAYMENT_PROCESSING_FAILED' }, { status: 400 });
  }
}
