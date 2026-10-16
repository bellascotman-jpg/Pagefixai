import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db';
import FindingStatusControl from '@/components/finding-status-control';

export default async function FixCenterPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth?mode=login');
  const findings = await db.finding.findMany({
    where: { audit: { userId: user.id } },
    orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
    take: 100,
    include: { audit: { select: { id: true, url: true, createdAt: true, status: true } }, fix: true, evidence: { include: { evidence: { select: { id: true, source: true, location: true } } } } },
  });
  const verified = findings.filter(f => f.status === 'VERIFIED').length;
  const awaitingVerification = findings.filter(f => f.status !== 'VERIFIED').length;
  return <main className="dashboard"><header className="topbar"><div><div className="label">WORKSPACE / REMEDIATION</div><h1 style={{fontSize:26,margin:'4px 0 0'}}>Fix center</h1></div><Link className="button button-secondary" href="/dashboard/audits">Audit history</Link></header><div className="container dashboard-main"><p className="muted">A prioritized queue of observed issues and recommended fixes. Update a finding&apos;s status, then recheck the source page to verify what changed.</p>
    <div className="grid grid-3" style={{margin:'24px 0'}}><div className="card"><div className="label">Findings tracked</div><div className="stat">{findings.length}</div></div><div className="card"><div className="label">Awaiting verified resolution</div><div className="stat">{awaitingVerification}</div></div><div className="card"><div className="label">Verified by recheck</div><div className="stat">{verified}</div></div></div>
    {findings.length===0 ? <section className="card empty-state"><h2>Your fix queue is empty</h2><p className="muted">Run an audit to create evidence-linked findings and remediation guidance.</p><Link className="primary-button" href="/dashboard">Start an audit</Link></section> : findings.map(f=><article className="fix-row card" key={f.id}><div className="fix-row-top"><span className={`badge ${f.severity==='HIGH'?'danger':''}`}>{f.priority.replaceAll('_',' ')}</span><span className="muted" style={{fontSize:11}}>{f.severity} severity · {f.confidence} confidence</span></div><h2>{f.title}</h2><p>{f.observation}</p><div className="fix-evidence"><strong>Why it matters</strong><p>{f.whyItMatters}</p><strong>Recommended action</strong><p>{f.recommendation}</p><strong>Evidence references</strong><p>{f.evidence.length ? f.evidence.map(link=>link.evidence.location||link.evidence.source).filter(Boolean).join(' · ') : 'No linked evidence was stored for this finding.'}</p></div><div className="fix-row-footer"><span className="badge">{f.status.replaceAll('_',' ')}</span><Link href={`/dashboard/audits/${f.audit.id}`}>Open audit report →</Link></div><FindingStatusControl id={f.id} initialStatus={f.status} /></article>)}
  </div></main>;
}
