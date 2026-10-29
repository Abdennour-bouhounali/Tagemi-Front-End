import { API_BASE_URL } from '../../../config/environment';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Plus, MoreVertical, Pencil, Trash2, KeyRound, UserX, UserCheck, Copy, Stethoscope, History } from 'lucide-react';
import { AppContext } from '../../../Context/AppContext';
import {
  Button, IconButton, PageHeader, EmptyState, LoadingState, Sheet, SheetAction, SelectInput,
  SearchField, ChipGroup, useToast, cx,
} from '../../../Components/ui';
import { ConfirmSheet } from './Components/EventFormParts';
import DoctorFormSheet, { DoctorCredentialsSheet, doctorCredentials } from './Components/DoctorFormSheet';
import DoctorHistorySheet from './Components/DoctorHistorySheet';
import { SECTOR_LABELS, wilayaName } from '../../../utils/doctors';

const apiUrl = API_BASE_URL;

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
  const [form, setForm] = useState(null); // null = closed, {} = add, { doctor } = edit
  const [actionsFor, setActionsFor] = useState(null);
  const [confirm, setConfirm] = useState(null); // { type: 'reset' | 'delete', doctor }
  const [credentials, setCredentials] = useState(null);
  const [historyFor, setHistoryFor] = useState(null);

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
      if (data?.credentials) setCredentials(doctorCredentials(doctor, data.credentials));
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

  return (
    <div className="max-w-2xl lg:max-w-none mx-auto">
      <PageHeader
        title="الأطباء"
        subtitle={doctors ? `${counts.active} طبيب نشط` : undefined}
        actions={<Button icon={Plus} onClick={() => setForm({})}>أضف طبيبًا</Button>}
      />

      {doctors === null ? (
        <LoadingState />
      ) : doctors.length === 0 ? (
        <EmptyState icon={Stethoscope} title="لا يوجد أطباء بعد" action={<Button icon={Plus} onClick={() => setForm({})}>أضف أول طبيب</Button>}>
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
              <SheetAction icon={History} hint="الأحداث التي شارك فيها، فتراته، ووقت وصوله ومغادرته" onClick={() => { setHistoryFor(actionsFor); setActionsFor(null); }}>
                سجل المشاركات
              </SheetAction>
              <SheetAction icon={Pencil} onClick={() => { setForm({ doctor: actionsFor }); setActionsFor(null); }}>عدّل البيانات</SheetAction>
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

      <DoctorFormSheet
        open={form}
        onClose={() => setForm(null)}
        specialties={specialties}
        onSaved={(_, creds) => { fetchDoctors(); if (creds) setCredentials(creds); }}
      />

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

      <DoctorCredentialsSheet credentials={credentials} onClose={() => setCredentials(null)} />
      <DoctorHistorySheet doctor={historyFor} onClose={() => setHistoryFor(null)} />
    </div>
  );
}
