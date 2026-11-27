import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db';

export default async function StoreIntelligencePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth?mode=login');
  const audits = await db.audit.findMany({
    where: { userId: user.id, status: 'COMPLETED' },
    orderBy: { completedAt: 'desc' },
    take: 250,
    include: {
      findings: {
        select: {
          id: true, title: true, severity: true, priority: true, status: true,
          observation: true, recommendation: true, confidence: true,
          evidence: { include: { evidence: { select: { id: true, type: true, source: true, location: true, content: true } } } },
        },
      },
    },
  });
  const allFindings = audits.flatMap(a => a.findings.map(f => ({ ...f, auditId: a.id, url: a.url, auditCreatedAt: a.completedAt ?? a.createdAt })));
  const openFindings = allFindings.filter(f => !['COMPLETED', 'VERIFIED'].includes(f.status));
  const groups = new Map<string, { title: string; count: number; severity: string; urls: Set<string>; latestAuditId: string; latestDate: Date; priority: string }>();
  for (const finding of allFindings) {
    const key = finding.title.trim().toLowerCase();
    const existing = groups.get(key);
    if (existing) {
      existing.count += 1;
      existing.urls.add(finding.url);
      if (finding.auditCreatedAt > existing.latestDate) { existing.latestDate = finding.auditCreatedAt; existing.latestAuditId = finding.auditId; }
      if (finding.severity === 'HIGH') existing.severity = 'HIGH';
      else if (finding.severity === 'MEDIUM' && existing.severity === 'LOW') existing.severity = 'MEDIUM';
      if (finding.priority === 'FIX_NOW') existing.priority = 'FIX_NOW';
    } else {
      groups.set(key, { title: finding.title, count: 1, severity: finding.severity, urls: new Set([finding.url]), latestAuditId: finding.auditId, latestDate: finding.auditCreatedAt, priority: finding.priority });
    }
  }
  const recurring = [...groups.values()].filter(item => item.urls.size > 1).sort((a,b) => b.urls.size-a.urls.size || b.count-a.count || a.title.localeCompare(b.title));
  const latest = audits.slice(0, 8);
  const evidenceRows = openFindings.flatMap(f => f.evidence.map(link => ({ finding: f, evidence: link.evidence }))).slice(0, 8);
  const high = openFindings.filter(f => f.severity === 'HIGH').length;
  const medium = openFindings.filter(f => f.severity === 'MEDIUM').length;
  const maxPattern = Math.max(...recurring.map(item => item.urls.size), 1);
  const distinctPages = new Set(audits.map(a => a.url)).size;

  return <main className="dashboard">
    <header className="topbar"><div><div className="label">COMMERCE INTELLIGENCE / STORE OPERATIONS</div><h1 style={{fontSize:27,margin:'4px 0 0'}}>Store intelligence</h1></div><div style={{display:'flex',gap:9,flexWrap:'wrap'}}><Link className="button button-secondary" href="/dashboard/audits">Audit history</Link><Link className="primary-button" href="/dashboard">Inspect another page →</Link></div></header>
    <div className="container dashboard-main pf-audit-report">
      <div className="pf-report-meta"><span>STORE-LEVEL INSPECTION REPORT</span><span>{audits.length} SAVED COMPLETED AUDITS · MAX 250</span></div>

      <section className="pf-report-block">
        <div className="pf-block-heading"><span>01</span><h2>The store-owner problem</h2></div>
        <div className="pf-problem">
          <span>PROBLEM / OPERATIONAL CONSEQUENCE</span>
          <h2>“I need to see which problems keep appearing across my inspected pages, so I can fix the source instead of chasing the same issue repeatedly.”</h2>
          <p><strong>What it can cost:</strong> Repeated customer-facing issues can consume review time and create inconsistent product experiences. This view includes only pages you have actually inspected; it does not claim full catalogue coverage.</p>
        </div>
      </section>

      <section className="pf-report-block">
        <div className="pf-block-heading"><span>02</span><h2>Store inspection verdict</h2></div>
        <div className="pf-verdict-grid">
          <article className="pf-verdict-card"><span>COMPLETED AUDITS</span><strong>{audits.length}</strong><small>Most recent 250 completed account-owned inspections</small></article>
          <article className="pf-verdict-card"><span>DISTINCT PAGES INSPECTED</span><strong>{distinctPages}</strong><small>Unique URLs in the saved audit window</small></article>
          <article className={`pf-risk-card ${high ? 'risk' : medium ? 'watch' : 'good'}`}><span>OPEN FINDINGS</span><strong>{openFindings.length}</strong><small>{high} high · {medium} medium severity</small></article>
          <article className="pf-verdict-card"><span>REPEATED PAGE PATTERNS</span><strong>{recurring.length}</strong><small>Matching finding titles appearing on more than one inspected URL</small></article>
        </div>
        <div className="pf-explain-grid">
          <article><strong>What is known</strong><p>{allFindings.length} finding records are attached to these completed audits; {evidenceRows.length} source excerpts are shown below from the open queue.</p></article>
          <article><strong>What is not established</strong><p>Uninspected catalogue coverage, actual customer impact, revenue loss and private store analytics are not available from these public-page captures.</p></article>
        </div>
      </section>

      <section className="pf-report-block">
        <div className="pf-block-heading"><span>03</span><h2>Where the same issue appears across pages</h2></div>
        <div className="pf-chart-card">
          <p>Each bar counts distinct inspected URLs with the same saved finding title. It is a recurrence signal—not a store-wide prevalence estimate.</p>
          {recurring.length ? <div className="pf-bars">{recurring.slice(0, 8).map((item,index)=><div className="pf-bar-row" key={item.title}><span className="pf-bar-rank">{String(index+1).padStart(2,'0')}</span><span className="pf-bar-label">{item.title}</span><div className="pf-bar-track" role="img" aria-label={`${item.urls.size} inspected pages have this finding`}><div className="pf-bar-fill has-value" style={{width:`${item.urls.size/maxPattern*100}%`}} /></div><strong>{item.urls.size}</strong></div>)}</div> : <div className="pf-empty-inline">No finding title currently repeats across multiple inspected URLs. Inspect additional product and landing pages to establish whether patterns exist; no repeated pattern is not proof that every page is clear.</div>}
        </div>
        {recurring.slice(0,8).map(item=><article className="pf-fix-card" key={item.title} style={{marginTop:10}}>
          <div className="pf-fix-top"><span>{item.severity} SEVERITY</span><span>{item.priority.replaceAll('_',' ')}</span><span>{item.urls.size} DISTINCT PAGES</span></div>
          <h3>{item.title}</h3><p>{item.count} matching finding record(s) across {item.urls.size} inspected URL(s).</p>
          <div className="pf-fix-actions"><Link href={`/dashboard/audits/${item.latestAuditId}`}>Review latest source evidence →</Link></div>
        </article>)}
      </section>

      <section className="pf-report-block">
        <div className="pf-block-heading"><span>04</span><h2>Evidence and source traceability</h2></div>
        <div className="pf-evidence-head"><div><h3>Open findings linked to captured page evidence</h3><p>Only saved excerpts are shown. The source audit remains the authoritative record.</p></div><Link href="/dashboard/fixes">Open Fix Center →</Link></div>
        {evidenceRows.length ? <div className="pf-evidence-list">{evidenceRows.map((row,index)=><article key={row.evidence.id+row.finding.id+index}>
          <div className="pf-chip-row"><span>{row.evidence.type.replaceAll('_',' ')}</span><span>{row.finding.severity} SEVERITY</span><span>{row.finding.confidence} CONFIDENCE</span></div>
          <strong>{row.finding.title}</strong><blockquote>{row.evidence.content.slice(0,700)}</blockquote>
          <small>{row.url} · {row.evidence.location || row.evidence.source || 'Source location not recorded'} · <Link href={`/dashboard/audits/${row.auditId}`}>Open audit</Link></small>
        </article>)}</div> : <div className="pf-empty-inline">No evidence-linked open findings are available in this audit window. Review the complete audit history before drawing a conclusion.</div>}
        <div className="pf-subpanel"><h3>Recent inspected pages</h3><p>Latest completed source records in this account.</p>{latest.length ? latest.map(a=><article key={a.id} style={{padding:'10px 0',borderTop:'1px solid #eee2e7'}}><strong style={{overflowWrap:'anywhere'}}>{a.url}</strong><p className="muted">{a.findings.length} findings · {a.completedAt?.toLocaleString() ?? 'Completion date unavailable'}</p><Link href={`/dashboard/audits/${a.id}`}>Open audit report →</Link></article>) : <p className="muted">No completed inspections yet.</p>}</div>
      </section>

      <section className="pf-report-block">
        <div className="pf-block-heading"><span>05</span><h2>Prioritised store action plan</h2></div>
        <p className="pf-fix-intro">Start with high-priority issues that repeat across inspected URLs. Confirm whether they share a theme, product template or content source before changing the store.</p>
        {openFindings.length ? <div className="pf-fix-list">{[...openFindings].sort((a,b)=>(a.priority==='FIX_NOW'?0:a.priority==='FIX_NEXT'?1:2)-(b.priority==='FIX_NOW'?0:b.priority==='FIX_NEXT'?1:2)||(a.severity==='HIGH'?-1:1)-(b.severity==='HIGH'?-1:1)).slice(0,12).map((finding,index)=><article className="pf-fix-card" key={finding.id}>
          <div className="pf-fix-top"><span>STEP {index+1}</span><span className={finding.severity==='HIGH'?'risk':finding.severity==='MEDIUM'?'watch':'good'}>{finding.severity}</span><span>{finding.priority.replaceAll('_',' ')}</span><span>{finding.status.replaceAll('_',' ')}</span></div>
          <h3>{finding.title}</h3><p><strong>Observed:</strong> {finding.observation}</p><p><strong>Recommended correction:</strong> {finding.recommendation}</p>
          <div className="pf-fix-actions"><Link href={`/dashboard/audits/${finding.auditId}`}>Review evidence and recheck →</Link></div>
        </article>)}</div> : <div className="pf-empty-inline">No open finding records remain in the latest 250 completed audits.</div>}
        <div className="pf-report-footer"><Link className="button" href="/dashboard/fixes">Open Fix Center</Link><Link className="button" href="/dashboard/audits">Full audit history</Link><Link className="button" href="/dashboard/reports">Reports & exports</Link></div>
      </section>

      <p className="muted" style={{fontSize:11}}>Coverage limitation: this view is limited to the 250 most recent completed audits owned by your account. It does not automatically crawl a product catalogue or establish that uninspected pages share these issues.</p>
    </div>
  </main>;
}
