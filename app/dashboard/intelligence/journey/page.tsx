import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { compareCommercialSignals, analyzeMessageContinuity } from '@/lib/intelligence/message-match';
import MessageMatchWorkspace from '@/components/message-match-workspace';

type Stage = { id?: string; name?: string; url?: string; content?: string; expectedNextStep?: string };

export default async function JourneyIntelligencePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth?mode=login');
  const saved = await db.messageMatch.findFirst({
    where: { audit: { is: { userId: user.id } } },
    orderBy: { createdAt: 'desc' },
    include: { audit: { select: { id: true, url: true, completedAt: true } } },
  });
  const payload = saved?.gaps && typeof saved.gaps === 'object' && !Array.isArray(saved.gaps) ? saved.gaps as Record<string, unknown> : null;
  const source = saved?.sourceText ?? '';
  const destination = saved?.pagePromise ?? '';
  const compared = compareCommercialSignals(source, destination);
  const continuity = analyzeMessageContinuity(source, destination);
  const stages = Array.isArray(payload?.stages) ? payload.stages as Stage[] : [];
  const stageById = new Map(stages.map(stage => [stage.id ?? '', stage]));
  const cart = stageById.get('cart');
  const checkout = stageById.get('checkout');
  const supplied = (value?: string | null) => Boolean(value?.trim());
  const nodes = [
    { title: 'Ad / social post', detail: saved ? (saved.sourceType === 'ad' ? 'Paid campaign message' : 'Social / creator message') : 'Campaign text not supplied', present: Boolean(saved && source.trim()) },
    { title: 'Landing / product page', detail: saved ? 'Destination text supplied for comparison' : 'Destination content not supplied', present: Boolean(saved && destination.trim()) },
    { title: 'Cart / basket', detail: cart?.url || (supplied(cart?.content) ? 'Cart content supplied' : 'Not supplied for inspection'), present: supplied(cart?.url) || supplied(cart?.content) },
    { title: 'Checkout', detail: checkout?.url || (supplied(checkout?.content) ? 'Checkout content supplied' : 'Not supplied for inspection'), present: supplied(checkout?.url) || supplied(checkout?.content) },
  ];
  const gaps = compared.gaps;
  const evidenceCount = compared.sourceSignals.length + compared.destinationSignals.length;

  return <main className="dashboard">
    <header className="topbar"><div><div className="label">DIAGNOSE / JOURNEY & MESSAGE MATCH</div><h1 style={{fontSize:27,margin:'4px 0 0'}}>Journey & Message Match</h1></div><div style={{display:'flex',gap:10,flexWrap:'wrap'}}><Link className="button button-secondary" href="/dashboard/intelligence">All capabilities</Link><Link className="primary-button" href="/dashboard">Run an inspection →</Link></div></header>
    <div className="container dashboard-main pf-audit-report">
      <div className="pf-report-meta"><span>JOURNEY AUDIT REPORT</span><span>{saved ? saved.createdAt.toLocaleString() : 'No saved comparison yet'}</span></div>
      <section className="pf-report-block"><div className="pf-block-heading"><span>01</span><h2>Problem</h2></div><div className="pf-problem"><span>THE STORE OWNER'S PROBLEM</span><h2>“My ad makes a promise. Does the page shoppers land on repeat it clearly—and does the journey carry it through?”</h2><p>If the destination changes the offer, hides important conditions or fails to explain the next step, shoppers may lose confidence. This review does not prove wasted ad spend; that requires connected campaign and conversion data.</p></div></section>

      <section className="pf-report-block"><div className="pf-block-heading"><span>02</span><h2>Findings</h2></div>
        <div className="pf-verdict-grid"><div className="pf-verdict-card"><span>CAMPAIGN SIGNALS REVIEWED</span><strong>{saved ? compared.sourceSignals.length : '—'}</strong><small>{saved ? 'Supported commercial promises extracted from supplied campaign text' : 'No saved campaign comparison'}</small></div><div className={`pf-risk-card ${gaps.length ? 'watch' : 'good'}`}><span>DESTINATION REVIEW</span><strong>{saved ? (gaps.length ? `${gaps.length} candidate gap(s)` : 'No supported gap detected') : 'Awaiting input'}</strong><small>{saved ? 'Literal promise-pattern comparison only' : 'Add campaign and destination content to begin'}</small></div></div>
        <div className="pf-chart-card"><div><span className="pf-eyebrow">JOURNEY FLOW</span><h3>Where the promise is supplied—and where it still needs checking</h3><p>Only supplied text and URLs are marked as present. A present step is not proof that the live experience works.</p></div><div className="pf-flow">{nodes.map((node, index) => <div className="pf-flow-step" key={node.title}><div className={`pf-flow-node ${node.present ? 'present' : 'missing'}`}><span>{index + 1}</span><strong>{node.title}</strong><small>{node.present ? 'Content supplied' : 'Not supplied'}</small></div><p>{node.detail}</p>{index < nodes.length - 1 && <div className="pf-flow-arrow"><span className={index === 0 && gaps.length ? 'mismatch' : index === 0 && saved ? 'match' : 'unchecked'}>{index === 0 && saved ? (gaps.length ? 'Candidate mismatch' : 'No supported gap') : 'Not checked'}</span><b aria-hidden="true">→</b></div>}</div>)}</div></div>
        {saved && <div className="pf-subpanel"><h3>Candidate message gaps</h3>{gaps.length ? <div className="pf-question-grid">{gaps.map((gap, index) => <article className="pf-question-card" key={gap.label + index}><strong>{gap.label}</strong><span className="watch">{gap.valueMismatch ? 'Value mismatch' : 'Not found on destination'}</span><small>Campaign wording: “{gap.text}”</small></article>)}</div> : <p className="pf-empty-inline">The current rules did not detect a supported promise-pattern gap. This is not proof that the ad and page are semantically consistent.</p>}</div>}
        <div className="pf-subpanel"><h3>Update or run a comparison</h3><p>Enter the exact ad/social copy and destination text. PageFix will preserve the supplied inputs and show literal commercial-signal differences.</p><MessageMatchWorkspace /></div>
      </section>

      <section className="pf-report-block"><div className="pf-block-heading"><span>03</span><h2>Explanation</h2></div><div className="pf-explain-grid"><article><strong>Candidate gap</strong><p>A supported promise pattern appeared in the campaign text but was not detected on the destination page, or a price/discount value differs. It needs human review.</p></article><article><strong>Literal term coverage</strong><p>{continuity.literalCoveragePercent === null ? 'Not enough distinctive words were supplied to calculate overlap.' : `${continuity.literalCoveragePercent}% of distinctive campaign terms also appear in the supplied destination text.`} This is keyword overlap only, not meaning or relevance.</p></article><article><strong>Journey steps</strong><p>A step marked “content supplied” has text or a URL saved. PageFix has not confirmed that the cart or checkout can be completed or that analytics events fire.</p></article><article><strong>Evidence count</strong><p>{evidenceCount} supported commercial signal(s) were extracted from the two supplied text fields. These are source excerpts, not performance measurements.</p></article></div></section>

      <section className="pf-report-block"><div className="pf-block-heading"><span>04</span><h2>Cause</h2></div><div className="pf-evidence-list">{saved ? <><article><div className="pf-chip-row"><span>CAMPAIGN SOURCE</span><span>{saved.sourceType}</span></div><strong>Supplied campaign text</strong><blockquote>{source.slice(0, 900) || 'No campaign text saved.'}</blockquote><small>{payload?.sourceUrl ? String(payload.sourceUrl) : 'Campaign URL not supplied'}</small></article><article><div className="pf-chip-row"><span>DESTINATION SOURCE</span><span>Supplied page text</span></div><strong>Landing / product page</strong><blockquote>{destination.slice(0, 900) || 'No destination text saved.'}</blockquote><small>{payload?.destinationUrl ? String(payload.destinationUrl) : saved.audit.url}</small></article></> : <div className="pf-empty-inline">No saved source/destination evidence exists yet. Add both texts below and save a comparison to populate this section.</div>}</div></section>

      <section className="pf-report-block"><div className="pf-block-heading"><span>05</span><h2>Fix</h2></div><p className="pf-fix-intro">Resolve candidate gaps by checking the original campaign conditions and making the destination page state the same offer accurately. Do not remove legitimate restrictions or invent claims.</p>{gaps.length ? <div className="pf-fix-list">{gaps.map((gap, index) => <article className="pf-fix-card" key={gap.label + index}><div className="pf-fix-top"><span className="watch">Review recommended</span><span>Effort: Not estimated</span><span>Impact: Not measured</span></div><h3>Align {gap.label.toLowerCase()}</h3><p>Confirm the campaign&apos;s exact terms, then make the corresponding conditions visible on the destination page. If the campaign wording is inaccurate, correct the campaign instead.</p><small>Evidence: “{gap.text}”</small></article>)}</div> : <div className="pf-empty-inline">No candidate fixes can be recommended until a comparison detects a supported gap. Add or update the source and destination text to continue.</div>}<div className="pf-report-footer"><Link className="primary-button" href="/dashboard/intelligence/journey">Open journey workspace →</Link></div></section>
    </div>
  </main>;
}
