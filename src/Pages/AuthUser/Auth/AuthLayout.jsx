import { useId, useState } from 'react';
import { AlertTriangle, CheckCircle2, Eye, EyeOff, HeartHandshake, ShieldCheck, Stethoscope } from 'lucide-react';
import { cx } from '../../../Components/ui';
import logo from '/tagemi_logo.png';

// Login / register pages. Arabic, right to left: every position below uses
// logical sides (start/end, ps/pe) so the layout mirrors on its own.

const POINTS = [
  { icon: Stethoscope, text: 'قوافل طبية تطوعية تصل إلى المرضى أينما كانوا' },
  { icon: HeartHandshake, text: 'فريق واحد: الاستقبال، التخصصات، الأطباء والتنظيم' },
  { icon: ShieldCheck, text: 'بيانات الزوار محمية ولا يراها إلا من يحتاجها' },
];

/** Brand panel beside the form on large screens, a compact band above it on phones. */
export function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div dir="rtl" lang="ar" className="staff-app min-h-screen lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      {/* Brand */}
      <aside className="relative overflow-hidden bg-ink text-white px-6 pt-10 pb-20 lg:pb-10 lg:px-12 lg:flex lg:flex-col lg:justify-between">
        <div aria-hidden="true" className="absolute -top-24 -end-24 w-72 h-72 rounded-full border-[40px] border-white/5" />
        <div aria-hidden="true" className="absolute -bottom-32 -start-20 w-80 h-80 rounded-full border-[48px] border-rose/10" />

        <div className="relative flex items-center gap-3 lg:gap-4">
          <span className="grid place-items-center w-14 h-14 lg:w-16 lg:h-16 rounded-2xl bg-white shrink-0">
            <img src={logo} alt="" className="w-10 h-10 lg:w-12 lg:h-12 object-contain" />
          </span>
          <div className="min-w-0">
            <p className="font-display text-xl lg:text-2xl leading-tight">مؤسسة تجمي</p>
            <p className="text-sm text-white/70">فضاء الفريق والمتطوعين</p>
          </div>
        </div>

        <div className="relative hidden lg:block max-w-md">
          <p className="font-display text-3xl xl:text-4xl leading-snug">
            كل زائر يُستقبل، يُوجَّه، ويُفحص في وقته.
          </p>
          <ul className="mt-8 space-y-4">
            {POINTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-white/85">
                <span className="grid place-items-center w-9 h-9 rounded-xl bg-white/10 shrink-0">
                  <Icon className="w-5 h-5" />
                </span>
                <span className="pt-1.5 leading-relaxed">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative hidden lg:block text-xs text-white/50">© {new Date().getFullYear()} مؤسسة تجمي</p>
      </aside>

      {/* Form */}
      <main className="relative -mt-12 lg:mt-0 px-4 pb-10 lg:px-12 lg:py-10 flex justify-center lg:items-center">
        <div className="w-full max-w-md">
          <div className="bg-white border border-line rounded-3xl p-6 sm:p-8">
            <header className="mb-6">
              <h1 className="font-display text-2xl sm:text-3xl text-ink">{title}</h1>
              {subtitle && <p className="mt-1.5 text-sm text-muted leading-relaxed">{subtitle}</p>}
            </header>
            {children}
          </div>
          {footer && <div className="mt-5 text-center text-sm text-muted">{footer}</div>}
          <p className="mt-6 text-center text-xs text-muted lg:hidden">© {new Date().getFullYear()} مؤسسة تجمي</p>
        </div>
      </main>
    </div>
  );
}

/** Error or success line above the form, read out by screen readers. */
export function AuthAlert({ tone = 'error', children }) {
  if (!children) return null;
  const error = tone === 'error';
  const Icon = error ? AlertTriangle : CheckCircle2;
  return (
    <div
      role={error ? 'alert' : 'status'}
      className={cx(
        'mb-5 flex items-start gap-2.5 rounded-2xl px-4 py-3 text-sm',
        error ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-st-queue-bg text-st-queue'
      )}
    >
      <Icon className="w-5 h-5 shrink-0 mt-px" />
      <p className="leading-relaxed">{children}</p>
    </div>
  );
}

/**
 * Labelled input with a leading icon. The box is a flex row in the page
 * direction (icon at the start, eye toggle at the end), so the input itself
 * may be left to right (email, phone, password) without breaking the layout:
 * that text stays aligned with the Arabic labels.
 */
export function AuthField({
  label, icon: Icon, error, hint, ltr, password, className, onKeyUp, ...props
}) {
  const id = useId();
  const [shown, setShown] = useState(false);
  const [caps, setCaps] = useState(false);
  const describedBy = error || hint || caps ? `${id}-note` : undefined;

  return (
    <div className={className}>
      <label htmlFor={id} className="block mb-1.5 text-sm font-semibold text-ink">{label}</label>
      <div
        className={cx(
          'flex items-center h-12 rounded-xl border bg-white transition-colors',
          'focus-within:border-ink focus-within:ring-4 focus-within:ring-ink/10',
          error ? 'border-red-400' : 'border-line',
          props.disabled && 'bg-paper'
        )}
      >
        {Icon && <Icon aria-hidden="true" className="w-5 h-5 ms-3.5 shrink-0 text-muted" />}
        <input
          id={id}
          {...props}
          type={password ? (shown ? 'text' : 'password') : props.type}
          dir={ltr ? 'ltr' : 'rtl'}
          // Left-to-right text still sits on the label side. The box shows the
          // focus ring, so the app-wide :focus-visible outline is off here.
          style={{ outline: 'none', ...(ltr ? { textAlign: 'right' } : {}) }}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          onKeyUp={(e) => {
            if (password && e.getModifierState) setCaps(e.getModifierState('CapsLock'));
            onKeyUp?.(e);
          }}
          className="flex-1 min-w-0 h-full bg-transparent px-3 text-base text-ink placeholder:text-muted/70 focus:outline-none disabled:cursor-not-allowed"
        />
        {password && (
          <button
            type="button"
            onClick={() => setShown((v) => !v)}
            disabled={props.disabled}
            aria-label={shown ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
            aria-pressed={shown}
            className="grid place-items-center w-12 h-full shrink-0 rounded-e-xl text-muted hover:text-ink"
          >
            {shown ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}
      </div>
      {(error || hint || caps) && (
        <p id={`${id}-note`} className={cx('mt-1.5 text-xs leading-relaxed', error ? 'text-red-700' : 'text-muted')}>
          {error || (caps ? 'زر الأحرف الكبيرة (Caps Lock) مفعّل' : hint)}
        </p>
      )}
    </div>
  );
}

/** First message of a Laravel validation error (array or string). */
export const firstError = (errors, key) => (Array.isArray(errors?.[key]) ? errors[key][0] : errors?.[key]);
