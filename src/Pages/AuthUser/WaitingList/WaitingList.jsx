import { API_BASE_URL } from '../../../config/environment';
import { useEffect, useState, useContext, useRef } from 'react';
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowRight, RefreshCw, Maximize, Minimize, Eye, EyeOff, SlidersHorizontal, X, Lock, Users } from 'lucide-react';
import { AppContext } from "../../../Context/AppContext";

const apiUrl = API_BASE_URL;

// Hall screen: up to N specialty columns at once (chosen per screen, 1 to 7),
// otherwise several views shown in turn, or picked by hand
const DEFAULT_COLUMNS = 5;
const COLUMN_CHOICES = [1, 2, 3, 4, 5, 6, 7];
const ROTATION_MS = 10000;
const REFRESH_MS = 10000;
// Names listed per queue: one number for every specialty, which a specialty
// may override (settings drawer, kept per screen). Every column of a view keeps
// as many rows as the longest list so names line up and keep the same size.
const DEFAULT_ROWS = 10;
const ROW_CHOICES = [3, 5, 8, 10, 12, 15, 20, 25, 30];
const validRows = (n) => (ROW_CHOICES.includes(Number(n)) ? Number(n) : null);
// Toolbar (and the cursor in full screen) fade out after this much stillness
const IDLE_MS = 3000;

// Display settings are kept per device (each screen shows its own specialties)
const settingsKey = (eventId) => `hall-screen:${eventId}`;
const loadSettings = (eventId) => {
  try {
    return JSON.parse(localStorage.getItem(settingsKey(eventId))) || {};
  } catch {
    return {};
  }
};

const getPatientSex = (patient) => {
  const sex = String(patient?.sex ?? '').toLowerCase().trim();
  if (sex === '0' || sex === 'ذكر' || sex === 'm' || sex === 'male') return 'male';
  if (sex === '1' || sex === 'أنثى' || sex === 'f' || sex === 'female') return 'female';
  return 'unknown';
};

const isPushedDown = (patient) => patient.is_coming_soon || patient.status === 'Commingsoon';

const algiersClock = () => new Date().toLocaleTimeString('ar-DZ', {
  timeZone: 'Africa/Algiers', hour: '2-digit', minute: '2-digit', hour12: false,
});

/** Small sex mark at the start of a row (also explained in the legend). */
function SexDot({ patient }) {
  const sex = getPatientSex(patient);
  const color = sex === 'male' ? 'bg-[#2F6FD6]' : sex === 'female' ? 'bg-[#D6457A]' : 'bg-line';
  return <span aria-hidden className={`shrink-0 rounded-full ${color}`} style={{ width: '0.45em', height: '0.45em' }} />;
}

function ToolButton({ label, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="w-11 h-11 grid place-items-center rounded-full text-ink hover:bg-ink-faint transition-colors"
    >
      {children}
    </button>
  );
}

/**
 * Hall screen (قائمة الانتظار الكبيرة), shown on a TV / projector so visitors
 * read their names from far away. One column per open specialty with its first
 * visitors (10 by default, set per screen). Visitors with a doctor (دخل) show on top in violet «عند الطبيب»
 * until they pass (إجتاز); the next in line, one per free doctor, shows in green
 * «تفضل بالدخول»; a visitor pushed down shows in amber. Everything but the lists can be hidden.
 */
const WaitingList = () => {
  const { eventId } = useParams();
  const { user } = useContext(AppContext);
  const navigate = useNavigate();
  const location = useLocation();
  // Back to the page the user came from; home only if this page was opened directly
  const goBack = () => (location.key === 'default' ? navigate('/') : navigate(-1));

  const [event, setEvent] = useState(null);
  const [allSpecialities, setAllSpecialities] = useState([]);
  const [waitingList, setWaitingList] = useState({});
  // Visitors with a doctor now (دخل): shown on top «عند الطبيب» until they pass (إجتاز)
  const [calling, setCalling] = useState({});
  // Specialties that take no new visitors now (doctors left / count reached)
  const [closedIds, setClosedIds] = useState([]);
  // Whole queue length per specialty (only the first ones are listed)
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [sexFilter, setSexFilter] = useState('all'); // 'all', 'male', 'female'
  // More than 5 specialties don't fit on the hall screen: show them in views
  // that take turns every 10 seconds ('auto') or the one picked ('manual').
  const [groupIndex, setGroupIndex] = useState(() => loadSettings(eventId).view || 0);
  const [displayMode, setDisplayMode] = useState(() => loadSettings(eventId).mode || 'auto');
  // Specialties this screen shows; empty = all of them
  const [selectedIds, setSelectedIds] = useState(() => loadSettings(eventId).specialties || []);
  // Header and footer can be hidden to leave only the lists
  const [showInfo, setShowInfo] = useState(() => loadSettings(eventId).controls !== false);
  // Specialties side by side on this screen (more = smaller text)
  const [maxColumns, setMaxColumns] = useState(() => {
    const n = Number(loadSettings(eventId).columns);
    return COLUMN_CHOICES.includes(n) ? n : DEFAULT_COLUMNS;
  });
  // Names can be hidden (privacy): the visitor number always shows
  const [showNames, setShowNames] = useState(() => loadSettings(eventId).names !== false);
  // How many names each list shows: all specialties, and per-specialty exceptions
  const [rowsAll, setRowsAll] = useState(() => validRows(loadSettings(eventId).rows) || DEFAULT_ROWS);
  const [rowsBySpecialty, setRowsBySpecialty] = useState(() => {
    const saved = loadSettings(eventId).rowsBy || {};
    return Object.fromEntries(Object.entries(saved).filter(([, n]) => validRows(n)).map(([id, n]) => [id, Number(n)]));
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [clock, setClock] = useState(algiersClock);
  const [idle, setIdle] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(settingsKey(eventId), JSON.stringify({
        mode: displayMode, view: groupIndex, specialties: selectedIds, controls: showInfo, columns: maxColumns, names: showNames,
        rows: rowsAll, rowsBy: rowsBySpecialty,
      }));
    } catch {
      // Private mode / storage blocked: settings just won't be remembered
    }
  }, [eventId, displayMode, groupIndex, selectedIds, showInfo, maxColumns, showNames, rowsAll, rowsBySpecialty]);

  const rowsFor = (id) => rowsBySpecialty[id] ?? rowsAll;
  // n = null: the specialty follows the number for all
  const setSpecialtyRows = (id, n) => setRowsBySpecialty((prev) => ({
    ...Object.fromEntries(Object.entries(prev).filter(([key]) => key !== String(id))),
    ...(n ? { [id]: n } : {}),
  }));
  // The server sends as many names as the longest list needs (read by the 10 s refresh)
  const fetchLimit = Math.max(rowsAll, ...Object.values(rowsBySpecialty));
  const fetchLimitRef = useRef(fetchLimit);
  fetchLimitRef.current = fetchLimit;

  // Full screen for the hall TV/laptop (the browser's own Esc also leaves it)
  const [isFullscreen, setIsFullscreen] = useState(() => !!document.fullscreenElement);
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);
  const toggleFullscreen = () => {
    const request = document.fullscreenElement
      ? document.exitFullscreen()
      : document.documentElement.requestFullscreen?.();
    request?.catch?.((err) => console.error('Fullscreen error:', err));
  };

  // Clock in the header
  useEffect(() => {
    const timer = setInterval(() => setClock(algiersClock()), 15000);
    return () => clearInterval(timer);
  }, []);

  // Toolbar fades out (and the cursor hides in full screen) when nobody moves the mouse
  const idleTimer = useRef(null);
  useEffect(() => {
    const wake = () => {
      setIdle(false);
      clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => setIdle(true), IDLE_MS);
    };
    wake();
    window.addEventListener('pointermove', wake);
    window.addEventListener('keydown', wake);
    return () => {
      clearTimeout(idleTimer.current);
      window.removeEventListener('pointermove', wake);
      window.removeEventListener('keydown', wake);
    };
  }, []);

  const toggleSpecialty = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    setGroupIndex(0);
  };

  // Fetch event details (PUBLIC)
  async function getEventDetails() {
    try {
      const res = await fetch(`${apiUrl}/api/public/events/${eventId}`);
      if (!res.ok) {
        setError('فشل في تحميل تفاصيل الحدث');
        return;
      }
      const data = await res.json();
      setEvent(data.event || data);
    } catch (err) {
      console.error('Error fetching event:', err);
      setError('حدث خطأ أثناء تحميل تفاصيل الحدث');
    }
  }

  // Fetch waiting list for specific event (PUBLIC)
  async function getWaitingList() {
    try {
      const res = await fetch(`${apiUrl}/api/public/waitinglist?event_id=${eventId}&limit=${fetchLimitRef.current}`);
      if (!res.ok) {
        setError('فشل في تحميل قائمة الإنتظار');
        return;
      }
      const data = await res.json();
      setCalling(data.calling || {});
      setClosedIds(data.closed_specialties || []);
      setCounts(data.counts || {});
      setWaitingList(data.data || {});
      setLastUpdated(new Date());
      setError("");
    } catch (err) {
      console.error('Error fetching waiting list:', err);
      setError('تعذر الاتصال، يُعاد المحاولة تلقائياً');
    }
  }

  // Fetch specialities for this event (PUBLIC)
  async function getEventSpecialities() {
    try {
      const res = await fetch(`${apiUrl}/api/public/events/${eventId}/specialties`);
      if (!res.ok) return;
      const data = await res.json();

      const uniqueSpecialties = [];
      const seenIds = new Set();
      (data.event_specialties || []).forEach((es) => {
        if (es.specialty && !seenIds.has(es.specialty.id)) {
          seenIds.add(es.specialty.id);
          uniqueSpecialties.push({ ...es.specialty, queue_open: es.queue_open });
        }
      });
      setAllSpecialities(uniqueSpecialties.filter((s) => s.name !== 'NoSpeciality'));
    } catch (err) {
      console.error('Error fetching specialities:', err);
      setError('حدث خطأ أثناء تحميل التخصصات');
    } finally {
      setLoading(false);
    }
  }

  // Initial load, then every 10 seconds
  useEffect(() => {
    if (!eventId) return undefined;
    setLoading(true);
    getEventDetails();
    getEventSpecialities();
    getWaitingList();
    const interval = setInterval(() => {
      getWaitingList();
      getEventSpecialities();
    }, REFRESH_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  // A longer list was asked for: fetch it now rather than at the next refresh
  const firstLimit = useRef(true);
  useEffect(() => {
    if (firstLimit.current) { firstLimit.current = false; return; }
    getWaitingList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchLimit]);

  const bySex = (patient) => sexFilter === 'all' || getPatientSex(patient) === sexFilter;
  const queueOf = (id) => (waitingList[id] || []).filter(bySex);
  const callingFor = (id) => (calling[id] || []).filter(bySex);

  // Only specialties opened today (doctor present), or still finishing their queue,
  // and only those chosen for this screen
  const isActive = (s) => s.queue_open || (waitingList[s.id] || []).length > 0;
  const specialities = allSpecialities.filter((s) => isActive(s) && (selectedIds.length === 0 || selectedIds.includes(s.id)));
  const groupCount = Math.max(1, Math.ceil(specialities.length / maxColumns));
  const groupSize = Math.ceil(specialities.length / groupCount);
  const specialtyGroups = Array.from({ length: groupCount }, (_, i) => specialities.slice(i * groupSize, (i + 1) * groupSize));
  const currentGroup = groupIndex % specialtyGroups.length;
  const visibleSpecialities = specialtyGroups[currentGroup] || [];
  const rotating = displayMode === 'auto' && specialtyGroups.length > 1;

  useEffect(() => {
    if (!rotating) return undefined;
    const rotation = setInterval(() => setGroupIndex((i) => (i + 1) % specialtyGroups.length), ROTATION_MS);
    return () => clearInterval(rotation);
  }, [rotating, specialtyGroups.length]);

  // Same number of rows in every column (longest list + the most "with the doctor" of the view)
  const callingRows = Math.max(0, ...visibleSpecialities.map((s) => callingFor(s.id).length));
  const queueRows = Math.max(1, ...visibleSpecialities.map((s) => rowsFor(s.id)));
  const rows = queueRows + callingRows;
  // Text height follows the row height (and the column width for long names)
  // (5.4cqw keeps a long 3-word name, the place and the number on one line;
  // numbers alone are short, so they may grow wider)
  const rowFont = `min(${(showNames ? 44 : 52) / rows}cqh, ${showNames ? 5.4 : 12}cqw)`;
  // The sex filter only applies to the listed names: counts are then of the list
  const countOf = (id) => (sexFilter === 'all' ? counts[id] ?? queueOf(id).length : queueOf(id).length);
  const totalWaiting = specialities.reduce((sum, s) => sum + countOf(s.id), 0);

  if (loading) {
    return (
      <div className="fixed inset-0 z-[60] bg-ink flex items-center justify-center" dir="rtl">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-white/20 border-t-white mx-auto mb-6" />
          <p className="font-display text-2xl">جاري تحميل قائمة الانتظار…</p>
        </div>
      </div>
    );
  }

  const chip = (active) => `px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
    active ? 'bg-ink text-white border-ink' : 'bg-white text-ink border-line hover:bg-ink-faint'
  }`;

  return (
    <div
      dir="rtl"
      className={`fixed inset-0 z-[60] flex flex-col bg-paper font-ui text-ink ${isFullscreen && idle ? 'cursor-none' : ''}`}
    >
      {/* ------------------------------------------------ header (hideable) */}
      {showInfo && (
        <header className="shrink-0 bg-ink text-white flex items-center gap-[2vw] px-[2vw]" style={{ height: 'clamp(4rem, 10vh, 7.5rem)' }}>
          <div className="flex items-center gap-[1vw] min-w-0 flex-1">
            <img src="/tagemi_logo.png" alt="" className="w-auto bg-white rounded-xl p-1.5 shrink-0" style={{ height: 'clamp(2.75rem, 7vh, 5rem)' }} />
            <div className="min-w-0">
              <h1 className="font-display font-bold leading-tight" style={{ fontSize: 'clamp(1.4rem, 2.6vw, 3.25rem)' }}>قائمة الانتظار</h1>
              <p className="text-white/70 truncate" style={{ fontSize: 'clamp(0.9rem, 1.25vw, 1.6rem)' }}>{event?.name || ''}</p>
            </div>
          </div>

          {/* Legend: read once, from far away */}
          <div className="hidden md:flex items-center gap-[1.5vw] text-white/90" style={{ fontSize: 'clamp(0.85rem, 1.1vw, 1.4rem)' }}>
            <span className="flex items-center gap-2"><span className="w-[1em] h-[1em] rounded-md bg-st-visit" />عند الطبيب</span>
            <span className="flex items-center gap-2"><span className="w-[1em] h-[1em] rounded-md bg-st-queue" />تفضل بالدخول</span>
            <span className="flex items-center gap-2"><span className="w-[1em] h-[1em] rounded-md bg-st-pushed" />سيُنادى بعد قليل</span>
            <span className="flex items-center gap-2"><span className="w-[0.6em] h-[0.6em] rounded-full bg-[#2F6FD6]" />ذكر</span>
            <span className="flex items-center gap-2"><span className="w-[0.6em] h-[0.6em] rounded-full bg-[#D6457A]" />أنثى</span>
          </div>

          <div className="text-left shrink-0">
            <p dir="ltr" className="font-display font-bold tabular-nums leading-none" style={{ fontSize: 'clamp(1.8rem, 3.6vw, 4.5rem)' }}>{clock}</p>
            <p className="text-white/60 mt-1 flex items-center justify-end gap-1.5" style={{ fontSize: 'clamp(0.75rem, 0.9vw, 1.1rem)' }}>
              <span className={`inline-block w-2 h-2 rounded-full ${error ? 'bg-rose' : 'bg-st-queue animate-pulse'}`} />
              {error ? 'إعادة الاتصال…' : `${totalWaiting} في الانتظار`}
            </p>
          </div>
        </header>
      )}

      {/* Views taking turns: how long until the next one */}
      {specialtyGroups.length > 1 && (
        <div className="shrink-0 h-1.5 bg-ink-faint relative overflow-hidden">
          {rotating && (
            <div key={`${currentGroup}-${specialtyGroups.length}`} className="absolute inset-y-0 right-0 bg-ink-soft hall-progress" style={{ animationDuration: `${ROTATION_MS}ms` }} />
          )}
        </div>
      )}

      {/* --------------------------------------------------- the lists */}
      <main className="flex-1 min-h-0 p-[1.2vw]">
        {visibleSpecialities.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center gap-4 text-muted">
            <Users className="w-[8vw] h-[8vw] max-w-32 max-h-32 text-line" />
            <p className="font-display font-bold text-ink" style={{ fontSize: 'clamp(1.5rem, 3vw, 3.5rem)' }}>
              {selectedIds.length > 0 ? 'لا يوجد تخصص مفتوح من التخصصات المختارة' : 'لا يوجد تخصص مفتوح حالياً'}
            </p>
            <p style={{ fontSize: 'clamp(1rem, 1.6vw, 2rem)' }}>تظهر القوائم هنا عند وصول الأطباء وتسجيل حضور الزوار</p>
          </div>
        ) : (
          <div className="h-full grid gap-[1.2vw]" style={{ gridTemplateColumns: `repeat(${visibleSpecialities.length}, minmax(0, 1fr))` }}>
            {visibleSpecialities.map((speciality) => {
              const listed = rowsFor(speciality.id);
              const queue = queueOf(speciality.id).slice(0, listed);
              const called = callingFor(speciality.id);
              const closed = closedIds.includes(speciality.id);
              return (
                <section key={speciality.id} className="min-h-0 flex flex-col rounded-[1.25vw] bg-white border border-line overflow-hidden" style={{ containerType: 'inline-size' }}>
                  <div className="shrink-0 bg-ink-soft text-white px-[5cqw] py-[3.5cqw] flex items-center gap-[3cqw]">
                    <h2 className="flex-1 min-w-0 font-display font-bold leading-[1.15] line-clamp-2" style={{ fontSize: 'min(8cqw, 3rem)' }}>{speciality.name}</h2>
                    <span className="shrink-0 rounded-full bg-white/15 font-bold tabular-nums px-[3cqw] py-[1cqw]" style={{ fontSize: 'min(6cqw, 2rem)' }} title="عدد الزوار في الطابور">{countOf(speciality.id)}</span>
                  </div>
                  {closed && (
                    <div className="shrink-0 bg-rose text-white font-bold flex items-center gap-[2cqw] px-[5cqw] py-[2cqw]" style={{ fontSize: 'min(4.6cqw, 1.6rem)' }}>
                      <Lock className="shrink-0" style={{ width: '1em', height: '1em' }} />
                      <span>مغلق: يُفحص فقط من في القائمة</span>
                    </div>
                  )}

                  {/* Rows share the height evenly; names size to the row and the column */}
                  <ol className="flex-1 min-h-0 flex flex-col" style={{ containerType: 'size' }}>
                    {Array.from({ length: callingRows }).map((_, i) => {
                      // Visitors with the doctor sit at the bottom of the violet block, right above the queue
                      const patient = called[i - (callingRows - called.length)];
                      return (
                        <li key={`c${i}`} className={`flex-1 min-h-0 flex items-center gap-[3cqw] px-[4cqw] border-b border-line/70 ${patient ? 'bg-st-visit-bg text-st-visit' : ''}`} style={{ fontSize: rowFont }}>
                          {patient && (<>
                            <span className="shrink-0 rounded-lg bg-st-visit text-white font-bold px-[0.4em] py-[0.1em]" style={{ fontSize: '0.55em' }}>عند الطبيب</span>
                            {showNames ? (<>
                              <span className="flex-1 min-w-0 font-display font-bold truncate">{patient.full_name}</span>
                              <span className="shrink-0 font-display font-bold tabular-nums" style={{ fontSize: '0.75em' }}>{patient.patient_id}</span>
                            </>) : (
                              <span className="flex-1 min-w-0 font-display font-bold tabular-nums">{patient.patient_id}</span>
                            )}
                          </>)}
                        </li>
                      );
                    })}
                    {Array.from({ length: queueRows }).map((_, i) => {
                      const patient = queue[i];
                      const position = i + 1;
                      // Past this specialty's own count: blank filler so rows line up with the other columns
                      if (position > listed) {
                        return <li key={`q${i}`} className="flex-1 min-h-0" style={{ fontSize: rowFont }} />;
                      }
                      const pushed = patient && isPushedDown(patient);
                      // Next in line while a doctor is free (after the previous one passed)
                      const invited = patient && !pushed && patient.invited;
                      return (
                        <li
                          key={`q${i}`}
                          className={`flex-1 min-h-0 flex items-center gap-[3cqw] px-[4cqw] border-b border-line/70 last:border-b-0 ${invited ? 'bg-st-queue text-white animate-pulse' : pushed ? 'bg-st-pushed-bg' : position % 2 === 0 ? 'bg-paper/60' : ''}`}
                          style={{ fontSize: rowFont }}
                        >
                          <span
                            className={`shrink-0 grid place-items-center rounded-full font-display font-bold tabular-nums ${
                              patient ? (invited ? 'bg-white text-st-queue' : pushed ? 'bg-st-pushed text-white' : position === 1 ? 'bg-ink text-white' : 'bg-ink-faint text-ink') : 'text-line'
                            }`}
                            style={{ width: '1.6em', height: '1.6em', fontSize: '0.75em' }}
                          >
                            {position}
                          </span>
                          {patient ? (<>
                            {invited ? (
                              <span className="shrink-0 rounded-lg bg-white text-st-queue font-bold px-[0.4em] py-[0.1em]" style={{ fontSize: '0.55em' }}>تفضل بالدخول</span>
                            ) : (
                              <SexDot patient={patient} />
                            )}
                            {showNames ? (<>
                              <span className={`flex-1 min-w-0 font-display font-bold truncate ${invited ? 'text-white' : pushed ? 'text-st-pushed' : 'text-ink'}`}>{patient.full_name}</span>
                              <span className={`shrink-0 font-display font-bold tabular-nums ${invited ? 'text-white' : pushed ? 'text-st-pushed' : 'text-ink-soft'}`} style={{ fontSize: '0.75em' }}>{patient.patient_id}</span>
                            </>) : (
                              <span className={`flex-1 min-w-0 font-display font-bold tabular-nums ${invited ? 'text-white' : pushed ? 'text-st-pushed' : 'text-ink'}`}>{patient.patient_id}</span>
                            )}
                          </>) : (
                            <span className="flex-1" />
                          )}
                        </li>
                      );
                    })}
                  </ol>
                </section>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer: views and last update (hidden with the header) */}
      {showInfo && (
        <footer className="shrink-0 flex items-center justify-between gap-4 px-[2vw] pb-[0.8vw] text-muted" style={{ fontSize: 'clamp(0.8rem, 1vw, 1.25rem)' }}>
          <span>{lastUpdated ? `آخر تحديث ${lastUpdated.toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })} · يتحدث تلقائياً كل 10 ثوانٍ` : ''}</span>
          {specialtyGroups.length > 1 && (
            <span className="flex items-center gap-2">
              {specialtyGroups.map((_, i) => (
                <span key={i} className={`inline-block rounded-full ${i === currentGroup ? 'w-6 h-2.5 bg-ink' : 'w-2.5 h-2.5 bg-line'}`} />
              ))}
              <span className="ms-2">العرض {currentGroup + 1} من {specialtyGroups.length}</span>
            </span>
          )}
        </footer>
      )}

      {/* --------------------------------- floating toolbar (fades when idle) */}
      <div
        className={`fixed bottom-[1.5vw] left-1/2 -translate-x-1/2 z-[70] flex items-center gap-1 rounded-full bg-white/95 border border-line p-1.5 shadow-lg transition-opacity duration-500 ${
          idle && !settingsOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        {user && (
          <ToolButton label="رجوع" onClick={goBack}><ArrowRight className="w-5 h-5" /></ToolButton>
        )}
        <ToolButton label="الإعدادات" onClick={() => setSettingsOpen(true)}><SlidersHorizontal className="w-5 h-5" /></ToolButton>
        <ToolButton label={showInfo ? 'إخفاء الشريط والمعلومات' : 'إظهار الشريط والمعلومات'} onClick={() => setShowInfo(!showInfo)}>
          {showInfo ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </ToolButton>
        <ToolButton label="تحديث" onClick={getWaitingList}><RefreshCw className="w-5 h-5" /></ToolButton>
        {document.fullscreenEnabled && (
          <ToolButton label={isFullscreen ? 'الخروج من ملء الشاشة' : 'ملء الشاشة'} onClick={toggleFullscreen}>
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </ToolButton>
        )}
      </div>

      {/* ------------------------------------------------ settings drawer */}
      {settingsOpen && (
        <div className="fixed inset-0 z-[80] flex" onClick={() => setSettingsOpen(false)}>
          <aside
            className="w-full max-w-md h-full bg-white shadow-2xl overflow-y-auto p-6 space-y-6"
            onClick={(e) => e.stopPropagation()}
            aria-label="إعدادات الشاشة"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold">إعدادات هذه الشاشة</h2>
              <ToolButton label="إغلاق" onClick={() => setSettingsOpen(false)}><X className="w-5 h-5" /></ToolButton>
            </div>
            <p className="text-sm text-muted">تُحفظ على هذا الجهاز فقط، فيمكن لكل شاشة في القاعة عرض تخصصات مختلفة.</p>

            <fieldset className="space-y-2">
              <legend className="font-semibold mb-2">الجنس</legend>
              <div className="flex flex-wrap gap-2">
                {[['all', 'الكل'], ['male', 'ذكور'], ['female', 'إناث']].map(([value, label]) => (
                  <button key={value} type="button" className={chip(sexFilter === value)} onClick={() => setSexFilter(value)}>{label}</button>
                ))}
              </div>
            </fieldset>

            <fieldset className="space-y-2">
              <legend className="font-semibold mb-2">عدد التخصصات في الشاشة</legend>
              <div className="flex flex-wrap gap-2">
                {COLUMN_CHOICES.map((n) => (
                  <button key={n} type="button" className={`${chip(maxColumns === n)} min-w-[2.75rem]`}
                    onClick={() => { setMaxColumns(n); setGroupIndex(0); }}>{n}</button>
                ))}
              </div>
              <p className="text-xs text-muted">كلما زاد العدد صغر الخط. التخصصات الزائدة تظهر في عرض آخر.</p>
            </fieldset>

            <fieldset className="space-y-2">
              <legend className="font-semibold mb-2">عدد الأسماء في كل قائمة</legend>
              <div className="flex flex-wrap gap-2">
                {ROW_CHOICES.map((n) => (
                  <button key={n} type="button" className={`${chip(rowsAll === n)} min-w-[2.75rem]`} onClick={() => setRowsAll(n)}>{n}</button>
                ))}
              </div>
              <p className="text-xs text-muted">لكل التخصصات. كلما زاد العدد صغر الخط.</p>
              {allSpecialities.length > 0 && (
                <details className="rounded-2xl border border-line" open={Object.keys(rowsBySpecialty).length > 0}>
                  <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold">
                    عدد خاص بتخصص{Object.keys(rowsBySpecialty).length > 0 ? ` (${Object.keys(rowsBySpecialty).length})` : ''}
                  </summary>
                  <div className="px-4 pb-3 space-y-2">
                    {allSpecialities.map((s) => (
                      <label key={s.id} className="flex items-center gap-3 text-sm">
                        <span className="flex-1 min-w-0 truncate">{s.name}</span>
                        <select
                          className="h-10 rounded-xl border border-line bg-white px-2 text-sm"
                          value={rowsBySpecialty[s.id] ?? ''}
                          onChange={(e) => setSpecialtyRows(s.id, validRows(e.target.value))}
                          aria-label={`عدد الأسماء في قائمة ${s.name}`}
                        >
                          <option value="">مثل الكل ({rowsAll})</option>
                          {ROW_CHOICES.map((n) => <option key={n} value={n}>{n}</option>)}
                        </select>
                      </label>
                    ))}
                  </div>
                </details>
              )}
            </fieldset>

            <fieldset className="space-y-2">
              <legend className="font-semibold mb-2">أسماء الزوار</legend>
              <div className="flex flex-wrap gap-2">
                <button type="button" className={chip(showNames)} onClick={() => setShowNames(true)}>الاسم والرقم</button>
                <button type="button" className={chip(!showNames)} onClick={() => setShowNames(false)}>الرقم فقط</button>
              </div>
              <p className="text-xs text-muted">رقم الزائر يظهر دائماً.</p>
            </fieldset>

            <fieldset className="space-y-2">
              <legend className="font-semibold mb-2">طريقة العرض</legend>
              <div className="flex flex-wrap gap-2">
                <button type="button" className={chip(displayMode === 'auto')} onClick={() => setDisplayMode('auto')}>تلقائي (يتبدل كل 10 ثوانٍ)</button>
                <button type="button" className={chip(displayMode === 'manual')} onClick={() => setDisplayMode('manual')}>يدوي</button>
              </div>
              {displayMode === 'manual' && (specialtyGroups.length > 1 ? (
                <div className="grid gap-2 pt-2">
                  {specialtyGroups.map((group, i) => (
                    <button key={i} type="button" onClick={() => setGroupIndex(i)}
                      className={`text-right rounded-2xl border px-4 py-3 ${currentGroup === i ? 'bg-ink text-white border-ink' : 'bg-white border-line hover:bg-ink-faint'}`}>
                      <span className="block font-semibold">العرض {i + 1}</span>
                      <span className="block text-xs opacity-80 truncate">{group.map((s) => s.name).join('، ')}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted">كل التخصصات في عرض واحد</p>
              ))}
            </fieldset>

            <fieldset className="space-y-2">
              <legend className="font-semibold mb-2">التخصصات المعروضة</legend>
              <div className="flex flex-wrap gap-2">
                <button type="button" className={chip(selectedIds.length === 0)} onClick={() => { setSelectedIds([]); setGroupIndex(0); }}>الكل</button>
                {allSpecialities.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    aria-pressed={selectedIds.includes(s.id)}
                    onClick={() => toggleSpecialty(s.id)}
                    className={`${chip(selectedIds.includes(s.id))} ${isActive(s) ? '' : 'opacity-60'}`}
                    title={isActive(s) ? '' : 'مغلق اليوم، يظهر عند فتحه'}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="rounded-2xl bg-paper p-4 text-sm text-muted space-y-1">
              <p>يُعرض أول {rowsAll} {rowsAll > 2 && rowsAll < 11 ? 'زوار' : 'زائراً'} من كل تخصص{Object.keys(rowsBySpecialty).length > 0 ? ' (ما لم يُحدَّد عدد خاص)' : ''}، حتى {maxColumns} {maxColumns > 2 && maxColumns < 11 ? 'تخصصات' : 'تخصص'} في العرض الواحد.</p>
              <p>زر <Eye className="inline w-4 h-4" /> يخفي الشريط العلوي والسفلي ليبقى الجدول وحده.</p>
            </div>
          </aside>
          <div className="flex-1 bg-ink/40" />
        </div>
      )}
    </div>
  );
};

export default WaitingList;
