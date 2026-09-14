import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db';
import AuditStatusRefresh from '@/components/audit-status-refresh';

export default async function AuditPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect('/auth');
  const { id } = await params;
  const audit = await db.audit.findFirst({
    where: { id, userId: user.id },
    include: {
      findings: {
        include: { evidence: { include: { evidence: true } } },
        orderBy: [{ priority: 'asc' }, { severity: 'asc' }],
      },
      evidence: true,
      jobs: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });
  if (!audit) notFound();

  const active = audit.status === 'QUEUED' || audit.status === 'RUNNING';
  const latestJob = audit.jobs[0];

  return <main className="dashboard">
    <AuditStatusRefresh active={active} />
    <header className="topbar"><Link href="/dashboard" className="brand">PageFix <span>AI</span></Link><Link href="/dashboard">Dashboard</Link></header>
    <div className="container dashboard-main">
      <div className="label">Audit report</div>
      <h1>{audit.url}</h1>
      <p className="muted">Engine {audit.engineVersion} · {audit.status}</p>

      {audit.status === 'FAILED' && <div className="error-box">
        <strong>The audit could not be completed.</strong>
        <p>{audit.errorMessage || latestJob?.errorMessage || 'The worker reported an unknown error.'}</p>
        <p className="muted">Check that the page is publicly reachable and does not block automated browsers, then start a new audit from the dashboard.</p>
      </div>}

      {active && <div className="card">
        <h2>Analysis in progress</h2>
        <p className="muted">PageFix is acquiring the page, rendering desktop/mobile views, extracting evidence, running deterministic checks, and preparing findings.</p>
        {latestJob && <div className="badge">Worker stage: {latestJob.status}</div>}
        <p className="muted">This page refreshes automatically while processing.</p>
      </div>}

      {audit.status === 'COMPLETED' && <>
        <div className="grid grid-3" style={{ marginTop: 24 }}>
          <div className="card"><div className="label">Findings</div><div className="stat">{audit.findings.length}</div></div>
          <div className="card"><div className="label">Evidence items</div><div className="stat">{audit.evidence.length}</div></div>
          <div className="card"><div className="label">Limitations</div><p className="muted">No conversion, revenue, traffic quality, margin, LTV or checkout abandonment can be determined without connected analytics.</p></div>
        </div>
        <section className="card" style={{ marginTop: 24 }}>
          <h2>Prioritized findings</h2>
          {audit.findings.length === 0 && <p className="muted">No supported purchase-friction finding was detected by the current deterministic engine.</p>}
          {audit.findings.map(f => <article className="finding" key={f.id}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><span className="badge">{f.priority}</span><span className={`badge ${f.severity === 'HIGH' ? 'danger' : ''}`}>{f.severity}</span><span className="badge">Confidence {f.confidence}</span></div>
            <h3>{f.title}</h3>
            <p><strong>Observed:</strong> {f.observation}</p>
            {f.hypothesis && <p><strong>Diagnosis:</strong> {f.hypothesis}</p>}
            <p><strong>Buyer question:</strong> {f.buyerQuestion || 'What would a buyer need to know here?'}</p>
            <p><strong>Why it matters:</strong> {f.whyItMatters}</p>
            <p><strong>Recommended fix:</strong> {f.recommendation}</p>
            <p><strong>Implementation:</strong> {f.implementationSteps}</p>
            <details><summary>Evidence</summary>{f.evidence.map(link => <div key={link.evidenceId} style={{ marginTop: 8 }}><span className="badge">{link.evidence.type}</span><p className="muted">{link.evidence.content.slice(0, 1200)}</p></div>)}</details>
          </article>)}
        </section>
      </>}
    </div>
  </main>;
}
