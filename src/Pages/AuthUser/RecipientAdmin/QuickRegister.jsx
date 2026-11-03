import { API_BASE_URL } from '../../../config/environment';
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Plus, Save, Trash2, CheckCircle2, AlertTriangle, X, Eraser } from "lucide-react";
import { Button, IconButton, useToast, cx } from "../../../Components/ui";
import algeriaLocations from "../../../data/algeria_locations.json";
import { hasFreeSlot, searchKey } from "../../../utils/specialtyLoad";

const WILAYAS = algeriaLocations.algeria_locations;
const TAWAT_CITIES = [
  { value: 'tajnint', label: 'تاجنينت' },
  { value: 'bonora', label: 'آت بونور' },
  { value: 'taghardait', label: 'تغردايت' },
  { value: 'mlichat', label: 'آت مليشت' },
  { value: 'yazgan', label: 'آت يزجن' },
  { value: 'berian', label: 'آت برقان' },
  { value: 'karara', label: 'القرارة' },
  { value: 'warglen', label: 'وارجلان' },
];
const SEX_OPTIONS = [{ value: '0', label: 'ذكر' }, { value: '1', label: 'أنثى' }];

// Column order = Enter order
const COLUMNS = [
  { key: 'name', label: 'الاسم', width: 'min-w-[8rem]' },
  { key: 'lastName', label: 'اللقب', width: 'min-w-[8rem]' },
  { key: 'birthday', label: 'تاريخ الميلاد', width: 'min-w-[8rem]' },
  { key: 'sex', label: 'الجنس', width: 'min-w-[6rem]' },
  { key: 'phone', label: 'الهاتف', width: 'min-w-[8.5rem]' },
  { key: 'phone2', label: 'هاتف ثان', width: 'min-w-[8.5rem]', optional: true },
  { key: 'state', label: 'الولاية', width: 'min-w-[10rem]' },
  { key: 'city', label: 'البلدية', width: 'min-w-[10rem]' },
  { key: 'specialties', label: 'التخصصات', width: 'min-w-[14rem]' },
  { key: 'diseases', label: 'أمراض مزمنة', width: 'min-w-[9rem]', optional: true },
];

let keySeq = 0;
const emptyRow = () => ({
  key: `r${Date.now()}-${keySeq++}`,
  name: '', lastName: '', birthday: '', sex: '', phone: '', phone2: '',
  state: '', city: '', specialties: [], diseases: '',
  status: 'draft', message: '', errors: {}, patientId: null,
});

/** "4/5/1980", "04-05-1980", "04.05.1980", "04051980" or "1980-05-04" → "1980-05-04"; null when not a real past date. */
export function parseBirthday(text) {
  const t = String(text || '').trim();
  let d, m, y;
  let match = t.match(/^(\d{1,2})\s*[/.\-\s]\s*(\d{1,2})\s*[/.\-\s]\s*(\d{4})$/);
  if (match) [, d, m, y] = match;
  else if ((match = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/))) [, y, m, d] = match;
  else if ((match = t.match(/^(\d{2})(\d{2})(\d{4})$/))) [, d, m, y] = match;
  else return null;
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  if (date.getFullYear() !== Number(y) || date.getMonth() !== Number(m) - 1 || date.getDate() !== Number(d)) return null;
  if (date >= new Date() || Number(y) < 1900) return null;
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

const isBlank = (row) => COLUMNS.every((c) => (c.key === 'specialties' ? row.specialties.length === 0 : !row[c.key]));
const PHONE = /^[0-9+\-\s()]{9,20}$/;

function validate(row, maxSpecialties, isTawat) {
  const errors = {};
  if (!row.name.trim()) errors.name = 'الاسم مطلوب';
  if (!row.lastName.trim()) errors.lastName = 'اللقب مطلوب';
  if (!row.birthday.trim()) errors.birthday = 'تاريخ الميلاد مطلوب';
  else if (!parseBirthday(row.birthday)) errors.birthday = 'تاريخ غير صحيح: يوم/شهر/سنة';
  if (row.sex === '') errors.sex = 'الجنس مطلوب';
  if (!row.phone.trim()) errors.phone = 'الهاتف مطلوب';
  else if (!PHONE.test(row.phone.trim())) errors.phone = 'رقم الهاتف غير صحيح';
  if (row.phone2.trim() && !PHONE.test(row.phone2.trim())) errors.phone2 = 'رقم الهاتف الثاني غير صحيح';
  if (!isTawat && !row.state) errors.state = 'الولاية مطلوبة';
  if (!row.city) errors.city = isTawat ? 'القصر مطلوب' : 'البلدية مطلوبة';
  if (row.specialties.length === 0) errors.specialties = 'اختر تخصصاً واحداً على الأقل';
  else if (row.specialties.length > maxSpecialties) errors.specialties = `${maxSpecialties} تخصص كحد أقصى`;
  return errors;
}

/**
 * «إضافة تسجيلات»: reception types new registrations as table rows. Enter
 * moves to the next cell (and to a new row after the last one). Wilaya,
 * commune and specialties are searchable lists. Rows are saved one by one or
 * all at once; the server picks each specialty's slot and rejects a person
 * already registered (same full name + birthday + phone).
 */
export default function QuickRegister({ event, eventId, token, load, mayExceed, onSaved }) {
  const toast = useToast();
  const [rows, setRows] = useState(() => [emptyRow()]);
  const [savingAll, setSavingAll] = useState(false);
  const cells = useRef({});

  const isTawat = !!event?.is_tawat;
  const limit = Math.max(1, Number(event?.nbr_of_allowed_specialties || 1));
  const eventSpecialties = useMemo(() => event?.event_specialties || [], [event]);
  const maxSpecialties = mayExceed ? Math.max(limit, eventSpecialties.length) : limit;

  const specialtyOptions = useMemo(
    () => eventSpecialties
      .map((es) => ({
        value: es.id,
        label: es.specialty?.name || `#${es.id}`,
        count: load[es.id] || 0,
        disabled: !hasFreeSlot(es),
      }))
      .sort((a, b) => a.label.localeCompare(b.label, 'ar')),
    [eventSpecialties, load],
  );
  const wilayaOptions = useMemo(() => WILAYAS.map((w) => ({ value: w.name_ar, label: `${w.code} ${w.name_ar}` })), []);

  const cityOptions = (row) => {
    if (isTawat) return TAWAT_CITIES;
    const wilaya = WILAYAS.find((w) => w.name_ar === row.state);
    return (wilaya?.communes || []).map((c) => ({ value: c, label: c }));
  };

  const update = (key, fields) => setRows((prev) => prev.map((r) => (r.key === key
    ? {
      ...r,
      ...fields,
      status: 'draft',
      message: '',
      errors: { ...r.errors, ...Object.fromEntries(Object.keys(fields).map((f) => [f, ''])) },
    }
    : r)));

  const focusCell = (rowIndex, colIndex) => {
    const el = cells.current[`${rowIndex}:${colIndex}`];
    // Right away, so fast typing lands in the right cell; a new row exists after React renders it
    if (el) el.focus();
    else setTimeout(() => cells.current[`${rowIndex}:${colIndex}`]?.focus(), 0);
  };

  /** Enter on a cell: next cell, or the first cell of the next unsaved row (a new row after the last). */
  const next = (rowIndex, colIndex) => {
    let c = colIndex + 1;
    if (isTawat && COLUMNS[c]?.key === 'state') c += 1;
    if (c < COLUMNS.length) return focusCell(rowIndex, c);
    const target = rows.findIndex((r, i) => i > rowIndex && r.status !== 'saved');
    if (target !== -1) return focusCell(target, 0);
    setRows((prev) => [...prev, emptyRow()]);
    focusCell(rows.length, 0);
  };

  const onEnter = (rowIndex, colIndex) => (e) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      e.preventDefault();
      next(rowIndex, colIndex);
    }
  };

  const addRow = () => {
    setRows((prev) => [...prev, emptyRow()]);
    focusCell(rows.length, 0);
  };
  const removeRow = (key) => setRows((prev) => (prev.length === 1 ? [emptyRow()] : prev.filter((r) => r.key !== key)));
  const clearSaved = () => setRows((prev) => {
    const left = prev.filter((r) => r.status !== 'saved');
    return left.length ? left : [emptyRow()];
  });

  /** Validates, sends the rows, applies each row's result. Returns how many were saved. */
  const save = async (targets) => {
    const ready = [];
    const invalid = {};
    for (const row of targets) {
      const errors = validate(row, maxSpecialties, isTawat);
      if (Object.keys(errors).length) invalid[row.key] = errors;
      else ready.push(row);
    }
    if (Object.keys(invalid).length) {
      setRows((prev) => prev.map((r) => (invalid[r.key]
        ? { ...r, status: 'error', errors: invalid[r.key], message: Object.values(invalid[r.key])[0] }
        : r)));
    }
    if (ready.length === 0) return 0;

    const keys = new Set(ready.map((r) => r.key));
    setRows((prev) => prev.map((r) => (keys.has(r.key) ? { ...r, status: 'saving', message: '' } : r)));
    try {
      const res = await fetch(`${API_BASE_URL}/api/events/${eventId}/quick-registrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          rows: ready.map((r) => ({
            key: r.key,
            name: r.name.trim(),
            lastName: r.lastName.trim(),
            birthday: parseBirthday(r.birthday),
            sex: r.sex,
            phone: r.phone.trim(),
            phone2: r.phone2.trim() || null,
            state: isTawat ? 'غرداية' : r.state,
            city: r.city,
            diseases: r.diseases.trim() || null,
            specialties: r.specialties,
          })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = data.message || 'تعذر الحفظ. أعد المحاولة.';
        setRows((prev) => prev.map((r) => (keys.has(r.key) ? { ...r, status: 'error', message } : r)));
        toast(message, 'error');
        return 0;
      }
      const byKey = Object.fromEntries((data.results || []).map((x) => [x.key, x]));
      setRows((prev) => prev.map((r) => {
        const result = byKey[r.key];
        if (!result) return r;
        if (result.ok) return { ...r, status: 'saved', patientId: result.patient_id, message: result.message, errors: {} };
        const errors = Object.fromEntries(Object.entries(result.errors || {}).map(([f, list]) => [f.split('.')[0], list[0]]));
        return { ...r, status: 'error', message: result.message, errors };
      }));
      const saved = (data.results || []).filter((x) => x.ok).length;
      if (saved) onSaved?.();
      return saved;
    } catch (err) {
      console.error('Quick registration error:', err);
      setRows((prev) => prev.map((r) => (keys.has(r.key) ? { ...r, status: 'error', message: 'تعذر الاتصال بالخادم' } : r)));
      toast('تعذر الاتصال بالخادم. تحقق من الشبكة.', 'error');
      return 0;
    }
  };

  const saveRow = async (row) => {
    const saved = await save([row]);
    if (saved) toast(`سُجّل ${row.name} ${row.lastName}`);
  };

  const saveAll = async () => {
    const targets = rows.filter((r) => r.status !== 'saved' && r.status !== 'saving' && !isBlank(r));
    if (targets.length === 0) return toast('لا توجد صفوف جديدة للتسجيل', 'error');
    setSavingAll(true);
    const saved = await save(targets);
    setSavingAll(false);
    if (saved) toast(`سُجّل ${saved} من ${targets.length}`);
  };

  const pending = rows.filter((r) => r.status !== 'saved' && !isBlank(r)).length;
  const savedCount = rows.filter((r) => r.status === 'saved').length;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <p className="text-sm text-muted flex-1 min-w-[14rem]">
          اكتب ثم اضغط Enter للانتقال إلى الخانة التالية. يأخذ كل تخصص أقرب موعد متاح.
          {' '}{mayExceed ? `يمكنك تجاوز ${limit} تخصص لكل زائر.` : `${limit} تخصص كحد أقصى لكل زائر.`}
        </p>
        {savedCount > 0 && <Button variant="secondary" size="sm" icon={Eraser} onClick={clearSaved}>أخفِ المسجلين ({savedCount})</Button>}
        <Button variant="secondary" size="sm" icon={Plus} onClick={addRow}>صف جديد</Button>
        <Button size="sm" icon={Save} loading={savingAll} disabled={pending === 0} onClick={saveAll}>سجّل الكل ({pending})</Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line bg-white">
        <table className="w-full text-sm">
          <thead className="bg-paper text-muted">
            <tr>
              <th scope="col" className="px-2 py-2 text-start font-semibold w-8">#</th>
              {COLUMNS.map((c) => (
                <th key={c.key} scope="col" className={cx('px-2 py-2 text-start font-semibold whitespace-nowrap', c.width)}>
                  {c.key === 'city' && isTawat ? 'القصر' : c.label}
                  {c.optional && <span className="font-normal"> (اختياري)</span>}
                </th>
              ))}
              <th scope="col" className="px-2 py-2 text-start font-semibold min-w-[11rem]">الحفظ</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, r) => {
              const locked = row.status === 'saved' || row.status === 'saving';
              const cellProps = (c) => ({
                inputRef: (el) => { cells.current[`${r}:${c}`] = el; },
                disabled: locked,
                error: row.errors?.[COLUMNS[c].key],
                label: COLUMNS[c].label,
              });
              return (
                <tr
                  key={row.key}
                  className={cx('border-t border-line align-top', row.status === 'saved' && 'bg-emerald-50/60', row.status === 'error' && 'bg-red-50/50')}
                >
                  <td className="px-2 py-3 text-muted tabular-nums">{r + 1}</td>
                  <td className="p-1"><CellInput {...cellProps(0)} value={row.name} onChange={(v) => update(row.key, { name: v })} onKeyDown={onEnter(r, 0)} /></td>
                  <td className="p-1"><CellInput {...cellProps(1)} value={row.lastName} onChange={(v) => update(row.key, { lastName: v })} onKeyDown={onEnter(r, 1)} /></td>
                  <td className="p-1">
                    <CellInput
                      {...cellProps(2)}
                      value={row.birthday}
                      dir="ltr"
                      inputMode="numeric"
                      placeholder="يوم/شهر/سنة"
                      onChange={(v) => update(row.key, { birthday: v })}
                      onKeyDown={onEnter(r, 2)}
                    />
                  </td>
                  <td className="p-1">
                    <Combo {...cellProps(3)} options={SEX_OPTIONS} value={row.sex} onPick={(v) => update(row.key, { sex: v })} onNext={() => next(r, 3)} />
                  </td>
                  <td className="p-1"><CellInput {...cellProps(4)} value={row.phone} dir="ltr" inputMode="tel" onChange={(v) => update(row.key, { phone: v })} onKeyDown={onEnter(r, 4)} /></td>
                  <td className="p-1"><CellInput {...cellProps(5)} value={row.phone2} dir="ltr" inputMode="tel" onChange={(v) => update(row.key, { phone2: v })} onKeyDown={onEnter(r, 5)} /></td>
                  <td className="p-1">
                    {isTawat ? <span className="block px-2 py-2.5 text-muted">غرداية</span> : (
                      <Combo
                        {...cellProps(6)}
                        options={wilayaOptions}
                        value={row.state}
                        placeholder="ابحث…"
                        onPick={(v) => update(row.key, { state: v, city: v === row.state ? row.city : '' })}
                        onNext={() => next(r, 6)}
                      />
                    )}
                  </td>
                  <td className="p-1">
                    <Combo
                      {...cellProps(7)}
                      options={cityOptions(row)}
                      value={row.city}
                      placeholder={isTawat || row.state ? 'ابحث…' : 'الولاية أولاً'}
                      emptyText={isTawat || row.state ? 'لا نتيجة' : 'اختر الولاية أولاً'}
                      onPick={(v) => update(row.key, { city: v })}
                      onNext={() => next(r, 7)}
                    />
                  </td>
                  <td className="p-1">
                    <MultiCombo
                      {...cellProps(8)}
                      options={specialtyOptions}
                      values={row.specialties}
                      max={maxSpecialties}
                      onChange={(v) => update(row.key, { specialties: v })}
                      onNext={() => next(r, 8)}
                    />
                  </td>
                  <td className="p-1"><CellInput {...cellProps(9)} value={row.diseases} onChange={(v) => update(row.key, { diseases: v })} onKeyDown={onEnter(r, 9)} /></td>
                  <td className="px-2 py-1.5">
                    {row.status === 'saved' ? (
                      <p className="flex items-center gap-1.5 text-emerald-800 font-semibold py-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0" /> رقم الزائر #{row.patientId}
                      </p>
                    ) : (
                      <div className="flex items-center gap-1">
                        <Button size="sm" icon={Save} loading={row.status === 'saving'} disabled={isBlank(row) || savingAll} onClick={() => saveRow(row)}>سجّل</Button>
                        <IconButton icon={Trash2} label="احذف الصف" disabled={row.status === 'saving'} onClick={() => removeRow(row.key)} />
                      </div>
                    )}
                    {row.status === 'error' && row.message && (
                      <p className="flex items-start gap-1 mt-1 text-xs text-red-700 max-w-[14rem]">
                        <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {row.message}
                      </p>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const cellClass = (error, disabled) => cx(
  'w-full h-10 rounded-lg border bg-white px-2 text-sm text-ink outline-none focus:ring-2 focus:ring-ink/30 focus:border-ink',
  error ? 'border-red-400' : 'border-line',
  disabled && 'bg-transparent border-transparent text-ink-soft',
);

function CellInput({ inputRef, value, onChange, error, disabled, label, ...props }) {
  return (
    <input
      ref={inputRef}
      value={value}
      disabled={disabled}
      aria-label={label}
      aria-invalid={!!error || undefined}
      title={error || undefined}
      onChange={(e) => onChange(e.target.value)}
      className={cellClass(error, disabled)}
      {...props}
    />
  );
}

/** Position of an input, kept up to date while its dropdown is open (fixed, so the table's scroll box doesn't clip it). */
function useAnchorRect(open, anchor) {
  const [rect, setRect] = useState(null);
  useEffect(() => {
    if (!open || !anchor.current) return undefined;
    const place = () => setRect(anchor.current?.getBoundingClientRect() || null);
    place();
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [open, anchor]);
  return rect;
}

function OptionList({ rect, options, active, setActive, onPick, isSelected, empty }) {
  const listRef = useRef(null);
  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [active]);
  if (!rect) return null;
  const below = window.innerHeight - rect.bottom > 250;
  const width = Math.max(rect.width, 220);
  return createPortal(
    <ul
      ref={listRef}
      role="listbox"
      dir="rtl"
      className="fixed z-[70] max-h-60 overflow-y-auto rounded-xl border border-line bg-white shadow-lg py-1 text-sm"
      style={{
        top: below ? rect.bottom + 4 : undefined,
        bottom: below ? undefined : window.innerHeight - rect.top + 4,
        left: Math.max(8, rect.right - width),
        width,
      }}
      onMouseDown={(e) => e.preventDefault()} // keep focus in the input
    >
      {options.length === 0 && <li className="px-3 py-2 text-muted">{empty}</li>}
      {options.map((o, i) => (
        <li
          key={o.value}
          role="option"
          aria-selected={isSelected(o)}
          aria-disabled={o.disabled || undefined}
          data-active={i === active}
          onMouseEnter={() => setActive(i)}
          onClick={() => !o.disabled && onPick(o)}
          className={cx(
            'flex items-center justify-between gap-3 px-3 py-2 cursor-pointer',
            i === active && 'bg-ink-faint',
            o.disabled && 'opacity-45 cursor-not-allowed',
            isSelected(o) && 'font-semibold',
          )}
        >
          <span className="truncate">{o.label}</span>
          {o.count !== undefined && (
            <span className="shrink-0 tabular-nums text-xs text-muted" title="سيمرون اليوم بهذا التخصص (في الانتظار أو في الطابور)">
              {o.disabled ? 'ممتلئ' : `${o.count} سيمرون`}
            </span>
          )}
        </li>
      ))}
    </ul>,
    document.body,
  );
}

const filterOptions = (options, query) => {
  const q = searchKey(query);
  if (!q) return options;
  return options.filter((o) => searchKey(o.label).includes(q));
};

/** Single choice with search: type to filter, arrows to move, Enter picks and goes to the next cell. */
function Combo({ inputRef, options, value, onPick, onNext, error, disabled, placeholder, emptyText = 'لا نتيجة', label }) {
  const ownRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const selected = options.find((o) => o.value === value);
  const list = filterOptions(options, query);
  const rect = useAnchorRect(open, ownRef);

  const setRefs = (el) => {
    ownRef.current = el;
    inputRef?.(el);
  };
  const pick = (o) => {
    onPick(o.value);
    setQuery('');
    setOpen(false);
    onNext();
  };

  return (
    <>
      <input
        ref={setRefs}
        role="combobox"
        aria-label={label}
        aria-expanded={open}
        aria-invalid={!!error || undefined}
        title={error || undefined}
        disabled={disabled}
        placeholder={placeholder}
        value={open ? query : (selected?.label || '')}
        onFocus={() => { setOpen(true); setQuery(''); setActive(Math.max(0, options.findIndex((o) => o.value === value))); }}
        onBlur={() => setOpen(false)}
        onChange={(e) => { setQuery(e.target.value); setActive(0); setOpen(true); }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(i + 1, list.length - 1)); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
          else if (e.key === 'Escape') setOpen(false);
          else if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
            e.preventDefault();
            const o = list[active];
            // Nothing typed and a value already chosen: keep it and move on
            if (!query && selected) { setOpen(false); onNext(); }
            else if (o && !o.disabled) pick(o);
          }
        }}
        className={cellClass(error, disabled)}
      />
      {open && !disabled && (
        <OptionList
          rect={rect}
          options={list}
          active={active}
          setActive={setActive}
          onPick={pick}
          isSelected={(o) => o.value === value}
          empty={options.length === 0 ? emptyText : 'لا نتيجة'}
        />
      )}
    </>
  );
}

/**
 * Several specialties with search: Enter adds the highlighted one and stays
 * (to add another); Enter with nothing typed goes to the next cell. Each
 * option shows how many patients will still pass there today.
 */
function MultiCombo({ inputRef, options, values, max, onChange, onNext, error, disabled, label }) {
  const ownRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const list = filterOptions(options.filter((o) => !values.includes(o.value)), query);
  const rect = useAnchorRect(open, ownRef);
  const full = values.length >= max;

  const setRefs = (el) => {
    ownRef.current = el;
    inputRef?.(el);
  };
  const add = (o) => {
    if (o.disabled || full) return;
    onChange([...values, o.value]);
    setQuery('');
    setActive(0);
  };

  return (
    <div className={cx('rounded-lg border bg-white', error ? 'border-red-400' : 'border-line', disabled && 'bg-transparent border-transparent')} title={error || undefined}>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1 p-1">
          {values.map((v) => {
            const o = options.find((x) => x.value === v);
            return (
              <span key={v} className="inline-flex items-center gap-1 rounded-full bg-ink-faint px-2 py-0.5 text-xs font-semibold text-ink">
                {o?.label || `#${v}`}
                {!disabled && (
                  <button
                    type="button"
                    aria-label={`احذف ${o?.label || ''}`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => onChange(values.filter((x) => x !== v))}
                    className="text-muted hover:text-ink"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </span>
            );
          })}
        </div>
      )}
      {!disabled && (
        <input
          ref={setRefs}
          role="combobox"
          aria-label={label}
          aria-expanded={open}
          aria-invalid={!!error || undefined}
          placeholder={full ? 'Enter للخانة التالية' : 'ابحث عن تخصص…'}
          value={query}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onChange={(e) => { setQuery(e.target.value); setActive(0); setOpen(true); }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(i + 1, list.length - 1)); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
            else if (e.key === 'Escape') setOpen(false);
            else if (e.key === 'Backspace' && !query && values.length) onChange(values.slice(0, -1));
            else if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
              e.preventDefault();
              const o = list[active];
              // Nothing typed with at least one chosen (or the list is full): next cell
              if ((!query && values.length) || full) { setOpen(false); onNext(); }
              else if (o) add(o);
            }
          }}
          className="w-full h-10 rounded-lg bg-transparent px-2 text-sm text-ink outline-none"
        />
      )}
      {open && !disabled && !full && (
        <OptionList
          rect={rect}
          options={list}
          active={active}
          setActive={setActive}
          onPick={add}
          isSelected={() => false}
          empty="لا نتيجة"
        />
      )}
    </div>
  );
}
