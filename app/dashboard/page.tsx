export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { getEffectivePlan } from '@/lib/billing/entitlements';
import AuditLauncher from '@/components/audit-launcher';
import { getPlan, FOUNDER_EMAIL } from '@/lib/plans';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth');
  const plan = await getEffectivePlan(user.id);
  const audits = await db.audit.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, take: 8, select: { id: true, url: true, status: true, findings: { select: { id: true } }, createdAt: true } });
  const balance = await db.usageBalance.findFirst({ where: { userId: user.id }, orderBy: { periodStart: 'desc' } });
  const planDefinition = plan ? getPlan(plan) : null;
  const isFounder = user.role === 'FOUNDER' && user.email.toLowerCase() === FOUNDER_EMAIL;
  const remaining = isFounder ? 'Unlimited' : balance ? Math.max(0, Number(balance.includedUnits) - Number(balance.consumedUnits)) : planDefinition ? planDefinition.units : null;
  const trial = plan && plan !== 'founding_lifetime' ? await db.subscription.findFirst({ where: { userId: user.id, provider: 'pagefix-trial', status: 'ACTIVE', expiresAt: { gt: new Date() } }, orderBy: { startedAt: 'desc' } }) : null;

  return <main className="dashboard">
    <header className="topbar">
      <div><div className="label">PAGEFIX AI / WORKSPACE</div><h1 style={{fontSize:25,margin:'4px 0 0'}}>Overview</h1></div>
      <div className="dashboard-top-actions" style={{display:'flex',gap:14,alignItems:'center',flexWrap:'wrap'}}>
        <Link href="/dashboard/referrals" className="dashboard-referral-link">Referral earnings ↗</Link>
        <Link href="/pricing" className="dashboard-referral-link">Plans & billing</Link>
        <span className="topbar-user">{user.email}</span>
        <form action="/api/auth/logout" method="post"><button className="text-button">Log out</button></form>
      </div>
    </header>
    <div className="container dashboard-main">
      <section className="card audit-launcher-card">
        <div className="label">START HERE</div>
        <h2>Analyze a product page</h2>
        <p className="muted">Paste a product, landing page, or website URL.</p>
        <AuditLauncher />
      </section>
      <section className="dashboard-referral-banner" style={{marginTop:18}}>
        <div><strong>Refer customers. Earn commission.</strong><p>Get your referral link and track clicks, signups and eligible commissions.</p></div>
        <div style={{display:'flex',gap:10,flexWrap:'wrap'}}><Link href="/dashboard/referrals" className="primary-button">Referral dashboard →</Link><Link href="/dashboard/affiliate" className="button button-secondary">Affiliate program</Link></div>
      </section>
      {trial && <div className="trial-banner"><span>7-DAY TRIAL</span><p>Trial ends {trial.expiresAt?.toLocaleDateString()}.</p><Link href="/pricing">View plans →</Link></div>}
      {!plan && <div className="card" style={{marginTop:22}}><h2>Choose a plan</h2><p className="muted">An active plan is required for paid audit usage.</p><Link className="primary-button" href="/pricing">View plans</Link></div>}
      {plan && <section className="grid grid-3" style={{marginTop:22}}>
        <div className="card"><div className="label">PLAN</div><div className="stat">{isFounder ? 'Founder · Full Access' : plan === 'founding_lifetime' ? 'Founding Lifetime' : plan.replace(/_/g,' ')}</div></div>
        <div className="card"><div className="label">{isFounder ? 'AUDIT ALLOWANCE' : 'UNITS REMAINING'}</div><div className="stat">{remaining === null ? '—' : typeof remaining === 'string' ? remaining : remaining.toFixed(2)}</div></div>
        <div className="card"><div className="label">RECENT AUDITS</div><div className="stat">{audits.length}</div></div>
      </section>}
      <section style={{marginTop:24}}>
        <div className="topbar" style={{padding:'0 0 12px',minHeight:0}}><div><div className="label">PAGEFIX TOOLKIT</div><h2 style={{fontSize:21,margin:'4px 0'}}>Analyze, improve, verify</h2></div><Link href="/dashboard/intelligence" className="text-link">All analysis tools →</Link></div>
        <div className="grid grid-3">
          <Link className="finding" href="/dashboard/intelligence/buyer-decisions"><strong>Buyer decisions →</strong><p className="muted">Purchase objections and missing answers.</p></Link>
          <Link className="finding" href="/dashboard/intelligence/clarity-scorecard"><strong>Clarity scorecard →</strong><p className="muted">Understand first-impression friction.</p></Link>
          <Link className="finding" href="/dashboard/intelligence/return-risk"><strong>Pre-purchase & return risk →</strong><p className="muted">Sizing, product details and policy gaps.</p></Link>
          <Link className="finding" href="/dashboard/intelligence/visual-inspection"><strong>Visual & mobile inspection →</strong><p className="muted">Review screenshots and mobile usability.</p></Link>
          <Link className="finding" href="/dashboard/intelligence/copy-fixes"><strong>Grounded copy fixes →</strong><p className="muted">Evidence-based product and landing copy.</p></Link>
          <Link className="finding" href="/dashboard/intelligence/journey"><strong>Journey & message match →</strong><p className="muted">Compare ad promises with landing pages.</p></Link>
          <Link className="finding" href="/dashboard/intelligence/impact"><strong>Impact analysis →</strong><p className="muted">Prioritize changes and measure outcomes.</p></Link>
          <Link className="finding" href="/dashboard/creative-studio"><strong>Ads & Creative Studio →</strong><p className="muted">Draft ad creative for review.</p></Link>
          <Link className="finding" href="/dashboard/experiments"><strong>A/B testing →</strong><p className="muted">Test approved website copy variants.</p></Link>
          <Link className="finding" href="/dashboard/intelligence/integrations"><strong>Store & marketing integrations →</strong><p className="muted">Manage connected data sources.</p></Link>
          <Link className="finding" href="/dashboard/fixes"><strong>Fix Center →</strong><p className="muted">Review and verify proposed fixes.</p></Link>
          <Link className="finding" href="/dashboard/audits"><strong>Audit history →</strong><p className="muted">Return to saved inspections.</p></Link>
        </div>
      </section>
      {audits.length > 0 && <section className="card" style={{marginTop:24}}><h2>Recent audits</h2>{audits.map(a => <Link className="finding" style={{display:'block'}} href={`/dashboard/audits/${a.id}`} key={a.id}><strong>{a.url}</strong><div style={{display:'flex',gap:8,marginTop:8}}><span className="badge">{a.status}</span><span className="muted">{a.findings.length} findings</span></div></Link>)}</section>}
    </div>
  </main>;
}
