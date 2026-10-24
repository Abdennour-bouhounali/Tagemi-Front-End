import { API_BASE_URL } from '../../../config/environment';
import { staffHome } from '../../../utils/staffNav';
import { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppContext } from '../../../Context/AppContext';
import { Eye, EyeOff, AlertTriangle, CheckCircle2, LogIn } from 'lucide-react';
import { Button, Field, TextInput } from '../../../Components/ui';
import logo from '/tagemi_logo.png';

const apiUrl = API_BASE_URL;

/** Staff login: one centered card on the paper background. */
export default function Login() {
  const { setToken } = useContext(AppContext);
  const navigate = useNavigate();
  const [FormData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
        body: JSON.stringify(FormData),
        headers,
      });

      const data = await res.json();

      if (data.errors) {
        setErrors(data.errors);
        setIsLoading(false);
      } else {
        setSuccess(true);
        localStorage.setItem('token', data.token);
        setToken(data.token);

        setTimeout(() => {
          // Staff go straight to their working screen
          navigate(staffHome(data.user), { state: { loggedIn: true }, replace: true });
        }, 800);
      }
    } catch (error) {
      setErrors({ general: ['تعذّر الاتصال بالخادم. تأكد من اتصالك بالإنترنت ثم حاول مرة أخرى.'] });
      setIsLoading(false);
    }
  }

  const disabled = isLoading || success;
  const firstError = (key) => (Array.isArray(errors[key]) ? errors[key][0] : errors[key]);

  return (
    <div className="staff-app min-h-screen flex items-center justify-center px-4 py-10" dir="rtl">
      <div className="w-full max-w-sm">
        <div className="bg-white border border-line rounded-2xl p-6 sm:p-8">
          <div className="text-center mb-6">
            <img src={logo} alt="مؤسسة تجمي" className="h-14 w-auto mx-auto mb-4" />
            <h1 className="font-display text-2xl text-ink">دخول الفريق</h1>
            <p className="mt-1 text-sm text-muted">ادخل ببريدك الإلكتروني وكلمة المرور التي سلّمها لك المنظمون.</p>
          </div>

          {errors.general && (
            <div role="alert" className="mb-4 flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <p>{firstError('general')}</p>
            </div>
          )}
          {success && (
            <div role="status" className="mb-4 flex items-center gap-2 rounded-xl bg-st-queue-bg px-3 py-2.5 text-sm text-st-queue">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <p>تم الدخول، جاري فتح صفحتك...</p>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleLogin}>
            <Field label="البريد الإلكتروني" error={firstError('email')}>
              <TextInput
                value={FormData.email}
                onChange={(e) => setFormData({ ...FormData, email: e.target.value })}
                type="email"
                name="email"
                id="email"
                dir="ltr"
                autoComplete="email"
                inputMode="email"
                disabled={disabled}
                invalid={!!errors.email}
                placeholder="example@email.com"
                className="text-start"
                required
              />
            </Field>

            <Field label="كلمة المرور" error={firstError('password')}>
              <div className="relative">
                <TextInput
                  value={FormData.password}
                  onChange={(e) => setFormData({ ...FormData, password: e.target.value })}
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  id="password"
                  dir="ltr"
                  autoComplete="current-password"
                  disabled={disabled}
                  invalid={!!errors.password}
                  className="pe-12 text-start"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={disabled}
                  aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                  className="absolute top-0 end-0 h-12 w-12 flex items-center justify-center text-muted hover:text-ink"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </Field>

            <Button type="submit" size="lg" block icon={success ? CheckCircle2 : LogIn} loading={isLoading} disabled={disabled} className="mt-2">
              {success ? 'تم الدخول' : 'ادخل'}
            </Button>

            <div className="text-center">
              <Link to="/forgot-password" className="inline-flex items-center min-h-[44px] text-sm text-ink-soft underline-offset-4 hover:underline">
                نسيت كلمة المرور؟
              </Link>
            </div>
          </form>
        </div>

        <p className="text-center mt-6 text-xs text-muted">© 2024 مؤسسة تجمي</p>
      </div>
    </div>
  );
}
