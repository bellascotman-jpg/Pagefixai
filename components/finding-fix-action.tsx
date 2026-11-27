'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function FindingFixAction({ findingId, auditId, initialStatus }: { findingId: string; auditId: string; initialStatus: string }) {
  const [status, setStatus] = useState(initialStatus);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function markFixed() {
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch(`/api/findings/${findingId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not update this finding.');
      setStatus(data.finding.status);
      setMessage('Marked as completed. Run a fresh audit to verify the change.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not update this finding.');
    } finally {
      setBusy(false);
    }
  }
  return <div className="pf-fix-actions">
    {status === 'COMPLETED' || status === 'VERIFIED' ? <Link href={`/dashboard/audits/${auditId}`}>Verify after change →</Link> : <button type="button" onClick={markFixed} disabled={busy} aria-busy={busy}>{busy ? 'Saving…' : 'Mark as fixed'}</button>}
    {message && <small role="status">{message}</small>}
  </div>;
}
