'use client';

import { useMemo, useState } from 'react';
import { compareCommercialSignals } from '@/lib/intelligence/message-match';

export default function MessageMatchWorkspace() {
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const result = useMemo(() => compareCommercialSignals(source, destination), [source, destination]);
  return <div className="message-match-workspace">
    <div className="message-match-input-grid">
      <label className="card"><span className="label">SOURCE PROMISE</span><strong>Advertisement / social post</strong><textarea value={source} onChange={e=>setSource(e.target.value)} rows={9} placeholder="Paste the exact ad headline, caption, promotional terms or social post." /><small>Only content you provide is evaluated.</small></label>
      <label className="card"><span className="label">DESTINATION CONTENT</span><strong>Destination page</strong><textarea value={destination} onChange={e=>setDestination(e.target.value)} rows={9} placeholder="Paste the visible landing or product page content you want to compare." /><small>Use the content captured from the destination page.</small></label>
    </div>
    <section className="card message-match-results">
      <div className="message-match-result-head"><div><div className="label">LITERAL COMMERCIAL SIGNAL COMPARISON</div><h2>Candidate message gaps</h2></div><span className="badge">{result.gaps.length} to review</span></div>
      {!source.trim() || !destination.trim() ? <p className="muted">Add both source and destination content to compare detected commercial signals.</p> : result.sourceSignals.length === 0 ? <p className="muted">No supported promise patterns were detected in the source text. This does not mean the message is consistent; the current check recognises a limited set of literal patterns.</p> : result.compared.map((item,index)=><article className="message-match-row" key={item.label+index}><span className={item.matchingCategoryPresent && !item.valueMismatch?'message-match-check':'message-match-alert'}>{item.matchingCategoryPresent && !item.valueMismatch?'✓':'!'}</span><div><strong>{item.label}</strong><p>Source signal: <q>{item.text}</q></p><small>{item.valueMismatch?'A signal of this type was found, but its numeric value differs from the source. Review the actual offer and conditions.':item.matchingCategoryPresent?'A signal from the same category was found. This does not establish that the terms or conditions match.':'No corresponding signal from this category was detected in the destination text.'}</small></div><span className={item.matchingCategoryPresent && !item.valueMismatch?'clarity-state clarity-partial':'clarity-state clarity-review'}>{item.valueMismatch?'Value mismatch':item.matchingCategoryPresent?'Review conditions':'Review gap'}</span></article>)}
      {source.trim() && destination.trim() && <div className="impact-assumption-note"><strong>Interpretation limit</strong><p>This is a literal pattern check, not a semantic contradiction verdict. A missing signal may be explained elsewhere, and similar wording does not prove that an offer is accurate. Verify the actual conditions before changing an ad or page.</p></div>}
    </section>
  </div>;
}
