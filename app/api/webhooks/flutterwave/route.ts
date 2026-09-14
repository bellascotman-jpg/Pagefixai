import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getPlan, FOUNDING_LIFETIME_MAX_SLOTS, type PlanId } from '@/lib/plans';
import { verifyTransaction } from '@/lib/billing/flutterwave';

function foundingOpen() {
  const raw = process.env.FOUNDING_LIFETIME_LAUNCH_AT;
  if (!raw) return false;
  const launch = new Date(raw);
  if (Number.isNaN(launch.getTime())) return false;
  return Date.now() <= launch.getTime() + 60 * 86400000;
}

export async function POST(request: Request) {
  const configured = process.env.FLUTTERWAVE_WEBHOOK_SECRET;
  const signature = request.headers.get('verif-hash');
  if (!configured || !signature || signature !== configured) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 });
  }

  const eventId = String(payload?.id ?? payload?.data?.id ?? `${payload?.event ?? 'unknown'}:${payload?.data?.tx_ref ?? 'unknown'}`);
  const existing = await db.webhookEvent.findUnique({ where: { provider_providerEventId: { provider: 'flutterwave', providerEventId: eventId } } });
  if (existing?.processedAt) return NextResponse.json({ received: true, duplicate: true });

  await db.webhookEvent.upsert({
    where: { provider_providerEventId: { provider: 'flutterwave', providerEventId: eventId } },
    create: { provider: 'flutterwave', providerEventId: eventId, payload },
    update: { payload },
  });

  try {
    const transactionId = payload?.data?.id;
    if (!transactionId) throw new Error('MISSING_TRANSACTION_ID');

    const verified = await verifyTransaction(transactionId);
    if (verified.status !== 'successful') throw new Error('PAYMENT_NOT_SUCCESSFUL');

    const txRef = verified.tx_ref || payload.data.tx_ref;
    const parts = String(txRef).split('_');
    const userId = parts[1];
    const planId = parts[2] as PlanId;
    const plan = getPlan(planId);
    if (!userId || !plan) throw new Error('INVALID_PAYMENT_REFERENCE');

    const expectedCurrency = process.env.BILLING_CURRENCY || 'USD';
    if (verified.currency !== expectedCurrency || verified.amount < plan.amount) throw new Error('PAYMENT_MISMATCH');

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user || user.email.toLowerCase() !== String(verified.customer?.email || '').toLowerCase()) throw new Error('CUSTOMER_MISMATCH');

    if (planId === 'founding_lifetime') {
      if (!foundingOpen()) throw new Error('FOUNDING_LIFETIME_CLOSED');
      const count = await db.subscription.count({ where: { planId: 'founding_lifetime', status: 'LIFETIME' } });
      if (count >= FOUNDING_LIFETIME_MAX_SLOTS) throw new Error('FOUNDING_LIFETIME_SOLD_OUT');
    }

    await db.$transaction(async (tx) => {
      await tx.payment.upsert({
        where: { providerReference: txRef },
        create: { userId, provider: 'flutterwave', providerReference: txRef, amount: verified.amount, currency: verified.currency, status: 'successful', planId, metadata: payload },
        update: { status: 'successful', metadata: payload },
      });

      const status = planId === 'founding_lifetime' ? 'LIFETIME' : 'ACTIVE';
      const expiresAt = planId === 'founding_lifetime' ? null : new Date(Date.now() + (plan.interval === 'year' ? 365 : 30) * 86400000);
      const subscription = await tx.subscription.upsert({
        where: { id: `flw_${txRef}` },
        create: { id: `flw_${txRef}`, userId, planId, status, provider: 'flutterwave', providerReference: txRef, expiresAt },
        update: { status, expiresAt },
      });

      const features = [
        'AUDIT',
        'REPORTS',
        'FIX_CENTER',
        ...(planId.includes('growth') || planId.includes('agency') || planId === 'founding_lifetime' ? ['COMPETITOR', 'MESSAGE_MATCH', 'COPY_STUDIO'] : []),
        ...(planId.includes('agency') ? ['AGENCY_WORKSPACE'] : []),
      ];

      for (const feature of features) {
        await tx.entitlement.upsert({
          where: { userId_feature: { userId, feature } },
          create: { userId, feature, source: subscription.id, active: true, expiresAt },
          update: { active: true, source: subscription.id, expiresAt },
        });
      }

      await tx.notification.create({
        data: { userId, type: 'PAYMENT_SUCCESS', title: 'Payment confirmed', body: `${plan.name} access is now active.` },
      });
    });

    await db.webhookEvent.update({
      where: { provider_providerEventId: { provider: 'flutterwave', providerEventId: eventId } },
      data: { processedAt: new Date() },
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('flutterwave_webhook_error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'PAYMENT_PROCESSING_ERROR' }, { status: 400 });
  }
}
