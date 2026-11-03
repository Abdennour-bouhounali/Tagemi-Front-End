import { API_BASE_URL } from '../../../../config/environment';
import { useContext, useEffect, useMemo, useState } from 'react';
import { Check, UserPlus } from 'lucide-react';
import { AppContext } from '../../../../Context/AppContext';
import { Button, Field, LoadingState, SearchField, Sheet, TextInput, useToast, cx } from '../../../../Components/ui';
import TimeField from '../../../../Components/ui/TimeField';

const apiUrl = API_BASE_URL;

/**
 * Visit day: pick doctors from the registry for a specialty (the training
 * event, a doctor not planned in the event form, a replacement). They are
 * marked as arrived and the queue opens. station: { event_specialty_id,
 * specialty_id, name, is_open }; presentIds: doctors already here.
 */
export default function AddDoctorsSheet({ station, presentIds = [], onClose, onDone }) {
  const { token } = useContext(AppContext);
  const toast = useToast();
  const [doctors, setDoctors] = useState(null);
  const [picked, setPicked] = useState([]);
  const [query, setQuery] = useState('');
  const [endTime, setEndTime] = useState('17:00');
  const [visitMinutes, setVisitMinutes] = useState('20');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!station) return;
    setPicked([]);
    setQuery('');
    if (doctors) return;
    fetch(`${apiUrl}/api/doctors?active=1`, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } })
      .then((res) => res.json().then((json) => (res.ok ? setDoctors(json.doctors || []) : toast(json.message || 'تعذر تحميل الأطباء', 'error'))))
      .catch(() => toast('تعذر الاتصال بالخادم', 'error'));
  }, [station, doctors, token, toast]);

  // This specialty's doctors; a search looks in every specialty
  const shown = useMemo(() => {
    const term = query.trim();
    const own = (d) => (d.specialty_id === station?.specialty_id ? 0 : 1);
    return (doctors || [])
      .filter((d) => !presentIds.includes(d.id))
      .filter((d) => (term ? `${d.full_name} ${d.phone || ''}`.includes(term) : own(d) === 0))
      .sort((a, b) => own(a) - own(b));
  }, [doctors, presentIds, query, station]);

  const toggle = (id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const submit = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${apiUrl}/api/event-specialties/${station.event_specialty_id}/doctors`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctor_ids: picked, end_time: endTime, visit_minutes: Number(visitMinutes) }),
      });
      const json = await res.json().catch(() => ({}));
      toast(json.message || (res.ok ? 'تم' : 'تعذر إضافة الأطباء'), res.ok ? 'success' : 'error');
      if (res.ok) onDone();
    } catch {
      toast('تعذر الاتصال بالخادم', 'error');
    } finally {
      setSaving(false);
    }
  };

  const validMinutes = Number(visitMinutes) >= 5 && Number(visitMinutes) <= 120;

  return (
    <Sheet
      open={!!station}
      onClose={onClose}
      title={station ? (station.is_open ? `أضف أطباء إلى ${station.name}` : `فتح طابور ${station.name}`) : ''}
      footer={station && (
        <>
          <Button icon={UserPlus} className="flex-1" loading={saving} disabled={!picked.length || !validMinutes || !endTime} onClick={submit}>
            {station.is_open ? 'أضف' : 'افتح'}{picked.length ? ` مع ${picked.length} طبيب` : ''}
          </Button>
        </>
      )}
    >
      <p className="text-sm text-muted mb-3">
        اختر الأطباء الحاضرين. يُسجَّل وصولهم الآن ويُفتح الطابور، ويظهرون للمكلف بالتخصص عند «دخل».
      </p>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <Field label="يعمل حتى">
          <TimeField label="يعمل حتى" value={endTime} onChange={setEndTime} invalid={!endTime} />
        </Field>
        <Field label="مدة الزيارة (دقيقة)" error={validMinutes ? null : 'بين 5 و120'}>
          <TextInput type="number" inputMode="numeric" min={5} max={120} value={visitMinutes} invalid={!validMinutes} onChange={(e) => setVisitMinutes(e.target.value)} />
        </Field>
      </div>
      <SearchField value={query} onChange={setQuery} placeholder="ابحث في كل الأطباء بالاسم أو الهاتف" className="mb-2" />

      {!doctors ? (
        <LoadingState />
      ) : shown.length === 0 ? (
        <p className="text-sm text-muted py-4 text-center">
          {query.trim() ? 'لا يوجد طبيب بهذا الاسم' : 'لا يوجد طبيب مسجل في هذا التخصص، ابحث بالاسم في التخصصات الأخرى'}
        </p>
      ) : (
        <ul className="divide-y divide-line border border-line rounded-2xl">
          {shown.map((d) => {
            const on = picked.includes(d.id);
            return (
              <li key={d.id}>
                <button
                  type="button"
                  onClick={() => toggle(d.id)}
                  aria-pressed={on}
                  className={cx('w-full flex items-center gap-3 px-4 min-h-[3.5rem] text-start', on && 'bg-st-queue-bg')}
                >
                  <span className={cx('shrink-0 w-6 h-6 rounded-md border flex items-center justify-center', on ? 'bg-st-queue border-st-queue text-white' : 'border-line')}>
                    {on && <Check className="w-4 h-4" />}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold text-ink truncate">{d.full_name}</span>
                    {d.specialty_id !== station?.specialty_id && (
                      <span className="block text-xs text-muted truncate">{d.specialty?.name}</span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Sheet>
  );
}
