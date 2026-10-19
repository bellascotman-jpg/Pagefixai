'use client';

import { useState } from 'react';

type Props = {
  integrationId: string;
  product: { id: string; title: string; descriptionHtml: string | null; url: string | null; imageUrl: string | null; price: string | number | null; inventoryQuantity: number | null };
  onApplied: () => void;
};

export default function StoreProductFixEditor({ integrationId, product, onApplied }: Props) {
  const [title, setTitle] = useState(product.title);
  const [description, setDescription] = useState((product.descriptionHtml || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim());
  const [saving, setSaving] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  async function generateDraft() {
    setSuggesting(true); setError(''); setNotice('');
    try {
      const response = await fetch('/api/integrations/stores/' + integrationId + '/products/' + product.id + '/suggest-fix', { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error || 'Could not generate a draft.');
      if (!data.suggestion?.canDraft) throw new Error(data.suggestion?.reason || 'There is not enough factual product information to draft a safe description.');
      setTitle(data.suggestion.title || product.title);
      setDescription(data.suggestion.description || '');
      setNotice('AI draft ready. Review every claim before applying it to your live store.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not generate a draft.'); }
    finally { setSuggesting(false); }
  }

  async function apply() {
    if (title.trim() === product.title && description.trim() === (product.descriptionHtml || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim()) {
      setError('Make a title or description change first.');
      return;
    }
    if (!window.confirm('Apply this content update to the live store product? PageFix will save a before/after record.')) return;
    setSaving(true); setError('');
    try {
      const response = await fetch('/api/integrations/stores/' + integrationId + '/products/' + product.id + '/fix', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title, descriptionHtml: description }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error || 'The store did not confirm the update.');
      onApplied();
    } catch (e) { setError(e instanceof Error ? e.message : 'The store did not confirm the update.'); }
    finally { setSaving(false); }
  }
  return <div style={{border:'1px solid var(--line)',borderRadius:10,padding:13,display:'grid',gap:10}}>
    <strong>{product.title}</strong>
    <div className="muted" style={{fontSize:12}}>{[!product.descriptionHtml ? 'Missing description' : '',!product.imageUrl ? 'Missing image' : '',product.price == null ? 'Missing price' : '',product.inventoryQuantity != null && product.inventoryQuantity <= 0 ? 'Out of stock' : ''].filter(Boolean).join(' · ') || 'Review product content'}</div>
    {product.url && <a href={product.url} target="_blank" rel="noreferrer" className="muted" style={{fontSize:11}}>Open product ↗</a>}
    <label style={{display:'grid',gap:6,fontSize:13,fontWeight:700}}>Product title<input value={title} onChange={e=>setTitle(e.target.value)} maxLength={255} style={{width:'100%',padding:10,border:'1px solid var(--line)',borderRadius:8}}/></label>
    <label style={{display:'grid',gap:6,fontSize:13,fontWeight:700}}>Product description<textarea value={description} onChange={e=>setDescription(e.target.value)} maxLength={50000} rows={3} placeholder="Use accurate product details only." style={{width:'100%',padding:10,border:'1px solid var(--line)',borderRadius:8,resize:'vertical'}}/></label>
    {notice && <p className="muted" role="status">{notice}</p>}
    {error && <p className="error-box" role="alert">{error}</p>}
    <div style={{display:'flex',gap:8,flexWrap:'wrap'}}><button className="button button-secondary" type="button" disabled={suggesting||saving} onClick={()=>void generateDraft()}>{suggesting?'Drafting…':'Generate AI draft'}</button><button className="button button-primary" type="button" disabled={saving||suggesting} onClick={()=>void apply()}>{saving?'Applying…':'Review & apply content fix'}</button></div>
  </div>;
}
