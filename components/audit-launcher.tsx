'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuditLauncher() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const response = await fetch('/api/audits', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error || 'Audit could not be started.');
      router.push(`/dashboard/audits/${data.audit.id}`);
    } catch (e) { setError(e instanceof Error ? e.message : 'Audit could not be started.'); }
    finally { setLoading(false); }
  }
  return <form className="audit-form" onSubmit={submit}><input type="url" required value={url} onChange={e => setUrl(e.target.value)} placeholder="https://yourstore.com/products/example" aria-label="Store page URL" /> <button className="primary-button" disabled={loading}>{loading ? 'Starting…' : 'Analyze page'}</button>{error && <div className="error-box" style={{ gridColumn: '1 / -1' }} role="alert">{error}</div>}</form>;
}
