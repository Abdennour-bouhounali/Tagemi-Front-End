import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import {
    MoreVertical, Download, MessageCircle, Trash2, Star, Check, BarChart3, MessageSquareHeart, ThumbsUp, ThumbsDown,
} from 'lucide-react';
import { AppContext } from '../../../Context/AppContext';
import { csvSafe } from '../../../utils/safeHtml';
import {
    Button, IconButton, PageHeader, StatStrip, ChipGroup, EmptyState, LoadingState, Sheet, SheetAction,
    Field, SelectInput, useToast, cx,
} from '../../../Components/ui';

const apiUrl = import.meta.env.VITE_API_URL;

const CRITERIA = [
    ['overall_organization', 'التنظيم العام'],
    ['medical_quality', 'الجودة الطبية'],
    ['staff_performance', 'أداء الطاقم'],
    ['registration_ease', 'سهولة التسجيل'],
    ['platform_organization', 'المنصة الرقمية'],
];

const averageOf = (ev) => {
    const values = CRITERIA.map(([k]) => Number(ev[k])).filter((n) => n > 0);
    return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
};

const formatDate = (iso) => (iso ? new Date(iso).toLocaleDateString('ar-DZ', { year: 'numeric', month: 'long', day: 'numeric' }) : '');

const formatPhoneForWhatsApp = (phone) => {
    if (!phone) return '';
    const cleaned = phone.toString().replace(/\D/g, '');
    if (cleaned.startsWith('213')) return cleaned;
    if (cleaned.startsWith('0') && cleaned.length === 10) return '213' + cleaned.substring(1);
    if (cleaned.length === 9) return '213' + cleaned;
    if (cleaned.startsWith('00213')) return cleaned.substring(2);
    if (cleaned.length >= 9 && cleaned.length <= 10) return '213' + cleaned.replace(/^0+/, '');
    return cleaned;
};

const defaultReply = (ev) =>
    `السلام عليكم ${ev.contact_name || 'سيدي/سيدتي'}،\n\nشكراً لكم على تقييمكم وملاحظاتكم القيمة بخصوص الحملة الطبية.\n\nفريق مؤسسة تجمي للتنمية الإنسانية`;

function Stars({ value }) {
    const n = Math.round(Number(value) || 0);
    return (
        <span className="inline-flex" aria-label={`${n} من 5`}>
            {[0, 1, 2, 3, 4].map((i) => (
                <Star key={i} className={cx('w-4 h-4', i < n ? 'text-ink fill-ink' : 'text-line')} />
            ))}
        </span>
    );
}

/** Patients' evaluations of the caravans (super admin). */
const EvaluationsAdmin = () => {
    const { token } = useContext(AppContext);
    const navigate = useNavigate();
    const toast = useToast();

    const [evaluations, setEvaluations] = useState(null);
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState('');
    const [processedFilter, setProcessedFilter] = useState('');
    const [selected, setSelected] = useState(null);
    const [notes, setNotes] = useState('');
    const [busy, setBusy] = useState(false);
    const [deleteFor, setDeleteFor] = useState(null);
    const [whatsappFor, setWhatsappFor] = useState(null);
    const [whatsappMessage, setWhatsappMessage] = useState('');
    const [menuOpen, setMenuOpen] = useState(false);

    const fetchEvents = useCallback(async () => {
        try {
            const res = await fetch(`${apiUrl}/api/events`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (res.ok) setEvents(data.events || []);
        } catch {
            // The event filter just stays empty
        }
    }, [token]);

    const fetchEvaluations = useCallback(async () => {
        try {
            const res = await fetch(`${apiUrl}/api/evaluations`, {
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            });
            const data = await res.json();
            if (res.ok) {
                // Paginated or plain list
                const evals = data.data || data;
                setEvaluations(Array.isArray(evals) ? evals : []);
            } else {
                setEvaluations((prev) => prev || []);
                toast(data.message || 'تعذر تحميل التقييمات', 'error');
            }
        } catch {
            setEvaluations((prev) => prev || []);
            toast('تعذر الاتصال بالخادم، تحقق من الشبكة ثم أعد المحاولة', 'error');
        }
    }, [token, toast]);

    useEffect(() => {
        fetchEvents();
        fetchEvaluations();
    }, [fetchEvents, fetchEvaluations]);

    const all = evaluations || [];
    const byEvent = useMemo(
        () => (selectedEvent ? all.filter((ev) => String(ev.event_id) === String(selectedEvent)) : all),
        [all, selectedEvent]
    );
    const filtered = useMemo(() => {
        if (processedFilter === '') return byEvent;
        const want = processedFilter === 'true';
        return byEvent.filter((ev) => !!ev.is_processed === want);
    }, [byEvent, processedFilter]);

    const processedCount = byEvent.filter((ev) => ev.is_processed).length;
    const recommendCount = byEvent.filter((ev) => ev.would_recommend).length;
    const averages = byEvent.map(averageOf).filter((n) => n !== null);
    const overallAvg = averages.length ? (averages.reduce((a, b) => a + b, 0) / averages.length).toFixed(1) : '—';

    const openDetails = (ev) => {
        setSelected(ev);
        setNotes(ev.admin_notes || '');
    };

    const handleDownloadExcel = () => {
        const rows = filtered.map((ev) => ({
            'الحدث': csvSafe(ev.event?.name),
            'التخصص': csvSafe(ev.specialty),
            'الفئة العمرية': csvSafe(ev.age_range),
            'الجنس': csvSafe(ev.gender),
            'التنظيم العام': ev.overall_organization,
            'الجودة الطبية': ev.medical_quality,
            'أداء الطاقم': ev.staff_performance,
            'سهولة التسجيل': ev.registration_ease,
            'المنصة': ev.platform_organization,
            'ينصح به': ev.would_recommend ? 'نعم' : 'لا',
            'نقاط إيجابية': csvSafe(ev.positive_points),
            'نقاط سلبية': csvSafe(ev.negative_points),
            'اقتراحات': csvSafe(ev.suggestions),
            'تخصصات مقترحة': csvSafe(ev.suggested_specialties),
            'الاسم': csvSafe(ev.contact_name),
            'الهاتف': csvSafe(ev.contact_phone),
            'تاريخ التقييم': ev.submitted_at ? new Date(ev.submitted_at).toLocaleDateString('ar-DZ') : '',
        }));
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'evaluations');
        XLSX.writeFile(wb, 'evaluations.xlsx');
        setMenuOpen(false);
    };

    const handleMarkAsProcessed = async () => {
        const id = selected.id;
        const adminNotes = notes.trim() || 'تمت المراجعة';
        setBusy(true);
        try {
            const res = await fetch(`${apiUrl}/api/evaluations/${id}/process`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ admin_notes: adminNotes }),
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok) {
                setEvaluations((prev) => prev.map((ev) => (ev.id === id ? { ...ev, is_processed: true, admin_notes: adminNotes } : ev)));
                setSelected(null);
                toast('تم وضع التقييم كمُعالج');
            } else {
                toast(data.message || 'تعذر حفظ المعالجة', 'error');
            }
        } catch {
            toast('تعذر الاتصال بالخادم، تحقق من الشبكة ثم أعد المحاولة', 'error');
        } finally {
            setBusy(false);
        }
    };

    const handleDelete = async () => {
        const id = deleteFor.id;
        setBusy(true);
        try {
            const res = await fetch(`${apiUrl}/api/evaluations/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            });
            if (res.ok) {
                setEvaluations((prev) => prev.filter((ev) => ev.id !== id));
                setDeleteFor(null);
                toast('تم حذف التقييم');
            } else {
                const data = await res.json().catch(() => ({}));
                toast(data.message || 'تعذر حذف التقييم', 'error');
            }
        } catch {
            toast('تعذر الاتصال بالخادم، تحقق من الشبكة ثم أعد المحاولة', 'error');
        } finally {
            setBusy(false);
        }
    };

    const sendWhatsAppMessage = () => {
        const phoneNumber = formatPhoneForWhatsApp(whatsappFor.contact_phone);
        if (!phoneNumber || phoneNumber.length < 10) {
            toast('رقم الهاتف غير صحيح أو غير متوفر، لا يمكن فتح واتساب.', 'error');
            return;
        }
        window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(whatsappMessage)}`, '_blank', 'noopener');
        setWhatsappFor(null);
        setWhatsappMessage('');
    };

    const TextBlock = ({ label, text }) => (text ? (
        <div className="mb-3">
            <p className="text-sm font-semibold text-ink mb-1">{label}</p>
            <p className="text-sm text-ink bg-paper rounded-xl p-3 whitespace-pre-wrap break-words">{text}</p>
        </div>
    ) : null);

    return (
        <div className="max-w-2xl mx-auto">
            <PageHeader
                title="التقييمات"
                subtitle="آراء المرضى بعد الحملات الطبية"
                actions={<IconButton icon={MoreVertical} label="خيارات" className="bg-white border border-line" onClick={() => setMenuOpen(true)} />}
            />

            <Field label="الحدث" className="mb-3">
                <SelectInput value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)}>
                    <option value="">كل الأحداث</option>
                    {events.map((event) => <option key={event.id} value={event.id}>{event.name}</option>)}
                </SelectInput>
            </Field>

            <StatStrip
                className="mb-4"
                items={[
                    { label: 'تقييم', value: evaluations ? byEvent.length : undefined },
                    { label: 'متوسط من 5', value: evaluations ? overallAvg : undefined },
                    { label: 'ينصحون بها', value: evaluations && byEvent.length ? `${Math.round((recommendCount / byEvent.length) * 100)}%` : '—', tone: 'text-st-queue' },
                    { label: 'بانتظار المعالجة', value: evaluations ? byEvent.length - processedCount : undefined, tone: 'text-st-pushed' },
                ]}
            />

            <ChipGroup
                label="حالة المعالجة"
                value={processedFilter}
                onChange={setProcessedFilter}
                className="mb-4"
                options={[
                    { value: '', label: 'الكل', count: byEvent.length },
                    { value: 'false', label: 'غير معالجة', count: byEvent.length - processedCount },
                    { value: 'true', label: 'معالجة', count: processedCount },
                ]}
            />

            {evaluations === null ? (
                <LoadingState />
            ) : filtered.length === 0 ? (
                <EmptyState icon={MessageSquareHeart} title={all.length ? 'لا تقييمات تطابق التصفية' : 'لا توجد تقييمات بعد'}>
                    {all.length ? 'اختر حدثاً آخر أو «الكل» لعرض تقييمات أخرى.' : 'تظهر هنا التقييمات التي يرسلها المرضى بعد زيارتهم.'}
                </EmptyState>
            ) : (
                <ul className="bg-white border border-line rounded-2xl divide-y divide-line">
                    {filtered.map((ev) => {
                        const avg = averageOf(ev);
                        return (
                            <li key={ev.id}>
                                <button
                                    type="button"
                                    onClick={() => openDetails(ev)}
                                    className="w-full text-start flex items-start gap-3 px-4 py-3 min-h-[4.5rem] hover:bg-ink-faint first:rounded-t-2xl last:rounded-b-2xl"
                                >
                                    <span className="w-12 shrink-0 text-center">
                                        <span className="block font-display text-2xl leading-none text-ink">{avg !== null ? avg.toFixed(1) : '—'}</span>
                                        <span className="block text-[11px] text-muted mt-1">من 5</span>
                                    </span>
                                    <span className="flex-1 min-w-0">
                                        <span className="flex items-center gap-2">
                                            <span className="font-semibold text-ink truncate">{ev.specialty || 'بدون تخصص'}</span>
                                            {!ev.is_processed && <span className="w-2 h-2 rounded-full bg-st-pushed shrink-0" aria-label="غير معالج" />}
                                        </span>
                                        <span className="block text-xs text-muted mt-0.5 truncate">
                                            {ev.event?.name}{ev.submitted_at ? `، ${formatDate(ev.submitted_at)}` : ''}
                                        </span>
                                        <span className="mt-1 flex items-center gap-1 text-xs">
                                            {ev.would_recommend
                                                ? <span className="inline-flex items-center gap-1 text-st-queue"><ThumbsUp className="w-3.5 h-3.5" />ينصح بها</span>
                                                : <span className="inline-flex items-center gap-1 text-muted"><ThumbsDown className="w-3.5 h-3.5" />لا ينصح بها</span>}
                                            {ev.contact_name && <span className="text-muted ms-2 truncate">{ev.contact_name}</span>}
                                        </span>
                                        {(ev.negative_points || ev.suggestions) && (
                                            <span className="block text-sm text-ink-soft mt-1 line-clamp-1">{ev.negative_points || ev.suggestions}</span>
                                        )}
                                    </span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}

            {/* Header menu */}
            <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} title="التقييمات">
                <div className="divide-y divide-line">
                    <SheetAction
                        icon={BarChart3}
                        hint={selectedEvent ? undefined : 'اختر حدثاً أولاً من القائمة'}
                        disabled={!selectedEvent}
                        onClick={() => { setMenuOpen(false); navigate(`/admin/evaluation_stats/${selectedEvent}`); }}
                    >
                        إحصائيات الحدث
                    </SheetAction>
                    <SheetAction icon={Download} hint={`${filtered.length} تقييم حسب التصفية الحالية`} disabled={!filtered.length} onClick={handleDownloadExcel}>
                        حمّل ملف Excel
                    </SheetAction>
                </div>
            </Sheet>

            {/* Details */}
            <Sheet
                open={!!selected}
                onClose={() => setSelected(null)}
                title="تفاصيل التقييم"
                size="lg"
                footer={selected && !selected.is_processed && (
                    <Button block size="lg" variant="success" icon={Check} loading={busy} onClick={handleMarkAsProcessed}>
                        ضع علامة: تمت المعالجة
                    </Button>
                )}
            >
                {selected && (
                    <>
                        <dl className="grid grid-cols-2 gap-3 text-sm mb-4">
                            <div><dt className="text-muted">الحدث</dt><dd className="font-semibold text-ink">{selected.event?.name || '—'}</dd></div>
                            <div><dt className="text-muted">التاريخ</dt><dd className="font-semibold text-ink">{formatDate(selected.submitted_at) || '—'}</dd></div>
                            <div><dt className="text-muted">التخصص</dt><dd className="font-semibold text-ink">{selected.specialty || '—'}</dd></div>
                            <div><dt className="text-muted">الفئة العمرية والجنس</dt><dd className="font-semibold text-ink">{selected.age_range || '—'}، {selected.gender || '—'}</dd></div>
                        </dl>

                        <ul className="rounded-2xl border border-line divide-y divide-line mb-4">
                            {CRITERIA.map(([key, label]) => (
                                <li key={key} className="flex items-center justify-between gap-2 px-3 min-h-[2.75rem]">
                                    <span className="text-sm text-ink">{label}</span>
                                    <Stars value={selected[key]} />
                                </li>
                            ))}
                            <li className="flex items-center justify-between gap-2 px-3 min-h-[2.75rem]">
                                <span className="text-sm text-ink">ينصح بها لغيره</span>
                                <span className={cx('text-sm font-semibold', selected.would_recommend ? 'text-st-queue' : 'text-muted')}>
                                    {selected.would_recommend ? 'نعم' : 'لا'}
                                </span>
                            </li>
                        </ul>

                        <TextBlock label="نقاط إيجابية" text={selected.positive_points} />
                        <TextBlock label="نقاط سلبية" text={selected.negative_points} />
                        <TextBlock label="اقتراحات" text={selected.suggestions} />
                        <TextBlock label="تخصصات مقترحة" text={selected.suggested_specialties} />

                        {selected.is_processed ? (
                            <div className="mb-3 rounded-xl bg-st-queue-bg text-st-queue px-3 py-2 text-sm">
                                <span className="font-semibold">تمت المعالجة</span>
                                {selected.admin_notes && <span className="block text-ink mt-1 whitespace-pre-wrap">{selected.admin_notes}</span>}
                            </div>
                        ) : (
                            <Field label="ملاحظات الإدارة" hint="تُحفظ مع التقييم عند وضعه كمعالج" className="mb-3">
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={3}
                                    placeholder="تمت المراجعة"
                                    className="w-full rounded-xl border border-line p-3 text-base focus:border-ink focus:outline-none"
                                />
                            </Field>
                        )}

                        <div className="divide-y divide-line">
                            {selected.contact_phone && (
                                <SheetAction
                                    icon={MessageCircle}
                                    hint={`${selected.contact_name || ''} ${selected.contact_phone}`.trim()}
                                    onClick={() => { setWhatsappMessage(defaultReply(selected)); setWhatsappFor(selected); setSelected(null); }}
                                >
                                    راسل المقيّم عبر واتساب
                                </SheetAction>
                            )}
                            <SheetAction icon={Trash2} tone="text-red-700" onClick={() => { setDeleteFor(selected); setSelected(null); }}>
                                احذف التقييم
                            </SheetAction>
                        </div>
                    </>
                )}
            </Sheet>

            {/* WhatsApp */}
            <Sheet
                open={!!whatsappFor}
                onClose={() => setWhatsappFor(null)}
                title="المراسلة عبر واتساب"
                footer={(
                    <Button block size="lg" variant="success" icon={MessageCircle} disabled={!whatsappMessage.trim()} onClick={sendWhatsAppMessage}>
                        افتح واتساب
                    </Button>
                )}
            >
                <Field label="نص الرسالة">
                    <textarea
                        value={whatsappMessage}
                        onChange={(e) => setWhatsappMessage(e.target.value)}
                        rows={6}
                        className="w-full rounded-xl border border-line p-3 text-base focus:border-ink focus:outline-none"
                    />
                </Field>
            </Sheet>

            {/* Delete confirm */}
            <Sheet
                open={!!deleteFor}
                onClose={() => setDeleteFor(null)}
                title="حذف التقييم"
                footer={(
                    <>
                        <Button variant="secondary" className="flex-1" onClick={() => setDeleteFor(null)}>تراجع</Button>
                        <Button variant="danger" icon={Trash2} className="flex-1" loading={busy} onClick={handleDelete}>احذف</Button>
                    </>
                )}
            >
                <p className="text-sm text-ink">سيُحذف هذا التقييم نهائياً ولن يُحتسب في الإحصائيات، ولا يمكن التراجع عن ذلك.</p>
            </Sheet>
        </div>
    );
};

export default EvaluationsAdmin;
