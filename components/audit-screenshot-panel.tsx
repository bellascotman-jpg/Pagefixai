'use client';

import { useState } from 'react';

type Screenshot = { viewport: string; createdAt: string };

export default function AuditScreenshotPanel({ auditId, screenshots }: { auditId: string; screenshots: Screenshot[] }) {
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const [retrying, setRetrying] = useState(false);
  const [message, setMessage] = useState('');

  const viewports = (['desktop', 'mobile'] as const).map(viewport => ({
    viewport,
    stored: screenshots.some(item => item.viewport === viewport),
  }));

  async function retryCapture() {
    setRetrying(true);
    setMessage('');
    try {
      const response = await fetch('/api/audits/' + encodeURIComponent(auditId) + '/screenshots', {
        method: 'POST',
        headers: { Accept: 'application/json' },
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof result.message === 'string' ? result.message : 'Screenshot retry failed.');
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Screenshot retry failed. Please try again.');
    } finally {
      setRetrying(false);
    }
  }

  return <div>
    <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))' }}>
      {viewports.map(({ viewport, stored }) => {
        const unavailable = !stored || failed[viewport];
        return <article className="card" key={viewport}>
          <h3 style={{ textTransform: 'capitalize' }}>{viewport} view</h3>
          {unavailable ? <div className="error-box" role="status">
            <strong>{stored ? 'Screenshot could not be loaded' : 'Screenshot not available'}</strong>
            <p className="muted">{stored
              ? 'A screenshot record exists, but its image could not be retrieved. Retry to validate storage and recapture this view.'
              : 'No valid stored image is available for this viewport yet.'}</p>
          </div> : <div style={{ overflow: 'hidden', border: '1px solid var(--line)', borderRadius: 10, background: 'var(--surface, #fff)' }}>
            {/* This is a same-origin, owner-authorized image endpoint. Native img avoids
                optimizer/configuration failures and exposes load errors for recovery. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={'/api/audits/' + encodeURIComponent(auditId) + '/screenshots/' + viewport}
              alt={'Page screenshot captured at ' + viewport + ' viewport'}
              loading="lazy"
              onError={() => setFailed(previous => ({ ...previous, [viewport]: true }))}
              style={{ display: 'block', width: '100%', height: 'auto' }}
            />
          </div>}
        </article>;
      })}
    </div>
    {(viewports.some(item => !item.stored) || Object.values(failed).some(Boolean)) && <div style={{ marginTop: 14 }}>
      <button className="button button-secondary" type="button" onClick={retryCapture} disabled={retrying}>
        {retrying ? 'Checking storage and recapturing…' : 'Retry screenshot capture'}
      </button>
      {message && <p role="alert" className="error-text">{message}</p>}
    </div>}
  </div>;
}
