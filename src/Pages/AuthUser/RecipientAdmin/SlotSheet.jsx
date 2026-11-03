import { API_BASE_URL } from '../../../config/environment';
import { useEffect, useMemo, useState } from "react";
import { Check, Clock, PlusCircle, AlertTriangle } from "lucide-react";
import { Button, EmptyState, Field, SelectInput, Sheet, useToast, cx } from "../../../Components/ui";

const dateOf = (day) => (day?.day_date || '').slice(0, 10);
const timeOf = (hour) => (hour?.time || '').slice(0, 5);

/**
 * Super admin: change an appointment's day/hour ("reschedule"), or book one
 * more specialty for the patient ("add"). Full hours can be chosen (the
 * super admin decides); they are marked. Both actions are logged server-side.
 *
 * request = { mode: 'reschedule', appointment } | { mode: 'add', patient }
 */
export default function SlotSheet({ request, event, token, onClose, onDone }) {
  const toast = useToast();
  const mode = request?.mode;
  const appointment = request?.appointment;
  const patient = request?.patient;

  const [esId, setEsId] = useState(null);
  const [dayId, setDayId] = useState(null);
  const [hourId, setHourId] = useState(null);
  const [saving, setSaving] = useState(false);

  const eventSpecialties = event?.event_specialties || [];
  const booked = useMemo(
    () => new Set((patient?.all_appointments || []).map((a) => a.event_specialty_id)),
    [patient],
  );
  const addable = eventSpecialties.filter((es) => !booked.has(es.id));

  useEffect(() => {
    setEsId(mode === 'reschedule' ? appointment?.event_specialty_id : null);
    setDayId(mode === 'reschedule' ? appointment?.day_id : null);
    setHourId(null);
  }, [request]);

  const es = eventSpecialties.find((e) => e.id === esId);
  const days = [...(es?.days || [])].sort((a, b) => dateOf(a).localeCompare(dateOf(b)));
  const day = days.find((d) => d.id === dayId);
  const hours = [...(day?.hours || [])].sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  const hour = hours.find((h) => h.id === hourId);
  const isFull = (h) => Number(h.counter) >= Number(h.max_allowed);

  const submit = async () => {
    if (!dayId || !hourId) return;
    setSaving(true);
    try {
      const url = mode === 'reschedule'
        ? `${API_BASE_URL}/api/appointments/${appointment.id}/reschedule`
        : `${API_BASE_URL}/api/appointments/${patient.id}/add-specialty`;
      const res = await fetch(url, {
        method: mode === 'reschedule' ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ event_specialty_id: esId, day_id: dayId, hour_id: hourId }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast(data.message || 'حُفظ التغيير');
        onDone();
      } else {
        toast(data.message || 'تعذر حفظ التغيير. أعد المحاولة.', 'error');
      }
    } catch (err) {
      console.error('Slot change error:', err);
      toast('تعذر الاتصال بالخادم. تحقق من الشبكة.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const limit = Number(event?.nbr_of_allowed_specialties || 1);
  const title = mode === 'reschedule' ? 'تغيير وقت الموعد' : 'إضافة تخصص للزائر';

  return (
    <Sheet
      open={!!request}
      onClose={onClose}
      title={title}
      footer={request && (
        <Button size="lg" block icon={mode === 'reschedule' ? Clock : PlusCircle} loading={saving} disabled={!hourId} onClick={submit}>
          {mode === 'reschedule' ? 'غيّر الوقت' : 'أضف التخصص'}
        </Button>
      )}
    >
      {request && (
        <div className="space-y-4">
          {mode === 'reschedule' ? (
            <p className="text-sm text-muted">
              موعد #{appointment.patient_id} في {appointment.event_specialty?.specialty?.name || 'التخصص'}، حالياً يوم {dateOf(appointment.day) || '-'} الساعة {timeOf(appointment.hour) || '-'}.
            </p>
          ) : (
            <>
              <p className="text-sm text-muted">
                #{patient.patient_id} {patient.full_name}: {booked.size} من {limit} تخصص مسموح في هذا الحدث.
              </p>
              {addable.length === 0 ? (
                <EmptyState title="لا يوجد تخصص آخر">الزائر حاجز كل تخصصات الحدث.</EmptyState>
              ) : (
                <Field label="التخصص">
                  <SelectInput
                    value={esId ?? ''}
                    onChange={(e) => { setEsId(Number(e.target.value) || null); setDayId(null); setHourId(null); }}
                  >
                    <option value="">اختر التخصص</option>
                    {addable.map((e) => <option key={e.id} value={e.id}>{e.specialty?.name || `#${e.id}`}</option>)}
                  </SelectInput>
                </Field>
              )}
            </>
          )}

          {es && (
            <Field label="اليوم">
              <SelectInput value={dayId ?? ''} onChange={(e) => { setDayId(Number(e.target.value) || null); setHourId(null); }}>
                <option value="">اختر اليوم</option>
                {days.map((d) => <option key={d.id} value={d.id}>{dateOf(d)}</option>)}
              </SelectInput>
            </Field>
          )}

          {day && (
            hours.length === 0 ? <EmptyState title="لا توجد ساعات في هذا اليوم" /> : (
              <div role="radiogroup" aria-label="الساعة" className="grid grid-cols-3 gap-2">
                {hours.map((h) => {
                  const active = h.id === hourId;
                  const current = mode === 'reschedule' && h.id === appointment.hour_id;
                  return (
                    <button
                      key={h.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      disabled={current}
                      onClick={() => setHourId(h.id)}
                      className={cx(
                        'rounded-xl border p-2 text-center min-h-[3.25rem] disabled:opacity-40',
                        active ? 'border-ink ring-2 ring-ink' : 'border-line hover:bg-ink-faint',
                      )}
                    >
                      <span className="flex items-center justify-center gap-1 font-semibold" dir="ltr">
                        {timeOf(h)} {active && <Check className="w-4 h-4" />}
                      </span>
                      <span className={cx('block text-xs mt-0.5', isFull(h) ? 'text-red-700' : 'text-muted')}>
                        {current ? 'الحالي' : isFull(h) ? 'ممتلئ' : `${h.counter}/${h.max_allowed}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            )
          )}

          {hour && isFull(hour) && (
            <p className="flex items-start gap-2 text-sm text-red-700">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              هذه الساعة ممتلئة ({hour.counter}/{hour.max_allowed}). سيُضاف الموعد فوق السعة.
            </p>
          )}
          <p className="text-xs text-muted">يُسجَّل هذا التغيير باسمك ووقته.</p>
        </div>
      )}
    </Sheet>
  );
}
