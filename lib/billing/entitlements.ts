import { db } from '@/lib/db';
import { FOUNDER_EMAIL, getPlan, type PlanId } from '@/lib/plans';

export const UNITS = { audit: 1, recheck: 1, competitor: 0.5, messageMatch: 0.25, copy: 0.1 } as const;

export async function getEffectivePlan(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId }, select: { email: true, role: true } });
  if (!user) return null;
  if (user.role === 'FOUNDER' || user.email.toLowerCase() === FOUNDER_EMAIL) return 'founding_lifetime' as const;
  const subscription = await db.subscription.findFirst({ where: { userId, status: { in: ['ACTIVE', 'LIFETIME'] }, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }, orderBy: { startedAt: 'desc' } });
  return subscription?.planId ?? null;
}

export async function hasFeature(userId: string, feature: string) {
  const plan = await getEffectivePlan(userId);
  if (!plan) return false;
  if (plan === 'founding_lifetime') return true;
  const entitlement = await db.entitlement.findUnique({ where: { userId_feature: { userId, feature } } });
  return Boolean(entitlement?.active && (!entitlement.expiresAt || entitlement.expiresAt > new Date()));
}

export async function canConsumeUnits(userId: string, units: number) {
  if (units <= 0) return true;
  const planId = await getEffectivePlan(userId);
  if (!planId) return false;
  if (planId === 'founding_lifetime') return true;
  const plan = getPlan(planId);
  if (!plan) return false;
  const now = new Date();
  const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const periodEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  const balance = await db.usageBalance.findUnique({ where: { userId_periodStart: { userId, periodStart } } });
  const consumed = Number(balance?.consumedUnits ?? 0);
  return consumed + units <= plan.units;
}

export async function consumeUnits(userId: string, units: number, operation: string, auditId?: string) {
  if (units <= 0) return;
  const planId = await getEffectivePlan(userId);
  if (!planId) throw new Error('ENTITLEMENT_REQUIRED');
  if (planId !== 'founding_lifetime') {
    const plan = getPlan(planId);
    if (!plan) throw new Error('ENTITLEMENT_REQUIRED');
    const now = new Date();
    const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const periodEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
    await db.$transaction(async (tx) => {
      const balance = await tx.usageBalance.upsert({ where: { userId_periodStart: { userId, periodStart } }, create: { userId, periodStart, periodEnd, includedUnits: plan.units, consumedUnits: 0 }, update: {} });
      const next = Number(balance.consumedUnits) + units;
      if (next > Number(balance.includedUnits)) throw new Error('USAGE_EXHAUSTED');
      await tx.usageBalance.update({ where: { id: balance.id }, data: { consumedUnits: { increment: units } } });
      await tx.usageEvent.create({ data: { userId, auditId, operation, units } });
    });
  } else {
    await db.usageEvent.create({ data: { userId, auditId, operation, units } });
  }
}
