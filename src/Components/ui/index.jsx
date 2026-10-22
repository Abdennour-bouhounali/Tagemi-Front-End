// Shared UI kit for the staff app and the patient visit pages.
// Mobile first: every control is at least 44px tall, RTL by default.
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { CheckCircle2, AlertTriangle, Info, X, Loader2, Search } from 'lucide-react';
import { statusLabel } from '../../utils/visitStatus';
// ui.css is imported in main.jsx, after index.css, so its resets win

const cx = (...classes) => classes.filter(Boolean).join(' ');

// ---------------------------------------------------------------- Button

const BUTTON_VARIANTS = {
  primary: 'bg-ink text-white hover:bg-ink-soft disabled:bg-line disabled:text-muted',
  secondary: 'bg-white text-ink border border-line hover:bg-ink-faint disabled:text-muted',
  success: 'bg-st-queue text-white hover:brightness-110 disabled:bg-line disabled:text-muted',
  warning: 'bg-st-pushed-bg text-st-pushed border border-st-pushed/30 hover:brightness-95',
  danger: 'bg-white text-red-700 border border-red-200 hover:bg-red-50',
  ghost: 'text-ink hover:bg-ink-faint',
};

export function Button({ variant = 'primary', size = 'md', icon: Icon, loading, block, className, children, ...props }) {
  return (
    <button
      type="button"
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:cursor-not-allowed',
        size === 'lg' ? 'h-12 px-5 text-base' : size === 'sm' ? 'h-9 px-3 text-sm' : 'h-11 px-4 text-sm',
        block && 'w-full',
        BUTTON_VARIANTS[variant],
        className
      )}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : Icon && <Icon className="w-4 h-4 shrink-0" />}
      {children}
    </button>
  );
}

export function IconButton({ icon: Icon, label, className, ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cx('inline-flex items-center justify-center w-11 h-11 rounded-xl text-ink hover:bg-ink-faint', className)}
      {...props}
    >
      <Icon className="w-5 h-5" />
    </button>
  );
}

// ---------------------------------------------------------- Status badge

const STATUS_TONE = {
  Present: 'bg-st-queue-bg text-st-queue',
  Commingsoon: 'bg-st-pushed-bg text-st-pushed',
  Waiting: 'bg-st-hold-bg text-st-hold',
  DilatationSent: 'bg-st-dil-bg text-st-dil',
  Dilatation: 'bg-st-dil-bg text-st-dil',
  Completed: 'bg-st-done-bg text-st-done',
  Pending: 'bg-st-pending-bg text-st-pending',
};

export function StatusBadge({ status, className }) {
  return (
    <span className={cx('inline-flex items-center h-6 px-2 rounded-md text-xs font-semibold whitespace-nowrap', STATUS_TONE[status] || STATUS_TONE.Pending, className)}>
      {statusLabel(status)}
    </span>
  );
}

export function PriorityBadge({ className }) {
  return (
    <span className={cx('inline-flex items-center h-6 px-2 rounded-md text-xs font-semibold bg-rose-soft text-rose', className)}>
      أولوية
    </span>
  );
}

// ---------------------------------------------------------------- Ticket

/** A queue entry: stub with the place number, body with patient + actions. */
export function Ticket({ position, priority, selected, muted, stubCaption = 'الدور', children, className }) {
  return (
    <article className={cx('ticket', className)} data-priority={!!priority} data-selected={!!selected} data-muted={!!muted}>
      <div className="ticket-stub py-3">
        <span className={cx('font-display text-3xl leading-none', priority ? 'text-rose' : 'text-ink')}>{position ?? '—'}</span>
        <span className="mt-1 text-[11px] text-muted">{priority ? 'أولوية' : stubCaption}</span>
      </div>
      <div className="min-w-0 p-3">{children}</div>
    </article>
  );
}

// ------------------------------------------------------------ Page parts

export function PageHeader({ title, subtitle, actions, className }) {
  return (
    <header className={cx('flex flex-wrap items-start justify-between gap-3 mb-4', className)}>
      <div className="min-w-0">
        <h1 className="font-display text-xl sm:text-2xl text-ink leading-snug">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

/** Compact row of numbers; scrolls sideways on phones instead of stacking cards. */
export function StatStrip({ items, className }) {
  return (
    <div className={cx('flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1', className)}>
      {items.filter(Boolean).map((item) => (
        <div key={item.label} className="shrink-0 min-w-[6.5rem] rounded-xl bg-white border border-line px-3 py-2">
          <div className={cx('font-display text-2xl leading-tight', item.tone || 'text-ink')}>{item.value ?? '—'}</div>
          <div className="text-xs text-muted leading-snug">{item.label}</div>
        </div>
      ))}
    </div>
  );
}

export function SearchField({ value, onChange, placeholder = 'ابحث...', className, ...props }) {
  return (
    <label className={cx('relative block', className)}>
      <span className="sr-only">{placeholder}</span>
      <Search className="absolute top-1/2 -translate-y-1/2 start-3 w-5 h-5 text-muted pointer-events-none" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-12 rounded-xl border border-line bg-white ps-11 pe-3 text-base placeholder:text-muted focus:border-ink focus:outline-none"
        {...props}
      />
    </label>
  );
}

/** Single-choice filter as a row of chips. options: [{ value, label, count? }] */
export function ChipGroup({ value, onChange, options, label, className }) {
  return (
    <div role="radiogroup" aria-label={label} className={cx('flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4', className)}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cx(
              'shrink-0 h-10 px-4 rounded-full text-sm font-semibold border transition-colors',
              active ? 'bg-ink text-white border-ink' : 'bg-white text-ink border-line hover:bg-ink-faint'
            )}
          >
            {option.label}
            {option.count !== undefined && <span className={cx('ms-1.5', active ? 'text-white/70' : 'text-muted')}>{option.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function EmptyState({ icon: Icon = Info, title, children, action }) {
  return (
    <div className="flex flex-col items-center text-center py-12 px-6">
      <Icon className="w-10 h-10 text-line mb-3" />
      <p className="font-semibold text-ink">{title}</p>
      {children && <p className="mt-1 text-sm text-muted max-w-xs">{children}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function LoadingState({ label = 'جاري التحميل...' }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-muted" role="status">
      <Loader2 className="w-5 h-5 animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

/** Surface for grouped content. Flat: hairline border, no shadow. */
export function Panel({ title, actions, children, className, bodyClassName }) {
  return (
    <section className={cx('bg-white border border-line rounded-2xl', className)}>
      {(title || actions) && (
        <header className="flex items-center justify-between gap-2 px-4 pt-3 pb-2">
          {title && <h2 className="font-semibold text-ink">{title}</h2>}
          {actions}
        </header>
      )}
      <div className={cx('px-4 pb-4', !title && !actions && 'pt-4', bodyClassName)}>{children}</div>
    </section>
  );
}

// ----------------------------------------------------------------- Sheet

/** Bottom sheet on phones, centered dialog from sm up. Esc and backdrop close it. */
export function Sheet({ open, onClose, title, children, footer, size = 'md' }) {
  const panelRef = useRef(null);
  // Latest onClose without re-running the effect: an inline handler changes
  // every render, and re-running would steal focus from inputs while typing.
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && closeRef.current();
    document.addEventListener('keydown', onKey);
    const previous = document.activeElement;
    panelRef.current?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center" dir="rtl">
      <div className="absolute inset-0 bg-ink/40 anim-fade" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cx(
          'relative w-full bg-white rounded-t-3xl sm:rounded-3xl max-h-[88vh] flex flex-col anim-sheet outline-none safe-bottom',
          size === 'lg' ? 'sm:max-w-2xl' : 'sm:max-w-md'
        )}
      >
        <div className="sm:hidden mx-auto mt-2 h-1.5 w-10 rounded-full bg-line" aria-hidden="true" />
        <header className="flex items-center justify-between gap-2 px-5 pt-3 pb-2">
          <h2 className="font-display text-lg text-ink">{title}</h2>
          <IconButton icon={X} label="إغلاق" onClick={onClose} className="-me-2" />
        </header>
        <div className="overflow-y-auto px-5 pb-5">{children}</div>
        {footer && <footer className="border-t border-line px-5 py-3 flex gap-2">{footer}</footer>}
      </div>
    </div>
  );
}

/** A full-width row inside a sheet menu. */
export function SheetAction({ icon: Icon, children, hint, tone = 'text-ink', ...props }) {
  return (
    <button type="button" className={cx('w-full flex items-center gap-3 min-h-[3.25rem] px-3 -mx-3 rounded-xl text-start hover:bg-ink-faint disabled:opacity-50', tone)} {...props}>
      {Icon && <Icon className="w-5 h-5 shrink-0" />}
      <span className="flex-1">
        <span className="block font-semibold">{children}</span>
        {hint && <span className="block text-xs text-muted mt-0.5">{hint}</span>}
      </span>
    </button>
  );
}

// ----------------------------------------------------------------- Toast

const ToastContext = createContext(() => {});
const TOAST_STYLE = {
  success: { icon: CheckCircle2, cls: 'bg-ink text-white' },
  error: { icon: AlertTriangle, cls: 'bg-red-700 text-white' },
  info: { icon: Info, cls: 'bg-white text-ink border border-line' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const show = useCallback((text, type = 'success') => {
    if (!text) return;
    const id = Date.now() + Math.random();
    setToasts((list) => [...list.slice(-2), { id, text, type }]);
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), type === 'error' ? 6000 : 3500);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="fixed inset-x-0 bottom-20 lg:bottom-6 z-[70] flex flex-col items-center gap-2 px-4 pointer-events-none" aria-live="polite" dir="rtl">
        {toasts.map((t) => {
          const { icon: Icon, cls } = TOAST_STYLE[t.type] || TOAST_STYLE.info;
          return (
            <div key={t.id} className={cx('pointer-events-auto anim-toast flex items-start gap-2 max-w-md w-full rounded-2xl px-4 py-3 shadow-lg', cls)}>
              <Icon className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm font-medium flex-1">{t.text}</p>
              <button type="button" onClick={() => setToasts((list) => list.filter((x) => x.id !== t.id))} aria-label="إغلاق" className="opacity-70 hover:opacity-100">
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

/** toast(text, 'success' | 'error' | 'info') */
export const useToast = () => useContext(ToastContext);

// ---------------------------------------------------------------- Fields

export function Field({ label, hint, error, children, className }) {
  return (
    <label className={cx('block', className)}>
      {label && <span className="block mb-1.5 text-sm font-semibold text-ink">{label}</span>}
      {children}
      {hint && !error && <span className="block mt-1 text-xs text-muted">{hint}</span>}
      {error && <span className="block mt-1 text-xs text-red-700">{error}</span>}
    </label>
  );
}

export const inputClass =
  'w-full h-12 rounded-xl border border-line bg-white px-3 text-base text-ink placeholder:text-muted focus:border-ink focus:outline-none disabled:bg-paper';

export function TextInput({ className, invalid, ...props }) {
  return <input className={cx(inputClass, invalid && 'border-red-400', className)} {...props} />;
}

export function SelectInput({ className, children, ...props }) {
  return (
    <select className={cx(inputClass, 'appearance-none bg-[length:1rem] pe-8', className)} {...props}>
      {children}
    </select>
  );
}

export { cx };
