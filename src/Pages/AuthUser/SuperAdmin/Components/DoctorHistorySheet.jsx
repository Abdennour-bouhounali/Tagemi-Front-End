import { API_BASE_URL } from '../../../../config/environment';
import { useContext, useEffect, useState } from 'react';
import { CalendarDays, Clock, LogIn, LogOut } from 'lucide-react';
import { AppContext } from '../../../../Context/AppContext';
import { LoadingState, Sheet, StatStrip, cx } from '../../../../Components/ui';

const apiUrl = API_BASE_URL;

const formatDate = (date) => {
  const d = new Date(`${date}T00:00:00`);
  return Number.isNaN(d.getTime()) ? date : d.toLocaleDateString('ar-DZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

/** Every event day a doctor was scheduled: intervals, planned visits, arrival and departure. */
export default function DoctorHistorySheet({ doctor, onClose }) {
  const { token } = useContext(AppContext);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!doctor) return;
    setData(null);
    setError('');
    fetch(`${apiUrl}/api/doctors/${doctor.id}/history`, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } })
      .then((res) => res.json().then((json) => (res.ok ? setData(json) : setError(json.message || 'تعذر تحميل السجل'))))
      .catch(() => setError('تعذر الاتصال بالخادم'));
  }, [doctor, token]);

  return (
    <Sheet size="lg" open={!!doctor} onClose={onClose} title={doctor ? `سجل مشاركات ${doctor.full_name}` : ''}>
      {error ? (
        <p className="text-sm text-red-700 py-6 text-center">{error}</p>
      ) : !data ? (
        <LoadingState />
      ) : data.days.length === 0 ? (
        <p className="text-sm text-muted py-6 text-center">لم يُبرمج هذا الطبيب في أي حدث بعد.</p>
      ) : (
        <>
          <StatStrip
            className="mb-4"
            items={[
              { label: 'حدث', value: data.summary.events },
              { label: 'يوم مبرمج', value: data.summary.days },
              { label: 'يوم حضر', value: data.summary.days_present },
              { label: 'زيارة مخططة', value: data.summary.planned_visits },
            ]}
          />
          <ul className="space-y-2">
            {data.days.map((d) => (
              <li key={`${d.event_id}-${d.day_date}`} className="rounded-xl border border-line p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-ink truncate">{d.event_name}{d.event_archived && <span className="ms-2 text-xs font-normal text-muted">مؤرشف</span>}</p>
                    <p className="text-sm text-muted">{d.specialty}</p>
                  </div>
                  <span className="shrink-0 text-xs text-muted">{d.planned_visits} زيارة</span>
                </div>
                <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                  <span className="inline-flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" />{formatDate(d.day_date)}</span>
                  <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" /><span dir="ltr">{d.intervals.join('، ')}</span></span>
                </p>
                <p className={cx('mt-1.5 flex flex-wrap items-center gap-x-3 text-xs', d.arrived_at ? 'text-ink' : 'text-muted')}>
                  {d.arrived_at ? (
                    <>
                      <span className="inline-flex items-center gap-1"><LogIn className="w-3.5 h-3.5 text-st-queue" />وصل <span dir="ltr">{d.arrived_at}</span></span>
                      <span className="inline-flex items-center gap-1"><LogOut className="w-3.5 h-3.5" />{d.left_at ? <>غادر <span dir="ltr">{d.left_at}</span></> : 'لم تُسجَّل المغادرة'}</span>
                    </>
                  ) : 'لم يُسجَّل حضوره'}
                </p>
              </li>
            ))}
          </ul>
        </>
      )}
    </Sheet>
  );
}
