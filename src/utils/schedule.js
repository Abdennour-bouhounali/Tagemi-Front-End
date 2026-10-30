// Doctors' working intervals, computed the same way as the API's
// DoctorScheduleService: visits = floor((end - start) / visit length) + extra
// visits added by hand. Each visit counts in the clock hour where it starts;
// the extra ones are spread over the interval's hours, first hours first.

export const toMinutes = (time) => {
  const [h, m] = String(time || '').split(':').map((n) => parseInt(n, 10));
  return Number.isNaN(h) ? NaN : h * 60 + (m || 0);
};

export const toTime = (minutes) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

export const extraOf = (interval) => Math.max(0, parseInt(interval.extra_visits, 10) || 0);

/** { visits (computed + extra), computed, extra, leftover, error } of one interval. */
export function intervalInfo({ start_time, end_time, visit_minutes, extra_visits }) {
  const start = toMinutes(start_time);
  const end = toMinutes(end_time);
  const visit = parseInt(visit_minutes, 10);
  const none = { visits: 0, computed: 0, extra: 0, leftover: 0 };
  if (Number.isNaN(start) || Number.isNaN(end)) return { ...none, error: 'حدّد وقت البداية والنهاية' };
  if (end <= start) return { ...none, error: 'وقت النهاية قبل البداية' };
  if (!visit || visit < 5 || visit > 240) return { ...none, error: 'مدة الزيارة من 5 إلى 240 دقيقة' };
  const computed = Math.floor((end - start) / visit);
  if (computed < 1) return { ...none, error: 'الفترة أقصر من زيارة واحدة' };
  const extra = extraOf({ extra_visits });
  if (extra > 500) return { ...none, error: 'الزيارات الإضافية 500 على الأكثر' };
  return { visits: computed + extra, computed, extra, leftover: (end - start) - computed * visit, error: '' };
}

export const dayVisits = (day) => day.intervals.reduce((sum, iv) => sum + intervalInfo(iv).visits, 0);

export const doctorVisits = (entry) => entry.days.reduce((sum, day) => sum + dayVisits(day), 0);

export const scheduleVisits = (schedule = []) => schedule.reduce((sum, entry) => sum + doctorVisits(entry), 0);

/** Index of the first interval overlapping an earlier one of the same day, or -1. */
export function overlapIndex(intervals) {
  const sorted = intervals
    .map((iv, i) => ({ i, start: toMinutes(iv.start_time), end: toMinutes(iv.end_time) }))
    .filter((x) => !Number.isNaN(x.start) && !Number.isNaN(x.end))
    .sort((a, b) => a.start - b.start);
  for (let k = 1; k < sorted.length; k += 1) {
    if (sorted[k].start < sorted[k - 1].end) return sorted[k].i;
  }
  return -1;
}

/** { 'YYYY-MM-DD': [['08:00', 6], ...] }: the hours patients can book, all doctors summed. */
export function hourlyByDate(schedule = []) {
  const byDate = {};
  schedule.forEach((entry) => entry.days.forEach((day) => {
    if (!day.day_date) return;
    const hours = (byDate[day.day_date] ||= {});
    day.intervals.forEach((iv) => {
      const { computed, extra } = intervalInfo(iv);
      const start = toMinutes(iv.start_time);
      const visit = parseInt(iv.visit_minutes, 10);
      const own = [];
      for (let k = 0; k < computed; k += 1) {
        const hour = toTime(Math.floor((start + k * visit) / 60) * 60);
        hours[hour] = (hours[hour] || 0) + 1;
        if (!own.includes(hour)) own.push(hour);
      }
      for (let k = 0; k < extra && own.length; k += 1) hours[own[k % own.length]] += 1;
    });
  }));
  return Object.fromEntries(Object.entries(byDate).sort().map(([date, hours]) => [date, Object.entries(hours).sort()]));
}

// "الأحد 4 ماي": an ISO date inside Arabic text gets its parts reordered
const dayLabel = (date) => {
  const d = new Date(`${date}T00:00:00`);
  return Number.isNaN(d.getTime()) ? date : d.toLocaleDateString('ar-DZ', { weekday: 'long', day: 'numeric', month: 'long' });
};

/** First problem of a specialty's schedule as a sentence, or ''. */
export function scheduleError(schedule, doctorName, label) {
  if (!schedule.length) return `أضف طبيبًا واحدًا على الأقل إلى ${label}`;
  for (const entry of schedule) {
    const name = doctorName(entry.doctor_id);
    if (!entry.days.length) return `أضف يوم عمل للطبيب ${name} في ${label}`;
    const dates = entry.days.map((d) => d.day_date);
    if (dates.some((d) => !d)) return `حدّد تاريخ كل أيام الطبيب ${name}`;
    if (new Set(dates).size !== dates.length) return `نفس اليوم مكرر للطبيب ${name}`;
    for (const day of entry.days) {
      const on = dayLabel(day.day_date);
      if (!day.intervals.length) return `أضف فترة عمل للطبيب ${name} يوم ${on}`;
      const bad = day.intervals.map(intervalInfo).find((info) => info.error);
      if (bad) return `${name} يوم ${on}: ${bad.error}`;
      if (overlapIndex(day.intervals) !== -1) return `فترات الطبيب ${name} تتداخل يوم ${on}`;
    }
  }
  return '';
}
