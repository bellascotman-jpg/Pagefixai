import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { FOUNDER_EMAIL } from '@/lib/plans';

export const dynamic = 'force-dynamic';

export default async function FounderPage() {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'ADMIN' && !(user.role === 'FOUNDER' && user.email.toLowerCase() === FOUNDER_EMAIL))) redirect('/dashboard');

  const now = new Date();
  const customerScope = { role: { notIn: ['FOUNDER', 'ADMIN'] as const } };
  const activeSubscription = {
    status: { in: ['ACTIVE', 'LIFETIME'] as const },
    OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
  };
  const [
    totalUsers, activeSessionUsers, paidCustomers, freeAccounts, complimentaryAccounts,
    totalAudits, auditStatuses, totalFindings, payments, usage, activeSubscriptions, lifetimePurchases,
  ] = await Promise.all([
    db.user.count(),
    db.session.findMany({ where: { expiresAt: { gt: now } }, distinct: ['userId'], select: { userId: true } }),
    db.user.count({ where: { ...customerScope, payments: { some: { status: 'successful' } }, subscriptions: { some: activeSubscription } } }),
    db.user.count({ where: { ...customerScope, payments: { none: { status: 'successful' } }, subscriptions: { none: activeSubscription } } }),
    db.user.count({ where: { ...customerScope, payments: { none: { status: 'successful' } }, subscriptions: { some: activeSubscription } } }),
    db.audit.count(),
    db.audit.groupBy({ by: ['status'], _count: { _all: true } }),
    db.finding.count(),
    db.payment.groupBy({ by: ['currency'], where: { status: 'successful' }, _sum: { amount: true }, _count: { _all: true } }),
    db.usageEvent.aggregate({ _sum: { units: true, estimatedCost: true }, _count: { _all: true } }),
    db.subscription.count({ where: activeSubscription }),
    db.payment.count({ where: { status: 'successful', planId: 'founding_lifetime' } }),
  ]);

  const auditCount = (status: string) => auditStatuses.find(item => item.status === status)?._count._all ?? 0;
  const revenueLabel = payments.length
    ? payments.map(payment => `${payment.currency} ${Number(payment._sum.amount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`).join(' · ')
    : '0 recorded';
  const metrics: [string, string | number][] = [
    ['Total accounts', totalUsers],
    ['Accounts with unexpired sessions', activeSessionUsers.length],
    ['Paid customers', paidCustomers],
    ['Free accounts', freeAccounts],
    ['Complimentary / admin-granted access', complimentaryAccounts],
    ['Active subscriptions', activeSubscriptions],
    ['Total audits', totalAudits],
    ['Total findings', totalFindings],
    ['Audit jobs completed', auditCount('COMPLETED')],
    ['Audit jobs queued', auditCount('QUEUED')],
    ['Audit jobs running', auditCount('RUNNING')],
    ['Audit jobs failed', auditCount('FAILED')],
    ['Usage units recorded', String(usage._sum.units ?? 0)],
    ['Usage events recorded', usage._count._all],
    ['Estimated AI cost recorded', String(usage._sum.estimatedCost ?? 0)],
  ];

  return <main className="dashboard">
    <header className="topbar"><div className="brand">PageFix <span>AI</span> Founder</div></header>
    <div className="container dashboard-main">
      <h1>Founder operations</h1>
      <p className="muted">Live database metrics only. “Accounts with unexpired sessions” means a stored session has not expired; it does not claim a user is currently online. Revenue is grouped by currency and includes only payment records marked successful.</p>
      <div style={{marginTop:18,display:'flex',gap:10,flexWrap:'wrap'}}>
        <Link href="/founder/users" className="button button-primary">Manage users & access →</Link>
        <Link href="/founder/audits" className="button button-secondary">Inspect all audits →</Link>
        <Link href="/founder/affiliates" className="button button-secondary">Affiliate operations →</Link>
      </div>
      <div className="grid grid-3" style={{ marginTop: 28 }}>
        {metrics.map(([label, value]) => <div className="card" key={label}><div className="label">{label}</div><div className="stat">{value}</div></div>)}
      </div>
      <div className="card" style={{ marginTop: 22 }}>
        <div className="label">Verified payment records</div>
        <h2>{revenueLabel}</h2>
        {payments.length > 0 && <p className="muted">{payments.reduce((total, payment) => total + payment._count._all, 0)} successful payment records across the currencies shown above. Currency totals are kept separate and are not converted.</p>}
      </div>
      <div className="card" style={{ marginTop: 22 }}>
        <div className="label">Founder account</div>
        <h2>Unlimited founder access</h2>
        <p className="muted">The configured founder account bypasses customer plan caps and receives all current feature entitlements without payment. Customer subscriptions and allowances remain separate.</p>
      </div>
      <div className="card" style={{ marginTop: 22 }}>
        <div className="label">Founding Lifetime offer</div>
        <h2>{lifetimePurchases} / 50 successful purchases</h2>
        <p className="muted">Counts successful payment records for the founding lifetime plan, not the internal founder bootstrap subscription.</p>
      </div>
    </div>
  </main>;
}
