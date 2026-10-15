import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { FOUNDING_LIFETIME_MAX_SLOTS } from '@/lib/plans';

export async function GET() {
  const purchased = await db.subscription.count({
    where: { planId: 'founding_lifetime', status: 'LIFETIME' },
  });

  return NextResponse.json({
    open: false,
    configured: false,
    purchased,
    maxSlots: FOUNDING_LIFETIME_MAX_SLOTS,
    remaining: Math.max(0, FOUNDING_LIFETIME_MAX_SLOTS - purchased),
    expiresAt: null,
    message: 'New lifetime purchases are closed. Existing customer records and entitlements are retained.',
  });
}
