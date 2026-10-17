import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db';
import FindingStatusControl from '@/components/finding-status-control';

function categoryFor(title: string) {
  const value = title.toLowerCase();
  if (/seo|meta|canonical|structured data|schema|index/i.test(value)) return 'SEO & product data';
  if (/mobile|viewport|overflow|visual|image|layout/i.test(value)) return 'Visual & mobile experience';
  if (/price|pricing|discount|offer|shipping|delivery|return|refund|policy/i.test(value)) return 'Offer & purchase confidence';
  if (/cta|button|form|checkout|cart|purchase|buy|link/i.test(value)) return 'Conversion path';
  if (/trust|support|contact|claim|promise|proof/i.test(value)) return 'Trust & reassurance';
  if (/headline|value proposition|benefit|description|content|heading/i.test(value)) return 'Messaging & content';
  return 'Other observations';
}

const severityRank: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
const priorityRank: Record<string, number> = { FIX_NOW: 0, FIX_NEXT: 1, FIX_LATER: 2 };

export default async function FixCenterPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth?mode=login');
  const findings = await db.finding.findMany({
    where: { audit: { userId: user.id } },
    orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
    take: 100,
    include: { audit: { select: { id: true, url: true, createdAt: true, status: true } }, fix: true, evidence: { include: { evidence: { select: { id: true, source: true, location: true, content: true } } } } },
  });
  const ordered = [...findings].sort((a, b) =>
    (priorityRank[a.priority] ?? 3) - (priorityRank[b.priority] ?? 3) ||
    (severityRank[a.severity] ?? 3) - (severityRank[b.severity] ?? 3) ||
    (a.confidence === 'HIGH' ? 0 : a.confidence === 'MEDIUM' ? 1 : 2) - (b.confidence === 'HIGH' ? 0 : b.confidence === 'MEDIUM' ? 1 : 2) ||
    b.createdAt.getTime() - a.createdAt.getTime()
  );
  const verified = findings.filter(f => f.status === 'VERIFIED').length;
  const inProgress = findings.filter(f => f.status === 'IN_PROGRESS').length;
  const sourceAuditIds = [...new Set(findings.map(f => f.audit.id))];
  const remediationHistory = sourceAuditIds.length ? await db.recheck.findMany({
    where: { previousAuditId: { in: sourceAuditIds } },
    orderBy: { createdAt: 'desc' },
    take: 30,
    select: { id: true, previousAuditId: true, auditId: true, result: true, engineVersion: true, createdAt: true },
  }) : [];
  const groups = new Map<string, typeof ordered>();
  for (const finding of ordered) {
    const category = categoryFor(finding.title);
    groups.set(category, [...(groups.get(category) ?? []), finding]);
  }
  return <main className="dashboard">
    <header className="topbar"><div><div className="label">WORKSPACE / REMEDIATION</div><h1 style={{fontSize:26,margin:'4px 0 0'}}>Fix center</h1></div><Link className="button button-secondary" href="/dashboard/audits">Audit history</Link></header>
    <div className="container dashboard-main">
      <p className="muted">A prioritized, evidence-linked work order. Start with high-severity, high-confidence items; mark work in progress or completed, then reinspect the source page. A seller-completed fix is not the same as an evidence-verified resolution.</p>
      <div className="grid grid-3" style={{margin:'24px 0'}}>
        <div className="card"><div className="label">Findings tracked (latest 100)</div><div className="stat">{findings.length}</div></div>
        <div className="card"><div className="label">In progress</div><div className="stat">{inProgress}</div></div>
        <div className="card"><div className="label">Verified by recheck</div><div className="stat">{verified}</div></div>
      </div>
      {findings.length===0 ? <section className="card empty-state"><h2>Your fix queue is empty</h2><p className="muted">Run an audit to create evidence-linked findings and remediation guidance.</p><Link className="primary-button" href="/dashboard">Start an audit</Link></section> : Array.from(groups.entries()).map(([category, items]) =>
        <section key={category} style={{marginBottom:28}}>
          <div className="section-heading"><div><div className="label">REMEDIATION CATEGORY</div><h2>{category}</h2></div><span className="badge">{items.length} {items.length===1?'finding':'findings'}</span></div>
          <div className="grid" style={{gap:16}}>
            {items.map(f=><article className="fix-row card" key={f.id}>
              <div className="fix-row-top"><span className={`badge ${f.severity==='HIGH'?'danger':''}`}>{f.priority.replaceAll('_',' ')}</span><span className="muted" style={{fontSize:11}}>{f.severity} severity · {f.confidence} confidence · {f.effort} effort</span></div>
              <h3>{f.title}</h3>
              <p>{f.observation}</p>
              {f.hypothesis && <div><strong>Interpretation / hypothesis</strong><p>{f.hypothesis}</p></div>}
              <div className="fix-evidence">
                <strong>Why it matters</strong><p>{f.whyItMatters}</p>
                <strong>Potential consequence (not a measured outcome)</strong><p>{f.whyItMatters} This is a plausible risk, not a measured revenue loss or proven customer response.</p>
                <strong>Recommended fix</strong><p>{f.recommendation}</p>
                <strong>Implementation guidance</strong><p style={{whiteSpace:'pre-wrap'}}>{f.implementationSteps || 'Use the recommendation as the starting point. Confirm the relevant page/template and test the change before publishing.'}</p>
                <strong>Platform-specific check</strong><p>{/shopify/i.test(f.audit.url) ? 'Shopify: identify the relevant product, theme section or app responsible; preview the change in the theme editor and check desktop/mobile before publishing.' : /woocommerce|wordpress/i.test(f.audit.url) ? 'WordPress/WooCommerce: identify whether the content comes from the product editor, theme, block or SEO plugin; preview changes and check for duplicate metadata before publishing.' : /wix\.com/i.test(f.audit.url) ? 'Wix: identify the page or product field in the Wix editor, preview the page and confirm responsive behaviour before publishing.' : 'Platform not confidently identified from the URL. Confirm the site builder, page template and source of the content before editing; preview and inspect desktop/mobile after the change.'}</p>
                {f.copySuggestion && <><strong>Suggested content (review before publishing)</strong><p style={{whiteSpace:'pre-wrap'}}>{f.copySuggestion}</p><p className="muted">Treat this as draft wording. Confirm every product fact, price, policy, offer and claim against the business’s actual information before publishing.</p></>}
                <strong>Evidence & location</strong>
                {f.evidence.length ? <ul>{f.evidence.map(link=><li key={link.evidence.id}>{link.evidence.location ? <><strong>{link.evidence.location}</strong>: </> : null}{link.evidence.content || link.evidence.source}</li>)}</ul> : <p>No linked evidence was stored for this finding; review the audit report before acting.</p>}
                <strong>Known</strong><p>{f.observation} {f.evidence.length ? 'Linked capture evidence is listed above.' : 'No linked evidence is attached to this finding; validate the observation before acting.'}</p>
                <strong>Unknown / not established</strong><p>Actual revenue loss, conversion impact, customer behaviour, private analytics, and whether the issue affects every device or session are not established by public-page inspection alone.</p>
                <strong>Verification objective</strong><p>Make the observed condition change on the source page, then run a fresh inspection and compare its evidence. Absence from a new capture is not proof of a business outcome.</p>
              </div>
              <div className="fix-row-footer"><span className="badge">{f.status.replaceAll('_',' ')}</span><Link href={`/dashboard/audits/${f.audit.id}`}>Open audit report →</Link><a href={f.audit.url} target="_blank" rel="noreferrer">Open source page ↗</a></div>
              <FindingStatusControl id={f.id} initialStatus={f.status} />
            </article>)}
          </div>
        </section>
      )}
      <section className="card" style={{marginTop:28}}>
        <div className="section-heading"><div><div className="label">AUDIT-BASED HISTORY</div><h2>Remediation recheck history</h2></div><span className="badge">{remediationHistory.length} records</span></div>
        <p className="muted">These records show rechecks linked to the original audits in your current Fix Center queue. A recheck result is a record of inspection evidence, not a commercial outcome.</p>
        {remediationHistory.length ? <div className="grid" style={{gap:10}}>{remediationHistory.map(item=><div key={item.id} style={{border:'1px solid var(--border, #ddd)',borderRadius:10,padding:12}}><div className="section-heading"><strong>{item.result.replaceAll('_',' ')}</strong><span className="muted">{item.createdAt.toLocaleString()}</span></div><p className="muted">Engine {item.engineVersion}</p><Link href={`/dashboard/audits/${item.auditId}`}>Open recheck report →</Link></div>)}</div> : <p className="muted">No rechecks are recorded for the audits currently represented in this queue. Recheck history is retained with the relevant audit records.</p>}
      </section>
      <p className="muted" style={{fontSize:12}}>Prioritization is based on recorded priority, severity, confidence and recency—not a prediction of ROI or conversion lift. Category labels are a navigation aid inferred from finding titles.</p>
    </div>
  </main>;
}
