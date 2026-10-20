import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db';

export default async function ClaimsIntelligencePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth?mode=login');

  const audit = await db.audit.findFirst({
    where: { userId: user.id, status: 'COMPLETED' },
    orderBy: { completedAt: 'desc' },
    include: {
      findings: {
        where: { OR: [
          { title: { contains: 'claim', mode: 'insensitive' } },
          { title: { contains: 'contradiction', mode: 'insensitive' } },
          { title: { contains: 'promise', mode: 'insensitive' } },
          { title: { contains: 'warranty', mode: 'insensitive' } },
          { title: { contains: 'shipping', mode: 'insensitive' } },
          { title: { contains: 'return', mode: 'insensitive' } },
          { title: { contains: 'refund', mode: 'insensitive' } },
          { title: { contains: 'discount', mode: 'insensitive' } },
          { title: { contains: 'offer', mode: 'insensitive' } },
        ] },
        orderBy: [{ priority: 'asc' }, { severity: 'asc' }],
        include: { evidence: { include: { evidence: true } } },
      },
    },
  });

  return <main className="dashboard">
    <header className="topbar"><div><div className="label">COMMERCE INTELLIGENCE / CLAIMS</div><h1 style={{fontSize:27,margin:'4px 0 0'}}>Claims & promise consistency</h1></div><div style={{display:'flex',gap:10,flexWrap:'wrap'}}><Link className="button button-secondary" href="/dashboard/intelligence">Intelligence hub</Link><Link className="primary-button" href="/dashboard/ai-help">Ask PageFix AI →</Link></div></header>
    <div className="container dashboard-main">
      <p className="muted" style={{maxWidth:850,lineHeight:1.8}}>Review claim-related findings from your latest completed inspection. PageFix shows captured observations and possible risks separately; a wording difference is not automatically a proven contradiction, and this view never invents what a business promises.</p>
      {!audit ? <section className="card empty-state"><h2>No completed inspection yet</h2><p className="muted">Inspect a public page first. Claim-related signals will appear here only when they are supported by saved audit findings.</p><Link className="primary-button" href="/dashboard">Start an inspection →</Link></section> :
      <section className="card">
        <div className="label">LATEST INSPECTION</div><h2 style={{overflowWrap:'anywhere'}}>{audit.url}</h2><p className="muted">Completed {audit.completedAt?.toLocaleString() ?? 'date not recorded'} · {audit.findings.length} claim-related findings</p>
        {!audit.findings.length ? <div className="empty-state"><h3>No claim-related findings in this inspection</h3><p className="muted">This does not prove every claim is complete or consistent. It means the current rules did not identify a matching finding.</p><Link className="button button-secondary" href={`/dashboard/audits/${audit.id}`}>Review full audit →</Link></div> :
        audit.findings.map(finding=><article className="finding" key={finding.id}>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}><span className="badge">{finding.priority.replaceAll('_',' ')}</span><span className={`badge ${finding.severity==='HIGH'?'danger':''}`}>{finding.severity}</span><span className="badge">{finding.hypothesis || 'Classification not recorded'}</span></div>
          <h3>{finding.title}</h3><p><strong>Observed:</strong> {finding.observation}</p><p><strong>Why it matters:</strong> {finding.whyItMatters}</p><p><strong>Recommended next step:</strong> {finding.recommendation}</p>
          <details><summary>Evidence and source references ({finding.evidence.length})</summary>{finding.evidence.map(ref=><div key={ref.evidenceId} style={{marginTop:8}}><span className="badge">{ref.evidence.type}</span><p className="muted">{ref.evidence.location || ref.evidence.source}</p><p style={{overflowWrap:'anywhere'}}>{ref.evidence.content.slice(0,1200)}</p></div>)}</details>
        </article>)}
        <div style={{marginTop:14}}><Link className="button button-secondary" href={`/dashboard/audits/${audit.id}`}>Open full evidence report →</Link></div>
      </section>}
      <section className="grid grid-2" style={{marginTop:18}}><div className="card"><h2>What this module does</h2><p className="muted">Filters saved, evidence-linked findings for product claims, shipping/return terms, discounts, warranties and promise consistency.</p></div><div className="card"><h2>Limits</h2><p className="muted">The latest public-page capture cannot establish what is true across all pages or campaigns. Use the Promise Ledger to record source-linked claims across sources.</p><Link className="primary-button" href="/dashboard/intelligence/promise-ledger">Open Promise Ledger →</Link></div></section>
    </div>
  </main>;
}
