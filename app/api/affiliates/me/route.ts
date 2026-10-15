import { randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db';

function makeCode() { return randomBytes(5).toString('hex').toUpperCase(); }

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  try {
    let profile = await db.affiliateProfile.findUnique({
      where: { userId: user.id },
      include: { referrals: { select: { id: true, convertedAt: true } }, commissions: { orderBy: { createdAt: 'desc' }, take: 100 } },
    });
    if (!profile) {
      for (let attempt = 0; attempt < 3 && !profile; attempt++) {
        try { profile = await db.affiliateProfile.create({ data: { userId: user.id, code: makeCode(), commissionRate: 25, status: 'APPROVED' }, include: { referrals: { select: { id: true, convertedAt: true } }, commissions: { orderBy: { createdAt: 'desc' }, take: 100 } } }); }
        catch (error) { if (attempt === 2) throw error; }
      }
    }
    const total = profile!.commissions.reduce((sum, item) => sum + Number(item.amount), 0);
    const pending = profile!.commissions.filter(item => item.status === 'PENDING' || item.status === 'APPROVED').reduce((sum, item) => sum + Number(item.amount), 0);
    return NextResponse.json({ profile: { code: profile!.code, status: profile!.status, commissionRate: profile!.commissionRate, clicks: profile!.clicks, referralCount: profile!.referrals.length, totalCommission: total, pendingPayout: pending, payoutThreshold: 50, payoutMethod: profile!.payoutMethod, payoutEmail: profile!.payoutEmail, referralUrl: `${process.env.APP_URL || 'https://pagefixai.vercel.app'}/api/referrals/track?code=${profile!.code}`, commissions: profile!.commissions.map(c => ({ amount: Number(c.amount), currency: c.currency, status: c.status, createdAt: c.createdAt })) } });
  } catch (error) {
    console.error('affiliate_profile_error', error);
    return NextResponse.json({ error: 'AFFILIATE_UNAVAILABLE', message: 'Referral accounts are not available until the affiliate database migration is deployed.' }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  const body = await request.json().catch(() => null);
  const payoutMethod = typeof body?.payoutMethod === 'string' ? body.payoutMethod.trim().slice(0, 40) : '';
  const payoutEmail = typeof body?.payoutEmail === 'string' ? body.payoutEmail.trim().slice(0, 320) : '';
  if (payoutEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payoutEmail)) return NextResponse.json({ error: 'INVALID_PAYOUT_EMAIL' }, { status: 400 });
  try {
    const profile = await db.affiliateProfile.update({ where: { userId: user.id }, data: { payoutMethod: payoutMethod || null, payoutEmail: payoutEmail || null } });
    return NextResponse.json({ ok: true, payoutMethod: profile.payoutMethod, payoutEmail: profile.payoutEmail });
  } catch {
    return NextResponse.json({ error: 'PROFILE_NOT_FOUND', message: 'Open the referral dashboard first to create your profile.' }, { status: 404 });
  }
}
