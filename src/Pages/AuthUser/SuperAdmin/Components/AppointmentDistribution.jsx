import { API_BASE_URL } from '../../../../config/environment';
import { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import { AppContext } from '../../../../Context/AppContext';
import { PageHeader, StatStrip, ChipGroup, Panel, LoadingState, EmptyState, Button, cx } from '../../../../Components/ui';

const apiUrl = API_BASE_URL;

// Hour fill status from the API → st-* colours
const STATUS = {
  full: { label: 'ممتلئ', bar: 'bg-st-pushed', text: 'text-st-pushed' },
  almost_full: { label: 'شبه ممتلئ', bar: 'bg-st-hold', text: 'text-st-hold' },
  half_full: { label: 'نصف ممتلئ', bar: 'bg-st-queue', text: 'text-st-queue' },
  available: { label: 'متاح', bar: 'bg-st-queue', text: 'text-st-queue' },
  empty: { label: 'فارغ', bar: 'bg-st-pending', text: 'text-muted' },
};
const statusOf = (s) => STATUS[s] || STATUS.empty;

const pct = (value) => Math.max(0, Math.min(100, Number(value) || 0));

/** Booked vs capacity per specialty, day and hour. Page body, not a modal. */
export default function AppointmentDistribution({ eventId, onClose }) {
  const { token } = useContext(AppContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [day, setDay] = useState('all');

  const fetchDistribution = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${apiUrl}/api/events/${eventId}/appointment-distribution`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch {
      setError('تعذر تحميل توزيع المواعيد');
    } finally {
      setLoading(false);
    }
  }, [eventId, token]);

  useEffect(() => {
    fetchDistribution();
  }, [fetchDistribution]);

  const dayOptions = useMemo(() => {
    const seen = new Map();
    (data?.distribution || []).forEach((s) => s.days.forEach((d) => {
      if (!seen.has(d.formatted_date)) seen.set(d.formatted_date, d.day_name);
    }));
    return [...seen.entries()].map(([date, name]) => ({ value: date, label: name ? `${name} ${date}` : date }));
  }, [data]);

  const back = onClose && (
    <button type="button" onClick={onClose} className="inline-flex items-center gap-1 text-sm text-muted mb-2 min-h-[2.75rem]">
      <ChevronRight className="w-4 h-4" /> متابعة الحدث
    </button>
  );

  if (loading && !data) return <LoadingState />;

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        {back}
        <div className="bg-white border border-line rounded-2xl">
          <EmptyState title={error} action={<Button variant="secondary" onClick={fetchDistribution}>أعد المحاولة</Button>}>
            تحقق من الشبكة ثم أعد المحاولة.
          </EmptyState>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const stats = data.statistics || {};

  return (
    <div className="max-w-2xl mx-auto">
      {back}
      <PageHeader title="توزيع المواعيد" subtitle={data.event?.name} />

      <StatStrip
        className="mb-4"
        items={[
          { label: 'الحجوزات', value: stats.total_appointments },
          { label: 'السعة', value: stats.total_capacity },
          { label: 'أماكن متاحة', value: stats.total_available, tone: 'text-st-queue' },
          { label: 'نسبة الامتلاء', value: `${stats.percentage_full ?? 0}%` },
          { label: 'المرضى', value: stats.total_patients },
        ]}
      />

      {dayOptions.length > 1 && (
        <ChipGroup
          className="mb-4"
          label="اليوم"
          value={day}
          onChange={setDay}
          options={[{ value: 'all', label: 'كل الأيام' }, ...dayOptions]}
        />
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mb-4 text-xs text-muted">
        {['empty', 'available', 'almost_full', 'full'].map((k) => (
          <span key={k} className="inline-flex items-center gap-1.5">
            <span className={cx('w-3 h-3 rounded-sm', STATUS[k].bar)} aria-hidden="true" />
            {k === 'available' ? 'متاح / نصف ممتلئ' : STATUS[k].label}
          </span>
        ))}
      </div>

      {(data.distribution || []).length === 0 ? (
        <div className="bg-white border border-line rounded-2xl">
          <EmptyState title="لا توجد تخصصات في هذا الحدث">أضف التخصصات وأيامها من «عدّل الحدث».</EmptyState>
        </div>
      ) : (
        <div className="space-y-4">
          {data.distribution.map((specialty, specIndex) => {
            const days = specialty.days.filter((d) => day === 'all' || d.formatted_date === day);
            if (days.length === 0) return null;
            return (
              <Panel
                key={specIndex}
                title={
                  <span className="flex items-center gap-2">
                    {specialty.specialty_name}
                    {specialty.is_saturated && <span className="inline-flex items-center h-6 px-2 rounded-md text-xs font-semibold bg-st-pushed-bg text-st-pushed">مشبع</span>}
                  </span>
                }
                actions={
                  <span className="text-sm text-muted tabular-nums whitespace-nowrap">
                    <span className="font-display text-base text-ink">{specialty.total_appointments}</span> / {specialty.total_capacity}
                  </span>
                }
              >
                <div className="space-y-4">
                  {days.map((d, dayIndex) => (
                    <div key={dayIndex}>
                      <div className="flex items-baseline justify-between gap-2 mb-2">
                        <p className="text-sm font-semibold text-ink">
                          {d.day_name} <span className="font-normal text-muted">{d.formatted_date}</span>
                        </p>
                        <p className="text-xs text-muted tabular-nums whitespace-nowrap">
                          {d.total_appointments} / {d.total_capacity}، {d.number_per_hour} في الساعة
                        </p>
                      </div>
                      <ul className="space-y-1.5">
                        {d.hours.map((hour, hourIndex) => {
                          const s = statusOf(hour.status);
                          return (
                            <li key={hourIndex} className="flex items-center gap-3" title={`${s.label}: ${hour.counter} من ${hour.max_allowed}`}>
                              <span className="w-12 shrink-0 text-sm font-semibold text-ink tabular-nums" dir="ltr">{hour.formatted_time}</span>
                              <span className="flex-1 h-3 rounded-full bg-paper overflow-hidden" role="img" aria-label={`${hour.counter} من ${hour.max_allowed}، ${s.label}`}>
                                <span className={cx('block h-full rounded-full', s.bar)} style={{ width: `${pct(hour.percentage_full)}%` }} />
                              </span>
                              <span className={cx('w-16 shrink-0 text-xs tabular-nums text-end', s.text)}>
                                {hour.counter}/{hour.max_allowed}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              </Panel>
            );
          })}
        </div>
      )}
    </div>
  );
}
