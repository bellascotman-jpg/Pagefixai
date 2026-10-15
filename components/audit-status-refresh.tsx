'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuditStatusRefresh({ active, auditId }: { active: boolean; auditId: string }) {
  const router = useRouter();

  useEffect(() => {
    if (!active) return;
    let stopped = false;
    let inFlight = false;

    const refreshStatus = async () => {
      if (inFlight || stopped) return;
      inFlight = true;
      try {
        const response = await fetch(`/api/audits/${encodeURIComponent(auditId)}/status`, {
          method: 'GET',
          cache: 'no-store',
          headers: { Accept: 'application/json' },
        });
        if (response.ok && !stopped) router.refresh();
      } catch {
        // Keep polling; transient network errors must not leave the page permanently stale.
      } finally {
        inFlight = false;
      }
    };

    void refreshStatus();
    const timer = window.setInterval(() => void refreshStatus(), 5000);
    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, [active, auditId, router]);

  return null;
}
