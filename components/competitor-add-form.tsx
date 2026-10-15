'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CompetitorAddForm() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setSaving(true); setError('');
    try {
      const response = await fetch('/api/competitors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url, name: name.trim() || undefined }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Competitor could not be added.');
      setUrl(''); setName(''); router.refresh();
    } catch (error) { setError(error instanceof Error ? error.message : 'Competitor could not be added.'); }
    finally { setSaving(false); }
  }
  return <form className="competitor-add-form" onSubmit={submit}><div><label htmlFor="competitor-name">Display name <span>(optional)</span></label><input id="competitor-name" value={name} onChange={e=>setName(e.target.value)} maxLength={100} placeholder="Competitor brand"/></div><div><label htmlFor="competitor-url">Public website URL</label><input id="competitor-url" type="url" required value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://competitor.com"/></div><button className="primary-button" disabled={saving}>{saving ? 'Checking URL…' : 'Add competitor →'}</button>{error && <p className="error-box" role="alert">{error}</p>}</form>;
}
