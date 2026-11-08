// «تقييم المتطوعين» on the projector (super admin, full screen, 16:9).
// Phase «التقييم الفردي»: overall progress ring with the countdown, counters,
// one bar per axis and the latest finished axes. Phase «عرض النتائج»: one
// slide per axis every 14 s, then the overall slide. Sizes in vmin so it
// reads from the back of the room.
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Expand, Settings2 } from 'lucide-react';
import { AppContext } from '../../../Context/AppContext';
import { LoadingState, cx } from '../../../Components/ui';
import { fmtAvg, fmtClock, requestJson, verbal } from '../../VolunteerEvaluation/shared';

const REFRESH_MS = 5000;
const SLIDE_MS = 14000;
const R_OUT = 44;
const R_IN = 37;
const C_OUT = 2 * Math.PI * R_OUT;
const C_IN = 2 * Math.PI * R_IN;
const CONTROL = 'inline-flex items-center justify-center w-10 h-10 rounded-xl text-white hover:bg-white/15';

function Bar({ value, className }) {
  return (
    <div className={cx('rounded-full bg-ink-faint overflow-hidden', className)}>
      <div className="h-full rounded-full bg-ink transition-[width] duration-1000 ease-out" style={{ width: `${Math.round(Math.min(1, value || 0) * 100)}%` }} />
    </div>
  );
}

function useClock(session, now) {
  const offset = useRef(0);
  const [left, setLeft] = useState(0);
  useEffect(() => { if (now) offset.current = now - Date.now(); }, [now]);
  useEffect(() => {
    const tick = () => setLeft(Math.max(0, (session?.ends_at || 0) - (Date.now() + offset.current)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [session?.ends_at]);
  return left;
}

function LivePhase({ results, left }) {
  const { stats, axes, session, recent } = results;
  const total = (session.duration_min || 30) * 60000;
  const timeFrac = session.ends_at ? Math.min(1, left / total) : 0;
  const angle = -Math.PI / 2 + 2 * Math.PI * (1 - timeFrac);
  const titleOf = (id) => axes.find((a) => a.id === id)?.title || '';

  return (
    <>
      <div className="flex-1 min-h-0 grid grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] gap-[2.4vmin]">
        <div className="flex flex-col gap-[2vmin] min-h-0">
          <div className="relative flex-1 min-h-0 flex items-center justify-center bg-white border border-line rounded-[2.4vmin] p-[2vmin]">
            <svg viewBox="0 0 100 100" className="w-full h-full max-h-[52vmin]" aria-hidden="true">
              <circle cx="50" cy="50" r={R_OUT} fill="none" stroke="#E7EAF4" strokeWidth="5" />
              <circle
                cx="50" cy="50" r={R_OUT} fill="none" stroke="#101E58" strokeWidth="5" strokeLinecap="round"
                strokeDasharray={C_OUT} strokeDashoffset={C_OUT * (1 - stats.progress)} transform="rotate(-90 50 50)"
                style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(.2,.8,.2,1)' }}
              />
              <circle
                cx="50" cy="50" r={R_IN} fill="none" stroke={left && left < 60000 ? '#B26B00' : '#0F8A6C'} strokeWidth="1.6" strokeLinecap="round"
                strokeDasharray={C_IN} strokeDashoffset={C_IN * (1 - timeFrac)} transform="rotate(-90 50 50)"
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
              {session.ends_at > 0 && <circle cx={50 + R_OUT * Math.cos(angle)} cy={50 + R_OUT * Math.sin(angle)} r="2.2" fill="#E03A6F" />}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <b className={cx('font-display leading-none text-[9vmin] tabular-nums', left && left < 60000 ? 'text-st-pushed' : 'text-ink')} dir="ltr">
                {session.ends_at ? fmtClock(left) : '--:--'}
              </b>
              <span className="text-[2vmin] text-muted mt-[0.8vmin]">{!session.ends_at ? 'لم يبدأ التوقيت' : left ? 'الوقت المتبقي' : 'انتهى الوقت'}</span>
              <span className="font-display text-[4vmin] text-ink mt-[1.2vmin] tabular-nums" dir="ltr">{Math.round(stats.progress * 100)}%</span>
              <span className="text-[1.8vmin] text-muted">التقدّم الإجمالي</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-[1.4vmin]">
            {[
              { v: stats.participants, l: 'مشاركاً دخلوا' },
              { v: stats.finished, l: 'أكملوا التقييم', tone: 'text-st-queue' },
              { v: fmtAvg(stats.average), l: 'متوسط التقييم / 5' },
            ].map((k) => (
              <div key={k.l} className="bg-white border border-line rounded-[2vmin] p-[1.6vmin]">
                <b className={cx('block font-display text-[5.2vmin] leading-tight tabular-nums', k.tone || 'text-ink')}>{k.v}</b>
                <span className="text-[1.8vmin] text-muted">{k.l}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-line rounded-[2.4vmin] p-[2.4vmin] flex flex-col justify-around gap-[1vmin] min-h-0 overflow-hidden">
          {axes.map((a, i) => (
            <div key={a.id} className="grid gap-[0.6vmin]">
              <div className="flex justify-between gap-[1vmin] text-[2vmin] font-semibold text-ink">
                <span className="truncate">{i + 1}. {a.title}</span>
                <b className="font-display tabular-nums" dir="ltr">{Math.round(a.progress * 100)}%</b>
              </div>
              <Bar value={a.progress} className="h-[1.3vmin]" />
            </div>
          ))}
        </div>
      </div>

      <div className="h-[5.5vmin] flex items-center gap-[1.4vmin] bg-white border border-line rounded-[1.6vmin] px-[2vmin] text-[2vmin] overflow-hidden whitespace-nowrap">
        <b className="text-st-queue shrink-0">آخر النشاطات</b>
        {recent.length === 0 ? (
          <span className="text-muted">بانتظار أول تقييم…</span>
        ) : recent.slice(0, 3).map((r, i) => (
          <span key={`${r.axis_id}-${r.at}`} className="text-ink truncate" style={{ opacity: 1 - i * 0.3 }}>
            {i > 0 && <span className="text-muted mx-[1vmin]">·</span>}
            أُنجز تقييم محور «{titleOf(r.axis_id)}»
          </span>
        ))}
      </div>
    </>
  );
}

function ResultsSlide({ results, slide }) {
  const { axes, stats, recommendations } = results;

  if (slide >= axes.length) {
    return (
      <div className="flex-1 min-h-0 bg-white border border-line rounded-[2.4vmin] p-[3vmin] flex flex-col gap-[2vmin] overflow-hidden anim-fade" key="overview">
        <h2 className="font-display text-[4.4vmin] text-ink">الحصيلة العامة</h2>
        <div className="flex items-baseline gap-[1.4vmin]">
          <b className="font-display text-[9vmin] leading-none text-ink" dir="ltr">{fmtAvg(stats.average)}</b>
          <span className="text-[2.6vmin] text-muted">من 5 · {verbal(stats.average)} · {stats.participants} مشاركاً</span>
        </div>
        <div className="grid grid-cols-2 gap-x-[3vmin] gap-y-[1.4vmin] content-start">
          {axes.map((x, i) => (
            <div key={x.id} className="grid grid-cols-[minmax(0,1fr)_20vmin_6vmin] gap-[1.4vmin] items-center text-[2vmin] text-ink">
              <span className="truncate">{i + 1}. {x.title}</span>
              <Bar value={x.average ? x.average / 5 : 0} className="h-[1.4vmin]" />
              <b className="font-display text-end">{fmtAvg(x.average, 1)}</b>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const x = axes[slide];
  const rec = recommendations?.[x.id];
  const items = (list, label) => (list.length === 0
    ? <p className="text-[1.9vmin] text-muted">لا شيء مسجَّل</p>
    : list.slice(0, 4).map((n, i) => (
      <div key={i} className="text-[1.9vmin] leading-snug px-[1.4vmin] py-[1vmin] rounded-[1.2vmin] bg-paper text-ink">
        {n.text || '—'}
        {n.recommendation && <div className="text-muted text-[1.7vmin]">{label}: {n.recommendation}</div>}
      </div>
    )));

  return (
    <div className="flex-1 min-h-0 grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-[2.4vmin] anim-fade" key={x.id}>
      <div className="bg-white border border-line rounded-[2.4vmin] p-[2.6vmin] flex flex-col gap-[1.4vmin] min-h-0 overflow-hidden">
        <p className="text-[2vmin] text-muted">المحور {slide + 1} من {axes.length}</p>
        <h2 className="font-display text-[4.2vmin] leading-tight text-ink">{x.title}</h2>
        <div className="flex items-baseline gap-[1.4vmin]">
          <b className="font-display text-[8vmin] leading-none text-ink" dir="ltr">{fmtAvg(x.average)}</b>
          <span className="text-[2.4vmin] text-muted">من 5 · {verbal(x.average)} · {x.done} إجابة</span>
        </div>
        <div className="grid gap-[1.1vmin] overflow-hidden">
          {x.questions.map((q) => (
            <div key={q.id} className="grid grid-cols-[minmax(0,1fr)_20vmin_6vmin] gap-[1.4vmin] items-center text-[1.9vmin] leading-snug text-ink">
              <span className="line-clamp-2">{q.t}</span>
              <Bar value={q.average ? q.average / 5 : 0} className="h-[1.4vmin]" />
              <b className="font-display text-end">{fmtAvg(q.average, 1)}</b>
            </div>
          ))}
        </div>
        {rec && (
          <div className="mt-auto text-[2.1vmin] leading-snug px-[1.6vmin] py-[1.2vmin] rounded-[1.2vmin] bg-ink-faint text-ink">
            <b>التوصيات العامة: </b>{rec}
          </div>
        )}
      </div>
      <div className="bg-white border border-line rounded-[2.4vmin] p-[2.6vmin] flex flex-col gap-[1.2vmin] min-h-0 overflow-hidden">
        <h3 className="flex items-center gap-[1vmin] font-display text-[2.6vmin] text-ink">
          <span className="w-[1.4vmin] h-[1.4vmin] rounded-full bg-st-queue" /> الإيجابيات ({x.positives.length})
        </h3>
        {items(x.positives, 'التوصية')}
        <h3 className="flex items-center gap-[1vmin] font-display text-[2.6vmin] text-ink mt-[1vmin]">
          <span className="w-[1.4vmin] h-[1.4vmin] rounded-full bg-red-600" /> السلبيات ({x.negatives.length})
        </h3>
        {items(x.negatives, 'المقترح')}
      </div>
    </div>
  );
}

export default function VolunteerEvaluationScreen() {
  const { eventId } = useParams();
  const { token } = useContext(AppContext);
  const [results, setResults] = useState(null);
  const [title, setTitle] = useState({ title: '', event: '' });
  const [error, setError] = useState(null);
  const [slide, setSlide] = useState(0);
  const timer = useRef(null);

  const load = useCallback(async () => {
    try {
      setResults(await requestJson(`/volunteer-eval/${eventId}/results`, { token }));
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  }, [eventId, token]);

  useEffect(() => {
    requestJson(`/public/volunteer-eval/${eventId}`)
      .then((cfg) => setTitle({ title: cfg.title, event: cfg.event?.name || '' }))
      .catch(() => {});
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => clearInterval(id);
  }, [eventId, load]);

  const phase = results?.session.phase;
  const slideCount = (results?.axes.length || 0) + 1;

  const restartSlides = useCallback(() => {
    clearInterval(timer.current);
    timer.current = setInterval(() => setSlide((s) => (s + 1) % slideCount), SLIDE_MS);
  }, [slideCount]);

  useEffect(() => {
    if (phase !== 'results') return undefined;
    setSlide(0);
    restartSlides();
    return () => clearInterval(timer.current);
  }, [phase, restartSlides]);

  const left = useClock(results?.session, results?.now);
  const go = (delta) => { setSlide((s) => (s + delta + slideCount) % slideCount); restartSlides(); };
  const fullscreen = () => { document.documentElement.requestFullscreen?.().catch(() => {}); };

  if (!results) {
    return (
      <div className="fixed inset-0 bg-paper flex items-center justify-center" dir="rtl">
        {error ? <p className="text-ink text-lg">{error}</p> : <LoadingState />}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-paper flex flex-col gap-[2vmin] px-[3vmin] py-[2.2vmin] overflow-hidden" dir="rtl">
      <header className="flex items-center gap-[2vmin] bg-ink text-white rounded-[2vmin] px-[2.4vmin] py-[1.4vmin]">
        <img src="/tagemi_logo.png" alt="" className="w-[6vmin] h-[6vmin] rounded-[1.2vmin] bg-white object-contain p-[0.5vmin]" />
        <div className="min-w-0">
          <p className="font-display text-[3.4vmin] leading-tight truncate">{title.title || 'تقييم المتطوعين'}</p>
          {title.event && <p className="text-[1.8vmin] text-white/70 truncate">{title.event}</p>}
        </div>
        <div className="ms-auto flex items-center gap-[1vmin] text-[2vmin] font-semibold">
          <span className="relative flex w-[1.4vmin] h-[1.4vmin]">
            <span className="absolute inset-0 rounded-full bg-rose animate-ping opacity-60" />
            <span className="relative w-full h-full rounded-full bg-rose" />
          </span>
          {phase === 'results' ? 'عرض النتائج' : 'مباشر'}
        </div>
        {/* Controls: faint until hovered, so they don't distract the room */}
        <div className="flex gap-1 opacity-40 hover:opacity-100 focus-within:opacity-100 transition-opacity">
          <Link to={`/admin/volunteer-evaluation/${eventId}`} className={CONTROL} aria-label="لوحة التقييم" title="لوحة التقييم">
            <Settings2 className="w-5 h-5" />
          </Link>
          {phase === 'results' && (
            <>
              <button type="button" onClick={() => go(-1)} className={CONTROL} aria-label="السابق" title="السابق"><ChevronRight className="w-5 h-5" /></button>
              <button type="button" onClick={() => go(1)} className={CONTROL} aria-label="التالي" title="التالي"><ChevronLeft className="w-5 h-5" /></button>
            </>
          )}
          <button type="button" onClick={fullscreen} className={CONTROL} aria-label="ملء الشاشة" title="ملء الشاشة"><Expand className="w-5 h-5" /></button>
        </div>
      </header>

      {phase === 'results' ? (
        <>
          <ResultsSlide results={results} slide={Math.min(slide, slideCount - 1)} />
          <div className="flex justify-center gap-[0.8vmin]" aria-hidden="true">
            {Array.from({ length: slideCount }, (_, i) => (
              <span key={i} className={cx('h-[1vmin] rounded-full transition-all', i === slide ? 'w-[4vmin] bg-ink' : 'w-[1vmin] bg-line')} />
            ))}
          </div>
        </>
      ) : (
        <LivePhase results={results} left={left} />
      )}

      {error && <p className="fixed top-2 inset-x-0 text-center text-xs text-st-pushed">انقطع الاتصال، تُعرض آخر الأرقام</p>}
    </div>
  );
}
