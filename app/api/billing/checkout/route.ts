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

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'Invalid plan.' }, { status: 400 });

  const plan = getCheckoutPlan(parsed.data.planId);
  if (!plan) return NextResponse.json({ error: 'PLAN_UNAVAILABLE', message: 'This plan is not available for new purchases.' }, { status: 410 });

  try {
    await db.plan.upsert({
      where: { id: plan.id },
      create: { id: plan.id, name: plan.name, monthlyUnits: plan.units, lifetime: false },
      update: { name: plan.name, monthlyUnits: plan.units, lifetime: false },
    });

    // Prefer Paddle when its full configuration is present. Keep the existing
    // checkout operational during setup rather than silently breaking purchases.
    const checkout = isPaddleConfigured()
      ? await createPaddleCheckout({ userId: user.id, email: user.email, name: user.name, planId: plan.id as PublicPlanId })
      : await createFlutterwaveCheckout({ userId: user.id, email: user.email, name: user.name, planId: plan.id as PublicPlanId });

    return NextResponse.json(checkout);
  } catch (error) {
    console.error('checkout_error', error);
    return NextResponse.json({ error: 'PAYMENT_PROVIDER_ERROR', message: 'We could not start checkout. Please try again.' }, { status: 502 });
  }
}
