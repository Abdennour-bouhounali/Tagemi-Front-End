import { useContext, useState } from 'react';
import { LogOut, UserRound } from 'lucide-react';
import { AppContext } from '../../../Context/AppContext';
import { API_BASE_URL } from '../../../config/environment';
import { Button, Field, TextInput } from '../../../Components/ui';
import { cleanName, initialNameParts, validateArabicNames } from '../../../utils/arabicName';

const apiUrl = API_BASE_URL;

/**
 * Shown instead of the app while the signed-in account has no Arabic first
 * and family name (old accounts with a French name or a first name only).
 */
export default function NameRequired() {
  const { user, setUser, token, setToken } = useContext(AppContext);
  const [form, setForm] = useState(() => initialNameParts(user));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    const local = validateArabicNames(form);
    setErrors(local);
    setMessage('');
    if (Object.keys(local).length) return;

    setSaving(true);
    try {
      const res = await fetch(`${apiUrl}/api/user/name`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ first_name: cleanName(form.first_name), family_name: cleanName(form.family_name) }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setUser((prev) => ({ ...prev, ...data.user, needs_name_update: false }));
        return;
      }
      if (data.errors) {
        setErrors(Object.fromEntries(Object.entries(data.errors).map(([k, v]) => [k, v[0]])));
      } else {
        setMessage(data.message || 'تعذر حفظ الاسم، أعد المحاولة');
      }
    } catch {
      setMessage('تعذر الاتصال، تحقق من الشبكة ثم أعد المحاولة');
    } finally {
      setSaving(false);
    }
  };

  const logout = async () => {
    try {
      await fetch(`${apiUrl}/api/logout`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } });
    } catch {
      // Logging out locally is enough if the network is down
    }
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
  };

  return (
    <div dir="rtl" className="min-h-screen bg-paper font-ui text-ink flex items-center justify-center p-4">
      <form onSubmit={submit} noValidate className="w-full max-w-md bg-white border border-line rounded-3xl p-6 space-y-5">
        <div className="flex items-center gap-3">
          <span className="w-12 h-12 shrink-0 grid place-items-center rounded-2xl bg-ink-faint text-ink"><UserRound className="w-6 h-6" /></span>
          <div>
            <h1 className="font-display text-xl text-ink">أكمل اسمك بالعربية</h1>
            <p className="text-sm text-muted">{user?.name ? `الاسم الحالي: ${user.name}` : 'حسابك بلا اسم'}</p>
          </div>
        </div>
        <p className="text-sm text-ink">
          نحتاج اسمك ولقبك مكتوبين بالحروف العربية قبل متابعة استعمال التطبيق.
        </p>

        <Field label="الاسم" error={errors.first_name}>
          <TextInput
            value={form.first_name}
            onChange={(e) => setForm({ ...form, first_name: e.target.value })}
            invalid={!!errors.first_name}
            placeholder="مثال: محمد"
            autoComplete="given-name"
            dir="rtl"
            autoFocus
          />
        </Field>
        <Field label="اللقب" error={errors.family_name}>
          <TextInput
            value={form.family_name}
            onChange={(e) => setForm({ ...form, family_name: e.target.value })}
            invalid={!!errors.family_name}
            placeholder="مثال: بن علي"
            autoComplete="family-name"
            dir="rtl"
          />
        </Field>

        {message && <p className="text-sm text-red-700">{message}</p>}

        <Button type="submit" block size="lg" loading={saving}>احفظ وتابع</Button>
        <Button variant="ghost" block icon={LogOut} onClick={logout}>تسجيل الخروج</Button>
      </form>
    </div>
  );
}
