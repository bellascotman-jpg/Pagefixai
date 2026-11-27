import Link from 'next/link';

type Evidence = {
  id: string;
  type: string;
  source: string;
  location: string | null;
  content: string;
};
type Finding = {
  id: string;
  title: string;
  severity: string;
  confidence: string;
  priority: string;
  status: string;
  effort: string;
  observation: string;
  hypothesis: string | null;
  whyItMatters: string;
  recommendation: string;
  evidence: { evidenceId: string; evidence: Evidence }[];
};
type Capability = {
  slug: string;
  title: string;
  group: string;
  summary: string;
  whatItDoes: readonly string[];
  limits: readonly string[];
  next: string;
};
type Audit = {
  id: string;
  url: string;
  completedAt: Date | null;
  findings: Finding[];
  buyerQuestions: { id: string; question: string; status: string; evidenceIds: unknown }[];
  pages: { statusCode: number | null; title: string | null; canonical: string | null; metaDescription: string | null; visibleText: string | null }[];
  screenshots: { viewport: string; storageUrl: string | null }[];
  evidence: Evidence[];
};

type Props = {
  capability: Capability;
  audit: Audit | null;
  findings: Finding[];
};

const moduleCopy: Record<string, { problem: string; cost: string; visual: string; visualHelp: string; action: string }> = {
  inspection: {
    problem: '“I need to know exactly what PageFix inspected, what it could not reach, and which page issues deserve action first.”',
    cost: 'A shallow or unclear inspection can create false confidence and send the team after the wrong issue. Coverage and capture limitations must remain visible.',
    visual: 'What was actually captured from the inspected page?',
    visualHelp: 'The page fields below come from the saved HTML capture. Missing values are shown as unknown, not treated as confirmed defects.',
    action: 'Review the evidence behind each finding, address the highest-priority page issue, and run a fresh inspection to verify the change.',
  },
  store: {
    problem: '“I need to see which pages keep creating the same problems so my team can fix the source, not chase symptoms.”',
    cost: 'Repeated issues can consume review time and leave the same customer-facing friction across multiple inspected pages. This report counts only pages actually audited.',
    visual: 'Which issue themes repeat across this inspection?',
    visualHelp: 'Finding themes are grouped from the saved observations. A single-page audit cannot establish a store-wide pattern.',
    action: 'Consolidate the highest-priority repeated issues into one page or template change, then inspect the affected URLs again.',
  },
  retention: {
    problem: '“I need to know where a new customer gets stuck before I spend more time driving signups.”',
    cost: 'Unclear onboarding steps can increase support work and create activation risk. This public-page audit does not measure churn or prove why customers leave.',
    visual: 'Where does the supplied journey content create friction?',
    visualHelp: 'Only content submitted to the retention workflow or captured in this audit can support these signals. Unprovided product screens remain unknown.',
    action: 'Clarify the next action at the highest-friction step, make the success state explicit, and validate with real activation data.',
  },
  verification: {
    problem: '“I have changed the page; I need evidence that the original issue is no longer visible.”',
    cost: 'Without a fresh capture, a completed task can be mistaken for a verified resolution, allowing the same issue to return.',
    visual: 'What is the current recorded state of the findings?',
    visualHelp: 'Statuses are workflow records. Only a fresh recheck can provide new page evidence; a status change alone is not verification.',
    action: 'Run a recheck after publishing the change and compare the new source evidence with the original finding.',
  },
  workspaces: {
    problem: '“I need the right people to work on the right store without mixing client work or exposing private findings.”',
    cost: 'Unclear ownership can slow approvals and increase the risk of work being performed in the wrong account. This view reflects the signed-in account’s records only.',
    visual: 'How much of this report has traceable ownership and evidence?',
    visualHelp: 'This page summarises the current account’s saved audit records; it does not certify enterprise role permissions or multi-client isolation.',
    action: 'Keep client records in separate authorised accounts until membership permissions and client-data isolation have been verified; do not invite collaborators on the assumption that roles are complete.',
  },
  reports: {
    problem: '“I need a report my team or client can act on and trace back to the exact page evidence.”',
    cost: 'A recommendation without a source, scope or verification path creates review delays and makes it harder to agree on the next change.',
    visual: 'How much of this report is backed by linked evidence?',
    visualHelp: 'Evidence coverage counts findings with at least one linked saved evidence record. It measures traceability, not whether the interpretation is correct.',
    action: 'Use the account-owned report and JSON/CSV exports for internal review; do not treat an export as a revocable share link, and attach a recheck to any completed fix.',
  },
  governance: {
    problem: '“I need to know what PageFix actually observed, what it inferred, and what is still unknown before I approve a change.”',
    cost: 'Treating an assumption as a fact can lead to incorrect edits, unsupported claims or wasted implementation work.',
    visual: 'Where are the evidence and confidence gaps?',
    visualHelp: 'The chart counts saved evidence links and confidence labels. It does not independently certify the quality of each conclusion.',
    action: 'Review the cited source for each high-priority finding and downgrade or reject any conclusion the evidence does not support.',
  },
  'return-risk': {
    problem: '“I need shoppers to understand fit, compatibility, delivery and returns before they place an order.”',
    cost: 'Missing purchase details can create expectation gaps, extra support requests and avoidable returns. This report does not estimate an actual return rate.',
    visual: 'Which pre-purchase questions are not answered in the captured page?',
    visualHelp: 'Question states reflect what was or was not observed in the captured content, not questions reported by real customers.',
    action: 'Add seller-confirmed specifications, delivery conditions and return terms near the purchase decision, then inspect the page again.',
  },
  'copy-fixes': {
    problem: '“I need product copy that makes the value clear without inventing features, guarantees or product facts.”',
    cost: 'Vague copy can leave shoppers uncertain; unsupported copy can create trust, compliance and fulfilment problems.',
    visual: 'Which copy-related issues are supported by the captured page?',
    visualHelp: 'These counts are drawn from matched findings. Suggested wording remains a draft until the seller confirms every factual claim.',
    action: 'Rewrite the highest-priority message using only verified product facts, preserve important conditions, and recheck the published page.',
  },
  'visual-inspection': {
    problem: '“I need to see what shoppers can actually see on a phone and on a desktop before I change the layout.”',
    cost: 'A poorly presented first view can hide key information or actions. Screenshot capture is shown only when a stored image exists.',
    visual: 'Which viewport evidence is available for review?',
    visualHelp: 'A screenshot is a point-in-time visual capture, not proof that every responsive state or interactive flow works.',
    action: 'Review the stored viewport captures, correct the visible hierarchy, and repeat the capture after publishing.',
  },
  journey: {
    problem: '“I need the promise in my campaign to match what shoppers see after they click through.”',
    cost: 'A mismatch in product, offer or conditions can create confusion between the ad and landing page. This report does not measure wasted ad spend.',
    visual: 'Where do captured message and offer signals concentrate?',
    visualHelp: 'Only supplied source copy and captured destination content can be compared. Ad delivery, audience response and checkout behaviour are not measured here.',
    action: 'Align the destination headline, product, price conditions and call to action with the approved campaign promise, then inspect the handoff again.',
  },
  'seo-data': {
    problem: '“I need search systems and shoppers to receive a clear, consistent description of this page.”',
    cost: 'Missing or conflicting page signals can make the page harder to interpret and share. This audit does not predict rankings or confirm indexing.',
    visual: 'Which technical page signals were captured?',
    visualHelp: 'Values below come from the saved HTML capture. “Not observed” means the field was not recorded; it does not prove the live page lacks it.',
    action: 'Review the page title, description, canonical and structured data in the site editor, then run a fresh inspection.',
  },
};

function severityClass(value: string) {
  return value === 'HIGH' ? 'risk' : value === 'MEDIUM' ? 'watch' : 'good';
}
function themeFor(finding: Finding) {
  const value = `${finding.title} ${finding.observation}`.toLowerCase();
  if (/shipping|delivery|return|refund|warranty|fit|size|compatib/.test(value)) return 'Purchase expectations';
  if (/mobile|viewport|image|visual|layout|overflow|alt text/.test(value)) return 'Visual experience';
  if (/seo|meta|canonical|schema|structured data|heading|title/.test(value)) return 'Search & page data';
  if (/claim|promise|trust|proof|guarantee|review/.test(value)) return 'Trust & promises';
  if (/headline|copy|description|benefit|message|offer|price|cta|button/.test(value)) return 'Message & offer clarity';
  if (/onboard|activation|signup|cancel|retention|journey/.test(value)) return 'Journey & activation';
  return 'Other page signals';
}

function Block({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return <section className="pf-report-block">
    <div className="pf-block-heading"><span>{number}</span><h2>{title}</h2></div>
    {children}
  </section>;
}

export default function IntelligenceModuleReport({ capability, audit, findings }: Props) {
  const copy = moduleCopy[capability.slug] ?? {
    problem: `“I need a clear, evidence-backed view of ${capability.title.toLowerCase()} so I can decide what to change next.”`,
    cost: 'Unclear findings can slow decisions. Any business impact must be validated with seller-authorised data.',
    visual: 'Where do the recorded findings concentrate?',
    visualHelp: 'Counts reflect the latest saved inspection only.',
    action: capability.next,
  };
  if (!audit) return <div className="pf-audit-report">
    <div className="pf-report-meta"><span>{capability.group.toUpperCase()} / FIRST FEATURE REPORT</span><span>AWAITING FIRST COMPLETED INSPECTION</span></div>
    <Block number="01" title="The store-owner problem"><div className="pf-problem"><span>PROBLEM / BUSINESS CONSEQUENCE</span><h2>{copy.problem}</h2><p><strong>What it can cost:</strong> {copy.cost}</p></div></Block>
    <Block number="02" title="Inspection verdict"><div className="pf-verdict-grid"><article className="pf-verdict-card"><span>REPORT STATUS</span><strong>Awaiting data</strong><small>No completed inspection is available in this account.</small></article><article className="pf-risk-card watch"><span>REVIEW PRIORITY</span><strong>Not assessed</strong><small>No score or risk level is invented before a capture.</small></article><article className="pf-verdict-card"><span>FINDINGS</span><strong>—</strong><small>Will be calculated from the first completed inspection.</small></article><article className="pf-verdict-card"><span>EVIDENCE</span><strong>—</strong><small>No source records are available yet.</small></article></div></Block>
    <Block number="03" title={copy.visual}><div className="pf-chart-card"><p>{copy.visualHelp}</p><div className="pf-empty-inline">This visual will populate from saved audit data after the first completed inspection. No sample bars or placeholder scores are shown.</div></div></Block>
    <Block number="04" title="Evidence and source traceability"><div className="pf-empty-inline">No page capture or evidence records exist yet. PageFix will show source excerpts, capture locations and evidence identifiers here after an inspection.</div><div className="pf-explain-grid"><article><strong>What this module checks</strong><ul>{capability.whatItDoes.map(item => <li key={item}>{item}</li>)}</ul></article><article><strong>Limits and safeguards</strong><ul>{capability.limits.map(item => <li key={item}>{item}</li>)}</ul></article></div></Block>
    <Block number="05" title="Prioritised action and verification plan"><p className="pf-fix-intro">{copy.action}</p><div className="pf-report-footer"><Link className="button" href="/dashboard">Run the first inspection</Link><Link className="button" href="/dashboard/audits">Open audit history</Link></div></Block>
  </div>;

  const high = findings.filter(item => item.severity === 'HIGH').length;
  const medium = findings.filter(item => item.severity === 'MEDIUM').length;
  const low = findings.filter(item => item.severity === 'LOW').length;
  const linked = findings.filter(item => item.evidence.length > 0).length;
  const maxSeverity = Math.max(high, medium, low, 1);
  const groups = new Map<string, number>();
  findings.forEach(item => groups.set(themeFor(item), (groups.get(themeFor(item)) ?? 0) + 1));
  const themes = [...groups.entries()].sort((a, b) => b[1] - a[1]);
  const unanswered = audit.buyerQuestions.filter(item => item.status !== 'OBSERVED_IN_CAPTURED_PAGE').length;
  const page = audit.pages[0];
  const storedScreenshots = audit.screenshots.filter(item => item.storageUrl);
  const riskLabel = high > 0 ? 'High-priority review' : findings.length > 0 ? 'Review recommended' : 'No matching signal recorded';
  const evidenceRows = findings.flatMap(finding => finding.evidence.map(link => ({ finding, evidence: link.evidence })));
  const sortedFindings = [...findings].sort((a, b) => {
    const rank = (value: string) => value === 'FIX_NOW' ? 0 : value === 'FIX_NEXT' ? 1 : 2;
    return rank(a.priority) - rank(b.priority) || (a.severity === 'HIGH' ? -1 : a.severity === 'MEDIUM' ? 0 : 1);
  });

  return <div className="pf-audit-report">
    <div className="pf-report-meta"><span>{capability.group.toUpperCase()} / FEATURE REPORT</span><span>CAPTURED {audit.completedAt?.toLocaleString('en', { dateStyle: 'medium', timeStyle: 'short' }) ?? 'DATE NOT AVAILABLE'}</span></div>
    <div className="pf-audit-target"><span>INSPECTED SOURCE</span><strong>{audit.url}</strong><Link href={`/dashboard/audits/${audit.id}`}>Open complete audit record →</Link></div>

    <Block number="01" title="The store-owner problem">
      <div className="pf-problem">
        <span>PROBLEM / BUSINESS CONSEQUENCE</span>
        <h2>{copy.problem}</h2>
        <p><strong>What it can cost:</strong> {copy.cost}</p>
      </div>
    </Block>

    <Block number="02" title="Inspection verdict">
      <div className="pf-verdict-grid">
        <article className="pf-verdict-card"><span>FEATURE FINDINGS</span><strong>{findings.length}</strong><small>Matching findings in this saved inspection</small></article>
        <article className={`pf-risk-card ${high ? 'risk' : findings.length ? 'watch' : 'good'}`}><span>REVIEW PRIORITY</span><strong>{riskLabel}</strong><small>{high} high · {medium} medium · {low} low severity</small></article>
        <article className="pf-verdict-card"><span>EVIDENCE TRACEABILITY</span><strong>{linked} / {findings.length}</strong><small>Findings with at least one linked evidence record</small></article>
        <article className="pf-verdict-card"><span>UNANSWERED BUYER QUESTIONS</span><strong>{capability.slug === 'return-risk' ? unanswered : '—'}</strong><small>{capability.slug === 'return-risk' ? `Of ${audit.buyerQuestions.length} generated questions not observed in the capture` : 'Shown only in the buyer-question module'}</small></article>
      </div>
      <div className="pf-explain-grid">
        <article><strong>What is known</strong><p>{findings.length ? `${findings.length} matching finding(s) were saved from this page capture.` : 'No matching finding was recorded for this feature in the latest inspection.'}</p></article>
        <article><strong>What is not established</strong><p>Customer behaviour, conversion impact, revenue loss and private analytics are not established by a public-page capture.</p></article>
      </div>
    </Block>

    <Block number="03" title={copy.visual}>
      <div className="pf-chart-card">
        <p>{copy.visualHelp}</p>
        {capability.slug === 'visual-inspection' ? <div className="pf-viewport-grid">
          {storedScreenshots.length ? storedScreenshots.map(item => <article className="pf-viewport-card" key={item.viewport}><span>{item.viewport.toUpperCase()} CAPTURE</span><strong>Stored screenshot available</strong><Link href={`/dashboard/audits/${audit.id}`}>View image and capture details →</Link></article>) : <div className="pf-empty-inline">No desktop or mobile screenshot is stored for this inspection. The HTML findings remain available, but no visual image is being substituted.</div>}
        </div> : capability.slug === 'seo-data' ? <div className="pf-seo-grid">
          <article><span>HTTP STATUS</span><strong>{page?.statusCode ?? 'Not observed'}</strong></article>
          <article><span>PAGE TITLE</span><strong>{page?.title || 'Not observed'}</strong></article>
          <article><span>META DESCRIPTION</span><strong>{page?.metaDescription || 'Not observed'}</strong></article>
          <article><span>CANONICAL</span><strong>{page?.canonical || 'Not observed'}</strong></article>
          <article><span>VISIBLE TEXT</span><strong>{page?.visibleText?.length ?? 'Not captured'} characters</strong></article>
        </div> : capability.slug === 'verification' ? <div className="pf-verification-grid">
          {['OPEN','IN_PROGRESS','COMPLETED','VERIFIED','STILL_DETECTED','UNABLE_TO_VERIFY'].map(status => <article key={status}><span>{status.replaceAll('_', ' ')}</span><strong>{audit.findings.filter(item => item.status === status).length}</strong></article>)}
        </div> : capability.slug === 'workspaces' ? <div className="pf-verification-grid">
          <article><span>ACCOUNT-OWNED AUDIT RECORD</span><strong>Available</strong></article>
          <article><span>SAVED EVIDENCE RECORDS</span><strong>{audit.evidence.length}</strong></article>
          <article><span>TEAM ROLE PERMISSIONS</span><strong>Not verified</strong></article>
          <article><span>CLIENT DATA ISOLATION</span><strong>Not verified</strong></article>
          <article><span>ASSIGNMENTS & APPROVALS</span><strong>Not evidenced here</strong></article>
          <article><span>COLLABORATOR ACCESS</span><strong>Not evidenced here</strong></article>
        </div> : capability.slug === 'governance' ? <div className="pf-verification-grid">
          <article><span>FINDINGS WITH EVIDENCE</span><strong>{audit.findings.filter(item => item.evidence.length > 0).length} / {audit.findings.length}</strong></article>
          <article><span>HIGH CONFIDENCE</span><strong>{audit.findings.filter(item => item.confidence === 'HIGH').length}</strong></article>
          <article><span>MEDIUM CONFIDENCE</span><strong>{audit.findings.filter(item => item.confidence === 'MEDIUM').length}</strong></article>
          <article><span>LOW CONFIDENCE</span><strong>{audit.findings.filter(item => item.confidence === 'LOW').length}</strong></article>
          <article><span>UNLINKED FINDINGS</span><strong>{audit.findings.filter(item => item.evidence.length === 0).length}</strong></article>
          <article><span>SAVED EVIDENCE RECORDS</span><strong>{audit.evidence.length}</strong></article>
        </div> : capability.slug === 'reports' ? <div className="pf-verification-grid">
          <article><span>PAGE CAPTURE</span><strong>{page ? 'Available' : 'Not captured'}</strong></article>
          <article><span>FINDINGS</span><strong>{audit.findings.length}</strong></article>
          <article><span>EVIDENCE RECORDS</span><strong>{audit.evidence.length}</strong></article>
          <article><span>STORED SCREENSHOTS</span><strong>{storedScreenshots.length}</strong></article>
          <article><span>JSON EXPORT</span><strong>Available</strong></article>
          <article><span>CSV EXPORT</span><strong>Available</strong></article>
        </div> : capability.slug === 'return-risk' ? <div className="pf-verification-grid">
          <article><span>BUYER QUESTIONS REVIEWED</span><strong>{audit.buyerQuestions.length}</strong></article>
          <article><span>NOT OBSERVED</span><strong>{unanswered}</strong></article>
          <article><span>OBSERVED IN CAPTURE</span><strong>{audit.buyerQuestions.filter(item => item.status === 'OBSERVED_IN_CAPTURED_PAGE').length}</strong></article>
        </div> : <div className="pf-bars">
          {themes.length ? themes.map(([label, count], index) => <div className="pf-bar-row" key={label}><span className="pf-bar-rank">{String(index + 1).padStart(2, '0')}</span><span className="pf-bar-label">{label}</span><div className="pf-bar-track" role="img" aria-label={`${count} findings in ${label}`}><div className={`pf-bar-fill ${count ? 'has-value' : ''}`} style={{ width: `${count / Math.max(...themes.map(item => item[1]), 1) * 100}%` }} /></div><strong>{count}</strong></div>) : <div className="pf-empty-inline">No matching feature findings were recorded. This is not proof that the page is free of risk; it means the current inspection did not produce a matching signal.</div>}
        </div>}
      </div>
    </Block>

    <Block number="04" title="Evidence and source traceability">
      <div className="pf-evidence-head"><div><h3>Why PageFix raised these signals</h3><p>{evidenceRows.length} linked source record(s) across {linked} finding(s).</p></div><Link href={`/dashboard/audits/${audit.id}`}>Open full evidence viewer →</Link></div>
      {evidenceRows.length ? <div className="pf-evidence-list">{evidenceRows.map((row, index) => <article key={`${row.finding.id}-${row.evidence.id}-${index}`}>
        <div className="pf-chip-row"><span>{row.evidence.type.replaceAll('_', ' ')}</span><span>{row.finding.severity} SEVERITY</span><span>{row.finding.confidence} CONFIDENCE</span></div>
        <strong>{row.finding.title}</strong>
        <blockquote>{row.evidence.content.slice(0, 850)}</blockquote>
        <small>{row.evidence.location || row.evidence.source || 'Source location not recorded'} · Evidence ID {row.evidence.id.slice(0, 10)}</small>
      </article>)}</div> : <div className="pf-empty-inline">No linked evidence was saved for the matching findings. Do not act on an unsupported conclusion; open the complete audit record and validate the source before making changes.</div>}
      <div className="pf-explain-grid"><article><strong>What this module checks</strong><ul>{capability.whatItDoes.map(item => <li key={item}>{item}</li>)}</ul></article><article><strong>Limits and safeguards</strong><ul>{capability.limits.map(item => <li key={item}>{item}</li>)}</ul></article></div>
    </Block>

    <Block number="05" title="Prioritised action and verification plan">
      <p className="pf-fix-intro">{copy.action}</p>
      {sortedFindings.length ? <div className="pf-fix-list">{sortedFindings.map((finding, index) => <article className="pf-fix-card" key={finding.id}>
        <div className="pf-fix-top"><span>STEP {index + 1}</span><span className={severityClass(finding.severity)}>{finding.severity} SEVERITY</span><span>{finding.priority.replaceAll('_', ' ')}</span><span>{finding.confidence} CONFIDENCE</span><span>{finding.status.replaceAll('_', ' ')}</span></div>
        <h3>{finding.title}</h3><p><strong>Observed:</strong> {finding.observation}</p><p><strong>Why it matters:</strong> {finding.whyItMatters}</p><p><strong>Recommended correction:</strong> {finding.recommendation}</p>
        {finding.hypothesis && <small>Interpretation to validate: {finding.hypothesis}</small>}
        <div className="pf-fix-actions"><Link href={`/dashboard/audits/${audit.id}`}>Review and update finding →</Link></div>
      </article>)}</div> : <div className="pf-empty-inline">There are no feature-matched actions in this capture. Review the complete report for findings outside this module, then re-run the inspection after any page changes.</div>}
      <div className="pf-report-footer"><Link className="button button-secondary" href="/dashboard/fixes">Open Fix Center</Link> <Link className="button button-secondary" href={`/dashboard/audits/${audit.id}`}>Open recheck workflow</Link> <a className="button button-secondary" href={`/api/audits/${audit.id}/export`}>Export audit JSON</a> <a className="button button-secondary" href={`/api/audits/${audit.id}/export/csv`}>Export findings CSV</a></div>
    </Block>
  </div>;
}
