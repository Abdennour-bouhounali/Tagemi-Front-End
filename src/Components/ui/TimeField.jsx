// Time cell with a clock-face picker: tap the field (or its clock) to pick the
// hour on the dial, then the minutes; typing "830", "8:30" or "14" also works.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Clock } from 'lucide-react';
import { cx } from './index';

const pad = (n) => String(n).padStart(2, '0');

const parts = (value) => {
  const m = /^(\d{1,2}):(\d{2})/.exec(value || '');
  return m ? { h: Number(m[1]), m: Number(m[2]) } : null;
};

/** Typed text as "HH:MM": "830" / "0830" / "8:30" / "8" → "08:30" / "08:00"; null when it is not a time. */
export function normalizeTime(text) {
  const t = String(text || '').trim();
  if (!t) return null;
  let h;
  let m;
  const split = /^(\d{1,2})\s*[:.hH ]\s*(\d{1,2})$/.exec(t);
  if (split) {
    h = Number(split[1]);
    m = Number(split[2]);
  } else if (/^\d{1,4}$/.test(t)) {
    h = Number(t.length <= 2 ? t : t.slice(0, t.length - 2));
    m = t.length <= 2 ? 0 : Number(t.slice(-2));
  } else {
    return null;
  }
  return h < 24 && m < 60 ? `${pad(h)}:${pad(m)}` : null;
}

// Dial geometry (px)
const SIZE = 224;
const C = SIZE / 2;
const OUTER = 88;
const INNER = 58;
const OUTER_HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const INNER_HOURS = [0, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

const at = (i, r) => {
  const a = ((i * 30 - 90) * Math.PI) / 180;
  return { x: C + r * Math.cos(a), y: C + r * Math.sin(a) };
};

/** The hour (or minute) under a point of the dial. */
function pick(mode, x, y) {
  const dx = x - C;
  const dy = y - C;
  const angle = ((Math.atan2(dy, dx) * 180) / Math.PI + 90 + 360) % 360;
  const i = Math.round(angle / 30) % 12;
  if (mode === 'minute') return MINUTES[i];
  return Math.hypot(dx, dy) < (OUTER + INNER) / 2 ? INNER_HOURS[i] : OUTER_HOURS[i];
}

/**
 * value: "HH:MM" or ''. onChange("HH:MM"). invalid: red border. title: shown on hover.
 * The dial is drawn in a portal so a scrolling table does not clip it.
 */
export default function TimeField({ value, onChange, invalid, label, title, className }) {
  const [text, setText] = useState(value || '');
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('hour');
  const [pos, setPos] = useState(null);
  const fieldRef = useRef(null);
  const popRef = useRef(null);
  const dragging = useRef(false);

  const focused = () => fieldRef.current?.contains(document.activeElement);
  useEffect(() => {
    if (!focused()) setText(value || '');
  }, [value]);

  const current = parts(value) || { h: 8, m: 0 };

  const place = () => {
    const r = fieldRef.current?.getBoundingClientRect();
    if (!r) return;
    const width = SIZE + 24;
    const below = window.innerHeight - r.bottom;
    setPos({
      left: Math.max(8, Math.min(r.right - width, window.innerWidth - width - 8)),
      ...(below < 330 && r.top > below ? { bottom: window.innerHeight - r.top + 4 } : { top: r.bottom + 4 }),
    });
  };

  const show = () => {
    setMode('hour');
    setOpen(true);
  };

  useLayoutEffect(() => {
    if (open) place();
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (!fieldRef.current?.contains(e.target) && !popRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    const onScroll = (e) => { if (!popRef.current?.contains(e.target)) place(); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', place);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', place);
    };
  }, [open]);

  const set = (h, m) => {
    const next = `${pad(h)}:${pad(m)}`;
    setText(next);
    onChange(next);
  };

  const choose = (v) => (mode === 'hour' ? set(v, current.m) : set(current.h, v));

  // Hour first, then minutes; the dial closes once the minutes are picked
  const done = () => {
    if (mode === 'hour') setMode('minute');
    else setOpen(false);
  };

  const fromPointer = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    choose(pick(mode, e.clientX - r.left, e.clientY - r.top));
  };

  const commitText = () => {
    const next = normalizeTime(text);
    if (next) {
      setText(next);
      if (next !== value) onChange(next);
    } else {
      setText(value || '');
    }
  };

  const selected = mode === 'hour' ? current.h : current.m - (current.m % 5);
  const ring = mode === 'hour' ? [[OUTER_HOURS, OUTER], [INNER_HOURS, INNER]] : [[MINUTES, OUTER]];
  const hand = (() => {
    if (mode === 'minute') return at(MINUTES.indexOf(selected), OUTER);
    const outer = OUTER_HOURS.indexOf(selected);
    return outer !== -1 ? at(outer, OUTER) : at(INNER_HOURS.indexOf(selected), INNER);
  })();

  return (
    <>
      <div ref={fieldRef} className={cx('relative', className)} title={title}>
        <input
          type="text"
          inputMode="numeric"
          dir="ltr"
          size={1}
          aria-label={label}
          placeholder="--:--"
          className={cx(
            'w-full h-9 rounded-md border bg-white ps-1 pe-7 text-sm text-ink tabular-nums text-left focus:border-ink focus:outline-none',
            invalid ? 'border-red-400 bg-red-50' : 'border-line',
          )}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={commitText}
          onClick={show}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { commitText(); setOpen(false); }
            if (e.key === 'ArrowDown' && !open) { e.preventDefault(); show(); }
          }}
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label={`${label || 'الوقت'}: افتح الساعة`}
          onClick={() => (open ? setOpen(false) : show())}
          className="absolute inset-y-0 end-0 w-7 inline-flex items-center justify-center text-muted hover:text-ink"
        >
          <Clock className="w-3.5 h-3.5" />
        </button>
      </div>

      {open && pos && createPortal(
        <div
          ref={popRef}
          role="dialog"
          aria-label={label || 'اختر الوقت'}
          dir="ltr"
          style={{ position: 'fixed', left: pos.left, top: pos.top, bottom: pos.bottom, width: SIZE + 24 }}
          className="z-[70] rounded-2xl border border-line bg-white p-3 shadow-lg"
        >
          <div className="flex items-center justify-center gap-1 mb-2 font-display text-3xl tabular-nums">
            <button type="button" onClick={() => setMode('hour')}
              className={cx('px-2 rounded-lg', mode === 'hour' ? 'bg-ink text-white' : 'text-muted hover:bg-ink-faint')}>
              {pad(current.h)}
            </button>
            <span className="text-muted">:</span>
            <button type="button" onClick={() => setMode('minute')}
              className={cx('px-2 rounded-lg', mode === 'minute' ? 'bg-ink text-white' : 'text-muted hover:bg-ink-faint')}>
              {pad(current.m)}
            </button>
          </div>
          <p className="text-center text-xs text-muted mb-2" dir="rtl">{mode === 'hour' ? 'اختر الساعة' : 'اختر الدقائق'}</p>

          <div
            className="relative mx-auto rounded-full bg-paper touch-none select-none cursor-pointer"
            style={{ width: SIZE, height: SIZE }}
            onPointerDown={(e) => { dragging.current = true; e.currentTarget.setPointerCapture(e.pointerId); fromPointer(e); }}
            onPointerMove={(e) => { if (dragging.current) fromPointer(e); }}
            onPointerUp={() => { if (dragging.current) { dragging.current = false; done(); } }}
          >
            <svg width={SIZE} height={SIZE} className="absolute inset-0 pointer-events-none" aria-hidden="true">
              <circle cx={C} cy={C} r={3} className="fill-ink" />
              <line x1={C} y1={C} x2={hand.x} y2={hand.y} strokeWidth={2} className="stroke-ink" />
              <circle cx={hand.x} cy={hand.y} r={16} className="fill-ink" />
            </svg>
            {ring.map(([values, r]) => values.map((v, i) => {
              const p = at(i, r);
              const on = v === selected;
              return (
                <span
                  key={`${r}-${v}`}
                  aria-hidden="true"
                  className={cx(
                    'absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 inline-flex items-center justify-center rounded-full tabular-nums pointer-events-none',
                    r === INNER ? 'text-xs' : 'text-sm',
                    on ? 'text-white font-semibold' : r === INNER ? 'text-muted' : 'text-ink',
                  )}
                  style={{ left: p.x, top: p.y }}
                >
                  {mode === 'minute' ? pad(v) : r === INNER && v === 0 ? '00' : v}
                </span>
              );
            }))}
          </div>

          <div className="flex justify-between mt-3" dir="rtl">
            <button type="button" onClick={() => setOpen(false)} className="h-9 px-3 rounded-lg text-sm font-semibold bg-ink text-white">تم</button>
            {mode === 'minute' && (
              <button type="button" onClick={() => setMode('hour')} className="h-9 px-3 rounded-lg text-sm text-muted hover:bg-ink-faint">رجوع إلى الساعة</button>
            )}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
