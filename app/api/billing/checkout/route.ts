import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { createCheckout as createFlutterwaveCheckout } from '@/lib/billing/flutterwave';
import { createPaddleCheckout, isPaddleConfigured } from '@/lib/billing/paddle';
import { getCheckoutPlan, type PublicPlanId } from '@/lib/plans';

const schema = z.object({ planId: z.string() });

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'UNAUTHENTICATED', message: 'Sign in before checkout.' }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'Invalid checkout request.' }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'Invalid plan.' }, { status: 400 });

  const plan = getCheckoutPlan(parsed.data.planId);
  if (!plan) return NextResponse.json({ error: 'PLAN_UNAVAILABLE', message: 'This plan is not available for new purchases.' }, { status: 410 });

  // Preserve the current payment path until Paddle is fully configured. As
  // soon as all Paddle credentials and catalog price IDs exist, Paddle becomes
  // the automatic choice. An explicit BILLING_PROVIDER=paddle never falls back.
  const provider = (process.env.BILLING_PROVIDER || (isPaddleConfigured() ? 'paddle' : 'flutterwave')).toLowerCase();
  if (provider === 'paddle' && !isPaddleConfigured()) {
    return NextResponse.json({
      error: 'PADDLE_NOT_CONFIGURED',
      message: 'Paddle is selected but its credentials or plan price IDs are incomplete. No payment has been taken.',
    }, { status: 503 });
  }
  if (provider !== 'paddle' && provider !== 'flutterwave') {
    return NextResponse.json({ error: 'BILLING_PROVIDER_INVALID', message: 'Checkout is temporarily unavailable.' }, { status: 503 });
  }

  try {
    await db.plan.upsert({
      where: { id: plan.id },
      create: { id: plan.id, name: plan.name, monthlyUnits: plan.units, lifetime: false },
      update: { name: plan.name, monthlyUnits: plan.units, lifetime: false },
    });

    const checkout = provider === 'paddle'
      ? await createPaddleCheckout({ userId: user.id, email: user.email, name: user.name, planId: plan.id as PublicPlanId })
      : await createFlutterwaveCheckout({ userId: user.id, email: user.email, name: user.name, planId: plan.id as PublicPlanId });

    return NextResponse.json(checkout);
  } catch (error) {
    console.error('checkout_error', error instanceof Error ? error.message : 'UnknownError');
    return NextResponse.json({ error: 'PAYMENT_PROVIDER_ERROR', message: 'We could not start secure checkout. Please try again.' }, { status: 502 });
  }
}
