// «تقييم المتطوعين» on the volunteer's phone, opened from the event's QR code.
// No account: the volunteer picks the role they worked in, then answers axis
// after axis (their role's axes first). Each axis is saved on «حفظ ومتابعة» or
// «تخطّي»; a token kept on the phone lets them leave and come back.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, ChevronLeft, ClipboardList, Lock, Plus, RefreshCw, Trash2, UserRoundCog } from 'lucide-react';
import { Button, EmptyState, LoadingState, ToastProvider, useToast, cx } from '../../Components/ui';
import { RATING_LABELS, RATING_ORDER, isAnswered, orderFor, requestJson } from './shared';

const tokenKey = (eventId) => `volunteer-eval:${eventId}`;
const draftKey = (eventId) => `volunteer-eval-draft:${eventId}`;

const storage = {
  get(key) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch { /* private mode */ } },
  remove(key) { try { localStorage.removeItem(key); } catch { /* private mode */ } },
};

const emptyNote = () => ({ text: '', reason: '', recommendation: '' });

/** Draft of one axis from the saved answer (or empty). */
const draftFrom = (answer) => ({
  ratings: { ...(answer?.ratings || {}) },
  overall: answer?.overall ?? null,
  positives: answer?.positives?.length ? answer.positives.map((n) => ({ ...n })) : [emptyNote()],
  negatives: answer?.negatives?.length ? answer.negatives.map((n) => ({ ...n })) : [emptyNote()],
});

// -------------------------------------------------------------- pieces

function Rater({ value, onChange, label }) {
  return (
    <div role="radiogroup" aria-label={label} className="grid grid-cols-6 gap-1.5">
      {RATING_ORDER.map((v) => {
        const on = value === v;
        return (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(v)}
            className={cx(
              'flex flex-col items-center justify-center min-h-[3.5rem] rounded-xl border px-0.5 py-1.5 transition-colors',
              on
                ? v === 0 ? 'bg-muted border-muted text-white' : 'bg-ink border-ink text-white'
                : 'bg-white border-line text-ink hover:bg-ink-faint'
            )}
          >
            <span className="font-display text-lg leading-none">{v || '؟'}</span>
            <span className={cx('mt-1 text-[10px] leading-tight text-center', on ? 'text-white/80' : 'text-muted')}>{RATING_LABELS[v]}</span>
          </button>
        );
      })}
    </div>
  );
}

const NOTE_LABELS = {
  positives: { title: 'الإيجابيات', text: 'الإيجابية', reason: 'السبب', recommendation: 'توصية للحفاظ عليها أو تحسينها', add: 'أضف إيجابية', tone: 'bg-st-queue' },
  negatives: { title: 'السلبيات والنقائص', text: 'السلبية أو النقيصة', reason: 'السبب', recommendation: 'توصية مقترحة', add: 'أضف سلبية', tone: 'bg-red-600' },
};

const textareaClass = 'w-full rounded-xl border border-line bg-white px-3 py-2 text-base text-ink placeholder:text-muted focus:border-ink focus:outline-none resize-y';

function NotesEditor({ kind, notes, onChange }) {
  const L = NOTE_LABELS[kind];
  const update = (i, field, value) => onChange(notes.map((n, j) => (j === i ? { ...n, [field]: value } : n)));
  const remove = (i) => {
    const rest = notes.filter((_, j) => j !== i);
    onChange(rest.length ? rest : [emptyNote()]);
  };

  return (
    <section className="bg-white border border-line rounded-2xl p-4">
      <h3 className="flex items-center gap-2 font-semibold text-ink">
        <span className={cx('w-2.5 h-2.5 rounded-full', L.tone)} aria-hidden="true" />
        {L.title}
      </h3>
      <p className="mt-1 text-xs text-muted">اختياري. اكتب النقطة وسببها وما تقترحه.</p>
      <div className="mt-3 space-y-3">
        {notes.map((note, i) => (
          <div key={i} className="rounded-xl bg-paper p-3 space-y-2">
            <textarea rows={2} className={textareaClass} placeholder={L.text} aria-label={L.text} value={note.text} onChange={(e) => update(i, 'text', e.target.value)} />
            <textarea rows={1} className={textareaClass} placeholder={L.reason} aria-label={L.reason} value={note.reason} onChange={(e) => update(i, 'reason', e.target.value)} />
            <div className="flex items-start gap-2">
              <textarea rows={1} className={textareaClass} placeholder={L.recommendation} aria-label={L.recommendation} value={note.recommendation} onChange={(e) => update(i, 'recommendation', e.target.value)} />
              <button type="button" onClick={() => remove(i)} aria-label="احذف" className="shrink-0 inline-flex items-center justify-center w-11 h-11 rounded-xl text-red-700 hover:bg-red-50">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
      <Button variant="ghost" size="sm" icon={Plus} className="mt-2 -ms-2" onClick={() => onChange([...notes, emptyNote()])}>{L.add}</Button>
    </section>
  );
}

function Header({ title, eventName }) {
  return (
    <header className="bg-ink text-white">
      <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
        <img src="/tagemi_logo.png" alt="" className="w-10 h-10 rounded-xl bg-white object-contain p-1" />
        <div className="min-w-0">
          <p className="font-display text-lg leading-tight truncate">{title || 'تقييم المتطوعين'}</p>
          {eventName && <p className="text-xs text-white/70 truncate">{eventName}</p>}
        </div>
      </div>
    </header>
  );
}

// ----------------------------------------------------------------- page

function VolunteerEvaluationPage() {
  const { eventId } = useParams();
  const toast = useToast();
  const [config, setConfig] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [token, setToken] = useState(() => storage.get(tokenKey(eventId)));
  const [participant, setParticipant] = useState(null);
  const [pickingRole, setPickingRole] = useState(false);
  const [step, setStep] = useState(null); // axis id | 'summary' | null = first unanswered
  const [drafts, setDrafts] = useState(() => {
    try { return JSON.parse(storage.get(draftKey(eventId)) || '{}'); } catch { return {}; }
  });
  const [busy, setBusy] = useState(null);
  const topRef = useRef(null);

  const forget = useCallback(() => {
    storage.remove(tokenKey(eventId));
    setToken(null);
    setParticipant(null);
  }, [eventId]);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const cfg = await requestJson(`/public/volunteer-eval/${eventId}`);
      setConfig(cfg);
      const saved = storage.get(tokenKey(eventId));
      if (saved) {
        try {
          const me = await requestJson(`/public/volunteer-eval/${eventId}/me`, { evalToken: saved });
          setParticipant(me.participant);
        } catch (e) {
          if (e.status === 401) forget();
          else throw e;
        }
      }
    } catch (e) {
      setLoadError(e);
    }
  }, [eventId, forget]);

  useEffect(() => { load(); }, [load]);

  // Typed answers survive a reload or a locked phone
  useEffect(() => { storage.set(draftKey(eventId), JSON.stringify(drafts)); }, [drafts, eventId]);

  const roleId = participant?.role_id;
  const answers = participant?.answers || {};
  const order = useMemo(() => (config ? orderFor(config.axes, roleId) : []), [config, roleId]);
  const answeredCount = order.filter((a) => isAnswered(answers[a.id])).length;
  const progress = order.length ? Math.round((answeredCount / order.length) * 100) : 0;
  const current = step === 'summary'
    ? null
    : order.find((a) => a.id === step) || order.find((a) => !isAnswered(answers[a.id])) || null;

  const scrollTop = () => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const roleName = (id) => config?.roles.find((r) => r.id === id)?.name || '—';

  const handleError = (e) => {
    if (e.status === 401) {
      forget();
      toast('لم نجد مشاركتك. اختر مهمتك للبدء من جديد.', 'error');
    } else if (e.status === 423) {
      setConfig((c) => ({ ...c, is_open: false }));
      toast(e.message, 'error');
    } else {
      toast(e.message, 'error');
    }
  };

  const pickRole = async (id) => {
    setBusy(`role:${id}`);
    try {
      if (token && participant) {
        const res = await requestJson(`/public/volunteer-eval/${eventId}/me/role`, { method: 'PUT', body: { role_id: id }, evalToken: token });
        setParticipant(res.participant);
      } else {
        const res = await requestJson(`/public/volunteer-eval/${eventId}/join`, { method: 'POST', body: { role_id: id } });
        storage.set(tokenKey(eventId), res.token);
        setToken(res.token);
        setParticipant(res.participant);
      }
      setPickingRole(false);
      setStep(null);
      scrollTop();
    } catch (e) {
      handleError(e);
    } finally {
      setBusy(null);
    }
  };

  const draftOf = (axis) => drafts[axis.id] || draftFrom(answers[axis.id]);
  const setDraft = (axis, patch) => setDrafts((d) => ({ ...d, [axis.id]: { ...(d[axis.id] || draftFrom(answers[axis.id])), ...patch } }));

  const saveAxis = async (axis, status) => {
    const d = draftOf(axis);
    setBusy(status);
    try {
      const res = await requestJson(`/public/volunteer-eval/${eventId}/me/axes/${axis.id}`, {
        method: 'PUT',
        evalToken: token,
        body: { status, overall: d.overall, ratings: d.ratings, positives: d.positives, negatives: d.negatives },
      });
      setParticipant(res.participant);
      setDrafts(({ [axis.id]: _saved, ...rest }) => rest);
      toast(status === 'done' ? 'حُفظ المحور' : 'تخطّيت المحور', status === 'done' ? 'success' : 'info');
      const next = order.find((a) => a.id !== axis.id && !isAnswered(res.participant.answers?.[a.id]));
      setStep(next ? next.id : 'summary');
      scrollTop();
    } catch (e) {
      handleError(e);
    } finally {
      setBusy(null);
    }
  };

  // ------------------------------------------------------------ states

  if (loadError) {
    const missing = loadError.status === 404;
    return (
      <div className="min-h-screen bg-paper" dir="rtl">
        <Header />
        <main className="max-w-2xl mx-auto px-4 py-6">
          <div className="bg-white border border-line rounded-2xl">
            <EmptyState
              icon={missing ? ClipboardList : RefreshCw}
              title={missing ? 'لا يوجد تقييم لهذا الحدث' : 'تعذّر فتح التقييم'}
              action={!missing && <Button icon={RefreshCw} onClick={load}>أعد المحاولة</Button>}
            >
              {missing ? 'تأكد أنك مسحت رمز QR الصحيح، أو اسأل المسيّر.' : loadError.message}
            </EmptyState>
          </div>
        </main>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen bg-paper" dir="rtl">
        <Header />
        <LoadingState />
      </div>
    );
  }

  const closedNotice = !config.is_open && (
    <p className="flex items-start gap-2 text-sm text-st-pushed bg-st-pushed-bg rounded-2xl px-4 py-3 mb-4">
      <Lock className="w-5 h-5 shrink-0" />
      أُغلق التقييم ولم يعد يقبل إجابات. شكراً لمشاركتك.
    </p>
  );

  // --------------------------------------------------------- pick role

  if (!roleId || pickingRole) {
    return (
      <div className="min-h-screen bg-paper" dir="rtl">
        <Header title={config.title} eventName={config.event?.name} />
        <main ref={topRef} className="max-w-2xl mx-auto px-4 py-5 safe-bottom">
          {closedNotice}
          <section className="bg-white border border-line rounded-2xl p-5">
            <h1 className="font-display text-2xl text-ink leading-snug">قيّم الحدث في دقائق</h1>
            <p className="mt-2 text-sm text-muted leading-relaxed">
              اختر المهمة التي عملت فيها. تظهر لك أولاً المحاور المتعلقة بمهمتك، ثم باقي المحاور.
              تُحفظ إجابتك في نهاية كل محور، ويمكنك تخطّي ما لا يعنيك والعودة إليه لاحقاً. لا نطلب اسمك.
            </p>
          </section>

          <h2 className="font-display text-lg text-ink mt-6 mb-2">ما المهمة التي عملت فيها؟</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {config.roles.map((r) => (
              <button
                key={r.id}
                type="button"
                disabled={!config.is_open || !!busy}
                onClick={() => pickRole(r.id)}
                className={cx(
                  'flex items-center justify-between gap-2 min-h-[3.5rem] px-4 rounded-2xl border text-start font-semibold transition-colors disabled:opacity-50',
                  r.id === roleId ? 'bg-ink text-white border-ink' : 'bg-white text-ink border-line hover:bg-ink-faint'
                )}
              >
                <span>{r.name}</span>
                {busy === `role:${r.id}` ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ChevronLeft className="w-5 h-5 opacity-60" />}
              </button>
            ))}
          </div>
          {pickingRole && (
            <Button variant="ghost" block className="mt-4" onClick={() => setPickingRole(false)}>رجوع دون تغيير</Button>
          )}
        </main>
      </div>
    );
  }

  // ------------------------------------------------------------ answer

  const progressCard = (
    <section className="bg-white border border-line rounded-2xl px-4 py-3">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="min-w-0 text-ink">
          <span className="text-muted">مهمتك: </span>
          <span className="font-semibold">{roleName(roleId)}</span>
        </span>
        <span className="font-display text-lg text-ink" dir="ltr">{progress}%</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-ink-faint overflow-hidden" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="تقدّمك">
        <div className="h-full rounded-full bg-ink transition-[width] duration-500" style={{ width: `${progress}%` }} />
      </div>
      <button type="button" onClick={() => setPickingRole(true)} className="mt-2 inline-flex items-center gap-1 text-xs text-muted min-h-[2rem] hover:text-ink">
        <UserRoundCog className="w-4 h-4" /> غيّر المهمة
      </button>
    </section>
  );

  const stepper = (
    <nav aria-label="المحاور" className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 py-1">
      {order.map((a, i) => {
        const status = answers[a.id]?.status;
        const on = current?.id === a.id;
        return (
          <button
            key={a.id}
            type="button"
            onClick={() => { setStep(a.id); scrollTop(); }}
            aria-current={on ? 'step' : undefined}
            title={a.title}
            className={cx(
              'shrink-0 inline-flex items-center gap-1 h-9 px-3 rounded-full text-xs font-semibold border',
              on ? 'bg-ink text-white border-ink'
                : status === 'done' ? 'bg-st-queue-bg text-st-queue border-transparent'
                  : status === 'skipped' ? 'bg-st-pushed-bg text-st-pushed border-transparent'
                    : 'bg-white text-ink border-line'
            )}
          >
            {status === 'done' && !on && <CheckCircle2 className="w-3.5 h-3.5" />}
            {i + 1}. {a.title.split(' ')[0]}
          </button>
        );
      })}
      <button
        type="button"
        onClick={() => { setStep('summary'); scrollTop(); }}
        className={cx('shrink-0 h-9 px-3 rounded-full text-xs font-semibold border', !current ? 'bg-ink text-white border-ink' : 'bg-white text-ink border-line')}
      >
        الملخّص
      </button>
    </nav>
  );

  let body;
  if (!current) {
    body = (
      <section className="bg-white border border-line rounded-2xl p-4">
        <h2 className="font-display text-xl text-ink">{progress === 100 ? 'شكراً، أكملت كل المحاور' : 'ملخّص تقييمك'}</h2>
        <p className="mt-1 text-sm text-muted">يمكنك العودة إلى أي محور لتعديل إجابتك، أو الإجابة عن المحاور التي تخطّيتها.</p>
        <ul className="mt-3 divide-y divide-line">
          {order.map((a, i) => {
            const status = answers[a.id]?.status;
            return (
              <li key={a.id} className="flex items-center gap-3 py-2.5">
                <span className="font-display text-muted w-6 text-center">{i + 1}</span>
                <span className="flex-1 min-w-0 text-sm text-ink">
                  {a.title}
                  {(a.roles || []).includes(roleId) && <span className="ms-2 text-[11px] text-st-hold">مهمتك</span>}
                </span>
                <span className={cx('shrink-0 text-xs font-semibold px-2 h-6 inline-flex items-center rounded-md',
                  status === 'done' ? 'bg-st-queue-bg text-st-queue' : status === 'skipped' ? 'bg-st-pushed-bg text-st-pushed' : 'bg-st-pending-bg text-st-pending')}
                >
                  {status === 'done' ? 'مُنجز' : status === 'skipped' ? 'متخطّى' : 'لم يبدأ'}
                </span>
                <Button variant="secondary" size="sm" disabled={!config.is_open} onClick={() => { setStep(a.id); scrollTop(); }}>
                  {status === 'done' ? 'عدّل' : 'أجب'}
                </Button>
              </li>
            );
          })}
        </ul>
      </section>
    );
  } else {
    const d = draftOf(current);
    const index = order.indexOf(current) + 1;
    let lastGroup = null;
    body = (
      <>
        <header className="flex items-start gap-3">
          <span className="font-display text-4xl text-ink-soft/40 leading-none" aria-hidden="true">{String(index).padStart(2, '0')}</span>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted">المحور {index} من {order.length}</p>
            <h2 className="font-display text-xl text-ink leading-snug">{current.title}</h2>
          </div>
          {(current.roles || []).includes(roleId) && (
            <span className="shrink-0 text-[11px] font-semibold px-2 h-6 inline-flex items-center rounded-md bg-st-hold-bg text-st-hold">يخص مهمتك</span>
          )}
        </header>

        <section className="bg-white border border-line rounded-2xl p-4">
          <h3 className="font-semibold text-ink">قيّم كل نقطة</h3>
          <p className="mt-1 text-xs text-muted">من 1 (ضعيف جداً) إلى 5 (ممتاز)، أو «؟» إن كنت لا تعرف.</p>
          <div className="mt-2 divide-y divide-line">
            {current.qs.map((q) => {
              const groupTitle = q.g && q.g !== lastGroup ? q.g : null;
              lastGroup = q.g;
              return (
                <div key={q.id} className="py-3">
                  {groupTitle && <p className="text-xs font-semibold text-st-hold mb-2">{groupTitle}</p>}
                  <p className="text-[15px] text-ink leading-relaxed mb-2">{q.t}</p>
                  <Rater label={q.t} value={d.ratings[q.id] ?? null} onChange={(v) => setDraft(current, { ratings: { ...d.ratings, [q.id]: v } })} />
                </div>
              );
            })}
          </div>
        </section>

        <section className="bg-white border border-line rounded-2xl p-4">
          <h3 className="font-semibold text-ink mb-2">تقييمك العام لهذا المحور</h3>
          <Rater label="التقييم العام" value={d.overall} onChange={(v) => setDraft(current, { overall: v })} />
        </section>

        <NotesEditor kind="positives" notes={d.positives} onChange={(positives) => setDraft(current, { positives })} />
        <NotesEditor kind="negatives" notes={d.negatives} onChange={(negatives) => setDraft(current, { negatives })} />

        <div className="sticky bottom-0 -mx-4 px-4 pt-3 pb-3 bg-paper/95 backdrop-blur border-t border-line flex gap-2 safe-bottom">
          <Button variant="secondary" size="lg" disabled={!config.is_open || !!busy} loading={busy === 'skipped'} onClick={() => saveAxis(current, 'skipped')}>
            تخطّ
          </Button>
          <Button size="lg" block disabled={!config.is_open || !!busy} loading={busy === 'done'} onClick={() => saveAxis(current, 'done')}>
            احفظ وتابع
          </Button>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-paper" dir="rtl">
      <Header title={config.title} eventName={config.event?.name} />
      <main ref={topRef} className="max-w-2xl mx-auto px-4 pt-4 space-y-3 scroll-mt-4">
        {closedNotice}
        {progressCard}
        {stepper}
        {body}
        {!current && <div className="h-6" />}
      </main>
    </div>
  );
}

export default function VolunteerEvaluation() {
  return (
    <ToastProvider>
      <VolunteerEvaluationPage />
    </ToastProvider>
  );
}
