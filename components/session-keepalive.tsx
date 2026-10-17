'use client';

import { useEffect } from 'react';

export default function SessionKeepAlive() {
  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        await fetch('/api/auth/refresh', {
          method: 'POST',
          cache: 'no-store',
          credentials: 'same-origin',
          headers: { 'x-pagefix-session-refresh': '1' },
        });
      } catch {
        // A transient refresh failure must not force a logout or interrupt work.
      }
    };
    void refresh();
    const timer = window.setInterval(() => {
      if (active) void refresh();
    }, 12 * 60 * 60 * 1000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  return null;
}
