import { API_BASE_URL } from '../../../config/environment';
import { staffHome } from '../../../utils/staffNav';
import { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppContext } from '../../../Context/AppContext';
import { CheckCircle2, LockKeyhole, LogIn, Mail } from 'lucide-react';
import { Button } from '../../../Components/ui';
import { AuthAlert, AuthField, AuthLayout, firstError } from './AuthLayout';

const apiUrl = API_BASE_URL;

/** Staff login. */
export default function Login() {
  const { setToken } = useContext(AppContext);
  const navigate = useNavigate();
  const [FormData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('Accept', 'application/json');
    headers.append('Access-Control-Allow-Origin', 'https://tagemi-foundation.org');
    headers.append('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');

    try {
      const res = await fetch(`${apiUrl}/api/login`, {
        method: 'post',
        body: JSON.stringify({ ...FormData, email: FormData.email.trim() }),
        headers,
      });

      const data = await res.json();

      if (data.errors) {
        setErrors(data.errors);
        setIsLoading(false);
      } else if (!res.ok || !data.token) {
        // Too many attempts (429) and other refusals come without `errors`
        setErrors({ general: [data.message || 'تعذّر الدخول، حاول مرة أخرى بعد قليل.'] });
        setIsLoading(false);
      } else {
        setSuccess(true);
        localStorage.setItem('token', data.token);
        setToken(data.token);

        setTimeout(() => {
          // Staff go straight to their working screen
          navigate(staffHome(data.user), { state: { loggedIn: true }, replace: true });
        }, 600);
      }
    } catch {
      setErrors({ general: ['تعذّر الاتصال بالخادم. تأكد من اتصالك بالإنترنت ثم حاول مرة أخرى.'] });
      setIsLoading(false);
    }
  }

  const disabled = isLoading || success;
  const set = (key) => (e) => setFormData({ ...FormData, [key]: e.target.value });

  return (
    <AuthLayout
      title="مرحباً بعودتك"
      subtitle="ادخل ببريدك الإلكتروني وكلمة المرور التي سلّمها لك المنظمون."
      footer={(
        <>
          ليس لديك حساب؟{' '}
          <Link to="/register" className="font-semibold text-ink underline-offset-4 hover:underline">أنشئ حساباً</Link>
        </>
      )}
    >
      <AuthAlert>{firstError(errors, 'general')}</AuthAlert>
      {success && <AuthAlert tone="success">تم الدخول، جاري فتح صفحتك...</AuthAlert>}

      <form className="space-y-4" onSubmit={handleLogin} noValidate>
        <AuthField
          label="البريد الإلكتروني"
          icon={Mail}
          ltr
          type="email"
          name="email"
          autoComplete="username"
          inputMode="email"
          enterKeyHint="next"
          autoFocus
          placeholder="example@email.com"
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
            autoComplete="current-password"
            enterKeyHint="go"
            value={FormData.password}
            onChange={set('password')}
            disabled={disabled}
            error={firstError(errors, 'password')}
            required
          />
          <details className="mt-2 text-sm text-ink-soft">
            <summary className="inline-flex items-center min-h-[44px] cursor-pointer underline-offset-4 hover:underline">نسيت كلمة المرور؟</summary>
            <p className="text-xs text-muted leading-relaxed">اطلب من المدير العام للحدث إعادة تعيين كلمة مرورك، ثم ادخل بالكلمة الجديدة.</p>
          </details>
        </div>

        <Button
          type="submit"
          size="lg"
          block
          icon={success ? CheckCircle2 : LogIn}
          loading={isLoading}
          disabled={disabled || !FormData.email.trim() || !FormData.password}
        >
          {success ? 'تم الدخول' : isLoading ? 'جاري الدخول...' : 'ادخل'}
        </Button>
      </form>
    </AuthLayout>
  );
}
