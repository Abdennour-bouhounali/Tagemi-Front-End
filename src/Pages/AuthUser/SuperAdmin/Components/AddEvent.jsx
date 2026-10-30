import { API_BASE_URL } from '../../../../config/environment';
import { useState, useContext, useEffect, useRef, useMemo, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ChevronRight, Download, CheckCircle2, Trash2, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { AppContext } from '../../../../Context/AppContext';
import { Button, IconButton, PageHeader, LoadingState, useToast, cx } from '../../../../Components/ui';
import {
  Stepper, FormActionBar, EventInfoFields, validateEventInfo,
  RulesPicker, EventReview, CredentialRow, downloadCredentialsCsv, ConfirmSheet,
} from './EventFormParts';
import {
  ScheduleTable, ScheduleSummary, newTableSpecialty, restoreTableSpecialties, prepareSpecialties, tableError,
} from './ScheduleTable';
import { eventDates } from '../../../../utils/schedule';
import { newIdempotencyKey } from '../../../../utils/idempotency';

const apiUrl = API_BASE_URL;

const EMPTY_FORM = {
  name: '',
  date: '',
  end_date: '',
  state: '',
  nbr_of_allowed_specialties: 1,
  city: '',
  description: '',
  rules_ids: [],
  is_active: true,
  is_tawat: true,
  is_simulation: false,
};

// The form is saved as a draft this long after the last change
const DRAFT_DELAY = 1000;
const DRAFT_RETRY = 5000;

const draftBody = ({ form, eventSpecialties, selectedRules, step }) =>
  JSON.stringify({ name: String(form.name || '').trim() || null, data: { form, eventSpecialties, selectedRules, step } });

// An untouched form is not worth a draft
const PRISTINE = draftBody({ form: EMPTY_FORM, eventSpecialties: [], selectedRules: [], step: 0 });

const DRAFT_STATUS = {
  saving: 'تُحفظ المسودة…',
  saved: 'حُفظت المسودة تلقائيًا، يمكنك إكمالها لاحقًا من قائمة الأحداث',
  error: 'تعذر حفظ المسودة، ستُعاد المحاولة',
};

/**
 * New event as a 3-step form; the specialties are planned in a table (a row
 * per doctor and day, grouped by specialty) beside a live visits summary.
 * Saved as a draft on the server while the super admin types (draftId: resume one);
 * the server deletes the draft when the event is created.
 */
export default function AddEvent({ draftId = null, getEvents, onClose }) {
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
  const [selectedKey, setSelectedKey] = useState(null); // specialty shown in the summary
  const [showSummary, setShowSummary] = useState(() => {
    try { return localStorage.getItem('eventTable.summary') !== 'hidden'; } catch { return true; }
  });
  const toggleSummary = () => setShowSummary((on) => {
    try { localStorage.setItem('eventTable.summary', on ? 'hidden' : 'shown'); } catch { /* private mode */ }
    return !on;
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const submittingRef = useRef(false);
  const submissionKey = useRef(newIdempotencyKey());
  const [dataLoading, setDataLoading] = useState(true);
  const [credentials, setCredentials] = useState(null);

  // The planning table takes the whole screen width
  const setWide = useOutletContext()?.setWide;
  useEffect(() => {
    setWide?.(step === 1 && !credentials);
    return () => setWide?.(false);
  }, [setWide, step, credentials]);

  // Draft: saves run one after another; draftRef is null until the first one
  const draftRef = useRef(draftId);
  const lastSaved = useRef(PRISTINE);
  const saveChain = useRef(Promise.resolve());
  const doneRef = useRef(false); // event created or draft deleted: stop saving
  const [draftLoading, setDraftLoading] = useState(!!draftId);
  const [draftStatus, setDraftStatus] = useState(draftId ? 'saved' : null);
  const [retry, setRetry] = useState(0);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [discarding, setDiscarding] = useState(false);

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

  // Resume a draft
  useEffect(() => {
    if (!draftId) return;
    (async () => {
      try {
        const res = await fetch(`${apiUrl}/api/event-drafts/${draftId}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error();
        const data = (await res.json()).draft?.data || {};
        const restored = {
          form: { ...EMPTY_FORM, ...(data.form || {}) },
          eventSpecialties: restoreTableSpecialties(data.eventSpecialties || []),
          selectedRules: data.selectedRules || [],
          step: Math.min(2, Math.max(0, data.step || 0)),
        };
        setForm(restored.form);
        setEventSpecialties(restored.eventSpecialties);
        setSelectedRules(restored.selectedRules);
        setStep(restored.step);
        lastSaved.current = draftBody(restored);
      } catch {
        toast('تعذر فتح المسودة، أعد المحاولة من قائمة الأحداث', 'error');
        doneRef.current = true;
        onClose?.();
      } finally {
        setDraftLoading(false);
      }
    })();
    // Once, when the form opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const snapshot = useMemo(() => ({ form, eventSpecialties, selectedRules, step }), [form, eventSpecialties, selectedRules, step]);
  const snapshotRef = useRef(snapshot);
  snapshotRef.current = snapshot;

  const saveDraft = useCallback((snap, keepalive = false) => {
    saveChain.current = saveChain.current.then(async () => {
      const body = draftBody(snap);
      if (doneRef.current || submittingRef.current || body === lastSaved.current) return;
      const id = draftRef.current;
      setDraftStatus('saving');
      try {
        const res = await fetch(id ? `${apiUrl}/api/event-drafts/${id}` : `${apiUrl}/api/event-drafts`, {
          method: id ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body,
          keepalive,
        });
        if (res.status === 404 && id) {
          draftRef.current = null; // deleted from another tab: the next save makes a new one
          throw new Error();
        }
        if (!res.ok) throw new Error();
        if (!id) draftRef.current = (await res.json()).draft?.id ?? null;
        lastSaved.current = body;
        setDraftStatus('saved');
      } catch {
        setDraftStatus('error');
        setTimeout(() => setRetry((n) => n + 1), DRAFT_RETRY);
      }
    });
    return saveChain.current;
  }, [token]);

  // Save shortly after each change, and right away when the tab is hidden or closed
  useEffect(() => {
    if (draftLoading) return undefined;
    const timer = setTimeout(() => saveDraft(snapshot), DRAFT_DELAY);
    return () => clearTimeout(timer);
  }, [snapshot, draftLoading, saveDraft, retry]);

  useEffect(() => {
    const flush = () => { if (!draftLoading) saveDraft(snapshotRef.current, true); };
    const onVisibility = () => { if (document.visibilityState === 'hidden') flush(); };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [draftLoading, saveDraft]);

  // Back to the list: the draft is saved first, so the list shows it
  const close = async () => {
    if (!draftLoading && !doneRef.current) await saveDraft(snapshotRef.current);
    onClose?.();
  };

  const discardDraft = async () => {
    setDiscarding(true);
    await saveChain.current;
    const id = draftRef.current;
    try {
      if (id) {
        const res = await fetch(`${apiUrl}/api/event-drafts/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok && res.status !== 404) throw new Error();
      }
      doneRef.current = true;
      toast('حُذفت المسودة');
      onClose?.();
    } catch {
      toast('تعذر حذف المسودة، أعد المحاولة', 'error');
    } finally {
      setDiscarding(false);
      setConfirmDiscard(false);
    }
  };

  const specialtyName = (id) => specialties.find((s) => String(s.id) === String(id))?.name;
  const doctorName = (id) => doctors.find((d) => d.id === id)?.full_name || `#${id}`;

  const dates = useMemo(() => eventDates(form.date, form.end_date || form.date), [form.date, form.end_date]);
  const prepared = useMemo(() => prepareSpecialties(eventSpecialties, dates), [eventSpecialties, dates]);
  const specialtiesError = () => tableError(eventSpecialties, dates, (id) => specialtyName(id) || 'التخصص', doctorName);

  const toggleRule = (id) => setSelectedRules((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const goNext = () => {
    if (step === 0) {
      const e = validateEventInfo(form);
      setErrors(e);
      if (Object.keys(e).length) {
        toast('أكمل الحقول المطلوبة', 'error');
        return;
      }
      // The table opens with a first specialty row ready to fill
      if (!eventSpecialties.length) setEventSpecialties([newTableSpecialty(form.date)]);
    }
    if (step === 1) {
      const msg = specialtiesError();
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
    const msg = specialtiesError();
    if (msg) {
      setStep(1);
      toast(msg, 'error');
      return;
    }

    // A second tap before the button re-renders must not create the event twice
    if (submittingRef.current) return;
    setLoading(true);
    await saveChain.current; // the draft's id, so the server deletes it with the event
    if (submittingRef.current) return;
    submittingRef.current = true;
    const payload = {
      ...form,
      end_date: form.end_date || form.date,
      rules_ids: selectedRules,
      specialties: prepared,
      draft_id: draftRef.current,
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
        doneRef.current = true;
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
      <button type="button" onClick={close} className="inline-flex items-center gap-1 text-sm text-muted mb-2 min-h-[2.75rem]">
        <ChevronRight className="w-4 h-4" /> الأحداث
      </button>
      <PageHeader
        title="حدث جديد"
        subtitle={draftStatus ? DRAFT_STATUS[draftStatus] : undefined}
        actions={draftStatus && (
          <IconButton icon={Trash2} label="احذف المسودة" className="bg-white border border-line text-red-700" onClick={() => setConfirmDiscard(true)} />
        )}
      />

      <ConfirmSheet
        open={confirmDiscard}
        onClose={() => setConfirmDiscard(false)}
        title="حذف المسودة؟"
        confirmLabel="احذف المسودة"
        loading={discarding}
        onConfirm={discardDraft}
      >
        <p>يُحذف كل ما كتبته في هذا الحدث وتعود إلى قائمة الأحداث. الأطباء والتخصصات التي أضفتها تبقى.</p>
      </ConfirmSheet>

      {dataLoading || draftLoading ? (
        <LoadingState />
      ) : (
        <>
          <Stepper step={step} onStep={setStep} />

          {step === 0 && <EventInfoFields form={form} setForm={setForm} errors={errors} />}

          {step === 1 && (
            <div className={cx('space-y-4 lg:space-y-0 lg:grid lg:gap-3 lg:items-start', showSummary ? 'lg:grid-cols-[minmax(0,1fr)_18rem]' : 'lg:grid-cols-1')}>
              <ScheduleTable
                value={eventSpecialties}
                onChange={setEventSpecialties}
                specialties={specialties}
                doctors={doctors}
                busy={busy}
                dates={dates}
                onDoctorCreated={(doctor) => setDoctors((prev) => [...prev, doctor])}
                onSpecialtyCreated={(specialty) => setSpecialties((prev) => [...prev, specialty])}
                selectedKey={selectedKey}
                onSelect={setSelectedKey}
                actions={(
                  <Button size="sm" variant="ghost" icon={showSummary ? PanelLeftClose : PanelLeftOpen} onClick={toggleSummary} aria-pressed={showSummary}>
                    {showSummary ? 'أخفِ الملخص' : 'أظهر الملخص'}
                  </Button>
                )}
              />
              {showSummary && <ScheduleSummary
                value={eventSpecialties}
                specialties={specialties}
                doctors={doctors}
                dates={dates}
                selectedKey={selectedKey}
                onSelect={setSelectedKey}
              />}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5 lg:space-y-0 lg:grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-6 lg:items-start">
              <section>
                <h2 className="font-display text-lg text-ink mb-1">ضوابط الحدث</h2>
                <p className="text-sm text-muted mb-3">يقرأ المريض هذه الضوابط قبل الحجز.</p>
                <RulesPicker rules={rules} selected={selectedRules} onToggle={toggleRule} />
              </section>
              <EventReview form={form} specialtiesList={prepared} specialtyName={specialtyName} doctorName={doctorName} rulesCount={selectedRules.length} />
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
