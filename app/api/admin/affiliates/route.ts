import { randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db';

async function requireAdmin() {
  const user = await getCurrentUser();
  return user && (user.role === 'ADMIN' || user.role === 'FOUNDER') ? user : null;
}

export async function GET() {
  const actor = await requireAdmin();
  if (!actor) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  try {
    const [applications, commissions] = await Promise.all([
      db.feedback.findMany({ where: { type: 'PAGEFIX_AFFILIATE_APPLICATION' }, orderBy: { createdAt: 'desc' }, take: 200 }),
      db.affiliateCommission.findMany({ where: { status: 'PENDING' }, include: { affiliate: { include: { user: { select: { name: true, email: true } } } }, referral: { include: { referredUser: { select: { email: true } } } }, payment: { select: { amount: true, currency: true, createdAt: true } } }, orderBy: { createdAt: 'asc' }, take: 500 }),
    ]);
    return NextResponse.json({ applications, commissions });
  } catch (error) {
    console.error('affiliate_admin_list_error', error);
    return NextResponse.json({ error: 'AFFILIATE_ADMIN_UNAVAILABLE' }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  const actor = await requireAdmin();
  if (!actor) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  const body = await request.json().catch(() => null);
  if (!body || typeof body.action !== 'string' || typeof body.id !== 'string') return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 });
  try {
    if (body.action === 'commission' && ['PAID', 'VOID', 'APPROVED'].includes(body.status)) {
      const commission = await db.affiliateCommission.update({ where: { id: body.id }, data: { status: body.status, paidAt: body.status === 'PAID' ? new Date() : null } });
      await db.adminEvent.create({ data: { actorId: actor.id, action: `AFFILIATE_COMMISSION_${body.status}`, targetType: 'AffiliateCommission', targetId: commission.id, metadata: { amount: Number(commission.amount), currency: commission.currency } } });
      return NextResponse.json({ ok: true });
    }
    if (body.action === 'application' && ['APPROVED', 'REJECTED'].includes(body.status)) {
      const application = await db.feedback.findUnique({ where: { id: body.id } });
      if (!application || application.type !== 'PAGEFIX_AFFILIATE_APPLICATION') return NextResponse.json({ error: 'APPLICATION_NOT_FOUND' }, { status: 404 });
      const metadata = typeof application.metadata === 'object' && application.metadata !== null ? application.metadata as Record<string, unknown> : {};
      const email = typeof metadata.email === 'string' ? metadata.email.toLowerCase() : '';
      await db.feedback.update({ where: { id: application.id }, data: { metadata: { ...metadata, status: body.status, reviewedAt: new Date().toISOString(), reviewedBy: actor.id } } });
      if (body.status === 'APPROVED' && email) {
        const user = await db.user.findUnique({ where: { email }, select: { id: true } });
        if (user) {
          const existing = await db.affiliateProfile.findUnique({ where: { userId: user.id } });
          if (existing) await db.affiliateProfile.update({ where: { userId: user.id }, data: { status: 'APPROVED' } });
          else {
            let created = false;
            for (let attempt = 0; attempt < 3 && !created; attempt++) {
              try { await db.affiliateProfile.create({ data: { userId: user.id, code: randomBytes(5).toString('hex').toUpperCase(), commissionRate: 25, status: 'APPROVED' } }); created = true; }
              catch (error) { if (attempt === 2) throw error; }
            }
          }
        }
      }
      await db.adminEvent.create({ data: { actorId: actor.id, action: `AFFILIATE_APPLICATION_${body.status}`, targetType: 'Feedback', targetId: application.id, metadata: { email } } });
      return NextResponse.json({ ok: true, note: body.status === 'APPROVED' && !email ? 'Application approved; applicant email was unavailable.' : 'Application reviewed.' });
    }
    return NextResponse.json({ error: 'INVALID_ACTION' }, { status: 400 });
  } catch (error) {
    console.error('affiliate_admin_update_error', error);
    return NextResponse.json({ error: 'AFFILIATE_ADMIN_UPDATE_FAILED' }, { status: 503 });
  }
}
