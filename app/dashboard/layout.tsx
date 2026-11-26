import './overview.css';
import './workspace-redesign.css';
import DashboardSidebar from '@/components/dashboard-sidebar';
import SessionKeepAlive from '@/components/session-keepalive';
import { getCurrentUser } from '@/lib/auth/session';
import { FOUNDER_EMAIL, getPlan } from '@/lib/plans';
import { getEffectivePlan } from '@/lib/billing/entitlements';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  const isFounder = Boolean(user && (user.role === 'ADMIN' || (user.role === 'FOUNDER' && user.email.toLowerCase() === FOUNDER_EMAIL)));
  const [plan, balance] = user ? await Promise.all([
    getEffectivePlan(user.id),
    db.usageBalance.findFirst({ where: { userId: user.id }, orderBy: { periodStart: 'desc' } }),
  ]) : [null, null];
  const planDefinition = plan ? getPlan(plan) : null;
  const includedUnits = isFounder ? null : balance ? Number(balance.includedUnits) : planDefinition?.units ?? null;
  const usedUnits = balance ? Number(balance.consumedUnits) : 0;
  return <div className="app-frame"><SessionKeepAlive /><DashboardSidebar isFounder={isFounder} usedUnits={usedUnits} includedUnits={includedUnits} isFounderAccess={isFounder} /><div className="app-main">{children}</div></div>;
}
