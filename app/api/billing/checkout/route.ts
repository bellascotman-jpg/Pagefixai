import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth/session';
import { createCheckout } from '@/lib/billing/flutterwave';
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
    const checkout = await createCheckout({ userId: user.id, email: user.email, name: user.name, planId: plan.id as PublicPlanId });
    return NextResponse.json(checkout);
  } catch (error) {
    console.error('checkout_error', error);
    return NextResponse.json({ error: 'PAYMENT_PROVIDER_ERROR', message: 'We could not start checkout. Please try again.' }, { status: 502 });
  }
}
