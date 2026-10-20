import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCheckoutPlan, type PublicPlanId } from '@/lib/plans';
import { getPaddlePriceId } from '@/lib/billing/paddle';

export const runtime = 'nodejs';

type PaddleData = {
  [key: string]: unknown;
  id?: string;
  status?: string;
  subscription_id?: string | null;
  custom_data?: Record<string, unknown> | null;
  items?: Array<{ price_id?: string }>;
  currency_code?: string;
  billing_period?: { starts_at?: string | null; ends_at?: string | null } | null;
  current_billing_period?: { starts_at?: string | null; ends_at?: string | null } | null;
  details?: { totals?: { total?: string | number; grand_total?: string | number } };
};

type PaddleEvent = {
  event_id?: string;
  event_type?: string;
  data?: PaddleData;
};

function verifySignature(rawBody: string, header: string | null, secret: string) {
  if (!header) return false;
  const parts = Object.fromEntries(header.split(';').map((part) => {
    const index = part.indexOf('=');
    return index > -1 ? [part.slice(0, index).trim(), part.slice(index + 1).trim()] : ['', ''];
  }));
  const timestamp = parts.ts;
  const signature = parts.h1;
  if (!timestamp || !signature || !/^\\d+$/.test(timestamp)) return false;
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

function validDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function amountFromTransaction(data: PaddleData, currency: string) {
  const raw = data.details?.totals?.total ?? data.details?.totals?.grand_total;
  if (raw === undefined || raw === null || !/^[A-Z]{3}$/.test(currency)) {
    throw new Error('PADDLE_TRANSACTION_TOTAL_MISSING');
  }
  const minorUnits = Number(raw);
  if (!Number.isFinite(minorUnits) || minorUnits <= 0) {
    throw new Error('PADDLE_TRANSACTION_TOTAL_INVALID');
  }
  const fractionDigits = new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions().maximumFractionDigits;
  const amount = minorUnits / (10 ** (fractionDigits ?? 2));
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('PADDLE_TRANSACTION_TOTAL_INVALID');
  return amount;
}

async function fulfillCompletedTransaction(data: PaddleData, payload: PaddleEvent) {
  if (data.status !== 'completed') throw new Error('PADDLE_TRANSACTION_NOT_COMPLETED');

  const transactionId = String(data.id || '');
  const subscriptionId = String(data.subscription_id || '');
  if (!transactionId || !subscriptionId) throw new Error('PADDLE_SUBSCRIPTION_REFERENCE_MISSING');

  const existingPayment = await db.payment.findUnique({ where: { providerReference: transactionId } });
  if (existingPayment?.status === 'successful') return;

  const customData: Record<string, unknown> = data.custom_data && typeof data.custom_data === 'object' ? data.custom_data : {};
  let userId = typeof customData.userId === 'string' ? customData.userId : '';
  let planId = typeof customData.planId === 'string' ? customData.planId as PublicPlanId : undefined;
  const existingSubscription = await db.subscription.findFirst({ where: { provider: 'paddle', providerReference: subscriptionId } });

  if (!userId && existingSubscription) userId = existingSubscription.userId;
  if (!planId && existingSubscription) planId = existingSubscription.planId as PublicPlanId;

  if (!userId || !planId) throw new Error('PADDLE_CUSTOM_DATA_MISSING');
  const plan = getCheckoutPlan(planId);
  if (!plan) throw new Error('PADDLE_PLAN_INVALID');

  const expectedPriceId = getPaddlePriceId(planId);
  const items = Array.isArray(data.items) ? data.items : [];
  if (!expectedPriceId || !items.some((item) => item.price_id === expectedPriceId)) {
    throw new Error('PADDLE_PRICE_MISMATCH');
  }
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('PADDLE_USER_NOT_FOUND');

  const currency = String(data.currency_code || 'USD');
  const amount = amountFromTransaction(data, currency);
  // Paddle sends the authoritative billing period on transaction/subscription
  // events. Keep the existing period on renewals if this event omits it.
  const expiresAt = validDate(data.billing_period?.ends_at)
    ?? existingSubscription?.expiresAt
    ?? new Date(Date.now() + 30 * 86400000);

  await db.$transaction(async (tx) => {
    const payment = await tx.payment.upsert({
      where: { providerReference: transactionId },
      create: {
        userId,
        provider: 'paddle',
        providerReference: transactionId,
        amount,
        currency,
        status: 'successful',
        planId,
        metadata: payload as object,
      },
      update: { status: 'successful', amount, currency, metadata: payload as object },
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
            currency,
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

async function syncSubscriptionEvent(data: PaddleData, eventType: string) {
  const paddleSubscriptionId = String(data.id || '');
  if (!paddleSubscriptionId) return;

  const subscription = await db.subscription.findFirst({
    where: { provider: 'paddle', providerReference: paddleSubscriptionId },
  });
  // Webhook delivery order is not guaranteed. If the subscription event arrives
  // before transaction.completed, that transaction will create the local record.
  if (!subscription) return;

  const remoteStatus = String(data.status || '');
  const status = eventType === 'subscription.canceled' || remoteStatus === 'canceled'
    ? 'CANCELLED'
    : remoteStatus === 'past_due'
      ? 'PAST_DUE'
      : remoteStatus === 'paused'
        ? 'SUSPENDED'
        : remoteStatus === 'active'
          ? 'ACTIVE'
          : subscription.status;
  const expiresAt = validDate(data.current_billing_period?.ends_at) ?? subscription.expiresAt;

  await db.$transaction(async (tx) => {
    await tx.subscription.update({
      where: { id: subscription.id },
      data: {
        status,
        expiresAt,
        ...(status === 'CANCELLED' ? { cancelledAt: new Date() } : status === 'ACTIVE' ? { cancelledAt: null } : {}),
      },
    });

    if (status === 'CANCELLED') {
      await tx.entitlement.updateMany({
        where: { userId: subscription.userId, source: subscription.id },
        data: { active: false },
      });
    } else if (status === 'ACTIVE') {
      await tx.entitlement.updateMany({
        where: { userId: subscription.userId, source: subscription.id },
        data: { active: true, expiresAt },
      });
    } else if (status === 'PAST_DUE' || status === 'SUSPENDED') {
      await tx.entitlement.updateMany({
        where: { userId: subscription.userId, source: subscription.id },
        data: { expiresAt },
      });
    }
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
    } else if (eventType === 'subscription.created' || eventType === 'subscription.updated' || eventType === 'subscription.canceled') {
      await syncSubscriptionEvent(data, eventType);
    }

    await db.webhookEvent.update({
      where: { provider_providerEventId: { provider: 'paddle', providerEventId: eventId } },
      data: { processedAt: new Date() },
    });
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('paddle_webhook_error', error instanceof Error ? error.message : 'UnknownError');
    return NextResponse.json({ error: 'PAYMENT_PROCESSING_FAILED' }, { status: 400 });
  }
}
