import { API_BASE_URL } from '../../config/environment';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Check, CheckCircle2, ChevronRight, ChevronLeft, Send, AlertTriangle } from 'lucide-react';
import { Button, Field, TextInput, LoadingState, EmptyState, ToastProvider, useToast, cx } from '../../Components/ui';

const apiUrl = API_BASE_URL;

const AGE_RANGES = ['أقل من 18 سنة', '18-35 سنة', '36-50 سنة', 'أكثر من 50 سنة'];
const GENDERS = ['ذكر', 'أنثى'];
const RATING_OPTIONS = [
  { value: 1, label: 'ضعيف' },
  { value: 2, label: 'مقبول' },
  { value: 3, label: 'جيد' },
  { value: 4, label: 'جيد جدا' },
  { value: 5, label: 'ممتاز' },
];
const RATING_QUESTIONS = [
  { field: 'overall_organization', label: 'كيف تقيم تنظيم الفعالية بشكل عام؟' },
  { field: 'medical_quality', label: 'كيف تقيم جودة الفحوصات الطبية المقدمة؟' },
  { field: 'staff_performance', label: 'كيف تقيم أداء الأطباء والكادر الطبي؟' },
  { field: 'registration_ease', label: 'كيف كان تسجيلك عبر المنصة الإلكترونية؟' },
  { field: 'platform_organization', label: 'كيف تقيم طريقة تنظيم الفعالية باستخدام المنصة الإلكترونية؟' },
];
const TEXT_QUESTIONS = [
  { field: 'suggested_specialties', label: 'ما هي الفحوصات التي تقترحها مستقبلاً؟', placeholder: 'اكتب اقتراحاتك هنا...' },
  { field: 'positive_points', label: 'ما هي النقاط الإيجابية التي لاحظتها خلال الفعالية؟', placeholder: 'اكتب النقاط الإيجابية...' },
  { field: 'negative_points', label: 'ما هي النقاط السلبية التي واجهتها؟', placeholder: 'اكتب النقاط السلبية...' },
  { field: 'suggestions', label: 'هل لديك أي اقتراحات لتحسين الفعاليات المستقبلية؟', placeholder: 'اكتب اقتراحاتك...' },
];
const STEPS = ['عنك', 'التقييم', 'ملاحظاتك', 'التوصية'];

const REQUIRED_FIELDS = [
  'age_range', 'gender', 'specialties',
  'overall_organization', 'medical_quality', 'staff_performance',
  'registration_ease', 'platform_organization',
  'suggested_specialties', 'positive_points', 'negative_points', 'suggestions',
];

/** Checks one step; returns { field: message } for what is missing. */
const validateStep = (step, formData) => {
  const errs = {};
  if (step === 0) {
    if (!formData.age_range) errs.age_range = 'اختر فئتك العمرية.';
    if (!formData.gender) errs.gender = 'اختر الجنس.';
    if (formData.specialties.length === 0) errs.specialties = 'يرجى اختيار تخصص واحد على الأقل';
  }
  if (step === 1) {
    RATING_QUESTIONS.forEach(({ field }) => {
      if (!formData[field]) errs[field] = 'اختر رقماً من 1 إلى 5.';
    });
  }
  if (step === 2) {
    TEXT_QUESTIONS.forEach(({ field }) => {
      if (!String(formData[field] || '').trim()) errs[field] = 'هذا السؤال مطلوب، اكتب ولو جملة قصيرة.';
    });
  }
  if (step === 3 && formData.would_recommend === null) {
    errs.would_recommend = 'يرجى الإجابة على سؤال التوصية';
  }
  return errs;
};

function Choice({ active, onClick, children, className }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={cx(
        'min-h-[3rem] px-3 rounded-xl border text-base font-semibold transition-colors',
        active ? 'bg-ink text-white border-ink' : 'bg-white text-ink border-line hover:bg-ink-faint',
        className
      )}
    >
      {children}
    </button>
  );
}

function Question({ label, error, children, id }) {
  return (
    <fieldset className="mb-6" id={id}>
      <legend className="mb-2 text-base font-semibold text-ink">{label}</legend>
      {children}
      {error && <p className="mt-1.5 text-sm text-red-700">{error}</p>}
    </fieldset>
  );
}

function RatingRow({ label, value, onChange, error, field }) {
  return (
    <Question label={label} error={error} id={`q-${field}`}>
      <div role="radiogroup" aria-label={label} className="grid grid-cols-5 gap-1.5">
        {RATING_OPTIONS.map((option) => {
          const active = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={`${option.value} ${option.label}`}
              onClick={() => onChange(option.value)}
              className={cx(
                'flex flex-col items-center justify-center h-16 rounded-xl border transition-colors',
                active ? 'bg-ink text-white border-ink' : 'bg-white text-ink border-line hover:bg-ink-faint'
              )}
            >
              <span className="font-display text-xl leading-none">{option.value}</span>
              <span className={cx('mt-1 text-[11px] leading-none', active ? 'text-white/80' : 'text-muted')}>{option.label}</span>
            </button>
          );
        })}
      </div>
    </Question>
  );
}

function EvaluationFormInner() {
  const { eventId, appointmentId } = useParams();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [event, setEvent] = useState(null);
  const [specialties, setSpecialties] = useState([]);
  const [step, setStep] = useState(0);
  const [fieldErrors, setFieldErrors] = useState({});

  const [formData, setFormData] = useState({
    event_id: eventId,
    appointment_id: appointmentId || null,
    age_range: '',
    gender: '',
    specialties: [],
    overall_organization: 0,
    medical_quality: 0,
    staff_performance: 0,
    registration_ease: 0,
    platform_organization: 0,
    suggested_specialties: '',
    positive_points: '',
    negative_points: '',
    suggestions: '',
    would_recommend: null,
    contact_name: '',
    contact_phone: '',
    contact_email: '',
  });

  useEffect(() => {
    const fetchFormData = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/evaluations/form-data/${eventId}`);
        const data = await res.json();
        if (res.ok) {
          setEvent(data.event);
          setSpecialties(data.specialties || []);
        } else {
          setLoadError('فشل في تحميل بيانات الحدث');
        }
      } catch (err) {
        setLoadError('حدث خطأ أثناء تحميل البيانات');
      } finally {
        setLoading(false);
      }
    };
    fetchFormData();
  }, [eventId]);

  const setValue = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const toggleSpecialty = (spec) => {
    const list = formData.specialties.includes(spec)
      ? formData.specialties.filter((s) => s !== spec)
      : [...formData.specialties, spec];
    setValue('specialties', list);
  };

  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const goNext = () => {
    const errs = validateStep(step, formData);
    setFieldErrors(errs);
    if (Object.keys(errs).length) {
      toast('أكمل الأسئلة المعلّمة باللون الأحمر ثم تابع.', 'error');
      return;
    }
    setStep((s) => s + 1);
    scrollTop();
  };

  const goBack = () => {
    setFieldErrors({});
    setStep((s) => Math.max(0, s - 1));
    scrollTop();
  };

  const handleSubmit = async () => {
    // Same rules as before, checked across every step
    if (formData.specialties.length === 0) {
      setStep(0);
      setFieldErrors(validateStep(0, formData));
      toast('يرجى اختيار تخصص واحد على الأقل', 'error');
      return;
    }
    const missingFields = REQUIRED_FIELDS.filter((field) => !formData[field]);
    if (missingFields.length > 0) {
      const firstStep = [0, 1, 2].find((s) => Object.keys(validateStep(s, formData)).length > 0) ?? 0;
      setStep(firstStep);
      setFieldErrors(validateStep(firstStep, formData));
      toast('يرجى ملء جميع الحقول المطلوبة', 'error');
      scrollTop();
      return;
    }
    if (formData.would_recommend === null) {
      setFieldErrors(validateStep(3, formData));
      toast('يرجى الإجابة على سؤال التوصية', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${apiUrl}/api/evaluations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        setSubmitted(true);
        scrollTop();
        setTimeout(() => {
          window.location.href = '/home';
        }, 3000);
      } else {
        toast(data.message || 'فشل في إرسال التقييم، حاول مرة أخرى.', 'error');
      }
    } catch (err) {
      toast('تعذّر إرسال التقييم. تحقق من اتصالك بالإنترنت ثم اضغط «أرسل التقييم» مرة أخرى.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState />;

  if (loadError) {
    return (
      <div className="max-w-md mx-auto px-4 py-10">
        <div className="bg-white border border-line rounded-2xl">
          <EmptyState icon={AlertTriangle} title={loadError} action={<Button onClick={() => window.location.reload()}>أعد المحاولة</Button>}>
            تأكد من الرابط ومن اتصالك بالإنترنت، ثم أعد تحميل الصفحة.
          </EmptyState>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-md mx-auto px-4 py-10">
        <div className="bg-white border border-line rounded-2xl p-6 text-center">
          <CheckCircle2 className="w-14 h-14 mx-auto mb-4 text-st-queue" />
          <h1 className="font-display text-2xl text-ink mb-2">وصلنا تقييمك، شكراً لك</h1>
          <p className="text-base text-ink">ملاحظاتك تساعدنا على تحسين القوافل القادمة.</p>
          <p className="mt-4 text-sm text-muted">ستنتقل إلى الصفحة الرئيسية بعد لحظات...</p>
        </div>
      </div>
    );
  }

  const isLast = step === STEPS.length - 1;

  return (
    <div className="max-w-xl lg:max-w-4xl mx-auto px-4 lg:px-8 pt-6 lg:pt-10 pb-32">
      <header className="mb-5">
        <h1 className="font-display text-2xl text-ink leading-snug">قيّم الفحوصات الطبية</h1>
        <p className="mt-1 text-sm text-muted">{event?.name || 'مؤسسة تجمي للتنمية الإنسانية'}</p>
      </header>

      {/* Steps */}
      <ol className="flex gap-2 mb-6" aria-label="خطوات التقييم">
        {STEPS.map((label, i) => (
          <li key={label} className="flex-1 min-w-0" aria-current={i === step ? 'step' : undefined}>
            <div className={cx('h-1.5 rounded-full', i <= step ? 'bg-ink' : 'bg-line')} />
            <p className={cx('mt-1.5 text-xs truncate', i === step ? 'font-semibold text-ink' : 'text-muted')}>
              {i + 1}. {label}
            </p>
          </li>
        ))}
      </ol>

      <section className="bg-white border border-line rounded-2xl p-4 sm:p-6 lg:p-8">
        {step === 0 && (
          <>
            <h2 className="font-display text-lg text-ink mb-4">معلومات عنك</h2>
            <div className="lg:grid lg:grid-cols-2 lg:gap-x-8">
              <Question label="العمر" error={fieldErrors.age_range}>
                <div role="radiogroup" className="grid grid-cols-2 gap-2">
                  {AGE_RANGES.map((age) => (
                    <Choice key={age} active={formData.age_range === age} onClick={() => setValue('age_range', age)}>{age}</Choice>
                  ))}
                </div>
              </Question>
              <Question label="الجنس" error={fieldErrors.gender}>
                <div role="radiogroup" className="grid grid-cols-2 gap-2">
                  {GENDERS.map((gender) => (
                    <Choice key={gender} active={formData.gender === gender} onClick={() => setValue('gender', gender)}>{gender}</Choice>
                  ))}
                </div>
              </Question>
            </div>
            <Question label="التخصصات التي زرتها (يمكنك اختيار أكثر من تخصص)" error={fieldErrors.specialties}>
              {specialties.length === 0 ? (
                <p className="text-sm text-muted">لا توجد تخصصات مسجّلة لهذا الحدث.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {specialties.map((spec, index) => {
                    const checked = formData.specialties.includes(spec);
                    return (
                      <label
                        key={index}
                        className={cx(
                          'flex items-center gap-3 min-h-[3rem] px-3 rounded-xl border cursor-pointer transition-colors',
                          checked ? 'border-ink bg-ink-faint' : 'border-line bg-white hover:bg-ink-faint'
                        )}
                      >
                        <input type="checkbox" checked={checked} onChange={() => toggleSpecialty(spec)} className="sr-only" />
                        <span className={cx('w-6 h-6 shrink-0 rounded-md border-2 flex items-center justify-center', checked ? 'bg-ink border-ink' : 'border-line bg-white')}>
                          {checked && <Check className="w-4 h-4 text-white" />}
                        </span>
                        <span className="text-base text-ink">{spec}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </Question>
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="font-display text-lg text-ink mb-1">قيّم الخدمة</h2>
            <p className="text-sm text-muted mb-5">1 يعني ضعيف و 5 يعني ممتاز.</p>
            <div className="lg:grid lg:grid-cols-2 lg:gap-x-8">
              {RATING_QUESTIONS.map((q) => (
                <RatingRow
                  key={q.field}
                  field={q.field}
                  label={q.label}
                  value={formData[q.field]}
                  onChange={(v) => setValue(q.field, v)}
                  error={fieldErrors[q.field]}
                />
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="font-display text-lg text-ink mb-4">ملاحظاتك واقتراحاتك</h2>
            <div className="lg:grid lg:grid-cols-2 lg:gap-x-8">
              {TEXT_QUESTIONS.map((q) => (
                <Field key={q.field} label={q.label} error={fieldErrors[q.field]} className="mb-5">
                  <textarea
                    name={q.field}
                    value={formData[q.field]}
                    onChange={(e) => setValue(q.field, e.target.value)}
                    rows={3}
                    className={cx(
                      'w-full rounded-xl border bg-white p-3 text-base text-ink placeholder:text-muted focus:border-ink focus:outline-none resize-none',
                      fieldErrors[q.field] ? 'border-red-400' : 'border-line'
                    )}
                    placeholder={q.placeholder}
                  />
                </Field>
              ))}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="font-display text-lg text-ink mb-4">التوصية والتواصل</h2>
            <Question label="هل تنصح الآخرين بالمشاركة في فعالياتنا المستقبلية؟" error={fieldErrors.would_recommend}>
              <div role="radiogroup" className="grid grid-cols-2 gap-2">
                {[{ value: true, label: 'نعم' }, { value: false, label: 'لا' }].map((option) => (
                  <Choice key={String(option.value)} active={formData.would_recommend === option.value} onClick={() => setValue('would_recommend', option.value)}>
                    {option.label}
                  </Choice>
                ))}
              </div>
            </Question>

            <div className="rounded-xl bg-paper p-4">
              <h3 className="font-semibold text-ink">معلومات الاتصال (اختياري)</h3>
              <p className="mt-1 mb-3 text-sm text-muted">اتركها إذا كنت ترغب أن نتواصل معك للمتابعة.</p>
              <div className="space-y-3 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-4">
                <Field label="الاسم الكامل">
                  <TextInput type="text" name="contact_name" value={formData.contact_name} onChange={(e) => setValue('contact_name', e.target.value)} autoComplete="name" />
                </Field>
                <Field label="رقم الهاتف">
                  <TextInput type="tel" inputMode="tel" name="contact_phone" value={formData.contact_phone} onChange={(e) => setValue('contact_phone', e.target.value)} dir="ltr" className="text-start" autoComplete="tel" />
                </Field>
                <Field label="البريد الإلكتروني">
                  <TextInput type="email" inputMode="email" name="contact_email" value={formData.contact_email} onChange={(e) => setValue('contact_email', e.target.value)} dir="ltr" className="text-start" autoComplete="email" />
                </Field>
              </div>
            </div>
          </>
        )}
      </section>

      <p className="mt-6 text-center text-xs text-muted">شكراً لك على وقتك. مؤسسة تجمي للتنمية الإنسانية © {new Date().getFullYear()}</p>

      {/* Sticky actions within thumb reach */}
      <div className="fixed inset-x-0 bottom-0 z-40 bg-white border-t border-line safe-bottom">
        <div className="max-w-xl lg:max-w-4xl mx-auto px-4 lg:px-8 py-3 flex gap-2">
          {step > 0 && (
            <Button variant="secondary" size="lg" icon={ChevronRight} onClick={goBack} disabled={submitting}>
              السابق
            </Button>
          )}
          {isLast ? (
            <Button size="lg" icon={Send} className="flex-1 lg:flex-none lg:w-64 lg:ms-auto" loading={submitting} onClick={handleSubmit}>
              {submitting ? 'جاري الإرسال...' : 'أرسل التقييم'}
            </Button>
          ) : (
            <Button size="lg" className="flex-1 lg:flex-none lg:w-64 lg:ms-auto" onClick={goNext}>
              التالي
              <ChevronLeft className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Post-visit evaluation (public). Four short steps, one question group per screen. */
export default function EvaluationForm() {
  return (
    <ToastProvider>
      <div className="staff-app min-h-screen" dir="rtl">
        <EvaluationFormInner />
      </div>
    </ToastProvider>
  );
}
