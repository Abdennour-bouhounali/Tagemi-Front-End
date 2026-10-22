import { API_BASE_URL } from '../../../config/environment';
import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  UserPlus, Trash2, RotateCcw, Zap, ChevronRight, Pencil, AlertTriangle, CheckCircle2, TestTube2,
} from "lucide-react";
import { AppContext } from "../../../Context/AppContext";
import algeriaLocations from "../../../data/algeria_locations.json";
import {
  Button, IconButton, PageHeader, StatStrip, ChipGroup, Panel, Sheet, Field, TextInput, SelectInput, useToast, cx,
} from "../../../Components/ui";

const apiUrl = API_BASE_URL;
// Backend works on this fixed event for test data
const TEST_EVENT_ID = 2;
const TEST_PATIENTS_PER_SPECIALTY = 15;
const NETWORK_ERROR = "تعذر الاتصال بالخادم، تحقق من الشبكة ثم أعد المحاولة";

let nextKey = 1;
const emptyAppointment = () => ({
  key: nextKey++,
  name: "",
  lastName: "",
  birthday: "",
  state: "",
  city: "",
  diseases: "",
  phone: "",
  phone2: "",
  sex: "",
  // 'different' mode only
  event_specialty_id: "",
  day_id: "",
  hour_id: "",
  _days: [],
  _hours: [],
});

const WILAYAS = algeriaLocations.algeria_locations;
const communesOf = (stateName) => WILAYAS.find((w) => w.name_ar === stateName)?.communes || [];
const today = new Date().toISOString().split("T")[0];

/**
 * Bulk booking (super admin, special-cases officer). Three modes:
 * same slot for everyone, a slot per patient, and test data (super admin only).
 */
const AddMultipleAppointments = () => {
  const { token, user } = useContext(AppContext);
  const toast = useToast();
  const isSuperAdmin = user?.role_id === 1;

  const [mode, setMode] = useState("same");

  const [activeEvents, setActiveEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventSpecialties, setEventSpecialties] = useState([]);

  // 'same' mode shared slot
  const [selectedEventSpecialty, setSelectedEventSpecialty] = useState(null);
  const [days, setDays] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [hours, setHours] = useState([]);
  const [selectedHour, setSelectedHour] = useState(null);
  const [availableSlots, setAvailableSlots] = useState(null);

  const [appointments, setAppointments] = useState(() => [emptyAppointment()]);
  const [current, setCurrent] = useState(0);
  const [errorField, setErrorField] = useState(null);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // Test mode
  const [testEventInfo, setTestEventInfo] = useState(null);
  const [testSpecialties, setTestSpecialties] = useState([]);
  const [testAppointmentsCount, setTestAppointmentsCount] = useState(0);
  const [counting, setCounting] = useState(false);
  const [confirmTest, setConfirmTest] = useState(null); // 'reset' | 'delete'

  const authGet = useCallback(async (path) => {
    const res = await fetch(`${apiUrl}${path}`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || "request failed");
    return data;
  }, [token]);

  // ------------------------------------------------------------ loading

  useEffect(() => {
    (async () => {
      try {
        const data = await authGet("/api/events");
        const active = data.events?.filter((e) => e.is_active && !e.is_archived) || [];
        setActiveEvents(active);
        if (active.length === 1) setSelectedEvent(active[0]);
      } catch {
        toast("تعذر تحميل الأحداث النشطة، أعد تحميل الصفحة", "error");
      }
    })();
  }, [authGet, toast]);

  const fetchDays = useCallback(async (eventSpecialtyId) => {
    try {
      return (await authGet(`/api/event-specialties/${eventSpecialtyId}/days`)).days || [];
    } catch {
      toast("تعذر تحميل الأيام", "error");
      return [];
    }
  }, [authGet, toast]);

  const fetchHours = useCallback(async (dayId) => {
    try {
      return (await authGet(`/api/days/${dayId}/hours`)).hours || [];
    } catch {
      toast("تعذر تحميل الساعات", "error");
      return [];
    }
  }, [authGet, toast]);

  // Event changed: reload specialties, clear every slot choice
  useEffect(() => {
    setSelectedEventSpecialty(null);
    setSelectedDay(null);
    setSelectedHour(null);
    setAvailableSlots(null);
    setAppointments((list) => list.map((a) => ({ ...a, event_specialty_id: "", day_id: "", hour_id: "", _days: [], _hours: [] })));
    if (!selectedEvent) {
      setEventSpecialties([]);
      return;
    }
    authGet(`/api/events/${selectedEvent.id}/specialties`)
      .then((data) => setEventSpecialties(data.event_specialties || []))
      .catch(() => toast("تعذر تحميل التخصصات", "error"));
  }, [selectedEvent, authGet, toast]);

  useEffect(() => {
    setSelectedDay(null);
    setDays([]);
    if (selectedEventSpecialty) fetchDays(selectedEventSpecialty.id).then(setDays);
  }, [selectedEventSpecialty, fetchDays]);

  useEffect(() => {
    setSelectedHour(null);
    setHours([]);
    if (selectedDay) fetchHours(selectedDay.id).then(setHours);
  }, [selectedDay, fetchHours]);

  const checkAvailableSlots = useCallback(async () => {
    if (!selectedEventSpecialty || !selectedDay || !selectedHour) {
      setAvailableSlots(null);
      return;
    }
    try {
      const data = await authGet(
        `/api/check-slot-availability?event_specialty_id=${selectedEventSpecialty.id}&day_id=${selectedDay.id}&hour_id=${selectedHour.id}`
      );
      setAvailableSlots(data);
    } catch {
      setAvailableSlots(null);
    }
  }, [authGet, selectedEventSpecialty, selectedDay, selectedHour]);

  useEffect(() => {
    if (mode === "same") checkAvailableSlots();
  }, [selectedHour, mode, checkAvailableSlots]);

  // ----------------------------------------------------------- test mode

  const countTestAppointments = useCallback(async () => {
    setCounting(true);
    try {
      setTestAppointmentsCount((await authGet("/api/test-appointments/count")).count || 0);
    } catch {
      // Count stays as it was
    } finally {
      setCounting(false);
    }
  }, [authGet]);

  useEffect(() => {
    if (mode !== "test") return;
    (async () => {
      try {
        const data = await authGet(`/api/events/${TEST_EVENT_ID}`);
        setTestEventInfo(data.event || data);
        const sp = await authGet(`/api/events/${TEST_EVENT_ID}/specialties`);
        setTestSpecialties(sp.event_specialties || []);
        await countTestAppointments();
      } catch {
        toast(`تعذر تحميل حدث الاختبار (رقم ${TEST_EVENT_ID}). تأكد من وجوده ثم أعد المحاولة.`, "error");
      }
    })();
  }, [mode, authGet, countTestAppointments, toast]);

  const testAction = async (path, method, onOk) => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}${path}`, {
        method,
        headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        onOk(data);
        await countTestAppointments();
      } else {
        toast(data.message || "تعذر تنفيذ العملية على المواعيد التجريبية", "error");
      }
    } catch {
      toast(NETWORK_ERROR, "error");
    } finally {
      setLoading(false);
      setConfirmTest(null);
    }
  };

  const handleCreateTestAppointments = () =>
    testAction("/api/test-appointments/create-all", "POST", (data) => {
      toast(`تم إنشاء ${data.created_count} موعد تجريبي (${data.patients_count} مريض في ${data.specialties_count} تخصص)`);
      if (data.warning_message) toast(data.warning_message, "info");
    });
  const handleResetTestAppointments = () =>
    testAction("/api/test-appointments/reset-status", "POST", (data) =>
      toast(`أعيدت حالة ${data.updated_count} موعد تجريبي إلى «لم يحضر بعد»`));
  const handleDeleteTestAppointments = () =>
    testAction("/api/test-appointments/delete-all", "DELETE", (data) =>
      toast(`تم حذف ${data.deleted_count} موعد تجريبي`));

  // ------------------------------------------------------------- patients

  const changeMode = (newMode) => {
    setMode(newMode);
    setAppointments([emptyAppointment()]);
    setCurrent(0);
    setErrorField(null);
    if (newMode !== "same") {
      setSelectedEventSpecialty(null);
      setAvailableSlots(null);
    }
  };

  const update = (index, patch) => {
    setAppointments((list) => list.map((a, i) => (i === index ? { ...a, ...patch } : a)));
    if (errorField && errorField.index === index && Object.keys(patch).includes(errorField.field)) setErrorField(null);
  };

  // Async results are matched by key: the patient may have moved in the list meanwhile
  const updateByKey = (key, patch) => setAppointments((list) => list.map((x) => (x.key === key ? { ...x, ...patch } : x)));

  const changePatientSpecialty = async (index, specialtyId) => {
    const { key } = appointments[index];
    update(index, { event_specialty_id: specialtyId, day_id: "", hour_id: "", _days: [], _hours: [] });
    if (specialtyId) updateByKey(key, { _days: await fetchDays(specialtyId) });
  };

  const changePatientDay = async (index, dayId) => {
    const { key } = appointments[index];
    update(index, { day_id: dayId, hour_id: "", _hours: [] });
    if (dayId) updateByKey(key, { _hours: await fetchHours(dayId) });
  };

  const sameSlotFull = mode === "same" && availableSlots && availableSlots.available !== undefined
    && appointments.length >= availableSlots.available;

  const addPatient = () => {
    setAppointments((list) => [...list, emptyAppointment()]);
    setCurrent(appointments.length);
    setErrorField(null);
  };

  const removePatient = (index) => {
    if (appointments.length === 1) {
      setAppointments([emptyAppointment()]);
      return;
    }
    setAppointments((list) => list.filter((_, i) => i !== index));
    setCurrent((c) => Math.max(0, c > index ? c - 1 : Math.min(c, appointments.length - 2)));
    setErrorField(null);
  };

  const fail = (index, field, message) => {
    if (index !== null) {
      setCurrent(index);
      setErrorField({ index, field, message });
    }
    toast(message, "error");
    return false;
  };

  const validateForm = () => {
    if (!selectedEvent) return fail(null, null, "اختر الحدث أولاً");
    if (mode === "same") {
      if (!selectedEventSpecialty) return fail(null, null, "اختر التخصص المشترك");
      if (!selectedDay) return fail(null, null, "اختر اليوم المشترك");
      if (!selectedHour) return fail(null, null, "اختر الساعة المشتركة");
      if (availableSlots && availableSlots.available !== undefined && appointments.length > availableSlots.available) {
        return fail(null, null, `عدد المرضى (${appointments.length}) أكبر من الأماكن المتاحة (${availableSlots.available}). احذف بعضهم أو اختر ساعة أخرى.`);
      }
    }
    for (let i = 0; i < appointments.length; i++) {
      const a = appointments[i];
      const n = `المريض ${i + 1}`;
      if (mode === "different") {
        if (!a.event_specialty_id) return fail(i, "event_specialty_id", `${n}: اختر التخصص`);
        if (!a.day_id) return fail(i, "day_id", `${n}: اختر اليوم`);
        if (!a.hour_id) return fail(i, "hour_id", `${n}: اختر الساعة`);
      }
      if (!a.name) return fail(i, "name", `${n}: اكتب الاسم`);
      if (!a.lastName) return fail(i, "lastName", `${n}: اكتب اللقب`);
      if (!a.birthday) return fail(i, "birthday", `${n}: أدخل تاريخ الميلاد`);
      if (a.sex === "") return fail(i, "sex", `${n}: اختر الجنس`);
      if (!a.state) return fail(i, "state", `${n}: اختر الولاية`);
      if (!a.city) return fail(i, "city", `${n}: اختر البلدية`);
      if (!a.phone) return fail(i, "phone", `${n}: اكتب رقم الهاتف`);
    }
    return true;
  };

  const patientPayload = (a) => ({
    name: a.name,
    lastName: a.lastName,
    birthday: a.birthday,
    state: a.state,
    city: a.city,
    diseases: a.diseases,
    phone: a.phone,
    phone2: a.phone2,
    sex: a.sex,
  });

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setLoading(true);

    let body;
    let endpoint;
    if (mode === "same") {
      body = {
        event_id: selectedEvent.id,
        event_specialty_id: selectedEventSpecialty.id,
        day_id: selectedDay.id,
        hour_id: selectedHour.id,
        appointments: appointments.map(patientPayload),
      };
      endpoint = `${apiUrl}/api/appointments/add-multiple`;
    } else {
      body = {
        event_id: selectedEvent.id,
        appointments: appointments.map((a) => ({
          ...patientPayload(a),
          event_specialty_id: a.event_specialty_id,
          day_id: a.day_id,
          hour_id: a.hour_id,
        })),
      };
      endpoint = `${apiUrl}/api/appointments/add-multiple-different`;
    }

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setResult({ ok: true, requested: appointments.length, ...data });
        setAppointments([emptyAppointment()]);
        setCurrent(0);
        if (mode === "same") checkAvailableSlots();
      } else if (data.duplicate_patients || data.skipped_appointments || data.full_slots) {
        // Nothing was created; show who was refused and why
        setResult({ ok: false, requested: appointments.length, ...data });
      } else {
        toast(data.message || "تعذر تسجيل المواعيد، راجع البيانات ثم أعد المحاولة", "error");
      }
    } catch {
      toast(NETWORK_ERROR, "error");
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------- render

  const specialtyName = (es) => es.specialty?.name || es.name;
  const a = appointments[current] || appointments[0];
  const err = (field) => (errorField && errorField.index === current && errorField.field === field ? errorField.message : undefined);
  const filled = (x) => x.name || x.lastName || x.phone;

  if (mode === "test" && isSuperAdmin) {
    return (
      <div className="max-w-2xl mx-auto">
        <button type="button" onClick={() => changeMode("same")} className="inline-flex items-center gap-1 text-sm text-muted mb-2 min-h-[2.75rem]">
          <ChevronRight className="w-4 h-4" /> رجوع إلى إضافة المرضى
        </button>
        <PageHeader title="المواعيد التجريبية" subtitle={testEventInfo ? `حدث الاختبار: ${testEventInfo.name} (رقم ${TEST_EVENT_ID})` : `حدث الاختبار رقم ${TEST_EVENT_ID}`} />

        <StatStrip
          className="mb-4"
          items={[
            { label: "تخصص في الحدث", value: testSpecialties.length },
            { label: "مريض لكل تخصص", value: TEST_PATIENTS_PER_SPECIALTY },
            { label: "موعد متوقع", value: testSpecialties.length * TEST_PATIENTS_PER_SPECIALTY },
            { label: "موعد تجريبي حالياً", value: counting ? "…" : testAppointmentsCount },
          ]}
        />

        <section className="rounded-2xl border border-red-200 bg-white p-4">
          <h2 className="flex items-center gap-2 font-display text-lg text-red-700 mb-1">
            <AlertTriangle className="w-5 h-5" /> منطقة الاختبار
          </h2>
          <p className="text-sm text-muted mb-4">هذه الأدوات تعمل على حدث الاختبار فقط، ولا تستعملها أثناء قافلة حقيقية.</p>
          <div className="space-y-2">
            <Button block size="lg" icon={Zap} loading={loading && !confirmTest} disabled={loading || !testEventInfo || testSpecialties.length === 0} onClick={handleCreateTestAppointments}>
              أنشئ المواعيد التجريبية
            </Button>
            <Button block variant="secondary" icon={RotateCcw} disabled={loading || testAppointmentsCount === 0} onClick={() => setConfirmTest("reset")}>
              أعد كل الحالات إلى «لم يحضر بعد»
            </Button>
            <Button block variant="danger" icon={Trash2} disabled={loading || testAppointmentsCount === 0} onClick={() => setConfirmTest("delete")}>
              احذف كل المواعيد التجريبية
            </Button>
          </div>
        </section>

        <Sheet
          open={!!confirmTest}
          onClose={() => setConfirmTest(null)}
          title={confirmTest === "delete" ? "حذف المواعيد التجريبية" : "إعادة الحالات"}
          footer={(
            <>
              <Button variant="secondary" className="flex-1" onClick={() => setConfirmTest(null)}>تراجع</Button>
              {confirmTest === "delete" ? (
                <Button variant="danger" icon={Trash2} className="flex-1" loading={loading} onClick={handleDeleteTestAppointments}>احذف</Button>
              ) : (
                <Button icon={RotateCcw} className="flex-1" loading={loading} onClick={handleResetTestAppointments}>أعد الحالات</Button>
              )}
            </>
          )}
        >
          <p className="text-sm text-ink">
            {confirmTest === "delete"
              ? `سيُحذف ${testAppointmentsCount} موعد تجريبي نهائياً، ولا يمكن التراجع عن ذلك.`
              : `ستعود حالة ${testAppointmentsCount} موعد تجريبي إلى «لم يحضر بعد» لبدء تدريب جديد.`}
          </p>
        </Sheet>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-24">
      <PageHeader title="إضافة مواعيد" subtitle="سجّل عدة مرضى دفعة واحدة في حدث نشط" />

      <ChipGroup
        label="طريقة الإضافة"
        value={mode}
        onChange={changeMode}
        className="mb-4"
        options={[
          { value: "same", label: "نفس الموعد للجميع" },
          { value: "different", label: "موعد لكل مريض" },
        ]}
      />

      {/* Event + shared slot */}
      <Panel className="mb-4" title={mode === "same" ? "الحدث والموعد المشترك" : "الحدث"}>
        <div className="space-y-3">
          <Field label="الحدث" hint={activeEvents.length === 0 ? "لا يوجد حدث نشط حالياً." : undefined}>
            <SelectInput
              value={selectedEvent?.id?.toString() || ""}
              onChange={(e) => setSelectedEvent(activeEvents.find((ev) => ev.id === parseInt(e.target.value, 10)) || null)}
            >
              <option value="">اختر حدثاً نشطاً</option>
              {activeEvents.map((ev) => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
            </SelectInput>
          </Field>

          {mode === "same" && (
            <>
              <Field label="التخصص">
                <SelectInput
                  value={selectedEventSpecialty?.id?.toString() || ""}
                  disabled={!selectedEvent}
                  onChange={(e) => setSelectedEventSpecialty(eventSpecialties.find((s) => s.id === parseInt(e.target.value, 10)) || null)}
                >
                  <option value="">اختر تخصصاً</option>
                  {eventSpecialties.map((es) => <option key={es.id} value={es.id}>{specialtyName(es)}</option>)}
                </SelectInput>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="اليوم">
                  <SelectInput
                    value={selectedDay?.id?.toString() || ""}
                    disabled={!selectedEventSpecialty}
                    onChange={(e) => setSelectedDay(days.find((d) => d.id === parseInt(e.target.value, 10)) || null)}
                  >
                    <option value="">اختر</option>
                    {days.map((d) => <option key={d.id} value={d.id}>{d.name || d.day_date}</option>)}
                  </SelectInput>
                </Field>
                <Field label="الساعة">
                  <SelectInput
                    value={selectedHour?.id?.toString() || ""}
                    disabled={!selectedDay}
                    onChange={(e) => setSelectedHour(hours.find((h) => h.id === parseInt(e.target.value, 10)) || null)}
                  >
                    <option value="">اختر</option>
                    {hours.map((h) => <option key={h.id} value={h.id}>{h.time || h.hour}</option>)}
                  </SelectInput>
                </Field>
              </div>
              {availableSlots && (
                <p className={cx("text-sm rounded-xl px-3 py-2",
                  availableSlots.available > 0 ? "bg-paper text-ink" : "bg-red-50 text-red-700")}>
                  الأماكن المتاحة في هذه الساعة:{" "}
                  <span className="font-display text-base">{availableSlots.available}</span> من {availableSlots.total}
                  {availableSlots.available === 0 && "، اختر ساعة أخرى."}
                </p>
              )}
            </>
          )}
        </div>
      </Panel>

      {/* Patients already entered */}
      {appointments.length > 1 && (
        <ol className="bg-white border border-line rounded-2xl divide-y divide-line mb-3">
          {appointments.map((p, i) => (
            <li key={p.key} className={cx("flex items-center gap-2 ps-4 pe-1 min-h-[3rem]", i === current && "bg-ink-faint first:rounded-t-2xl last:rounded-b-2xl")}>
              <span className="font-display text-sm text-muted w-5">{i + 1}</span>
              <button type="button" className="flex-1 min-w-0 text-start min-h-[3rem]" onClick={() => setCurrent(i)}>
                <span className={cx("block truncate", filled(p) ? "text-ink font-semibold" : "text-muted")}>
                  {filled(p) ? `${p.name} ${p.lastName}`.trim() || p.phone : "مريض بلا بيانات بعد"}
                </span>
              </button>
              {i !== current && <IconButton icon={Pencil} label={`عدّل المريض ${i + 1}`} onClick={() => setCurrent(i)} />}
              <IconButton icon={Trash2} label={`احذف المريض ${i + 1}`} className="text-red-700" onClick={() => removePatient(i)} />
            </li>
          ))}
        </ol>
      )}

      {/* Current patient */}
      <Panel
        title={appointments.length > 1 ? `المريض ${current + 1} من ${appointments.length}` : "بيانات المريض"}
        actions={appointments.length === 1 && filled(a) ? (
          <Button variant="ghost" size="sm" icon={RotateCcw} onClick={() => removePatient(0)}>امسح</Button>
        ) : undefined}
      >
        <div className="space-y-3">
          {mode === "different" && (
            <div className="space-y-3 pb-3 border-b border-line">
              <Field label="التخصص" error={err("event_specialty_id")}>
                <SelectInput value={a.event_specialty_id} disabled={!selectedEvent} onChange={(e) => changePatientSpecialty(current, e.target.value)}>
                  <option value="">{selectedEvent ? "اختر تخصصاً" : "اختر الحدث أولاً"}</option>
                  {eventSpecialties.map((es) => <option key={es.id} value={es.id}>{specialtyName(es)}</option>)}
                </SelectInput>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="اليوم" error={err("day_id")}>
                  <SelectInput value={a.day_id} disabled={!a.event_specialty_id} onChange={(e) => changePatientDay(current, e.target.value)}>
                    <option value="">اختر</option>
                    {a._days.map((d) => <option key={d.id} value={d.id}>{d.name || d.day_date}</option>)}
                  </SelectInput>
                </Field>
                <Field label="الساعة" error={err("hour_id")}>
                  <SelectInput value={a.hour_id} disabled={!a.day_id} onChange={(e) => update(current, { hour_id: e.target.value })}>
                    <option value="">اختر</option>
                    {a._hours.map((h) => <option key={h.id} value={h.id}>{h.time || h.hour}</option>)}
                  </SelectInput>
                </Field>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="الاسم" error={err("name")}>
              <TextInput value={a.name} invalid={!!err("name")} onChange={(e) => update(current, { name: e.target.value })} autoComplete="off" />
            </Field>
            <Field label="اللقب" error={err("lastName")}>
              <TextInput value={a.lastName} invalid={!!err("lastName")} onChange={(e) => update(current, { lastName: e.target.value })} autoComplete="off" />
            </Field>
          </div>

          <Field label="تاريخ الميلاد" error={err("birthday")}>
            <TextInput type="date" max={today} value={a.birthday} invalid={!!err("birthday")} onChange={(e) => update(current, { birthday: e.target.value })} />
          </Field>

          <div>
            <span className="block mb-1.5 text-sm font-semibold text-ink">الجنس</span>
            <ChipGroup
              label="الجنس"
              value={a.sex}
              onChange={(v) => update(current, { sex: v })}
              options={[{ value: "0", label: "ذكر" }, { value: "1", label: "أنثى" }]}
            />
            {err("sex") && <span className="block mt-1 text-xs text-red-700">{err("sex")}</span>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="الولاية" error={err("state")}>
              <SelectInput value={a.state} onChange={(e) => update(current, { state: e.target.value, city: "" })}>
                <option value="">اختر</option>
                {WILAYAS.map((w) => <option key={w.code} value={w.name_ar}>{w.code} {w.name_ar}</option>)}
              </SelectInput>
            </Field>
            <Field label="البلدية" error={err("city")}>
              <SelectInput value={a.city} disabled={!a.state} onChange={(e) => update(current, { city: e.target.value })}>
                <option value="">{a.state ? "اختر" : "الولاية أولاً"}</option>
                {communesOf(a.state).map((c) => <option key={c} value={c}>{c}</option>)}
              </SelectInput>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="الهاتف" error={err("phone")}>
              <TextInput type="tel" inputMode="tel" dir="ltr" placeholder="0XXXXXXXXX" value={a.phone} invalid={!!err("phone")} onChange={(e) => update(current, { phone: e.target.value })} />
            </Field>
            <Field label="هاتف ثانٍ" hint="اختياري">
              <TextInput type="tel" inputMode="tel" dir="ltr" placeholder="0XXXXXXXXX" value={a.phone2} onChange={(e) => update(current, { phone2: e.target.value })} />
            </Field>
          </div>

          <Field label="الأمراض المزمنة" hint="اختياري">
            <TextInput value={a.diseases} onChange={(e) => update(current, { diseases: e.target.value })} />
          </Field>
        </div>

        <Button
          variant="secondary"
          block
          icon={UserPlus}
          className="mt-4"
          disabled={mode === "same" && (!selectedHour || sameSlotFull)}
          onClick={addPatient}
        >
          أضف مريضاً آخر
        </Button>
        {mode === "same" && !selectedHour && (
          <p className="mt-2 text-xs text-muted text-center">اختر التخصص واليوم والساعة أولاً لإضافة أكثر من مريض.</p>
        )}
        {sameSlotFull && (
          <p className="mt-2 text-xs text-muted text-center">وصلت إلى عدد الأماكن المتاحة في هذه الساعة.</p>
        )}
      </Panel>

      {isSuperAdmin && (
        <section className="mt-8 rounded-2xl border border-red-200 bg-white p-4">
          <h2 className="flex items-center gap-2 font-semibold text-red-700"><AlertTriangle className="w-5 h-5" /> منطقة الاختبار</h2>
          <p className="text-sm text-muted mt-1 mb-3">إنشاء مواعيد وهمية في حدث الاختبار للتدريب، أو حذفها.</p>
          <Button variant="danger" icon={TestTube2} onClick={() => changeMode("test")}>افتح أدوات المواعيد التجريبية</Button>
        </section>
      )}

      {/* Sticky submit bar, above the tab bar on phones */}
      <div className="fixed inset-x-0 bottom-[4.75rem] lg:bottom-6 lg:ps-24 z-30 px-4 pointer-events-none">
        <div className="max-w-2xl mx-auto flex items-center gap-2 bg-white border border-line rounded-2xl p-2 ps-4 shadow-lg pointer-events-auto">
          <span className="flex-1 text-sm text-muted">
            <span className="font-display text-lg text-ink">{appointments.length}</span> {appointments.length === 1 ? "مريض" : "مرضى"}
          </span>
          <Button size="lg" loading={loading} disabled={mode === "same" && !selectedHour} onClick={handleSubmit}>
            {appointments.length === 1 ? "سجّل المريض" : `سجّل ${appointments.length} مرضى`}
          </Button>
        </div>
      </div>

      {/* Result */}
      <Sheet open={!!result} onClose={() => setResult(null)} title={result?.ok ? "تم التسجيل" : "لم يُسجَّل أي موعد"} footer={<Button block size="lg" onClick={() => setResult(null)}>حسناً</Button>}>
        {result && <ResultReport result={result} />}
      </Sheet>
    </div>
  );
};

/** Created / duplicates / skipped / full-slot report returned by the bulk endpoints. */
function ResultReport({ result }) {
  const created = result.created_count ?? result.appointments?.length ?? (result.ok ? result.requested : 0);
  const duplicates = result.duplicate_patients || [];
  const skipped = result.skipped_appointments || [];
  const full = result.full_slots || [];
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        {result.ok ? <CheckCircle2 className="w-6 h-6 text-st-queue shrink-0" /> : <AlertTriangle className="w-6 h-6 text-red-700 shrink-0" />}
        <div>
          <p className="font-semibold text-ink">{result.message || `تم تسجيل ${created} من ${result.requested}`}</p>
          {result.ok && <p className="text-sm text-muted">سُجِّل {created} من أصل {result.requested_count ?? result.requested} مريض.</p>}
        </div>
      </div>

      {result.patient_ids?.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-ink mb-1">أرقام المرضى</p>
          <p className="text-sm text-ink bg-paper rounded-xl p-3 break-words" dir="ltr">{result.patient_ids.map((id) => `#${id}`).join("  ")}</p>
        </div>
      )}

      {duplicates.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-ink mb-1">لديهم موعد مسبق في هذا التخصص ({duplicates.length})</p>
          <ul className="rounded-xl border border-line divide-y divide-line text-sm">
            {duplicates.map((d, i) => (
              <li key={i} className="flex justify-between gap-2 px-3 py-2">
                <span className="text-ink">{d.name}</span>
                {d.patient_id && <span className="text-muted">#{d.patient_id}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {full.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-ink mb-1">الساعة ممتلئة ({full.length})</p>
          <ul className="rounded-xl border border-line divide-y divide-line text-sm">
            {full.map((f, i) => (
              <li key={i} className="px-3 py-2">
                <span className="text-ink">{f.name}</span>
                <span className="block text-xs text-muted">{f.specialty}{f.time ? `، الساعة ${String(f.time).slice(0, 5)}` : ""}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {skipped.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-ink mb-1">لم يُسجَّلوا ({skipped.length})</p>
          <ul className="rounded-xl border border-line divide-y divide-line text-sm">
            {skipped.map((s, i) => (
              <li key={i} className="px-3 py-2">
                <span className="text-ink">{typeof s === "string" ? s : s.name}</span>
                <span className="block text-xs text-muted">{typeof s === "string" ? "لا توجد أماكن كافية" : s.reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.ok && (result.waiting_message || (result.warning_message && !duplicates.length && !skipped.length && !full.length)) && (
        <p className="text-sm text-st-pushed bg-st-pushed-bg rounded-xl p-3">{result.waiting_message || result.warning_message}</p>
      )}
    </div>
  );
}

export default AddMultipleAppointments;
