export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { getEffectivePlan } from '@/lib/billing/entitlements';
import { getPlan, FOUNDER_EMAIL } from '@/lib/plans';
import DashboardOverview from '@/components/dashboard-overview';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth');
  const plan = await getEffectivePlan(user.id);
  const isFounder = user.role === 'FOUNDER' && user.email.toLowerCase() === FOUNDER_EMAIL;
  const [audits, balance, criticalObjections, verifiedOptimizations] = await Promise.all([
    db.audit.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, take: 8, select: { id: true, url: true, status: true, findings: { select: { id: true } }, createdAt: true } }),
    db.usageBalance.findFirst({ where: { userId: user.id }, orderBy: { periodStart: 'desc' } }),
    db.finding.count({ where: { severity: 'HIGH', status: 'OPEN', audit: { userId: user.id } } }),
    db.fix.count({ where: { status: 'VERIFIED', audit: { userId: user.id } } }),
  ]);
  const planDefinition = plan ? getPlan(plan) : null;
  const includedUnits = isFounder ? null : balance ? Number(balance.includedUnits) : planDefinition?.units ?? null;
  const usedUnits = balance ? Number(balance.consumedUnits) : 0;

  return <DashboardOverview
    userName={user.name}
    email={user.email}
    planName={planDefinition?.name ?? 'No active plan'}
    isPaid={Boolean(plan)}
    isFounder={isFounder}
    usedUnits={usedUnits}
    includedUnits={includedUnits}
    criticalObjections={criticalObjections}
    verifiedOptimizations={verifiedOptimizations}
    recentAuditCount={audits.length}
  />;
}
