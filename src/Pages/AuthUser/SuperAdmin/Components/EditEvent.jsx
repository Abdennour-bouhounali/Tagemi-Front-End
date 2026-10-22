import { API_BASE_URL } from '../../../../config/environment';
import { useState, useContext, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { AppContext } from '../../../../Context/AppContext';
import { Button, PageHeader, LoadingState, useToast } from '../../../../Components/ui';
import {
  Stepper, FormActionBar, EventInfoFields, validateEventInfo, validateSpecialties,
  SpecialtiesEditor, RulesPicker, EventReview,
} from './EventFormParts';

const apiUrl = API_BASE_URL;

const REMOVAL_NOTE = 'لا يُقبل الحذف إذا كانت فيه مواعيد محجوزة: سيرفض الخادم الحفظ.';

/** Edit an event as a 3-step form. Payload of PUT /api/events/{id}/full is unchanged. */
export default function EditEvent({ event, onClose, onSuccess }) {
  const { token } = useContext(AppContext);
  const toast = useToast();

  const [form, setForm] = useState({
    name: event.name || '',
    date: event.date ? event.date.split('T')[0] : '',
    state: event.state || '',
    nbr_of_allowed_specialties: event.nbr_of_allowed_specialties || 1,
    city: event.city || '',
    description: event.description || '',
    is_active: event.is_active ?? true,
    is_tawat: event.is_tawat ?? true,
  });
  const [selectedRules, setSelectedRules] = useState(event.rules_ids || []);
  const [eventSpecialties, setEventSpecialties] = useState([]);

  const [specialties, setSpecialties] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [rules, setRules] = useState([]);

  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    const auth = { headers: { Authorization: `Bearer ${token}` } };

    const fetchSpecialties = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/specialty`, auth);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setSpecialties(data.specialties || data || []);
      } catch {
        toast('تعذر تحميل التخصصات، أعد فتح النموذج', 'error');
      }
    };

    const fetchDoctors = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/doctors`, auth);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setDoctors(data.doctors || []);
      } catch {
        toast('تعذر تحميل الأطباء، أعد فتح النموذج', 'error');
      }
    };

    const fetchRules = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/rules`, auth);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setRules(data || []);
      } catch {
        toast('تعذر تحميل الضوابط، أعد فتح النموذج', 'error');
      }
    };

    const fetchEventSpecialties = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/events/${event.id}`, auth);
        if (!res.ok) throw new Error();
        const data = await res.json();

        const transformed = await Promise.all(
          (data.event?.event_specialties || []).map(async (es) => {
            const daysRes = await fetch(`${apiUrl}/api/event-specialties/${es.id}/days`, auth);
            const daysData = await daysRes.json();

            const daysWithHours = await Promise.all(
              (daysData.days || []).map(async (day) => {
                const hoursRes = await fetch(`${apiUrl}/api/days/${day.id}/hours`, auth);
                const hoursData = await hoursRes.json();
                return {
                  id: day.id,
                  day_date: day.day_date,
                  number_per_hour: day.number_per_hour || 6,
                  hours: (hoursData.hours || []).map((h) => ({ id: h.id, time: h.time })),
                };
              })
            );

            return {
              id: es.specialty_id,
              eventSpecialtyId: es.id,
              description: es.description || '',
              doctors: (es.doctors || []).map((d) => d.id),
              is_saturated: es.is_saturated || false,
              has_dilatation: es.has_dilatation || false,
              days: daysWithHours,
            };
          })
        );
        setEventSpecialties(transformed);
      } catch {
        toast('تعذر تحميل تخصصات الحدث، أعد فتح النموذج', 'error');
      }
    };

    (async () => {
      setDataLoading(true);
      await Promise.all([fetchSpecialties(), fetchDoctors(), fetchRules(), fetchEventSpecialties()]);
      setDataLoading(false);
    })();
  }, [event.id, token, toast]);

  const specialtyName = (id) => specialties.find((s) => String(s.id) === String(id))?.name;

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
      const msg = validateSpecialties(eventSpecialties, specialtyName);
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
    const msg = validateSpecialties(eventSpecialties, specialtyName);
    if (msg) {
      setStep(1);
      toast(msg, 'error');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        rules_ids: selectedRules,
        specialties: eventSpecialties,
      };

      const res = await fetch(`${apiUrl}/api/events/${event.id}/full`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // 409: a removed specialty/day/hour still has booked appointments
        toast(
          data.message || (res.status === 409
            ? 'لا يمكن حذف تخصص أو يوم أو ساعة فيها مواعيد محجوزة. أرجعها ثم احفظ.'
            : 'تعذر حفظ التعديلات، أعد المحاولة'),
          'error'
        );
        return;
      }

      toast('حُفظت تعديلات الحدث');
      onSuccess?.();
      onClose?.();
    } catch {
      toast('تعذر الاتصال بالخادم، تحقق من الشبكة وأعد المحاولة', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <button type="button" onClick={onClose} className="inline-flex items-center gap-1 text-sm text-muted mb-2 min-h-[2.75rem]">
        <ChevronRight className="w-4 h-4" /> الأحداث
      </button>
      <PageHeader title="عدّل الحدث" subtitle={event.name} />

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
              showExisting
              removalNote={REMOVAL_NOTE}
              newSpecialty={() => ({
                id: '',
                eventSpecialtyId: null,
                description: '',
                doctors: [],
                is_saturated: false,
                has_dilatation: false,
                days: [],
                isNew: true,
              })}
              newDay={() => ({ id: null, day_date: '', number_per_hour: 20, hours: [], isNew: true })}
              newHour={(time) => ({ id: null, time, isNew: true })}
            />
          )}

          {step === 2 && (
            <div className="space-y-5">
              <section>
                <h2 className="font-display text-lg text-ink mb-1">ضوابط الحدث</h2>
                <p className="text-sm text-muted mb-3">يقرأ المريض هذه الضوابط قبل الحجز.</p>
                <RulesPicker rules={rules} selected={selectedRules} onToggle={toggleRule} />
              </section>
              <EventReview form={form} specialtiesList={eventSpecialties} specialtyName={specialtyName} rulesCount={selectedRules.length} />
            </div>
          )}

          <FormActionBar>
            {step > 0 ? (
              <Button variant="secondary" size="lg" onClick={() => setStep((s) => s - 1)} disabled={loading}>السابق</Button>
            ) : (
              <Button variant="secondary" size="lg" onClick={onClose}>إلغاء</Button>
            )}
            {step < 2 ? (
              <Button size="lg" className="flex-1" onClick={goNext}>التالي</Button>
            ) : (
              <Button size="lg" className="flex-1" loading={loading} onClick={handleSubmit}>احفظ التعديلات</Button>
            )}
          </FormActionBar>
        </>
      )}
    </div>
  );
}
