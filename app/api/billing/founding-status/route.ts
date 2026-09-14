import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { FOUNDING_LIFETIME_MAX_SLOTS } from '@/lib/plans';

export async function GET() {
  const raw = process.env.FOUNDING_LIFETIME_LAUNCH_AT;
  const launchAt = raw ? new Date(raw) : null;
  const configured = Boolean(launchAt && !Number.isNaN(launchAt.getTime()));
  const expiresAt = configured && launchAt ? new Date(launchAt.getTime() + 60 * 86400000) : null;
  const timeOpen = Boolean(expiresAt && Date.now() <= expiresAt.getTime());
  const purchased = await db.subscription.count({ where: { planId: 'founding_lifetime', status: 'LIFETIME' } });
  const open = configured && timeOpen && purchased < FOUNDING_LIFETIME_MAX_SLOTS;

  return NextResponse.json({
    open,
    configured,
    purchased,
    maxSlots: FOUNDING_LIFETIME_MAX_SLOTS,
    remaining: Math.max(0, FOUNDING_LIFETIME_MAX_SLOTS - purchased),
    expiresAt: expiresAt?.toISOString() ?? null,
  });
}
