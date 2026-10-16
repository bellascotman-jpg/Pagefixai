import Link from 'next/link';
import Image from 'next/image';
import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db';
import AuditStatusRefresh from '@/components/audit-status-refresh';
import { buildCommerceClarityScorecard } from '@/lib/audit/scorecard';

const classifications = ['Directly Observed Evidence', 'Inferred Risk', 'Hypothesis', 'Recommendation'];

export default async function AuditPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect('/auth?mode=login');
  const { id } = await params;
  const audit = await db.audit.findFirst({
    where: { id, userId: user.id },
    include: {
      findings: {
        include: { evidence: { include: { evidence: true } } },
        orderBy: [{ priority: 'asc' }, { severity: 'asc' }],
      },
      evidence: true,
      screenshots: { orderBy: { viewport: 'asc' } },
      buyerQuestions: { orderBy: { createdAt: 'asc' } },
      pages: { select: { statusCode: true, title: true, canonical: true, metaDescription: true }, orderBy: { createdAt: 'desc' }, take: 1 },
      jobs: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });
  if (!audit) notFound();

  const active = audit.status === 'QUEUED' || audit.status === 'RUNNING';
  const latestJob = audit.jobs[0];
  const page = audit.pages[0];
  const scorecard = buildCommerceClarityScorecard({ category: audit.category, buyerQuestions: audit.buyerQuestions, findings: audit.findings });

  return <main className="dashboard">
    <AuditStatusRefresh active={active} auditId={audit.id} />
    <header className="topbar"><Link href="/dashboard" className="brand">PageFix <span>AI</span></Link><Link href="/dashboard">Dashboard</Link></header>
    <div className="container dashboard-main">
      <div className="label">Audit report</div>
      <h1 style={{ overflowWrap: 'anywhere' }}>{audit.url}</h1>
      <p className="muted">Engine {audit.engineVersion} · {audit.status}{page?.statusCode !== null && page?.statusCode !== undefined ? ` · HTTP ${page.statusCode}` : ''}</p>

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
          <div className="card"><div className="label">Page response</div><div className="stat" style={{ fontSize: 23 }}>{page?.statusCode ?? 'Not recorded'}</div><p className="muted">HTTP status observed during the primary navigation.</p></div>
        </div>
        <section className="card" style={{ marginTop: 24 }}>
          <h2>Captured page views</h2>
          <p className="muted" style={{ fontSize: 12 }}>Viewport screenshots are stored privately and are available only to the owner of this audit. Screenshot storage must be configured for these images to be retained.</p>
          {audit.screenshots.filter(item => item.storageUrl).length === 0 && <p className="muted">No stored screenshots are available for this audit. Configure the S3-compatible storage settings and run a new audit to retain desktop and mobile captures.</p>}
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))' }}>
            {audit.screenshots.filter(item => item.storageUrl).map(item => <article key={item.id}>
              <h3 style={{ textTransform: 'capitalize' }}>{item.viewport} view</h3>
              <Image src={'/api/audits/' + audit.id + '/screenshots/' + item.viewport} alt={'Page screenshot captured at ' + item.viewport + ' viewport'} width={item.viewport === 'mobile' ? 390 : 1440} height={item.viewport === 'mobile' ? 844 : 1000} unoptimized style={{ width: '100%', height: 'auto', border: '1px solid var(--line)', borderRadius: 10 }} />
            </article>)}
          </div>
        </section>
        <section className="card" style={{ marginTop: 24 }}>
          <h2>Buyer question coverage</h2>
          <p className="muted" style={{ fontSize: 12 }}>These checks look for signals in the captured visible page and link inventory. “Not observed” does not mean the information is absent elsewhere on the site.</p>
          <div className="grid" style={{ gap: 0 }}>
            {audit.buyerQuestions.map(item => <div key={item.id} className="finding" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
              <div><strong>{item.question}</strong><p className="muted" style={{ fontSize: 12, margin: '5px 0 0' }}>Evidence sources: {Array.isArray(item.evidenceIds) ? item.evidenceIds.length : 0}</p></div>
              <span className={`badge ${item.status === 'OBSERVED_IN_CAPTURED_PAGE' ? '' : 'danger'}`}>{item.status === 'OBSERVED_IN_CAPTURED_PAGE' ? 'Signal observed' : 'Not observed'}</span>
            </div>)}
          </div>
        </section>
        <section className="card" style={{ marginTop: 24 }}>
          <h2>Prioritized findings</h2>
          {audit.findings.length === 0 && <p className="muted">No supported finding was detected by the current checks. This is not proof that the page has no issues.</p>}
          {audit.findings.map(f => {
            const findingType = classifications.includes(f.hypothesis || '') ? f.hypothesis : f.hypothesis ? 'Hypothesis' : 'Recommendation';
            const explanatoryHypothesis = f.hypothesis && !classifications.includes(f.hypothesis) ? f.hypothesis : null;
            return <article className="finding" key={f.id}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><span className="badge">{f.priority}</span><span className={`badge ${f.severity === 'HIGH' ? 'danger' : ''}`}>{f.severity}</span><span className="badge">Confidence {f.confidence}</span></div>
              <h3>{f.title}</h3>
              <p><strong>Finding classification:</strong> {findingType}</p>
              <p><strong>Observed:</strong> {f.observation}</p>
              {explanatoryHypothesis && <p><strong>Hypothesis:</strong> {explanatoryHypothesis}</p>}
              <p><strong>Buyer question:</strong> {f.buyerQuestion || 'What would a buyer need to know here?'}</p>
              <p><strong>Why it matters:</strong> {f.whyItMatters}</p>
              <p><strong>Recommended fix:</strong> {f.recommendation}</p>
              <p><strong>Implementation:</strong> {f.implementationSteps}</p>
              <details><summary>Evidence ({f.evidence.length} linked item{f.evidence.length === 1 ? '' : 's'})</summary>{f.evidence.map(link => <div key={link.evidenceId} style={{ marginTop: 8 }}><span className="badge">{link.evidence.type}</span><p className="muted" style={{ overflowWrap: 'anywhere' }}>{link.evidence.content.slice(0, 1200)}</p></div>)}</details>
            </article>;
          })}
        </section>
        <p className="muted" style={{ fontSize: 12, marginTop: 18 }}>This report reflects the page state captured at audit time. Findings do not establish conversion impact, revenue loss, search rankings or customer behavior. A missing finding does not prove the absence of a problem.</p>
      </>}
    </div>
  </main>;
}
