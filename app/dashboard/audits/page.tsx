import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db';

export default async function AuditHistoryPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth?mode=login');
  const audits = await db.audit.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { _count: { select: { findings: true, evidence: true } } },
  });
  return <main className="dashboard"><header className="topbar"><div><div className="label">WORKSPACE / AUDITS</div><h1 style={{fontSize:26,margin:'4px 0 0'}}>Audit history</h1></div><Link className="primary-button" href="/dashboard">New audit</Link></header><div className="container dashboard-main"><p className="muted">Every run stays separate so rechecks can be compared without rewriting the original record.</p>
    {audits.length===0 ? <section className="card empty-state"><div className="empty-mark">⌕</div><h2>No audits yet</h2><p className="muted">Start with a public product page or landing page you are authorized to inspect.</p><Link className="primary-button" href="/dashboard">Start your first audit</Link></section> :
    <div className="history-list">{audits.map(a=><Link className="history-row" href={`/dashboard/audits/${a.id}`} key={a.id}><div className="history-symbol">↗</div><div className="history-detail"><strong>{a.url}</strong><span>{new Date(a.createdAt).toLocaleString('en', {dateStyle:'medium',timeStyle:'short'})}</span></div><div className="history-metrics"><span className="badge">{a.status}</span><span>{a._count.findings} findings</span><span>{a._count.evidence} evidence</span></div><span className="history-arrow">→</span></Link>)}</div>}
  </div></main>;
}
