'use client';

import { FormEvent, useEffect, useState } from 'react';

type Claim = {
  id: string; title: string; claimText: string; sourceType: string; sourceUrl: string | null;
  context: string | null; status: string; lastCheckedAt: string | null; createdAt: string; updatedAt: string;
};

const statusLabels: Record<string, string> = {
  ACTIVE: 'Active claim', NEEDS_REVIEW: 'Needs review', CLARIFIED: 'Reviewed / clarified', ARCHIVED: 'Archived',
};

export default function PromiseLedgerClient() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [title, setTitle] = useState('');
  const [claimText, setClaimText] = useState('');
  const [sourceType, setSourceType] = useState('AD');
  const [sourceUrl, setSourceUrl] = useState('');
  const [context, setContext] = useState('');

  async function loadClaims() {
    setLoading(true);
    try {
      const response = await fetch('/api/promise-ledger', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not load saved claims.');
      setClaims(Array.isArray(data.claims) ? data.claims : []);
      setMessage('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not load saved claims.');
    } finally { setLoading(false); }
  }

  useEffect(() => { void loadClaims(); }, []);

  async function createClaim(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true); setMessage('');
    try {
      const response = await fetch('/api/promise-ledger', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, claimText, sourceType, sourceUrl, context }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not save the claim.');
      setClaims(previous => [data.claim, ...previous]);
      setTitle(''); setClaimText(''); setSourceUrl(''); setContext('');
      setMessage('Claim saved to your Promise Ledger.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save the claim.');
    } finally { setSaving(false); }
  }

  async function updateClaim(id: string, status: string) {
    const response = await fetch('/api/promise-ledger/' + id, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    const data = await response.json();
    if (!response.ok) { setMessage(data.message || 'Could not update the claim.'); return; }
    setClaims(previous => previous.map(item => item.id === id ? data.claim : item));
    setMessage('Claim status updated. This records your review; it does not independently verify the claim.');
  }

  async function deleteClaim(id: string) {
    if (!window.confirm('Delete this saved claim from your Promise Ledger?')) return;
    const response = await fetch('/api/promise-ledger/' + id, { method: 'DELETE' });
    const data = await response.json();
    if (!response.ok) { setMessage(data.message || 'Could not delete the claim.'); return; }
    setClaims(previous => previous.filter(item => item.id !== id));
    setMessage('Claim deleted.');
  }

  return <div className="promise-ledger-layout">
    <form className="card promise-ledger-form" onSubmit={createClaim}>
      <div className="label">SAVE A COMMERCIAL PROMISE</div><h2>Add a claim to track</h2>
      <p className="muted">Save the exact statement and where it appeared. PageFix does not certify a claim as true simply because it is recorded.</p>
      <label>Short title<input required minLength={2} maxLength={140} value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Free delivery on all orders" /></label>
      <label>Exact claim text<textarea required minLength={3} maxLength={5000} rows={4} value={claimText} onChange={e=>setClaimText(e.target.value)} placeholder="Paste the exact promise, including its conditions where visible." /></label>
      <label>Source type<select value={sourceType} onChange={e=>setSourceType(e.target.value)}><option value="AD">Advertisement</option><option value="PRODUCT_PAGE">Product page</option><option value="POLICY">Policy / terms</option><option value="SOCIAL_POST">Social post</option><option value="EMAIL">Email</option><option value="OTHER">Other</option></select></label>
      <label>Source URL (optional)<input type="url" value={sourceUrl} onChange={e=>setSourceUrl(e.target.value)} placeholder="https://…" /></label>
      <label>Context or conditions (optional)<textarea rows={2} maxLength={2000} value={context} onChange={e=>setContext(e.target.value)} placeholder="Add region, date, offer conditions or source context." /></label>
      <button className="primary-button" type="submit" disabled={saving}>{saving ? 'Saving claim…' : 'Save to Promise Ledger'}</button>
      {message && <p className="promise-ledger-message" role="status">{message}</p>}
    </form>
    <section className="promise-ledger-list">
      <div className="promise-ledger-list-head"><div><div className="label">YOUR CLAIM REGISTER</div><h2>Promise Ledger</h2></div><span className="badge">{claims.length} saved</span></div>
      <p className="muted">Track claims across ads, product pages and policies. Use the review status to manage your own follow-up; it is not a third-party truth certification.</p>
      {loading ? <div className="card">Loading your saved claims…</div> : claims.length === 0 ? <div className="card empty-state"><h3>No claims saved yet</h3><p className="muted">Add a delivery, compatibility, price, warranty, return or promotional promise to begin building a source-linked history.</p></div> : claims.map(claim=><article className="card promise-claim-card" key={claim.id}>
        <div className="promise-claim-head"><span className="badge">{claim.sourceType.replaceAll('_',' ')}</span><select aria-label={'Status for '+claim.title} value={claim.status} onChange={e=>void updateClaim(claim.id,e.target.value)}><option value="ACTIVE">Active claim</option><option value="NEEDS_REVIEW">Needs review</option><option value="CLARIFIED">Reviewed / clarified</option><option value="ARCHIVED">Archived</option></select></div>
        <h3>{claim.title}</h3><blockquote>{claim.claimText}</blockquote>
        {claim.context && <p className="muted"><strong>Context:</strong> {claim.context}</p>}
        {claim.sourceUrl && <a className="promise-source-link" href={claim.sourceUrl} target="_blank" rel="noreferrer">Open source ↗</a>}
        <div className="promise-claim-meta"><span>{statusLabels[claim.status] || claim.status}</span><span>Saved {new Date(claim.createdAt).toLocaleDateString()}</span>{claim.lastCheckedAt && <span>Marked reviewed {new Date(claim.lastCheckedAt).toLocaleDateString()}</span>}</div>
        <button type="button" className="text-button promise-delete" onClick={()=>void deleteClaim(claim.id)}>Delete claim</button>
      </article>)}
    </section>
  </div>;
}
