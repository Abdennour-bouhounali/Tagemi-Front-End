import { useState } from 'react';
import { CalendarPlus, Clock, Plus, Trash2, TriangleAlert, UserPlus } from 'lucide-react';
import { Button, IconButton, SearchField, Sheet, TextInput, cx } from '../../../../Components/ui';
import DoctorFormSheet, { DoctorCredentialsSheet } from './DoctorFormSheet';
import { wilayaName, SECTOR_LABELS } from '../../../../utils/doctors';
import {
  intervalInfo, dayVisits, doctorVisits, scheduleVisits, overlapIndex, hourlyByDate, DEFAULT_INTERVAL, nextInterval,
} from '../../../../utils/schedule';

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** One interval: start, end, visit length, extra visits, and the visits it gives. */
function IntervalRow({ interval, overlaps, onChange, onRemove, canRemove }) {
  const info = intervalInfo(interval);
  const error = info.error || (overlaps ? 'تتداخل مع فترة أخرى' : '');
  return (
    <li className="rounded-lg bg-white border border-line p-2">
      <div className="grid grid-cols-2 gap-2">
        <label className="block min-w-0">
          <span className="block mb-1 text-xs text-muted">من</span>
          <TextInput type="time" step="300" dir="ltr" className="h-11 px-2" value={interval.start_time} onChange={(e) => onChange({ start_time: e.target.value })} invalid={!!error} />
        </label>
        <label className="block min-w-0">
          <span className="block mb-1 text-xs text-muted">إلى</span>
          <TextInput type="time" step="300" dir="ltr" className="h-11 px-2" value={interval.end_time} onChange={(e) => onChange({ end_time: e.target.value })} invalid={!!error} />
        </label>
      </div>
      <div className="flex items-end gap-2 mt-2">
        <label className="block flex-1 min-w-0">
          <span className="block mb-1 text-xs text-muted">مدة الزيارة (د)</span>
          <TextInput
            type="number" inputMode="numeric" min="5" max="240" step="5" className="h-11 px-2"
            value={interval.visit_minutes}
            onChange={(e) => onChange({ visit_minutes: e.target.value === '' ? '' : parseInt(e.target.value, 10) })}
            invalid={!!error}
          />
        </label>
        <label className="block flex-1 min-w-0">
          <span className="block mb-1 text-xs text-muted">زيارات إضافية</span>
          <TextInput
            type="number" inputMode="numeric" min="0" max="500" className="h-11 px-2"
            value={interval.extra_visits ?? 0}
            onChange={(e) => onChange({ extra_visits: e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0) })}
            invalid={!!error}
          />
        </label>
        <IconButton icon={Trash2} label="احذف الفترة" className="text-red-700 disabled:opacity-30" onClick={onRemove} disabled={!canRemove} />
      </div>
      <p className={cx('mt-1.5 text-xs leading-snug', error ? 'text-red-700' : 'text-muted')}>
        {error || (
          <>
            = <span className="font-semibold text-ink">{plural(info.visits, 'زيارة', 'زيارات')}</span>
            {info.extra > 0 && <> ({info.computed} من المدة + {info.extra} إضافية)</>}
            {info.leftover > 0 && <span className="block">تبقى {info.leftover} دقيقة دون زيارة</span>}
          </>
        )}
      </p>
    </li>
  );
}

/** Sheet listing the active doctors of the specialty not yet added; can register a new one. */
function AddDoctorSheet({ open, onClose, doctors, onPick, onCreateNew }) {
  const [query, setQuery] = useState('');
  const list = doctors.filter((d) => !query.trim() || d.full_name.includes(query.trim()) || String(d.phone || '').includes(query.trim()));
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="أضف طبيبًا"
      footer={<Button variant="secondary" icon={UserPlus} block onClick={onCreateNew}>طبيب غير موجود؟ أضف طبيبًا جديدًا</Button>}
    >
      {doctors.length === 0 ? (
        <p className="text-sm text-muted py-6 text-center">لا يوجد طبيب آخر نشط في هذا التخصص. أضفه من الزر أدناه دون مغادرة الحدث.</p>
      ) : (
        <>
          <SearchField value={query} onChange={setQuery} placeholder="ابحث بالاسم أو الهاتف" className="mb-3" />
          <ul className="divide-y divide-line">
            {list.map((d) => (
              <li key={d.id}>
                <button type="button" onClick={() => { onPick(d); setQuery(''); }} className="w-full flex items-center gap-3 min-h-[3.5rem] text-start hover:bg-ink-faint rounded-lg px-2">
                  <span className="flex-1 min-w-0">
                    <span className="block font-semibold text-ink truncate">{d.full_name}</span>
                    <span className="block text-xs text-muted truncate">{[wilayaName(d.wilaya_code), SECTOR_LABELS[d.sector]].filter(Boolean).join(' · ')}</span>
                  </span>
                  <Plus className="w-5 h-5 text-muted shrink-0" />
                </button>
              </li>
            ))}
            {list.length === 0 && <li className="text-sm text-muted py-6 text-center">لا يوجد طبيب بهذا الاسم.</li>}
          </ul>
        </>
      )}
    </Sheet>
  );
}

/**
 * Doctors of one specialty, each with working days and intervals. `value` is
 * the specialty's `schedule` sent to the API as-is:
 * [{ doctor_id, days: [{ day_date, intervals: [{ id?, start_time, end_time, visit_minutes, extra_visits }] }] }]
 * busy: [{ doctor_id, day_date, event_id, event_name }] from other events (warning only).
 * onDoctorCreated(doctor): a doctor registered from here, for the parent's doctors list.
 */
export default function DoctorScheduleEditor({ value, onChange, specialtyId, specialties = [], doctors, onDoctorCreated, busy = [], defaultDate, formatDay }) {
  const [adding, setAdding] = useState(false);
  const [creating, setCreating] = useState(null); // {} while the new-doctor form is open
  const [credentials, setCredentials] = useState(null);

  const byId = (id) => doctors.find((d) => d.id === id);
  const available = doctors.filter((d) => d.is_active && String(d.specialty_id) === String(specialtyId) && !value.some((e) => e.doctor_id === d.id));

  const patchEntry = (i, patch) => onChange(value.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));
  const patchDay = (i, j, patch) => patchEntry(i, { days: value[i].days.map((d, idx) => (idx === j ? { ...d, ...patch } : d)) });
  const patchInterval = (i, j, k, patch) =>
    patchDay(i, j, { intervals: value[i].days[j].intervals.map((iv, idx) => (idx === k ? { ...iv, ...patch } : iv)) });

  const addDoctor = (doctor) => {
    onChange([...value, { doctor_id: doctor.id, days: [{ day_date: defaultDate || '', intervals: [{ ...DEFAULT_INTERVAL }] }] }]);
    setAdding(false);
  };

  const addDay = (i) => {
    const days = value[i].days;
    const last = days[days.length - 1];
    let date = defaultDate || '';
    if (last?.day_date) {
      const next = new Date(`${last.day_date}T00:00:00Z`);
      next.setUTCDate(next.getUTCDate() + 1);
      date = next.toISOString().slice(0, 10);
    }
    // Same intervals as the previous day: a doctor usually keeps their hours
    const intervals = last
      ? last.intervals.map(({ start_time, end_time, visit_minutes, extra_visits }) => ({ start_time, end_time, visit_minutes, extra_visits }))
      : [{ ...DEFAULT_INTERVAL }];
    patchEntry(i, { days: [...days, { day_date: date, intervals }] });
  };

  const busyOn = (doctorId, date) => busy.filter((b) => b.doctor_id === doctorId && String(b.day_date).slice(0, 10) === date);

  const total = scheduleVisits(value);
  const preview = hourlyByDate(value);

  if (!specialtyId) {
    return <p className="text-sm text-muted rounded-xl bg-paper p-3">اختر التخصص أولاً لتظهر أطباؤه.</p>;
  }

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <h3 className="font-semibold text-ink">الأطباء</h3>
        {value.length > 0 && (
          <span className="text-sm text-muted">{plural(value.length, 'طبيب', 'أطباء')} · <span className="font-semibold text-ink">{total}</span> زيارة</span>
        )}
      </div>

      {value.length === 0 && <p className="text-sm text-muted mb-2">أضف أطباء هذا التخصص، ثم أيام عمل كل طبيب وفتراته.</p>}

      <ul className="space-y-3">
        {value.map((entry, i) => {
          const doctor = byId(entry.doctor_id);
          return (
            <li key={entry.doctor_id} className="rounded-xl bg-paper p-3 space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-ink truncate">
                    {doctor?.full_name || `طبيب #${entry.doctor_id}`}
                    {doctor && !doctor.is_active && <span className="ms-2 text-xs font-normal text-st-pushed">موقوف</span>}
                  </p>
                  <p className="text-xs text-muted">{plural(entry.days.length, 'يوم', 'أيام')} · <span className="font-semibold text-ink">{doctorVisits(entry)}</span> زيارة</p>
                </div>
                <IconButton icon={Trash2} label={`أزل ${doctor?.full_name || 'الطبيب'}`} className="text-red-700 -me-2"
                  onClick={() => onChange(value.filter((_, idx) => idx !== i))} />
              </div>

              <ul className="space-y-3">
                {entry.days.map((day, j) => {
                  const overlap = overlapIndex(day.intervals);
                  const duplicate = day.day_date && entry.days.some((d, idx) => idx !== j && d.day_date === day.day_date);
                  const elsewhere = busyOn(entry.doctor_id, day.day_date);
                  return (
                    <li key={j} className="border-t border-line pt-3 space-y-2">
                      <div className="flex items-end gap-2">
                        <label className="block flex-1 min-w-0">
                          <span className="block mb-1 text-xs text-muted">{day.day_date ? formatDay(day.day_date) : 'التاريخ'}</span>
                          <TextInput type="date" className="h-11" value={day.day_date || ''} onChange={(e) => patchDay(i, j, { day_date: e.target.value })} invalid={!day.day_date || duplicate} />
                        </label>
                        <span className="shrink-0 pb-3 text-xs text-muted">{dayVisits(day)} زيارة</span>
                        <IconButton icon={Trash2} label="احذف اليوم" className="text-red-700 disabled:opacity-30"
                          disabled={entry.days.length === 1}
                          onClick={() => patchEntry(i, { days: entry.days.filter((_, idx) => idx !== j) })} />
                      </div>
                      {duplicate && <p className="text-xs text-red-700">هذا اليوم مكرر لنفس الطبيب.</p>}
                      {day.day_date && day.day_date < todayIso() && (
                        <p className="text-xs text-st-pushed">هذا التاريخ مضى، تأكّد منه.</p>
                      )}
                      {elsewhere.map((b) => (
                        <p key={b.event_id} className="flex items-start gap-1.5 rounded-lg bg-st-pushed-bg px-2 py-1.5 text-xs text-st-pushed">
                          <TriangleAlert className="w-4 h-4 shrink-0" />
                          <span>هذا الطبيب مبرمج في «{b.event_name}» في نفس اليوم.</span>
                        </p>
                      ))}
                      <ul className="space-y-2">
                        {day.intervals.map((iv, k) => (
                          <IntervalRow
                            key={k}
                            interval={iv}
                            overlaps={k === overlap}
                            canRemove={day.intervals.length > 1}
                            onChange={(patch) => patchInterval(i, j, k, patch)}
                            onRemove={() => patchDay(i, j, { intervals: day.intervals.filter((_, idx) => idx !== k) })}
                          />
                        ))}
                      </ul>
                      <Button size="sm" variant="ghost" icon={Clock} onClick={() => patchDay(i, j, { intervals: [...day.intervals, nextInterval(day.intervals)] })}>
                        أضف فترة
                      </Button>
                    </li>
                  );
                })}
              </ul>
              <Button size="sm" variant="secondary" icon={CalendarPlus} block onClick={() => addDay(i)}>أضف يومًا لهذا الطبيب</Button>
            </li>
          );
        })}
      </ul>

      <Button variant="secondary" icon={UserPlus} block className="mt-3" onClick={() => setAdding(true)}>أضف طبيبًا</Button>

      {Object.keys(preview).length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-ink mb-1">ما يراه المريض عند الحجز</h4>
          <p className="text-xs text-muted mb-2">الساعات وعدد الأماكن في كل ساعة، لكل الأطباء معًا.</p>
          <ul className="space-y-2">
            {Object.entries(preview).map(([date, hours]) => (
              <li key={date}>
                <p className="text-xs text-muted mb-1">{formatDay(date)}</p>
                <div className="flex flex-wrap gap-1.5">
                  {hours.map(([hour, count]) => (
                    <span key={hour} className="inline-flex items-center gap-1 h-8 px-2.5 rounded-full bg-white border border-line text-xs tabular-nums">
                      <span className="font-semibold text-ink" dir="ltr">{hour}</span>
                      <span className="text-muted">· {count}</span>
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <AddDoctorSheet
        open={adding}
        onClose={() => setAdding(false)}
        doctors={available}
        onPick={addDoctor}
        onCreateNew={() => { setAdding(false); setCreating({}); }}
      />

      {/* New doctor without leaving the event form: added to this specialty right away */}
      <DoctorFormSheet
        open={creating}
        onClose={() => setCreating(null)}
        specialties={specialties}
        lockedSpecialtyId={specialtyId}
        onSaved={(doctor, creds) => {
          onDoctorCreated?.(doctor);
          addDoctor(doctor);
          setCredentials(creds);
        }}
      />
      <DoctorCredentialsSheet credentials={credentials} onClose={() => setCredentials(null)} />
    </div>
  );
}
