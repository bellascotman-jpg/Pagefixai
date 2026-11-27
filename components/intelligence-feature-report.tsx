import Link from 'next/link';

type Evidence = { id: string; type: string; source: string; location: string | null; content: string };
type Finding = {
  id: string; title: string; severity: string; confidence: string; priority: string; status: string;
  observation: string; hypothesis: string | null; whyItMatters: string; recommendation: string;
  evidence: { evidence: Evidence }[];
};
type Audit = {
  id: string; url: string; completedAt: Date | null; createdAt: Date;
  findings: Finding[];
  pages: { statusCode: number | null; title: string | null; metaDescription: string | null; canonical: string | null; visibleText: string | null }[];
  evidence: Evidence[];
};
type Props = { module: 'ai-search-readiness' | 'claims' | 'competitors' | 'impact' | 'promise-ledger'; audits: Audit[] };

const configs = {
  'ai-search-readiness': { title: 'AI Search Readiness', problem: '“Can search and answer systems understand what this page offers?”', description: 'A public-page capture can review technical and content signals, but cannot confirm indexing, rankings or AI citations.' },
  claims: { title: 'Claim & Contradiction Intelligence', problem: '“Are the promises on this page consistent with the details and policies shoppers can see?”', description: 'Wording differences are review candidates, not proof that one statement is false.' },
  competitors: { title: 'Competitor Intelligence', problem: '“How does the public information on the pages I inspected compare?”', description: 'This compares saved public-page captures only. It does not estimate competitor revenue, traffic, ad spend or market share.' },
  impact: { title: 'Commercial Impact Analysis', problem: '“Which issues could matter commercially, and what data would I need to quantify them?”', description: 'A public URL cannot establish lost revenue or conversion lift. Quantification requires reliable seller-authorised inputs.' },
  'promise-ledger': { title: 'Promise Ledger', problem: '“Can I trace important product and policy promises across the pages I have inspected?”', description: 'This first ledger view organises saved claim-related findings over time. It is not a complete crawl of every ad, policy or product version.' },
} as const;

const matches: Record<Props['module'], RegExp> = {
  'ai-search-readiness': /title|meta|canonical|structured data|heading|robots|crawl|schema|index/i,
  claims: /claim|contradiction|conflict|promise|warranty|guarantee|shipping|return statement/i,
  competitors: /.*/,
  impact: /.*/,
  'promise-ledger': /claim|promise|warranty|guarantee|shipping|return|offer|price|policy/i,
};

function Block({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return <section className="card" style={{ marginTop: 18, padding: 22 }}>
    <div className="label">0{n} / {title.toUpperCase()}</div>
    <h2 style={{ marginTop: 6 }}>{title}</h2>
    {children}
  </section>;
}

function Signal({ label, value, note }: { label: string; value: string | number; note?: string }) {
  return <article className="card" style={{ minWidth: 0 }}>
    <div className="label">{label}</div><div style={{ fontSize: 20, fontWeight: 750, margin: '8px 0' }}>{value}</div>
    {note && <p className="muted" style={{ margin: 0, fontSize: 12 }}>{note}</p>}
  </article>;
}

export default function IntelligenceFeatureReport({ module, audits }: Props) {
  const config = configs[module];
  const latest = audits[0];
  const allFindings = audits.flatMap(a => a.findings.map(f => ({ ...f, auditId: a.id, auditUrl: a.url, observedAt: a.completedAt ?? a.createdAt })));
  const findings = allFindings.filter(f => matches[module].test(f.title + ' ' + f.observation + ' ' + f.recommendation));
  const evidence = findings.flatMap(f => f.evidence.map(ref => ({ finding: f, evidence: ref.evidence })));
  const high = findings.filter(f => f.severity === 'HIGH').length;
  const medium = findings.filter(f => f.severity === 'MEDIUM').length;
  const page = latest?.pages[0];
  const metadata = latest?.evidence.find(e => e.type === 'METADATA');
  const structured = latest?.evidence.filter(e => e.type === 'STRUCTURED_DATA') ?? [];
  const uniqueUrls = [...new Set(audits.map(a => a.url))];

  return <main className="dashboard">
    <header className="topbar"><div><div className="label">COMMERCE INTELLIGENCE / EVIDENCE REPORT</div><h1 style={{ fontSize: 27, margin: '4px 0 0' }}>{config.title}</h1></div><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><Link className="button button-secondary" href="/dashboard/intelligence">All capabilities</Link><Link className="primary-button" href="/dashboard">Run inspection →</Link></div></header>
    <div className="container dashboard-main" style={{ paddingBottom: 40 }}>
      <div className="card" style={{ marginTop: 18 }}>
        <div className="label">FEATURE REPORT / {latest ? 'SAVED AUDIT DATA' : 'AWAITING FIRST AUDIT'}</div>
        <h2 style={{ marginTop: 8 }}>{config.problem}</h2>
        <p className="muted">{config.description}</p>
        {latest && <p style={{ overflowWrap: 'anywhere', marginBottom: 0 }}><strong>Latest inspected page:</strong> {latest.url}</p>}
      </div>

      <Block n="1" title="Problem">
        <p style={{ fontSize: 17, lineHeight: 1.65 }}>{config.problem}</p>
        <p className="muted">If the underlying information is unclear or inconsistent, shoppers may need to verify it elsewhere. This report does not translate that possibility into an unsupported sales-loss estimate.</p>
      </Block>

      <Block n="2" title="Findings">
        <div className="grid grid-3">
          <Signal label="Related findings" value={findings.length} note="Saved finding records matching this feature" />
          <Signal label="High priority" value={high} note="Severity from the audit record" />
          <Signal label="Medium priority" value={medium} note="Severity from the audit record" />
        </div>
        {module === 'ai-search-readiness' && latest && <div className="grid grid-3" style={{ marginTop: 14 }}>
          <Signal label="HTTP response" value={page?.statusCode ?? 'Not captured'} />
          <Signal label="Page title" value={page?.title ? 'Captured' : 'Not captured'} note={page?.title ?? 'No title value saved'} />
          <Signal label="Meta description" value={page?.metaDescription ? 'Captured' : 'Not captured'} note={page?.metaDescription ?? 'No description value saved'} />
          <Signal label="Canonical" value={page?.canonical ? 'Captured' : 'Not captured'} note={page?.canonical ?? 'No canonical value saved'} />
          <Signal label="Structured-data records" value={structured.length} note="Saved evidence records, not a full schema validation" />
          <Signal label="Metadata snapshot" value={metadata ? 'Available' : 'Not captured'} />
        </div>}
        {module === 'competitors' && <div style={{ marginTop: 14, overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 540 }}><thead><tr><th align="left">Inspected page</th><th align="left">Captured title</th><th align="right">Findings</th><th align="left">Audit</th></tr></thead><tbody>{audits.map(a => <tr key={a.id} style={{ borderTop: '1px solid var(--line)' }}><td style={{ padding: 10, overflowWrap: 'anywhere' }}>{a.url}</td><td style={{ padding: 10 }}>{a.pages[0]?.title ?? 'Not captured'}</td><td align="right">{a.findings.length}</td><td><Link href={`/dashboard/audits/${a.id}`}>Open</Link></td></tr>)}</tbody></table>{audits.length < 2 && <p className="muted">Inspect at least two public pages to create a side-by-side comparison. No competitor is assumed from a URL.</p>}</div>}
        {module === 'impact' && <div className="grid grid-3" style={{ marginTop: 14 }}><Signal label="Traffic sessions" value="Not connected" note="Requires authorised analytics or seller input" /><Signal label="Conversion rate" value="Not connected" note="Requires a defined event and measurement period" /><Signal label="Contribution margin" value="Not provided" note="Needed before estimating contribution impact" /></div>}
        {module === 'claims' && <p className="muted" style={{ marginTop: 14 }}>The chart is intentionally evidence-led: claim candidates appear below with their source excerpts. A mismatch is not automatically a contradiction.</p>}
        {module === 'promise-ledger' && <p className="muted" style={{ marginTop: 14 }}>Timeline entries below are dated saved findings, not a claim that every store promise has been discovered.</p>}
        {!latest && <div className="card" style={{ marginTop: 14 }}><strong>No completed inspection is available.</strong><p className="muted">Run an inspection to populate this report. No sample scores, claims or competitor data are displayed.</p><Link className="primary-button" href="/dashboard">Run first inspection →</Link></div>}
      </Block>

      <Block n="3" title="Explanation">
        {module === 'ai-search-readiness' && <p className="muted">Captured title, description, canonical, response status and structured-data records are technical cues. Their presence does not prove that a search engine indexed the page or that an AI system cited it. “Not captured” means unknown in this audit.</p>}
        {module === 'claims' && <p className="muted">A claim finding identifies wording that deserves review. Compare the exact source, conditions, date and authoritative product facts before deciding whether two statements conflict.</p>}
        {module === 'competitors' && <p className="muted">The comparison is limited to inspected public pages and saved capture fields. Differences may reflect different products, capture times or page templates; they are not a market-performance ranking.</p>}
        {module === 'impact' && <p className="muted">Commercial impact requires a defined population, period, baseline and metric. Any scenario should show its assumptions and sensitivity. Until the required data is available, this report deliberately shows “not measured” rather than a guessed amount.</p>}
        {module === 'promise-ledger' && <p className="muted">A useful promise history needs source provenance and repeated captures. The entries shown are findings saved in your audit history; absence from this list does not mean a promise was never made.</p>}
      </Block>

      <Block n="4" title="Cause">
        {evidence.length ? <div style={{ display: 'grid', gap: 12 }}>{evidence.map((row, i) => <article className="card" key={row.evidence.id + row.finding.id + i}>
          <div className="label">{row.evidence.type.replaceAll('_', ' ')} · {row.finding.severity} · {row.evidence.source}</div>
          <h3>{row.finding.title}</h3><blockquote>{row.evidence.content.slice(0, 700)}</blockquote>
          <p className="muted">{row.evidence.location ?? 'Source location not recorded'} · <Link href={`/dashboard/audits/${row.finding.auditId}`}>Open source audit</Link></p>
        </article>)}</div> : <div className="card"><strong>No linked source excerpts were saved for the matching findings.</strong><p className="muted">Open the audit evidence inventory before treating any recommendation as a verified cause.</p></div>}
      </Block>

      <Block n="5" title="Fix">
        {module === 'impact' && <div className="grid grid-3"><Signal label="Required input 1" value="Traffic" note="Sessions or eligible visitors for the same period" /><Signal label="Required input 2" value="Outcome" note="Orders and a clearly defined conversion event" /><Signal label="Required input 3" value="Economics" note="Average order value, variable costs and margin" /></div>}
        {module === 'competitors' && <p className="muted">Inspect the same product category and comparable page type across multiple URLs. Record capture dates and compare like-for-like information; do not infer competitor performance from page copy.</p>}
        {module === 'ai-search-readiness' && <p className="muted">Review missing or unclear captured metadata, canonical and structured-data signals with the source page. Validate schema against the relevant standard and check indexing in the seller’s authorised search account before claiming search visibility.</p>}
        {module === 'claims' && <p className="muted">Verify each statement against an authoritative product specification or current policy. Correct the source of truth first, then align ads, product copy and policy wording. Do not publish AI-generated product facts without review.</p>}
        {module === 'promise-ledger' && <p className="muted">Keep a dated source record for each approved promise, including URL, exact wording, scope and conditions. Reinspect changed pages to maintain history.</p>}
        {findings.length ? <div style={{ display: 'grid', gap: 12, marginTop: 14 }}>{findings.map(f => <article className="card" key={f.id}><div className="label">{f.severity} PRIORITY · {f.status.replaceAll('_', ' ')}</div><h3>{f.title}</h3><p>{f.recommendation}</p><p className="muted">{f.whyItMatters}</p><Link href={`/dashboard/audits/${allFindings.find(x => x.id === f.id)?.auditId}`}>Review evidence and recheck →</Link></article>)}</div> : <p className="muted" style={{ marginTop: 12 }}>No matching fixes were generated from the saved inspections. This is not proof that no issues exist.</p>}
        {latest && <p style={{ marginTop: 18 }}><Link className="primary-button" href={`/dashboard/audits/${latest.id}`}>Open latest audit →</Link></p>}
      </Block>
      <p className="muted" style={{ fontSize: 11, marginTop: 18 }}>Coverage: {uniqueUrls.length} distinct inspected URL(s) across {audits.length} completed audit(s). Only saved account-owned inspections are included.</p>
    </div>
  </main>;
}
