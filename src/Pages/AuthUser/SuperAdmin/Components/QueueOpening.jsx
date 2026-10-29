import { API_BASE_URL } from '../../../../config/environment';
import { useCallback, useContext, useEffect, useState } from 'react';
import { ChevronRight, Lock, LogIn, LogOut, Unlock } from 'lucide-react';
import { AppContext } from '../../../../Context/AppContext';
import useLiveRefresh from '../../../../utils/useLiveRefresh';
import { Button, PageHeader, LoadingState, EmptyState, useToast, cx } from '../../../../Components/ui';

const apiUrl = API_BASE_URL;

/**
 * Super admin, visit day: record each doctor's arrival and departure. The
 * first doctor of a specialty who arrives opens its queue (the waiting
 * patients are sent to it); when the last one leaves it closes (the current
 * queue is still served). The manual button stays for events planned
 * without doctors.
 */
export default function QueueOpening({ event, onClose, backLabel = 'الأحداث' }) {
  const { token } = useContext(AppContext);
  const toast = useToast();
  const [data, setData] = useState(null);
  const [doctorsBySpecialty, setDoctorsBySpecialty] = useState({});
  const [busy, setBusy] = useState(null);

  const load = useCallback(async () => {
    const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' };
    try {
      const [stationsRes, doctorsRes] = await Promise.all([
        fetch(`${apiUrl}/api/events/${event.id}/stations`, { headers }),
        fetch(`${apiUrl}/api/events/${event.id}/doctors-today`, { headers }),
      ]);
      const json = await stationsRes.json();
      if (stationsRes.ok) setData(json);
      else toast(json.message || 'تعذر تحميل التخصصات', 'error');
      if (doctorsRes.ok) {
        const doctors = await doctorsRes.json();
        setDoctorsBySpecialty(Object.fromEntries((doctors.specialties || []).map((s) => [s.event_specialty_id, s.doctors])));
      }
    } catch {
      toast('تعذر الاتصال بالخادم', 'error');
    }
  }, [event.id, token, toast]);

  useEffect(() => { load(); }, [load]);
  useLiveRefresh(event.id, token, load);

  const run = async (key, path, method) => {
    setBusy(key);
    try {
      const res = await fetch(`${apiUrl}${path}`, { method, headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } });
      const json = await res.json().catch(() => ({}));
      toast(json.message || (res.ok ? 'تم' : 'تعذر تنفيذ العملية'), res.ok ? 'success' : 'error');
      if (res.ok) load();
    } catch {
      toast('تعذر الاتصال بالخادم', 'error');
    } finally {
      setBusy(null);
    }
  };

  const toggleOpen = (s) => run(`open-${s.event_specialty_id}`, `/api/event-specialties/${s.event_specialty_id}/toggle-open`, 'PATCH');
  const attend = (s, d, action) => run(`${action}-${s.event_specialty_id}-${d.doctor_id}`, `/api/event-specialties/${s.event_specialty_id}/doctors/${d.doctor_id}/${action}`, 'POST');

  const stations = data?.stations || [];
  const openCount = stations.filter((s) => s.is_open).length;

  return (
    <div className="max-w-2xl lg:max-w-4xl mx-auto">
      <button type="button" onClick={onClose} className="inline-flex items-center gap-1 text-sm text-muted mb-2 min-h-[2.75rem]">
        <ChevronRight className="w-4 h-4" /> {backLabel}
      </button>
      <PageHeader
        title="الأطباء والطوابير"
        subtitle={data ? `${event.name} · مفتوح اليوم ${openCount} من ${stations.length}` : event.name}
      />
      <p className="text-sm text-muted mb-3">
        سجّل وصول كل طبيب ومغادرته. وصول أول طبيب يفتح طابور تخصصه ويُوجَّه إليه المرضى المنتظرون، ومغادرة آخر طبيب حاضر تغلقه. كل التخصصات تُغلق من جديد في بداية كل يوم.
      </p>

      {!data ? (
        <LoadingState />
      ) : stations.length === 0 ? (
        <div className="bg-white border border-line rounded-2xl">
          <EmptyState title="لا توجد تخصصات في هذا الحدث" />
        </div>
      ) : (
        <ul className="space-y-3 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-3 lg:items-start">
          {stations.map((s) => {
            const doctors = doctorsBySpecialty[s.event_specialty_id] || [];
            return (
              <li key={s.event_specialty_id} className="bg-white border border-line rounded-2xl">
                <div className="flex items-center gap-3 px-4 min-h-[4.5rem]">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-ink truncate">{s.name}</p>
                    <p className="text-sm text-muted">
                      {s.is_open ? `في الطابور ${s.in_queue} · أنهى الفحص ${s.completed}` : `مغلق، ينتظره ${s.waiting} مريض`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleOpen(s)}
                    disabled={busy !== null}
                    className={cx('shrink-0 inline-flex items-center gap-1.5 h-10 px-4 rounded-full text-sm font-semibold border disabled:opacity-60',
                      s.is_open ? 'border-st-queue/40 text-st-queue bg-st-queue-bg' : 'border-red-300 text-red-700 bg-red-50')}
                    aria-label={s.is_open ? `إغلاق طابور ${s.name}` : `فتح طابور ${s.name}`}
                  >
                    {s.is_open ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    {busy === `open-${s.event_specialty_id}` ? '...' : s.is_open ? 'مفتوح · أغلق' : 'افتح'}
                  </button>
                </div>

                {doctors.length > 0 && (
                  <ul className="border-t border-line divide-y divide-line">
                    {doctors.map((d) => {
                      const key = (action) => `${action}-${s.event_specialty_id}-${d.doctor_id}`;
                      const status = d.present
                        ? `وصل ${d.arrived_at}`
                        : d.left_at ? `غادر ${d.left_at} (وصل ${d.arrived_at})` : 'لم يصل بعد';
                      return (
                        <li key={d.doctor_id} className="flex items-center gap-3 px-4 py-2.5">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-ink truncate">{d.full_name}</p>
                            <p className="text-xs text-muted truncate">
                              {/* Own box: "09:00–12:00" must not be reordered by the Arabic line */}
                              <span dir="ltr" className="inline-block">{d.intervals.join(', ')}</span> · {d.planned_visits} زيارة
                            </p>
                            <p className={cx('text-xs mt-0.5', d.present ? 'text-st-queue font-semibold' : 'text-muted')}>{status}</p>
                          </div>
                          {d.present ? (
                            <Button size="sm" variant="secondary" icon={LogOut} loading={busy === key('leave')} disabled={busy !== null} onClick={() => attend(s, d, 'leave')}>
                              غادر
                            </Button>
                          ) : (
                            <Button size="sm" icon={LogIn} loading={busy === key('arrive')} disabled={busy !== null} onClick={() => attend(s, d, 'arrive')}>
                              وصل
                            </Button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
