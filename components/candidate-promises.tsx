'use client';

import { useState } from 'react';

export default function CandidatePromises({ claims, sourceUrl, auditId }: { claims: string[]; sourceUrl: string; auditId: string }) {
  const [saved, setSaved] = useState<Record<number, boolean>>({});
  const [saving, setSaving] = useState<Record<number, boolean>>({});
  const [messages, setMessages] = useState<Record<number, string>>({});

  async function saveClaim(claim: string, index: number) {
    setSaving(previous => ({ ...previous, [index]: true }));
    setMessages(previous => ({ ...previous, [index]: '' }));
    try {
      const response = await fetch('/api/promise-ledger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: claim.slice(0, 140),
          claimText: claim,
          sourceType: 'OTHER',
          sourceUrl,
          auditId,
          context: 'Candidate extracted from a PageFix AI public-page inspection. This is not verification of the claim; review the source and supporting evidence.',
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not save this candidate.');
      setSaved(previous => ({ ...previous, [index]: true }));
      setMessages(previous => ({ ...previous, [index]: 'Saved for human review in Promise Ledger.' }));
    } catch (error) {
      setMessages(previous => ({ ...previous, [index]: error instanceof Error ? error.message : 'Could not save this candidate.' }));
    } finally {
      setSaving(previous => ({ ...previous, [index]: false }));
    }
  }

  if (!claims.length) return <p className="muted">No matching promise wording was detected in the captured text. Images, scripts or linked policy pages may contain additional claims.</p>;

  return <div>
    {claims.map((claim, index) => <article className="finding" key={index}>
      <p>{claim}</p>
      <button type="button" className="button button-secondary" disabled={Boolean(saved[index] || saving[index])} onClick={() => void saveClaim(claim, index)}>
        {saved[index] ? 'Saved for review ✓' : saving[index] ? 'Saving…' : 'Save candidate to Promise Ledger'}
      </button>
      {messages[index] && <p className="muted" role="status">{messages[index]}</p>}
    </article>)}
  </div>;
}
