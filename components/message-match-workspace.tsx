'use client';

import { useMemo, useState } from 'react';
import { compareCommercialSignals } from '@/lib/intelligence/message-match';
import { analyzeJourneyStages, calculateCheckoutMetrics, summarizeTrafficWasteRequirements, type JourneyStage } from '@/lib/intelligence/journey-intelligence';

const initialStages: JourneyStage[] = [
  { id: 'product', name: 'Product / landing page', url: '', content: '', expectedNextStep: 'Add to cart' },
  { id: 'cart', name: 'Cart / basket', url: '', content: '', expectedNextStep: 'Proceed to checkout' },
  { id: 'checkout', name: 'Checkout', url: '', content: '', expectedNextStep: 'Complete purchase' },
];

export default function MessageMatchWorkspace() {
  const [sourceType, setSourceType] = useState<'ad' | 'social'>('ad');
  const [source, setSource] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [destination, setDestination] = useState('');
  const [destinationUrl, setDestinationUrl] = useState('');
  const [stages, setStages] = useState<JourneyStage[]>(initialStages);
  const [checkoutStarts, setCheckoutStarts] = useState('');
  const [completedOrders, setCompletedOrders] = useState('');
  const [windowLabel, setWindowLabel] = useState('');
  const [hasSpend, setHasSpend] = useState(false);
  const [hasClicks, setHasClicks] = useState(false);
  const [hasSessions, setHasSessions] = useState(false);
  const [hasConversions, setHasConversions] = useState(false);

  const result = useMemo(() => compareCommercialSignals(source, destination), [source, destination]);
  const journeyResults = useMemo(() => analyzeJourneyStages(stages), [stages]);
  const metrics = useMemo(() => calculateCheckoutMetrics({
    checkoutStarts: checkoutStarts.trim() ? Number(checkoutStarts) : null,
    completedOrders: completedOrders.trim() ? Number(completedOrders) : null,
    windowLabel,
  }), [checkoutStarts, completedOrders, windowLabel]);
  const requirements = useMemo(() => summarizeTrafficWasteRequirements(hasSpend, hasClicks, hasSessions, hasConversions), [hasSpend, hasClicks, hasSessions, hasConversions]);

  function updateStage(id: string, field: keyof JourneyStage, value: string) {
    setStages(previous => previous.map(stage => stage.id === id ? { ...stage, [field]: value } : stage));
  }

  return <div className="message-match-workspace">
    <section className="card">
      <div className="label">01 / CAMPAIGN MESSAGE MATCH</div>
      <h2>Does the destination deliver the promise?</h2>
      <p className="muted">Compare exact campaign wording with the destination page. This detects candidate gaps in the supplied text; it does not decide whether a campaign is deceptive or whether spend was wasted.</p>
      <div className="message-match-input-grid">
        <label className="card"><span className="label">SOURCE MESSAGE</span><strong>Campaign content</strong>
          <select value={sourceType} onChange={event=>setSourceType(event.target.value as 'ad' | 'social')} aria-label="Campaign source type" style={{display:'block',width:'100%',margin:'10px 0',padding:10,borderRadius:8}}>
            <option value="ad">Paid advertisement</option><option value="social">Social post / creator message</option>
          </select>
          <input value={sourceUrl} onChange={event=>setSourceUrl(event.target.value)} placeholder={sourceType === 'ad' ? 'Optional ad library / campaign URL' : 'Optional social post URL'} aria-label="Source URL" style={{display:'block',width:'100%',marginBottom:10,padding:10,borderRadius:8}} />
          <textarea value={source} onChange={event=>setSource(event.target.value)} rows={8} placeholder={sourceType === 'ad' ? 'Paste the exact ad headline, copy, offer and conditions.' : 'Paste the exact social caption, creator claim, offer and conditions.'} />
          <small>Only the text you provide is analysed. The URL is a reference and is not automatically fetched.</small>
        </label>
        <label className="card"><span className="label">DESTINATION</span><strong>Landing / product page</strong>
          <input value={destinationUrl} onChange={event=>setDestinationUrl(event.target.value)} placeholder="https://yourstore.com/product" aria-label="Destination URL" style={{display:'block',width:'100%',margin:'10px 0',padding:10,borderRadius:8}} />
          <textarea value={destination} onChange={event=>setDestination(event.target.value)} rows={8} placeholder="Paste the visible destination-page content captured from the page." />
          <small>The comparison does not crawl the URL or access private campaign analytics.</small>
        </label>
      </div>
      <section className="message-match-results">
        <div className="message-match-result-head"><div><div className="label">LITERAL COMMERCIAL SIGNAL COMPARISON</div><h3>Candidate message gaps</h3></div><span className="badge">{result.gaps.length} to review</span></div>
        {!source.trim() || !destination.trim() ? <p className="muted">Add both campaign and destination content to compare supported commercial signals.</p> : result.sourceSignals.length === 0 ? <p className="muted">No supported promise patterns were detected in the source text. This does not mean the message is consistent; the current check recognises a limited set of literal patterns.</p> : result.compared.map((item,index)=><article className="message-match-row" key={item.label+index}><span className={item.matchingCategoryPresent && !item.valueMismatch?'message-match-check':'message-match-alert'}>{item.matchingCategoryPresent && !item.valueMismatch?'✓':'!'}</span><div><strong>{item.label}</strong><p>Source signal: <q>{item.text}</q></p><small>{item.valueMismatch?'A signal of this type was found, but its numeric value differs from the source. Review the actual offer and conditions.':item.matchingCategoryPresent?'A signal from the same category was found. This does not establish that the terms or conditions match.':'No corresponding signal from this category was detected in the destination text.'}</small></div><span className={item.matchingCategoryPresent && !item.valueMismatch?'clarity-state clarity-partial':'clarity-state clarity-review'}>{item.valueMismatch?'Value mismatch':item.matchingCategoryPresent?'Review conditions':'Review gap'}</span></article>)}
        {source.trim() && destination.trim() && <div className="impact-assumption-note"><strong>Evidence to verify</strong><p>Confirm that the offer, eligibility, price, timing and exclusions match in the actual campaign and page. Similar wording does not prove identical conditions.</p></div>}
      </section>
    </section>

    <section className="card" style={{marginTop:18}}>
      <div className="label">02 / CUSTOMER JOURNEY & CHECKOUT HANDOFF</div>
      <h2>Map the path from interest to purchase</h2>
      <p className="muted">Paste page content you are authorised to inspect. Empty steps remain unverified—not automatically broken. Checks use the supplied text and do not submit orders or payments.</p>
      <div style={{display:'grid',gap:14}}>
        {stages.map((stage,index)=><article className="card" key={stage.id}>
          <div className="message-match-result-head"><h3 style={{margin:0}}>{index+1}. {stage.name}</h3><span className="badge">{stage.content.trim()?'Content supplied':'Not inspected'}</span></div>
          <div className="grid grid-2" style={{marginTop:12}}>
            <label><span className="label">STEP NAME</span><input value={stage.name} onChange={event=>updateStage(stage.id,'name',event.target.value)} aria-label={'Journey step '+(index+1)+' name'} style={{width:'100%',padding:10,borderRadius:8}} /></label>
            <label><span className="label">PAGE URL (OPTIONAL)</span><input value={stage.url} onChange={event=>updateStage(stage.id,'url',event.target.value)} placeholder="https://..." aria-label={'Journey step '+(index+1)+' URL'} style={{width:'100%',padding:10,borderRadius:8}} /></label>
          </div>
          <label style={{display:'block',marginTop:12}}><span className="label">EXPECTED NEXT ACTION (OPTIONAL)</span><input value={stage.expectedNextStep} onChange={event=>updateStage(stage.id,'expectedNextStep',event.target.value)} placeholder="e.g. Proceed to checkout" aria-label={'Journey step '+(index+1)+' expected action'} style={{width:'100%',padding:10,borderRadius:8}} /></label>
          <label style={{display:'block',marginTop:12}}><span className="label">VISIBLE PAGE CONTENT</span><textarea value={stage.content} onChange={event=>updateStage(stage.id,'content',event.target.value)} rows={4} placeholder={'Paste the visible text for '+stage.name.toLowerCase()+'.'} /></label>
        </article>)}
      </div>
      <div className="message-match-result-head" style={{marginTop:16}}><h3>Journey observations</h3><span className="badge">{journeyResults.length} items to review</span></div>
      {journeyResults.length === 0 ? <p className="muted">No potential handoff issues were found in the supplied text. This is not proof that the journey works end-to-end; interactive controls and live destinations still need verification.</p> : journeyResults.map((item,index)=><article className="message-match-row" key={item.stageId+item.kind+index}><span className="message-match-alert">!</span><div><strong>{item.stageName}: {item.kind.replace(/_/g,' ')}</strong><p>{item.detail}</p><small><b>{item.label}:</b> {item.recommendation}</small></div></article>)}
      <div className="impact-assumption-note"><strong>Scope limitation</strong><p>These are supplied-text checks. A real checkout test requires permission and a safe test environment; PageFix does not place orders, enter payment details or claim to have verified a live checkout from pasted text.</p></div>
    </section>

    <section className="card" style={{marginTop:18}}>
      <div className="label">03 / CART ABANDONMENT FORENSICS</div>
      <h2>Separate measured abandonment from visible friction</h2>
      <p className="muted">Enter aggregate counts from the same checkout cohort, date range and analytics source. Leave blank if unavailable. These figures describe the supplied data only; they do not establish why a buyer did not complete checkout.</p>
      <div className="grid grid-3">
        <label><span className="label">CHECKOUT STARTS</span><input type="number" min="0" step="1" value={checkoutStarts} onChange={event=>setCheckoutStarts(event.target.value)} placeholder="e.g. 240" style={{width:'100%',padding:10,borderRadius:8}} /></label>
        <label><span className="label">COMPLETED ORDERS FROM COHORT</span><input type="number" min="0" step="1" value={completedOrders} onChange={event=>setCompletedOrders(event.target.value)} placeholder="e.g. 156" style={{width:'100%',padding:10,borderRadius:8}} /></label>
        <label><span className="label">REPORTING WINDOW / SOURCE</span><input value={windowLabel} onChange={event=>setWindowLabel(event.target.value)} placeholder="e.g. Oct 1–7, GA4 + store orders" style={{width:'100%',padding:10,borderRadius:8}} /></label>
      </div>
      {!metrics.valid ? <p className="muted" style={{marginTop:12}}>{metrics.reason}</p> : <div className="grid grid-3" style={{marginTop:14}}>
        <div className="card"><div className="label">Incomplete checkouts (calculated)</div><div className="stat">{metrics.incompleteCheckouts.toLocaleString()}</div></div>
        <div className="card"><div className="label">Completion rate in supplied cohort</div><div className="stat">{metrics.completionRatePercent.toFixed(1)}%</div></div>
        <div className="card"><div className="label">Abandonment proxy</div><div className="stat">{metrics.abandonmentRatePercent.toFixed(1)}%</div></div>
      </div>}
      <p className="muted" style={{marginTop:10,fontSize:13}}>Formula: (checkout starts − completed orders from the same cohort) ÷ checkout starts. This is only valid when definitions, attribution and time windows align. It is not a diagnosis of abandonment causes.</p>
      <div className="card" style={{marginTop:16}}>
        <h3>Evidence needed to investigate traffic waste</h3>
        <p className="muted">Select which evidence you already have from an authorised analytics or ad account.</p>
        <div className="grid grid-2">
          <label><input type="checkbox" checked={hasSpend} onChange={event=>setHasSpend(event.target.checked)} /> Ad spend by campaign</label>
          <label><input type="checkbox" checked={hasClicks} onChange={event=>setHasClicks(event.target.checked)} /> Ad clicks by campaign</label>
          <label><input type="checkbox" checked={hasSessions} onChange={event=>setHasSessions(event.target.checked)} /> Landing sessions / arrivals</label>
          <label><input type="checkbox" checked={hasConversions} onChange={event=>setHasConversions(event.target.checked)} /> Attributed conversion events</label>
        </div>
        <ul style={{paddingLeft:22,lineHeight:1.8,marginTop:14}}>{requirements.map(item=><li key={item}>{item}</li>)}</ul>
        <div className="impact-assumption-note"><strong>No invented waste estimate</strong><p>A message gap can justify review, but it cannot establish wasted spend or campaign profitability on its own. Those conclusions need aligned campaign, arrival and conversion data.</p></div>
      </div>
    </section>
  </div>;
}
