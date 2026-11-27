import Link from 'next/link';

type Evidence = { id: string; type: string; source: string; location: string | null; content: string };
type Finding = {
  id: string; title: string; severity: string; confidence: string; effort: string; priority: string;
  observation: string; hypothesis: string | null; whyItMatters: string; recommendation: string;
  status: string; evidence: { evidence: Evidence }[];
};
type Question = { id: string; question: string; status: string; evidenceIds: unknown };
type Dimension = { key: string; title: string; state: string; explanation: string; basis: string; signalsObserved: number; signalsReviewed: number };
type Props = {
  feature: 'buyer-decisions' | 'clarity-scorecard';
  audit: { id: string; url: string; completedAt: Date | null };
  findings: Finding[];
  questions: Question[];
  dimensions: Dimension[];
};

const severityTone = (value: string) => value === 'HIGH' ? 'risk' : value === 'MEDIUM' ? 'watch' : 'good';
const effortLabel = (value: string) => value === 'LOW' ? 'Low' : value === 'MEDIUM' ? 'Medium' : value === 'HIGH' ? 'High' : 'Not recorded';
const dimensionTone = (state: string) => state === 'Strong signals in capture' ? 'good' : state === 'Partial signals' ? 'watch' : state === 'Needs review' ? 'risk' : 'unknown';

function Block({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return <section className="pf-report-block"><div className="pf-block-heading"><span>{number}</span><h2>{title}</h2></div>{children}</section>;
}

function BuyerBars({ findings }: { findings: Finding[] }) {
  const groups = [
    { label: 'Product information', match: /product|specification|dimension|size|fit|compatibility|ingredient|included/i },
    { label: 'Offer and value', match: /offer|price|value|benefit|discount|commercial action/i },
    { label: 'Trust and proof', match: /trust|proof|review|warranty|guarantee|claim|contact/i },
    { label: 'Delivery and returns', match: /shipping|delivery|return|refund|exchange/i },
    { label: 'Purchase action', match: /button|checkout|purchase|cart|call to action/i },
  ].map(group => ({ ...group, count: findings.filter(f => group.match.test(f.title + ' ' + f.observation + ' ' + f.recommendation)).length }))
    .sort((a, b) => b.count - a.count);
  const max = Math.max(1, ...groups.map(g => g.count));
  if (!findings.length) return <div className="pf-empty-inline">No buyer-decision findings were recorded in this inspection. That is not proof that every buyer question is answered.</div>;
  return <div className="pf-bars" role="img" aria-label="Ranked horizontal bars showing the number of saved findings in each buyer decision category">
    {groups.map((g, i) => <div className="pf-bar-row" key={g.label}><span className="pf-bar-rank">{i + 1}</span><span className="pf-bar-label">{g.label}</span><div className="pf-bar-track"><div className={`pf-bar-fill ${g.count ? 'has-value' : ''}`} style={{ width: `${g.count / max * 100}%` }} /></div><strong>{g.count}</strong></div>)}
  </div>;
}

function Radar({ dimensions }: { dimensions: Dimension[] }) {
  const points = dimensions.slice(0, 6).map((d, i) => {
    const value = d.signalsReviewed > 0 ? d.signalsObserved / d.signalsReviewed : null;
    const angle = -Math.PI / 2 + i * Math.PI / 3;
    const radius = value === null ? 0 : 24 + value * 76;
    return { ...d, x: 120 + Math.cos(angle) * radius, y: 120 + Math.sin(angle) * radius, angle, value };
  });
  const grid = [0.25, 0.5, 0.75, 1].map(level => Array.from({ length: 6 }, (_, i) => {
    const angle = -Math.PI / 2 + i * Math.PI / 3;
    return `${120 + Math.cos(angle) * (24 + level * 76)},${120 + Math.sin(angle) * (24 + level * 76)}`;
  }).join(' '));
  return <div className="pf-radar-wrap">
    <svg viewBox="0 0 240 240" role="img" aria-label="Radar chart of six clarity dimensions using observed signals divided by reviewed signals; unassessed dimensions are omitted from the plotted area">
      {grid.map((p, i) => <polygon key={i} points={p} fill="none" stroke="currentColor" opacity=".16" />)}
      {points.map(p => <line key={p.key} x1="120" y1="120" x2={120 + Math.cos(p.angle) * 100} y2={120 + Math.sin(p.angle) * 100} stroke="currentColor" opacity=".2" />)}
      <polygon points={points.filter(p => p.value !== null).map(p => `${p.x},${p.y}`).join(' ')} fill="#7c3aed" fillOpacity=".18" stroke="#7c3aed" strokeWidth="2.5" />
      {points.filter(p => p.value !== null).map(p => <circle key={p.key} cx={p.x} cy={p.y} r="4" fill="#7c3aed" />)}
    </svg>
    <div className="pf-radar-legend">{points.map(p => <div key={p.key}><span className={`pf-dot ${dimensionTone(p.state)}`} /><span>{p.title}</span><strong>{p.value === null ? 'Not assessed' : `${Math.round(p.value * 100)}%`}</strong></div>)}</div>
  </div>;
}

export default function FeatureAuditReport({ feature, audit, findings, questions, dimensions }: Props) {
  const isBuyer = feature === 'buyer-decisions';
  const unanswered = questions.filter(q => q.status !== 'OBSERVED_IN_CAPTURED_PAGE');
  const high = findings.filter(f => f.severity === 'HIGH').length;
  const medium = findings.filter(f => f.severity === 'MEDIUM').length;
  const riskLabel = high ? 'High-priority review' : medium ? 'Review recommended' : findings.length ? 'Monitor' : 'No matching findings recorded';
  const evidenceCount = findings.reduce((n, f) => n + f.evidence.length, 0);
  const allEvidence = findings.flatMap(f => f.evidence.map(ref => ({ finding: f, evidence: ref.evidence })));
  const sortedFindings = [...findings].sort((a, b) => {
    const rank = (s: string) => s === 'HIGH' ? 3 : s === 'MEDIUM' ? 2 : 1;
    return rank(b.severity) - rank(a.severity);
  });
  const answeredCount = questions.length - unanswered.length;

  return <div className="pf-audit-report">
    <div className="pf-report-meta"><span>FEATURE AUDIT REPORT</span><span>{audit.completedAt ? audit.completedAt.toLocaleString() : 'Completion time unavailable'}</span></div>
    <div className="pf-audit-target"><span>INSPECTED PAGE</span><strong>{audit.url}</strong><Link href={`/dashboard/audits/${audit.id}`}>Open complete audit record →</Link></div>

    <Block number="01" title="Problem">
      <div className="pf-problem"><span>THE STORE OWNER'S PROBLEM</span><h2>{isBuyer ? '“Shoppers may still have questions about this product before they feel ready to buy.”' : '“I need to know whether my product page makes the offer, trust signals and next step clear.”'}</h2><p>If important details are unclear, a shopper may pause, compare another store or misunderstand what they are buying. This audit does not measure the revenue cost; it identifies content gaps worth reviewing.</p></div>
    </Block>

    <Block number="02" title="Findings">
      <div className="pf-verdict-grid">
        <div className="pf-verdict-card"><span>{isBuyer ? 'BUYER QUESTIONS NOT OBSERVED' : 'CLARITY REVIEW VERDICT'}</span><strong>{isBuyer ? `${unanswered.length} / ${questions.length}` : riskLabel}</strong><small>{isBuyer ? 'Questions without a clear signal in the captured page' : `${findings.length} related findings in this inspection`}</small></div>
        <div className={`pf-risk-card ${high ? 'risk' : medium ? 'watch' : 'good'}`}><span>FINDING PRIORITY</span><strong>{riskLabel}</strong><small>{high} high · {medium} medium · {findings.filter(f => f.severity === 'LOW').length} low findings</small></div>
      </div>
      <div className="pf-chart-card">
        <div><span className="pf-eyebrow">PRIMARY VISUAL</span><h3>{isBuyer ? 'Buyer-decision findings cluster by information gap' : 'Clarity signals observed across six dimensions'}</h3><p>{isBuyer ? 'Bars count saved findings by topic. They do not represent customer complaints or conversion loss.' : 'The radar plots observed signals divided by reviewed signals. It is a coverage view, not a conversion score.'}</p></div>
        {isBuyer ? <BuyerBars findings={findings} /> : <Radar dimensions={dimensions.filter(d => d.key !== 'message-consistency' && d.key !== 'post-purchase').concat(dimensions.filter(d => d.key === 'post-purchase')).slice(0, 6)} />}
      </div>
      {isBuyer && <div className="pf-subpanel"><h3>Buyer questions needing review</h3>{questions.length ? <div className="pf-question-grid">{questions.map(q => <article key={q.id} className="pf-question-card"><strong>{q.question}</strong><span className={q.status === 'OBSERVED_IN_CAPTURED_PAGE' ? 'good' : 'watch'}>{q.status === 'OBSERVED_IN_CAPTURED_PAGE' ? 'Signal observed' : 'Not observed in capture'}</span><small>{Array.isArray(q.evidenceIds) ? q.evidenceIds.length : 0} linked evidence reference(s)</small></article>)}</div> : <div className="pf-empty-inline">No buyer-question records were saved for this audit.</div>}</div>}
    </Block>

    <Block number="03" title="Explanation">
      <div className="pf-explain-grid">
        {isBuyer ? <>
          <article><strong>Questions not observed</strong><p>The captured page did not show a clear answer to these generated buyer questions. This is a content signal, not proof a customer asked the question.</p></article>
          <article><strong>Finding severity</strong><p>High, medium and low help order review work. They do not estimate lost sales or prove customer behaviour.</p></article>
          <article><strong>Evidence references</strong><p>These are page excerpts and source locations saved during the inspection. They show what the recommendation is based on.</p></article>
        </> : dimensions.filter(d => d.key !== 'message-consistency').slice(0, 6).map(d => <article key={d.key}><strong>{d.title} · {d.state}</strong><p>{d.explanation} {d.basis}</p></article>)}
      </div>
    </Block>

    <Block number="04" title="Cause">
      <div className="pf-evidence-head"><div><h3>Evidence behind the findings</h3><p>{evidenceCount} linked evidence reference(s) from this saved inspection.</p></div><Link href={`/dashboard/audits/${audit.id}`}>Full evidence record →</Link></div>
      {allEvidence.length ? <div className="pf-evidence-list">{allEvidence.map((row, i) => <article key={row.evidence.id + row.finding.id + i}><div className="pf-chip-row"><span>{row.evidence.type.replaceAll('_', ' ')}</span><span>{row.finding.severity} severity</span><span>{row.evidence.source}</span></div><strong>{row.finding.title}</strong><blockquote>{row.evidence.content.slice(0, 600)}</blockquote><small>{row.evidence.location || 'Source location not recorded'}</small></article>)}</div> : <div className="pf-empty-inline">No evidence was linked directly to these findings. Open the full audit to inspect the captured evidence inventory; do not treat an unlinked recommendation as a verified cause.</div>}
    </Block>

    <Block number="05" title="Fix">
      <p className="pf-fix-intro">Fixes are ranked by saved severity. Effort comes from the audit record. Commercial impact is not measured by a public-page inspection, so it is not guessed.</p>
      {sortedFindings.length ? <div className="pf-fix-list">{sortedFindings.map(f => <article key={f.id} className="pf-fix-card"><div className="pf-fix-top"><span className={severityTone(f.severity)}>{f.severity} priority</span><span>Effort: {effortLabel(f.effort)}</span><span>Impact: Not measured</span></div><h3>{f.title}</h3><p>{f.recommendation}</p><small>{f.whyItMatters}</small><div className="pf-fix-actions"><Link href={`/dashboard/audits/${audit.id}#finding-${f.id}`}>Mark as fixed / Verify →</Link></div></article>)}</div> : <div className="pf-empty-inline">No fixes were generated for this feature in the selected audit. This does not prove the page is issue-free.</div>}
      <div className="pf-report-footer"><Link className="primary-button" href={`/dashboard/audits/${audit.id}`}>Open audit and recheck workflow →</Link></div>
    </Block>
  </div>;
}
