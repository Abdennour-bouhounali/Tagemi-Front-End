// Pieces shared by the super admin's event screens (Events list, AddEvent,
// EditEvent, EventAdminsManager). Built on the staff UI kit.
import { useState } from 'react';
import { Check, ChevronDown, Copy, Eye, EyeOff, Plus, Trash2, X, Droplets, CalendarPlus } from 'lucide-react';
import algeriaLocations from '../../../../data/algeria_locations.json';
import {
  Button, IconButton, Sheet, SearchField, Field, TextInput, SelectInput, EmptyState, cx, useToast,
} from '../../../../Components/ui';
import { csvSafe } from '../../../../utils/safeHtml';
import { scheduleError, scheduleVisits } from '../../../../utils/schedule';
import DoctorScheduleEditor from './DoctorScheduleEditor';

// ------------------------------------------------------------ Confirm sheet

/** Destructive / important confirmation as a bottom sheet. */
export function ConfirmSheet({ open, onClose, title, children, confirmLabel, onConfirm, loading, danger = true }) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="secondary" className="flex-1" onClick={onClose} disabled={loading}>تراجع</Button>
          <Button variant={danger ? 'danger' : 'primary'} className="flex-1" loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="text-sm text-ink space-y-2">{children}</div>
    </Sheet>
  );
}

// ------------------------------------------------------------------ Switch

/** A labelled on/off row, 52px tall. */
export function SwitchRow({ checked, onChange, label, hint, icon: Icon }) {
  return (
    <label className="flex items-center gap-3 min-h-[3.25rem] py-2 cursor-pointer">
      {Icon && <Icon className="w-5 h-5 shrink-0 text-muted" />}
      <span className="flex-1 min-w-0">
        <span className="block font-semibold text-ink text-sm">{label}</span>
        {hint && <span className="block text-xs text-muted mt-0.5">{hint}</span>}
      </span>
      <input type="checkbox" className="sr-only peer" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
      <span
        aria-hidden="true"
        className={cx(
          'relative shrink-0 w-12 h-7 rounded-full transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-rose',
          checked ? 'bg-ink' : 'bg-line'
        )}
      >
        <span className={cx('absolute top-1 w-5 h-5 rounded-full bg-white transition-all', checked ? 'start-6' : 'start-1')} />
      </span>
    </label>
  );
}

// ----------------------------------------------------------------- Stepper

export const EVENT_STEPS = ['المعلومات', 'التخصصات والأيام', 'الضوابط والمراجعة'];

/** Numbered steps of the event form. Earlier steps can be tapped to go back. */
export function Stepper({ step, onStep }) {
  return (
    <ol className="flex gap-2 mb-5" aria-label="خطوات النموذج">
      {EVENT_STEPS.map((label, i) => {
        const done = i < step;
        const current = i === step;
        return (
          <li key={label} className="flex-1 min-w-0">
            <button
              type="button"
              onClick={() => done && onStep(i)}
              disabled={!done && !current}
              aria-current={current ? 'step' : undefined}
              className="w-full text-start disabled:cursor-default"
            >
              <span className={cx('block h-1 rounded-full mb-2', done || current ? 'bg-ink' : 'bg-line')} />
              <span className={cx('flex items-center gap-1.5 text-xs font-semibold', current ? 'text-ink' : 'text-muted')}>
                <span className={cx(
                  'inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] shrink-0',
                  done ? 'bg-ink text-white' : current ? 'border border-ink text-ink' : 'border border-line text-muted'
                )}>
                  {done ? <Check className="w-3 h-3" /> : i + 1}
                </span>
                <span className="truncate">{label}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

/** Sticky bottom bar of the event form, above the phone tab bar. */
export function FormActionBar({ children }) {
  return (
    <div className="sticky bottom-[4.75rem] lg:bottom-4 z-30 mt-6 bg-white border border-line rounded-2xl p-2 flex gap-2 lg:max-w-xl lg:ms-auto">
      {children}
    </div>
  );
}

// ---------------------------------------------------------- Event info step

const WILAYAS = algeriaLocations.algeria_locations;

/** Wilaya + commune selects. Keeps a stored value even if it's not in the list. */
export function LocationFields({ state, city, onStateChange, onCityChange }) {
  const wilaya = WILAYAS.find((loc) => loc.name_ar === state);
  const communes = wilaya?.communes || [];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Field label="الولاية">
        <SelectInput value={state} onChange={(e) => onStateChange(e.target.value)}>
          <option value="">اختر الولاية</option>
          {state && !wilaya && <option value={state}>{state}</option>}
          {WILAYAS.map((loc) => (
            <option key={loc.code} value={loc.name_ar}>{loc.code} {loc.name_ar}</option>
          ))}
        </SelectInput>
      </Field>
      <Field label="البلدية" hint={!state ? 'اختر الولاية أولاً' : undefined}>
        <SelectInput value={city} onChange={(e) => onCityChange(e.target.value)} disabled={!state}>
          <option value="">اختر البلدية</option>
          {city && !communes.includes(city) && <option value={city}>{city}</option>}
          {communes.map((c) => <option key={c} value={c}>{c}</option>)}
        </SelectInput>
      </Field>
    </div>
  );
}

const textareaClass =
  'w-full rounded-xl border border-line bg-white px-3 py-3 text-base text-ink placeholder:text-muted focus:border-ink focus:outline-none resize-none';

/** Step 1: name, date, place, switches, description, allowed specialties. */
export function EventInfoFields({ form, setForm, errors = {}, onStateChange }) {
  const set = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));
  return (
    <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-x-6 lg:gap-y-4 lg:items-start">
      <Field label="اسم الحدث" error={errors.name}>
        <TextInput value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="مثال: قافلة طبية بأدرار" invalid={!!errors.name} />
      </Field>
      <Field label="تاريخ الحدث" error={errors.date}>
        <TextInput type="date" value={form.date} onChange={(e) => set('date', e.target.value)} invalid={!!errors.date} />
      </Field>
      <LocationFields
        state={form.state}
        city={form.city}
        onStateChange={onStateChange || ((value) => setForm((prev) => ({ ...prev, state: value, city: '' })))}
        onCityChange={(value) => set('city', value)}
      />
      <Field label="الوصف">
        <textarea rows={3} className={textareaClass} value={form.description || ''} onChange={(e) => set('description', e.target.value)} placeholder="معلومات تظهر للمرضى عن الحدث" />
      </Field>
      <Field label="عدد التخصصات التي يحجزها المريض" hint="من 1 إلى 5 تخصصات" error={errors.nbr_of_allowed_specialties}>
        <TextInput
          type="number" inputMode="numeric" min="1" max="5"
          value={form.nbr_of_allowed_specialties}
          onChange={(e) => set('nbr_of_allowed_specialties', e.target.value)}
          invalid={!!errors.nbr_of_allowed_specialties}
        />
      </Field>
      <div className="bg-white border border-line rounded-2xl px-4 divide-y divide-line">
        <SwitchRow checked={form.is_active} onChange={(v) => set('is_active', v)} label="الحدث نشط" hint="الحدث النشط يقبل الحجوزات" />
        <SwitchRow checked={form.is_tawat} onChange={(v) => set('is_tawat', v)} label="حدث TAWAT" hint="نوع الحدث" />
        <SwitchRow checked={!!form.is_simulation} onChange={(v) => set('is_simulation', v)} label="حدث تدريبي (محاكاة)" hint="للتدريب فقط، لا يُؤرشف ويظهر للجميع أنه غير حقيقي" />
      </div>
    </div>
  );
}

/** Returns { field: message } for step 1. */
export function validateEventInfo(form) {
  const errors = {};
  if (!String(form.name || '').trim()) errors.name = 'اكتب اسم الحدث';
  if (!form.date) errors.date = 'اختر تاريخ الحدث';
  const n = parseInt(form.nbr_of_allowed_specialties, 10);
  if (!n || n < 1 || n > 5) errors.nbr_of_allowed_specialties = 'اكتب رقمًا من 1 إلى 5';
  return errors;
}

/**
 * Returns an error sentence for step 2, or '' if the specialties are complete.
 * A specialty with `schedule` is planned with doctors; otherwise legacy hourly days.
 */
export function validateSpecialties(list, specialtyName, doctorName = (id) => `#${id}`) {
  if (list.length === 0) return 'أضف تخصصًا واحدًا على الأقل';
  for (let i = 0; i < list.length; i += 1) {
    const spec = list[i];
    const label = spec.id ? specialtyName(spec.id) : `التخصص رقم ${i + 1}`;
    if (!spec.id) return `اختر اسم التخصص رقم ${i + 1}`;
    if (spec.schedule) {
      const msg = scheduleError(spec.schedule, doctorName, label);
      if (msg) return msg;
      continue;
    }
    if (spec.days.length === 0) return `أضف يومًا واحدًا على الأقل إلى ${label}`;
    for (let j = 0; j < spec.days.length; j += 1) {
      const day = spec.days[j];
      if (!day.day_date) return `حدّد تاريخ اليوم ${j + 1} في ${label}`;
      if (day.hours.length === 0) return `اختر ساعة واحدة على الأقل لليوم ${j + 1} في ${label}`;
    }
  }
  return '';
}

// ------------------------------------------------------------- Rules step

export function RulesPicker({ rules, selected, onToggle }) {
  if (rules.length === 0) {
    return <EmptyState title="لا توجد ضوابط بعد">أضف الضوابط من صفحة «ضوابط الفحوصات» ثم عد إلى هنا.</EmptyState>;
  }
  return (
    <>
      <p className="text-sm text-muted mb-2">اخترت {selected.length} من {rules.length}</p>
      <ul className="bg-white border border-line rounded-2xl divide-y divide-line">
        {rules.map((rule) => {
          const on = selected.includes(rule.id);
          return (
            <li key={rule.id}>
              <label className="flex items-start gap-3 px-4 py-3 min-h-[3.25rem] cursor-pointer">
                <input type="checkbox" className="mt-0.5 w-5 h-5 shrink-0 accent-[#101E58]" checked={on} onChange={() => onToggle(rule.id)} />
                <span className="text-sm text-ink leading-relaxed">{rule.rule}</span>
              </label>
            </li>
          );
        })}
      </ul>
    </>
  );
}

// ------------------------------------------------------- Specialties step

export const TIME_OPTIONS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
export const toTime = (hour) => `${String(hour).padStart(2, '0')}:00:00`;

const formatDay = (date) => {
  if (!date) return 'بدون تاريخ';
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? date : d.toLocaleDateString('ar-DZ', { weekday: 'long', day: 'numeric', month: 'long' });
};

/** Hour chips of one day: tap to add, tap again to remove. */
function HourChips({ hours, onAdd, onRemove }) {
  const selected = hours.map((h) => String(h.time).slice(0, 5));
  const extra = selected.filter((t) => !TIME_OPTIONS.some((h) => toTime(h).startsWith(t)));
  const options = [...TIME_OPTIONS.map((h) => toTime(h).slice(0, 5)), ...extra];
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((t) => {
        const index = selected.indexOf(t);
        const on = index !== -1;
        return (
          <button
            key={t}
            type="button"
            aria-pressed={on}
            onClick={() => (on ? onRemove(index) : onAdd(parseInt(t, 10)))}
            className={cx(
              'h-10 min-w-[3.75rem] px-3 rounded-full text-sm font-semibold border tabular-nums',
              on ? 'bg-ink text-white border-ink' : 'bg-white text-muted border-line hover:bg-ink-faint'
            )}
          >
            {t}
          </button>
        );
      })}
    </div>
  );
}

/** Selected doctors as chips + a sheet to pick more. */
function DoctorPicker({ doctors, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const chosen = doctors.filter((d) => value.includes(d.id));
  const toggle = (id) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  const list = doctors.filter((d) => !query || String(d.full_name).includes(query.trim()));

  return (
    <div>
      <span className="block mb-1.5 text-sm font-semibold text-ink">الأطباء</span>
      <div className="flex flex-wrap gap-2">
        {chosen.map((d) => (
          <span key={d.id} className="inline-flex items-center gap-1 h-9 ps-3 pe-1 rounded-full bg-ink-faint text-ink text-sm">
            {d.full_name}
            <button type="button" onClick={() => toggle(d.id)} aria-label={`أزل ${d.full_name}`} className="w-7 h-7 inline-flex items-center justify-center rounded-full hover:bg-white">
              <X className="w-4 h-4" />
            </button>
          </span>
        ))}
        <Button size="sm" variant="secondary" icon={Plus} onClick={() => setOpen(true)} className="h-9">
          {chosen.length ? 'عدّل الأطباء' : 'اختر الأطباء'}
        </Button>
      </div>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="أطباء التخصص"
        footer={<Button block onClick={() => setOpen(false)}>تم ({value.length})</Button>}
      >
        <SearchField value={query} onChange={setQuery} placeholder="ابحث باسم الطبيب" className="mb-3" />
        {list.length === 0 ? (
          <p className="text-sm text-muted py-6 text-center">لا يوجد طبيب بهذا الاسم.</p>
        ) : (
          <ul className="divide-y divide-line">
            {list.map((d) => (
              <li key={d.id}>
                <label className="flex items-center gap-3 min-h-[3.25rem] cursor-pointer">
                  <input type="checkbox" className="w-5 h-5 accent-[#101E58]" checked={value.includes(d.id)} onChange={() => toggle(d.id)} />
                  <span className="text-ink">{d.full_name}</span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </Sheet>
    </div>
  );
}

/**
 * Step 2. `value` is the specialties array sent to the API as-is (`schedule` =
 * doctors' intervals, or legacy `days` of hours); this editor
 * only replaces objects immutably and never adds UI-only fields to them.
 * newDay(): the object pushed by "أضف يومًا". newHour(time): pushed hour.
 * removalNote: extra sentence in the removal confirmations (edit mode).
 */
export function SpecialtiesEditor({ value, onChange, specialties, doctors, busy, defaultDate, newSpecialty, newDay, newHour, removalNote, showExisting }) {
  const toast = useToast();
  const [openIndex, setOpenIndex] = useState(value.length ? 0 : null);
  const [confirm, setConfirm] = useState(null); // { type: 'specialty'|'day', specIndex, dayIndex }

  const nameOf = (id) => specialties.find((s) => String(s.id) === String(id))?.name;

  const patchSpec = (i, patch) => onChange(value.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  const patchDay = (i, j, patch) =>
    patchSpec(i, { days: value[i].days.map((d, idx) => (idx === j ? { ...d, ...patch } : d)) });

  const addSpecialty = () => {
    onChange([...value, newSpecialty()]);
    setOpenIndex(value.length);
  };

  // Doctors belong to one specialty: changing it empties the doctors' list
  const changeSpecialty = (i, id) => {
    const spec = value[i];
    if (spec.schedule?.length && id !== spec.id) {
      patchSpec(i, { id, schedule: [] });
      toast('أُزيل أطباء التخصص السابق، أضف أطباء التخصص الجديد', 'info');
      return;
    }
    patchSpec(i, { id });
  };

  const addHour = (i, j, hour) => {
    const time = toTime(hour);
    const day = value[i].days[j];
    if (day.hours.some((h) => h.time === time)) {
      toast('هذه الساعة مضافة من قبل', 'info');
      return;
    }
    patchDay(i, j, { hours: [...day.hours, newHour(time)] });
  };

  const removeHour = (i, j, hourIndex) => patchDay(i, j, { hours: value[i].days[j].hours.filter((_, idx) => idx !== hourIndex) });

  const confirmRemove = () => {
    if (!confirm) return;
    if (confirm.type === 'specialty') {
      onChange(value.filter((_, idx) => idx !== confirm.specIndex));
      setOpenIndex(null);
    } else {
      patchSpec(confirm.specIndex, { days: value[confirm.specIndex].days.filter((_, idx) => idx !== confirm.dayIndex) });
    }
    setConfirm(null);
  };

  return (
    <div>
      {value.length === 0 ? (
        <div className="bg-white border border-line rounded-2xl">
          <EmptyState title="لم تضف أي تخصص بعد" action={<Button icon={Plus} onClick={addSpecialty}>أضف تخصصًا</Button>}>
            لكل تخصص أطباؤه، ولكل طبيب أيامه وفترات عمله.
          </EmptyState>
        </div>
      ) : (
        <ul className="space-y-3 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-4 lg:items-start">
          {value.map((spec, i) => {
            const open = openIndex === i;
            const hoursCount = spec.schedule ? 0 : spec.days.reduce((sum, d) => sum + d.hours.length, 0);
            const title = nameOf(spec.id) || 'تخصص جديد';
            return (
              <li key={i} className="bg-white border border-line rounded-2xl">
                <div className="flex items-center gap-1 pe-1">
                  <button
                    type="button"
                    onClick={() => setOpenIndex(open ? null : i)}
                    aria-expanded={open}
                    className="flex-1 min-w-0 flex items-center gap-3 ps-4 py-3 min-h-[4rem] text-start"
                  >
                    <span className="flex-1 min-w-0">
                      <span className="flex items-center gap-2 font-semibold text-ink">
                        <span className="truncate">{title}</span>
                        {showExisting && !spec.isNew && <span className="text-[11px] font-normal text-muted">محفوظ</span>}
                      </span>
                      <span className="flex items-center gap-2 text-xs text-muted mt-0.5">
                        {spec.schedule
                          ? `${spec.schedule.length} ${spec.schedule.length === 1 ? 'طبيب' : 'أطباء'}، ${scheduleVisits(spec.schedule)} زيارة`
                          : `${spec.days.length} ${spec.days.length === 1 ? 'يوم' : 'أيام'}، ${hoursCount} ساعة`}
                        {spec.has_dilatation && <span className="inline-flex items-center gap-1 text-st-dil"><Droplets className="w-3.5 h-3.5" />قاعة تمدد</span>}
                        {spec.is_saturated && <span className="text-st-pushed">مشبع</span>}
                      </span>
                    </span>
                    <ChevronDown className={cx('w-5 h-5 text-muted shrink-0 transition-transform', open && 'rotate-180')} />
                  </button>
                  <IconButton icon={Trash2} label={`احذف ${title}`} className="text-red-700" onClick={() => setConfirm({ type: 'specialty', specIndex: i })} />
                </div>

                {open && (
                  <div className="border-t border-line px-4 pt-4 pb-4 space-y-4">
                    <Field label="التخصص">
                      <SelectInput value={spec.id} onChange={(e) => changeSpecialty(i, parseInt(e.target.value, 10) || '')}>
                        <option value="">اختر التخصص</option>
                        {specialties.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </SelectInput>
                    </Field>

                    {!spec.schedule && (
                      <DoctorPicker doctors={doctors} value={spec.doctors} onChange={(ids) => patchSpec(i, { doctors: ids.map((id) => parseInt(id, 10)) })} />
                    )}

                    <Field label="وصف التخصص" hint={`${spec.description?.length || 0} من 500 حرف، اختياري`}>
                      <textarea
                        rows={2}
                        maxLength={500}
                        className={textareaClass}
                        value={spec.description || ''}
                        onChange={(e) => patchSpec(i, { description: e.target.value })}
                        placeholder="ملاحظات تظهر للمرضى عند الحجز"
                      />
                    </Field>

                    <div className="divide-y divide-line border-y border-line">
                      <SwitchRow checked={spec.is_saturated} onChange={(v) => patchSpec(i, { is_saturated: v })} label="التخصص مشبع" hint="يوقف الحجز في هذا التخصص" />
                      <SwitchRow checked={spec.has_dilatation} onChange={(v) => patchSpec(i, { has_dilatation: v })} icon={Droplets} label="قاعة تمدد" hint="يرسل مسؤول التخصص المرضى إلى التمدد ثم يعودون بأولوية" />
                    </div>

                    {spec.schedule ? (
                      <DoctorScheduleEditor
                        value={spec.schedule}
                        onChange={(schedule) => patchSpec(i, { schedule })}
                        specialtyId={spec.id}
                        doctors={doctors}
                        busy={busy}
                        defaultDate={defaultDate}
                        formatDay={formatDay}
                      />
                    ) : (
                    <div>
                      <p className="text-xs text-muted mb-2">تخصص قديم بساعات وعدد مرضى ثابت في الساعة.</p>
                      <h3 className="font-semibold text-ink mb-2">الأيام</h3>
                      {spec.days.length === 0 && <p className="text-sm text-muted mb-2">أضف يوم عمل واحدًا على الأقل.</p>}
                      <ul className="space-y-3">
                        {spec.days.map((day, j) => (
                          <li key={j} className="rounded-xl bg-paper p-3 space-y-3">
                            <div className="flex items-center gap-2">
                              <p className="flex-1 min-w-0 text-sm font-semibold text-ink truncate">
                                {formatDay(day.day_date)}
                                {showExisting && !day.isNew && <span className="ms-2 text-[11px] font-normal text-muted">محفوظ</span>}
                              </p>
                              <IconButton icon={Trash2} label="احذف اليوم" className="text-red-700 -me-2" onClick={() => setConfirm({ type: 'day', specIndex: i, dayIndex: j })} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <Field label="التاريخ">
                                <TextInput type="date" value={day.day_date || ''} onChange={(e) => patchDay(i, j, { day_date: e.target.value })} />
                              </Field>
                              <Field label="مرضى في الساعة">
                                <TextInput
                                  type="number" inputMode="numeric" min="1" max="400"
                                  value={day.number_per_hour}
                                  onChange={(e) => patchDay(i, j, { number_per_hour: Math.min(400, Math.max(1, parseInt(e.target.value, 10) || 6)) })}
                                />
                              </Field>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-ink mb-2">الساعات <span className="font-normal text-muted">({day.hours.length})</span></p>
                              <HourChips hours={day.hours} onAdd={(h) => addHour(i, j, h)} onRemove={(idx) => removeHour(i, j, idx)} />
                            </div>
                          </li>
                        ))}
                      </ul>
                      <Button variant="secondary" icon={CalendarPlus} block className="mt-3"
                        onClick={() => patchSpec(i, { days: [...spec.days, newDay()] })}>
                        أضف يومًا
                      </Button>
                    </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {value.length > 0 && (
        <Button variant="secondary" icon={Plus} block className="mt-3 lg:w-auto lg:min-w-[16rem]" onClick={addSpecialty}>أضف تخصصًا</Button>
      )}

      <ConfirmSheet
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={confirm?.type === 'day' ? 'حذف اليوم؟' : 'حذف التخصص؟'}
        confirmLabel={confirm?.type === 'day' ? 'احذف اليوم' : 'احذف التخصص'}
        onConfirm={confirmRemove}
      >
        <p>
          {confirm?.type === 'day'
            ? 'سيُحذف هذا اليوم وساعاته من النموذج.'
            : `سيُحذف «${nameOf(value[confirm?.specIndex]?.id) || 'هذا التخصص'}» بأيامه وساعاته من النموذج.`}
        </p>
        {removalNote && <p className="text-muted">{removalNote}</p>}
      </ConfirmSheet>
    </div>
  );
}

// ------------------------------------------------------------ Review card

const specialtyCapacity = (s) => (s.schedule
  ? scheduleVisits(s.schedule)
  : s.days.reduce((a, d) => a + d.hours.length * (parseInt(d.number_per_hour, 10) || 0), 0));

const specialtySummary = (s) => {
  if (s.schedule) {
    const dates = new Set(s.schedule.flatMap((e) => e.days.map((d) => d.day_date)));
    return `${s.schedule.length} ${s.schedule.length === 1 ? 'طبيب' : 'أطباء'}، ${dates.size} ${dates.size === 1 ? 'يوم' : 'أيام'}، ${scheduleVisits(s.schedule)} زيارة`;
  }
  return `${s.days.length} ${s.days.length === 1 ? 'يوم' : 'أيام'}، ${s.days.reduce((a, d) => a + d.hours.length, 0)} ساعة`;
};

export function EventReview({ form, specialtiesList, specialtyName, rulesCount }) {
  const capacity = specialtiesList.reduce((sum, s) => sum + specialtyCapacity(s), 0);
  const doctorsCount = new Set(specialtiesList.flatMap((s) => (s.schedule || []).map((e) => e.doctor_id))).size;
  const rows = [
    ['الاسم', form.name || '—'],
    ['التاريخ', form.date ? formatDay(form.date) : '—'],
    ['المكان', [form.city, form.state].filter(Boolean).join('، ') || '—'],
    ['الحالة', form.is_active ? 'نشط، يقبل الحجوزات' : 'غير نشط'],
    ['تخصصات لكل مريض', form.nbr_of_allowed_specialties],
    ['الضوابط المختارة', rulesCount],
  ];
  return (
    <section className="bg-white border border-line rounded-2xl p-4">
      <h2 className="font-display text-lg text-ink mb-3">راجع قبل الحفظ</h2>
      <dl className="divide-y divide-line text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3 py-2">
            <dt className="text-muted">{k}</dt>
            <dd className="font-semibold text-ink text-end">{v}</dd>
          </div>
        ))}
      </dl>
      <h3 className="font-semibold text-ink mt-4 mb-2">التخصصات ({specialtiesList.length})</h3>
      <ul className="text-sm space-y-1">
        {specialtiesList.map((s, i) => (
          <li key={i} className="flex justify-between gap-3">
            <span className="text-ink truncate">{specialtyName(s.id) || 'بدون اسم'}</span>
            <span className="text-muted shrink-0">{specialtySummary(s)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm text-muted">
        السعة الكلية: <span className="font-semibold text-ink">{capacity}</span> موعد
        {doctorsCount > 0 && <> مع {doctorsCount} {doctorsCount === 1 ? 'طبيب' : 'أطباء'}</>}.
      </p>
    </section>
  );
}

// ------------------------------------------------------------ Credentials

export const ADMIN_TYPE_LABELS = {
  'Special Admin': 'مسؤول الحالات الخاصة',
  'Recipient Admin': 'مسؤول الاستقبال',
  'Check Admin': 'مسؤول التخصص',
};

/** One generated staff account: email + password with copy and show/hide. */
export function CredentialRow({ credential }) {
  const toast = useToast();
  const [show, setShow] = useState(false);
  const copy = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      toast(`نُسخ ${label}`);
    } catch {
      toast('تعذر النسخ، انسخ النص يدويًا', 'error');
    }
  };
  return (
    <li className="py-3">
      <p className="font-semibold text-ink">{ADMIN_TYPE_LABELS[credential.type] || credential.type}</p>
      <p className="text-xs text-muted mb-2">{credential.name}</p>
      <div className="flex items-center gap-1">
        <span className="flex-1 min-w-0 truncate rounded-lg bg-paper px-2 h-9 leading-9 text-sm" dir="ltr">{credential.email}</span>
        <IconButton icon={Copy} label="انسخ البريد" onClick={() => copy(credential.email, 'البريد')} />
      </div>
      <div className="flex items-center gap-1">
        <span className="flex-1 min-w-0 truncate rounded-lg bg-paper px-2 h-9 leading-9 text-sm font-mono" dir="ltr">
          {show ? credential.password : '•'.repeat(Math.min(12, credential.password?.length || 8))}
        </span>
        <IconButton icon={show ? EyeOff : Eye} label={show ? 'أخف كلمة المرور' : 'أظهر كلمة المرور'} onClick={() => setShow((v) => !v)} />
        <IconButton icon={Copy} label="انسخ كلمة المرور" onClick={() => copy(credential.password, 'كلمة المرور')} />
      </div>
    </li>
  );
}

/** Same columns as before, CSV-injection safe, UTF-8 BOM so Excel reads Arabic. */
export function downloadCredentialsCsv(list, filename) {
  const quote = (cell) => `"${csvSafe(cell).replace(/"/g, '""')}"`;
  const lines = ['النوع,التخصص,الاسم,البريد الإلكتروني,كلمة المرور'];
  list.forEach((c) => lines.push([c.type, c.specialty, c.name, c.email, c.password].map(quote).join(',')));
  const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
