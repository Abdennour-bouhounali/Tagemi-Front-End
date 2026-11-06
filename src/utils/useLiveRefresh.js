import { API_BASE_URL } from '../config/environment';
import { useEffect, useRef } from 'react';

const apiUrl = API_BASE_URL;

// Keeps staff screens in sync: polls the event's cheap "live version" and calls
// onChange() only when something the screen shows changed (someone else checked
// in, passed, pushed down...). Paused while the tab is hidden.
//
// Server traffic on a busy visit day:
// - parts: watch only some markers of the server (`es_<eventSpecialtyId>`,
//   `doctors`, `open`), so a specialty queue ignores the other specialties.
// - minGapMs: heavy screens reload at most once per gap; changes in between
//   are collapsed into one reload at the end of the gap.
// - every 10 s: this poll was most of the server's requests at 5 s.
// - each device polls with a random ±20 % jitter, so 30 tablets don't hit the
//   server in the same second.
//
// options: a number (poll interval, ms) or { intervalMs, minGapMs, parts }.
export default function useLiveRefresh(eventId, token, onChange, options = {}) {
  const { intervalMs = 10000, minGapMs = 0, parts = null } =
    typeof options === 'number' ? { intervalMs: options } : options;
  const partsKey = parts ? parts.filter(Boolean).join(',') : '';

  const lastVersion = useRef(null);
  const callback = useRef(onChange);
  callback.current = onChange;

  useEffect(() => {
    if (!eventId || !token) return undefined;
    let stopped = false;
    let pollTimer = null;
    let trailingTimer = null;
    let lastRun = 0;
    lastVersion.current = null;
    const watched = partsKey ? partsKey.split(',') : null;

    const fire = () => {
      const wait = lastRun + minGapMs - Date.now();
      if (wait <= 0) {
        lastRun = Date.now();
        callback.current();
      } else if (!trailingTimer) {
        trailingTimer = setTimeout(() => {
          trailingTimer = null;
          if (stopped) return;
          lastRun = Date.now();
          callback.current();
        }, wait);
      }
    };

    const check = async () => {
      if (stopped || document.visibilityState !== 'visible') return;
      try {
        const res = await fetch(`${apiUrl}/api/events/${eventId}/live-version`, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        });
        if (!res.ok) return;
        const json = await res.json();
        const version = watched
          ? watched.map((p) => json.parts?.[p] ?? '-').join('|')
          : json.version;
        if (lastVersion.current !== null && version !== lastVersion.current) {
          fire();
        }
        lastVersion.current = version;
      } catch {
        // Network blip: try again on the next tick
      }
    };

    const schedule = () => {
      pollTimer = setTimeout(async () => {
        await check();
        if (!stopped) schedule();
      }, intervalMs * (0.8 + Math.random() * 0.4));
    };

    check();
    schedule();
    const onVisible = () => document.visibilityState === 'visible' && check();
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      stopped = true;
      clearTimeout(pollTimer);
      clearTimeout(trailingTimer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [eventId, token, intervalMs, minGapMs, partsKey]);
}
