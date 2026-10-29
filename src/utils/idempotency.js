/**
 * Key sent as the Idempotency-Key header: the API answers every request
 * carrying the same key once, so a retry after a lost answer (slow network)
 * cannot book or create twice. Keep the key while retrying the same
 * submission; take a new one once an answer arrived.
 */
export const newIdempotencyKey = () => (
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`
);
