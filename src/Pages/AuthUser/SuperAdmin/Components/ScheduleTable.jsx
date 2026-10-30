// The new-event planning grid: one row per doctor and day, grouped by
// specialty, plus the live visits summary shown beside it.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronDown, ChevronsDownUp, ChevronsUpDown, Copy, CopyPlus, Droplets, Eye, EyeOff, Plus, Settings2, Trash2, TriangleAlert, X,
} from 'lucide-react';
import { Button, Field, IconButton, Sheet, cx, useToast } from '../../../../Components/ui';
import TimeField from '../../../../Components/ui/TimeField';
import {
  DEFAULT_INTERVAL, nextInterval, intervalInfo, dayVisits, extraOf, overlapIndex, hourlyByDate,
  fromRows, toRows, newKey, scheduleError,
} from '../../../../utils/schedule';
import { wilayaName, SECTOR_LABELS } from '../../../../utils/doctors';
import DoctorFormSheet, { DoctorCredentialsSheet } from './DoctorFormSheet';
import AddSpecialty from './AddSpeciality';
import { SwitchRow, ConfirmSheet } from './EventFormParts';

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

const dayLabel = (date, long = false) => {
  const d = new Date(`${date}T00:00:00`);
  if (!date || Number.isNaN(d.getTime())) return date || '—';
  return d.toLocaleDateString('ar-DZ', long ? { weekday: 'long', day: 'numeric', month: 'long' } : { day: 'numeric', month: 'numeric' });
};

// Column widths in px. The admin drags any column's edge (an empty last column
// takes what is left); widths and the hidden name column are remembered here.
// Interval columns are keyed from0/to0, from1/to1...
// Defaults as arranged by the admin on a wide screen; the first interval is wider than the next ones
const COLUMN_WIDTHS = {
  num: 28, name: 200, day: 64, visit: 136, from0: 200, to0: 200, from: 150, to: 150, extra: 136, visits: 64, actions: 76,
};
const HIDDEN_NAME = 20;
const MIN_WIDTH = 28;
const MAX_WIDTH = 480;
const stored = (key, fallback) => {
  try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
};
const store = (key, value) => {
  try { localStorage.setItem(key, String(value)); } catch { /* private mode */ }
};
const clampWidth = (w) => Math.round(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, w)));
const storedWidths = () => {
  try { return JSON.parse(stored('eventTable.widths', '{}')) || {}; } catch { return {}; }
};

const cellInput = 'w-full h-9 rounded-md border border-line bg-white px-1 text-sm text-ink tabular-nums focus:border-ink focus:outline-none';
// Narrow number cells: no spinner arrows eating the digits
const numberInput = '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none';

// ----------------------------------------------------------- State helpers

const blankRow = (date, previous) => ({
  key: newKey(),
  doctor_id: null,
  days: [{
    day_date: date || '',
    // A new row starts with the previous row's hours: doctors of a specialty usually share them
    intervals: previous
      ? previous.days[0].intervals.map(({ start_time, end_time, visit_minutes }) => ({ start_time, end_time, visit_minutes, extra_visits: 0 }))
      : [{ ...DEFAULT_INTERVAL }],
  }],
});

/** A specialty group of the table, with one empty row. */
export const newTableSpecialty = (date) => ({
  key: newKey(),
  id: '',
  description: '',
  is_saturated: false,
  has_dilatation: false,
  schedule: [blankRow(date)],
});

/** Specialties from a draft (older drafts hold one entry per doctor with several days). */
export const restoreTableSpecialties = (list = []) => list.map((spec) => ({
  ...spec,
  key: spec.key || newKey(),
  schedule: toRows(spec.schedule || []),
}));

/** The API payload: rows merged per doctor, keys dropped; one-day events get their date everywhere. */
export const prepareSpecialties = (list, dates) => list.map((spec) => {
  const payload = { ...spec, schedule: fromRows(spec.schedule, dates.length === 1 ? dates[0] : null) };
  delete payload.key;
  return payload;
});

/** First problem of the table as a sentence, or ''. */
export function tableError(list, dates, specialtyName, doctorName) {
  if (!list.length) return 'أضف تخصصًا واحدًا على الأقل';
  for (let i = 0; i < list.length; i += 1) {
    const spec = list[i];
    if (!spec.id) return `اختر اسم التخصص رقم ${i + 1}`;
    const label = `«${specialtyName(spec.id)}»`;
    if (list.some((other, j) => j < i && String(other.id) === String(spec.id))) return `${label} مضاف مرتين، احذف أحدهما`;
    if (!spec.schedule.length) return `أضف طبيبًا واحدًا على الأقل إلى ${label}`;
    for (let r = 0; r < spec.schedule.length; r += 1) {
      const row = spec.schedule[r];
      if (!row.doctor_id) return `اختر الطبيب في السطر ${r + 1} من ${label}`;
      if (dates.length > 1 && !dates.includes(row.days[0].day_date)) {
        return `اختر يوم الطبيب ${doctorName(row.doctor_id)} في ${label}، ضمن تواريخ الحدث`;
      }
    }
    const msg = scheduleError(fromRows(spec.schedule, dates.length === 1 ? dates[0] : null), doctorName, label);
    if (msg) return msg;
  }
  return '';
}

const rowExtra = (row) => row.days[0].intervals.reduce((sum, iv) => sum + extraOf(iv), 0);
const specVisits = (spec) => spec.schedule.reduce((sum, row) => sum + dayVisits(row.days[0]), 0);
const specExtra = (spec) => spec.schedule.reduce((sum, row) => sum + rowExtra(row), 0);
const specDoctors = (spec) => new Set(spec.schedule.map((r) => r.doctor_id).filter(Boolean)).size;

/** Visits of each doctor of a specialty: [{ doctor_id, visits, extra, days }] (doctor_id null = rows without a doctor yet). */
function byDoctor(spec) {
  const map = new Map();
  spec.schedule.forEach((row) => {
    const item = map.get(row.doctor_id) || { doctor_id: row.doctor_id, visits: 0, extra: 0, days: new Set() };
    item.visits += dayVisits(row.days[0]);
    item.extra += rowExtra(row);
    if (row.days[0].day_date) item.days.add(row.days[0].day_date);
    map.set(row.doctor_id, item);
  });
  return [...map.values()].map((item) => ({ ...item, days: item.days.size }));
}

// ---------------------------------------------------------------- Combobox

/**
 * Searchable select for a table cell. options: [{ value, label, hint?, disabled? }].
 * onCreate(query): adds a missing item (the last line of the list).
 * The list is drawn in a portal so the table's scrolling box does not clip it.
 */
function Combobox({ value, options, onChange, onCreate, createLabel, placeholder, invalid, label, className }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const selected = options.find((o) => String(o.value) === String(value));
  const q = query.trim();
  const items = [
    ...(q ? options.filter((o) => o.label.includes(q) || (o.hint || '').includes(q)) : options),
    ...(onCreate ? [{ create: true, value: '__create', label: q ? `${createLabel} «${q}»` : createLabel }] : []),
  ];

  const place = () => {
    const r = inputRef.current?.getBoundingClientRect();
    if (!r) return;
    const width = Math.max(r.width, 256);
    const below = window.innerHeight - r.bottom;
    setPos({
      width,
      // RTL: the list lines up with the input's right edge
      left: Math.max(8, Math.min(r.right - width, window.innerWidth - width - 8)),
      ...(below < 280 && r.top > below ? { bottom: window.innerHeight - r.top + 4 } : { top: r.bottom + 4 }),
    });
  };

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  useLayoutEffect(() => {
    if (open) place();
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onScroll = (e) => { if (!listRef.current?.contains(e.target)) place(); };
    const onDown = (e) => {
      if (!inputRef.current?.contains(e.target) && !listRef.current?.contains(e.target)) close();
    };
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', place);
    document.addEventListener('mousedown', onDown);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', place);
      document.removeEventListener('mousedown', onDown);
    };
  }, [open]);

  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const pick = (item) => {
    if (!item || item.disabled) return;
    if (item.create) onCreate(q);
    else onChange(item.value);
    close();
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) setOpen(true);
      const step = e.key === 'ArrowDown' ? 1 : -1;
      setActive((a) => (a + step + items.length) % Math.max(items.length, 1));
    } else if (e.key === 'Enter' && open) {
      e.preventDefault();
      pick(items[active]);
    } else if (e.key === 'Escape' || e.key === 'Tab') {
      close();
    }
  };

  return (
    <>
      <div className={cx('relative', className)}>
        <input
          ref={inputRef}
          type="text"
          size={1}
          role="combobox"
          aria-expanded={open}
          aria-label={label}
          className={cx(cellInput, 'pe-7', invalid && 'border-red-400', !open && selected && 'font-semibold')}
          value={open ? query : selected?.label || ''}
          placeholder={open && selected ? selected.label : placeholder}
          onFocus={() => { setOpen(true); setActive(0); }}
          onClick={() => setOpen(true)}
          onChange={(e) => { setQuery(e.target.value); setActive(0); setOpen(true); }}
          onKeyDown={onKeyDown}
        />
        <ChevronDown className="pointer-events-none absolute end-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
      </div>
      {open && pos && createPortal(
        <ul
          ref={listRef}
          role="listbox"
          dir="rtl"
          style={{ position: 'fixed', left: pos.left, top: pos.top, bottom: pos.bottom, width: pos.width }}
          className="z-[70] max-h-64 overflow-auto rounded-xl border border-line bg-white py-1 shadow-lg"
        >
          {items.length === (onCreate ? 1 : 0) && <li className="px-3 py-2 text-sm text-muted">لا نتيجة</li>}
          {items.map((item, idx) => (
            <li
              key={item.value}
              role="option"
              aria-selected={String(item.value) === String(value)}
              aria-disabled={item.disabled || undefined}
              data-active={idx === active}
              onMouseDown={(e) => { e.preventDefault(); pick(item); }}
              onMouseEnter={() => setActive(idx)}
              className={cx(
                'px-3 py-2 text-sm cursor-pointer',
                idx === active && !item.disabled && 'bg-ink-faint',
                item.disabled && 'text-muted cursor-default',
                item.create && 'border-t border-line text-ink font-semibold flex items-center gap-1.5',
              )}
            >
              {item.create && <Plus className="w-4 h-4 shrink-0" />}
              <span className={cx(!item.create && 'block truncate', String(item.value) === String(value) && 'font-semibold')}>{item.label}</span>
              {item.hint && <span className="block text-xs text-muted truncate">{item.hint}</span>}
            </li>
          ))}
        </ul>,
        document.body,
      )}
    </>
  );
}

// ------------------------------------------------------------------- Table

/**
 * value: the specialties being planned ({ key, id, description, is_saturated,
 * has_dilatation, schedule: rows }), each row a doctor on one day.
 * dates: the event's days; with one day the date column is hidden.
 * selectedKey / onSelect: the specialty shown in the summary. actions: extra toolbar buttons.
 */
export function ScheduleTable({
  value, onChange, specialties, doctors, busy = [], dates, onDoctorCreated, onSpecialtyCreated, selectedKey, onSelect, actions,
}) {
  const toast = useToast();
  const [collapsed, setCollapsed] = useState(() => new Set());
  const [minCols, setMinCols] = useState(1);
  const [widths, setWidths] = useState(storedWidths);
  const [nameHidden, setNameHidden] = useState(() => stored('eventTable.nameHidden', '0') === '1');
  useEffect(() => store('eventTable.widths', JSON.stringify(widths)), [widths]);
  useEffect(() => store('eventTable.nameHidden', nameHidden ? '1' : '0'), [nameHidden]);

  // Multi-day events have a third row button (copy to the next day)
  const widthOf = (key) => widths[key]
    ?? (key === 'actions' && dates.length > 1 ? 112 : COLUMN_WIDTHS[key] ?? COLUMN_WIDTHS[key.replace(/\d+$/, '')]);
  const setWidth = (key, w) => setWidths((prev) => ({ ...prev, [key]: clampWidth(w) }));
  const resetWidth = (key) => setWidths((prev) => {
    const next = { ...prev };
    delete next[key];
    return next;
  });

  // Drag a column's end edge: in RTL, moving left widens it
  const startResize = (key) => (e) => {
    e.preventDefault();
    const startX = e.clientX;
    const start = widthOf(key);
    const rtl = getComputedStyle(e.currentTarget).direction === 'rtl';
    const move = (ev) => setWidth(key, start + (rtl ? startX - ev.clientX : ev.clientX - startX));
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      document.body.style.cursor = '';
    };
    document.body.style.cursor = 'col-resize';
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  /** Drag handle on a header cell's end edge (the cell must be `relative`). */
  const resizer = (key, label) => (
    <span
      role="separator"
      aria-orientation="vertical"
      aria-label={`عرض عمود ${label}`}
      aria-valuenow={widthOf(key)}
      aria-valuemin={MIN_WIDTH}
      aria-valuemax={MAX_WIDTH}
      tabIndex={0}
      title="اسحب لتغيير العرض، نقرتان للعرض الأصلي"
      onPointerDown={startResize(key)}
      onDoubleClick={() => resetWidth(key)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') setWidth(key, widthOf(key) + 8);
        if (e.key === 'ArrowRight') setWidth(key, widthOf(key) - 8);
      }}
      className="absolute inset-y-0 end-0 z-10 w-2 cursor-col-resize touch-none border-e-2 border-transparent hover:border-ink/40 focus-visible:border-ink focus:outline-none"
    />
  );
  const [creatingSpecialty, setCreatingSpecialty] = useState(null); // { specKey, name }
  const [creatingDoctor, setCreatingDoctor] = useState(null); // { specKey, rowKey, specialtyId, prefill }
  const [credentials, setCredentials] = useState(null);
  const [settingsKey, setSettingsKey] = useState(null);
  const [confirm, setConfirm] = useState(null); // { type: 'specialty', key } | { type: 'column', index }

  const multiDay = dates.length > 1;
  const cols = Math.max(minCols, 1, ...value.flatMap((s) => s.schedule.map((r) => r.days[0].intervals.length)));
  // number, doctor, (day), visit, interval pairs, extra, visits, actions
  const columnCount = 7 + (multiDay ? 1 : 0) + cols * 2; // with the empty last column
  // Widths of every column but the empty last one, in table order
  const colWidths = [
    COLUMN_WIDTHS.num,
    nameHidden ? HIDDEN_NAME : widthOf('name'),
    ...(multiDay ? [widthOf('day')] : []),
    widthOf('visit'),
    ...Array.from({ length: cols }, (_, k) => [widthOf(`from${k}`), widthOf(`to${k}`)]).flat(),
    widthOf('extra'),
    widthOf('visits'),
    widthOf('actions'),
  ];

  const nameOf = (id) => specialties.find((s) => String(s.id) === String(id))?.name;
  const doctorById = (id) => doctors.find((d) => d.id === id);

  // ---- updates
  const patchSpec = (key, patch) => onChange(value.map((s) => (s.key === key ? { ...s, ...(typeof patch === 'function' ? patch(s) : patch) } : s)));
  const patchRow = (specKey, rowKey, fn) => patchSpec(specKey, (s) => ({ schedule: s.schedule.map((r) => (r.key === rowKey ? fn(r) : r)) }));
  const patchDay = (specKey, rowKey, fn) => patchRow(specKey, rowKey, (r) => ({ ...r, days: [fn(r.days[0])] }));
  const patchIntervals = (specKey, rowKey, fn) => patchDay(specKey, rowKey, (d) => ({ ...d, intervals: fn(d.intervals) }));

  const addSpecialty = () => {
    const spec = newTableSpecialty(dates[0]);
    onChange([...value, spec]);
    onSelect?.(spec.key);
  };

  // Doctors belong to one specialty: changing it clears the doctors, keeps the hours
  const changeSpecialty = (spec, id) => {
    if (String(id) === String(spec.id)) return;
    const hadDoctors = spec.schedule.some((r) => r.doctor_id);
    patchSpec(spec.key, { id, schedule: spec.schedule.map((r) => ({ ...r, doctor_id: null })) });
    if (hadDoctors) toast('أُزيل أطباء التخصص السابق، اختر أطباء التخصص الجديد', 'info');
  };

  const addRow = (spec) => {
    const last = spec.schedule[spec.schedule.length - 1];
    patchSpec(spec.key, { schedule: [...spec.schedule, blankRow(last?.days[0].day_date || dates[0], last)] });
  };

  // Same doctor and hours on the next day of the event
  // Same day, hours, visit length and extra visits for another doctor: only the doctor is left to pick
  const duplicateRow = (spec, row) => {
    const copy = { key: newKey(), doctor_id: null, days: [{ ...row.days[0], intervals: row.days[0].intervals.map((iv) => ({ ...iv, id: undefined })) }] };
    const at = spec.schedule.indexOf(row) + 1;
    patchSpec(spec.key, { schedule: [...spec.schedule.slice(0, at), copy, ...spec.schedule.slice(at)] });
  };

  const copyToNextDay = (spec, row) => {
    const date = row.days[0].day_date;
    const next = dates.find((d) => d > date) || dates[0];
    const copy = { key: newKey(), doctor_id: row.doctor_id, days: [{ day_date: next, intervals: row.days[0].intervals.map((iv) => ({ ...iv, id: undefined })) }] };
    const at = spec.schedule.indexOf(row) + 1;
    patchSpec(spec.key, { schedule: [...spec.schedule.slice(0, at), copy, ...spec.schedule.slice(at)] });
  };

  const setVisit = (spec, row, minutes) => patchIntervals(spec.key, row.key, (ivs) => ivs.map((iv) => ({ ...iv, visit_minutes: minutes })));

  // The row's extra visits are shared out over its intervals, first ones first
  const setExtra = (spec, row, total) => patchIntervals(spec.key, row.key, (ivs) => ivs.map((iv, k) => ({
    ...iv,
    extra_visits: total === '' ? (k === 0 ? '' : 0) : Math.floor(total / ivs.length) + (k < total % ivs.length ? 1 : 0),
  })));

  const removeColumn = (index) => {
    onChange(value.map((s) => ({
      ...s,
      schedule: s.schedule.map((r) => (r.days[0].intervals.length > index && r.days[0].intervals.length > 1
        ? { ...r, days: [{ ...r.days[0], intervals: r.days[0].intervals.filter((_, k) => k !== index) }] }
        : r)),
    })));
    setMinCols((n) => Math.max(1, Math.min(n, cols - 1)));
  };

  const toggle = (key) => setCollapsed((prev) => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    return next;
  });

  const busyOn = (doctorId, date) => busy.filter((b) => b.doctor_id === doctorId && String(b.day_date).slice(0, 10) === date);

  const settingsSpec = value.find((s) => s.key === settingsKey);

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <Button size="sm" variant="secondary" icon={Plus} onClick={addSpecialty}>أضف تخصصًا</Button>
        <span className="flex-1" />
        {actions}
        {value.length > 0 && (
          <>
            <Button size="sm" variant="ghost" icon={ChevronsUpDown} onClick={() => setCollapsed(new Set())}>وسّع الكل</Button>
            <Button size="sm" variant="ghost" icon={ChevronsDownUp} onClick={() => setCollapsed(new Set(value.map((s) => s.key)))}>اطوِ الكل</Button>
          </>
        )}
      </div>

      <div className="relative overflow-x-auto rounded-2xl border border-line bg-white">
        {/* Fixed layout: each column is exactly its width; the empty last column takes the rest */}
        <table className="w-full table-fixed border-collapse text-sm" style={{ minWidth: colWidths.reduce((a, b) => a + b, 0) }}>
          <colgroup>
            {colWidths.map((w, i) => <col key={i} style={{ width: w }} />)}
            <col />
          </colgroup>
          <thead className="bg-paper text-xs text-muted">
            <tr className="border-b border-line">
              {/* Specialty on the group row, doctor on the rows under it */}
              <th rowSpan={2} colSpan={2} className="relative px-1 py-2 text-start font-semibold">
                {nameHidden ? (
                  <button type="button" onClick={() => setNameHidden(false)} aria-label="أظهر عمود التخصص والطبيب" title="أظهر عمود التخصص والطبيب"
                    className="w-8 h-8 inline-flex items-center justify-center rounded-lg hover:bg-white text-ink">
                    <Eye className="w-4 h-4" />
                  </button>
                ) : (
                  <span className="flex items-center gap-1">
                    <span className="truncate">التخصص ← الطبيب</span>
                    <button type="button" onClick={() => setNameHidden(true)} aria-label="أخفِ عمود التخصص والطبيب" title="أخفِ العمود"
                      className="w-6 h-6 shrink-0 inline-flex items-center justify-center rounded hover:bg-white">
                      <EyeOff className="w-3.5 h-3.5" />
                    </button>
                  </span>
                )}
                {!nameHidden && resizer('name', 'التخصص والطبيب')}
              </th>
              {multiDay && <th rowSpan={2} className="relative px-1 py-2 text-start font-semibold">اليوم{resizer('day', 'اليوم')}</th>}
              <th rowSpan={2} className="relative px-1 py-2 text-start font-semibold" title="مدة الزيارة بالدقائق">
                مدة الزيارة (د){resizer('visit', 'مدة الزيارة')}
              </th>
              {Array.from({ length: cols }, (_, k) => (
                <th key={k} colSpan={2} className="px-1 pt-2 pb-1 font-semibold border-s border-line">
                  <span className="inline-flex items-center gap-1">
                    الفترة {k + 1}
                    {cols > 1 && (
                      <button
                        type="button"
                        aria-label={`احذف الفترة ${k + 1} من كل الأسطر`}
                        title="احذف هذه الفترة من كل الأسطر"
                        className="w-6 h-6 inline-flex items-center justify-center rounded hover:bg-white text-red-700"
                        onClick={() => setConfirm({ type: 'column', index: k })}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {k === cols - 1 && (
                      <button
                        type="button"
                        aria-label="أضف فترة جديدة"
                        title="أضف فترة جديدة (من / إلى)"
                        className="h-6 px-1.5 inline-flex items-center gap-0.5 rounded bg-white border border-line text-ink"
                        onClick={() => setMinCols(cols + 1)}
                      >
                        <Plus className="w-3.5 h-3.5" /> فترة
                      </button>
                    )}
                  </span>
                </th>
              ))}
              <th rowSpan={2} className="relative px-1 py-2 text-start font-semibold border-s border-line">زيارات إضافية{resizer('extra', 'الزيارات الإضافية')}</th>
              <th rowSpan={2} className="relative px-1 py-2 text-start font-semibold">الزيارات{resizer('visits', 'الزيارات')}</th>
              <th rowSpan={2} className="relative"><span className="sr-only">إجراءات</span>{resizer('actions', 'الإجراءات')}</th>
              <th rowSpan={2} aria-hidden="true" />
            </tr>
            <tr className="border-b border-line">
              {Array.from({ length: cols }, (_, k) => (
                <IntervalHeaders key={k} fromHandle={resizer(`from${k}`, `من في الفترة ${k + 1}`)} toHandle={resizer(`to${k}`, `إلى في الفترة ${k + 1}`)} />
              ))}
            </tr>
          </thead>

          {value.length === 0 && (
            <tbody>
              <tr>
                <td colSpan={columnCount} className="px-4 py-10 text-center text-muted">
                  لم تضف أي تخصص بعد. ابدأ بـ «أضف تخصصًا».
                </td>
              </tr>
            </tbody>
          )}

          {value.map((spec, specIndex) => {
            const isCollapsed = collapsed.has(spec.key);
            const isSelected = selectedKey === spec.key;
            const name = nameOf(spec.id);
            const daysUsed = new Set(spec.schedule.map((r) => r.days[0].day_date).filter(Boolean)).size;
            const doctorOptions = doctors
              .filter((d) => d.is_active && String(d.specialty_id) === String(spec.id))
              .map((d) => ({ value: d.id, label: d.full_name, hint: [wilayaName(d.wilaya_code), SECTOR_LABELS[d.sector]].filter(Boolean).join(' · ') }));
            const specialtyOptions = specialties.map((s) => {
              const used = value.some((other) => other.key !== spec.key && String(other.id) === String(s.id));
              const count = doctors.filter((d) => d.is_active && String(d.specialty_id) === String(s.id)).length;
              return { value: s.id, label: s.name, disabled: used, hint: used ? 'مضاف في هذا الحدث' : count ? plural(count, 'طبيب', 'أطباء') : 'بلا أطباء بعد' };
            });

            return (
              <tbody
                key={spec.key}
                onFocusCapture={() => onSelect?.(spec.key)}
                className={cx('border-b-2 border-line last:border-b-0', isSelected && 'outline outline-2 -outline-offset-2 outline-ink/30')}
              >
                {/* Specialty row: its summary stays visible when the rows are folded */}
                <tr className={cx('bg-paper', !isCollapsed && 'border-b border-line')} onClick={() => onSelect?.(spec.key)}>
                  <td colSpan={2} className="px-1 py-1.5 align-middle">
                    <div className="flex items-center gap-1 min-w-0">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); toggle(spec.key); }}
                        aria-expanded={!isCollapsed}
                        aria-label={isCollapsed ? `وسّع ${name || 'التخصص'}` : `اطوِ ${name || 'التخصص'}`}
                        className="w-8 h-8 shrink-0 inline-flex items-center justify-center rounded-lg hover:bg-white"
                      >
                        <ChevronDown className={cx('w-4 h-4 text-ink transition-transform', isCollapsed && 'rotate-90')} />
                      </button>
                      {!nameHidden && <Combobox
                        className="flex-1 min-w-0"
                        label={`التخصص ${specIndex + 1}`}
                        value={spec.id}
                        options={specialtyOptions}
                        placeholder="ابحث عن التخصص"
                        invalid={!spec.id}
                        onChange={(id) => changeSpecialty(spec, id)}
                        onCreate={onSpecialtyCreated && ((q) => setCreatingSpecialty({ specKey: spec.key, name: q }))}
                        createLabel="تخصص جديد"
                      />}
                    </div>
                  </td>
                  {multiDay && <td className="px-1 text-xs text-muted whitespace-nowrap">{plural(daysUsed, 'يوم', 'أيام')}</td>}
                  <td />
                  <td colSpan={cols * 2} className="px-1 border-s border-line">
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted">
                      {nameHidden && <span className="font-semibold text-ink text-sm">{name || 'تخصص جديد'}</span>}
                      <span className="whitespace-nowrap">
                        <span className="font-semibold text-ink">{specDoctors(spec)}</span> {specDoctors(spec) === 1 ? 'طبيب' : 'أطباء'}
                        <span className="mx-1">·</span><span className="font-semibold text-ink">{specVisits(spec)}</span> زيارة
                        <span className="mx-1">·</span><span className="font-semibold text-ink">{specExtra(spec)}</span> إضافية
                      </span>
                      {spec.has_dilatation && <span className="inline-flex items-center gap-1 text-st-dil"><Droplets className="w-3.5 h-3.5" />قاعة تمدد</span>}
                      {spec.is_saturated && <span className="text-st-pushed">مشبع</span>}
                    </span>
                  </td>
                  <td className="px-1 border-s border-line tabular-nums text-ink font-semibold" title="مجموع الزيارات الإضافية">{specExtra(spec)}</td>
                  <td className="px-1 tabular-nums font-display text-base text-ink" title="مجموع الزيارات">{specVisits(spec)}</td>
                  <td className="px-1">
                    <div className="flex items-center justify-end">
                      <IconButton icon={Settings2} label={`إعدادات ${name || 'التخصص'}`} className="w-9 h-9" onClick={(e) => { e.stopPropagation(); setSettingsKey(spec.key); }} />
                      <IconButton icon={Trash2} label={`احذف ${name || 'التخصص'}`} className="w-9 h-9 text-red-700" onClick={(e) => { e.stopPropagation(); setConfirm({ type: 'specialty', key: spec.key }); }} />
                    </div>
                  </td>
                  <td aria-hidden="true" />
                </tr>

                {!isCollapsed && spec.schedule.map((row, r) => {
                  const day = row.days[0];
                  const overlap = overlapIndex(day.intervals);
                  const outOfRange = multiDay && !dates.includes(day.day_date);
                  const elsewhere = row.doctor_id ? busyOn(row.doctor_id, multiDay ? day.day_date : dates[0]) : [];
                  const doctor = doctorById(row.doctor_id);
                  const options = doctor && !doctorOptions.some((o) => o.value === doctor.id)
                    ? [{ value: doctor.id, label: doctor.full_name, hint: 'موقوف' }, ...doctorOptions]
                    : doctorOptions;
                  const visit = day.intervals[0]?.visit_minutes ?? '';
                  return (
                    <tr key={row.key} className="border-b border-line/60 hover:bg-paper/50">
                      <td className="w-8 ps-1.5 pe-0.5 text-xs text-muted tabular-nums">{r + 1}</td>
                      <td className="px-1 py-1.5" title={nameHidden ? doctor?.full_name || 'بلا طبيب' : undefined}>
                        {nameHidden ? (
                          <span className={cx('block w-2 h-2 mx-auto rounded-full', row.doctor_id ? 'bg-ink/40' : 'bg-red-500')} aria-label={doctor?.full_name || 'بلا طبيب'} />
                        ) : (
                        <div className="flex items-center gap-1">
                          <Combobox
                            className="flex-1 min-w-0"
                            label={`الطبيب في السطر ${r + 1}`}
                            value={row.doctor_id ?? ''}
                            options={options}
                            placeholder={spec.id ? 'ابحث عن الطبيب' : 'اختر التخصص أولاً'}
                            invalid={!row.doctor_id}
                            onChange={(id) => patchRow(spec.key, row.key, (x) => ({ ...x, doctor_id: id }))}
                            onCreate={spec.id ? (q) => {
                              const [first = '', ...rest] = q.split(/\s+/).filter(Boolean);
                              setCreatingDoctor({ specKey: spec.key, rowKey: row.key, specialtyId: spec.id, prefill: { first_name: first, family_name: rest.join(' ') } });
                            } : undefined}
                            createLabel="طبيب جديد"
                          />
                          {elsewhere.length > 0 && (
                            <span title={elsewhere.map((b) => `مبرمج في «${b.event_name}» في نفس اليوم`).join('\n')} className="shrink-0 text-st-pushed">
                              <TriangleAlert className="w-4 h-4" aria-label="مبرمج في حدث آخر في نفس اليوم" />
                            </span>
                          )}
                        </div>
                        )}
                      </td>
                      {multiDay && (
                        <td className="px-1">
                          <select
                            aria-label={`يوم السطر ${r + 1}`}
                            title={day.day_date ? dayLabel(day.day_date, true) : undefined}
                            className={cx(cellInput, 'appearance-none text-center', outOfRange && 'border-red-400')}
                            value={day.day_date || ''}
                            onChange={(e) => patchDay(spec.key, row.key, (d) => ({ ...d, day_date: e.target.value }))}
                          >
                            {outOfRange && <option value={day.day_date || ''}>{day.day_date ? `${dayLabel(day.day_date)} (خارج الحدث)` : 'اختر اليوم'}</option>}
                            {dates.map((d) => <option key={d} value={d}>{dayLabel(d)}</option>)}
                          </select>
                        </td>
                      )}
                      <td className="px-1">
                        <input
                          type="number" inputMode="numeric" min="5" max="240" step="5"
                          aria-label={`مدة الزيارة في السطر ${r + 1}`}
                          className={cx(cellInput, numberInput)}
                          value={visit}
                          onChange={(e) => setVisit(spec, row, e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                        />
                      </td>
                      {Array.from({ length: cols }, (_, k) => {
                        const iv = day.intervals[k];
                        if (!iv) {
                          return (
                            <td key={k} colSpan={2} className="px-1 border-s border-line">
                              {k === day.intervals.length && (
                                <button
                                  type="button"
                                  className="w-full h-9 rounded-lg border border-dashed border-line text-xs text-muted hover:text-ink hover:border-ink inline-flex items-center justify-center gap-1"
                                  onClick={() => patchIntervals(spec.key, row.key, (ivs) => [...ivs, { ...nextInterval(ivs), visit_minutes: visit || DEFAULT_INTERVAL.visit_minutes }])}
                                >
                                  <Plus className="w-3.5 h-3.5" /> فترة
                                </button>
                              )}
                            </td>
                          );
                        }
                        const info = intervalInfo(iv);
                        const error = info.error || (k === overlap ? 'تتداخل مع فترة أخرى' : '');
                        const set = (field) => (time) => patchIntervals(spec.key, row.key, (ivs) => ivs.map((x, idx) => (idx === k ? { ...x, [field]: time } : x)));
                        return (
                          <IntervalCells
                            key={k}
                            interval={iv}
                            error={error}
                            leftover={info.leftover}
                            rowLabel={`السطر ${r + 1}، الفترة ${k + 1}`}
                            onStart={set('start_time')}
                            onEnd={set('end_time')}
                            canRemove={day.intervals.length > 1}
                            onRemove={() => patchIntervals(spec.key, row.key, (ivs) => ivs.filter((_, idx) => idx !== k))}
                          />
                        );
                      })}
                      <td className="px-1 border-s border-line">
                        <input
                          type="number" inputMode="numeric" min="0" max="500"
                          aria-label={`زيارات إضافية في السطر ${r + 1}`}
                          className={cx(cellInput, numberInput)}
                          value={day.intervals.some((iv) => iv.extra_visits === '') ? '' : rowExtra(row)}
                          onChange={(e) => setExtra(spec, row, e.target.value === '' ? '' : Math.min(500, Math.max(0, parseInt(e.target.value, 10) || 0)))}
                        />
                      </td>
                      <td className="px-1 tabular-nums font-semibold text-ink">{dayVisits(day)}</td>
                      <td className="px-1">
                        <div className="flex items-center justify-end">
                          <IconButton icon={Copy} label={`كرّر السطر ${r + 1} لطبيب آخر`} title="كرّر السطر (نفس اليوم والفترات) لطبيب آخر" className="w-9 h-9" onClick={() => duplicateRow(spec, row)} />
                          {multiDay && (
                            <IconButton icon={CopyPlus} label="انسخ السطر إلى اليوم التالي" title="انسخ السطر (نفس الطبيب) إلى اليوم التالي" className="w-9 h-9" onClick={() => copyToNextDay(spec, row)} />
                          )}
                          <IconButton
                            icon={Trash2}
                            label={`احذف السطر ${r + 1}`}
                            className="w-9 h-9 text-red-700"
                            onClick={() => patchSpec(spec.key, (s) => ({ schedule: s.schedule.filter((x) => x.key !== row.key) }))}
                          />
                        </div>
                      </td>
                      <td aria-hidden="true" />
                    </tr>
                  );
                })}

                {!isCollapsed && (
                  <tr>
                    <td />
                    <td colSpan={columnCount - 1} className="px-1 py-1.5">
                      <button
                        type="button"
                        onClick={() => addRow(spec)}
                        className="inline-flex items-center gap-1 h-9 px-1 rounded-lg text-sm text-ink hover:bg-paper"
                      >
                        <Plus className="w-4 h-4" /> أضف طبيبًا{name ? ` إلى ${name}` : ''}
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            );
          })}
        </table>
      </div>

      <p className="mt-2 text-xs text-muted">
        كل سطر طبيب{multiDay ? ' في يوم' : ''}. الزيارات = مدة الفترات ÷ مدة الزيارة + الزيارات الإضافية.
        {multiDay && ' لطبيب يعمل عدة أيام: سطر لكل يوم (زر النسخ إلى اليوم التالي).'}
      </p>

      {/* Specialty options that do not fit a column */}
      <Sheet
        open={!!settingsSpec}
        onClose={() => setSettingsKey(null)}
        title={settingsSpec ? `إعدادات ${nameOf(settingsSpec.id) || 'التخصص'}` : ''}
        footer={<Button block onClick={() => setSettingsKey(null)}>تم</Button>}
      >
        {settingsSpec && (
          <div className="space-y-4">
            <Field label="وصف التخصص" hint={`${settingsSpec.description?.length || 0} من 500 حرف، اختياري`}>
              <textarea
                rows={3}
                maxLength={500}
                className="w-full rounded-xl border border-line bg-white px-3 py-3 text-base text-ink placeholder:text-muted focus:border-ink focus:outline-none resize-none"
                value={settingsSpec.description || ''}
                onChange={(e) => patchSpec(settingsSpec.key, { description: e.target.value })}
                placeholder="ملاحظات تظهر للمرضى عند الحجز"
              />
            </Field>
            <div className="divide-y divide-line border-y border-line">
              <SwitchRow checked={settingsSpec.is_saturated} onChange={(v) => patchSpec(settingsSpec.key, { is_saturated: v })} label="التخصص مشبع" hint="يوقف الحجز في هذا التخصص" />
              <SwitchRow checked={settingsSpec.has_dilatation} onChange={(v) => patchSpec(settingsSpec.key, { has_dilatation: v })} icon={Droplets} label="قاعة تمدد" hint="يرسل مسؤول التخصص المرضى إلى التمدد ثم يعودون بأولوية" />
            </div>
          </div>
        )}
      </Sheet>

      <ConfirmSheet
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={confirm?.type === 'column' ? `حذف الفترة ${confirm.index + 1}؟` : 'حذف التخصص؟'}
        confirmLabel={confirm?.type === 'column' ? 'احذف الفترة' : 'احذف التخصص'}
        onConfirm={() => {
          if (confirm.type === 'column') removeColumn(confirm.index);
          else onChange(value.filter((s) => s.key !== confirm.key));
          setConfirm(null);
        }}
      >
        <p>
          {confirm?.type === 'column'
            ? 'تُحذف هذه الفترة من كل الأسطر (يبقى لكل سطر فترة واحدة على الأقل).'
            : `يُحذف «${nameOf(value.find((s) => s.key === confirm?.key)?.id) || 'هذا التخصص'}» بكل أسطره من النموذج.`}
        </p>
      </ConfirmSheet>

      {onSpecialtyCreated && (
        <AddSpecialty
          open={!!creatingSpecialty}
          initialName={creatingSpecialty?.name || ''}
          onClose={() => setCreatingSpecialty(null)}
          onCreated={(specialty) => {
            onSpecialtyCreated(specialty);
            const spec = value.find((s) => s.key === creatingSpecialty?.specKey);
            if (spec) changeSpecialty(spec, specialty.id);
          }}
        />
      )}

      {/* New doctor without leaving the event: put in the row right away */}
      <DoctorFormSheet
        open={creatingDoctor && { prefill: creatingDoctor.prefill }}
        onClose={() => setCreatingDoctor(null)}
        specialties={specialties}
        lockedSpecialtyId={creatingDoctor?.specialtyId}
        onSaved={(doctor, creds) => {
          onDoctorCreated?.(doctor);
          if (creatingDoctor) patchRow(creatingDoctor.specKey, creatingDoctor.rowKey, (x) => ({ ...x, doctor_id: doctor.id }));
          setCredentials(creds);
        }}
      />
      <DoctorCredentialsSheet credentials={credentials} onClose={() => setCredentials(null)} />
    </div>
  );
}

/** "من" / "إلى" headers under one interval, each with its resize handle. */
function IntervalHeaders({ fromHandle, toHandle }) {
  return (
    <>
      <th className="relative px-1 pb-1.5 text-start font-normal border-s border-line">من{fromHandle}</th>
      <th className="relative px-1 pb-1.5 text-start font-normal">إلى{toHandle}</th>
    </>
  );
}

/** Start and end cells of one interval; an error shows as a red border, its text on hover. */
function IntervalCells({ interval, error, leftover, rowLabel, onStart, onEnd, canRemove, onRemove }) {
  const title = error || (leftover > 0 ? `تبقى ${leftover} دقيقة دون زيارة` : undefined);
  return (
    <>
      <td className="px-1 ps-1 border-s border-line">
        <TimeField label={`${rowLabel}: من`} title={title} invalid={!!error} value={String(interval.start_time || '').slice(0, 5)} onChange={onStart} />
      </td>
      <td className="px-1 pe-1">
        <div className="flex items-center gap-0.5">
          <TimeField className="flex-1 min-w-0" label={`${rowLabel}: إلى`} title={title} invalid={!!error} value={String(interval.end_time || '').slice(0, 5)} onChange={onEnd} />
          {canRemove && (
            <button type="button" aria-label={`احذف ${rowLabel}`} onClick={onRemove}
              className="w-6 h-9 shrink-0 inline-flex items-center justify-center rounded text-muted hover:text-red-700">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </td>
    </>
  );
}

// ----------------------------------------------------------------- Summary

/**
 * Live review beside the table: visits of each doctor, grouped by specialty;
 * a selected specialty shows its total and the hours patients will see.
 */
export function ScheduleSummary({ value, specialties, doctors, dates, selectedKey, onSelect }) {
  const nameOf = (id) => specialties.find((s) => String(s.id) === String(id))?.name || 'تخصص جديد';
  const doctorName = (id) => (id ? doctors.find((d) => d.id === id)?.full_name || `#${id}` : 'بلا طبيب بعد');
  const selected = value.find((s) => s.key === selectedKey);
  const shown = selected ? [selected] : value;

  const total = shown.reduce((sum, s) => sum + specVisits(s), 0);
  const extra = shown.reduce((sum, s) => sum + specExtra(s), 0);
  const doctorsCount = new Set(shown.flatMap((s) => s.schedule.map((r) => r.doctor_id)).filter(Boolean)).size;
  const preview = selected ? hourlyByDate(fromRows(selected.schedule.filter((r) => r.doctor_id), dates.length === 1 ? dates[0] : null)) : {};

  return (
    <aside className="bg-white border border-line rounded-2xl p-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
      <h2 className="font-display text-lg text-ink mb-3">ملخص الزيارات</h2>

      <div className="flex flex-wrap gap-1.5 mb-4" role="tablist" aria-label="اختر تخصصًا">
        {[{ key: null, label: 'كل التخصصات' }, ...value.map((s) => ({ key: s.key, label: nameOf(s.id) }))].map((chip) => {
          const on = chip.key === null ? !selected : chip.key === selectedKey;
          return (
            <button
              key={chip.key ?? 'all'}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => onSelect(chip.key)}
              className={cx('h-8 px-3 rounded-full text-xs font-semibold border', on ? 'bg-ink text-white border-ink' : 'bg-white text-muted border-line hover:bg-ink-faint')}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      <dl className="grid grid-cols-3 gap-2 mb-4">
        {[['زيارة', total], ['طبيب', doctorsCount], ['زيارة إضافية', extra]].map(([label, n]) => (
          <div key={label} className="rounded-xl bg-paper px-3 py-2 flex flex-col-reverse">
            <dt className="text-xs text-muted">{label}</dt>
            <dd className="font-display text-2xl leading-tight text-ink tabular-nums">{n}</dd>
          </div>
        ))}
      </dl>

      {shown.length === 0 && <p className="text-sm text-muted">أضف تخصصًا وأطباءه ليظهر الملخص هنا.</p>}

      <ul className="space-y-4">
        {shown.map((spec) => (
          <li key={spec.key}>
            {!selected && (
              <button type="button" onClick={() => onSelect(spec.key)} className="w-full flex justify-between gap-3 text-sm font-semibold text-ink mb-1 hover:underline">
                <span className="truncate">{nameOf(spec.id)}</span>
                <span className="shrink-0 tabular-nums">{specVisits(spec)}</span>
              </button>
            )}
            <ul className={cx('space-y-1 text-sm', !selected && 'ps-3 border-s border-line')}>
              {byDoctor(spec).map((d) => (
                <li key={d.doctor_id ?? 'none'} className="flex justify-between gap-3">
                  <span className={cx('truncate', d.doctor_id ? 'text-ink' : 'text-muted')}>
                    {doctorName(d.doctor_id)}
                    {dates.length > 1 && d.days > 0 && <span className="text-xs text-muted"> · {plural(d.days, 'يوم', 'أيام')}</span>}
                  </span>
                  <span className="shrink-0 tabular-nums text-muted">
                    <span className="font-semibold text-ink">{d.visits}</span>
                    {d.extra > 0 && <span className="text-xs"> (منها {d.extra} إضافية)</span>}
                  </span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>

      {selected && Object.keys(preview).length > 0 && (
        <div className="mt-5 pt-4 border-t border-line">
          <h3 className="text-sm font-semibold text-ink mb-1">ما يراه المريض عند الحجز</h3>
          <p className="text-xs text-muted mb-2">الساعات وعدد الأماكن في كل ساعة، لكل الأطباء معًا.</p>
          <ul className="space-y-2">
            {Object.entries(preview).map(([date, hours]) => (
              <li key={date}>
                <p className="text-xs text-muted mb-1">{dayLabel(date, true)}</p>
                <div className="flex flex-wrap gap-1.5">
                  {hours.map(([hour, count]) => (
                    <span key={hour} className="inline-flex items-center gap-1 h-7 px-2 rounded-full bg-paper text-xs tabular-nums">
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
    </aside>
  );
}
