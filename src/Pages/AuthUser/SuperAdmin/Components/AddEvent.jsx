import { API_BASE_URL } from '../../../../config/environment';
import { useState, useContext, useEffect, useRef } from 'react';
import { ChevronRight, Download, CheckCircle2 } from 'lucide-react';
import { AppContext } from '../../../../Context/AppContext';
import { Button, PageHeader, LoadingState, useToast } from '../../../../Components/ui';
import {
  Stepper, FormActionBar, EventInfoFields, validateEventInfo, validateSpecialties,
  SpecialtiesEditor, RulesPicker, EventReview, CredentialRow, downloadCredentialsCsv,
} from './EventFormParts';
import { newIdempotencyKey } from '../../../../utils/idempotency';

const apiUrl = API_BASE_URL;

const EMPTY_FORM = {
  name: '',
  date: '',
  state: '',
  nbr_of_allowed_specialties: 1,
  city: '',
  description: '',
  rules_ids: [],
  is_active: true,
  is_tawat: true,
  is_simulation: false,
};

/** New event as a 3-step form; each specialty is planned with its doctors' intervals. */
export default function AddEvent({ getEvents, onClose }) {
  const { token } = useContext(AppContext);
  const toast = useToast();

  const [form, setForm] = useState(EMPTY_FORM);
  const [eventSpecialties, setEventSpecialties] = useState([]);
  const [selectedRules, setSelectedRules] = useState([]);

  const [specialties, setSpecialties] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [busy, setBusy] = useState([]); // doctors' dates in other events
  const [rules, setRules] = useState([]);

  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const submittingRef = useRef(false);
  const submissionKey = useRef(newIdempotencyKey());
  const [dataLoading, setDataLoading] = useState(true);
  const [credentials, setCredentials] = useState(null);

  useEffect(() => {
    const get = async (path, pick, label) => {
      try {
        const res = await fetch(`${apiUrl}${path}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error();
        return pick(await res.json());
      } catch {
        toast(`تعذر تحميل ${label}، أعد فتح النموذج`, 'error');
        return [];
      }
    };
    (async () => {
      setDataLoading(true);
      const [s, d, r, b] = await Promise.all([
        get('/api/specialty', (data) => data.specialties || [], 'التخصصات'),
        get('/api/doctors', (data) => data.doctors || [], 'الأطباء'),
        get('/api/rules', (data) => data || [], 'الضوابط'),
        get('/api/doctors/busy-dates', (data) => data.busy || [], 'مواعيد الأطباء'),
      ]);
      setSpecialties(s);
      setDoctors(d);
      setRules(r);
      setBusy(b);
      setDataLoading(false);
    })();
  }, [token, toast]);

  const specialtyName = (id) => specialties.find((s) => String(s.id) === String(id))?.name;
  const doctorName = (id) => doctors.find((d) => d.id === id)?.full_name || `#${id}`;

  const toggleRule = (id) => setSelectedRules((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const goNext = () => {
    if (step === 0) {
      const e = validateEventInfo(form);
      setErrors(e);
      if (Object.keys(e).length) {
        toast('أكمل الحقول المطلوبة', 'error');
        return;
      }
    }
    if (step === 1) {
      const msg = validateSpecialties(eventSpecialties, specialtyName, doctorName);
      if (msg) {
        toast(msg, 'error');
        return;
      }
    }
    setStep((s) => s + 1);
    window.scrollTo({ top: 0 });
  };

  const handleSubmit = async () => {
    const infoErrors = validateEventInfo(form);
    if (Object.keys(infoErrors).length) {
      setErrors(infoErrors);
      setStep(0);
      toast('أكمل معلومات الحدث', 'error');
      return;
    }
    const msg = validateSpecialties(eventSpecialties, specialtyName, doctorName);
    if (msg) {
      setStep(1);
      toast(msg, 'error');
      return;
    }

    // A second tap before the button re-renders must not create the event twice
    if (submittingRef.current) return;
    submittingRef.current = true;
    setLoading(true);
    const payload = {
      ...form,
      rules_ids: selectedRules,
      specialties: eventSpecialties,
    };

    try {
      const res = await fetch(`${apiUrl}/api/events`, {
        method: 'POST',
        // Same key while retrying after a lost answer: the server creates once
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'Idempotency-Key': submissionKey.current },
        body: JSON.stringify(payload),
      });
      submissionKey.current = newIdempotencyKey();
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast(data.message || 'أُنشئ الحدث');
        if (getEvents) await getEvents();
        if (data.credentials) {
          setCredentials(data.credentials);
          window.scrollTo({ top: 0 });
        } else {
          onClose?.();
        }
      } else {
        toast(data.message || 'تعذر إنشاء الحدث، راجع البيانات وأعد المحاولة', 'error');
      }
    } catch {
      toast('تعذر الاتصال بالخادم، تحقق من الشبكة وأعد المحاولة', 'error');
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  // After creation: the three generated accounts, shown once
  if (credentials) {
    const list = [credentials.special_admin, credentials.recipient_admin, credentials.check_admin].filter(Boolean);
    return (
      <div className="max-w-2xl lg:max-w-none mx-auto">
        <PageHeader title="أُنشئ الحدث" subtitle={form.name || undefined} />
        <section className="bg-white border border-line rounded-2xl p-4">
          <div className="flex items-start gap-3 mb-2">
            <CheckCircle2 className="w-6 h-6 text-st-queue shrink-0" />
            <p className="text-sm text-ink">
              هذه حسابات فريق الحدث. لن تظهر كلمات المرور مرة أخرى، فحمّل الملف أو انسخها الآن.
            </p>
          </div>
          <ul className="divide-y divide-line lg:grid lg:grid-cols-3 lg:gap-6 lg:divide-y-0">
            {list.map((c) => <CredentialRow key={c.type} credential={c} />)}
          </ul>
        </section>
        <div className="mt-4 flex flex-col sm:flex-row gap-2 lg:max-w-2xl lg:ms-auto">
          <Button icon={Download} size="lg" className="flex-1" onClick={() => downloadCredentialsCsv(list, `${form.name || 'event'}_credentials.csv`)}>
            حمّل الحسابات (CSV)
          </Button>
          <Button variant="secondary" size="lg" className="flex-1" onClick={onClose}>عُد إلى الأحداث</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl lg:max-w-none mx-auto">
      <button type="button" onClick={onClose} className="inline-flex items-center gap-1 text-sm text-muted mb-2 min-h-[2.75rem]">
        <ChevronRight className="w-4 h-4" /> الأحداث
      </button>
      <PageHeader title="حدث جديد" />

      {dataLoading ? (
        <LoadingState />
      ) : (
        <>
          <Stepper step={step} onStep={setStep} />

          {step === 0 && <EventInfoFields form={form} setForm={setForm} errors={errors} />}

          {step === 1 && (
            <SpecialtiesEditor
              value={eventSpecialties}
              onChange={setEventSpecialties}
              specialties={specialties}
              doctors={doctors}
              onDoctorCreated={(doctor) => setDoctors((prev) => [...prev, doctor])}
              busy={busy}
              defaultDate={form.date}
              newSpecialty={() => ({
                id: '',
                description: '',
                is_saturated: false,
                has_dilatation: false,
                schedule: [],
              })}
              newDay={() => ({ day_date: form.date, number_per_hour: 20, hours: [] })}
              newHour={(time) => ({ time })}
            />
          )}

          {step === 2 && (
            <div className="space-y-5 lg:space-y-0 lg:grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-6 lg:items-start">
              <section>
                <h2 className="font-display text-lg text-ink mb-1">ضوابط الحدث</h2>
                <p className="text-sm text-muted mb-3">يقرأ المريض هذه الضوابط قبل الحجز.</p>
                <RulesPicker rules={rules} selected={selectedRules} onToggle={toggleRule} />
              </section>
              <EventReview form={form} specialtiesList={eventSpecialties} specialtyName={specialtyName} doctorName={doctorName} rulesCount={selectedRules.length} />
            </div>
          )}

          <FormActionBar>
            {step > 0 && (
              <Button variant="secondary" size="lg" onClick={() => setStep((s) => s - 1)} disabled={loading}>السابق</Button>
            )}
            {step < 2 ? (
              <Button size="lg" className="flex-1" onClick={goNext}>التالي</Button>
            ) : (
              <Button size="lg" className="flex-1" loading={loading} onClick={handleSubmit}>احفظ الحدث</Button>
            )}
          </FormActionBar>
        </>
      )}
    </div>
  );
}
