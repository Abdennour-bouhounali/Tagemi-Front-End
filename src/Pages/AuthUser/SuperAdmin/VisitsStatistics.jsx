import { API_BASE_URL } from '../../../config/environment';
import { useContext, useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Download, RefreshCw } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AppContext } from '../../../Context/AppContext';
import { STATUS_GROUPS, GROUP_LABELS } from '../../../utils/visitStatus';
import { EmptyState, IconButton, PageHeader, LoadingState, Panel, useToast, cx } from '../../../Components/ui';
import {
    ActionsMenu, BackLink, CHART, ChartLegend, ErrorState, HBarChart, RankList, ResponsiveTable, ShareBar, downloadCsv, pct,
} from '../../../Components/ui/StatsKit';

import AppointmentDistribution from './Components/AppointmentDistribution';
import DeepStatsSection from './Components/DeepStatsSection';
import BigStats from './Components/BigStats';
import DoctorsLive from './Components/DoctorsLive';

const apiUrl = API_BASE_URL;

const GROUP_KEYS = Object.keys(STATUS_GROUPS);

// One colour per status group, same family as StatusBadge (st-* tokens)
const GROUP_COLORS = {
    pending: CHART.pending,
    waiting: CHART.hold,
    in_queue: CHART.queue,
    dilatation: CHART.dil,
    in_visit: CHART.visit,
    completed: CHART.done,
};

const RESIDENCE_NAMES = {
    tajnint: 'تجنينت',
    bonora: 'آت بونور',
    taghardait: 'تغردايت',
    yazgan: 'آت يزجن',
    mlichat: 'آت مليشت',
    karara: 'القرارة',
    berian: 'بريان',
    warjlan: 'وارجلان',
};

const CITY_NAMES = {
    tajnint: 'تاجنينت',
    bonora: 'آت بونور',
    taghardait: 'تغردايت',
    mlichat: 'آت مليشت',
    yazgan: 'آت يزجن',
    berian: 'آت برقان',
    karara: 'القرارة',
    warglen: 'وارجلان',
};

const residenceName = (residence) => (residence === 'unknown' ? 'غير معروف' : RESIDENCE_NAMES[residence] || residence || 'غير معروف');
const cityName = (city) => (city === 'unknown' ? 'غير معروف' : CITY_NAMES[city] || city || 'غير معروف');

// The three views of the page; ?phase= in the URL picks one
const PHASES = [
    { value: 'before', label: 'قبل الحدث', hint: 'من لم يحضر بعد' },
    { value: 'during', label: 'أثناء الحدث', hint: 'كل الحالات لحظة بلحظة' },
    { value: 'after', label: 'بعد الحدث', hint: 'الحصيلة والنتائج' },
];
const PHASE_KEYS = PHASES.map((p) => p.value);

// The "during" tab refreshes itself silently at this pace
const LIVE_REFRESH_MS = 60000;

const localDay = (d = new Date()) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Tab to open when the URL names none: from the event's dates. */
const defaultPhase = (event) => {
    if (!event) return 'during';
    if (event.is_archived) return 'after';
    const start = String(event.start_date || event.date || '').slice(0, 10);
    const end = String(event.end_date || start).slice(0, 10);
    const today = localDay();
    if (start && today < start) return 'before';
    if (end && today > end) return 'after';
    return 'during';
};

const dayLabel = (date) => {
    if (!date || date === 'unknown') return 'بدون يوم';
    const d = new Date(`${date}T00:00:00`);
    return Number.isNaN(d.getTime()) ? date : d.toLocaleDateString('ar-DZ', { weekday: 'long', day: 'numeric', month: 'long' });
};

const isChild = (apt, now) => {
    if (!apt.birthday) return false;
    return (now - new Date(apt.birthday)) / (1000 * 60 * 60 * 24 * 365.25) < 10;
};

const countBy = (patients, field) => {
    const map = new Map();
    patients.forEach((p) => {
        const key = p.info[field] || 'unknown';
        map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries()).map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count);
};

/** Head counts of a list of patients ({ info, rows }). */
const demographics = (patients) => {
    const now = new Date();
    return {
        total: patients.length,
        males: patients.filter((p) => String(p.info.sex) === '0').length,
        females: patients.filter((p) => String(p.info.sex) === '1').length,
        children: patients.filter((p) => isChild(p.info, now)).length,
        states: countBy(patients, 'state'),
        cities: countBy(patients, 'city'),
    };
};

const specialtyName = (apt) => apt.event_specialty?.specialty?.name || 'غير معروف';

const SEX_LEGEND = [
    { key: 'males', label: 'ذكور', color: CHART.ink },
    { key: 'females', label: 'إناث', color: CHART.rose },
];

/** a / b with one decimal ("1.2"), "0" when b is 0. */
const mean = (a, b) => (b > 0 ? String(Math.round(((a || 0) / b) * 10) / 10) : '0');

/** Males / females as a donut, total in the middle. */
function SexDonut({ demo }) {
    const unknown = Math.max(demo.total - demo.males - demo.females, 0);
    const parts = [
        ...SEX_LEGEND.map((s) => ({ ...s, value: demo[s.key] || 0 })),
        unknown > 0 && { key: 'unknown', label: 'غير محدد', color: CHART.pending, value: unknown },
    ].filter(Boolean);

    return (
        <div className="flex items-center gap-4">
            <div className="relative w-36 h-36 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={demo.total > 0 ? parts : [{ key: 'empty', value: 1 }]}
                            dataKey="value"
                            innerRadius="62%"
                            outerRadius="100%"
                            startAngle={90}
                            endAngle={-270}
                            stroke="none"
                            isAnimationActive={false}
                        >
                            {(demo.total > 0 ? parts : [{ key: 'empty' }]).map((p) => (
                                <Cell key={p.key} fill={p.color || CHART.inkFaint} />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="font-display text-2xl text-ink leading-none">{demo.total}</span>
                    <span className="text-xs text-muted">زائر</span>
                </div>
            </div>
            <ul className="flex-1 min-w-0 space-y-2">
                {parts.map((p) => (
                    <li key={p.key} className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: p.color }} aria-hidden="true" />
                        <span className="flex-1 text-sm text-ink">{p.label}</span>
                        <span className="font-display text-lg text-ink">{p.value}</span>
                        <span className="w-12 text-end text-xs text-muted">{pct(p.value, demo.total)}%</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

/** Males / females of each specialty: one stacked bar per row, counts and % printed on it. */
function SexBySpecialty({ rows }) {
    return (
        <ul className="space-y-4">
            {rows.map((row) => (
                <li key={row.name}>
                    <div className="flex items-baseline justify-between gap-3 mb-1.5">
                        <span className="text-sm font-semibold text-ink">{row.name}</span>
                        <span className="text-xs text-muted shrink-0">{row.total} موعد</span>
                    </div>
                    <div className="flex h-8 rounded-lg overflow-hidden bg-ink-faint">
                        {SEX_LEGEND.map((s) => row[s.key] > 0 && (
                            <span
                                key={s.key}
                                className="flex items-center justify-center min-w-0 text-xs font-semibold text-white whitespace-nowrap overflow-hidden"
                                style={{ width: `${(row[s.key] / row.total) * 100}%`, backgroundColor: s.color }}
                            >
                                {pct(row[s.key], row.total)}%
                            </span>
                        ))}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-sm">
                        {SEX_LEGEND.map((s) => (
                            <span key={s.key} className="flex items-center gap-1.5 text-ink">
                                <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: s.color }} aria-hidden="true" />
                                {s.label}
                                <span className="font-semibold tabular-nums">{row[s.key]}</span>
                                <span className="text-xs text-muted">({pct(row[s.key], row.total)}%)</span>
                            </span>
                        ))}
                    </div>
                </li>
            ))}
        </ul>
    );
}

/** Tab bar: one tap switches between before / during / after. */
function PhaseTabs({ value, onChange }) {
    return (
        <div role="tablist" aria-label="مرحلة الحدث" className="grid grid-cols-3 gap-1 p-1 mb-4 bg-white border border-line rounded-2xl">
            {PHASES.map((phase) => {
                const active = phase.value === value;
                return (
                    <button
                        key={phase.value}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => onChange(phase.value)}
                        className={cx(
                            'min-h-[3.5rem] px-2 py-1.5 rounded-xl text-center transition-colors',
                            active ? 'bg-ink text-white' : 'text-ink hover:bg-ink-faint'
                        )}
                    >
                        <span className="block font-semibold text-sm sm:text-base">{phase.label}</span>
                        <span className={cx('block text-xs leading-snug', active ? 'text-white/70' : 'text-muted')}>{phase.hint}</span>
                    </button>
                );
            })}
        </div>
    );
}

function SectionTitle({ children }) {
    return <h2 className="font-display text-lg text-ink mt-8 mb-3">{children}</h2>;
}

const NoData = ({ children = 'لا توجد بيانات بعد.' }) => <p className="py-6 text-center text-sm text-muted">{children}</p>;

/** Who the patients are and where they come from: three panels side by side. */
function DemographicsPanels({ demo, title, empty }) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Panel title={title}>
                <SexDonut demo={demo} />
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-line">
                    <span className="text-sm text-ink">الأطفال (أقل من 10 سنوات)</span>
                    <span className="font-display text-lg text-ink">{demo.children || 0}</span>
                </div>
            </Panel>

            <Panel title="حسب الولاية">
                {demo.states.length === 0 ? (
                    <NoData>{empty}</NoData>
                ) : (
                    <RankList total={demo.total} items={demo.states.map((r) => ({ label: residenceName(r.key), value: r.count }))} />
                )}
            </Panel>

            <Panel title="حسب المدينة">
                {demo.cities.length === 0 ? (
                    <NoData>{empty}</NoData>
                ) : (
                    <RankList total={demo.total} items={demo.cities.map((c) => ({ label: cityName(c.key), value: c.count }))} />
                )}
            </Panel>
        </div>
    );
}

function PendingByDayPanel({ totals, pendingByDay }) {
    return (
        <Panel title={`${GROUP_LABELS.pending} حسب اليوم`}>
            {pendingByDay.length === 0 ? (
                <NoData>لا توجد مواعيد بحالة «{GROUP_LABELS.pending}».</NoData>
            ) : (
                <RankList
                    color={CHART.pending}
                    total={totals.pending}
                    items={pendingByDay.map((d) => ({ label: dayLabel(d.day), value: d.count }))}
                />
            )}
        </Panel>
    );
}

/** Before: the bookings, and everyone whose status is still "not arrived yet". */
function BeforeView({ totals, statistics, distribution, notArrivedDemo, specialtiesPerPatient, sexBySpecialty }) {
    const dist = distribution?.statistics || {};
    const pendingSpecialties = statistics.filter((s) => (s.pending || 0) > 0);
    const specialtyCount = specialtiesPerPatient.reduce((sum, r) => sum + r.count * r.patients, 0);
    // Every number of this tab counts only the "not arrived yet" status
    return (
        <>
            <BigStats
                items={[
                    { label: 'عدد الزوار', value: totals.patients_total || 0, sub: 'كل الحالات' },
                    { label: 'عدد الفحوصات', value: totals.total || 0, sub: `${totals.pending || 0} لم يحضر أصحابها بعد` },
                    distribution && { label: 'أماكن متاحة', value: dist.total_available, tone: 'text-st-queue', sub: `من سعة ${dist.total_capacity ?? 0}` },
                    distribution && { label: 'نسبة الامتلاء', value: `${dist.percentage_full ?? 0}%` },
                    {
                        label: 'تم إنزالهم',
                        value: p.coming_soon || 0,
                        tone: 'text-st-queue',
                        sub: `${p.patients_coming_soon || 0} زائر، منهم ${p.patients_coming_soon_with_other || 0} لديهم فحص آخر`,
                    },
                    { label: 'متوسط التخصصات لكل زائر', value: mean(specialtyCount, notArrivedDemo.total), sub: `${specialtyCount} تخصص لـ ${notArrivedDemo.total} زائر` },
                ]}
            />

            <div className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Panel title="حسب التخصص">
                        {pendingSpecialties.length === 0 ? (
                            <NoData>لا توجد مواعيد.</NoData>
                        ) : (
                            <RankList
                                total={totals.pending}
                                items={pendingSpecialties
                                    .map((s) => ({ label: s.specialty_name, sub: `من ${s.total || 0} موعد`, value: s.pending }))
                                    .sort((a, b) => b.value - a.value)}
                            />
                        )}
                    </Panel>

                    <Panel title="عدد التخصصات لكل زائر">
                        {specialtiesPerPatient.length === 0 ? (
                            <NoData>لا يوجد زوار.</NoData>
                        ) : (
                            <RankList
                                total={notArrivedDemo.total}
                                items={specialtiesPerPatient.map((r) => ({
                                    label: r.count === 1 ? 'تخصص واحد' : r.count === 2 ? 'تخصصان' : `${r.count} تخصصات`,
                                    value: r.patients,
                                }))}
                            />
                        )}
                    </Panel>
                </div>

                <Panel title="الجنس حسب التخصص">
                    {sexBySpecialty.length === 0 ? (
                        <NoData>لا توجد مواعيد.</NoData>
                    ) : (
                        <SexBySpecialty rows={sexBySpecialty} />
                    )}
                </Panel>

                <DemographicsPanels demo={notArrivedDemo} title="الزوار" empty="لا يوجد زوار." />
            </div>

            <SectionTitle>توزيع المواعيد</SectionTitle>
            {distribution ? (
                <AppointmentDistribution data={distribution} />
            ) : (
                <Panel><NoData>تعذر تحميل توزيع المواعيد.</NoData></Panel>
            )}
        </>
    );
}

/** During: every status and every doctor, live. */
function DuringView({ eventId, totals, statistics, allDemo, pendingByDay }) {
    const notArrived = Math.max((totals.patients_total || 0) - (totals.patients_arrived || 0), 0);
    // Waiting for a doctor = Waiting + Present + Commingsoon
    const waitingVisits = (totals.waiting || 0) + (totals.in_queue || 0);

    const specialtyColumns = [
        { key: 'specialty_name', label: 'التخصص', primary: true },
        ...GROUP_KEYS.map((key) => ({ key, label: GROUP_LABELS[key], align: 'center', render: (row) => row[key] || 0 })),
        { key: 'total', label: 'المجموع', align: 'center', render: (row) => row.total || 0 },
        {
            key: 'patients',
            label: 'الزوار (حضر / المجموع)',
            align: 'center',
            render: (row) => `${row.patients_arrived || 0} / ${row.patients_total || 0}`,
        },
    ];

    return (
        <>
            <BigStats
                items={[
                    { label: 'عدد الزوار', value: totals.patients_total || 0, sub: `${totals.patients_arrived || 0} حضروا (${pct(totals.patients_arrived, totals.patients_total)}%)` },
                    { label: 'لم يحضروا بعد', value: notArrived, tone: 'text-st-pending', sub: `${pct(notArrived, totals.patients_total)}% من الزوار` },
                    { label: 'عدد الفحوصات', value: totals.total || 0, sub: 'كل المواعيد' },
                    { label: 'ينتظرون الطبيب', value: waitingVisits, tone: 'text-st-queue', sub: `${totals.waiting || 0} في الانتظار، ${totals.in_queue || 0} في الطابور` },
                    { label: GROUP_LABELS.in_visit, value: totals.in_visit || 0, tone: 'text-st-visit', sub: `${pct(totals.in_visit, totals.total)}% من الفحوصات` },
                    { label: GROUP_LABELS.completed, value: totals.completed || 0, tone: 'text-st-done', sub: `${pct(totals.completed, totals.total)}% من الفحوصات` },
                ]}
            />

            <DoctorsLive eventId={eventId} />

            <div className="space-y-4">
                <Panel title={`المواعيد حسب الحالة (${totals.total || 0})`}>
                    <ShareBar
                        total={totals.total || 0}
                        parts={GROUP_KEYS.map((key) => ({ label: GROUP_LABELS[key], value: totals[key] || 0, color: GROUP_COLORS[key] }))}
                    />
                </Panel>

                <Panel title="المواعيد حسب التخصص">
                    {statistics.length === 0 ? (
                        <NoData>لا توجد مواعيد في هذا الحدث بعد.</NoData>
                    ) : (
                        <>
                            <ChartLegend className="mb-2" items={GROUP_KEYS.map((key) => ({ label: GROUP_LABELS[key], color: GROUP_COLORS[key] }))} />
                            <HBarChart
                                data={statistics.map((stat) => ({
                                    name: stat.specialty_name,
                                    ...Object.fromEntries(GROUP_KEYS.map((key) => [key, stat[key] || 0])),
                                }))}
                                bars={GROUP_KEYS.map((key) => ({ key, name: GROUP_LABELS[key], color: GROUP_COLORS[key] }))}
                                labelWidth={190}
                                rowHeight={44}
                                fontSize={14}
                                maxBarSize={30}
                            />
                            <div className="mt-4">
                                <ResponsiveTable
                                    columns={specialtyColumns}
                                    rows={statistics}
                                    rowKey={(row) => row.specialty_id}
                                    footer={{ ...totals, specialty_name: 'المجموع' }}
                                />
                            </div>
                        </>
                    )}
                </Panel>

                <PendingByDayPanel totals={totals} pendingByDay={pendingByDay} />

                <DemographicsPanels demo={allDemo} title="الزوار المسجلون" />
            </div>
        </>
    );
}

/**
 * After: the outcome, counted on what actually happened. Pending appointments
 * (never came) are left out, so a visitor is someone with at least one
 * appointment past «لم يحضر بعد». Only the first tile recalls the registrations.
 */
function AfterView({ eventId, totals, present, arrivedDemo }) {
    const { statistics: p = {}, by_specialty: statistics = [] } = present || {};
    const patients = p.patients_total || 0;
    const visits = p.total || 0;
    const keys = GROUP_KEYS.filter((key) => key !== 'pending');
    const unfinished = (row) => (row.waiting || 0) + (row.in_queue || 0) + (row.dilatation || 0) + (row.in_visit || 0);

    const outcomeColumns = [
        { key: 'specialty_name', label: 'التخصص', primary: true },
        { key: 'patients_total', label: 'الزوار', align: 'center', render: (row) => row.patients_total || 0 },
        { key: 'total', label: 'الفحوصات', align: 'center', render: (row) => row.total || 0 },
        { key: 'completed', label: GROUP_LABELS.completed, align: 'center', render: (row) => row.completed || 0 },
        { key: 'unfinished', label: 'حضر ولم يُكمل', align: 'center', render: unfinished },
        { key: 'coming_soon', label: 'تم إنزاله', align: 'center', render: (row) => row.coming_soon || 0 },
        { key: 'completion', label: 'نسبة الإنجاز', align: 'center', render: (row) => `${pct(row.completed, row.total)}%` },
    ];

    return (
        <>
            <p className="text-sm text-muted mb-3">الأرقام تخص الزوار الذين حضروا فقط، دون مواعيد «لم يحضر بعد».</p>
            <BigStats
                items={[
                    { label: 'الزوار الحاضرون', value: patients, sub: `من ${totals.patients_total || 0} مسجل (${pct(patients, totals.patients_total)}%)` },
                    { label: 'أنهوا جميع الفحوصات', value: `${pct(p.patients_finished, patients)}%`, tone: 'text-st-done', sub: `${p.patients_finished || 0} من ${patients} زائر` },
                    { label: 'عدد الفحوصات', value: visits, sub: `${p.completed || 0} أُنجزت` },
                    { label: 'نسبة إنجاز الفحوصات', value: `${pct(p.completed, visits)}%`, tone: 'text-st-done', sub: `${p.completed || 0} من ${visits} فحص` },
                    { label: 'حضر ولم يُكمل', value: unfinished(p), tone: 'text-st-queue', sub: `${pct(unfinished(p), visits)}% من الفحوصات` },
                    {
                        label: 'تم إنزالهم',
                        value: p.coming_soon || 0,
                        tone: 'text-st-queue',
                        sub: `${p.patients_coming_soon || 0} زائر، منهم ${p.patients_coming_soon_with_other || 0} لديهم فحص آخر`,
                    },
                    { label: 'متوسط التخصصات لكل زائر', value: mean(visits, patients), sub: `${visits} فحص لـ ${patients} زائر` },
                ]}
            />

            <div className="space-y-4">
                <Panel title={`حصيلة الفحوصات (${visits})`}>
                    <ShareBar
                        total={visits}
                        parts={keys.map((key) => ({ label: GROUP_LABELS[key], value: p[key] || 0, color: GROUP_COLORS[key] }))}
                    />
                </Panel>

                <Panel title="النتائج حسب التخصص">
                    <ResponsiveTable
                        columns={outcomeColumns}
                        rows={statistics}
                        rowKey={(row) => row.specialty_id}
                        footer={{ ...p, specialty_name: 'المجموع' }}
                        empty="لم يحضر أي زائر."
                    />
                </Panel>

                <DemographicsPanels demo={arrivedDemo} title="الزوار الذين حضروا" empty="لم يحضر أي زائر." />
            </div>

            <DeepStatsSection eventId={eventId} presentOnly />
        </>
    );
}

const VisitsStatistics = () => {
    const { eventId } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const { token, user } = useContext(AppContext);
    const toast = useToast();
    // Organizer (مسؤول التنظيم): this page is their home, the live view only
    const isViewer = user?.role_id === 9;

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [event, setEvent] = useState(null);
    const [statistics, setStatistics] = useState([]);
    const [totals, setTotals] = useState({});
    const [present, setPresent] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [distribution, setDistribution] = useState(null);
    const [error, setError] = useState('');

    const phase = isViewer ? 'during'
        : PHASE_KEYS.includes(searchParams.get('phase')) ? searchParams.get('phase') : defaultPhase(event);
    const setPhase = (value) => setSearchParams({ phase: value }, { replace: true });

    useEffect(() => {
        if (eventId) fetchAll();
    }, [eventId]);

    // Live numbers while the "during" tab is open
    useEffect(() => {
        if (!eventId || loading || error || phase !== 'during') return undefined;
        const timer = setInterval(() => {
            if (document.visibilityState === 'visible') fetchAll({ silent: true });
        }, LIVE_REFRESH_MS);
        return () => clearInterval(timer);
    }, [eventId, loading, error, phase]);

    // silent: refresh in the background, keep the current numbers on screen
    const fetchAll = async ({ silent = false } = {}) => {
        const headers = { Authorization: `Bearer ${token}` };
        const get = (path) => fetch(`${apiUrl}${path}`, { headers }).catch(() => null);
        try {
            if (silent) setRefreshing(true);
            else setLoading(true);
            setError('');

            const [eventRes, statsRes, aptRes, distRes] = await Promise.all([
                get(`/api/events/${eventId}`),
                get(`/api/appointments/event-statistics/${eventId}`),
                get(`/api/appointments/by-event?event_id=${eventId}`),
                get(`/api/events/${eventId}/appointment-distribution`),
            ]);
            if (!statsRes?.ok) throw new Error('Failed to fetch statistics');

            const data = await statsRes.json();
            setStatistics(data.by_specialty || []);

            // Totals (same keys as each by_specialty row)
            const stats = data.statistics || {};
            setTotals({
                ...Object.fromEntries(GROUP_KEYS.map((key) => [key, stats[key] || 0])),
                total: stats.total || 0,
                patients_total: stats.patients_total || 0,
                patients_arrived: stats.patients_arrived || 0,
                patients_finished: stats.patients_finished || 0,
            });

            setPresent(data.present || null);

            // The rest is optional: a failure leaves that part empty, not the page
            if (eventRes?.ok) {
                const eventData = await eventRes.json();
                setEvent(eventData.event || eventData);
            }
            if (aptRes?.ok) setAppointments((await aptRes.json()).appointments || []);
            if (distRes?.ok) setDistribution(await distRes.json());
        } catch (err) {
            console.error('Error fetching statistics:', err);
            if (silent) toast('تعذر تحديث الإحصائيات، تحقق من الاتصال.', 'error');
            else setError('تحقق من الاتصال ثم أعد المحاولة.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Patients (one entry per person) and what each tab derives from them
    const derived = useMemo(() => {
        const byPatient = new Map();
        appointments.forEach((apt) => {
            const entry = byPatient.get(apt.patient_id) || { info: apt, rows: [] };
            entry.rows.push(apt);
            byPatient.set(apt.patient_id, entry);
        });
        const patients = [...byPatient.values()];
        const arrived = patients.filter((p) => p.rows.some((a) => a.status !== 'Pending'));
        const notArrived = patients.filter((p) => p.rows.every((a) => a.status === 'Pending'));

        const specialtyCounts = new Map();
        notArrived.forEach((p) => {
            const n = new Set(p.rows.map((a) => a.event_specialty_id)).size;
            specialtyCounts.set(n, (specialtyCounts.get(n) || 0) + 1);
        });

        const sexRows = new Map();
        appointments
            .filter((apt) => apt.status === 'Pending')
            .forEach((apt) => {
                const name = specialtyName(apt);
                const row = sexRows.get(name) || { name, males: 0, females: 0, total: 0 };
                if (String(apt.sex) === '0') row.males += 1;
                else if (String(apt.sex) === '1') row.females += 1;
                row.total += 1;
                sexRows.set(name, row);
            });

        const days = new Map();
        appointments
            .filter((apt) => apt.status === 'Pending')
            .forEach((apt) => {
                const day = String(apt.day?.day_date || 'unknown').slice(0, 10);
                days.set(day, (days.get(day) || 0) + 1);
            });

        return {
            allDemo: demographics(patients),
            arrivedDemo: demographics(arrived),
            notArrivedDemo: demographics(notArrived),
            specialtiesPerPatient: [...specialtyCounts.entries()].map(([count, n]) => ({ count, patients: n })).sort((a, b) => a.count - b.count),
            sexBySpecialty: [...sexRows.values()].sort((a, b) => b.total - a.total),
            pendingByDay: [...days.entries()].map(([day, count]) => ({ day, count })).sort((a, b) => a.day.localeCompare(b.day)),
        };
    }, [appointments]);

    const exportToCSV = () => {
        const rows = [
            ['التخصص', ...GROUP_KEYS.map((key) => GROUP_LABELS[key]), 'المجموع', 'عدد الزوار', 'الزوار الحاضرون', 'أنهوا جميع الفحوصات'],
            ...statistics.map((stat) => [
                stat.specialty_name,
                ...GROUP_KEYS.map((key) => stat[key] || 0),
                stat.total || 0,
                stat.patients_total || 0,
                stat.patients_arrived || 0,
                stat.patients_finished || 0,
            ]),
            [
                'المجموع',
                ...GROUP_KEYS.map((key) => totals[key] || 0),
                totals.total || 0,
                totals.patients_total || 0,
                totals.patients_arrived || 0,
                totals.patients_finished || 0,
            ],
        ];
        downloadCsv(rows, `event_${eventId}_statistics.csv`);
    };

    const backTo = `/admin/event-tracking/${eventId}`;

    // The /admin/statistics route has no event: nothing to load
    if (!eventId) {
        return (
            <div className="max-w-2xl lg:max-w-none mx-auto">
                <PageHeader title="إحصائيات الحدث" />
                <EmptyState title="لم يُحدَّد حدث">افتح متابعة الحدث ثم اختر الإحصائيات لعرض أرقامه.</EmptyState>
            </div>
        );
    }

    if (loading) return <LoadingState />;

    if (error) {
        return (
            <div className="max-w-6xl lg:max-w-none mx-auto">
                <BackLink to={backTo} />
                <PageHeader title="إحصائيات الحدث" subtitle={event?.name} />
                <ErrorState message={error} onRetry={() => fetchAll()} />
            </div>
        );
    }

    return (
        <div className="max-w-6xl lg:max-w-none mx-auto">
            {!isViewer && <BackLink to={backTo} />}
            <PageHeader
                title={isViewer ? 'أثناء الحدث' : 'إحصائيات الحدث'}
                subtitle={event?.name}
                actions={
                    <>
                        <IconButton
                            icon={RefreshCw}
                            label="حدّث الأرقام"
                            onClick={() => fetchAll({ silent: true })}
                            disabled={refreshing}
                            className="bg-white border border-line disabled:opacity-50"
                        />
                        <ActionsMenu
                            title="تصدير"
                            actions={[{ icon: Download, label: 'نزّل ملف CSV', hint: 'المواعيد حسب التخصص والحالة', onClick: exportToCSV }]}
                        />
                    </>
                }
            />

            {!isViewer && <PhaseTabs value={phase} onChange={setPhase} />}

            {phase === 'before' && (
                <BeforeView
                    totals={totals}
                    statistics={statistics}
                    distribution={distribution}
                    notArrivedDemo={derived.notArrivedDemo}
                    specialtiesPerPatient={derived.specialtiesPerPatient}
                    sexBySpecialty={derived.sexBySpecialty}
                />
            )}
            {phase === 'during' && (
                <DuringView eventId={eventId} totals={totals} statistics={statistics} allDemo={derived.allDemo} pendingByDay={derived.pendingByDay} />
            )}
            {phase === 'after' && (
                <AfterView eventId={eventId} totals={totals} present={present} arrivedDemo={derived.arrivedDemo} />
            )}
        </div>
    );
};

export default VisitsStatistics;
