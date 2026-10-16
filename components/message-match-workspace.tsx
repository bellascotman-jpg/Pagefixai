'use client';

import { useMemo, useState } from 'react';

const promisePatterns: Array<{ label: string; pattern: RegExp }> = [
  { label: 'Free shipping / delivery', pattern: /\bfree\s+(?:shipping|delivery|dispatch)\b/i },
  { label: 'Percentage discount', pattern: /\b\d{1,3}\s?%\s?(?:off|discount|saving|savings)?\b/i },
  { label: 'Warranty promise', pattern: /\b(?:\d{1,3}[- ](?:year|month)\s+warranty|warranty included|manufacturer warranty)\b/i },
  { label: 'Return / refund promise', pattern: /\b(?:free returns?|returns? accepted|refund(?:s)? available|money[- ]back)\b/i },
  { label: 'Delivery timing', pattern: /\b(?:same[- ]day|next[- ]day|within \d+ days?|\d+[- ]day delivery)\b/i },
  { label: 'Universal compatibility', pattern: /\b(?:compatible with all|works with every|universal compatibility|fits all)\b/i },
  { label: 'Guarantee / performance promise', pattern: /\b(?:guaranteed|guarantee|100% effective|results in \d+ days?)\b/i },
  { label: 'Currency price', pattern: /(?:\$|₦|€|£)\s?\d[\d,.]*/i },
];

function signals(text: string) {
  return promisePatterns.flatMap(item => {
    const match = text.match(item.pattern);
    return match ? [{ label: item.label, text: match[0] }] : [];
  });
}

export default function MessageMatchWorkspace() {
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const sourceLabel = 'Advertisement / social post';
  const destinationLabel = 'Destination page';
  const result = useMemo(() => {
    const sourceSignals = signals(source);
    const destinationSignals = signals(destination);
    const compared = sourceSignals.map(item => {
      const sameCategory = destinationSignals.filter(dest => dest.label === item.label);
      const valueFor = (text: string) => {
        const match = text.match(/\d+(?:[,.]\d+)?/);
        return match ? Number(match[0].replace(',', '.')) : null;
      };
      const valueSensitive = item.label === 'Percentage discount' || item.label === 'Currency price';
      const sourceValue = valueFor(item.text);
      const exactValuePresent = sameCategory.some(dest => valueFor(dest.text) === sourceValue && sourceValue !== null);
      const matchingCategoryPresent = sameCategory.length > 0;
      const valueMismatch = valueSensitive && matchingCategoryPresent && !exactValuePresent;
      return { ...item, matchingCategoryPresent, exactValuePresent, valueMismatch };
    });
    return { sourceSignals, destinationSignals, compared, gaps: compared.filter(item => !item.matchingCategoryPresent || item.valueMismatch) };
  }, [source, destination]);
  return <div className="message-match-workspace">
    <div className="message-match-input-grid">
      <label className="card"><span className="label">SOURCE PROMISE</span><strong>{sourceLabel}</strong><textarea value={source} onChange={e=>setSource(e.target.value)} rows={9} placeholder="Paste the exact ad headline, caption, promotional terms or social post." /><small>Only content you provide is evaluated.</small></label>
      <label className="card"><span className="label">DESTINATION CONTENT</span><strong>{destinationLabel}</strong><textarea value={destination} onChange={e=>setDestination(e.target.value)} rows={9} placeholder="Paste the visible landing or product page content you want to compare." /><small>Use the content captured from the destination page.</small></label>
    </div>
    <section className="card message-match-results">
      <div className="message-match-result-head"><div><div className="label">LITERAL COMMERCIAL SIGNAL COMPARISON</div><h2>Candidate message gaps</h2></div><span className="badge">{result.gaps.length} to review</span></div>
      {!source.trim() || !destination.trim() ? <p className="muted">Add both source and destination content to compare detected commercial signals.</p> : result.sourceSignals.length === 0 ? <p className="muted">No supported promise patterns were detected in the source text. This does not mean the message is consistent; the current check recognises a limited set of literal patterns.</p> : result.compared.map((item,index)=><article className="message-match-row" key={item.label+index}><span className={item.matchingCategoryPresent && !item.valueMismatch?'message-match-check':'message-match-alert'}>{item.matchingCategoryPresent && !item.valueMismatch?'✓':'!'}</span><div><strong>{item.label}</strong><p>Source signal: <q>{item.text}</q></p><small>{item.valueMismatch?'A signal of this type was found, but its numeric value differs from the source. Review the actual offer and conditions.':item.matchingCategoryPresent?'A signal from the same category was found. This does not establish that the terms or conditions match.':'No corresponding signal from this category was detected in the destination text.'}</small></div><span className={item.matchingCategoryPresent && !item.valueMismatch?'clarity-state clarity-partial':'clarity-state clarity-review'}>{item.valueMismatch?'Value mismatch':item.matchingCategoryPresent?'Review conditions':'Review gap'}</span></article>)}
      {source.trim() && destination.trim() && <div className="impact-assumption-note"><strong>Interpretation limit</strong><p>This is a literal pattern check, not a semantic contradiction verdict. A missing signal may be explained elsewhere, and similar wording does not prove that an offer is accurate. Verify the actual conditions before changing an ad or page.</p></div>}
    </section>
  </div>;
}
