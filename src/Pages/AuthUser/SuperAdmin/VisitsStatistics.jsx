import { API_BASE_URL } from '../../../config/environment';
import React, { useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Download, RefreshCw } from 'lucide-react';
import { AppContext } from '../../../Context/AppContext';
import { STATUS_GROUPS, GROUP_LABELS } from '../../../utils/visitStatus';
import { EmptyState, IconButton, PageHeader, StatStrip, LoadingState, Panel, useToast } from '../../../Components/ui';
import {
    ActionsMenu, BackLink, CHART, ChartLegend, ErrorState, HBarChart, RankList, ResponsiveTable, ShareBar, downloadCsv,
} from '../../../Components/ui/StatsKit';

import DeepStatsSection from './Components/DeepStatsSection';

const apiUrl = API_BASE_URL;

const GROUP_KEYS = Object.keys(STATUS_GROUPS);

// One colour per status group, same family as StatusBadge (st-* tokens)
const GROUP_COLORS = {
    pending: CHART.pending,
    waiting: CHART.hold,
    in_queue: CHART.queue,
    dilatation: CHART.dil,
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

const VisitsStatistics = () => {
    const { eventId } = useParams();
    const { token } = useContext(AppContext);
    const toast = useToast();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [event, setEvent] = useState(null);
    const [statistics, setStatistics] = useState([]);
    const [totals, setTotals] = useState({});
    const [residenceCounts, setResidenceCounts] = useState([]);
    const [cityCounts, setCityCounts] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        if (eventId) {
            fetchEventDetails();
            fetchStatistics();
        }
    }, [eventId]);

    const fetchEventDetails = async () => {
        try {
            const res = await fetch(`${apiUrl}/api/events/${eventId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (res.ok) setEvent(data.event || data);
        } catch (err) {
            console.error('Error fetching event:', err);
        }
    };

    // silent: refresh in the background, keep the current numbers on screen
    const fetchStatistics = async ({ silent = false } = {}) => {
        try {
            if (silent) setRefreshing(true);
            else setLoading(true);
            setError('');

            const res = await fetch(`${apiUrl}/api/appointments/event-statistics/${eventId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed to fetch statistics');

            const data = await res.json();
            setStatistics(data.by_specialty || []);

            // Totals (same keys as each by_specialty row)
            const stats = data.statistics || {};
            const calculatedTotals = {
                ...Object.fromEntries(GROUP_KEYS.map((key) => [key, stats[key] || 0])),
                total: stats.total || 0,
                patients_total: stats.patients_total || 0,
                patients_arrived: stats.patients_arrived || 0,
                patients_finished: stats.patients_finished || 0,
            };
            setTotals((prev) => ({ ...prev, ...calculatedTotals }));

            await fetchDemographics();
        } catch (err) {
            console.error('Error fetching statistics:', err);
            if (silent) toast('تعذر تحديث الإحصائيات، تحقق من الاتصال.', 'error');
            else setError('تحقق من الاتصال ثم أعد المحاولة.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const fetchDemographics = async () => {
        try {
            // All appointments of the event, to compute demographics
            const res = await fetch(`${apiUrl}/api/appointments/by-event?event_id=${eventId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) return;

            const data = await res.json();
            const appointments = data.appointments || [];

            const uniquePatients = new Map();
            appointments.forEach((apt) => {
                if (!uniquePatients.has(apt.patient_id)) uniquePatients.set(apt.patient_id, apt);
            });
            const patients = Array.from(uniquePatients.values());

            const males = patients.filter((apt) => apt.sex === '0' || apt.sex === 0).length;
            const females = patients.filter((apt) => apt.sex === '1' || apt.sex === 1).length;

            // Children: under 10 years old
            const now = new Date();
            const children = patients.filter((apt) => {
                if (!apt.birthday) return false;
                const age = (now - new Date(apt.birthday)) / (1000 * 60 * 60 * 24 * 365.25);
                return age < 10;
            }).length;

            const countBy = (field) => {
                const map = new Map();
                patients.forEach((apt) => {
                    const key = apt[field] || 'unknown';
                    map.set(key, (map.get(key) || 0) + 1);
                });
                return Array.from(map.entries()).map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count);
            };

            setResidenceCounts(countBy('state').map(({ key, count }) => ({ residence: key, count })));
            setCityCounts(countBy('city').map(({ key, count }) => ({ city: key, count })));

            setTotals((prev) => ({
                ...prev,
                total_patients: patients.length,
                total_males: males,
                total_females: females,
                total_children_under_10: children,
            }));
        } catch (err) {
            console.error('Error fetching demographics:', err);
        }
    };

    const exportToCSV = () => {
        const rows = [
            ['التخصص', ...GROUP_KEYS.map((key) => GROUP_LABELS[key]), 'المجموع', 'عدد المرضى', 'المرضى الحاضرون', 'أنهوا جميع الفحوصات'],
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
                <ErrorState message={error} onRetry={() => fetchStatistics()} />
            </div>
        );
    }

    const notArrived = Math.max((totals.patients_total || 0) - (totals.patients_arrived || 0), 0);

    const specialtyColumns = [
        { key: 'specialty_name', label: 'التخصص', primary: true },
        ...GROUP_KEYS.map((key) => ({ key, label: GROUP_LABELS[key], align: 'center', render: (row) => row[key] || 0 })),
        { key: 'total', label: 'المجموع', align: 'center', render: (row) => row.total || 0 },
        {
            key: 'patients',
            label: 'المرضى (حضر / المجموع)',
            align: 'center',
            render: (row) => `${row.patients_arrived || 0} / ${row.patients_total || 0}`,
        },
    ];

    return (
        <div className="max-w-6xl lg:max-w-none mx-auto">
            <BackLink to={backTo} />
            <PageHeader
                title="إحصائيات الحدث"
                subtitle={event?.name}
                actions={
                    <>
                        <IconButton
                            icon={RefreshCw}
                            label="حدّث الأرقام"
                            onClick={() => fetchStatistics({ silent: true })}
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

            <StatStrip
                className="mb-4 lg:grid lg:grid-flow-col lg:auto-cols-fr lg:mx-0 lg:px-0"
                items={[
                    { label: 'عدد المرضى', value: totals.patients_total || 0 },
                    { label: 'حضروا', value: totals.patients_arrived || 0, tone: 'text-st-queue' },
                    { label: 'أنهوا جميع الفحوصات', value: totals.patients_finished || 0, tone: 'text-st-done' },
                    { label: 'لم يحضروا بعد', value: notArrived, tone: 'text-st-pending' },
                ]}
            />

            <div className="space-y-4">
                <Panel title={`المواعيد حسب الحالة (${totals.total || 0})`}>
                    <ShareBar
                        total={totals.total || 0}
                        parts={GROUP_KEYS.map((key) => ({ label: GROUP_LABELS[key], value: totals[key] || 0, color: GROUP_COLORS[key] }))}
                    />
                </Panel>

                <Panel title="المواعيد حسب التخصص">
                    {statistics.length === 0 ? (
                        <p className="py-6 text-center text-sm text-muted">لا توجد مواعيد في هذا الحدث بعد.</p>
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

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <Panel title="المرضى">
                        <dl className="divide-y divide-line">
                            {[
                                ['المسجلون', totals.total_patients],
                                ['الذكور', totals.total_males],
                                ['الإناث', totals.total_females],
                                ['الأطفال (أقل من 10 سنوات)', totals.total_children_under_10],
                            ].map(([label, value]) => (
                                <div key={label} className="flex items-center justify-between py-2.5">
                                    <dt className="text-sm text-ink">{label}</dt>
                                    <dd className="font-display text-lg text-ink">{value || 0}</dd>
                                </div>
                            ))}
                        </dl>
                    </Panel>

                    <Panel title="حسب الولاية">
                        {residenceCounts.length === 0 ? (
                            <p className="py-6 text-center text-sm text-muted">لا توجد بيانات بعد.</p>
                        ) : (
                            <RankList
                                total={totals.total_patients}
                                items={residenceCounts.map((r) => ({ label: residenceName(r.residence), value: r.count }))}
                            />
                        )}
                    </Panel>

                    <Panel title="حسب المدينة">
                        {cityCounts.length === 0 ? (
                            <p className="py-6 text-center text-sm text-muted">لا توجد بيانات بعد.</p>
                        ) : (
                            <RankList
                                total={totals.total_patients}
                                items={cityCounts.map((c) => ({ label: cityName(c.city), value: c.count }))}
                            />
                        )}
                    </Panel>
                </div>
            </div>

            <DeepStatsSection eventId={eventId} />
        </div>
    );
};

export default VisitsStatistics;
