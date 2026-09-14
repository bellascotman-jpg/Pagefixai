import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db';

export default async function FounderPage() {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'FOUNDER' && user.role !== 'ADMIN')) redirect('/dashboard');
  const [users, audits, subscriptions, payments, usage] = await Promise.all([
    db.user.count(), db.audit.count(), db.subscription.count({ where: { status: { in: ['ACTIVE', 'LIFETIME'] } } }), db.payment.aggregate({ _sum: { amount: true }, where: { status: 'successful' } }), db.usageEvent.aggregate({ _sum: { units: true, estimatedCost: true } }),
  ]);
  const founding = await db.subscription.count({ where: { planId: 'founding_lifetime', status: 'LIFETIME' } });
  return <main className="dashboard"><header className="topbar"><div className="brand">PageFix <span>AI</span> Founder</div></header><div className="container dashboard-main"><h1>Founder operations</h1><p className="muted">Live operational values only. No fabricated customers, revenue, audits or usage.</p><div className="grid grid-3" style={{ marginTop: 28 }}>{[['Users', users], ['Audits', audits], ['Active subscriptions', subscriptions], ['Revenue recorded', payments._sum.amount ? String(payments._sum.amount) : '0'], ['Units consumed', usage._sum.units ? String(usage._sum.units) : '0'], ['AI cost recorded', usage._sum.estimatedCost ? String(usage._sum.estimatedCost) : '0']].map(([label,value]) => <div className="card" key={String(label)}><div className="label">{label}</div><div className="stat">{value}</div></div>)}</div><div className="card" style={{ marginTop: 22 }}><div className="label">Founding Lifetime</div><h2>{founding} / 50 purchased</h2><p className="muted">Availability is derived from successful lifetime subscriptions and the configured launch window.</p></div></div></main>;
}
