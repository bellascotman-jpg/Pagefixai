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

  const [audits, totalReports, totalFindings, highSeverityFindings] = await Promise.all([
    db.audit.findMany({
      where,
      orderBy: { completedAt: 'desc' },
      take: 100,
      include: { _count: { select: { findings: true, evidence: true } } },
    }),
    db.audit.count({ where: baseWhere }),
    db.finding.count({ where: { audit: { userId: user.id, status: 'COMPLETED' } } }),
    db.finding.count({ where: { severity: 'HIGH', audit: { userId: user.id, status: 'COMPLETED' } } }),
  ]);

  return <main className="dashboard">
    <header className="topbar">
      <div><div className="label">WORKSPACE / REPORTING</div><h1 style={{ fontSize: 26, margin: '4px 0 0' }}>Reports</h1></div>
      <Link className="button button-secondary" href="/dashboard/audits">Audit history</Link>
    </header>
    <div className="container dashboard-main">
      <p className="muted">Review completed inspections, locate reports by URL or page category, and export evidence-backed findings for your team or clients. Reports include only information PageFix actually captured; they do not invent private analytics or commercial outcomes.</p>
      <div className="grid grid-3" style={{ margin: '22px 0' }}>
        <section className="card"><div className="label">COMPLETED REPORTS</div><div className="stat">{totalReports}</div><p className="muted">Across your workspace</p></section>
        <section className="card"><div className="label">RECORDED FINDINGS</div><div className="stat">{totalFindings}</div><p className="muted">From completed audits</p></section>
        <section className="card"><div className="label">HIGH-SEVERITY FINDINGS</div><div className="stat">{highSeverityFindings}</div><p className="muted">Prioritise for review; not a revenue-loss estimate</p></section>
      </div>
      <section className="card" style={{ marginBottom: 18 }}>
        <form action="/dashboard/reports" method="get" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'end' }}>
          <label style={{ flex: '1 1 260px' }}><span className="label">FIND A REPORT</span><input name="q" defaultValue={query} placeholder="Search page URL or category" maxLength={120} /></label>
          <button className="primary-button" type="submit">Search reports</button>
          {query && <Link className="button button-secondary" href="/dashboard/reports">Clear</Link>}
        </form>
        <p className="muted" style={{ marginBottom: 0 }}>Showing up to 100 matching completed reports, newest first.</p>
      </section>
      {audits.length === 0 ? <section className="card empty-state"><h2>{query ? 'No matching reports' : 'No completed reports yet'}</h2><p className="muted">{query ? 'Try a shorter URL or category term.' : 'Your completed audits will appear here.'}</p><Link className="primary-button" href="/dashboard">Run an audit</Link></section> :
        <div className="history-list">{audits.map((audit) => <div className="history-row" key={audit.id}>
          <div className="history-symbol">▤</div>
          <div className="history-detail"><strong>{audit.url}</strong><span>{audit.completedAt ? new Date(audit.completedAt).toLocaleString('en', { dateStyle: 'medium', timeStyle: 'short' }) : 'Completed audit'}{audit.category ? ` · ${audit.category}` : ''}</span></div>
          <div className="history-metrics"><span>{audit._count.findings} findings</span><span>{audit._count.evidence} evidence items</span></div>
          <div className="history-actions"><Link href={`/dashboard/audits/${audit.id}`}>View</Link><a href={`/api/audits/${audit.id}/export`}>JSON ↓</a><a href={`/api/audits/${audit.id}/export/csv`}>CSV ↓</a></div>
        </div>)}</div>}
    </div>
  </main>;
}
