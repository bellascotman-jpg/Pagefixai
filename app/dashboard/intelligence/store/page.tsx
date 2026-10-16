import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db';

export default async function StoreIntelligencePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth?mode=login');
  const audits = await db.audit.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 250,
    include: { findings: { select: { id: true, title: true, severity: true, priority: true, status: true } } },
  });
  const completed = audits.filter(a => a.status === 'COMPLETED');
  const allFindings = audits.flatMap(a => a.findings.map(f => ({ ...f, auditId: a.id, url: a.url, auditCreatedAt: a.createdAt })));
  const openFindings = allFindings.filter(f => !['COMPLETED', 'VERIFIED'].includes(f.status));
  const groups = new Map<string, { title: string; count: number; severity: string; urls: Set<string>; latestAuditId: string; latestDate: Date }>();
  for (const finding of allFindings) {
    const key = finding.title.trim().toLowerCase();
    const existing = groups.get(key);
    if (existing) {
      existing.count += 1;
      existing.urls.add(finding.url);
      if (finding.auditCreatedAt > existing.latestDate) { existing.latestDate = finding.auditCreatedAt; existing.latestAuditId = finding.auditId; }
      if (finding.severity === 'HIGH') existing.severity = 'HIGH';
      else if (finding.severity === 'MEDIUM' && existing.severity === 'LOW') existing.severity = 'MEDIUM';
    } else {
      groups.set(key, { title: finding.title, count: 1, severity: finding.severity, urls: new Set([finding.url]), latestAuditId: finding.auditId, latestDate: finding.auditCreatedAt });
    }
  }
  const recurring = [...groups.values()].filter(item => item.count > 1).sort((a,b) => b.count-a.count || a.title.localeCompare(b.title));
  const latest = audits.slice(0, 8);
  return <main className="dashboard">
    <header className="topbar"><div><div className="label">COMMERCE INTELLIGENCE / STORE</div><h1 style={{fontSize:27,margin:'4px 0 0'}}>Store intelligence</h1></div><Link className="primary-button" href="/dashboard">Inspect another page</Link></header>
    <div className="container dashboard-main">
      <p className="muted" style={{maxWidth:850,lineHeight:1.8}}>A seller-level view across pages you have inspected. Repeated issues are grouped by matching finding title; this is a useful work queue, not proof that every product in your store has been inspected.</p>
      <div className="grid grid-3" style={{margin:'22px 0'}}>
        <div className="card"><div className="label">Audits in recent history</div><div className="stat">{audits.length}</div></div>
        <div className="card"><div className="label">Completed inspections</div><div className="stat">{completed.length}</div></div>
        <div className="card"><div className="label">Open finding records</div><div className="stat">{openFindings.length}</div></div>
      </div>
      <section className="card">
        <div className="store-section-heading"><div><div className="label">RECURRING PATTERNS</div><h2>Issues found on more than one inspected page</h2></div><span className="badge">{recurring.length} patterns</span></div>
        {recurring.length === 0 ? <div className="empty-state"><h3>No repeated issue patterns detected yet</h3><p className="muted">Inspect more than one product or landing page. This view groups identical finding titles across the pages you have inspected.</p><Link href="/dashboard" className="primary-button">Start another inspection</Link></div> : recurring.slice(0,30).map(item=><article className="store-pattern-row" key={item.title}><div><span className={`badge ${item.severity==='HIGH'?'danger':''}`}>{item.severity}</span><h3>{item.title}</h3><p className="muted">{item.urls.size} inspected page(s) · {item.count} finding records</p></div><div className="store-pattern-right"><strong>{item.count}×</strong><Link href={`/dashboard/audits/${item.latestAuditId}`}>Open latest evidence →</Link></div></article>)}
      </section>
      <section className="card" style={{marginTop:18}}>
        <div className="store-section-heading"><div><div className="label">RECENT PAGE HISTORY</div><h2>Latest inspections</h2></div><Link href="/dashboard/audits">Full audit history →</Link></div>
        {latest.length===0 ? <p className="muted">No inspections yet.</p> : latest.map(a=><Link className="store-audit-row" href={`/dashboard/audits/${a.id}`} key={a.id}><span className="badge">{a.status}</span><span className="store-audit-url">{a.url}</span><span>{a.findings.length} findings</span><span>→</span></Link>)}
      </section>
      <p className="muted" style={{fontSize:11,marginTop:14}}>Coverage limitation: this view includes only saved audits available to your account. It does not automatically crawl your complete product catalogue or establish that uninspected pages have the same issues.</p>
    </div>
  </main>;
}
