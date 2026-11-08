// «تقييم المتطوعين»: helpers shared by the volunteer page, the super admin
// dashboard and the projector screen.
import { API_BASE_URL } from '../../config/environment';

export const apiUrl = API_BASE_URL;

/** 1..5 and 0 = «لا أعرف» (left out of the averages). */
export const RATING_LABELS = { 1: 'ضعيف جداً', 2: 'ضعيف', 3: 'متوسط', 4: 'جيد', 5: 'ممتاز', 0: 'لا أعرف' };
export const RATING_ORDER = [1, 2, 3, 4, 5, 0];

/** Verbal reading of an average out of 5. */
export const verbal = (avg) => {
  if (avg == null) return '—';
  if (avg >= 4.5) return 'ممتاز';
  if (avg >= 3.75) return 'جيد جداً';
  if (avg >= 3) return 'جيد';
  if (avg >= 2.25) return 'متوسط';
  if (avg >= 1.5) return 'ضعيف';
  return 'ضعيف جداً';
};

export const fmtAvg = (avg, digits = 2) => (avg == null ? '—' : Number(avg).toFixed(digits));

/** The volunteer's role axes first (in their order), then the others. */
export const orderFor = (axes, roleId) => {
  const mine = axes.filter((a) => (a.roles || []).includes(roleId));
  const rest = axes.filter((a) => !(a.roles || []).includes(roleId));
  return [...mine, ...rest];
};

export const isAnswered = (answer) => answer?.status === 'done' || answer?.status === 'skipped';

/** mm:ss of a remaining time in ms. */
export const fmtClock = (ms) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

export const evaluationLink = (eventId) => `${window.location.origin}/eval/${eventId}`;

/** Short random id for new roles, axes and questions (never reused). */
export const newId = (prefix) => `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

/** JSON fetch; throws an Error carrying the server message and status. */
export async function requestJson(path, { method = 'GET', body, token, evalToken } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  if (evalToken) headers['X-Eval-Token'] = evalToken;

  let res;
  try {
    res = await fetch(`${apiUrl}/api${path}`, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  } catch {
    const error = new Error('تعذّر الاتصال بالخادم. تحقق من الإنترنت ثم أعد المحاولة.');
    error.status = 0;
    throw error;
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const firstError = json.errors && Object.values(json.errors)[0]?.[0];
    const error = new Error(firstError || json.message || 'حدث خطأ، أعد المحاولة.');
    error.status = res.status;
    error.data = json;
    throw error;
  }
  return json;
}
