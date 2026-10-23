import Link from 'next/link';
import AuditScreenshotPanel from '@/components/audit-screenshot-panel';
import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db';
import AuditStatusRefresh from '@/components/audit-status-refresh';
import { buildCommerceClarityScorecard } from '@/lib/audit/scorecard';
import { summarizeTrustSignals } from '@/lib/audit/buyer-decision-intelligence';
import RecheckAuditButton from '@/components/recheck-audit-button';
import CandidatePromises from '@/components/candidate-promises';
import AuditEvidenceViewer from '@/components/audit-evidence-viewer';
import AuditSeverityChart from '@/components/audit-severity-chart';

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
  const hasDesktopScreenshot = audit.screenshots.some(item => item.viewport === 'desktop' && Boolean(item.storageUrl));
  const hasMobileScreenshot = audit.screenshots.some(item => item.viewport === 'mobile' && Boolean(item.storageUrl));
  const capturedText = audit.evidence.find(item => item.type === 'TEXT')?.content ?? '';
  const linkEvidence = audit.evidence.find(item => item.type === 'LINK');
  const capturedLinks: Array<{text:string;href:string}> = (() => {
    try { const parsed = JSON.parse(linkEvidence?.content ?? '[]'); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
  })();
  const trustSignals = summarizeTrustSignals({ title: page?.title ?? '', bodyText: capturedText, links: capturedLinks });
  const candidatePromises = capturedText.split(/(?<=[.!?])\s+/)
    .map(sentence => sentence.trim())
    .filter(sentence => /free shipping|free delivery|guarantee|warranty|return policy|refund|best[- ]selling|number one|#1|100%|clinically proven|same.day delivery|fast delivery|lifetime access|free trial|save \d+/i.test(sentence))
    .slice(0, 8);
  const seoFindings = audit.findings.filter(item => /title|meta description|canonical|h1|heading|structured data|image elements missing alternative text|accessible text label|http error|product structured data/i.test(item.title));
  const structuredEvidence = audit.evidence.find(item => item.type === 'STRUCTURED_DATA');
  const structuredDataStats = (() => {
    try {
      const scripts = JSON.parse(structuredEvidence?.content ?? '[]');
      const parsed = Array.isArray(scripts) ? scripts.filter((item) => typeof item === 'string' && item.trim()) : [];
      const valid = parsed.filter((item) => { try { JSON.parse(item); return true; } catch { return false; } }).length;
      return { total: parsed.length, valid, invalid: parsed.length - valid };
    } catch { return { total: 0, valid: 0, invalid: 0 }; }
  })();
  const frictionGroups = [
    { title: 'Offer & value clarity', pattern: /value proposition|benefit|offer|price/i },
    { title: 'Product suitability & details', pattern: /product detail|specification|compatibility|size|fit|ingredient|dimension/i },
    { title: 'Trust & post-purchase expectations', pattern: /trust|shipping|delivery|return|refund|warranty|support|proof|claim/i },
    { title: 'Action & experience friction', pattern: /commercial action|purchase action|viewport|mobile|overflow|button|link|image/i },
  ].map(group => ({ ...group, findings: audit.findings.filter(item => group.pattern.test(item.title + ' ' + item.observation)) }));

  return <main className="dashboard">
    <AuditStatusRefresh active={active} auditId={audit.id} />
    <header className="topbar"><Link href="/dashboard" className="brand">PageFix <span>AI</span></Link><div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}><Link href="/dashboard">Dashboard</Link>{audit.status === "COMPLETED" && <RecheckAuditButton auditId={audit.id} />}</div></header>
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
          <div className="label">COMMERCE CLARITY SCORECARD</div>
          <h2>What the captured page tells us</h2>
          <p className="muted" style={{ fontSize: 12, lineHeight: 1.8 }}>Qualitative, evidence-led assessments—not a universal conversion score. Each state reflects signals recorded during this inspection; it does not predict sales or prove that an issue causes customer behaviour.</p>
          <div className="clarity-scorecard-grid">
            {scorecard.map(item => <article className="clarity-scorecard-item" key={item.key}>
              <div className="clarity-scorecard-top"><strong>{item.title}</strong><span className={`clarity-state ${item.state === 'Strong signals in capture' ? 'clarity-strong' : item.state === 'Partial signals' ? 'clarity-partial' : item.state === 'Needs review' ? 'clarity-review' : 'clarity-unknown'}`}>{item.state}</span></div>
              <p>{item.explanation}</p><small>{item.basis}</small>
            </article>)}
          </div>
        </section>
        <section className="card" style={{ marginTop: 24 }}>
          <div className="label">AI ENRICHMENT STATUS</div>
          <h2>{latestJob?.errorCode === 'AI_REASONING_UNAVAILABLE' ? 'AI interpretation was unavailable' : 'AI interpretation status'}</h2>
          {latestJob?.errorCode === 'AI_REASONING_UNAVAILABLE' ? <>
            <p className="muted">The deterministic audit completed, but optional AI text enrichment was skipped or failed for this run.</p>
            {latestJob.errorMessage && <p role="status" className="muted">{latestJob.errorMessage}</p>}
            <p className="muted">To enable AI interpretation, configure a valid OPENAI_API_KEY or AI_PROVIDER_KEY in Vercel project environment variables and redeploy. Do not paste secret keys into chat. The report&apos;s evidence-backed checks remain available without AI.</p>
          </> : <>
            <p className="muted">No AI provider error was recorded for this audit. Optional AI interpretation uses captured text and evidence; it does not currently inspect screenshot pixels. Findings still require evidence IDs and do not establish revenue or conversion impact.</p>
          </>}
        </section>
        <section className="card" style={{ marginTop: 24 }}>
          <h2>Captured page views</h2>
          <p className="muted" style={{ fontSize: 12 }}>PageFix attempts a desktop and mobile screenshot during the audit. If capture or storage is blocked by the target page or runtime, use the retry button; no screenshot is invented. Stored images are private and accessible only to the audit owner.</p>
          {(!hasDesktopScreenshot || !hasMobileScreenshot) && <p className="muted">{hasDesktopScreenshot || hasMobileScreenshot ? 'One viewport is stored. The viewer below can retry missing or unreadable screenshots.' : 'No stored screenshots are available yet. The viewer below can capture desktop and mobile views.'}</p>}
          <AuditScreenshotPanel
            auditId={audit.id}
            screenshots={audit.screenshots.filter(item => item.storageUrl).map(item => ({ viewport: item.viewport, createdAt: item.createdAt.toISOString() }))}
          />
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
        <section id="buyer-decision-intelligence" className="card" style={{ marginTop: 24 }}>
          <div className="label">PHASE 3 / CUSTOMER BUYING DECISIONS</div>
          <h2>Buyer decision intelligence</h2>
          <p className="muted">This section maps likely decision questions to the captured page. These are structured hypotheses about information buyers may need—not actual customer interviews or recorded objections.</p>
          <div className="grid grid-3">
            <div className="card"><div className="label">Questions reviewed</div><div className="stat">{audit.buyerQuestions.length}</div></div>
            <div className="card"><div className="label">Signals observed</div><div className="stat">{audit.buyerQuestions.filter(item => item.status === 'OBSERVED_IN_CAPTURED_PAGE').length}</div></div>
            <div className="card"><div className="label">Not observed</div><div className="stat">{audit.buyerQuestions.filter(item => item.status !== 'OBSERVED_IN_CAPTURED_PAGE').length}</div></div>
          </div>
          <div className="grid grid-2" style={{marginTop:14}}>
            {trustSignals.map(signal => <article className="finding" key={signal.key}>
              <strong>{signal.label}</strong><p className="muted">{signal.status}</p>
            </article>)}
          </div>
          <section style={{marginTop:18}}>
            <h3>Recommended decision sequence</h3>
            <p className="muted">Use this order as a review guide, not a claim about the page&apos;s exact visual order: (1) clear offer and audience, (2) verified benefits and suitability details, (3) supporting proof where authentic, (4) price and purchase conditions, (5) delivery/returns/support, (6) clear next action.</p>
          </section>
          <section style={{marginTop:18}}>
            <h3>Friction debt — grouped issues</h3>
            <p className="muted">Groups below organise detected findings by buyer journey. Counts are issue counts, not estimated money lost.</p>
            <div className="grid grid-2">
              {frictionGroups.map(group => <article className="finding" key={group.title}>
                <div style={{display:'flex',justifyContent:'space-between',gap:12}}><strong>{group.title}</strong><span className="badge">{group.findings.length} finding(s)</span></div>
                {group.findings.length ? <ul>{group.findings.slice(0,4).map(item=><li key={item.id}>{item.title}</li>)}</ul> : <p className="muted">No related finding was produced by this inspection. This is not proof that no issue exists.</p>}
              </article>)}
            </div>
          </section>
          <section style={{marginTop:18}}>
            <h3>Candidate promises found in captured text</h3>
            <p className="muted">These are extracted wording candidates for human review, not verified facts or proof of a contradiction.</p>
            <CandidatePromises claims={candidatePromises} sourceUrl={audit.url} auditId={audit.id} />
          </section>
          <div style={{marginTop:16}}><Link className="button button-secondary" href="/dashboard/intelligence/claims">Review claims in Promise Ledger →</Link></div>
        </section>
        <section id="technical-seo-readiness" className="card" style={{ marginTop: 24 }}>
          <div className="label">TECHNICAL DISCOVERY / SEO</div>
          <h2>SEO & product data readiness</h2>
          <p className="muted">Observable technical checks only. This is not a ranking score, a complete Schema.org validator, or a prediction of search traffic.</p>
          <div className="grid grid-3">
            <div className="card"><div className="label">Document title</div><p>{page?.title || 'Not observed'}</p><span className="badge">{page?.title ? 'Observed' : 'Needs review'}</span></div>
            <div className="card"><div className="label">Meta description</div><p>{page?.metaDescription || 'Not observed'}</p><span className="badge">{page?.metaDescription ? 'Observed' : 'Needs review'}</span></div>
            <div className="card"><div className="label">Canonical URL</div><p style={{overflowWrap:'anywhere'}}>{page?.canonical || 'Not observed'}</p><span className="badge">{page?.canonical ? 'Observed' : 'Needs review'}</span></div>
          </div>
          <div className="grid grid-3" style={{marginTop:14}}>
            <div className="card"><div className="label">Structured-data scripts</div><div className="stat">{structuredDataStats.total}</div></div>
            <div className="card"><div className="label">Valid JSON parsed</div><div className="stat">{structuredDataStats.valid}</div></div>
            <div className="card"><div className="label">Invalid JSON</div><div className="stat">{structuredDataStats.invalid}</div></div>
          </div>
          <h3 style={{marginTop:18}}>Technical findings ({seoFindings.length})</h3>
          {seoFindings.length ? seoFindings.map(item=><article className="finding" key={item.id}><div className="fix-row-top"><span className="badge">{item.priority.replaceAll('_',' ')}</span><span className="badge">{item.severity}</span></div><h3>{item.title}</h3><p>{item.observation}</p><p><strong>Recommended fix:</strong> {item.recommendation}</p><details><summary>Evidence</summary>{item.evidence.map(link=><div key={link.evidenceId} style={{ marginTop: 10 }}><div className="muted">{link.evidence.location || link.evidence.source}</div><AuditEvidenceViewer evidence={link.evidence} baseUrl={audit.url} /></div>)}</details></article>) : <p className="muted">No SEO-related finding was generated by these checks. Review the metadata and structured-data observations above; absence of a finding does not guarantee search readiness.</p>}
        </section>
        <AuditSeverityChart findings={audit.findings} />
        <section id="prioritized-findings" className="card" style={{ marginTop: 24 }}>
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
              <details><summary>Evidence ({f.evidence.length} linked item{f.evidence.length === 1 ? '' : 's'})</summary>{f.evidence.map(link => <div key={link.evidenceId} style={{ marginTop: 10 }}><span className="badge">{link.evidence.type}</span><AuditEvidenceViewer evidence={link.evidence} baseUrl={audit.url} /></div>)}</details>
            </article>;
          })}
        </section>
        <p className="muted" style={{ fontSize: 12, marginTop: 18 }}>This report reflects the page state captured at audit time. Findings do not establish conversion impact, revenue loss, search rankings or customer behavior. A missing finding does not prove the absence of a problem.</p>
      </>}
    </div>
  </main>;
}
