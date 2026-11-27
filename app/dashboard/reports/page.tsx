import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db';

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect('/auth?mode=login');
  const params = await searchParams;
  const query = (params.q ?? '').trim().slice(0, 120);
  const baseWhere = { userId: user.id, status: 'COMPLETED' as const };
  const where = query
    ? { ...baseWhere, OR: [{ url: { contains: query, mode: 'insensitive' as const } }, { category: { contains: query, mode: 'insensitive' as const } }] }
    : baseWhere;

  const [audits, totalReports, totalFindings, highSeverityFindings, mediumSeverityFindings, lowSeverityFindings] = await Promise.all([
    db.audit.findMany({
      where,
      orderBy: { completedAt: 'desc' },
      take: 100,
      include: { _count: { select: { findings: true, evidence: true } } },
    }),
    db.audit.count({ where: baseWhere }),
    db.finding.count({ where: { audit: { userId: user.id, status: 'COMPLETED' } } }),
    db.finding.count({ where: { severity: 'HIGH', audit: { userId: user.id, status: 'COMPLETED' } } }),
    db.finding.count({ where: { severity: 'MEDIUM', audit: { userId: user.id, status: 'COMPLETED' } } }),
    db.finding.count({ where: { severity: 'LOW', audit: { userId: user.id, status: 'COMPLETED' } } }),
  ]);
  const maxSeverity = Math.max(highSeverityFindings, mediumSeverityFindings, lowSeverityFindings, 1);
  const evidenceTotal = audits.reduce((sum, audit) => sum + audit._count.evidence, 0);

  return <main className="dashboard">
    <header className="topbar">
      <div><div className="label">WORKSPACE / REPORTING & EVIDENCE</div><h1 style={{fontSize:27,margin:'4px 0 0'}}>Audit reports</h1></div>
      <div style={{display:'flex',gap:9,flexWrap:'wrap'}}><Link className="button button-secondary" href="/dashboard/audits">Audit history</Link><Link className="primary-button" href="/dashboard">Run an inspection →</Link></div>
    </header>
    <div className="container dashboard-main pf-audit-report">
      <div className="pf-report-meta"><span>REPORT LIBRARY / ACCOUNT-OWNED INSPECTIONS</span><span>{totalReports} COMPLETED REPORTS</span></div>

      <section className="pf-report-block">
        <div className="pf-block-heading"><span>01</span><h2>The reporting problem</h2></div>
        <div className="pf-problem">
          <span>STORE-OWNER NEED / BUSINESS CONSEQUENCE</span>
          <h2>“I need every recommendation to lead back to the exact page capture, so my team can review the issue, make the change and verify it.”</h2>
          <p><strong>What it can cost:</strong> Reports without clear scope, source evidence and next actions can slow decisions and create rework. PageFix exports saved inspection records; they do not add private analytics or unmeasured business outcomes.</p>
        </div>
      </section>

      <section className="pf-report-block">
        <div className="pf-block-heading"><span>02</span><h2>Report library verdict</h2></div>
        <div className="pf-verdict-grid">
          <article className="pf-verdict-card"><span>COMPLETED REPORTS</span><strong>{totalReports}</strong><small>All completed account-owned inspections</small></article>
          <article className="pf-verdict-card"><span>RECORDED FINDINGS</span><strong>{totalFindings}</strong><small>Saved finding records across completed audits</small></article>
          <article className={`pf-risk-card ${highSeverityFindings ? 'risk' : mediumSeverityFindings ? 'watch' : 'good'}`}><span>HIGH-SEVERITY FINDINGS</span><strong>{highSeverityFindings}</strong><small>Review priority, not a revenue-loss estimate</small></article>
          <article className="pf-verdict-card"><span>SOURCE EVIDENCE RECORDS</span><strong>{evidenceTotal}</strong><small>Evidence attached to the current filtered report list</small></article>
        </div>
        <div className="pf-explain-grid">
          <article><strong>Included</strong><p>Saved page URL, completion time, finding count, evidence count and available JSON/CSV exports.</p></article>
          <article><strong>Not included</strong><p>Private analytics, client approvals and revocable public share links are not created by this report library.</p></article>
        </div>
      </section>

      <section className="pf-report-block">
        <div className="pf-block-heading"><span>03</span><h2>Finding severity across completed audits</h2></div>
        <div className="pf-chart-card"><p>Counts come from saved findings across all completed audits owned by this account. Severity helps order review; it does not quantify commercial impact.</p>
          <div className="pf-bars">
            {[
              {label:'High severity',count:highSeverityFindings},
              {label:'Medium severity',count:mediumSeverityFindings},
              {label:'Low severity',count:lowSeverityFindings},
            ].map((item,index)=><div className="pf-bar-row" key={item.label}><span className="pf-bar-rank">{String(index+1).padStart(2,'0')}</span><span className="pf-bar-label">{item.label}</span><div className="pf-bar-track" role="img" aria-label={`${item.count} ${item.label.toLowerCase()} findings`}><div className={`pf-bar-fill ${item.count?'has-value':''}`} style={{width:`${item.count/maxSeverity*100}%`}} /></div><strong>{item.count}</strong></div>)}
          </div>
        </div>
      </section>

      <section className="pf-report-block">
        <div className="pf-block-heading"><span>04</span><h2>Find and trace a report</h2></div>
        <section className="pf-subpanel">
          <form action="/dashboard/reports" method="get" style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'end'}}>
            <label style={{flex:'1 1 260px',display:'grid',gap:7}}><span className="pf-eyebrow">SEARCH BY URL OR PAGE CATEGORY</span><input name="q" defaultValue={query} placeholder="Search a store URL or category" maxLength={120} /></label>
            <button className="primary-button" type="submit">Search reports</button>
            {query && <Link className="button button-secondary" href="/dashboard/reports">Clear search</Link>}
          </form>
          <p className="muted" style={{marginBottom:0}}>Showing up to 100 matching completed reports, newest first.</p>
        </section>
        {audits.length ? <div className="pf-evidence-list">{audits.map(audit=><article key={audit.id}>
          <div className="pf-chip-row"><span>COMPLETED</span><span>{audit._count.findings} FINDINGS</span><span>{audit._count.evidence} EVIDENCE ITEMS</span></div>
          <strong style={{overflowWrap:'anywhere'}}>{audit.url}</strong>
          <small>{audit.completedAt ? new Date(audit.completedAt).toLocaleString('en',{dateStyle:'medium',timeStyle:'short'}) : 'Completion date unavailable'}{audit.category ? ` · ${audit.category}` : ''}</small>
          <div className="pf-report-footer"><Link className="button" href={`/dashboard/audits/${audit.id}`}>Open full report</Link><a className="button" href={`/api/audits/${audit.id}/export`}>Export JSON</a><a className="button" href={`/api/audits/${audit.id}/export/csv`}>Export CSV</a></div>
        </article>)}</div> : <div className="pf-empty-report"><span>{query ? 'NO MATCHING REPORTS' : 'NO COMPLETED REPORTS'}</span><h2>{query ? 'No saved report matches that search.' : 'Your report library starts after the first completed inspection.'}</h2><p>{query ? 'Try a shorter URL or a different page category.' : 'Run an inspection to create a report with captured page evidence. No sample reports are shown.'}</p><Link className="primary-button" href="/dashboard">Run an inspection →</Link></div>}
      </section>

      <section className="pf-report-block">
        <div className="pf-block-heading"><span>05</span><h2>Use the report to close the loop</h2></div>
        <div className="pf-flow">
          {[
            ['Review','Open the report and confirm the evidence supports the finding.'],
            ['Assign','Use the Fix Center to track the correction and its status.'],
            ['Change','Update the source page using verified product and policy facts.'],
            ['Recheck','Run a fresh inspection and compare the new capture.'],
          ].map((step,index)=><div className="pf-flow-step" key={step[0]}><div className="pf-flow-node"><span>{index+1}</span><strong>{step[0]}</strong><small>Next action</small></div><p>{step[1]}</p></div>)}
        </div>
        <div className="pf-report-footer"><Link className="button" href="/dashboard/fixes">Open Fix Center</Link><Link className="button" href="/dashboard/audits">Open audit history</Link></div>
      </section>
    </div>
  </main>;
}
