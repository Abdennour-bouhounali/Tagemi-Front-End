import { API_BASE_URL } from '../../../config/environment';
import { useContext, useEffect, useState, useCallback } from 'react';
import { History, RefreshCw } from 'lucide-react';
import { AppContext } from '../../../Context/AppContext';
import { ROLE_NAMES } from '../../../utils/staffNav';
import {
  Button, IconButton, PageHeader, ChipGroup, EmptyState, LoadingState, Sheet, Field, TextInput, SelectInput, useToast, cx,
} from '../../../Components/ui';

const apiUrl = API_BASE_URL;

const when = (iso) => (iso ? new Date(iso).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'medium' }) : '-');

// Route ids kept with the action, by name
const SUBJECT_LABELS = {
  id: 'الرقم', appointment: 'الموعد', doctor: 'الطبيب', user: 'المستخدم', specialtyId: 'التخصص',
  eventSpecialtyId: 'التخصص', draft: 'المسودة', rule: 'الضابط', blog: 'المقال', medium: 'الوسائط',
};

/** "الزائر #7012 Ahmed · الموعد 55" from the ids the server kept with the action */
const subjectText = (s) => {
  if (!s) return '';
  const parts = [];
  if (s.patient_id) parts.push(`الزائر #${s.patient_id}${s.full_name ? ` ${s.full_name}` : ''}`);
  Object.entries(s).forEach(([k, v]) => {
    if (!['patient_id', 'full_name', 'eventId', 'event_id'].includes(k)) parts.push(`${SUBJECT_LABELS[k] || k} ${v}`);
  });
  return parts.join(' · ');
};

/**
 * Super admin: «سجل العمليات», every change made in the staff space (and
 * every staff login attempt): who, when, what, on which event, result.
 */
export default function AdminActions() {
  const { token } = useContext(AppContext);
  const toast = useToast();
  const [filters, setFilters] = useState({ user_id: '', event_id: '', date: '', patient_id: '', action: '', result: 'all' });
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(null);
  const closeOpen = useCallback(() => setOpen(null), []);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    ['user_id', 'event_id', 'date', 'patient_id', 'action'].forEach((k) => filters[k] && params.set(k, filters[k]));
    if (filters.result === 'failed') params.set('failed', '1');
    try {
      const res = await fetch(`${apiUrl}/api/admin-actions?${params}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      const json = await res.json();
      if (res.ok) setData(json);
      else toast(json.message || 'تعذر تحميل السجل', 'error');
    } catch {
      toast('تعذر الاتصال بالخادم', 'error');
    } finally {
      setLoading(false);
    }
  }, [filters, page, token, toast]);

  useEffect(() => { load(); }, [load]);

  const setFilter = (key, value) => {
    setPage(1);
    setFilters((f) => ({ ...f, [key]: value }));
  };

  if (!data) return <LoadingState />;

  // Each label once (several actions share a label)
  const actionOptions = Object.entries(data.labels || {}).reduce((acc, [action, label]) => {
    if (!acc.some((o) => o.label === label)) acc.push({ action, label });
    return acc;
  }, []);

  return (
    <div>
      <PageHeader
        title="سجل العمليات"
        subtitle="كل تعديل في فضاء المشرفين وكل محاولة دخول: من قام به ومتى"
        actions={<IconButton icon={RefreshCw} label="تحديث" onClick={load} disabled={loading} />}
      />

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-3">
        <Field label="المستخدم">
          <SelectInput value={filters.user_id} onChange={(e) => setFilter('user_id', e.target.value)}>
            <option value="">الكل</option>
            {data.users.map((u) => (
              <option key={`${u.user_id}-${u.user_name}`} value={u.user_id}>{u.user_name} ({ROLE_NAMES[u.role_id] || u.role_id})</option>
            ))}
          </SelectInput>
        </Field>
        <Field label="الحدث">
          <SelectInput value={filters.event_id} onChange={(e) => setFilter('event_id', e.target.value)}>
            <option value="">الكل</option>
            {data.events.map((ev) => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
          </SelectInput>
        </Field>
        <Field label="العملية">
          <SelectInput value={filters.action} onChange={(e) => setFilter('action', e.target.value)}>
            <option value="">الكل</option>
            {actionOptions.map((o) => <option key={o.action} value={o.action}>{o.label}</option>)}
          </SelectInput>
        </Field>
        <Field label="اليوم">
          <TextInput type="date" value={filters.date} onChange={(e) => setFilter('date', e.target.value)} />
        </Field>
        <Field label="رقم الزائر">
          <TextInput inputMode="numeric" value={filters.patient_id} onChange={(e) => setFilter('patient_id', e.target.value.replace(/\D/g, ''))} />
        </Field>
      </div>
      <ChipGroup
        label="النتيجة"
        className="mb-3"
        value={filters.result}
        onChange={(v) => setFilter('result', v)}
        options={[{ value: 'all', label: 'الكل' }, { value: 'failed', label: 'المرفوضة فقط' }]}
      />

      <p className="text-sm text-muted mb-2">{data.total} عملية</p>

      {data.actions.length === 0 ? (
        <EmptyState icon={History} title="لا توجد عمليات">غيّر التصفية أو انتظر أول تعديل.</EmptyState>
      ) : (
        <ul className={cx('space-y-2', loading && 'opacity-60')}>
          {data.actions.map((a) => (
            <li key={a.id}>
              <button type="button" onClick={() => setOpen(a)} className="w-full text-start rounded-xl border border-line bg-white p-3 hover:bg-ink-faint">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-ink truncate">{a.label}</span>
                  {a.status >= 400 && (
                    <span className="shrink-0 text-xs font-semibold rounded-full px-2 py-0.5 bg-red-50 text-red-700">مرفوضة ({a.status})</span>
                  )}
                </div>
                <p className="text-sm text-ink-soft mt-0.5">
                  {a.user || 'مستخدم محذوف'} · {ROLE_NAMES[a.role_id] || ''}
                </p>
                {subjectText(a.subject) && <p className="text-xs text-muted mt-0.5 truncate">{subjectText(a.subject)}</p>}
                <p className="text-xs text-muted mt-0.5">
                  <time dir="ltr" dateTime={a.at}>{when(a.at)}</time>
                  {a.event && ` · ${a.event}`}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}

      {data.last_page > 1 && (
        <div className="flex items-center justify-between gap-2 mt-4">
          <Button variant="secondary" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>الأحدث</Button>
          <span className="text-sm text-muted">صفحة {data.page} من {data.last_page}</span>
          <Button variant="secondary" disabled={page >= data.last_page || loading} onClick={() => setPage((p) => p + 1)}>الأقدم</Button>
        </div>
      )}

      <Sheet open={!!open} onClose={closeOpen} title={open?.label || ''}>
        {open && (
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-2"><dt className="text-muted">بواسطة</dt><dd className="font-semibold">{open.user || 'مستخدم محذوف'} ({ROLE_NAMES[open.role_id] || open.role_id})</dd></div>
            <div className="flex justify-between gap-2"><dt className="text-muted">الوقت</dt><dd className="font-semibold" dir="ltr">{when(open.at)}</dd></div>
            <div className="flex justify-between gap-2"><dt className="text-muted">الحدث</dt><dd className="font-semibold">{open.event || '-'}</dd></div>
            <div className="flex justify-between gap-2"><dt className="text-muted">النتيجة</dt><dd className={cx('font-semibold', open.status >= 400 && 'text-red-700')}>{open.status >= 400 ? `مرفوضة (${open.status})` : 'تمت'}</dd></div>
            <div className="flex justify-between gap-2"><dt className="text-muted">عنوان IP</dt><dd className="font-semibold" dir="ltr">{open.ip || '-'}</dd></div>
            {subjectText(open.subject) && <div><dt className="text-muted">على</dt><dd className="font-semibold">{subjectText(open.subject)}</dd></div>}
            {open.input && (
              <div>
                <dt className="text-muted mb-1">البيانات المرسلة</dt>
                <dd><pre dir="ltr" className="text-xs bg-paper border border-line rounded-xl p-2 overflow-x-auto whitespace-pre-wrap break-all">{JSON.stringify(open.input, null, 2)}</pre></dd>
              </div>
            )}
          </dl>
        )}
      </Sheet>
    </div>
  );
}
