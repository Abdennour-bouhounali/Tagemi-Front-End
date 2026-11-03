import { useEffect, useState } from 'react';

// Live visit timers (دخل -> إجتاز). Times come from the server; `offsetMs`
// (server clock - this device's clock) keeps the elapsed time right when the
// device clock is off.

/** Current time in ms, refreshed every `everyMs`. */
export function useNow(everyMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), everyMs);
    return () => clearInterval(id);
  }, [everyMs]);
  return now;
}

/** Server clock minus device clock, from a response's `server_time`. */
export const serverOffset = (serverTime) => (serverTime ? new Date(serverTime).getTime() - Date.now() : 0);

export const elapsedSeconds = (enteredAt, now, offsetMs = 0) =>
  enteredAt ? Math.max(0, Math.floor((now + offsetMs - new Date(enteredAt).getTime()) / 1000)) : 0;

/** 75 -> "1:15", 3725 -> "1:02:05" */
export function formatElapsed(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const pad = (n) => String(n).padStart(2, '0');
  return h ? `${h}:${pad(m)}:${pad(s % 60)}` : `${m}:${pad(s % 60)}`;
}
