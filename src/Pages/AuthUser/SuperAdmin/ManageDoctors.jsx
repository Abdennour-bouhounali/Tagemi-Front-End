import { API_BASE_URL } from '../../../config/environment';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Plus, MoreVertical, Pencil, Trash2, KeyRound, UserX, UserCheck, Copy, Download, Stethoscope } from 'lucide-react';
import { AppContext } from '../../../Context/AppContext';
import {
  Button, IconButton, PageHeader, EmptyState, LoadingState, Sheet, SheetAction, Field, TextInput, SelectInput,
  SearchField, ChipGroup, useToast, cx,
} from '../../../Components/ui';
import { ConfirmSheet, CredentialRow, downloadCredentialsCsv } from './Components/EventFormParts';
import { SECTOR_LABELS, WILAYAS, wilayaName } from '../../../utils/doctors';

const apiUrl = API_BASE_URL;

const EMPTY_FORM = { first_name: '', family_name: '', phone: '', wilaya_code: '', specialty_id: '', sector: 'public' };

// Doctors registry: identity, wilaya, specialty, sector, and a login account per doctor.
export default function ManageDoctors() {
  const { token } = useContext(AppContext);
  const toast = useToast();

  const [doctors, setDoctors] = useState(null);
  const [specialties, setSpecialties] = useState([]);
  const [query, setQuery] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('');
  const [status, setStatus] = useState('active');

  const [busy, setBusy] = useState(false);
  // Form sheet: null = closed, { id: null } = add, { id } = edit
  const [form, setForm] = useState(null);
  const [values, setValues] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [actionsFor, setActionsFor] = useState(null);
  const [confirm, setConfirm] = useState(null); // { type: 'reset' | 'delete', doctor }
  const [credentials, setCredentials] = useState(null); // { name, specialty, email, password }

  const headers = useMemo(() => ({ Authorization: `Bearer ${token}`, Accept: 'application/json' }), [token]);

  const fetchDoctors = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/api/doctors`, { headers });
      const data = await res.json();
      if (res.ok) setDoctors(data.doctors || []);
      else {
        setDoctors((prev) => prev || []);
        toast(data.message || 'تعذر تحميل الأطباء', 'error');
      }
    } catch {
      setDoctors((prev) => prev || []);
      toast('تعذر الاتصال بالخادم، تحقق من الشبكة ثم أعد المحاولة', 'error');
    }
  }, [headers, toast]);

  useEffect(() => {
    fetchDoctors();
    fetch(`${apiUrl}/api/specialty`, { headers })
      .then((res) => res.json())
      .then((data) => setSpecialties((data.specialties || []).filter((s) => s.name !== 'NoSpeciality')))
      .catch(() => toast('تعذر تحميل التخصصات', 'error'));
  }, [fetchDoctors, headers, toast]);

  const counts = useMemo(() => {
    const list = doctors || [];
    return { active: list.filter((d) => d.is_active).length, inactive: list.filter((d) => !d.is_active).length, all: list.length };
  }, [doctors]);

  const visible = useMemo(() => {
    const q = query.trim();
    return (doctors || []).filter((d) =>
      (status === 'all' || (status === 'active') === d.is_active)
      && (!specialtyFilter || String(d.specialty_id) === specialtyFilter)
      && (!q || d.full_name.includes(q) || String(d.phone).includes(q)));
  }, [doctors, query, specialtyFilter, status]);

  const openForm = (doctor) => {
    setValues(doctor
      ? { first_name: doctor.first_name, family_name: doctor.family_name, phone: doctor.phone || '', wilaya_code: doctor.wilaya_code || '', specialty_id: doctor.specialty_id || '', sector: doctor.sector }
      : EMPTY_FORM);
    setErrors({});
    setForm({ id: doctor ? doctor.id : null });
  };

  const set = (key, value) => setValues((prev) => ({ ...prev, [key]: value }));

  const showCredentials = (doctor, creds) => setCredentials({
    type: 'طبيب', name: doctor.full_name, specialty: doctor.specialty?.name || '', email: creds.email, password: creds.password,
  });

  const save = async (e) => {
    e?.preventDefault();
    setBusy(true);
    setErrors({});
    const editing = !!form?.id;
    try {
      const res = await fetch(editing ? `${apiUrl}/api/doctors/${form.id}` : `${apiUrl}/api/doctors`, {
        method: editing ? 'PUT' : 'POST',
        body: JSON.stringify(values),
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setForm(null);
        fetchDoctors();
        toast(data.message || 'تم الحفظ');
        if (data.credentials) showCredentials(data.doctor, data.credentials);
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

  const request = async (path, method) => {
    setBusy(true);
    try {
      const res = await fetch(`${apiUrl}${path}`, { method, headers });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(data.message || 'تعذر تنفيذ العملية', 'error');
        return null;
      }
      toast(data.message || 'تم');
      fetchDoctors();
      return data;
    } catch {
      toast('تعذر الاتصال بالخادم، تحقق من الشبكة ثم أعد المحاولة', 'error');
      return null;
    } finally {
      setBusy(false);
    }
  };

  const runConfirm = async () => {
    const { type, doctor } = confirm;
    if (type === 'reset') {
      const data = await request(`/api/doctors/${doctor.id}/reset-password`, 'POST');
      if (data?.credentials) showCredentials(doctor, data.credentials);
    } else {
      await request(`/api/doctors/${doctor.id}`, 'DELETE');
    }
    setConfirm(null);
  };

  const toggleActive = async (doctor) => {
    setActionsFor(null);
    await request(`/api/doctors/${doctor.id}/active`, 'PATCH');
  };

  const copy = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      toast(`نُسخ ${label}`);
    } catch {
      toast('تعذر النسخ، انسخ النص يدويًا', 'error');
    }
  };

  const err = (key) => errors[key]?.[0];

  return (
    <div className="max-w-2xl lg:max-w-none mx-auto">
      <PageHeader
        title="الأطباء"
        subtitle={doctors ? `${counts.active} طبيب نشط` : undefined}
        actions={<Button icon={Plus} onClick={() => openForm(null)}>أضف طبيبًا</Button>}
      />

      {doctors === null ? (
        <LoadingState />
      ) : doctors.length === 0 ? (
        <EmptyState icon={Stethoscope} title="لا يوجد أطباء بعد" action={<Button icon={Plus} onClick={() => openForm(null)}>أضف أول طبيب</Button>}>
          سجّل الأطباء هنا ثم اخترهم عند إنشاء الأحداث.
        </EmptyState>
      ) : (
        <>
          <div className="space-y-3 mb-3 lg:flex lg:items-center lg:gap-3 lg:space-y-0">
            <SearchField value={query} onChange={setQuery} placeholder="ابحث بالاسم أو الهاتف" className="lg:flex-1" />
            <SelectInput value={specialtyFilter} onChange={(e) => setSpecialtyFilter(e.target.value)} className="lg:w-64" aria-label="التخصص">
              <option value="">كل التخصصات</option>
              {specialties.map((s) => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
            </SelectInput>
          </div>
          <ChipGroup
            label="الحالة"
            value={status}
            onChange={setStatus}
            className="mb-3"
            options={[
              { value: 'active', label: 'نشط', count: counts.active },
              { value: 'inactive', label: 'موقوف', count: counts.inactive },
              { value: 'all', label: 'الكل', count: counts.all },
            ]}
          />

          {visible.length === 0 ? (
            <p className="text-sm text-muted py-8 text-center">لا يوجد طبيب يطابق البحث.</p>
          ) : (
            <ul className="bg-white border border-line rounded-2xl divide-y divide-line lg:grid lg:grid-cols-2 2xl:grid-cols-3 lg:gap-3 lg:bg-transparent lg:border-0 lg:rounded-none lg:divide-y-0">
              {visible.map((d) => (
                <li key={d.id} className="flex items-center gap-3 ps-4 pe-2 py-3 min-h-[4rem] lg:bg-white lg:border lg:border-line lg:rounded-2xl">
                  <div className={cx('flex-1 min-w-0', !d.is_active && 'opacity-60')}>
                    <p className="font-semibold text-ink truncate">
                      {d.full_name}
                      {!d.is_active && <span className="ms-2 text-xs font-normal text-st-pushed">موقوف</span>}
                    </p>
                    <p className="text-xs text-muted mt-0.5 truncate">
                      {[d.specialty?.name, wilayaName(d.wilaya_code), SECTOR_LABELS[d.sector]].filter(Boolean).join(' · ')}
                    </p>
                    <p className="text-xs text-muted mt-0.5 tabular-nums text-end" dir="ltr">{d.phone}</p>
                  </div>
                  <IconButton icon={MoreVertical} label={`خيارات ${d.full_name}`} onClick={() => setActionsFor(d)} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {/* Row menu */}
      <Sheet open={!!actionsFor} onClose={() => setActionsFor(null)} title={actionsFor?.full_name || 'الطبيب'}>
        {actionsFor && (
          <>
            <div className="mb-2">
              <p className="text-xs text-muted mb-1">البريد للدخول</p>
              {actionsFor.user ? (
                <div className="flex items-center gap-1">
                  <span className="flex-1 min-w-0 truncate rounded-lg bg-paper px-2 h-9 leading-9 text-sm" dir="ltr">{actionsFor.user.email}</span>
                  <IconButton icon={Copy} label="انسخ البريد" onClick={() => copy(actionsFor.user.email, 'البريد')} />
                </div>
              ) : (
                <p className="text-sm text-muted">لا يوجد حساب، أنشئ كلمة مرور لإنشائه.</p>
              )}
            </div>
            <div className="divide-y divide-line">
              <SheetAction icon={Pencil} onClick={() => { openForm(actionsFor); setActionsFor(null); }}>عدّل البيانات</SheetAction>
              <SheetAction icon={KeyRound} hint="تظهر مرة واحدة، ويُسجَّل خروجه من كل الأجهزة" onClick={() => { setConfirm({ type: 'reset', doctor: actionsFor }); setActionsFor(null); }}>
                كلمة مرور جديدة
              </SheetAction>
              {actionsFor.is_active ? (
                <SheetAction icon={UserX} hint="لا يظهر في الأحداث ولا يستطيع الدخول" onClick={() => toggleActive(actionsFor)}>أوقف الطبيب</SheetAction>
              ) : (
                <SheetAction icon={UserCheck} onClick={() => toggleActive(actionsFor)}>فعّل الطبيب</SheetAction>
              )}
              <SheetAction icon={Trash2} tone="text-red-700" hint="فقط إن لم يُبرمج في أي حدث" onClick={() => { setConfirm({ type: 'delete', doctor: actionsFor }); setActionsFor(null); }}>
                احذف الطبيب
              </SheetAction>
            </div>
          </>
        )}
      </Sheet>

      {/* Add / edit */}
      <Sheet
        open={!!form}
        onClose={() => setForm(null)}
        title={form?.id ? 'تعديل الطبيب' : 'طبيب جديد'}
        footer={<Button block size="lg" loading={busy} onClick={save}>{form?.id ? 'احفظ التغييرات' : 'أضف الطبيب وأنشئ حسابه'}</Button>}
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
          <Field label="التخصص" error={err('specialty_id')}>
            <SelectInput value={values.specialty_id} onChange={(e) => set('specialty_id', e.target.value)}>
              <option value="">اختر التخصص</option>
              {specialties.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </SelectInput>
          </Field>
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
          {!form?.id && <p className="text-xs text-muted">يُنشأ للطبيب حساب دخول بكلمة مرور تظهر لك مرة واحدة بعد الحفظ.</p>}
        </form>
      </Sheet>

      <ConfirmSheet
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={confirm?.type === 'reset' ? 'كلمة مرور جديدة؟' : 'حذف الطبيب؟'}
        confirmLabel={confirm?.type === 'reset' ? 'أنشئ كلمة مرور' : 'احذف'}
        danger={confirm?.type !== 'reset'}
        loading={busy}
        onConfirm={runConfirm}
      >
        {confirm?.type === 'reset' ? (
          <p>ستتوقف كلمة المرور الحالية لـ«{confirm?.doctor.full_name}» ويُسجَّل خروجه من كل الأجهزة.</p>
        ) : (
          <p>سيُحذف «{confirm?.doctor.full_name}» وحسابه. إن كان مبرمجًا في حدث فلن يُحذف، أوقفه بدلاً من ذلك.</p>
        )}
      </ConfirmSheet>

      {/* Credentials, shown once */}
      <Sheet
        open={!!credentials}
        onClose={() => setCredentials(null)}
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
              انسخ كلمة المرور الآن، لن تظهر مرة أخرى. يمكنك إنشاء كلمة جديدة لاحقًا.
            </p>
            <ul><CredentialRow credential={credentials} /></ul>
          </>
        )}
      </Sheet>
    </div>
  );
}
