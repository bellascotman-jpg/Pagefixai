import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db';

export default async function ReportsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth?mode=login');
  const audits = await db.audit.findMany({ where: { userId: user.id, status: 'COMPLETED' }, orderBy: { completedAt: 'desc' }, take: 100, include: { _count: { select: { findings: true, evidence: true } } } });
  return <main className="dashboard"><header className="topbar"><div><div className="label">WORKSPACE / REPORTING</div><h1 style={{fontSize:26,margin:'4px 0 0'}}>Reports</h1></div><Link className="button button-secondary" href="/dashboard/audits">Audit history</Link></header><div className="container dashboard-main"><p className="muted">Completed audits are available as report views and machine-readable JSON exports. Exports contain the audit evidence stored by PageFix; they do not contain private analytics that were never connected.</p>
    {audits.length===0 ? <section className="card empty-state"><h2>No completed reports yet</h2><p className="muted">Your completed audits will appear here.</p><Link className="primary-button" href="/dashboard">Run an audit</Link></section> : <div className="history-list">{audits.map(a=><div className="history-row" key={a.id}><div className="history-symbol">▤</div><div className="history-detail"><strong>{a.url}</strong><span>{a.completedAt ? new Date(a.completedAt).toLocaleString('en',{dateStyle:'medium',timeStyle:'short'}) : 'Completed audit'}</span></div><div className="history-metrics"><span>{a._count.findings} findings</span><span>{a._count.evidence} evidence items</span></div><div className="history-actions"><Link href={`/dashboard/audits/${a.id}`}>View</Link><a href={`/api/audits/${a.id}/export`}>Export JSON ↓</a></div></div>)}</div>}
  </div></main>;
}
