// «تقييم المتطوعين» of one event (super admin): the QR code volunteers scan,
// the session (open / closed, countdown, phase shown on the screen), the
// anonymous participants, the questions editor, and the results with the
// general recommendations of each axis.
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { renderToStaticMarkup } from 'react-dom/server';
import { QRCodeSVG } from 'qrcode.react';
import {
  ArrowDown, ArrowUp, ChevronRight, ClipboardList, Copy, Lock, LockOpen, Monitor, Play, Plus,
  Printer, RefreshCw, Save, Square, Timer, Trash2, Undo2,
} from 'lucide-react';
import { AppContext } from '../../../Context/AppContext';
import {
  Button, ChipGroup, EmptyState, Field, IconButton, LoadingState, PageHeader, Panel, StatStrip,
  TextInput, cx, inputClass, useToast,
} from '../../../Components/ui';
import { ConfirmSheet, SwitchRow } from './Components/EventFormParts';
import { escapeHtml, writePrintDocument } from '../../../utils/safeHtml';
import { evaluationLink, fmtAvg, fmtClock, newId, requestJson, verbal } from '../../VolunteerEvaluation/shared';

const REFRESH_MS = 10000;
const TABS = [
  { value: 'session', label: 'الرمز والجلسة' },
  { value: 'people', label: 'المشاركون' },
  { value: 'questions', label: 'الأسئلة' },
  { value: 'results', label: 'النتائج' },
];

const clone = (value) => JSON.parse(JSON.stringify(value));
const configOf = (ev) => clone({ title: ev.title, roles: ev.roles, axes: ev.axes });
const textareaClass = 'w-full rounded-xl border border-line bg-white px-3 py-2 text-base text-ink placeholder:text-muted focus:border-ink focus:outline-none resize-y';

function Bar({ value, className }) {
  return (
    <div className={cx('h-2 rounded-full bg-ink-faint overflow-hidden', className)}>
      <div className="h-full rounded-full bg-ink transition-[width] duration-500" style={{ width: `${Math.round((value || 0) * 100)}%` }} />
    </div>
  );
}

// ------------------------------------------------------------- session

function SessionTab({ eventId, eventName, participantsCount, session, now, onSession, busy }) {
  const toast = useToast();
  const link = evaluationLink(eventId);
  const [duration, setDuration] = useState(session.duration_min || 30);
  const [clock, setClock] = useState(0);
  // Server clock offset, so the countdown matches the screen
  const offset = useRef(0);
  useEffect(() => { if (now) offset.current = now - Date.now(); }, [now]);
  useEffect(() => {
    const tick = () => setClock(Math.max(0, (session.ends_at || 0) - (Date.now() + offset.current)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [session.ends_at]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      toast('نُسخ رابط التقييم');
    } catch {
      toast('تعذر النسخ، انسخ الرابط يدويًا', 'error');
    }
  };

  const printPoster = () => {
    const w = window.open('', '_blank');
    if (!w) {
      toast('اسمح بالنوافذ المنبثقة في المتصفح ثم أعد طباعة الملصق', 'error');
      return;
    }
    const qr = renderToStaticMarkup(<QRCodeSVG value={link} size={512} level="M" />);
    writePrintDocument(w, `<!DOCTYPE html>
<html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>تقييم المتطوعين - ${escapeHtml(eventName)}</title>
<style>
  @page { size: A4 portrait; margin: 12mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Cairo', 'Tajawal', Tahoma, Arial, sans-serif; color: #101E58; text-align: center; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .poster { min-height: 270mm; display: flex; flex-direction: column; align-items: center; justify-content: space-between; border: 3px solid #101E58; border-radius: 8mm; padding: 10mm; }
  h1 { font-size: 40pt; font-weight: 800; line-height: 1.2; }
  .event { font-size: 18pt; color: #5E6987; margin-top: 3mm; }
  .qr { width: 120mm; height: 120mm; margin: 6mm auto 2mm; }
  .qr svg { width: 100%; height: 100%; display: block; }
  .url { font-family: monospace; font-size: 10pt; color: #5E6987; direction: ltr; word-break: break-all; }
  ol { list-style: none; text-align: right; font-size: 17pt; line-height: 1.9; margin-top: 6mm; }
  ol li span.n { display: inline-block; width: 11mm; height: 11mm; line-height: 11mm; border-radius: 50%; background: #101E58; color: #fff; text-align: center; font-weight: 700; margin-left: 4mm; font-size: 15pt; }
</style></head>
<body><div class="poster">
  <div><h1>قيّم الحدث</h1><div class="event">${escapeHtml(eventName)}</div></div>
  <div><div class="qr">${qr}</div><div class="url">${escapeHtml(link)}</div></div>
  <ol>
    <li><span class="n">1</span>امسح الرمز بهاتفك</li>
    <li><span class="n">2</span>اختر المهمة التي عملت فيها</li>
    <li><span class="n">3</span>أجب عن المحاور واحفظ كل محور</li>
  </ol>
</div></body></html>`);
    w.focus();
    setTimeout(() => w.print(), 500);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
      <Panel title="رمز الدخول">
        <div className="flex flex-col items-center text-center">
          <div className="bg-white p-3 rounded-2xl border border-line">
            <QRCodeSVG value={link} size={220} level="M" />
          </div>
          <p className="mt-2 text-xs text-muted break-all" dir="ltr">{link}</p>
          <p className="mt-2 text-sm text-muted">يمسحه المتطوعون بهواتفهم ويبدؤون مباشرة، دون حساب.</p>
          <div className="mt-3 grid grid-cols-2 gap-2 w-full">
            <Button variant="secondary" icon={Copy} onClick={copy}>انسخ الرابط</Button>
            <Button variant="secondary" icon={Printer} onClick={printPoster}>اطبع الملصق</Button>
          </div>
          <Link
            to={`/admin/volunteer-evaluation/${eventId}/screen`}
            target="_blank"
            rel="noopener"
            className="mt-2 w-full inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl text-sm font-semibold bg-ink text-white hover:bg-ink-soft"
          >
            <Monitor className="w-4 h-4" /> افتح شاشة العرض
          </Link>
        </div>
      </Panel>

      <div className="space-y-4">
        <Panel title="استقبال الإجابات">
          <SwitchRow
            checked={session.is_open}
            onChange={(v) => onSession({ is_open: v }, v ? 'فُتح التقييم' : 'أُغلق التقييم')}
            icon={session.is_open ? LockOpen : Lock}
            label={session.is_open ? 'التقييم مفتوح' : 'التقييم مغلق'}
            hint={session.is_open ? 'يستطيع المتطوعون الإجابة والتعديل' : 'تُعرض الأسئلة ولا تُقبل إجابات'}
          />
          <p className="text-xs text-muted">{participantsCount} مشاركاً حتى الآن</p>
        </Panel>

        <Panel title="التوقيت التنازلي">
          <p className="text-sm text-muted">يظهر على شاشة العرض.</p>
          <p className={cx('font-display text-5xl text-center my-3', clock > 0 && clock < 60000 ? 'text-st-pushed' : 'text-ink')} dir="ltr">
            {session.ends_at ? fmtClock(clock) : '--:--'}
          </p>
          <div className="flex items-end gap-2">
            <Field label="المدة بالدقائق" className="w-32">
              <TextInput type="number" min={1} max={240} value={duration} onChange={(e) => setDuration(e.target.value)} />
            </Field>
            <Button
              icon={Play}
              className="flex-1 h-12"
              disabled={busy}
              onClick={() => onSession({ timer: 'start', duration_min: Math.min(240, Math.max(1, Number(duration) || 30)) }, 'بدأ التوقيت')}
            >
              {session.ends_at ? 'أعد البدء' : 'ابدأ'}
            </Button>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Button variant="secondary" icon={Timer} disabled={busy} onClick={() => onSession({ timer: 'add5' }, 'أُضيفت 5 دقائق')}>+5 دقائق</Button>
            <Button variant="danger" icon={Square} disabled={busy || !session.ends_at} onClick={() => onSession({ timer: 'stop' }, 'أُوقف التوقيت')}>أوقف</Button>
          </div>
        </Panel>

        <Panel title="ما تعرضه الشاشة">
          <ChipGroup
            label="مرحلة الجلسة"
            value={session.phase}
            onChange={(phase) => onSession({ phase }, phase === 'results' ? 'تعرض الشاشة النتائج' : 'تعرض الشاشة التقدّم')}
            options={[{ value: 'eval', label: 'التقييم الفردي' }, { value: 'results', label: 'عرض النتائج' }]}
          />
          <p className="mt-2 text-xs text-muted">«التقييم الفردي»: تقدّم المشاركين والوقت. «عرض النتائج»: شريحة لكل محور ثم الحصيلة العامة.</p>
        </Panel>
      </div>
    </div>
  );
}

// -------------------------------------------------------------- people

function PeopleTab({ results, roles, onDelete }) {
  const roleName = (id) => roles.find((r) => r.id === id)?.name || '—';
  const { stats, participants } = results;

  return (
    <>
      <StatStrip
        className="mb-4"
        items={[
          { label: 'دخلوا التقييم', value: stats.participants },
          { label: 'أكملوا كل المحاور', value: stats.finished, tone: 'text-st-queue' },
          { label: 'التقدّم الإجمالي', value: `${Math.round(stats.progress * 100)}%` },
          { label: 'المتوسط العام / 5', value: fmtAvg(stats.average) },
        ]}
      />
      <Bar value={stats.progress} className="h-3 mb-4" />
      {participants.length === 0 ? (
        <div className="bg-white border border-line rounded-2xl">
          <EmptyState icon={ClipboardList} title="لم يدخل أي متطوع بعد">اعرض رمز QR أو اطبع الملصق ليمسحه المتطوعون.</EmptyState>
        </div>
      ) : (
        <ul className="bg-white border border-line rounded-2xl divide-y divide-line">
          {participants.map((p, i) => (
            <li key={p.id} className="flex items-center gap-3 px-4 py-3">
              <span className="font-display text-muted w-8 text-center">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="font-semibold text-ink truncate">{roleName(p.role_id)}</span>
                  <span className="text-muted shrink-0" dir="ltr">{Math.round(p.progress * 100)}%</span>
                </div>
                <Bar value={p.progress} className="mt-1.5" />
                <p className="mt-1 text-xs text-muted">
                  {p.done} منجز · {p.skipped} متخطّى
                  {p.updated_at && ` · آخر حفظ ${new Date(p.updated_at).toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' })}`}
                </p>
              </div>
              <IconButton icon={Trash2} label="احذف المشاركة" className="text-red-700" onClick={() => onDelete(p)} />
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-xs text-muted">المشاركون مجهولو الهوية: تظهر المهمة التي اختارها كل متطوع فقط.</p>
    </>
  );
}

// ----------------------------------------------------------- questions

function QuestionsTab({ evaluation, onSaved }) {
  const toast = useToast();
  const { token } = useContext(AppContext);
  const [draft, setDraft] = useState(() => configOf(evaluation));
  const [open, setOpen] = useState(null);
  const [saving, setSaving] = useState(false);
  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(configOf(evaluation)), [draft, evaluation]);

  const change = (fn) => setDraft((d) => { const next = clone(d); fn(next); return next; });

  const save = async () => {
    setSaving(true);
    try {
      const res = await requestJson(`/volunteer-eval/${evaluation.event_id}/config`, { method: 'PUT', token, body: draft });
      onSaved(res.evaluation);
      setDraft(configOf(res.evaluation));
      toast('حُفظت الأسئلة');
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 pb-24">
      <Panel>
        <Field label="عنوان التقييم">
          <TextInput value={draft.title} onChange={(e) => change((d) => { d.title = e.target.value; })} />
        </Field>
      </Panel>

      <Panel title="المهام" actions={<span className="text-xs text-muted">{draft.roles.length}</span>}>
        <p className="text-sm text-muted mb-3">تظهر للمتطوع في البداية ليختار المهمة التي عمل فيها.</p>
        <div className="space-y-2">
          {draft.roles.map((r, i) => (
            <div key={r.id} className="flex items-center gap-2">
              <TextInput aria-label="اسم المهمة" value={r.name} onChange={(e) => change((d) => { d.roles[i].name = e.target.value; })} />
              <IconButton
                icon={Trash2}
                label="احذف المهمة"
                className="text-red-700 shrink-0"
                disabled={draft.roles.length === 1}
                onClick={() => change((d) => {
                  const [gone] = d.roles.splice(i, 1);
                  d.axes.forEach((a) => { a.roles = (a.roles || []).filter((x) => x !== gone.id); });
                })}
              />
            </div>
          ))}
        </div>
        <Button variant="ghost" size="sm" icon={Plus} className="mt-2 -ms-2" onClick={() => change((d) => { d.roles.push({ id: newId('r'), name: 'مهمة جديدة' }); })}>
          أضف مهمة
        </Button>
      </Panel>

      <section>
        <h2 className="font-display text-lg text-ink mb-2">المحاور ({draft.axes.length})</h2>
        <div className="space-y-2">
          {draft.axes.map((a, ai) => {
            const expanded = open === a.id;
            return (
              <div key={a.id} className="bg-white border border-line rounded-2xl">
                <div className="flex items-center gap-1 px-2 py-1.5">
                  <button type="button" onClick={() => setOpen(expanded ? null : a.id)} className="flex-1 min-w-0 flex items-center gap-2 min-h-[2.75rem] px-2 text-start" aria-expanded={expanded}>
                    <span className="font-display text-muted w-6 text-center">{ai + 1}</span>
                    <span className="min-w-0">
                      <span className="block font-semibold text-ink truncate">{a.title || 'محور بلا عنوان'}</span>
                      <span className="block text-xs text-muted">{a.qs.length} سؤالاً · {(a.roles || []).length} مهام</span>
                    </span>
                  </button>
                  <IconButton icon={ArrowUp} label="انقل للأعلى" disabled={ai === 0} className="disabled:opacity-30" onClick={() => change((d) => { [d.axes[ai - 1], d.axes[ai]] = [d.axes[ai], d.axes[ai - 1]]; })} />
                  <IconButton icon={ArrowDown} label="انقل للأسفل" disabled={ai === draft.axes.length - 1} className="disabled:opacity-30" onClick={() => change((d) => { [d.axes[ai + 1], d.axes[ai]] = [d.axes[ai], d.axes[ai + 1]]; })} />
                </div>

                {expanded && (
                  <div className="border-t border-line px-4 py-3 space-y-3">
                    <Field label="عنوان المحور">
                      <TextInput value={a.title} onChange={(e) => change((d) => { d.axes[ai].title = e.target.value; })} />
                    </Field>
                    <div>
                      <p className="text-sm font-semibold text-ink mb-1.5">يظهر أولاً لمن عمل في</p>
                      <div className="flex flex-wrap gap-2">
                        {draft.roles.map((r) => {
                          const on = (a.roles || []).includes(r.id);
                          return (
                            <button
                              key={r.id}
                              type="button"
                              aria-pressed={on}
                              onClick={() => change((d) => {
                                const set = new Set(d.axes[ai].roles || []);
                                if (set.has(r.id)) set.delete(r.id); else set.add(r.id);
                                d.axes[ai].roles = [...set];
                              })}
                              className={cx('h-9 px-3 rounded-full text-xs font-semibold border', on ? 'bg-ink text-white border-ink' : 'bg-white text-ink border-line hover:bg-ink-faint')}
                            >
                              {r.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-ink">الأسئلة</p>
                      {a.qs.map((q, qi) => (
                        <div key={q.id} className="rounded-xl bg-paper p-2.5 space-y-2">
                          <div className="flex items-center gap-2">
                            <input
                              className={cx(inputClass, 'h-10 text-sm')}
                              placeholder="عنوان فرعي (اختياري)"
                              aria-label="عنوان فرعي"
                              value={q.g || ''}
                              onChange={(e) => change((d) => { d.axes[ai].qs[qi].g = e.target.value; })}
                            />
                            <IconButton
                              icon={Trash2}
                              label="احذف السؤال"
                              className="text-red-700 shrink-0 disabled:opacity-30"
                              disabled={a.qs.length === 1}
                              onClick={() => change((d) => { d.axes[ai].qs.splice(qi, 1); })}
                            />
                          </div>
                          <textarea rows={2} className={textareaClass} aria-label="نص السؤال" value={q.t} onChange={(e) => change((d) => { d.axes[ai].qs[qi].t = e.target.value; })} />
                        </div>
                      ))}
                      <Button variant="ghost" size="sm" icon={Plus} className="-ms-2" onClick={() => change((d) => { d.axes[ai].qs.push({ id: newId(`${a.id}q`), g: a.qs[a.qs.length - 1]?.g || '', t: 'سؤال جديد' }); })}>
                        أضف سؤالاً
                      </Button>
                    </div>

                    <Button variant="danger" size="sm" icon={Trash2} disabled={draft.axes.length === 1} onClick={() => change((d) => { d.axes.splice(ai, 1); })}>
                      احذف المحور
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <Button
          variant="secondary"
          icon={Plus}
          className="mt-3"
          onClick={() => {
            const id = newId('a');
            change((d) => { d.axes.push({ id, title: 'محور جديد', roles: [], qs: [{ id: newId(`${id}q`), g: '', t: 'سؤال جديد' }] }); });
            setOpen(id);
          }}
        >
          أضف محوراً
        </Button>
        <p className="mt-3 text-xs text-muted">تعديل نص سؤال لا يمسح إجاباته. حذف سؤال أو محور يُخفي إجاباته من النتائج.</p>
      </section>

      {dirty && (
        <div className="fixed inset-x-0 bottom-16 lg:bottom-0 z-40 bg-white border-t border-line px-4 py-3 safe-bottom">
          <div className="max-w-3xl mx-auto flex gap-2">
            <Button variant="secondary" icon={Undo2} onClick={() => setDraft(configOf(evaluation))}>تراجع</Button>
            <Button icon={Save} block loading={saving} onClick={save}>احفظ الأسئلة</Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------- results

function NotesList({ title, notes, tone, recLabel }) {
  return (
    <div>
      <p className="flex items-center gap-2 text-sm font-semibold text-ink mb-1.5">
        <span className={cx('w-2.5 h-2.5 rounded-full', tone)} aria-hidden="true" />
        {title} ({notes.length})
      </p>
      {notes.length === 0 ? (
        <p className="text-sm text-muted">لا شيء بعد.</p>
      ) : (
        <ul className="space-y-1.5 max-h-72 overflow-y-auto">
          {notes.map((n, i) => (
            <li key={i} className="rounded-xl bg-paper px-3 py-2 text-sm text-ink">
              {n.text || '—'}
              {n.reason && <span className="block text-xs text-muted mt-0.5">السبب: {n.reason}</span>}
              {n.recommendation && <span className="block text-xs text-muted mt-0.5">{recLabel}: {n.recommendation}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RecommendationBox({ eventId, axisId, saved, onSaved }) {
  const toast = useToast();
  const { token } = useContext(AppContext);
  const [text, setText] = useState(saved || '');
  const [saving, setSaving] = useState(false);
  useEffect(() => { setText(saved || ''); }, [saved]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await requestJson(`/volunteer-eval/${eventId}/recommendations/${axisId}`, { method: 'PUT', token, body: { text } });
      onSaved(res.recommendations);
      toast('حُفظت التوصيات');
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border-t border-line pt-3">
      <p className="text-sm font-semibold text-ink mb-1.5">التوصيات العامة للمحور</p>
      <textarea rows={3} className={textareaClass} placeholder="اكتب التوصيات المتفق عليها في الجلسة..." value={text} onChange={(e) => setText(e.target.value)} />
      <div className="flex justify-end mt-2">
        <Button size="sm" icon={Save} loading={saving} disabled={text === (saved || '')} onClick={save}>احفظ التوصيات</Button>
      </div>
    </div>
  );
}

function ResultsTab({ eventId, results, onRecommendations }) {
  const { stats, axes, recommendations } = results;
  return (
    <div className="space-y-4">
      <StatStrip
        items={[
          { label: `المتوسط العام · ${verbal(stats.average)}`, value: fmtAvg(stats.average) },
          { label: 'مشاركاً', value: stats.participants },
          { label: 'أكملوا', value: stats.finished },
        ]}
      />
      {axes.map((x, i) => (
        <Panel
          key={x.id}
          title={`${i + 1}. ${x.title}`}
          actions={<span className="shrink-0 text-xs font-semibold px-2 h-6 inline-flex items-center rounded-md bg-ink-faint text-ink">{fmtAvg(x.average)} من 5 · {verbal(x.average)}</span>}
        >
          <p className="text-xs text-muted mb-2">{x.done} أجابوا · {x.skipped} تخطّوا · {x.overall_count} قيّموا المحور عامةً</p>
          <ul className="divide-y divide-line">
            {x.questions.map((q) => (
              <li key={q.id} className="py-2 grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_8rem_3rem] gap-x-3 gap-y-1 items-center text-sm">
                <span className="text-ink">{q.t}</span>
                <span className="font-display text-ink text-end sm:order-last">{fmtAvg(q.average, 1)}</span>
                <Bar value={q.average ? q.average / 5 : 0} className="col-span-2 sm:col-span-1" />
              </li>
            ))}
          </ul>
          <div className="grid gap-4 sm:grid-cols-2 mt-3">
            <NotesList title="الإيجابيات" notes={x.positives} tone="bg-st-queue" recLabel="التوصية" />
            <NotesList title="السلبيات" notes={x.negatives} tone="bg-red-600" recLabel="المقترح" />
          </div>
          <div className="mt-3">
            <RecommendationBox eventId={eventId} axisId={x.id} saved={recommendations?.[x.id]} onSaved={onRecommendations} />
          </div>
        </Panel>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- page

export default function VolunteerEvaluationAdmin() {
  const { eventId } = useParams();
  const { token } = useContext(AppContext);
  const toast = useToast();
  const [data, setData] = useState(null); // {event, evaluation}; opening creates it from the default file
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('session');
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(null); // {type: 'participant', p} | {type: 'evaluation'}

  const load = useCallback(async () => {
    setError(null);
    try {
      setData(await requestJson(`/volunteer-eval/${eventId}`, { token }));
    } catch (e) {
      setError(e.message);
    }
  }, [eventId, token]);

  const loadResults = useCallback(async () => {
    try {
      setResults(await requestJson(`/volunteer-eval/${eventId}/results`, { token }));
    } catch { /* keep the last numbers on a network hiccup */ }
  }, [eventId, token]);

  useEffect(() => { load(); }, [load]);

  const evaluationId = data?.evaluation?.id;
  useEffect(() => {
    if (!evaluationId || tab === 'questions') return undefined;
    loadResults();
    const id = setInterval(() => { if (!document.hidden) loadResults(); }, REFRESH_MS);
    return () => clearInterval(id);
  }, [evaluationId, tab, loadResults]);

  const updateSession = async (body, message) => {
    setBusy(true);
    try {
      const res = await requestJson(`/volunteer-eval/${eventId}/session`, { method: 'PUT', token, body });
      setData((d) => ({ ...d, evaluation: { ...d.evaluation, session: res.session } }));
      setResults((r) => (r ? { ...r, session: res.session, now: res.now } : r));
      toast(message);
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const runConfirm = async () => {
    setBusy(true);
    try {
      if (confirm.type === 'participant') {
        await requestJson(`/volunteer-eval/${eventId}/participants/${confirm.p.id}`, { method: 'DELETE', token });
        toast('حُذفت المشاركة');
        loadResults();
      } else {
        await requestJson(`/volunteer-eval/${eventId}`, { method: 'DELETE', token });
        toast('حُذف التقييم، وأُعيد إنشاؤه بالأسئلة الافتراضية');
        setResults(null);
        await load();
      }
      setConfirm(null);
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const back = (
    <Link to={`/admin/event-tracking/${eventId}`} className="inline-flex items-center gap-1 text-sm text-muted mb-2 min-h-[2.75rem]">
      <ChevronRight className="w-4 h-4" /> متابعة الحدث
    </Link>
  );

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        {back}
        <div className="bg-white border border-line rounded-2xl">
          <EmptyState title="تعذّر تحميل التقييم" action={<Button icon={RefreshCw} onClick={load}>أعد المحاولة</Button>}>{error}</EmptyState>
        </div>
      </div>
    );
  }
  if (!data) return <LoadingState />;

  const eventName = data.event?.name || '';
  const evaluation = data.evaluation;

  const session = results?.session || evaluation.session;

  return (
    <div className="max-w-3xl lg:max-w-5xl mx-auto">
      {back}
      <PageHeader
        title="تقييم المتطوعين"
        subtitle={eventName}
        actions={
          <span className={cx('inline-flex items-center gap-1 h-7 px-2.5 rounded-md text-xs font-semibold', session.is_open ? 'bg-st-queue-bg text-st-queue' : 'bg-st-pending-bg text-st-pending')}>
            {session.is_open ? <LockOpen className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            {session.is_open ? 'مفتوح' : 'مغلق'}
          </span>
        }
      />
      <ChipGroup label="أقسام التقييم" value={tab} onChange={setTab} options={TABS} className="mb-4" />

      {tab === 'session' && (
        <>
          <SessionTab
            eventId={eventId}
            eventName={eventName}
            participantsCount={results?.stats.participants ?? evaluation.participants_count}
            session={session}
            now={results?.now}
            onSession={updateSession}
            busy={busy}
          />
          <div className="mt-6 pt-4 border-t border-line">
            <Button variant="danger" size="sm" icon={Trash2} onClick={() => setConfirm({ type: 'evaluation' })}>أعد التقييم من البداية</Button>
          </div>
        </>
      )}
      {tab === 'people' && (results ? <PeopleTab results={results} roles={evaluation.roles} onDelete={(p) => setConfirm({ type: 'participant', p })} /> : <LoadingState />)}
      {tab === 'questions' && (
        <QuestionsTab
          key={evaluation.id}
          evaluation={evaluation}
          onSaved={(ev) => setData((d) => ({ ...d, evaluation: { ...d.evaluation, ...ev } }))}
        />
      )}
      {tab === 'results' && (results ? (
        <ResultsTab eventId={eventId} results={results} onRecommendations={(recommendations) => setResults((r) => ({ ...r, recommendations }))} />
      ) : <LoadingState />)}

      <ConfirmSheet
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={confirm?.type === 'evaluation' ? 'إعادة التقييم من البداية' : 'حذف المشاركة'}
        confirmLabel="احذف"
        loading={busy}
        onConfirm={runConfirm}
      >
        {confirm?.type === 'evaluation' ? (
          <p>تُحذف كل إجابات المتطوعين والتوصيات وتعديلات الأسئلة، ويبدأ التقييم من جديد بالأسئلة الافتراضية. لا يمكن التراجع عن ذلك.</p>
        ) : (
          <p>تُحذف هذه المشاركة وكل إجاباتها من النتائج. لا يمكن التراجع عن ذلك.</p>
        )}
      </ConfirmSheet>
    </div>
  );
}
