import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { getEffectivePlan } from '@/lib/billing/entitlements';
import AuditLauncher from '@/components/audit-launcher';
import { getPlan } from '@/lib/plans';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth');
  const plan = await getEffectivePlan(user.id);
  const audits = await db.audit.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, take: 8, select: { id: true, url: true, status: true, findings: { select: { id: true } }, createdAt: true } });
  const balance = await db.usageBalance.findFirst({ where: { userId: user.id }, orderBy: { periodStart: 'desc' } });
  const planDefinition = plan ? getPlan(plan) : null;
  const remaining = balance ? Math.max(0, Number(balance.includedUnits) - Number(balance.consumedUnits)) : planDefinition ? planDefinition.units : null;
  const trial = plan && plan !== 'founding_lifetime' ? await db.subscription.findFirst({ where: { userId: user.id, provider: 'pagefix-trial', status: 'ACTIVE', expiresAt: { gt: new Date() } }, orderBy: { startedAt: 'desc' } }) : null;
  return <main className="dashboard"><header className="topbar"><div><div className="label">PAGEFIX AI / WORKSPACE</div><h1 style={{fontSize:25,margin:'4px 0 0'}}>Good to see you{user.name ? ', ' + user.name.split(' ')[0] : ''}.</h1></div><div style={{ display: 'flex', gap: 16, alignItems: 'center' }}><span className="topbar-user">{user.email}</span><form action="/api/auth/logout" method="post"><button className="text-button">Log out</button></form></div></header><div className="container dashboard-main"><p className="muted">Inspect the page. Understand the evidence. Prioritize a fix. Recheck the change.</p>{trial && <div className="trial-banner"><span>7-DAY TRIAL</span><p>Your trial is active until {trial.expiresAt?.toLocaleDateString()}. Your monthly allowance is limited to the selected Starter plan.</p><Link href="/pricing">Compare plans →</Link></div>}{!plan && <div className="card" style={{ margin: '28px 0', borderColor: '#b8ded7' }}><h2>Choose a plan to start auditing</h2><p className="muted">PageFix requires an active plan before paid audit usage is available.</p><Link className="primary-button" href="/pricing">View plans</Link></div>}{plan && <><div className="grid grid-3" style={{ marginTop: 28 }}><div className="card"><div className="label">Plan</div><div className="stat">{plan === 'founding_lifetime' ? 'Founding Lifetime' : plan.replace(/_/g, ' ')}</div></div><div className="card"><div className="label">Units remaining</div><div className="stat">{remaining === null ? '—' : remaining.toFixed(2)}</div></div><div className="card"><div className="label">Audits</div><div className="stat">{audits.length}</div></div></div><div className="card" style={{ marginTop: 22 }}><h2>New audit</h2><p className="muted">Use a public ecommerce page you control. PageFix will not place orders or submit payments.</p><AuditLauncher /></div></>}{audits.length > 0 && <div className="card" style={{ marginTop: 22 }}><h2>Recent audits</h2>{audits.map(a => <Link className="finding" style={{ display: 'block' }} href={`/dashboard/audits/${a.id}`} key={a.id}><strong>{a.url}</strong><div style={{ display: 'flex', gap: 8, marginTop: 8 }}><span className="badge">{a.status}</span><span className="muted">{a.findings.length} findings</span></div></Link>)}</div>}</div></main>;
}
