import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db';
import CompetitorAddForm from '@/components/competitor-add-form';
import CompetitorComparisonWorkspace from '@/components/competitor-comparison-workspace';

export default async function CompetitorWorkspacePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth?mode=login');
  const competitors = await db.competitor.findMany({
    where: { project: { organization: { memberships: { some: { userId: user.id } } } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { project: { select: { name: true } }, observations: { orderBy: { createdAt: 'desc' }, take: 3 } },
  });
  const audits = await db.audit.findMany({
    where: { userId: user.id, status: 'COMPLETED' },
    orderBy: { completedAt: 'desc' },
    take: 20,
    include: {
      pages: { orderBy: { createdAt: 'desc' }, take: 1, select: { title: true, metaDescription: true, canonical: true, statusCode: true } },
      findings: { orderBy: [{ priority: 'asc' }, { severity: 'asc' }], take: 20, select: { title: true, severity: true, priority: true, observation: true, recommendation: true } },
    },
  });
  return <main className="dashboard"><header className="topbar"><div><div className="label">INTELLIGENCE / COMPETITORS</div><h1 style={{fontSize:26,margin:'4px 0 0'}}>Competitor workspace</h1></div><Link className="button button-secondary" href="/dashboard">Back to overview</Link></header><div className="container dashboard-main"><p className="muted">Keep competitor URLs and recorded observations organized by project. A competitor record is not itself a comparative analysis; only captured evidence should be presented as a finding.</p><CompetitorComparisonWorkspace audits={audits.map(audit => ({ id: audit.id, url: audit.url, completedAt: audit.completedAt?.toISOString() ?? null, page: audit.pages[0] ?? null, findings: audit.findings }))} />
    <section className="card" style={{margin:'22px 0'}}><h2>Add a competitor</h2><p className="muted">Only public URLs are accepted. Do not submit private dashboards or sites you are not authorized to inspect.</p><CompetitorAddForm /></section>
    {competitors.length===0 ? <section className="card empty-state"><div className="empty-mark">◎</div><h2>No competitor records yet</h2><p className="muted">Competitor tracking records can be associated with a project. Comparative conclusions require captured evidence from both the target page and the competitor page.</p><Link className="primary-button" href="/dashboard/audits">Review your audited pages</Link></section> : <div className="history-list">{competitors.map(c=><article className="history-row" key={c.id}><div className="history-symbol">◎</div><div className="history-detail"><strong>{c.name || c.url}</strong><span>{c.url} · Project: {c.project.name}</span></div><div className="history-metrics"><span>{c.observations.length} recent observations</span></div></article>)}</div>}
  </div></main>;
}
