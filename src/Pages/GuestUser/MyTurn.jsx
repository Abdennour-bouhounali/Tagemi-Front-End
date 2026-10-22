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

export default function MyTurn() {
  const { eventId } = useParams();

  const [patientId, setPatientId] = useState("");
  const [phone, setPhone] = useState("");
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
          body: JSON.stringify({
            event_id: eventId,
            patient_id: creds.patientId,
            phone: creds.phone,
          }),
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
    const pid = patientId.trim();
    const ph = phone.trim();
    if (!pid || !ph) {
      setError("يرجى إدخال رقم المريض ورقم الهاتف");
      return;
    }
    lookup({ patientId: pid, phone: ph });
  };

  const handleChangePatient = () => {
    credsRef.current = null;
    setResult(null);
    setPatientId("");
    setPhone("");
    setError("");
    setFieldErrors({});
  };

  const appointments = result?.appointments || [];
  const todayAppts = appointments.filter((a) => a.is_today);
  const otherAppts = appointments
    .filter((a) => !a.is_today)
    .sort((a, b) => `${a.date} ${a.time || ""}`.localeCompare(`${b.date} ${b.time || ""}`));
  const inQueue = todayAppts.filter((a) => a.state === "in_queue");
  const todayRest = todayAppts.filter((a) => a.state !== "in_queue");

  const firstError = (key) => {
    const v = fieldErrors[key];
    return Array.isArray(v) ? v[0] : v;
  };

  return (
    <div dir="rtl" className="staff-app min-h-screen">
      <div className="mx-auto w-full max-w-md px-4 py-6">
        {!result ? (
          <div className="bg-white border border-line rounded-2xl p-5">
            <div className="mb-5 text-center">
              <TicketIcon className="w-10 h-10 mx-auto mb-2 text-ink" />
              <h1 className="font-display text-2xl text-ink">اعرف دورك</h1>
              <p className="mt-1 text-sm text-muted">أدخل رقم المريض المكتوب على وصل الحجز، ورقم الهاتف الذي سجّلت به.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <Field label="رقم المريض" error={firstError("patient_id")}>
                <TextInput
                  id="patient_id"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="off"
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value.replace(/\D/g, ""))}
                  invalid={!!firstError("patient_id")}
                  className="h-14 text-xl text-center"
                  dir="ltr"
                />
              </Field>

              <Field label="رقم الهاتف" error={firstError("phone")}>
                <TextInput
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  invalid={!!firstError("phone")}
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
              <h1 className="font-display text-2xl text-ink">مرحبًا {result.first_name}</h1>
              {result.event?.name && <p className="mt-1 text-sm text-muted">{result.event.name}</p>}
              <p className="mt-1 text-sm text-muted">رقم المريض <span className="font-semibold text-ink" dir="ltr">{result.patient_id}</span></p>
            </div>

            {error && (
              <p role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
                <span>{error}</span>
              </p>
            )}

            <section className="space-y-3">
              <h2 className="font-display text-base text-ink">مواعيد اليوم</h2>
              {todayAppts.length === 0 ? (
                <div className="bg-white border border-line rounded-2xl">
                  <EmptyState icon={CalendarDays} title="لا توجد مواعيد لك اليوم">مواعيدك القادمة تظهر أسفل هذه الصفحة.</EmptyState>
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
                <h2 className="font-display text-base text-ink">مواعيد أخرى</h2>
                {otherAppts.map((a, i) => (
                  <StateCard key={`o-${a.specialty}-${a.date}-${i}`} appt={a} showDate />
                ))}
              </section>
            )}

            <p className="text-center text-xs text-muted">
              آخر تحديث <span dir="ltr">{result.checked_at}</span>. تتحدّث الصفحة وحدها كل 30 ثانية.
            </p>

            <div className="grid grid-cols-2 gap-3">
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
