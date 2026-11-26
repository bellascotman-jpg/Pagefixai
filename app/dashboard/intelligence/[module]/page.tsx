import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { capabilities } from '@/lib/product/capabilities';
import IntelligenceActionPanel from '@/components/intelligence-action-panel';

const findingFilters: Record<string, RegExp> = {
  'buyer-decisions': /buyer|value proposition|proof|trust|claim|promise|purchase action|commercial action|shipping|return|refund|benefit|decision/i,
  'return-risk': /shipping|delivery|return|refund|exchange|size|fit|compatibility|ingredients|dimensions|product details|warranty/i,
  'seo-data': /title|meta description|canonical|h1|heading|structured data|product structured data|alternative text|accessible text label|http error/i,
  'visual-inspection': /viewport|mobile|overflow|image|visual|first viewport|above.fold/i,
  'copy-fixes': /value proposition|headline|description|benefit|product details|commercial action|recommendation|copy/i,
  'claims': /claim|contradiction|conflict|promise|shipping promise|warranty|return statement/i,
  'clarity-scorecard': /buyer|value|offer|trust|product|shipping|return|image|commercial action/i,
  'verification': /still detected|unable to verify|resolved|recheck|verification|recheck/i,
  'journey': /message|mismatch|journey|commercial action|checkout|shipping|offer|promise/i,
  'store': /product|store|shipping|return|support|price|purchase|image/i,
};

function safeJson(value: string | null | undefined): unknown {
  try { return JSON.parse(value ?? 'null'); } catch { return null; }
}

function snapshotValue(snapshot: unknown, key: string): string | number | null {
  if (!snapshot || typeof snapshot !== 'object') return null;
  const value = (snapshot as Record<string, unknown>)[key];
  return typeof value === 'string' || typeof value === 'number' ? value : null;
}

export default async function IntelligenceModulePage({ params }: { params: Promise<{ module: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect('/auth?mode=login');
  const { module } = await params;
  const capability = capabilities.find(item => item.slug === module);
  if (!capability) notFound();

  const audits = await db.audit.findMany({
    where: { userId: user.id, status: 'COMPLETED' },
    orderBy: { completedAt: 'desc' },
    take: 10,
    include: {
      findings: { include: { evidence: { include: { evidence: true } }, fix: true }, orderBy: [{ priority: 'asc' }, { severity: 'asc' }] },
      buyerQuestions: { orderBy: { createdAt: 'asc' } },
      pages: { select: { statusCode: true, title: true, canonical: true, metaDescription: true, visibleText: true }, orderBy: { createdAt: 'desc' }, take: 1 },
      screenshots: { select: { viewport: true, storageUrl: true }, orderBy: { createdAt: 'desc' } },
      evidence: { select: { id: true, type: true, source: true, location: true, content: true } },
    },
  });
  const latest = audits[0];
  const seoSnapshot = latest ? safeJson(latest.evidence.find(item => item.type === 'METADATA')?.content) : null;
  const pattern = findingFilters[module] ?? /./;
  const relevantFindings = latest?.findings.filter(item => pattern.test(item.title + ' ' + item.observation + ' ' + item.recommendation)) ?? [];
  const statusClass = capability.status === 'Available in current workflow' ? 'status-available' : capability.status === 'Foundation / needs validation' ? 'status-foundation' : 'status-planned';
  const reportAnchor = module === 'seo-data' ? '#technical-seo-readiness' : module === 'buyer-decisions' || module === 'return-risk' ? '#buyer-decision-intelligence' : '#prioritized-findings';

  return <main className="dashboard">
    <header className="topbar">
      <div><div className="label">COMMERCE INTELLIGENCE / {capability.group.toUpperCase()}</div><h1 style={{fontSize:27,margin:'4px 0 0'}}>{capability.title}</h1></div>
      <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
        <Link className="button button-secondary" href="/dashboard/intelligence">All capabilities</Link>
        {module !== 'buyer-decisions' && <Link className="button button-secondary" href={`/dashboard/ai-help?topic=${module}`}>Ask PageFix AI →</Link>}
        <Link className="primary-button" href="/dashboard">Run an inspection →</Link>
      </div>
    </header>
    <div className="container dashboard-main">
      <div className={module === 'buyer-decisions' ? 'buyer-problem-banner' : 'capability-detail-hero card'}>
        <div className="capability-workspace-top"><span className="buyer-problem-eyebrow">{module === 'buyer-decisions' ? 'BUYER DECISIONS / DIAGNOSE' : capability.group}</span><span className={`capability-status ${statusClass}`}>{capability.status}</span></div>
        <h2>{module === 'buyer-decisions' ? 'Why are shoppers hesitating when they are ready to buy?' : capability.title}</h2>
        <p>{module === 'buyer-decisions' ? 'When important questions go unanswered, shoppers may delay the decision or compare another store. Fixing the information gap gives them a clearer reason to move forward.' : capability.summary}</p>
        {latest ? <div className="capability-detail-actions"><Link href={`/dashboard/audits/${latest.id}${reportAnchor}`} className="primary-button">Open latest evidence →</Link><Link href="/dashboard/audits" className="button button-secondary">Audit history</Link></div> : <div className="capability-detail-actions"><Link href="/dashboard" className="primary-button">Run your first inspection →</Link></div>}
      </div>

      {!latest ? <section className={module === 'buyer-decisions' ? 'buyer-empty' : 'card'} style={{marginTop:18}}>
        <strong>{module === 'buyer-decisions' ? 'Your buyer-question review will appear here after the first audit' : 'No completed inspection yet'}</strong>
        <p>{module === 'buyer-decisions' ? 'PageFix will check the product page for answers about the offer, product details, trust, delivery and returns. No sample results are shown before an audit.' : 'This module becomes actionable after PageFix has captured a public page. Run an inspection to populate this workspace with evidence and findings.'}</p>
        <Link className="primary-button" href="/dashboard">Run your first inspection →</Link>
      </section> : <>
        {module === 'buyer-decisions' ? <section className="buyer-panel" style={{marginTop:18}}><div className="label">INSPECTED STORE PAGE</div><h2 style={{overflowWrap:'anywhere'}}>{latest.url}</h2><p>All results below are drawn from this completed inspection. A public page capture cannot reveal private analytics or confirm actual customer behaviour.</p><Link className="button button-secondary" href={`/dashboard/audits/${latest.id}`}>View complete audit record →</Link></section> : <section className="card" style={{marginTop:18}}>
          <div className="label">LIVE WORKSPACE / LATEST COMPLETED INSPECTION</div><h2 style={{overflowWrap:'anywhere'}}>{latest.url}</h2>
          <div className="grid grid-3"><div className="card"><div className="label">Findings in report</div><div className="stat">{latest.findings.length}</div></div><div className="card"><div className="label">Relevant to this module</div><div className="stat">{relevantFindings.length}</div></div><div className="card"><div className="label">Questions reviewed</div><div className="stat">{latest.buyerQuestions.length}</div></div></div>
          <p className="muted">Data shown here comes from your saved inspection. The captured page does not reveal private analytics or actual customer behaviour.</p></section>}

        {module === 'seo-data' && <section id="technical-seo-readiness" className="card" style={{marginTop:18}}>
          <h2>SEO & product data inspection</h2>
          <div className="grid grid-3">
            <div className="card"><div className="label">HTTP status</div><div className="stat">{latest.pages[0]?.statusCode ?? '—'}</div></div>
            <div className="card"><div className="label">Title</div><p>{latest.pages[0]?.title || 'Not observed in capture'}</p></div>
            <div className="card"><div className="label">Meta description</div><p>{latest.pages[0]?.metaDescription || 'Not observed in capture'}</p></div>
          </div>
          <div className="card" style={{marginTop:12}}><strong>Canonical URL</strong><p style={{overflowWrap:'anywhere'}}>{latest.pages[0]?.canonical || 'Not observed in capture'}</p></div>
          {(() => {
            const structured = latest.evidence.find(item => item.type === 'STRUCTURED_DATA');
            const scripts = safeJson(structured?.content);
            const entries = Array.isArray(scripts) ? scripts.filter(item => typeof item === 'string' && item.trim()) : [];
            const valid = entries.filter(item => safeJson(item as string) !== null).length;
            return <div className="grid grid-3" style={{marginTop:12}}>
              <div className="card"><div className="label">JSON-LD scripts</div><div className="stat">{entries.length}</div></div>
              <div className="card"><div className="label">Parseable JSON</div><div className="stat">{valid}</div></div>
              <div className="card"><div className="label">Needs JSON review</div><div className="stat">{entries.length-valid}</div></div>
            </div>;
          })()}
          <div className="grid grid-3" style={{marginTop:12}}>
            <div className="card"><div className="label">Robots directive</div><p>{snapshotValue(seoSnapshot, 'robots') ?? 'Not captured in this audit'}</p><p className="muted">An observed noindex directive needs intent review.</p></div>
            <div className="card"><div className="label">Mobile viewport</div><p>{snapshotValue(seoSnapshot, 'viewport') ?? 'Not captured in this audit'}</p><p className="muted">Review the responsive layout on real mobile widths.</p></div>
            <div className="card"><div className="label">HTML language</div><p>{snapshotValue(seoSnapshot, 'language') ?? 'Not captured in this audit'}</p><p className="muted">A useful accessibility and language signal; not a ranking score.</p></div>
            <div className="card"><div className="label">Open Graph title</div><p>{snapshotValue(seoSnapshot, 'ogTitle') ?? 'Not captured in this audit'}</p></div>
            <div className="card"><div className="label">Open Graph description</div><p>{snapshotValue(seoSnapshot, 'ogDescription') ?? 'Not captured in this audit'}</p></div>
            <div className="card"><div className="label">Heading outline</div><p>H1: {snapshotValue(seoSnapshot, 'h1Count') ?? '—'} · H2: {snapshotValue(seoSnapshot, 'h2Count') ?? '—'} · H3: {snapshotValue(seoSnapshot, 'h3Count') ?? '—'}</p></div>
            <div className="card"><div className="label">Image accessibility</div><p>{snapshotValue(seoSnapshot, 'imagesWithoutAlt') ?? '—'} of {snapshotValue(seoSnapshot, 'imageCount') ?? '—'} captured images missing alt text</p></div>
            <div className="card"><div className="label">Link inventory</div><p>{snapshotValue(seoSnapshot, 'internalLinks') ?? '—'} internal · {snapshotValue(seoSnapshot, 'externalLinks') ?? '—'} external</p></div>
            <div className="card"><div className="label">Structured data</div><p>{snapshotValue(seoSnapshot, 'structuredDataCount') ?? '—'} JSON-LD scripts · {snapshotValue(seoSnapshot, 'structuredDataInvalidCount') ?? '—'} invalid JSON</p></div>
          </div>
          <p className="muted" style={{marginTop:12}}>All values are from the captured HTML. “Not captured” means the audit did not store that field at the time; it is not evidence that the live page currently lacks it. This is not a ranking score, and PageFix does not claim to verify indexing, traffic or AI citations.</p>
          <div style={{marginTop:12}}><Link className="primary-button" href="/dashboard/ai-help">Ask PageFix AI to explain these SEO signals →</Link></div>
        </section>}

        {module === 'buyer-decisions' && (() => {
          const high = relevantFindings.filter(item => item.severity === 'HIGH').length;
          const medium = relevantFindings.filter(item => item.severity === 'MEDIUM').length;
          const low = relevantFindings.filter(item => item.severity === 'LOW').length;
          const unanswered = latest.buyerQuestions.filter(question => question.status !== 'OBSERVED_IN_CAPTURED_PAGE').length;
          const maxSeverity = Math.max(high, medium, low, 1);
          const verified = latest.findings.filter(item => item.status === 'VERIFIED').length;
          const stillDetected = latest.findings.filter(item => item.status === 'STILL_DETECTED').length;
          const evidenceRows = relevantFindings.flatMap(item => item.evidence.map(ref => ({ finding: item, evidence: ref.evidence })));
          return <div className="buyer-workspace" id="buyer-decision-intelligence">
            <section className="buyer-verdict">
              <div><div className="label">LATEST INSPECTION VERDICT</div><h2>{relevantFindings.length ? 'Buyer-facing gaps found in the captured page' : 'No matching buyer-decision finding was recorded'}</h2><p>{unanswered} of {latest.buyerQuestions.length} generated decision questions were not observed as addressed in this capture. This is a content review signal, not a measured abandonment rate.</p></div>
              <div><span className={`buyer-status-pill ${high ? 'risk' : unanswered ? 'watch' : relevantFindings.length ? 'watch' : 'neutral'}`}>{high ? 'High-priority review' : unanswered ? 'Needs attention' : relevantFindings.length ? 'Review recommended' : 'No signal recorded'}</span><div className="buyer-verdict-count"><strong>{unanswered}</strong><span className="muted">questions not observed</span></div></div>
            </section>
            <div className="buyer-chart-grid">
              <section className="buyer-panel">
                <div className="label">OBJECTION SEVERITY</div><h2>Where buyer hesitation signals cluster</h2><p>Counts reflect matching findings in this saved inspection, not customer-reported objections.</p>
                {[
                  {label:'High',count:high,tone:'high'},
                  {label:'Medium',count:medium,tone:'medium'},
                  {label:'Low',count:low,tone:'low'},
                ].map(row => <div className="buyer-severity-row" key={row.label}><span className="buyer-severity-label">{row.label} severity</span><div className="buyer-severity-track" role="img" aria-label={`${row.count} ${row.label.toLowerCase()} severity findings`}><div className={`buyer-severity-fill ${row.tone}`} style={{width:`${row.count / maxSeverity * 100}%`}} /></div><strong>{row.count}</strong></div>)}
              </section>
              <section className="buyer-panel">
                <div className="label">BUYER QUESTIONS</div><h2>Questions the page may leave open</h2><p>Generated from the product category and checked against captured page content.</p>
                {latest.buyerQuestions.length ? latest.buyerQuestions.map(question => <article className="buyer-question-card" key={question.id}><div><strong>{question.question}</strong><p>{Array.isArray(question.evidenceIds) ? question.evidenceIds.length : 0} linked evidence reference(s)</p></div><span className={`buyer-question-state ${question.status === 'OBSERVED_IN_CAPTURED_PAGE' ? 'observed' : ''}`}>{question.status === 'OBSERVED_IN_CAPTURED_PAGE' ? 'Observed' : 'Not observed'}</span></article>) : <div className="buyer-empty"><strong>No buyer questions were saved for this audit</strong><p>Run a new inspection to generate category-aware questions and check them against the captured page.</p></div>}
              </section>
            </div>
            <section className="buyer-panel">
              <div className="label">PLAIN-ENGLISH GUIDE</div><h2>What this means</h2><p>These terms explain the signals shown above and why they matter before checkout.</p>
              <div className="buyer-meaning-grid">
                <div className="buyer-meaning-item"><strong>Questions not observed</strong><p>Buyer questions for which the captured page did not record a clear answer. Missing information can make comparison and purchase decisions harder.</p></div>
                <div className="buyer-meaning-item"><strong>Finding severity</strong><p>The audit's HIGH, MEDIUM or LOW classification of an identified issue. It helps order review work; it is not a sales-loss estimate.</p></div>
                <div className="buyer-meaning-item"><strong>Evidence references</strong><p>Saved page excerpts or source locations attached to a finding. They let you inspect why PageFix raised the issue.</p></div>
              </div>
            </section>
            <section className="buyer-panel">
              <div className="label">SOURCE MATERIAL</div><h2>Evidence behind these findings</h2><p>Only excerpts saved with this inspection appear here. An inference is not presented as a direct customer statement.</p>
              {evidenceRows.length ? <div className="buyer-evidence-list">{evidenceRows.map((row,index) => <article className="buyer-evidence-item" key={`${row.finding.id}-${row.evidence.id}-${index}`}><div className="buyer-evidence-meta"><span>{row.evidence.type.replaceAll('_',' ')}</span><span>{row.finding.severity} severity</span></div><strong>{row.finding.title}</strong><blockquote>{row.evidence.content.slice(0,700)}</blockquote><p className="muted">{row.evidence.location || row.evidence.source || 'Source location not recorded'}</p></article>)}</div> : <div className="buyer-empty"><strong>No linked evidence excerpts were saved for these findings</strong><p>Open the full report to review all captured source records and limitations.</p></div>}
            </section>
            <section className="buyer-panel">
              <div className="label">PRIORITISED REMEDIATION</div><h2>How to fix it</h2><p>Start with the highest-priority saved findings. Effort and commercial impact are not estimated unless the audit contains verified inputs.</p>
              {relevantFindings.length ? <div className="buyer-fix-list">{relevantFindings.map(item => <article className="buyer-fix-card" key={item.id}><div><div className="buyer-fix-tags"><span>{item.priority.replaceAll('_',' ')}</span><span>{item.severity} severity</span><span>Effort: not estimated</span><span>Impact: not measured</span></div><h3>{item.title}</h3><p>{item.recommendation}</p></div><div className="buyer-fix-actions"><Link href={`/dashboard/audits/${latest.id}`}>Review evidence</Link><Link href={`/dashboard/audits/${latest.id}`}>Verify after change</Link></div></article>)}</div> : <div className="buyer-empty"><strong>No buyer-decision fixes were generated for this inspection</strong><p>Run another inspection after updating the product page to see whether new evidence supports a recommendation.</p></div>}
            </section>
            <section className="buyer-verification-strip"><div><strong>Before / after verification</strong><p>{verified || stillDetected ? `${verified} finding(s) marked verified and ${stillDetected} still detected in the saved status record.` : 'A before-and-after comparison will appear after a fresh recheck creates a second inspection. No improvement is assumed.'}</p></div><Link href={`/dashboard/audits/${latest.id}`}>Open recheck workflow →</Link></section>
          </div>;
        })()}
        {module === 'return-risk' && <section id="buyer-decision-intelligence" className="card" style={{marginTop:18}}><h2>Pre-purchase clarity and expectation coverage</h2><p className="muted">These are likely decision questions inferred from the offer category, not claims that real customers asked them.</p>{latest.buyerQuestions.map(question => <article className="finding" key={question.id}><strong>{question.question}</strong><p className="muted">Evidence references recorded: {Array.isArray(question.evidenceIds) ? question.evidenceIds.length : 0}</p></article>)}</section>}

        {module === 'visual-inspection' && <section className="card" style={{marginTop:18}}>
          <h2>Captured viewport evidence</h2>
          <p className="muted">Screenshots are only shown when the inspection actually stored them.</p>
          <div className="grid grid-2">{latest.screenshots.filter(item=>item.storageUrl).map(item=><article className="finding" key={item.viewport}><h3>{item.viewport} view</h3><Link href={`/dashboard/audits/${latest.id}`}>Open stored screenshot and report →</Link></article>)}</div>
          {!latest.screenshots.some(item=>item.storageUrl) && <p className="muted">No screenshot is stored for this inspection. Open the report to request an available desktop/mobile capture.</p>}
        </section>}

        {['buyer-decisions','return-risk','clarity-scorecard','visual-inspection','seo-data','ai-search-readiness','store','copy-fixes','journey','experiments','verification','governance','workspaces','integrations','reports','inspection','competitors'].includes(module) && <IntelligenceActionPanel module={module} auditId={latest.id} auditUrl={latest.url} />}

        {module === 'store' && <section className="card" style={{marginTop:18}}>
          <div className="label">STORE-LEVEL AUDIT HISTORY</div><h2>Inspected pages and repeated signals</h2>
          <p className="muted">This view covers only the latest ten completed audits in this account; it is not a complete store catalogue unless those pages have all been inspected.</p>
          <div className="history-list">{audits.map(audit => {
            const repeated = audit.findings.reduce((acc, finding) => { const key = finding.title.trim().toLowerCase(); acc.set(key, (acc.get(key) || 0) + 1); return acc; }, new Map<string, number>());
            return <article className="history-row" key={audit.id}><div className="history-symbol">▦</div><div className="history-detail"><strong>{audit.url}</strong><span>{audit.completedAt?.toLocaleString() ?? 'Completion date unavailable'} · {audit.findings.length} findings</span></div><div className="history-metrics"><span>{[...repeated.values()].filter(count => count > 1).length} repeated titles in this audit</span><Link href={`/dashboard/audits/${audit.id}`}>Open evidence →</Link></div></article>;
          })}</div>
        </section>}

        {module === 'clarity-scorecard' && <section className="card" style={{marginTop:18}}>
          <div className="label">EXPLAINABLE SIGNAL SUMMARY</div><h2>Seven clarity dimensions</h2>
          <p className="muted">The cards below show evidence-linked signal counts from this audit, not a conversion score or a prediction of buyer behaviour.</p>
          <div className="grid grid-3">{[
            ['Product information', /product|specification|dimension|size|compatibility|detail/i],
            ['Objection coverage', /buyer|question|objection|answer|shipping|return|refund/i],
            ['Offer clarity', /offer|price|discount|subscription|commercial action|cta/i],
            ['Trust and proof', /trust|proof|review|warranty|guarantee|claim/i],
            ['Usability', /viewport|mobile|navigation|image|alt text|accessibility/i],
            ['Consistency', /claim|contradiction|promise|mismatch|inconsistent/i],
            ['Post-purchase expectations', /delivery|shipping|return|refund|exchange|warranty/i],
          ].map(([label, regex]) => { const count = latest.findings.filter(finding => (regex as RegExp).test(finding.title + ' ' + finding.observation + ' ' + finding.recommendation)).length; return <div className="card" key={label as string}><div className="label">{label as string}</div><div className="stat">{count}</div><p className="muted">{count ? 'Related finding(s) captured' : 'No matching finding captured; this is not proof of completeness.'}</p></div>; })}</div>
        </section>}

        {module === 'ai-search-readiness' && <section className="card" style={{marginTop:18}}>
          <div className="label">ANSWER-ENGINE INTERPRETABILITY</div><h2>Captured signals</h2>
          <div className="grid grid-3">
            <div className="card"><div className="label">HTTP response</div><div className="stat">{latest.pages[0]?.statusCode ?? 'Unknown'}</div></div>
            <div className="card"><div className="label">Visible text captured</div><div className="stat">{latest.pages[0]?.visibleText?.length ?? 'Unknown'}</div><p className="muted">Character count, not a content-quality score.</p></div>
            <div className="card"><div className="label">Canonical signal</div><p style={{overflowWrap:'anywhere'}}>{latest.pages[0]?.canonical || 'Not captured'}</p></div>
            <div className="card"><div className="label">Page title</div><p>{latest.pages[0]?.title || 'Not captured'}</p></div>
            <div className="card"><div className="label">Meta description</div><p>{latest.pages[0]?.metaDescription || 'Not captured'}</p></div>
            <div className="card"><div className="label">Structured-data scripts</div><div className="stat">{snapshotValue(seoSnapshot, 'structuredDataCount') ?? 'Not captured'}</div></div>
          </div>
          <p className="muted">These are page-interpretability signals only. PageFix has not verified search indexing, crawler access, AI citations, rankings or traffic from this capture.</p>
        </section>}

        {module === 'verification' && <section className="card" style={{marginTop:18}}>
          <div className="label">RECHECK WORKFLOW</div><h2>Recheck status in the current inspection</h2>
          <div className="grid grid-3">
            {(['OPEN','IN_PROGRESS','COMPLETED','VERIFIED','STILL_DETECTED','UNABLE_TO_VERIFY'] as const).map(status => <div className="card" key={status}><div className="label">{status.replaceAll('_',' ')}</div><div className="stat">{latest.findings.filter(finding=>finding.status===status).length}</div></div>)}
          </div>
          <p className="muted">These are saved statuses, not proof that a new recheck ran. To verify a fix, run a fresh inspection after the change and compare the evidence.</p>
          <Link className="primary-button" href={`/dashboard/audits/${latest.id}`}>Open inspection and recheck options →</Link>
        </section>}

        {module === 'governance' && <section className="card" style={{marginTop:18}}>
          <div className="label">EVIDENCE GOVERNANCE</div><h2>Provenance and quality coverage</h2>
          <div className="grid grid-3">
            <div className="card"><div className="label">Evidence records</div><div className="stat">{latest.evidence.length}</div></div>
            <div className="card"><div className="label">Findings with linked evidence</div><div className="stat">{latest.findings.filter(finding=>finding.evidence.length>0).length} / {latest.findings.length}</div></div>
            <div className="card"><div className="label">Unknown / uncaptured signals</div><div className="stat">{latest.evidence.filter(item=>/not captured|unknown|unable to verify/i.test(item.content)).length}</div></div>
          </div>
          <p className="muted">Counts are derived from saved records. They do not certify the correctness of a finding; reviewers should open the source excerpt and confirm it supports the recommendation.</p>
        </section>}

        <section id="prioritized-findings" className="card" style={{marginTop:18}}>
          <div className="capability-workspace-top"><h2>{module === 'copy-fixes' ? 'Grounded fix and copy guidance' : module === 'claims' ? 'Claims and contradiction candidates' : 'Relevant findings from the latest inspection'}</h2><span className="badge">{relevantFindings.length} relevant</span></div>
          {relevantFindings.length === 0 ? <div className="empty-state"><h3>No matching finding in this inspection</h3><p className="muted">This means the current rules did not produce a matching finding for this module; it does not prove the page has no issue.</p><Link className="button button-secondary" href={`/dashboard/audits/${latest.id}`}>Review full audit report →</Link></div> : relevantFindings.map(item=><article className="finding" key={item.id}>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}><span className="badge">{item.priority.replaceAll('_',' ')}</span><span className={`badge ${item.severity === 'HIGH' ? 'danger' : ''}`}>{item.severity}</span><span className="badge">{item.confidence} confidence</span></div>
            <h3>{item.title}</h3><p><strong>Captured observation:</strong> {item.observation}</p><p><strong>Why it matters:</strong> {item.whyItMatters}</p><p><strong>Recommended action:</strong> {item.recommendation}</p>
            <details><summary>Evidence and source references ({item.evidence.length})</summary>{item.evidence.map(ref=><div key={ref.evidenceId} style={{marginTop:8}}><span className="badge">{ref.evidence.type}</span><p className="muted">{ref.evidence.location || ref.evidence.source}</p><p style={{overflowWrap:'anywhere'}}>{ref.evidence.content.slice(0,900)}</p></div>)}</details>
          </article>)}
          <div style={{marginTop:14}}><Link className="button button-secondary" href={`/dashboard/audits/${latest.id}`}>Open full report →</Link></div>
        </section>
      </>}

      {!latest && ['buyer-decisions','return-risk','clarity-scorecard','visual-inspection','seo-data','ai-search-readiness','store','copy-fixes','journey','experiments','verification','governance','workspaces','integrations','reports','inspection','competitors'].includes(module) && <IntelligenceActionPanel module={module} />}

      <section className="grid grid-2" style={{marginTop:18}}>
        <section className="card"><h2>Scope of this module</h2><ul className="capability-detail-list">{capability.whatItDoes.map(item=><li key={item}>{item}</li>)}</ul></section>
        <section className="card"><h2>Limits and safeguards</h2><ul className="capability-detail-list">{capability.limits.map(item=><li key={item}>{item}</li>)}</ul></section>
      </section>
    </div>
  </main>;
}
