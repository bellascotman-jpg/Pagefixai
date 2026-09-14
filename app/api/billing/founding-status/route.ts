import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { FOUNDING_LIFETIME_MAX_SLOTS } from '@/lib/plans';

export async function GET() {
  const raw = process.env.FOUNDING_LIFETIME_LAUNCH_AT;
  const launchAt = raw ? new Date(raw) : null;
  const timeOpen = !launchAt || (!Number.isNaN(launchAt.getTime()) && Date.now() <= launchAt.getTime() + 60 * 86400000);
  const purchased = await db.subscription.count({ where: { planId: 'founding_lifetime', status: 'LIFETIME' } });
  const open = timeOpen && purchased < FOUNDING_LIFETIME_MAX_SLOTS;
  return NextResponse.json({ open, purchased, maxSlots: FOUNDING_LIFETIME_MAX_SLOTS, remaining: Math.max(0, FOUNDING_LIFETIME_MAX_SLOTS - purchased), expiresAt: launchAt ? new Date(launchAt.getTime() + 60 * 86400000).toISOString() : null });
}
