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
      pages: { select: { statusCode: true, title: true, canonical: true, metaDescription: true }, orderBy: { createdAt: 'desc' }, take: 1 },
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
        <Link className="button button-secondary" href={`/dashboard/ai-help?topic=${module}`}>Ask PageFix AI →</Link>
        <Link className="primary-button" href="/dashboard">Run an inspection →</Link>
      </div>
    </header>
    <div className="container dashboard-main">
      <div className="capability-detail-hero card">
        <div className="capability-workspace-top"><span>{capability.group}</span><span className={`capability-status ${statusClass}`}>{capability.status}</span></div>
        <h2>{capability.title}</h2><p>{capability.summary}</p>
        {latest ? <div className="capability-detail-actions">
          <Link href={`/dashboard/audits/${latest.id}${reportAnchor}`} className="primary-button">Open latest evidence →</Link>
          <Link href="/dashboard/audits" className="button button-secondary">Audit history</Link>
        </div> : <div className="capability-detail-actions"><Link href="/dashboard" className="primary-button">Run your first inspection →</Link></div>}
      </div>

      {!latest ? <section className="card" style={{marginTop:18}}>
        <h2>No completed inspection yet</h2><p className="muted">This module becomes actionable after PageFix has captured a public page. Run an inspection to populate this workspace with evidence and findings.</p>
        <Link className="primary-button" href="/dashboard">Start an inspection →</Link>
      </section> : <>
        <section className="card" style={{marginTop:18}}>
          <div className="label">LIVE WORKSPACE / LATEST COMPLETED INSPECTION</div>
          <h2 style={{overflowWrap:'anywhere'}}>{latest.url}</h2>
          <div className="grid grid-3">
            <div className="card"><div className="label">Findings in report</div><div className="stat">{latest.findings.length}</div></div>
            <div className="card"><div className="label">Relevant to this module</div><div className="stat">{relevantFindings.length}</div></div>
            <div className="card"><div className="label">Questions reviewed</div><div className="stat">{latest.buyerQuestions.length}</div></div>
          </div>
          <p className="muted">Data shown here comes from your saved inspection. The captured page does not reveal private analytics or actual customer behaviour.</p>
        </section>

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

        {(module === 'buyer-decisions' || module === 'return-risk') && <section id="buyer-decision-intelligence" className="card" style={{marginTop:18}}>
          <h2>{module === 'return-risk' ? 'Pre-purchase clarity and expectation coverage' : 'Buyer objection coverage'}</h2>
          <p className="muted">These are likely decision questions inferred from the offer category, not claims that real customers asked them.</p>
          {latest.buyerQuestions.map(question => <article className="finding" key={question.id} style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12}}>
            <div><strong>{question.question}</strong><p className="muted">Evidence references recorded: {Array.isArray(question.evidenceIds) ? question.evidenceIds.length : 0}</p></div>
            <span className={`badge ${question.status === 'OBSERVED_IN_CAPTURED_PAGE' ? '' : 'danger'}`}>{question.status === 'OBSERVED_IN_CAPTURED_PAGE' ? 'Signal observed' : 'Not observed'}</span>
          </article>)}
        </section>}

        {module === 'visual-inspection' && <section className="card" style={{marginTop:18}}>
          <h2>Captured viewport evidence</h2>
          <p className="muted">Screenshots are only shown when the inspection actually stored them.</p>
          <div className="grid grid-2">{latest.screenshots.filter(item=>item.storageUrl).map(item=><article className="finding" key={item.viewport}><h3>{item.viewport} view</h3><Link href={`/dashboard/audits/${latest.id}`}>Open stored screenshot and report →</Link></article>)}</div>
          {!latest.screenshots.some(item=>item.storageUrl) && <p className="muted">No screenshot is stored for this inspection. Open the report to request an available desktop/mobile capture.</p>}
        </section>}

        {['buyer-decisions','return-risk','clarity-scorecard','visual-inspection','seo-data','ai-search-readiness','store','copy-fixes','journey','experiments','verification','governance','workspaces','integrations','reports','inspection'].includes(module) && <IntelligenceActionPanel module={module} auditId={latest.id} auditUrl={latest.url} />}

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

      {!latest && ['buyer-decisions','return-risk','clarity-scorecard','visual-inspection','seo-data','ai-search-readiness','store','copy-fixes','journey','experiments','verification','governance','workspaces','integrations','reports','inspection'].includes(module) && <IntelligenceActionPanel module={module} />}

      <section className="grid grid-2" style={{marginTop:18}}>
        <section className="card"><h2>Scope of this module</h2><ul className="capability-detail-list">{capability.whatItDoes.map(item=><li key={item}>{item}</li>)}</ul></section>
        <section className="card"><h2>Limits and safeguards</h2><ul className="capability-detail-list">{capability.limits.map(item=><li key={item}>{item}</li>)}</ul></section>
      </section>
    </div>
  </main>;
}
