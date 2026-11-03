import { useState, useMemo } from 'react';
import { ChipGroup, Panel, EmptyState, cx } from '../../../../Components/ui';

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

/**
 * Booked vs capacity per specialty, day and hour. Body only: the event
 * statistics page loads /events/{id}/appointment-distribution and passes it in.
 */
export default function AppointmentDistribution({ data }) {
  const [day, setDay] = useState('all');

  const dayOptions = useMemo(() => {
    const seen = new Map();
    (data?.distribution || []).forEach((s) => s.days.forEach((d) => {
      if (!seen.has(d.formatted_date)) seen.set(d.formatted_date, d.day_name);
    }));
    return [...seen.entries()].map(([date, name]) => ({ value: date, label: name ? `${name} ${date}` : date }));
  }, [data]);

  if (!data) return null;

  return (
    <div>
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
        <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-2 2xl:grid-cols-3 lg:gap-4 lg:items-start">
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
                          {d.total_appointments} / {d.total_capacity}{d.number_per_hour ? `، ${d.number_per_hour} في الساعة` : ''}
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
