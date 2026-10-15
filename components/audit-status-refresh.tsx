'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuditStatusRefresh({ active, auditId }: { active: boolean; auditId: string }) {
  const router = useRouter();

  useEffect(() => {
    if (!active) return;
    let stopped = false;
    let inFlight = false;
    let lastState = '';

    const refreshStatus = async () => {
      if (inFlight || stopped) return;
      inFlight = true;
      try {
        const response = await fetch(`/api/audits/${encodeURIComponent(auditId)}/status`, {
          method: 'GET',
          cache: 'no-store',
          headers: { Accept: 'application/json' },
        });
        if (!response.ok || stopped) return;
        const data = await response.json();
        const state = [data.audit?.status ?? '', data.job?.status ?? ''].join(':');
        if (!lastState || state !== lastState) router.refresh();
        lastState = state;
      } catch {
        // Keep polling through transient network errors; do not trap the user on stale UI.
      } finally {
        inFlight = false;
      }
    };

    void refreshStatus();
    const timer = window.setInterval(() => void refreshStatus(), 4000);
    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, [active, auditId, router]);

  return null;
}
