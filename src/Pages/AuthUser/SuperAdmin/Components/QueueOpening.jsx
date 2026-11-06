import { API_BASE_URL } from '../../../../config/environment';
import { useCallback, useContext, useEffect, useState } from 'react';
import { ChevronRight, Coffee, Lock, LogIn, LogOut, Unlock, UserPlus } from 'lucide-react';
import { AppContext } from '../../../../Context/AppContext';
import useLiveRefresh from '../../../../utils/useLiveRefresh';
import { Button, PageHeader, LoadingState, EmptyState, useToast, cx } from '../../../../Components/ui';
import AddDoctorsSheet from './AddDoctorsSheet';
import { attendanceSpans } from '../../../../utils/visitTimer';

const apiUrl = API_BASE_URL;

/**
 * Super admin, visit day: record each doctor's arrival and departure, as many
 * times as needed in a day. «استراحة» is a short absence: the doctor takes no
 * patients until back, the queue and the capacity don't change. The first doctor of a specialty who arrives opens its queue (the waiting
 * patients are sent to it); when the last one leaves it closes (the current
 * queue is still served by the doctors, also the one who left). Once one
 * doctor left, the specialty only takes patients up to the visits planned for
 * the doctors still present (then «اكتمل العدد»). A queue never opens without
 * a present doctor: opening one with no doctor here asks which doctors came.
 */
export default function QueueOpening({ event, onClose, backLabel = 'الأحداث', readOnly = false }) {
  const { token } = useContext(AppContext);
  const toast = useToast();
  const [data, setData] = useState(null);
  const [doctorsBySpecialty, setDoctorsBySpecialty] = useState({});
  const [busy, setBusy] = useState(null);
  const [adding, setAdding] = useState(null); // station whose doctors are being picked
  // Day of the doctors shown: today, or the next visit day before the event (then nothing can be recorded)
  const [visitDay, setVisitDay] = useState(null);
  const locked = readOnly || (visitDay && !visitDay.is_today);

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
        setVisitDay(doctors.date ? { date: doctors.date, is_today: doctors.is_today !== false } : null);
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

  const presentIds = (s) => (doctorsBySpecialty[s.event_specialty_id] || []).filter((d) => d.present).map((d) => d.doctor_id);
  // Closed with no doctor here: pick the doctors who came first
  const openOrClose = (s) => (!s.is_open && presentIds(s).length === 0 ? setAdding(s) : toggleOpen(s));
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
        {readOnly
          ? 'من وصل من الأطباء ومن لم يصل بعد، وأي طوابير مفتوحة. وصول أول طبيب يفتح طابور تخصصه، ومغادرة آخر طبيب تغلقه.'
          : 'سجّل وصول كل طبيب ومغادرته، ويمكن تكرارهما في اليوم نفسه. في «استراحة» لا يدخل إلى الطبيب أحد حتى يعود، ويبقى الطابور مفتوحاً وعدد الزيارات كما هو. وصول أول طبيب يفتح طابور تخصصه ويُوجَّه إليه الزوار المنتظرون، ومغادرة آخر طبيب حاضر تغلقه (يُكمَل فحص من فيه). بعد مغادرة طبيب لا يستقبل التخصص أكثر من الزيارات المقررة للأطباء الباقين. لا يُفتح طابور دون طبيب حاضر، وكل التخصصات تُغلق من جديد في بداية كل يوم.'}
      </p>

      {visitDay && !visitDay.is_today && (
        <div role="status" className="mb-4 rounded-2xl border border-st-hold/30 bg-st-hold-bg px-4 py-3 text-sm text-ink">
          <p className="font-semibold">يوم الزيارة: {visitDay.date}</p>
          <p className="text-muted mt-0.5">هؤلاء هم الأطباء المبرمجون في ذلك اليوم. يُسجَّل وصولهم وتُفتح الطوابير يوم الزيارة نفسه.</p>
        </div>
      )}

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
                      {s.is_open ? `في الطابور ${s.in_queue} · أنهى الفحص ${s.completed}` : `مغلق، ينتظره ${s.waiting} زائر`}
                      {s.is_full && <span className="text-rose font-semibold"> · اكتمل العدد</span>}
                    </p>
                  </div>
                  {locked ? (
                    <span className={cx('shrink-0 text-sm font-semibold', s.is_open ? 'text-st-queue' : 'text-red-700')}>{s.is_open ? 'مفتوح' : 'مغلق'}</span>
                  ) : (
                  <button
                    type="button"
                    onClick={() => openOrClose(s)}
                    disabled={busy !== null}
                    className={cx('shrink-0 inline-flex items-center gap-1.5 h-10 px-4 rounded-full text-sm font-semibold border disabled:opacity-60',
                      s.is_open ? 'border-st-queue/40 text-st-queue bg-st-queue-bg' : 'border-red-300 text-red-700 bg-red-50')}
                    aria-label={s.is_open ? `إغلاق طابور ${s.name}` : `فتح طابور ${s.name}`}
                  >
                    {s.is_open ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    {busy === `open-${s.event_specialty_id}` ? '...' : s.is_open ? 'مفتوح · أغلق' : 'افتح'}
                  </button>
                  )}
                </div>

                {doctors.length > 0 && (
                  <ul className="border-t border-line divide-y divide-line">
                    {doctors.map((d) => {
                      const key = (action) => `${action}-${s.event_specialty_id}-${d.doctor_id}`;
                      const returned = d.periods.length > 1;
                      const status = d.on_break
                        ? `في استراحة منذ ${d.on_break_since}`
                        : d.present ? `${returned ? 'عاد' : 'وصل'} ${d.present_since}`
                        : d.left_at ? `غادر ${d.left_at}${returned ? '' : ` (وصل ${d.arrived_at})`}` : 'لم يصل بعد';
                      return (
                        <li key={d.doctor_id} className="flex items-center gap-3 px-4 py-2.5">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-ink truncate">{d.full_name}</p>
                            <p className="text-xs text-muted truncate">
                              {/* Own box: "09:00–12:00" must not be reordered by the Arabic line */}
                              <span dir="ltr" className="inline-block">{d.intervals.join(', ')}</span> · {d.planned_visits} زيارة
                            </p>
                            <p className={cx('text-xs mt-0.5', d.present ? 'text-st-queue font-semibold' : d.on_break ? 'text-st-pushed font-semibold' : 'text-muted')}>{status}</p>
                            {returned && <p className="text-xs text-muted mt-0.5"><span dir="ltr" className="inline-block">{attendanceSpans(d.periods)}</span></p>}
                          </div>
                          {!locked && (
                            <div className="shrink-0 flex flex-col sm:flex-row gap-1.5">
                              {d.present && (
                                <Button size="sm" variant="secondary" icon={Coffee} loading={busy === key('break')} disabled={busy !== null} onClick={() => attend(s, d, 'break')}>
                                  استراحة
                                </Button>
                              )}
                              {!d.present && (
                                <Button size="sm" icon={LogIn} loading={busy === key('arrive')} disabled={busy !== null} onClick={() => attend(s, d, 'arrive')}>
                                  {d.on_break ? 'عاد' : 'وصل'}
                                </Button>
                              )}
                              {(d.present || d.on_break) && (
                                <Button size="sm" variant="secondary" icon={LogOut} loading={busy === key('leave')} disabled={busy !== null} onClick={() => attend(s, d, 'leave')}>
                                  غادر
                                </Button>
                              )}
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}

                {!locked && (
                  <button
                    type="button"
                    onClick={() => setAdding(s)}
                    disabled={busy !== null}
                    className="w-full flex items-center gap-2 px-4 min-h-[2.75rem] border-t border-line text-sm font-semibold text-ink disabled:opacity-60"
                  >
                    <UserPlus className="w-4 h-4" /> أضف طبيبًا
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <AddDoctorsSheet
        station={adding}
        presentIds={adding ? presentIds(adding) : []}
        onClose={() => setAdding(null)}
        onDone={() => { setAdding(null); load(); }}
      />
    </div>
  );
}
