import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { RefreshCw, UserRoundPen, AlertTriangle, CheckCircle2, Clock, Eye, Hourglass, CalendarDays, Ticket as TicketIcon } from "lucide-react";
import { apiUrl } from "../../Context/AppContext";
import { Button, Field, TextInput, PriorityBadge, EmptyState, cx } from "../../Components/ui";

const REFRESH_MS = 30000;

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(`${dateStr}T00:00:00`);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("ar-DZ", { weekday: "long", day: "numeric", month: "long" });
};

// 9 digits or more is a phone number (0555 12 34 56, +213...); fewer is a patient number
const isPhone = (value) => value.replace(/\D/g, "").length >= 9;

const formatTime = (timeStr) => (timeStr ? String(timeStr).slice(0, 5) : "");

const peopleBeforeText = (n) => {
  if (n === 1) return "شخص واحد أمامك";
  if (n === 2) return "شخصان أمامك";
  if (n >= 3 && n <= 10) return "أشخاص أمامك";
  return "شخصًا أمامك";
};

/** Today's queue ticket: the number of people before the patient is the hero. */
function InQueueCard({ appt }) {
  const n = Number(appt.people_before);
  const isNow = n === 0;
  return (
    <article className={cx("bg-white border rounded-2xl overflow-hidden", appt.is_priority ? "border-rose" : "border-line")}>
      <header className="flex items-center justify-between gap-2 px-5 pt-4 pb-3">
        <h3 className="font-display text-lg text-ink leading-snug">{appt.specialty}</h3>
        {appt.is_priority && <PriorityBadge />}
      </header>
      {/* perforation */}
      <div className="relative border-t-2 border-dashed border-line" aria-hidden="true">
        <span className="absolute -top-[9px] -start-[9px] w-4 h-4 rounded-full bg-paper border border-line" />
        <span className="absolute -top-[9px] -end-[9px] w-4 h-4 rounded-full bg-paper border border-line" />
      </div>
      <div className={cx("px-5 py-6 text-center", isNow && "bg-st-queue-bg")}>
        {isNow ? (
          <>
            <p className="font-display text-4xl text-st-queue leading-tight">دورك الآن</p>
            <p className="mt-2 text-base text-ink">توجّه إلى قاعة الفحص الخاصة بهذا التخصص</p>
          </>
        ) : (
          <>
            <p className="font-display text-7xl text-ink leading-none" dir="ltr">{n}</p>
            <p className="mt-3 text-lg font-semibold text-ink">{peopleBeforeText(n)}</p>
            {appt.position != null && <p className="mt-1 text-sm text-muted">ترتيبك في الطابور: {appt.position}</p>}
          </>
        )}
      </div>
    </article>
  );
}

const STATE_STYLE = {
  pendingToday: { icon: AlertTriangle, cls: "text-st-pushed", bg: "bg-st-pushed-bg" },
  pending: { icon: CalendarDays, cls: "text-st-pending", bg: "" },
  waiting: { icon: Hourglass, cls: "text-st-hold", bg: "bg-st-hold-bg" },
  dilatation: { icon: Eye, cls: "text-st-dil", bg: "bg-st-dil-bg" },
  completed: { icon: CheckCircle2, cls: "text-st-done", bg: "bg-st-done-bg" },
};

function StateCard({ appt, showDate }) {
  let key = appt.state;
  let message = null;

  switch (appt.state) {
    case "pending":
      if (appt.is_today) {
        key = "pendingToday";
        message = "توجّه إلى الاستقبال لتسجيل حضورك";
      } else {
        message = "موعد محجوز";
      }
      break;
    case "waiting":
      message = "ستُستدعى لهذا التخصص بعد إنهاء التخصص الحالي";
      break;
    case "dilatation":
      message = appt.dilatation_step === "sent" ? "توجّه إلى قاعة التمدد" : "أنت في فترة التمدد، ستعود بأولوية بعد انتهائها";
      break;
    case "completed":
      message = "تم الفحص";
      break;
    default:
      break;
  }
  const style = STATE_STYLE[key] || { icon: Clock, cls: "text-muted", bg: "" };
  const Icon = style.icon;

  return (
    <article className="bg-white border border-line rounded-2xl p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-base text-ink leading-snug">{appt.specialty}</h3>
        {appt.is_priority && appt.state !== "completed" && <PriorityBadge className="shrink-0" />}
      </div>
      {(showDate || appt.time) && (
        <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted">
          {showDate && (
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="w-4 h-4" />
              {formatDate(appt.date)}
            </span>
          )}
          {appt.time && (
            <span className="inline-flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span dir="ltr">{formatTime(appt.time)}</span>
            </span>
          )}
        </div>
      )}
      {message && (
        <p className={cx("mt-3 flex items-start gap-2 rounded-xl px-3 py-2 text-sm font-semibold", style.cls, style.bg || "bg-paper")}>
          <Icon className="w-5 h-5 shrink-0" />
          <span>{message}</span>
        </p>
      )}
    </article>
  );
}

function PatientTurn({ patient, single }) {
  const appointments = patient.appointments || [];
  const todayAppts = appointments.filter((a) => a.is_today);
  const otherAppts = appointments
    .filter((a) => !a.is_today)
    .sort((a, b) => `${a.date} ${a.time || ""}`.localeCompare(`${b.date} ${b.time || ""}`));
  const inQueue = todayAppts.filter((a) => a.state === "in_queue");
  const todayRest = todayAppts.filter((a) => a.state !== "in_queue");

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between gap-2 border-b border-line pb-2">
        {!single && <h2 className="font-display text-xl text-ink">{patient.first_name}</h2>}
        <p className="text-sm text-muted">رقم المريض <span className="font-semibold text-ink" dir="ltr">{patient.patient_id}</span></p>
      </div>

      <section className="space-y-3">
        <h3 className="font-display text-base text-ink">مواعيد اليوم</h3>
        {todayAppts.length === 0 ? (
          <div className="bg-white border border-line rounded-2xl">
            <EmptyState icon={CalendarDays} title="لا توجد مواعيد اليوم">المواعيد القادمة تظهر أسفل هذا القسم.</EmptyState>
          </div>
        ) : (
          <>
            {inQueue.map((a, i) => (
              <InQueueCard key={`q-${a.specialty}-${i}`} appt={a} />
            ))}
            {todayRest.map((a, i) => (
              <StateCard key={`t-${a.specialty}-${i}`} appt={a} showDate={false} />
            ))}
          </>
        )}
      </section>

      {otherAppts.length > 0 && (
        <section className="space-y-3">
          <h3 className="font-display text-base text-ink">مواعيد أخرى</h3>
          {otherAppts.map((a, i) => (
            <StateCard key={`o-${a.specialty}-${a.date}-${i}`} appt={a} showDate />
          ))}
        </section>
      )}
    </div>
  );
}

export default function MyTurn() {
  const { eventId } = useParams();

  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  // Credentials actually used for the current result (kept in memory only).
  const credsRef = useRef(null);
  const inFlightRef = useRef(false);

  const lookup = useCallback(
    async (creds, { silent = false } = {}) => {
      if (!creds || inFlightRef.current) return;
      inFlightRef.current = true;
      if (silent) setRefreshing(true);
      else setLoading(true);
      if (!silent) {
        setError("");
        setFieldErrors({});
      }

      try {
        const res = await fetch(`${apiUrl}/api/public/my-turn`, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ event_id: eventId, ...creds }),
        });

        let data = {};
        try {
          data = await res.json();
        } catch {
          data = {};
        }

        if (res.ok) {
          credsRef.current = creds;
          setResult(data);
          setError("");
          return;
        }

        if (res.status === 404) {
          setError(data.message || "لم يتم العثور على موعد بهذه المعلومات");
          if (!silent) setResult(null);
        } else if (res.status === 422) {
          setFieldErrors(data.errors || {});
          setError(data.message || "يرجى التحقق من المعلومات المدخلة");
          if (!silent) setResult(null);
        } else if (res.status === 429) {
          setError("محاولات كثيرة، يرجى الانتظار دقيقة ثم المحاولة مجددًا");
        } else {
          setError("حدث خطأ، يرجى المحاولة لاحقًا");
        }
      } catch {
        setError("تعذر الاتصال بالخادم، تحقق من اتصالك بالإنترنت");
      } finally {
        inFlightRef.current = false;
        setLoading(false);
        setRefreshing(false);
      }
    },
    [eventId]
  );

  // Auto-refresh every 30s while the tab is visible.
  useEffect(() => {
    if (!result) return undefined;

    const tick = () => {
      if (document.visibilityState === "visible") {
        lookup(credsRef.current, { silent: true });
      }
    };
    const interval = setInterval(tick, REFRESH_MS);

    const onVisibility = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [result, lookup]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const value = query.trim();
    if (!value.replace(/\D/g, "")) {
      setError("يرجى إدخال رقم المريض أو رقم الهاتف");
      return;
    }
    lookup(isPhone(value) ? { phone: value } : { patient_id: value.replace(/\D/g, "") });
  };

  const handleChangePatient = () => {
    credsRef.current = null;
    setResult(null);
    setQuery("");
    setError("");
    setFieldErrors({});
  };

  const patients = result?.patients || [];
  const firstError = (key) => {
    const v = fieldErrors[key];
    return Array.isArray(v) ? v[0] : v;
  };
  const queryError = firstError("patient_id") || firstError("phone");

  return (
    <div dir="rtl" className="staff-app min-h-screen">
      <div className={cx("mx-auto w-full px-4 py-6 lg:py-10", result ? (patients.length > 1 ? "max-w-6xl" : "max-w-2xl") : "max-w-md")}>
        {!result ? (
          <div className="bg-white border border-line rounded-2xl p-5 lg:p-8">
            <div className="mb-5 text-center">
              <TicketIcon className="w-10 h-10 mx-auto mb-2 text-ink" />
              <h1 className="font-display text-2xl text-ink">اعرف دورك</h1>
              <p className="mt-1 text-sm text-muted">أدخل رقم المريض المكتوب على وصل الحجز، أو رقم الهاتف الذي حجزت به.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <Field label="رقم المريض أو رقم الهاتف" error={queryError} hint="رقم الهاتف يعرض كل المرضى الذين حُجز لهم بهذا الرقم">
                <TextInput
                  id="query"
                  type="text"
                  inputMode="tel"
                  autoComplete="off"
                  value={query}
                  onChange={(e) => setQuery(e.target.value.replace(/[^\d+\s]/g, ""))}
                  invalid={!!queryError}
                  className="h-14 text-xl text-center"
                  dir="ltr"
                />
              </Field>

              {error && (
                <p role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </p>
              )}

              <Button type="submit" size="lg" block icon={TicketIcon} loading={loading} className="h-14 text-lg">
                {loading ? "جاري البحث..." : "اعرف دورك"}
              </Button>
            </form>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <h1 className="font-display text-2xl text-ink">
                {patients.length === 1 ? `مرحبًا ${patients[0].first_name}` : `${patients.length} مرضى بهذا الرقم`}
              </h1>
              {result.event?.name && <p className="mt-1 text-sm text-muted">{result.event.name}</p>}
            </div>

            {error && (
              <p role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
                <span>{error}</span>
              </p>
            )}

            <div className={cx("grid gap-8", patients.length > 1 && "md:grid-cols-2 xl:grid-cols-3")}>
              {patients.map((p) => (
                <PatientTurn key={p.patient_id} patient={p} single={patients.length === 1} />
              ))}
            </div>

            <p className="text-center text-xs text-muted">
              آخر تحديث <span dir="ltr">{result.checked_at}</span>. تتحدّث الصفحة وحدها كل 30 ثانية.
            </p>

            <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
              <Button
                size="lg"
                icon={RefreshCw}
                loading={refreshing}
                onClick={() => lookup(credsRef.current, { silent: true })}
              >
                حدّث الآن
              </Button>
              <Button size="lg" variant="secondary" icon={UserRoundPen} onClick={handleChangePatient}>
                مريض آخر
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
