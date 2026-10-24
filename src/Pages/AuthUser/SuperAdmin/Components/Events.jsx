import { API_BASE_URL } from '../../../../config/environment';
import { useContext, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MoreVertical, ChevronRight, CalendarDays, Activity, Info, Link as LinkIcon, Monitor, MessageSquareHeart,
  Power, PencilLine, Users, PieChart, TrendingUp, Archive, RotateCcw, FileText, BarChart3, Plus, MapPin, Unlock, FlaskConical, Trash2, UserCog,
} from 'lucide-react';
import { AppContext } from '../../../../Context/AppContext';
import {
  Button, IconButton, PageHeader, SearchField, ChipGroup, EmptyState, LoadingState, Sheet, SheetAction, useToast, cx,
} from '../../../../Components/ui';
import EventAdminsManager from './EventAdminsManager';
import EditEvent from './EditEvent';
import EventDetails from './EventDetails';
import QueueOpening from './QueueOpening';
import { ConfirmSheet } from './EventFormParts';

const apiUrl = API_BASE_URL;

export const eventStatus = (event) => (event.is_archived ? 'archived' : event.is_active ? 'active' : 'inactive');

const STATUS = {
  active: { label: 'نشط', cls: 'bg-st-queue-bg text-st-queue' },
  inactive: { label: 'غير نشط', cls: 'bg-st-pending-bg text-muted' },
  archived: { label: 'مؤرشف', cls: 'bg-st-done-bg text-st-done' },
};
const STATUS_ORDER = { active: 0, inactive: 1, archived: 2 };

export function EventStatusChip({ event, className }) {
  const s = STATUS[eventStatus(event)];
  return <span className={cx('inline-flex items-center h-6 px-2 rounded-md text-xs font-semibold whitespace-nowrap', s.cls, className)}>{s.label}</span>;
}

const fmt = (value, withYear) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('ar-DZ', withYear ? { day: 'numeric', month: 'long', year: 'numeric' } : { day: 'numeric', month: 'long' });
};

const dateRange = (event) => {
  const start = event.start_date || event.date;
  const end = event.end_date;
  if (!start) return 'بدون تاريخ';
  if (!end || String(end).slice(0, 10) === String(start).slice(0, 10)) return fmt(start, true);
  return `من ${fmt(start)} إلى ${fmt(end, true)}`;
};

/**
 * The super admin's home: every event as a row (tap → tracking), with a ⋮
 * sheet for the rest. Edit and the team accounts open as full screens.
 */
export default function Events({ events, getEvents, loading: listLoading, onAdd }) {
  const { token } = useContext(AppContext);
  const toast = useToast();
  const navigate = useNavigate();

  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');

  const [menuEvent, setMenuEvent] = useState(null);
  const [screen, setScreen] = useState(null); // { type: 'edit' | 'admins' | 'queues', event }
  const [detailsEvent, setDetailsEvent] = useState(null);
  const [archiveTarget, setArchiveTarget] = useState(null); // { event, count }
  const [restoreTarget, setRestoreTarget] = useState(null);
  const [trainingAction, setTrainingAction] = useState(null); // { type: 'start' | 'reset' | 'delete', event? }

  const trainingEvent = events.find((e) => e.is_simulation);

  // --- Training event (simulation) ---

  async function runTrainingAction() {
    const { type, event } = trainingAction;
    const request = {
      start: ['/api/events/training', 'POST', 'أُنشئ الحدث التدريبي لليوم'],
      reset: [`/api/events/${event?.id}/training/reset`, 'POST', 'أُعيد ضبط الحدث التدريبي'],
      delete: [`/api/events/${event?.id}/training`, 'DELETE', 'حُذف الحدث التدريبي'],
    }[type];
    setBusy(true);
    try {
      const res = await fetch(`${apiUrl}${request[0]}`, {
        method: request[1],
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast(request[2]);
        setTrainingAction(null);
        getEvents();
      } else {
        toast(data.message || 'تعذر تنفيذ العملية', 'error');
      }
    } catch {
      toast('تعذر الاتصال بالخادم', 'error');
    } finally {
      setBusy(false);
    }
  }

  // --- Actions (same endpoints as before) ---

  async function handleSetActive(event) {
    setBusy(true);
    try {
      const res = await fetch(`${apiUrl}/api/events/${event.id}/set-active`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast(data.message || (event.is_active ? 'أُوقف الحدث' : 'فُعّل الحدث'));
        getEvents();
      } else {
        toast(data.message || 'تعذر تغيير حالة الحدث', 'error');
      }
    } catch {
      toast('تعذر الاتصال بالخادم', 'error');
    } finally {
      setBusy(false);
      setMenuEvent(null);
    }
  }

  // Opens the confirm sheet, then loads how many appointments go with the event
  async function askArchive(event) {
    setMenuEvent(null);
    setArchiveTarget({ event, count: null });
    try {
      const statsRes = await fetch(`${apiUrl}/api/${event.id}/statistics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const stats = await statsRes.json();
      setArchiveTarget((t) => (t && t.event.id === event.id ? { ...t, count: stats.total_appointments || 0 } : t));
    } catch {
      setArchiveTarget((t) => (t && t.event.id === event.id ? { ...t, count: 0 } : t));
    }
  }

  async function handleArchive() {
    const { event, count } = archiveTarget;
    setBusy(true);
    try {
      const res = await fetch(`${apiUrl}/api/events/${event.id}/archive`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        const archivedCount = data.archived_appointments || count || 0;
        toast(`أُرشف الحدث${archivedCount > 0 ? ` مع ${archivedCount} موعد` : ''}`);
        setArchiveTarget(null);
        getEvents();
      } else {
        toast(data.message || 'تعذرت أرشفة الحدث', 'error');
      }
    } catch {
      toast('تعذر الاتصال بالخادم', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function handleRestore() {
    const event = restoreTarget;
    setBusy(true);
    try {
      const res = await fetch(`${apiUrl}/api/events/${event.id}/restore`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        toast(data.message || 'استُعيد الحدث');
        setRestoreTarget(null);
        getEvents();
      } else {
        toast(data.message || 'تعذرت استعادة الحدث', 'error');
      }
    } catch {
      toast('تعذر الاتصال بالخادم', 'error');
    } finally {
      setBusy(false);
    }
  }

  const copyLink = async (path, label) => {
    setMenuEvent(null);
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${path}`);
      toast(`نُسخ ${label}`);
    } catch {
      toast('تعذر النسخ، افتح «التفاصيل والروابط» وانسخه يدويًا', 'error');
    }
  };

  const go = (to) => {
    setMenuEvent(null);
    navigate(to);
  };

  // --- List ---

  const counts = useMemo(() => {
    const c = { all: events.length, active: 0, inactive: 0, archived: 0 };
    events.forEach((e) => { c[eventStatus(e)] += 1; });
    return c;
  }, [events]);

  const visible = useMemo(() => {
    const q = query.trim();
    return events
      .map((e, i) => ({ e, i }))
      .filter(({ e }) => filter === 'all' || eventStatus(e) === filter)
      .filter(({ e }) => !q || [e.name, e.state, e.city].some((v) => String(v || '').includes(q)))
      .sort((a, b) => STATUS_ORDER[eventStatus(a.e)] - STATUS_ORDER[eventStatus(b.e)] || a.i - b.i)
      .map(({ e }) => e);
  }, [events, filter, query]);

  // --- Full screens ---

  if (screen?.type === 'edit') {
    return <EditEvent event={screen.event} onClose={() => setScreen(null)} onSuccess={getEvents} />;
  }

  if (screen?.type === 'queues') {
    return <QueueOpening event={screen.event} onClose={() => setScreen(null)} />;
  }

  if (screen?.type === 'admins') {
    return (
      <div className="max-w-2xl lg:max-w-4xl mx-auto">
        <button type="button" onClick={() => setScreen(null)} className="inline-flex items-center gap-1 text-sm text-muted mb-2 min-h-[2.75rem]">
          <ChevronRight className="w-4 h-4" /> الأحداث
        </button>
        <PageHeader title="حسابات الفريق" subtitle={screen.event.name} />
        <EventAdminsManager eventId={screen.event.id} eventName={screen.event.name} onRefresh={getEvents} />
      </div>
    );
  }

  const m = menuEvent;

  return (
    <div className="max-w-2xl lg:max-w-none mx-auto">
      <PageHeader
        title="الأحداث"
        subtitle="اضغط على حدث لمتابعته"
        actions={
          <>
            {!trainingEvent && (
              <Button variant="warning" icon={FlaskConical} onClick={() => setTrainingAction({ type: 'start' })}>حدث تدريبي</Button>
            )}
            <Button icon={Plus} onClick={onAdd}>حدث جديد</Button>
          </>
        }
      />

      {events.length > 6 && (
        <SearchField value={query} onChange={setQuery} placeholder="ابحث باسم الحدث أو الولاية" className="mb-3 lg:max-w-md" />
      )}
      {events.length > 0 && (
        <ChipGroup
          className="mb-4"
          label="حالة الحدث"
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'الكل', count: counts.all },
            { value: 'active', label: 'نشط', count: counts.active },
            { value: 'inactive', label: 'غير نشط', count: counts.inactive },
            { value: 'archived', label: 'مؤرشف', count: counts.archived },
          ]}
        />
      )}

      {listLoading && events.length === 0 ? (
        <LoadingState />
      ) : events.length === 0 ? (
        <div className="bg-white border border-line rounded-2xl">
          <EmptyState icon={CalendarDays} title="لا توجد أحداث بعد" action={<Button icon={Plus} onClick={onAdd}>حدث جديد</Button>}>
            أنشئ أول قافلة: اسمها ومكانها ثم تخصصاتها وأيامها.
          </EmptyState>
        </div>
      ) : visible.length === 0 ? (
        <div className="bg-white border border-line rounded-2xl">
          <EmptyState title="لا يوجد حدث بهذا البحث">غيّر كلمة البحث أو اختر «الكل».</EmptyState>
        </div>
      ) : (
        <ul className="bg-white border border-line rounded-2xl divide-y divide-line lg:grid lg:grid-cols-2 2xl:grid-cols-3 lg:gap-3 lg:bg-transparent lg:border-0 lg:rounded-none lg:divide-y-0">
          {visible.map((event) => {
            const place = [event.city, event.state].filter(Boolean).join('، ');
            return (
              <li key={event.id} className="flex items-center gap-1 pe-1 lg:bg-white lg:border lg:border-line lg:rounded-2xl">
                <Link
                  to={`/admin/event-tracking/${event.id}`}
                  className="flex-1 min-w-0 flex items-center gap-3 ps-4 py-3 min-h-[4.5rem] hover:bg-ink-faint rounded-2xl"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-ink truncate">
                      {event.name}
                      {event.is_simulation && <span className="ms-2 inline-flex items-center h-5 px-1.5 rounded-md text-[11px] font-semibold bg-st-pushed-bg text-st-pushed align-middle">تدريبي</span>}
                    </p>
                    {place && (
                      <p className="text-sm text-muted truncate flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 shrink-0" /> {place}
                      </p>
                    )}
                    <p className="text-xs text-muted mt-0.5 truncate">{dateRange(event)}</p>
                  </div>
                  <EventStatusChip event={event} />
                </Link>
                <IconButton icon={MoreVertical} label={`إجراءات ${event.name}`} onClick={() => setMenuEvent(event)} />
              </li>
            );
          })}
        </ul>
      )}

      {/* Per-event actions */}
      <Sheet open={!!m} onClose={() => setMenuEvent(null)} title={m?.name || ''}>
        {m && (
          <div className="divide-y divide-line">
            <div className="pb-1">
              <SheetAction icon={m.is_archived ? Archive : Activity} onClick={() => go(`/admin/event-tracking/${m.id}`)}>
                {m.is_archived ? 'افتح الأرشيف والتقارير' : 'افتح المتابعة'}
              </SheetAction>
              {!m.is_archived && (
                <SheetAction icon={Unlock} hint="يوم الفحص: افتح التخصص عند وصول طبيبه" onClick={() => { setScreen({ type: 'queues', event: m }); setMenuEvent(null); }}>
                  فتح الطوابير عند وصول الأطباء
                </SheetAction>
              )}
              <SheetAction icon={Info} hint="الروابط العامة وملصق «اعرف دورك»" onClick={() => { setDetailsEvent(m); setMenuEvent(null); }}>
                التفاصيل والروابط
              </SheetAction>
            </div>

            {!m.is_archived && (
              <div className="py-1">
                <SheetAction icon={LinkIcon} onClick={() => copyLink(`/appointment/${m.id}`, 'رابط الحجز')}>انسخ رابط الحجز</SheetAction>
                <SheetAction icon={Monitor} onClick={() => copyLink(`/waiting-list/${m.id}`, 'رابط شاشة الانتظار')}>انسخ رابط شاشة الانتظار</SheetAction>
                <SheetAction icon={MessageSquareHeart} onClick={() => copyLink(`/evaluation/${m.id}`, 'رابط التقييم')}>انسخ رابط التقييم</SheetAction>
              </div>
            )}

            <div className="py-1">
              {!m.is_archived && (
                <>
                  <SheetAction icon={Power} disabled={busy} hint={m.is_active ? 'يتوقف قبول الحجوزات' : 'يبدأ قبول الحجوزات'} onClick={() => handleSetActive(m)}>
                    {m.is_active ? 'أوقف الحدث' : 'فعّل الحدث'}
                  </SheetAction>
                  <SheetAction icon={PencilLine} onClick={() => { setScreen({ type: 'edit', event: m }); setMenuEvent(null); }}>عدّل الحدث</SheetAction>
                </>
              )}
              <SheetAction icon={Users} onClick={() => { setScreen({ type: 'admins', event: m }); setMenuEvent(null); }}>حسابات الفريق</SheetAction>
              {!m.is_archived && (
                <SheetAction icon={PieChart} onClick={() => go(`/admin/appointment-distribution/${m.id}`)}>توزيع المواعيد</SheetAction>
              )}
            </div>

            <div className="py-1">
              {m.is_archived && (
                <>
                  <SheetAction icon={BarChart3} onClick={() => go(`/admin/archived/comprehensive-report/${m.id}`)}>التقرير الإحصائي</SheetAction>
                  <SheetAction icon={FileText} onClick={() => go(`/admin/event-report/${m.id}`)}>تقرير الحدث الشامل</SheetAction>
                </>
              )}
              <SheetAction icon={TrendingUp} onClick={() => go(`/admin/evaluation_stats/${m.id}`)}>إحصائيات التقييم</SheetAction>
            </div>

            <div className="pt-1">
              {m.is_simulation ? (
                <>
                  <SheetAction icon={UserCog} hint="عيّن الفريق على هذا الحدث من صفحة المستخدمين" onClick={() => go('/admin/users')}>
                    عيّن المستخدمين على الحدث
                  </SheetAction>
                  <SheetAction icon={RotateCcw} hint="يعود جديدًا بتاريخ اليوم و100 موعد معلّق" onClick={() => { setTrainingAction({ type: 'reset', event: m }); setMenuEvent(null); }}>
                    أعد ضبط الحدث التدريبي
                  </SheetAction>
                  <SheetAction icon={Trash2} tone="text-red-700" hint="يُحذف الحدث وكل ما فيه نهائيًا" onClick={() => { setTrainingAction({ type: 'delete', event: m }); setMenuEvent(null); }}>
                    احذف الحدث التدريبي
                  </SheetAction>
                </>
              ) : m.is_archived ? (
                <SheetAction icon={RotateCcw} hint="يرجع الحدث ومواعيده نشطة" onClick={() => { setRestoreTarget(m); setMenuEvent(null); }}>
                  استعد الحدث
                </SheetAction>
              ) : (
                <SheetAction icon={Archive} tone="text-red-700" hint="يُغلق الحدث وتنتقل مواعيده إلى الأرشيف" onClick={() => askArchive(m)}>
                  أرشف الحدث
                </SheetAction>
              )}
            </div>
          </div>
        )}
      </Sheet>

      <ConfirmSheet
        open={!!archiveTarget}
        onClose={() => !busy && setArchiveTarget(null)}
        title="أرشفة الحدث؟"
        confirmLabel="أرشف الحدث"
        loading={busy || archiveTarget?.count === null}
        onConfirm={handleArchive}
      >
        <p className="font-semibold">{archiveTarget?.event.name}</p>
        {archiveTarget?.count === null ? (
          <p className="text-muted">جاري حساب المواعيد...</p>
        ) : archiveTarget?.count > 0 ? (
          <p>ستنتقل معه <span className="font-display text-lg">{archiveTarget.count}</span> موعد إلى الأرشيف.</p>
        ) : (
          <p>لا توجد مواعيد في هذا الحدث.</p>
        )}
        <p className="text-muted">يمكنك استعادة الحدث ومواعيده لاحقًا.</p>
      </ConfirmSheet>

      <ConfirmSheet
        open={!!trainingAction}
        onClose={() => !busy && setTrainingAction(null)}
        title={{ start: 'بدء حدث تدريبي؟', reset: 'إعادة ضبط الحدث التدريبي؟', delete: 'حذف الحدث التدريبي؟' }[trainingAction?.type] || ''}
        confirmLabel={{ start: 'ابدأ التدريب', reset: 'أعد الضبط', delete: 'احذفه نهائيًا' }[trainingAction?.type] || ''}
        danger={trainingAction?.type === 'delete'}
        loading={busy}
        onConfirm={runTrainingAction}
      >
        {trainingAction?.type === 'start' && (
          <>
            <p>سيُنشأ حدث بتاريخ اليوم فيه 8 تخصصات و100 موعد تجريبي كلها معلّقة.</p>
            <p className="text-muted">بعدها عيّن الفريق عليه من صفحة المستخدمين وابدؤوا التدريب.</p>
          </>
        )}
        {trainingAction?.type === 'reset' && (
          <>
            <p>يعود الحدث كأنه جديد: تاريخ اليوم و100 موعد معلّق.</p>
            <p className="text-muted">كل ما جرى أثناء التدريب يختفي، والفريق المعيّن عليه يبقى معيّنًا.</p>
          </>
        )}
        {trainingAction?.type === 'delete' && (
          <>
            <p>سيُحذف الحدث التدريبي وكل مواعيده نهائيًا.</p>
            <p className="text-muted">الفريق المعيّن عليه سيصبح بلا حدث حتى تعيّنه على حدث آخر.</p>
          </>
        )}
      </ConfirmSheet>

      <ConfirmSheet
        open={!!restoreTarget}
        onClose={() => !busy && setRestoreTarget(null)}
        title="استعادة الحدث؟"
        confirmLabel="استعد الحدث"
        danger={false}
        loading={busy}
        onConfirm={handleRestore}
      >
        <p className="font-semibold">{restoreTarget?.name}</p>
        <p>ستعود كل المواعيد المؤرشفة لهذا الحدث، ويصبح الحدث نشطًا من جديد.</p>
      </ConfirmSheet>

      {detailsEvent && <EventDetails event={detailsEvent} onClose={() => setDetailsEvent(null)} />}
    </div>
  );
}
