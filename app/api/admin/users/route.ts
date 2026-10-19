import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { FOUNDER_EMAIL, getPlan } from '@/lib/plans';
import type { PlanId } from '@prisma/client';

async function authorizedAdmin() {
  const user = await getCurrentUser();
  return user && (user.role === 'ADMIN' || (user.role === 'FOUNDER' && user.email.toLowerCase() === FOUNDER_EMAIL)) ? user : null;
}

export async function GET() {
  const actor = await authorizedAdmin();
  if (!actor) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  try {
    const now = new Date();
    const users = await db.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: {
        id: true, name: true, email: true, role: true, createdAt: true,
        subscriptions: {
          where: { status: { in: ['ACTIVE', 'LIFETIME'] }, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
          orderBy: { startedAt: 'desc' }, take: 1,
          select: { id: true, planId: true, status: true, expiresAt: true, startedAt: true },
        },
        payments: { where: { status: 'successful' }, select: { id: true }, take: 1 },
        sessions: { where: { expiresAt: { gt: now } }, orderBy: { createdAt: 'desc' }, take: 1, select: { createdAt: true, expiresAt: true } },
        affiliateProfile: { select: { code: true, status: true, commissionRate: true } },
        _count: { select: { audits: true, payments: true } },
      },
    });
    const enriched = users.map((user) => {
      const hasActivePlan = user.subscriptions.length > 0;
      const hasSuccessfulPayment = user.payments.length > 0;
      const isFounder = user.role === 'FOUNDER' && user.email.toLowerCase() === FOUNDER_EMAIL;
      const accountType = isFounder ? 'FOUNDER' : hasActivePlan && hasSuccessfulPayment ? 'PAID' : hasActivePlan ? 'COMPLIMENTARY' : 'FREE';
      const { payments, sessions, ...publicUser } = user;
      return {
        ...publicUser,
        accountType,
        hasActiveSession: sessions.length > 0,
        lastSessionAt: sessions[0]?.createdAt ?? null,
        successfulPayment: hasSuccessfulPayment,
      };
    });
    return NextResponse.json({ users: enriched, limit: 200, generatedAt: now.toISOString() });
  } catch (error) {
    console.error('founder_users_list_error', error instanceof Error ? error.name : 'UnknownError');
    return NextResponse.json({ error: 'USER_LIST_UNAVAILABLE' }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  const actor = await authorizedAdmin();
  if (!actor) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  const body = await request.json().catch(() => null);
  if (!body || typeof body.userId !== 'string' || !['grant_plan', 'revoke_plan'].includes(body.action)) {
    return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 });
  }
  if (body.userId === actor.id && body.action === 'revoke_plan') {
    return NextResponse.json({ error: 'CANNOT_REVOKE_SELF', message: 'Founder access cannot be revoked from the founder console.' }, { status: 400 });
  }
  try {
    const target = await db.user.findUnique({ where: { id: body.userId }, select: { id: true, email: true, role: true } });
    if (!target) return NextResponse.json({ error: 'USER_NOT_FOUND' }, { status: 404 });
    if (target.email.toLowerCase() === FOUNDER_EMAIL && body.action === 'revoke_plan') {
      return NextResponse.json({ error: 'FOUNDER_PROTECTED', message: 'The founder account is protected from access revocation.' }, { status: 400 });
    }

    if (body.action === 'grant_plan') {
      if (typeof body.planId !== 'string' || !getPlan(body.planId)) return NextResponse.json({ error: 'INVALID_PLAN' }, { status: 400 });
      const planId = body.planId as PlanId;
      const plan = getPlan(planId)!;
      await db.plan.upsert({
        where: { id: planId },
        create: { id: planId, name: plan.name, monthlyUnits: plan.units, lifetime: planId === 'founding_lifetime' },
        update: { name: plan.name, monthlyUnits: plan.units, lifetime: planId === 'founding_lifetime' },
      });
      await db.$transaction(async (tx) => {
        await tx.subscription.updateMany({ where: { userId: target.id, status: { in: ['ACTIVE', 'LIFETIME', 'PAST_DUE'] } }, data: { status: 'CANCELLED', cancelledAt: new Date() } });
        await tx.subscription.create({
          data: { userId: target.id, planId, status: planId === 'founding_lifetime' ? 'LIFETIME' : 'ACTIVE', provider: 'founder-admin-grant' },
        });
        const now = new Date();
        const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
        const periodEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
        await tx.usageBalance.updateMany({
          where: { userId: target.id, periodStart },
          data: { includedUnits: plan.units, periodEnd },
        });
        await tx.adminEvent.create({
          data: { actorId: actor.id, action: 'USER_PLAN_GRANTED', targetType: 'User', targetId: target.id, metadata: { planId } },
        });
      });
      return NextResponse.json({ ok: true, action: body.action, userId: target.id, planId });
    }

    await db.$transaction(async (tx) => {
      await tx.subscription.updateMany({ where: { userId: target.id, status: { in: ['ACTIVE', 'LIFETIME', 'PAST_DUE'] } }, data: { status: 'CANCELLED', cancelledAt: new Date() } });
      await tx.adminEvent.create({
        data: { actorId: actor.id, action: 'USER_PLAN_REVOKED', targetType: 'User', targetId: target.id, metadata: { reason: 'founder-console' } },
      });
    });
    return NextResponse.json({ ok: true, action: body.action, userId: target.id });
  } catch (error) {
    console.error('founder_user_action_error', error instanceof Error ? error.name : 'UnknownError');
    return NextResponse.json({ error: 'USER_ACTION_FAILED' }, { status: 503 });
  }
}
