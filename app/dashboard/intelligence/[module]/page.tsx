import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { capabilities } from '@/lib/product/capabilities';

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
  const pattern = findingFilters[module] ?? /./;
  const relevantFindings = latest?.findings.filter(item => pattern.test(item.title + ' ' + item.observation + ' ' + item.recommendation)) ?? [];
  const statusClass = capability.status === 'Available in current workflow' ? 'status-available' : capability.status === 'Foundation / needs validation' ? 'status-foundation' : 'status-planned';
  const reportAnchor = module === 'seo-data' ? '#technical-seo-readiness' : module === 'buyer-decisions' || module === 'return-risk' ? '#buyer-decision-intelligence' : '#prioritized-findings';

  return <main className="dashboard">
    <header className="topbar">
      <div><div className="label">COMMERCE INTELLIGENCE / {capability.group.toUpperCase()}</div><h1 style={{fontSize:27,margin:'4px 0 0'}}>{capability.title}</h1></div>
      <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
        <Link className="button button-secondary" href="/dashboard/intelligence">All capabilities</Link>
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
          <p className="muted">This checks captured metadata and JSON parsing only. It does not predict rankings or replace a full structured-data validator.</p>
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

      <section className="grid grid-2" style={{marginTop:18}}>
        <section className="card"><h2>Scope of this module</h2><ul className="capability-detail-list">{capability.whatItDoes.map(item=><li key={item}>{item}</li>)}</ul></section>
        <section className="card"><h2>Limits and safeguards</h2><ul className="capability-detail-list">{capability.limits.map(item=><li key={item}>{item}</li>)}</ul></section>
      </section>
    </div>
  </main>;
}
