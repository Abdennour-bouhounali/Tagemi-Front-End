import { API_BASE_URL } from '../../../config/environment';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, Droplets, Lock, Unlock } from 'lucide-react';
import { AppContext } from '../../../Context/AppContext';
import useLiveRefresh from '../../../utils/useLiveRefresh';
import { PageHeader, LoadingState, EmptyState, useToast, cx } from '../../../Components/ui';

const apiUrl = API_BASE_URL;

// Specialty officer / doctor home: pick the queue to run, with today's live counts.
// The super admin also opens a specialty's queue here when its doctor arrives.
export default function StationsPicker() {
  const { eventId } = useParams();
  const { user, token } = useContext(AppContext);
  const toast = useToast();
  const [data, setData] = useState(null);
  const [toggling, setToggling] = useState(null);
  const isSuperAdmin = user?.role_id === 1;

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/api/events/${eventId}/stations`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      const json = await res.json();
      if (res.ok) setData(json);
      else toast(json.message || 'تعذر تحميل التخصصات', 'error');
    } catch {
      toast('تعذر الاتصال بالخادم', 'error');
    }
  }, [eventId, token, toast]);

  useEffect(() => { load(); }, [load]);

  const toggleOpen = async (s) => {
    setToggling(s.event_specialty_id);
    try {
      const res = await fetch(`${apiUrl}/api/event-specialties/${s.event_specialty_id}/toggle-open`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      const json = await res.json().catch(() => ({}));
      toast(json.message || (res.ok ? 'تم' : 'تعذر تنفيذ العملية'), res.ok ? 'success' : 'error');
      if (res.ok) load();
    } catch {
      toast('تعذر الاتصال بالخادم', 'error');
    } finally {
      setToggling(null);
    }
  };
  useLiveRefresh(eventId, token, load);

  if (!data) return <LoadingState />;

  const rooms = data.stations.filter((s) => s.has_dilatation);

  return (
    <div className="max-w-2xl lg:max-w-none mx-auto">
      <PageHeader title="اختر الطابور" subtitle={`طوابير اليوم في ${data.event.name}`} />
      {isSuperAdmin && (
        <p className="text-sm text-muted mb-3">افتح طابور التخصص عند وصول طبيبه، فيُوجَّه إليه المرضى الأقل انتظاراً تلقائياً.</p>
      )}

      {data.stations.length === 0 ? (
        <EmptyState title="لا توجد تخصصات في هذا الحدث" />
      ) : (
        <ul className="bg-white border border-line rounded-2xl divide-y divide-line lg:grid lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 lg:gap-3 lg:bg-transparent lg:border-0 lg:rounded-none lg:divide-y-0">
          {data.stations.map((s) => (
            <li key={s.event_specialty_id} className="flex items-center lg:bg-white lg:border lg:border-line lg:rounded-2xl">
              <Link to={`/admin/event-waiting-lists/${eventId}/${s.specialty_id}`} className="flex-1 min-w-0 flex items-center gap-3 px-4 min-h-[4.5rem] hover:bg-ink-faint first:rounded-t-2xl last:rounded-b-2xl lg:rounded-2xl">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-ink truncate flex items-center gap-2">
                    {s.name}
                    {!s.is_open && <Lock className="w-4 h-4 text-muted" aria-label="الطابور مغلق" />}
                  </p>
                  <p className="text-sm text-muted">
                    {s.is_open ? `أنهى الفحص اليوم: ${s.completed}` : `مغلق، ينتظره ${s.waiting} مريض`}
                  </p>
                </div>
                <div className="text-center">
                  <p className="font-display text-2xl text-st-queue leading-none">{s.in_queue}</p>
                  <p className="text-[11px] text-muted mt-1">في الطابور</p>
                </div>
                <ChevronLeft className="w-5 h-5 text-muted" />
              </Link>
              {isSuperAdmin && (
                <button
                  type="button"
                  onClick={() => toggleOpen(s)}
                  disabled={toggling !== null}
                  className={cx('shrink-0 inline-flex items-center gap-1.5 h-9 px-3 me-3 rounded-full text-xs font-semibold border disabled:opacity-60',
                    s.is_open ? 'border-st-queue/40 text-st-queue bg-st-queue-bg' : 'border-red-300 text-red-700 bg-red-50')}
                  aria-label={s.is_open ? `إغلاق طابور ${s.name}` : `فتح طابور ${s.name}`}
                >
                  {s.is_open ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  {toggling === s.event_specialty_id ? '...' : s.is_open ? 'مفتوح' : 'افتح'}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {rooms.length > 0 && (
        <>
          <h2 className="font-display text-lg text-ink mt-6 mb-2">قاعات التمدد</h2>
          <ul className="bg-white border border-line rounded-2xl divide-y divide-line lg:grid lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 lg:gap-3 lg:bg-transparent lg:border-0 lg:rounded-none lg:divide-y-0">
            {rooms.map((s) => (
              <li key={s.event_specialty_id} className="lg:bg-white lg:border lg:border-line lg:rounded-2xl">
                <Link to={`/admin/dilatation/${eventId}/${s.event_specialty_id}`} className="flex items-center gap-3 px-4 min-h-[4.5rem] hover:bg-ink-faint first:rounded-t-2xl last:rounded-b-2xl lg:rounded-2xl">
                  <Droplets className="w-6 h-6 text-st-dil shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-ink truncate">قاعة تمدد {s.name}</p>
                    <p className="text-sm text-muted">في الطريق: {s.dilatation_coming}، في القاعة: {s.dilatation_in_room}</p>
                  </div>
                  <ChevronLeft className="w-5 h-5 text-muted" />
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
