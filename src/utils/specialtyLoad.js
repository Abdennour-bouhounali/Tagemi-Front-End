// Patients who will still pass a specialty today: checked in and not done there
// (on hold for it, in its queue, called, or in dilatation). Shown next to each
// specialty when the desk adds one, to send patients where the wait is short.
export const LOAD_STATUSES = ['Waiting', 'Present', 'Commingsoon', 'DilatationSent', 'Dilatation'];

/** { [event_specialty_id]: count } from the event's appointments. */
export function specialtyLoad(appointments) {
  const load = {};
  for (const a of appointments || []) {
    if (LOAD_STATUSES.includes(a.status)) {
      load[a.event_specialty_id] = (load[a.event_specialty_id] || 0) + 1;
    }
  }
  return load;
}

export const todayDate = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD, local time
const nowTime = () => new Date().toTimeString().slice(0, 8); // HH:MM:SS, local time
const dateOf = (day) => (day?.day_date || '').slice(0, 10);
const isFull = (h) => Number(h.counter) >= Number(h.max_allowed);

/**
 * A new registration can be booked: the specialty has a day today (the person
 * at the desk takes the current hour, even when full) or a free hour later.
 */
export function hasFreeSlot(eventSpecialty) {
  const today = todayDate();
  return (eventSpecialty?.days || []).some((d) => dateOf(d) === today
    || (dateOf(d) > today && (d.hours || []).some((h) => !isFull(h))));
}

/**
 * Day and hour pre-selected for a new appointment: the only day (or today's),
 * and on today the hour of registration (the last hour that started, the
 * first one before the day starts); another day: its first hour with room.
 */
export function defaultSlot(eventSpecialty) {
  const days = [...(eventSpecialty?.days || [])].sort((a, b) => dateOf(a).localeCompare(dateOf(b)));
  const day = days.length === 1 ? days[0] : days.find((d) => dateOf(d) === todayDate());
  if (!day) return { dayId: null, hourId: null };
  const hours = [...(day.hours || [])].sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  let hour;
  if (dateOf(day) === todayDate()) {
    const now = nowTime();
    hour = hours.filter((h) => (h.time || '') <= now).pop() || hours[0];
  } else {
    hour = hours.find((h) => !isFull(h)) || null;
  }
  return { dayId: day.id, hourId: hour?.id ?? null };
}

/** Arabic search key: hamza forms, ta marbuta, alef maqsura and diacritics don't matter. */
export function searchKey(text) {
  return String(text || '')
    .replace(/[ً-ْٰـ]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}
