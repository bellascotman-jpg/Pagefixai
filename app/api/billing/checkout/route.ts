import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth/session';
import { createCheckout } from '@/lib/billing/flutterwave';
import { getPlan, FOUNDING_LIFETIME_MAX_SLOTS, type PlanId } from '@/lib/plans';
import { db } from '@/lib/db';

const schema = z.object({ planId: z.string() });

function foundingOpen() {
  const raw = process.env.FOUNDING_LIFETIME_LAUNCH_AT;
  if (!raw) return false;
  const launch = new Date(raw);
  if (Number.isNaN(launch.getTime())) return false;
  return Date.now() <= launch.getTime() + 60 * 86400000;
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'UNAUTHENTICATED', message: 'Sign in before checkout.' }, { status: 401 });

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success || !getPlan(parsed.data.planId)) return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'Invalid plan.' }, { status: 400 });

  const planId = parsed.data.planId as PlanId;
  if (planId === 'founding_lifetime') {
    if (!foundingOpen()) return NextResponse.json({ error: 'FOUNDING_LIFETIME_CLOSED', message: 'The Founding Lifetime offer is not currently available.' }, { status: 409 });
    const purchased = await db.subscription.count({ where: { planId: 'founding_lifetime', status: 'LIFETIME' } });
    if (purchased >= FOUNDING_LIFETIME_MAX_SLOTS) return NextResponse.json({ error: 'FOUNDING_LIFETIME_SOLD_OUT', message: 'The 50 founding lifetime slots have been sold.' }, { status: 409 });
  }

  try {
    const checkout = await createCheckout({ userId: user.id, email: user.email, name: user.name, planId });
    return NextResponse.json(checkout);
  } catch (error) {
    console.error('checkout_error', error);
    return NextResponse.json({ error: 'PAYMENT_PROVIDER_ERROR', message: 'We could not start checkout. Please try again.' }, { status: 502 });
  }
}
