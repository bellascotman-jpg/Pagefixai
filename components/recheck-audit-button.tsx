'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RecheckAuditButton({ auditId }: { auditId: string }) {
  const router = useRouter();
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState('');
  async function recheck() {
    setWorking(true); setMessage('');
    try {
      const response = await fetch(`/api/audits/${auditId}/recheck`, { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'The recheck could not be started.');
      if (!data.auditId) throw new Error(data.message || 'No recheck report was returned.');
      router.push(`/dashboard/audits/${data.auditId}`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The recheck could not be completed.');
    } finally { setWorking(false); }
  }
  return <div className="recheck-action"><button type="button" className="primary-button" onClick={recheck} disabled={working}>{working ? 'Rechecking page…' : 'Reinspect this page'}</button>{message && <p role="status" className="muted recheck-message">{message}</p>}</div>;
}
