'use client';

import { useState } from 'react';

export default function CaptureScreenshotsButton({ auditId }: { auditId: string }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  async function capture() {
    setBusy(true);
    setMessage('');
    setIsError(false);
    try {
      const response = await fetch('/api/audits/' + auditId + '/screenshots', { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Screenshot capture failed.');
      setMessage(data.message || 'Screenshots captured.');
      window.location.reload();
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : 'Screenshot capture failed.');
    } finally {
      setBusy(false);
    }
  }

  return <div className="screenshot-capture-action">
    <button className="button button-secondary" type="button" onClick={capture} disabled={busy}>
      {busy ? 'Capturing desktop and mobile…' : 'Capture desktop + mobile screenshots'}
    </button>
    {message && <p role="status" aria-live="polite" className={isError ? 'error-text' : 'muted'}>{message}</p>}
    <p className="muted" style={{ fontSize: 12 }}>Screenshot capture runs separately so it cannot hold up your audit report.</p>
  </div>;
}
