import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppContext } from "../../../Context/AppContext";
import { API_BASE_URL } from '../../../config/environment';
import { cleanName, validateArabicNames } from '../../../utils/arabicName';
import { CheckCircle2, LockKeyhole, Mail, Phone, User, UserPlus } from 'lucide-react';
import { Button, cx } from '../../../Components/ui';
import { AuthAlert, AuthField, AuthLayout, firstError } from './AuthLayout';

const apiUrl = API_BASE_URL;
const MIN_PASSWORD = 8; // same rule as the API

/** Password strength shown under the field: length and variety, 0..3. */
function strength(password) {
  if (!password) return 0;
  if (password.length < MIN_PASSWORD) return 1;
  const kinds = [/[a-z]/i, /\d/, /[^a-z\d]/i].filter((re) => re.test(password)).length;
  return kinds >= 2 && password.length >= 10 ? 3 : 2;
}
const STRENGTH = [
  null,
  { label: `قصيرة: ${MIN_PASSWORD} أحرف على الأقل`, bar: 'bg-red-500', text: 'text-red-700' },
  { label: 'مقبولة', bar: 'bg-st-pushed', text: 'text-st-pushed' },
  { label: 'قوية', bar: 'bg-st-queue', text: 'text-st-queue' },
];

export default function Register() {
  const { setToken } = useContext(AppContext);
  const navigate = useNavigate();
  const [FormData, setFormData] = useState({
    first_name: '',
    family_name: '',
    phone: '',
    email: '',
    password: '',
    password_confirmation: ''
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Checked before sending; the API checks the same
  function clientErrors() {
    const found = { ...validateArabicNames(FormData) };
    if (FormData.password.length < MIN_PASSWORD) found.password = `كلمة المرور ${MIN_PASSWORD} أحرف على الأقل`;
    if (FormData.password_confirmation !== FormData.password) found.password_confirmation = 'كلمتا المرور غير متطابقتين';
    return found;
  }

  async function handleRegister(e) {
    e.preventDefault();
    const found = clientErrors();
    if (Object.keys(found).length) {
      setErrors(Object.fromEntries(Object.entries(found).map(([k, v]) => [k, [v]])));
      return;
    }
    setIsLoading(true);
    setErrors({});

    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('Accept', 'application/json');

    try {
      const res = await fetch(`${apiUrl}/api/register`, {
        method: "post",
        body: JSON.stringify({
          ...FormData,
          email: FormData.email.trim(),
          phone: FormData.phone.trim(),
          first_name: cleanName(FormData.first_name),
          family_name: cleanName(FormData.family_name),
        }),
        headers
      });

      const data = await res.json();

      if (data.errors) {
        setErrors(data.errors);
        setIsLoading(false);
      } else if (!res.ok || !data.token) {
        setErrors({ general: [data.message || 'تعذّر إنشاء الحساب، حاول مرة أخرى.'] });
        setIsLoading(false);
      } else {
        setSuccess(true);
        localStorage.setItem('token', data.token);
        setToken(data.token);

        setTimeout(() => {
          navigate("/home", { state: { loggedIn: true }, replace: true });
        }, 600);
      }
    } catch {
      setErrors({ general: ['تعذّر الاتصال بالخادم. تأكد من اتصالك بالإنترنت ثم حاول مرة أخرى.'] });
      setIsLoading(false);
    }
  }

  const disabled = isLoading || success;
  // Typing in a field clears its error
  const set = (key) => (e) => {
    setFormData({ ...FormData, [key]: e.target.value });
    if (errors[key]) setErrors({ ...errors, [key]: undefined });
  };
  const level = strength(FormData.password);
  const mismatch = FormData.password_confirmation && FormData.password_confirmation !== FormData.password;

  return (
    <AuthLayout
      title="إنشاء حساب جديد"
      subtitle="انضم إلى فريق المتطوعين. بعد التسجيل يحدد لك المنظمون دورك في الحدث."
      footer={(
        <>
          لديك حساب بالفعل؟{' '}
          <Link to="/login" className="font-semibold text-ink underline-offset-4 hover:underline">ادخل</Link>
        </>
      )}
    >
      <AuthAlert>{firstError(errors, 'general')}</AuthAlert>
      {success && <AuthAlert tone="success">تم إنشاء الحساب، جاري التحويل...</AuthAlert>}

      <form className="space-y-4" onSubmit={handleRegister} noValidate>
        <fieldset className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <legend className="sr-only">الاسم الكامل بالعربية</legend>
          <AuthField
            label="الاسم"
            icon={User}
            name="first_name"
            autoComplete="given-name"
            enterKeyHint="next"
            autoFocus
            placeholder="مثال: محمد"
            value={FormData.first_name}
            onChange={set('first_name')}
            disabled={disabled}
            error={firstError(errors, 'first_name')}
            required
          />
          <AuthField
            label="اللقب"
            icon={User}
            name="family_name"
            autoComplete="family-name"
            enterKeyHint="next"
            placeholder="مثال: بن علي"
            value={FormData.family_name}
            onChange={set('family_name')}
            disabled={disabled}
            error={firstError(errors, 'family_name')}
            required
          />
          <p className="sm:col-span-2 -mt-2 text-xs text-muted">الاسم واللقب بالحروف العربية كما في بطاقة التعريف.</p>
        </fieldset>

        <AuthField
          label="رقم الهاتف"
          icon={Phone}
          ltr
          type="tel"
          name="phone"
          autoComplete="tel"
          inputMode="tel"
          enterKeyHint="next"
          placeholder="0555 12 34 56"
          value={FormData.phone}
          onChange={set('phone')}
          disabled={disabled}
          error={firstError(errors, 'phone')}
          required
        />

        <AuthField
          label="البريد الإلكتروني"
          icon={Mail}
          ltr
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          enterKeyHint="next"
          placeholder="example@email.com"
          hint="تدخل به إلى حسابك"
          value={FormData.email}
          onChange={set('email')}
          disabled={disabled}
          error={firstError(errors, 'email')}
          required
        />

        <div>
          <AuthField
            label="كلمة المرور"
            icon={LockKeyhole}
            ltr
            password
            name="password"
            autoComplete="new-password"
            enterKeyHint="next"
            value={FormData.password}
            onChange={set('password')}
            disabled={disabled}
            error={firstError(errors, 'password')}
            required
          />
          {level > 0 && !errors.password && (
            <div className="mt-2 flex items-center gap-3" aria-live="polite">
              <div className="flex-1 grid grid-cols-3 gap-1" aria-hidden="true">
                {[1, 2, 3].map((i) => (
                  <span key={i} className={cx('h-1.5 rounded-full', i <= level ? STRENGTH[level].bar : 'bg-line')} />
                ))}
              </div>
              <span className={cx('text-xs font-semibold shrink-0', STRENGTH[level].text)}>{STRENGTH[level].label}</span>
            </div>
          )}
        </div>

        <AuthField
          label="تأكيد كلمة المرور"
          icon={LockKeyhole}
          ltr
          password
          name="password_confirmation"
          autoComplete="new-password"
          enterKeyHint="done"
          value={FormData.password_confirmation}
          onChange={set('password_confirmation')}
          disabled={disabled}
          error={firstError(errors, 'password_confirmation') || (mismatch ? 'كلمتا المرور غير متطابقتين' : undefined)}
          required
        />

        <Button type="submit" size="lg" block icon={success ? CheckCircle2 : UserPlus} loading={isLoading} disabled={disabled} className="!mt-6">
          {success ? 'تم إنشاء الحساب' : isLoading ? 'جاري إنشاء الحساب...' : 'أنشئ الحساب'}
        </Button>
      </form>
    </AuthLayout>
  );
}
