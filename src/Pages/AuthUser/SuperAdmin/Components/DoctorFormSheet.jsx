import { API_BASE_URL } from '../../../../config/environment';
import { useContext, useEffect, useState } from 'react';
import { Copy, Download } from 'lucide-react';
import { AppContext } from '../../../../Context/AppContext';
import { Button, ChipGroup, Field, SelectInput, Sheet, TextInput, useToast } from '../../../../Components/ui';
import { CredentialRow, downloadCredentialsCsv } from './EventFormParts';
import { SECTOR_LABELS, WILAYAS } from '../../../../utils/doctors';

const apiUrl = API_BASE_URL;

const EMPTY_FORM = { first_name: '', family_name: '', phone: '', wilaya_code: '', specialty_id: '', sector: 'public' };

/** A doctor's login, shown once (after creation or a password reset). credentials: { type, name, specialty, email, password } */
export function DoctorCredentialsSheet({ credentials, onClose }) {
  const toast = useToast();
  const copy = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      toast(`نُسخ ${label}`);
    } catch {
      toast('تعذر النسخ، انسخ النص يدويًا', 'error');
    }
  };
  return (
    <Sheet
      open={!!credentials}
      onClose={onClose}
      title="بيانات دخول الطبيب"
      footer={credentials && (
        <>
          <Button variant="secondary" icon={Download} className="flex-1" onClick={() => downloadCredentialsCsv([credentials], `doctor-${credentials.email}.csv`)}>CSV</Button>
          <Button icon={Copy} className="flex-1" onClick={() => copy(`البريد: ${credentials.email}\nكلمة المرور: ${credentials.password}`, 'البيانات')}>انسخ الكل</Button>
        </>
      )}
    >
      {credentials && (
        <>
          <p className="rounded-xl bg-st-pushed-bg px-3 py-2 text-sm text-st-pushed mb-1">
            انسخ كلمة المرور الآن، لن تظهر مرة أخرى. يمكنك إنشاء كلمة جديدة لاحقًا من صفحة الأطباء.
          </p>
          <ul><CredentialRow credential={credentials} /></ul>
        </>
      )}
    </Sheet>
  );
}

export const doctorCredentials = (doctor, creds) => ({
  type: 'طبيب', name: doctor.full_name, specialty: doctor.specialty?.name || '', email: creds.email, password: creds.password,
});

/**
 * Add or edit a doctor. open: { doctor } to edit, {} to add. lockedSpecialtyId:
 * the specialty is fixed (adding from the event form). onSaved(doctor, credentials|null):
 * credentials only after a creation, for the caller to show once.
 */
export default function DoctorFormSheet({ open, onClose, specialties, lockedSpecialtyId, onSaved }) {
  const { token } = useContext(AppContext);
  const toast = useToast();
  const [values, setValues] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const editing = open?.doctor;

  useEffect(() => {
    if (!open) return;
    const d = open.doctor;
    setValues(d
      ? { first_name: d.first_name, family_name: d.family_name, phone: d.phone || '', wilaya_code: d.wilaya_code || '', specialty_id: d.specialty_id || '', sector: d.sector }
      : { ...EMPTY_FORM, specialty_id: lockedSpecialtyId || '' });
    setErrors({});
  }, [open, lockedSpecialtyId]);

  const set = (key, value) => setValues((prev) => ({ ...prev, [key]: value }));
  const err = (key) => errors[key]?.[0];

  const save = async (e) => {
    e?.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      const res = await fetch(editing ? `${apiUrl}/api/doctors/${editing.id}` : `${apiUrl}/api/doctors`, {
        method: editing ? 'PUT' : 'POST',
        body: JSON.stringify(values),
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', 'Content-Type': 'application/json' },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast(data.message || 'تم الحفظ');
        onSaved?.(data.doctor, data.credentials ? doctorCredentials(data.doctor, data.credentials) : null);
        onClose();
      } else {
        setErrors(data.errors || {});
        if (!data.errors) toast(data.message || 'تعذر حفظ الطبيب', 'error');
      }
    } catch {
      toast('تعذر الاتصال بالخادم، تحقق من الشبكة ثم أعد المحاولة', 'error');
    } finally {
      setBusy(false);
    }
  };

  const lockedName = lockedSpecialtyId && specialties.find((s) => String(s.id) === String(lockedSpecialtyId))?.name;

  return (
    <Sheet
      open={!!open}
      onClose={onClose}
      title={editing ? 'تعديل الطبيب' : 'طبيب جديد'}
      footer={<Button block size="lg" loading={busy} onClick={save}>{editing ? 'احفظ التغييرات' : 'أضف الطبيب وأنشئ حسابه'}</Button>}
    >
      <form onSubmit={save} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="الاسم" error={err('first_name')}>
            <TextInput value={values.first_name} onChange={(e) => set('first_name', e.target.value)} invalid={!!err('first_name')} autoComplete="off" />
          </Field>
          <Field label="اللقب" error={err('family_name')}>
            <TextInput value={values.family_name} onChange={(e) => set('family_name', e.target.value)} invalid={!!err('family_name')} autoComplete="off" />
          </Field>
        </div>
        <Field label="رقم الهاتف" error={err('phone')}>
          <TextInput type="tel" inputMode="tel" dir="ltr" placeholder="0555123456" value={values.phone} onChange={(e) => set('phone', e.target.value)} invalid={!!err('phone')} />
        </Field>
        <Field label="الولاية" error={err('wilaya_code')}>
          <SelectInput value={values.wilaya_code} onChange={(e) => set('wilaya_code', e.target.value)}>
            <option value="">اختر الولاية</option>
            {WILAYAS.map((w) => <option key={w.code} value={w.code}>{w.code} - {w.name}</option>)}
          </SelectInput>
        </Field>
        {lockedName ? (
          <div>
            <span className="block mb-1.5 text-sm font-semibold text-ink">التخصص</span>
            <p className="h-12 leading-[3rem] px-3 rounded-xl bg-paper text-ink">{lockedName}</p>
          </div>
        ) : (
          <Field label="التخصص" error={err('specialty_id')}>
            <SelectInput value={values.specialty_id} onChange={(e) => set('specialty_id', e.target.value)}>
              <option value="">اختر التخصص</option>
              {specialties.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </SelectInput>
          </Field>
        )}
        <fieldset>
          <legend className="block mb-1.5 text-sm font-semibold text-ink">مكان العمل</legend>
          <ChipGroup
            label="مكان العمل"
            value={values.sector}
            onChange={(v) => set('sector', v)}
            options={Object.entries(SECTOR_LABELS).map(([value, label]) => ({ value, label }))}
          />
          {err('sector') && <span className="block mt-1 text-xs text-red-700">{err('sector')}</span>}
        </fieldset>
        {!editing && <p className="text-xs text-muted">يُنشأ للطبيب حساب دخول بكلمة مرور تظهر لك مرة واحدة بعد الحفظ.</p>}
      </form>
    </Sheet>
  );
}
