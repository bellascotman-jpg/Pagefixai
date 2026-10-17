import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db';

export default async function CompetitorIntelligencePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth?mode=login');
  const audits = await db.audit.findMany({
    where: { userId: user.id, status: 'COMPLETED' },
    orderBy: { createdAt: 'desc' },
    take: 30,
    select: { id: true, url: true, createdAt: true, pages: { select: { statusCode: true, title: true, metaDescription: true, canonical: true, visibleText: true } }, findings: { select: { title: true, severity: true } } },
  });
  const seenUrls = new Set<string>();
  const rows = audits.map(a => ({...a, page:a.pages[0]})).filter(row => {
    const key = row.url.trim().replace(/\/+$/, '').toLowerCase();
    if (seenUrls.has(key)) return false;
    seenUrls.add(key);
    return true;
  });
  return <main className="dashboard">
    <header className="topbar"><div><div className="label">PAGEFIX AI / PHASE 7</div><h1 style={{fontSize:27,margin:'4px 0 0'}}>Competitor intelligence</h1></div><Link className="button button-secondary" href="/dashboard/intelligence">Intelligence hub</Link></header>
    <div className="container dashboard-main">
      <p className="muted" style={{maxWidth:850,lineHeight:1.8}}>Compare public-page evidence from URLs you have already inspected. This first workspace compares captured page positioning and technical signals; it does not estimate competitor sales, traffic, ad spend, market share or conversion performance.</p>
      <div className="card" style={{marginBottom:20}}><strong>Comparison scope</strong><p className="muted">Each row represents the latest saved inspection for that URL in your account. Different capture dates, inaccessible pages and missing fields can make comparisons incomplete. Open the source report before treating a difference as meaningful.</p></div>
      {!rows.length ? <section className="card empty-state"><h2>No inspected pages to compare yet</h2><p className="muted">Inspect your page and competitor public URLs through the existing audit workflow. Their evidence will appear here when completed inspections are saved to this account.</p><Link className="primary-button" href="/dashboard">Inspect a page</Link></section> :
      <div className="grid" style={{gap:16}}>{rows.map(row=><article className="card" key={row.id}>
        <div className="section-heading"><div><div className="label">{row.page?.statusCode ? `HTTP ${row.page.statusCode}` : 'HTTP status unavailable'}</div><h2 style={{fontSize:18,overflowWrap:'anywhere'}}>{row.page?.title || row.url}</h2></div><span className="badge">{row.findings.length} findings</span></div>
        <p><a href={row.url} target="_blank" rel="noreferrer">{row.url} ↗</a></p>
        <div className="grid grid-2"><div><strong>Captured meta description</strong><p className="muted">{row.page?.metaDescription || 'Not captured'}</p></div><div><strong>Canonical URL</strong><p className="muted" style={{overflowWrap:'anywhere'}}>{row.page?.canonical || 'Not captured'}</p></div></div>
        <strong>Observable page signals</strong><p className="muted">{row.page?.visibleText ? row.page.visibleText.slice(0,320) + (row.page.visibleText.length>320?'…':'') : 'No visible-text capture available.'}</p>
        <strong>Finding themes to review</strong><p className="muted">{row.findings.slice(0,5).map(x=>x.title).join(' · ') || 'No findings recorded.'}</p>
        <p className="muted" style={{fontSize:12}}>Captured {row.createdAt.toLocaleString()} · {row.page?.visibleText ? 'text captured' : 'text missing'}</p>
        <Link href={`/dashboard/audits/${row.id}`}>Review evidence in report →</Link>
      </article>)}</div>}
      <p className="muted" style={{fontSize:12,marginTop:20}}>This workspace reports observed page differences only. It does not rank competitors or infer commercial performance from public content.</p>
    </div>
  </main>;
}
