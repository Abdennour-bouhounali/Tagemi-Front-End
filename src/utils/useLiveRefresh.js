import { API_BASE_URL } from '../config/environment';
import { useEffect, useRef } from 'react';

const apiUrl = API_BASE_URL;

// Keeps staff screens in sync: polls the event's cheap "live version" and calls
// onChange() only when appointments changed (someone else checked in, passed,
// pushed down...). Paused while the tab is hidden.
export default function useLiveRefresh(eventId, token, onChange, intervalMs = 5000) {
  const lastVersion = useRef(null);
  const callback = useRef(onChange);
  callback.current = onChange;

  useEffect(() => {
    if (!eventId || !token) return undefined;
    let stopped = false;
    lastVersion.current = null;

    const check = async () => {
      if (stopped || document.visibilityState !== 'visible') return;
      try {
        const res = await fetch(`${apiUrl}/api/events/${eventId}/live-version`, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        });
        if (!res.ok) return;
        const { version } = await res.json();
        if (lastVersion.current !== null && version !== lastVersion.current) {
          callback.current();
        }
        lastVersion.current = version;
      } catch {
        // Network blip: try again on the next tick
      }
    };

    check();
    const timer = setInterval(check, intervalMs);
    const onVisible = () => document.visibilityState === 'visible' && check();
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      stopped = true;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [eventId, token, intervalMs]);
}
