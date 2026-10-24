import { API_BASE_URL } from '../../../../config/environment';
import { useCallback, useContext, useEffect, useState } from 'react';
import { ChevronRight, Lock, Unlock } from 'lucide-react';
import { AppContext } from '../../../../Context/AppContext';
import useLiveRefresh from '../../../../utils/useLiveRefresh';
import { PageHeader, LoadingState, EmptyState, useToast, cx } from '../../../../Components/ui';

const apiUrl = API_BASE_URL;

/**
 * Super admin, visit day: open a specialty's queue when its doctor arrives.
 * Opening sends the waiting patients to it (and balances the long queues);
 * closing stops new patients, the current queue is still served.
 */
export default function QueueOpening({ event, onClose }) {
  const { token } = useContext(AppContext);
  const toast = useToast();
  const [data, setData] = useState(null);
  const [toggling, setToggling] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/api/events/${event.id}/stations`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      const json = await res.json();
      if (res.ok) setData(json);
      else toast(json.message || 'تعذر تحميل التخصصات', 'error');
    } catch {
      toast('تعذر الاتصال بالخادم', 'error');
    }
  }, [event.id, token, toast]);

  useEffect(() => { load(); }, [load]);
  useLiveRefresh(event.id, token, load);

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

  const stations = data?.stations || [];
  const openCount = stations.filter((s) => s.is_open).length;

  return (
    <div className="max-w-2xl lg:max-w-4xl mx-auto">
      <button type="button" onClick={onClose} className="inline-flex items-center gap-1 text-sm text-muted mb-2 min-h-[2.75rem]">
        <ChevronRight className="w-4 h-4" /> الأحداث
      </button>
      <PageHeader
        title="فتح الطوابير عند وصول الأطباء"
        subtitle={data ? `${event.name} · مفتوح اليوم ${openCount} من ${stations.length}` : event.name}
      />
      <p className="text-sm text-muted mb-3">
        افتح طابور التخصص عند وصول طبيبه، فيُوجَّه إليه المرضى المنتظرون تلقائياً. كل التخصصات تُغلق من جديد في بداية كل يوم.
      </p>

      {!data ? (
        <LoadingState />
      ) : stations.length === 0 ? (
        <div className="bg-white border border-line rounded-2xl">
          <EmptyState title="لا توجد تخصصات في هذا الحدث" />
        </div>
      ) : (
        <ul className="bg-white border border-line rounded-2xl divide-y divide-line lg:grid lg:grid-cols-2 lg:gap-3 lg:bg-transparent lg:border-0 lg:rounded-none lg:divide-y-0">
          {stations.map((s) => (
            <li key={s.event_specialty_id} className="flex items-center gap-3 px-4 min-h-[4.5rem] lg:bg-white lg:border lg:border-line lg:rounded-2xl">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-ink truncate">{s.name}</p>
                <p className="text-sm text-muted">
                  {s.is_open ? `في الطابور ${s.in_queue} · أنهى الفحص ${s.completed}` : `مغلق، ينتظره ${s.waiting} مريض`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggleOpen(s)}
                disabled={toggling !== null}
                className={cx('shrink-0 inline-flex items-center gap-1.5 h-10 px-4 rounded-full text-sm font-semibold border disabled:opacity-60',
                  s.is_open ? 'border-st-queue/40 text-st-queue bg-st-queue-bg' : 'border-red-300 text-red-700 bg-red-50')}
                aria-label={s.is_open ? `إغلاق طابور ${s.name}` : `فتح طابور ${s.name}`}
              >
                {s.is_open ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                {toggling === s.event_specialty_id ? '...' : s.is_open ? 'مفتوح · أغلق' : 'افتح'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
