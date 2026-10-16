'use client';

import { useState } from 'react';

const options = [
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'COMPLETED', label: 'Seller marked complete' },
  { value: 'RECHECK_REQUIRED', label: 'Ready to recheck' },
] as const;

const verificationLabels: Record<string, string> = {
  VERIFIED: 'Verified by a fresh completed inspection',
  STILL_DETECTED: 'Still detected on the latest recheck',
  UNABLE_TO_VERIFY: 'Unable to verify on the latest recheck',
};

export default function FindingStatusControl({ id, initialStatus }: { id: string; initialStatus: string }) {
  const normalize = (value: string) => value === 'VERIFIED' ? 'COMPLETED' : value === 'STILL_DETECTED' || value === 'UNABLE_TO_VERIFY' ? 'RECHECK_REQUIRED' : value;
  const [status, setStatus] = useState(normalize(initialStatus));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  async function update(value: string) {
    setSaving(true); setMessage('');
    try {
      const response = await fetch(`/api/findings/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: value }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Status could not be updated.');
      setStatus(data.finding.status);
      setMessage('Saved');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Status could not be updated.');
    } finally { setSaving(false); }
  }
  return <div className="finding-status-control">
    <label htmlFor={`status-${id}`}>Remediation status</label>
    {verificationLabels[initialStatus] && <p className="finding-verification-state" role="status">{verificationLabels[initialStatus]}. The seller's workflow status can still be updated separately.</p>}
    <select id={`status-${id}`} value={status} disabled={saving} onChange={e => update(e.target.value)}>{options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
    <span role="status">{saving ? 'Saving…' : message}</span>
  </div>;
}
