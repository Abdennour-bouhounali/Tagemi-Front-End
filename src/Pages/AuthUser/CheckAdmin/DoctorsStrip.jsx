import { Coffee, LogIn, LogOut, Stethoscope } from 'lucide-react';
import { Button, cx } from '../../../Components/ui';
import { elapsedSeconds, formatElapsed, useNow } from '../../../utils/visitTimer';

/**
 * Doctors of the specialty today, on top of the queue page. The officer taps
 * a free doctor before «دخل»: present, or gone but finishing the patients
 * already in the queue. Each card shows the doctor's numbers
 * for today and, while a patient is inside, the visit timer (rose past the
 * alarm). The super admin also records arrival / departure here.
 *
 * onSelect: null when the user can't pick a doctor (viewer, patient manager).
 * onAttend: (doctor, 'arrive' | 'leave') for the super admin, else null.
 */
export default function DoctorsStrip({ doctors, selectedId, onSelect, onAttend, busyKey, offsetMs }) {
    const now = useNow();
    if (!doctors?.length) {
        return (
            <p className="mb-4 rounded-2xl border border-dashed border-line bg-white px-4 py-3 text-sm text-muted">
                لم يصل أي طبيب في هذا التخصص اليوم. يُسجَّل وصول الطبيب من صفحة «الأطباء والطوابير».
            </p>
        );
    }

    return (
        <section className="mb-4" aria-label="أطباء التخصص اليوم">
            {onSelect && (
                <p className="text-sm text-muted mb-2">اختر الطبيب ثم اضغط «دخل» على بطاقة الزائر.</p>
            )}
            <ul className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 lg:mx-0 lg:px-0 lg:flex-wrap">
                {doctors.map((d) => {
                    const selected = selectedId === d.doctor_id;
                    const finishing = !d.present && !!d.left_at;
                    const selectable = onSelect && (d.present || finishing) && !d.busy;
                    const elapsed = d.current ? elapsedSeconds(d.current.entered_at, now, offsetMs) : 0;
                    const late = d.current?.alarm_after_seconds && elapsed > d.current.alarm_after_seconds;
                    const status = d.busy
                        ? `مع ${d.current.patients.length > 1 ? `${d.current.patients.length} زوار` : 'زائر'}`
                        : d.on_break ? `في استراحة منذ ${d.on_break_since}`
                        : d.present ? `حاضر منذ ${d.present_since}` : finishing ? `غادر ${d.left_at} · يُكمل من في الطابور` : 'لم يصل بعد';

                    return (
                        <li key={d.doctor_id} className="shrink-0 w-56 lg:w-60">
                            <div
                                role={onSelect ? 'button' : undefined}
                                tabIndex={selectable ? 0 : undefined}
                                aria-pressed={onSelect ? selected : undefined}
                                aria-disabled={onSelect ? !selectable : undefined}
                                onClick={() => selectable && onSelect(selected ? null : d.doctor_id)}
                                onKeyDown={(e) => selectable && (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onSelect(selected ? null : d.doctor_id))}
                                className={cx(
                                    'h-full rounded-2xl border bg-white p-3 transition-colors',
                                    selected ? 'border-ink ring-2 ring-ink' : 'border-line',
                                    selectable && 'cursor-pointer hover:bg-ink-faint',
                                    !d.present && !d.busy && 'opacity-70',
                                    late && 'border-rose bg-rose-soft',
                                )}
                            >
                                <div className="flex items-start gap-2">
                                    <Stethoscope className={cx('w-4 h-4 mt-0.5 shrink-0', d.present ? 'text-st-queue' : 'text-muted')} />
                                    <div className="min-w-0 flex-1">
                                        <p className="font-semibold text-ink truncate">{d.full_name}</p>
                                        <p className={cx('text-xs', d.busy ? 'text-st-visit font-semibold' : d.present ? 'text-st-queue' : 'text-muted')}>
                                            {status}
                                            {d.busy && <span dir="ltr" className={cx('ms-1 inline-block tabular-nums', late && 'text-rose')}>{formatElapsed(elapsed)}</span>}
                                        </p>
                                    </div>
                                </div>
                                <p className="mt-2 text-xs text-muted">
                                    عالج <span className="font-semibold text-ink">{d.treated}</span>
                                    {d.mean_minutes != null && <> · متوسط <span className="font-semibold text-ink">{d.mean_minutes}</span> د</>}
                                    {d.planned_minutes && <> · مقرر {d.planned_minutes} د</>}
                                </p>
                                {onAttend && (
                                    <div className="mt-2 flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                                        {d.present && (
                                            <Button size="sm" variant="secondary" icon={Coffee} block
                                                loading={busyKey === `break-${d.doctor_id}`} disabled={!!busyKey}
                                                onClick={() => onAttend(d, 'break')}>
                                                استراحة
                                            </Button>
                                        )}
                                        {!d.present && (
                                            <Button size="sm" icon={LogIn} block
                                                loading={busyKey === `arrive-${d.doctor_id}`} disabled={!!busyKey}
                                                onClick={() => onAttend(d, 'arrive')}>
                                                {d.on_break ? 'عاد' : 'وصل'}
                                            </Button>
                                        )}
                                        {(d.present || d.on_break) && (
                                            <Button size="sm" variant="secondary" icon={LogOut} block
                                                loading={busyKey === `leave-${d.doctor_id}`} disabled={!!busyKey}
                                                onClick={() => onAttend(d, 'leave')}>
                                                غادر
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}
