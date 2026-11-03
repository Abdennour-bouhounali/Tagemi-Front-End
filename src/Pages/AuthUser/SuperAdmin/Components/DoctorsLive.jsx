import { API_BASE_URL } from '../../../../config/environment';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AlarmClock, Bell, BellOff, Coffee, PaintBucket } from 'lucide-react';
import { AppContext } from '../../../../Context/AppContext';
import { IconButton, Panel, Sheet, cx } from '../../../../Components/ui';
import { ResponsiveTable } from '../../../../Components/ui/StatsKit';
import { elapsedSeconds, formatElapsed, serverOffset, useNow } from '../../../../utils/visitTimer';
import BigStats from './BigStats';

const apiUrl = API_BASE_URL;
const REFRESH_MS = 15000;
const SOUND_KEY = 'tagemi.alarmSound';
const RED_KEY = 'tagemi.alarmRed';
const BEEP_EVERY_MS = 3000;

// One audio context for the page. Browsers keep it silent ("suspended") until
// the user taps something: after a reload with the sound saved as on, the
// first tap anywhere on the page unlocks it.
let audioCtx = null;

/** Creates / resumes the audio context; call it from a tap. */
function unlockAudio() {
    try {
        audioCtx ??= new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
    } catch { /* no audio: the banner is enough */ }
}

const audioReady = () => audioCtx?.state === 'running';

/** Short beep with the Web Audio API (no sound file to load). */
function beep() {
    if (!audioReady()) return;
    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.frequency.value = 880;
        gain.gain.value = 0.15;
        osc.connect(gain).connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
    } catch { /* no audio: the banner is enough */ }
}

/** Seconds as minutes with one decimal ("12.5"), null when unknown. */
const toMinutes = (seconds) => (seconds == null ? null : Math.round(seconds / 6) / 10);
const minutesLabel = (seconds) => (seconds == null ? '—' : `${toMinutes(seconds)} د`);

/** Mean minus planned in words ("2.5 د أبطأ"), no sign to flip in RTL; orange when slower. */
function Gap({ mean, planned }) {
    if (mean == null || !planned) return '—';
    const gap = Math.round((mean / 60 - planned) * 10) / 10;
    if (gap === 0) return <span className="text-st-queue">مثل المقرر</span>;
    return (
        <span className={cx('tabular-nums', gap > 0 ? 'text-st-pushed' : 'text-st-queue')}>
            {Math.abs(gap)} د {gap > 0 ? 'أبطأ' : 'أسرع'}
        </span>
    );
}

/** Estimated end at the current pace, orange when after the planned end of the day. */
function EndTime({ estimated, planned }) {
    if (!estimated) return <span className="text-muted">—</span>;
    const late = planned && estimated > planned;
    return (
        <span className={cx('tabular-nums', late ? 'text-st-pushed font-semibold' : 'text-ink')}>
            {estimated}
            {planned && <span className="block text-xs font-normal text-muted">المقرر {planned}</span>}
        </span>
    );
}

/** Mean / gap of the day, fastest and slowest specialty (by mean), then each specialty. */
function VisitTiming({ timing }) {
    const gapSeconds = timing.mean_seconds != null && timing.planned_mean_seconds != null
        ? timing.mean_seconds - timing.planned_mean_seconds : null;
    const fastest = timing.fastest_specialty;
    const longest = timing.longest_specialty;
    const specialtySub = (s) => (s ? `متوسط ${s.treated} زيارة، من ${minutesLabel(s.fastest_seconds)} إلى ${minutesLabel(s.longest_seconds)}` : 'لا توجد زيارات منتهية بعد');

    const specialtyColumns = [
        { key: 'specialty', label: 'التخصص', primary: true },
        { key: 'treated', label: 'أنهى', align: 'center' },
        { key: 'mean_seconds', label: 'المتوسط', align: 'center', render: (r) => minutesLabel(r.mean_seconds) },
        { key: 'planned_minutes', label: 'المقرر', align: 'center', render: (r) => (r.planned_minutes ? `${Math.round(r.planned_minutes * 10) / 10} د` : '—') },
        { key: 'gap', label: 'الفرق', align: 'center', render: (r) => <Gap mean={r.mean_seconds} planned={r.planned_minutes} /> },
        { key: 'fastest_seconds', label: 'أسرع زيارة', align: 'center', render: (r) => minutesLabel(r.fastest_seconds) },
        { key: 'longest_seconds', label: 'أطول زيارة', align: 'center', render: (r) => minutesLabel(r.longest_seconds) },
        {
            key: 'remaining',
            label: 'المتبقي',
            align: 'center',
            render: (r) => (
                <>
                    {r.remaining}
                    {r.remaining_pending > 0 && <span className="block text-xs text-muted">منهم {r.remaining_pending} لم يحضر</span>}
                </>
            ),
        },
        { key: 'working', label: 'الأطباء', align: 'center', render: (r) => `${r.working} / ${r.doctors}` },
        { key: 'estimated_end', label: 'النهاية المتوقعة', align: 'center', render: (r) => <EndTime estimated={r.estimated_end} planned={r.planned_end} /> },
    ];

    return (
        <>
            <BigStats
                items={[
                    { label: 'متوسط مدة الزيارة', value: minutesLabel(timing.mean_seconds), sub: `على ${timing.treated} زيارة منتهية` },
                    {
                        label: 'الفرق عن المدة المقررة',
                        value: gapSeconds == null ? '—' : minutesLabel(Math.abs(gapSeconds)),
                        tone: !gapSeconds ? undefined : gapSeconds > 0 ? 'text-st-pushed' : 'text-st-queue',
                        sub: timing.planned_mean_seconds == null ? 'لا توجد مدة مقررة للمقارنة'
                            : `${gapSeconds > 0 ? 'أبطأ من' : gapSeconds < 0 ? 'أسرع من' : 'مثل'} المقرر (${minutesLabel(timing.planned_mean_seconds)})`,
                    },
                    { label: fastest ? `أسرع تخصص: ${fastest.specialty}` : 'أسرع تخصص', value: minutesLabel(fastest?.mean_seconds), tone: fastest && 'text-st-queue', sub: specialtySub(fastest) },
                    { label: longest ? `أبطأ تخصص: ${longest.specialty}` : 'أبطأ تخصص', value: minutesLabel(longest?.mean_seconds), tone: longest && 'text-st-pushed', sub: specialtySub(longest) },
                ]}
            />

            <Panel title="مدة الزيارة حسب التخصص">
                <ResponsiveTable columns={specialtyColumns} rows={timing.specialties || []} rowKey={(r) => r.event_specialty_id} empty="لا يوجد أطباء مبرمجون اليوم." />
                <p className="text-xs text-muted mt-3">
                    النهاية المتوقعة: الوقت الذي يُنهى فيه المتبقي (مع من لم يحضر بعد) لو بقي الأطباء الحاضرون بنفس متوسطهم.
                    الطبيب الذي لم يُنهِ زيارة بعد يُحسب بالمدة المقررة. البرتقالي: بعد نهاية الدوام المقرر.
                </p>
            </Panel>
        </>
    );
}

/**
 * Visits over 1.5x the planned time: the count and the longest one. While
 * there is one the card is red (unless `red` is off) and flashes: `flash` =
 * 'always' or 'five' (5 times, then steady). A tap opens every long visit, longest first.
 */
function LongVisitsCard({ visits, onOpen, red = true, flash }) {
    const longest = visits[0];
    const active = visits.length > 0;
    const alarm = active && red;
    return (
        <button
            type="button"
            onClick={onOpen}
            disabled={!active}
            className={cx(
                'w-full text-start rounded-2xl border px-5 py-4 flex items-center gap-5',
                alarm ? cx('border-rose bg-rose-soft', flash === 'always' && 'animate-alarm-flash', flash === 'five' && 'animate-alarm-flash-5')
                    : 'bg-white border-line',
                active ? 'cursor-pointer' : 'cursor-default'
            )}
        >
            <AlarmClock className={cx('w-8 h-8 shrink-0', alarm ? 'text-rose' : 'text-muted')} aria-hidden="true" />
            <span className={cx('font-display text-4xl lg:text-5xl leading-none tabular-nums', alarm ? 'text-rose' : 'text-ink')}>{visits.length}</span>
            <span className="flex-1 min-w-0">
                <span className="block text-base font-semibold text-ink">زيارات طويلة جداً</span>
                {longest ? (
                    <>
                        {/* Spaced like the columns of the long-visits table */}
                        <span className="mt-1.5 flex flex-wrap items-baseline gap-x-10 gap-y-1 text-lg text-ink">
                            <span className="font-semibold">{longest.specialty}</span>
                            <span>{longest.full_name}</span>
                            <span>{longest.current.patients.map((p) => (
                                <span key={p.id} className="me-4"><span className="tabular-nums text-muted">#{p.patient_id}</span> {p.full_name}</span>
                            ))}</span>
                            <span dir="ltr" className={cx('font-display text-2xl tabular-nums', red ? 'text-rose' : 'text-ink')}>{formatElapsed(longest.elapsed)}</span>
                        </span>
                        <span className="block mt-1 text-sm text-muted">الأطول الآن · اضغط لعرض كل الزيارات الطويلة</span>
                    </>
                ) : (
                    <span className="block mt-1.5 text-sm text-muted">لا توجد زيارة تجاوزت 1.5 مرة المدة المقررة</span>
                )}
            </span>
        </button>
    );
}

/**
 * «أثناء الحدث», doctors: every doctor today with patients treated and mean
 * visit time, the visit going on now, and on top what needs someone on the
 * ground: visits over 1.5x the planned time (alarm) and doctors free for a
 * while although patients wait. Refetches every 15 s; timers tick locally so
 * an alarm shows the second it is due.
 */
export default function DoctorsLive({ eventId }) {
    const { token, user } = useContext(AppContext);
    const now = useNow();
    const [doctors, setDoctors] = useState(null);
    const [timing, setTiming] = useState(null);
    const [offsetMs, setOffsetMs] = useState(0);
    const [idleMinutes, setIdleMinutes] = useState(10);
    const [sound, setSound] = useState(() => {
        try { return localStorage.getItem(SOUND_KEY) === '1'; } catch { return false; }
    });
    const [showLong, setShowLong] = useState(false);
    // Sound on but the browser still blocks it (no tap since the page loaded)
    const [audioBlocked, setAudioBlocked] = useState(() => !audioReady());
    const isSuperAdmin = user?.role_id === 1;
    // Super admin only: the red colour of the long-visits card can be switched off
    const [red, setRed] = useState(() => {
        try { return localStorage.getItem(RED_KEY) !== '0'; } catch { return true; }
    });
    const [flashRound, setFlashRound] = useState(0);
    const alarmCount = useRef(0);

    const load = useCallback(async () => {
        try {
            const res = await fetch(`${apiUrl}/api/events/${eventId}/doctor-visits`, {
                headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
            });
            if (!res.ok) return;
            const json = await res.json();
            setDoctors(json.doctors || []);
            setTiming(json.timing || null);
            setOffsetMs(serverOffset(json.server_time));
            if (json.idle_minutes) setIdleMinutes(json.idle_minutes);
        } catch { /* keep the last numbers; next round retries */ }
    }, [eventId, token]);

    useEffect(() => {
        load();
        const timer = setInterval(() => document.visibilityState === 'visible' && load(), REFRESH_MS);
        return () => clearInterval(timer);
    }, [load]);

    const endOf = new Map((timing?.doctors || []).map((d) => [`${d.event_specialty_id}-${d.doctor_id}`, d.estimated_end]));
    const rows = (doctors || []).map((d) => {
        const estimatedEnd = endOf.get(`${d.event_specialty_id}-${d.doctor_id}`) || null;
        const elapsed = d.current ? elapsedSeconds(d.current.entered_at, now, offsetMs) : null;
        const alarm = !!d.current?.alarm_after_seconds && elapsed > d.current.alarm_after_seconds;
        return { ...d, elapsed, alarm, estimated_end: estimatedEnd };
    });
    const alarms = rows.filter((d) => d.alarm).sort((a, b) => b.elapsed - a.elapsed);
    const idle = rows.filter((d) => d.idle);

    // The first tap anywhere unlocks the sound saved as on
    useEffect(() => {
        if (!sound || !audioBlocked) return undefined;
        const onTap = () => {
            unlockAudio();
            setTimeout(() => setAudioBlocked(!audioReady()), 100);
        };
        document.addEventListener('pointerdown', onTap);
        return () => document.removeEventListener('pointerdown', onTap);
    }, [sound, audioBlocked]);

    // Beep again and again while a visit is too long (opt-in: the organizer's phone may be in a pocket)
    const ringing = sound && alarms.length > 0;
    useEffect(() => {
        if (!ringing) return undefined;
        beep();
        const timer = setInterval(beep, BEEP_EVERY_MS);
        return () => clearInterval(timer);
    }, [ringing]);

    // A new long visit flashes the card again (5 times for the super admin)
    useEffect(() => {
        if (alarms.length > alarmCount.current) setFlashRound((n) => n + 1);
        alarmCount.current = alarms.length;
    }, [alarms.length]);

    const toggleRed = () => {
        const next = !red;
        setRed(next);
        try { localStorage.setItem(RED_KEY, next ? '1' : '0'); } catch { /* not remembered */ }
    };

    const toggleSound = () => {
        const next = !sound;
        setSound(next);
        if (next) {
            unlockAudio();
            setTimeout(() => { setAudioBlocked(!audioReady()); beep(); }, 100);
        }
        try { localStorage.setItem(SOUND_KEY, next ? '1' : '0'); } catch { /* not remembered */ }
    };

    if (!doctors) return null;

    const columns = [
        { key: 'full_name', label: 'الطبيب', primary: true, render: (d) => <>{d.full_name} <span className="text-xs font-normal text-muted">· {d.specialty}</span></> },
        {
            key: 'state',
            label: 'الحالة',
            render: (d) => (d.current
                ? <span className={cx('tabular-nums', d.alarm ? 'text-rose' : 'text-st-visit')}>مع زائر <span dir="ltr">{formatElapsed(d.elapsed)}</span></span>
                : d.present ? <span className={d.idle ? 'text-st-pushed' : 'text-st-queue'}>{d.idle ? `متاح منذ ${d.idle_minutes} د` : 'حاضر'}</span>
                    : <span className="text-muted">{d.left_at ? `غادر ${d.left_at}` : 'لم يصل'}</span>),
        },
        { key: 'treated', label: 'عالج', align: 'center' },
        { key: 'mean_minutes', label: 'متوسط الزيارة (د)', align: 'center', render: (d) => d.mean_minutes ?? '—' },
        { key: 'planned_minutes', label: 'المقرر (د)', align: 'center', render: (d) => d.planned_minutes ?? '—' },
        { key: 'gap', label: 'الفرق', align: 'center', render: (d) => <Gap mean={d.mean_seconds} planned={d.planned_minutes} /> },
        { key: 'estimated_end', label: 'النهاية المتوقعة', align: 'center', render: (d) => <EndTime estimated={d.estimated_end} planned={d.planned_end} /> },
        { key: 'arrived_at', label: 'وصل', align: 'center', render: (d) => d.arrived_at || '—' },
    ];

    const present = rows.filter((d) => d.present).length;

    return (
        <div className="space-y-3 mb-4">
            <div className="flex items-stretch gap-2">
                <div className="flex-1 min-w-0">
                    {/* Organizers on the ground: flashing until it ends; super admin: 5 flashes, red can be switched off */}
                    <LongVisitsCard
                        key={flashRound}
                        visits={alarms}
                        onOpen={() => setShowLong(true)}
                        red={!isSuperAdmin || red}
                        flash={isSuperAdmin ? 'five' : 'always'}
                    />
                </div>
                {isSuperAdmin && (
                    <IconButton
                        icon={PaintBucket}
                        label={red ? 'إيقاف اللون الأحمر للبطاقة' : 'تشغيل اللون الأحمر للبطاقة'}
                        aria-pressed={red}
                        className={cx('self-center border', red ? 'bg-rose-soft border-rose !text-rose' : 'bg-white border-line !text-muted')}
                        onClick={toggleRed}
                    />
                )}
                <IconButton
                    icon={sound ? Bell : BellOff}
                    label={sound ? 'إيقاف صوت التنبيه' : 'تشغيل صوت عند تنبيه'}
                    className="self-center bg-white border border-line"
                    onClick={toggleSound}
                />
            </div>
            {sound && audioBlocked && (
                <button type="button" onClick={() => { unlockAudio(); setTimeout(() => setAudioBlocked(!audioReady()), 100); }}
                    className="w-full rounded-2xl border border-rose/40 bg-rose-soft px-4 py-2 text-sm font-semibold text-rose">
                    الصوت متوقف من المتصفح، اضغط هنا لتفعيل صوت التنبيه
                </button>
            )}

            {timing && <VisitTiming timing={timing} />}

            {idle.length > 0 && (
                <section className="rounded-2xl border border-st-pushed/30 bg-st-pushed-bg p-4">
                    <h2 className="flex items-center gap-2 font-semibold text-st-pushed mb-1">
                        <Coffee className="w-5 h-5" /> أطباء متاحون والطابور ينتظر
                    </h2>
                    <ul className="text-sm text-ink space-y-1">
                        {idle.map((d) => (
                            <li key={d.doctor_id}>
                                <span className="font-semibold">{d.specialty}</span> · الطبيب {d.full_name} · بلا زائر منذ {d.idle_minutes} د
                            </li>
                        ))}
                    </ul>
                    <p className="text-xs text-muted mt-2">يظهر الطبيب هنا بعد {idleMinutes} دقائق دون زائر، مع وجود زوار في طابور تخصصه.</p>
                </section>
            )}

            <Panel title={`الأطباء اليوم (${present} حاضر من ${rows.length})`}>
                <ResponsiveTable columns={columns} rows={rows} rowKey={(d) => `${d.event_specialty_id}-${d.doctor_id}`} empty="لا يوجد أطباء مبرمجون اليوم." />
            </Panel>

            <Sheet
                open={showLong && alarms.length > 0}
                onClose={() => setShowLong(false)}
                title={`زيارات طويلة جداً (${alarms.length})`}
                size="xl"
                footer={(
                    <button type="button" onClick={toggleSound} className="flex items-center gap-2 text-sm text-ink">
                        {sound ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                        {sound ? 'إيقاف صوت التنبيه' : 'تشغيل صوت التنبيه'}
                    </button>
                )}
            >
                {/* Read from a distance on the ground: larger text and rows */}
                <div className="[&_table]:text-lg [&_th]:text-base [&_td]:py-4 [&_dd]:text-base [&_li]:py-4">
                    <ResponsiveTable
                        columns={[
                            { key: 'specialty', label: 'التخصص', primary: true },
                            { key: 'full_name', label: 'الطبيب' },
                            {
                                key: 'patients',
                                label: 'الزائر',
                                render: (d) => d.current.patients.map((p) => (
                                    <span key={p.id} className="block"><span className="tabular-nums text-muted">#{p.patient_id}</span> {p.full_name}</span>
                                )),
                            },
                            {
                                key: 'elapsed',
                                label: 'المدة',
                                align: 'center',
                                render: (d) => (
                                    <>
                                        <span dir="ltr" className="font-display text-2xl text-rose tabular-nums">{formatElapsed(d.elapsed)}</span>
                                        <span className="block text-sm text-muted">المقرر {d.planned_minutes} د{d.current.patients.length > 1 ? ` × ${d.current.patients.length}` : ''}</span>
                                    </>
                                ),
                            },
                        ]}
                        rows={alarms}
                        rowKey={(d) => `${d.event_specialty_id}-${d.doctor_id}`}
                    />
                </div>
            </Sheet>
        </div>
    );
}
