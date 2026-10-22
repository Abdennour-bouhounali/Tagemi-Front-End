import { API_BASE_URL } from '../../../config/environment';
import { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ChevronRight, ChevronLeft, ClipboardCheck, Monitor, PieChart, Activity, ListOrdered, Droplets,
  BarChart3, Users, MapPin, FileText, FileBarChart, TrendingUp, ListChecks, Archive,
} from 'lucide-react';
import { AppContext } from '../../../Context/AppContext';
import { PageHeader, StatStrip, LoadingState, EmptyState, useToast } from '../../../Components/ui';
import { EventStatusChip } from './Components/Events';

const apiUrl = API_BASE_URL;

/** A group of navigation rows: icon, title, one-line hint, chevron. */
function LinkList({ title, items }) {
  if (!items.length) return null;
  return (
    <section className="mb-6">
      <h2 className="font-display text-lg text-ink mb-2">{title}</h2>
      <ul className="bg-white border border-line rounded-2xl divide-y divide-line">
        {items.map((item) => (
          <li key={item.path}>
            <Link to={item.path} className="flex items-center gap-3 px-4 min-h-[4rem] py-2 hover:bg-ink-faint first:rounded-t-2xl last:rounded-b-2xl">
              <item.icon className={`w-5 h-5 shrink-0 ${item.tone || 'text-muted'}`} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-ink truncate">{item.title}</p>
                <p className="text-sm text-muted truncate">{item.hint}</p>
              </div>
              <ChevronLeft className="w-5 h-5 text-muted shrink-0" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Super admin's hub for one event: live tools, queues, and archive reports. */
const EventTracking = () => {
  const { eventId } = useParams();
  const { token, user } = useContext(AppContext);
  const toast = useToast();

  const [event, setEvent] = useState(null);
  const [specialties, setSpecialties] = useState([]);
  // Hidden dilatation rooms attached to a specialty (e.g. تصحيح النظر)
  const [dilatationStations, setDilatationStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchEventDetails = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiUrl}/api/events/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setEvent(data.event || data);
      else setError(data.message || 'تعذر تحميل الحدث');
    } catch {
      setError('تعذر الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  }, [eventId, token]);

  const fetchEventSpecialties = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/api/events/${eventId}/specialties`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        const unique = [];
        const ids = new Set();
        (data.event_specialties || []).forEach((es) => {
          if (es.specialty && !ids.has(es.specialty.id)) {
            ids.add(es.specialty.id);
            unique.push(es.specialty);
          }
        });
        setSpecialties(unique);
        setDilatationStations((data.event_specialties || []).filter((es) => es.has_dilatation));
      } else {
        toast(data.message || 'تعذر تحميل تخصصات الحدث', 'error');
      }
    } catch {
      toast('تعذر تحميل تخصصات الحدث', 'error');
    }
  }, [eventId, token, toast]);

  useEffect(() => {
    if (eventId) {
      fetchEventDetails();
      fetchEventSpecialties();
    }
  }, [eventId, fetchEventDetails, fetchEventSpecialties]);

  const back = (
    <Link to="/admin/manage-events" className="inline-flex items-center gap-1 text-sm text-muted mb-2 min-h-[2.75rem]">
      <ChevronRight className="w-4 h-4" /> الأحداث
    </Link>
  );

  if (loading) return <LoadingState />;

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        {back}
        <div className="bg-white border border-line rounded-2xl">
          <EmptyState title={error}>تحقق من الشبكة ثم أعد فتح الصفحة، أو عد إلى قائمة الأحداث.</EmptyState>
        </div>
      </div>
    );
  }

  const archived = !!event?.is_archived;
  const specs = event?.event_specialties || [];
  const totalAppointments = specs.reduce((sum, es) => sum + (es.appointments_count ?? 0), 0);
  const dayCount = new Set(specs.flatMap((es) => (es.days || []).map((d) => d.day_date)).filter(Boolean)).size;

  const liveTools = [
    { title: 'مكتب الحضور', hint: 'سجّل حضور المرضى وحدّث حالة مواعيدهم', icon: ClipboardCheck, path: `/admin/check-presence/${eventId}` },
    { title: 'شاشة قاعة الانتظار', hint: 'أول المرضى في طابور كل تخصص', icon: Monitor, path: `/admin/big-list-waiting/${eventId}` },
    { title: 'توزيع المواعيد', hint: 'الحجوزات والسعة لكل تخصص ويوم وساعة', icon: PieChart, path: `/admin/appointment-distribution/${eventId}` },
    { title: 'إحصائيات الحدث', hint: 'أرقام الحضور والفحص لحظة بلحظة', icon: Activity, path: `/admin/event-statistics/${eventId}` },
  ];

  const canSeeQueues = user && [1, 4, 6].includes(user.role_id);
  const queues = canSeeQueues
    ? [
        ...specialties
          .filter((s) => s.id !== 6)
          .map((s) => ({ title: s.name, hint: 'طابور التخصص', icon: ListOrdered, path: `/admin/event-waiting-lists/${eventId}/${s.id}` })),
        ...dilatationStations.map((es) => ({
          title: `قاعة تمدد ${es.specialty?.name || ''}`,
          hint: 'المرضى في الطريق وفي التمدد',
          icon: Droplets,
          tone: 'text-st-dil',
          path: `/admin/dilatation/${eventId}/${es.id}`,
        })),
      ]
    : [];

  const archiveReports = [
    { title: 'إحصائيات التخصصات', hint: 'المواعيد حسب التخصص', icon: BarChart3, path: `/admin/archived/specialty-stats/${eventId}` },
    { title: 'إحصائيات الحالات', hint: 'المواعيد حسب الحالة: أنهى الفحص، لم يحضر...', icon: PieChart, path: `/admin/archived/status-stats/${eventId}` },
    { title: 'إحصائيات ديموغرافية', hint: 'المرضى حسب العمر والجنس', icon: Users, path: `/admin/archived/demographic-stats/${eventId}` },
    { title: 'إحصائيات جغرافية', hint: 'المرضى حسب الولاية والبلدية', icon: MapPin, path: `/admin/archived/geographic-stats/${eventId}` },
    { title: 'قائمة المرضى الكاملة', hint: 'كل المرضى ومواعيدهم', icon: ListChecks, path: `/admin/archived/patients-list/${eventId}` },
    { title: 'التقرير الإحصائي', hint: 'كل الإحصائيات في صفحة واحدة للطباعة', icon: FileBarChart, path: `/admin/archived/comprehensive-report/${eventId}` },
    { title: 'تقرير الحدث الشامل', hint: 'تقرير مفصل عن الحدث', icon: FileText, path: `/admin/event-report/${eventId}` },
    { title: 'إحصائيات التقييم', hint: 'آراء المرضى في الحدث', icon: TrendingUp, path: `/admin/evaluation_stats/${eventId}` },
  ];

  const place = [event?.city, event?.state].filter(Boolean).join('، ');

  return (
    <div className="max-w-2xl mx-auto">
      {back}
      <PageHeader
        title={event?.name}
        subtitle={place || (archived ? 'أرشيف الحدث' : 'متابعة الحدث')}
        actions={event && <EventStatusChip event={event} />}
      />

      <StatStrip
        className="mb-5"
        items={[
          { label: 'المواعيد', value: totalAppointments },
          { label: 'التخصصات', value: specs.length },
          { label: 'الأيام', value: dayCount },
          dilatationStations.length > 0 && { label: 'قاعات التمدد', value: dilatationStations.length, tone: 'text-st-dil' },
        ]}
      />

      {archived ? (
        <>
          <p className="flex items-start gap-2 text-sm text-muted bg-white border border-line rounded-2xl px-4 py-3 mb-5">
            <Archive className="w-5 h-5 shrink-0" />
            هذا الحدث مؤرشف: يمكنك عرض الإحصائيات والتقارير فقط. لاستعادته افتح قائمة الأحداث.
          </p>
          <LinkList title="الإحصائيات والتقارير" items={archiveReports} />
        </>
      ) : (
        <>
          <LinkList title="أدوات اليوم" items={liveTools} />
          {canSeeQueues && (
            queues.length > 0 ? (
              <LinkList title="طوابير التخصصات" items={queues} />
            ) : (
              <section className="mb-6">
                <h2 className="font-display text-lg text-ink mb-2">طوابير التخصصات</h2>
                <div className="bg-white border border-line rounded-2xl">
                  <EmptyState title="لا توجد تخصصات في هذا الحدث">أضف التخصصات من «عدّل الحدث» في قائمة الأحداث.</EmptyState>
                </div>
              </section>
            )
          )}
        </>
      )}

      {event?.description && (
        <section className="mb-6">
          <h2 className="font-display text-lg text-ink mb-2">عن الحدث</h2>
          <p className="text-sm text-ink bg-white border border-line rounded-2xl px-4 py-3 whitespace-pre-line">{event.description}</p>
        </section>
      )}

      <p className="text-xs text-muted">
        رقم الحدث {event?.id}
        {event?.created_at && `، أُنشئ في ${new Date(event.created_at).toLocaleDateString('ar-DZ')}`}
      </p>
    </div>
  );
};

export default EventTracking;
