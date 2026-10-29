import { API_BASE_URL } from '../../../config/environment';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    Check, ChevronsDown, MoreVertical, ScanLine, Droplets, Send, MessageSquare, Info, QrCode,
    Lock, Unlock, Download, ListChecks, X, User, Star, ChevronRight, ChevronDown,
} from 'lucide-react';
import { AppContext } from '../../../Context/AppContext';
import { csvSafe } from '../../../utils/safeHtml';
import useLiveRefresh from '../../../utils/useLiveRefresh';
import { statusLabel } from '../../../utils/visitStatus';
import QRScanner from '../RecipientAdmin/QRScanner';
import { PatientQRSection } from '../RecipientAdmin/PatientQRCode';
import {
    Button, IconButton, Ticket, StatusBadge, PriorityBadge, PageHeader, StatStrip, SearchField,
    ChipGroup, EmptyState, LoadingState, Sheet, SheetAction, useToast, cx,
} from '../../../Components/ui';

const apiUrl = API_BASE_URL;
const QUEUED = ['Present', 'Commingsoon'];
const AWAY = ['DilatationSent', 'Dilatation'];
const inQueue = (a) => QUEUED.includes(a.status);
const DEFAULT_PUSH_PLACES = 5;
const MAX_PUSH_PLACES = 30;

/**
 * Specialty queue (مسؤول التخصص / الطبيب). Patients are shown as tickets in
 * queue order. The officer passes, pushes down, sends to dilatation or to
 * another specialty; the patient manager (مسؤول القاعة الصغرى) only pushes down; the
 * doctor reads and writes notes. Every action works from the buttons and from
 * a QR scan of the patient's card.
 */
export default function CheckPatient() {
    const { eventId, specialityId } = useParams();
    const { user, token } = useContext(AppContext);
    const toast = useToast();

    const isOfficer = user && [1, 4].includes(user.role_id);
    const canPushDown = user && [1, 4, 8].includes(user.role_id); // patient manager: إنزال only
    const isSuperAdmin = user?.role_id === 1; // opens / closes the queue on visit day
    const canComment = user && [1, 4, 6].includes(user.role_id);

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const [sex, setSex] = useState('all');
    const [busy, setBusy] = useState(false);

    // Bulk push down
    const [selecting, setSelecting] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);

    // Sheets
    const [actionsFor, setActionsFor] = useState(null);
    const [detailsFor, setDetailsFor] = useState(null);
    const [patientAppointments, setPatientAppointments] = useState(null);
    const [commentFor, setCommentFor] = useState(null);
    const [comment, setComment] = useState('');
    const [referralFor, setReferralFor] = useState(null);
    const [referralOptions, setReferralOptions] = useState(null);
    const [qrFor, setQrFor] = useState(null);
    const [scanAction, setScanAction] = useState(null);

    // Push down (إنزال): the appointments to move and how many places, picked with the slider
    const [pushFor, setPushFor] = useState(null);
    const [pushPlaces, setPushPlaces] = useState(DEFAULT_PUSH_PLACES);
    const [cardMenuId, setCardMenuId] = useState(null);

    const authHeaders = useMemo(() => ({ Authorization: `Bearer ${token}`, Accept: 'application/json' }), [token]);

    const load = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await fetch(`${apiUrl}/api/waitinglist/GetWaitingListBySpeciality/${eventId}/${specialityId}`, { headers: authHeaders });
            const json = await res.json();
            if (res.ok) {
                setData(json);
                const list = json.appointments || [];
                setSelectedIds((prev) => prev.filter((id) => list.some((a) => a.id === id && inQueue(a))));
            } else {
                toast(json.message || 'تعذر تحميل الطابور', 'error');
            }
        } catch {
            toast('تعذر الاتصال بالخادم', 'error');
        } finally {
            if (!silent) setLoading(false);
        }
    }, [eventId, specialityId, authHeaders, toast]);

    useEffect(() => { load(); }, [load]);
    // Reception, other officers and the dilatation room change this queue too
    useLiveRefresh(eventId, token, () => load(true));

    /** POST/PATCH an action and show the server's answer. Returns the JSON on success. */
    const run = async (url, { method = 'POST', body, success } = {}) => {
        setBusy(true);
        try {
            const res = await fetch(`${apiUrl}${url}`, {
                method,
                headers: { ...authHeaders, ...(body ? { 'Content-Type': 'application/json' } : {}) },
                body: body ? JSON.stringify(body) : undefined,
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) {
                toast(json.message || 'تعذر تنفيذ العملية', 'error');
                return null;
            }
            toast(json.message || success);
            load(true);
            return json;
        } catch {
            toast('تعذر الاتصال بالخادم', 'error');
            return null;
        } finally {
            setBusy(false);
        }
    };

    const appointments = data?.appointments || [];
    const hasDilatation = !!data?.has_dilatation;

    const visible = appointments.filter((a) => {
        const q = search.trim();
        if (q && !(a.full_name?.includes(q) || String(a.patient_id).includes(q) || a.phone?.includes(q))) return false;
        if (sex !== 'all' && String(a.sex) !== sex) return false;
        if (filter === 'queue') return a.status === 'Present';
        if (filter === 'pushed') return a.status === 'Commingsoon';
        if (filter === 'away') return AWAY.includes(a.status);
        return true;
    });

    const counts = {
        queue: appointments.filter((a) => a.status === 'Present').length,
        pushed: appointments.filter((a) => a.status === 'Commingsoon').length,
        away: appointments.filter((a) => AWAY.includes(a.status)).length,
    };

    // ---------------------------------------------------------------- actions

    const pass = (a) => run(`/api/waitinglist/Complete/${a.id}`, { success: 'تم الفحص' });
    const openPushDown = (list) => { setPushPlaces(DEFAULT_PUSH_PLACES); setPushFor(list); };
    const toDilatation = (a) => run(`/api/waitinglist/Dilatation/${a.id}`, { success: 'أُرسل إلى قاعة التمدد' });

    const toggleOpen = () => run(`/api/event-specialties/${data.event_specialty_id}/toggle-open`, { method: 'PATCH' });

    const confirmPushDown = async () => {
        const ids = pushFor.map((a) => a.id);
        const ok = pushFor.length === 1
            ? await run(`/api/waitinglist/Commingsoon/${ids[0]}`, { body: { places: pushPlaces } })
            : await run('/api/waitinglist/push-down', { body: { appointment_ids: ids, places: pushPlaces } });
        if (ok) { setPushFor(null); setSelectedIds([]); setSelecting(false); }
    };

    const openDetails = async (a) => {
        setDetailsFor(a);
        setPatientAppointments(null);
        try {
            const res = await fetch(`${apiUrl}/api/appointment/patient-appointments/${a.patient_id}/${eventId}`, { headers: authHeaders });
            const json = await res.json();
            setPatientAppointments(res.ok ? json.appointments || [] : []);
        } catch {
            setPatientAppointments([]);
        }
    };

    const openReferral = async (a) => {
        setReferralFor(a);
        setReferralOptions(null);
        try {
            const res = await fetch(`${apiUrl}/api/appointments/${a.id}/referral-options`, { headers: authHeaders });
            const json = await res.json();
            setReferralOptions(res.ok ? json.specialties || [] : []);
        } catch {
            setReferralOptions([]);
        }
    };

    const saveComment = async () => {
        const ok = await run('/api/appointment/addComment', { body: { appointment_id: commentFor.id, comment }, success: 'تم حفظ الملاحظة' });
        if (ok) setCommentFor(null);
    };

    // Returns false so the scanner stays open when the patient can't take the action
    const handleScan = async (patientId) => {
        const a = appointments.find((x) => String(x.patient_id) === String(patientId));
        if (!a) {
            toast(`المريض #${patientId} ليس في هذا الطابور اليوم`, 'error');
            return false;
        }
        if (['complete', 'pushdown'].includes(scanAction) && !inQueue(a)) {
            toast(`المريض #${patientId} ليس في الطابور الآن (${statusLabel(a.status)})`, 'error');
            return false;
        }
        setScanAction(null);
        if (scanAction === 'complete') return pass(a);
        if (scanAction === 'pushdown') return openPushDown([a]);
        // "actions": the same menu as tapping the patient's card
        setActionsFor(a);
    };

    const exportCsv = () => {
        const rows = [['الترتيب', 'رقم المريض', 'الاسم', 'الحالة', 'الساعة', 'الهاتف', 'ملاحظة']];
        appointments.forEach((a) => rows.push([
            inQueue(a) ? a.orderList : '', a.patient_id, a.full_name, statusLabel(a.status), a.hour?.time || '', a.phone || '', a.comment || '',
        ]));
        const csv = rows.map((r) => r.map((c) => `"${csvSafe(c).replace(/"/g, '""')}"`).join(',')).join('\n');
        const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = `${data?.speciality || 'queue'}_${data?.today || ''}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    // ------------------------------------------------------------------- view

    if (loading && !data) return <LoadingState />;

    const summary = data?.summary || {};
    const backTo = user?.role_id === 1 ? `/admin/event-tracking/${eventId}` : `/admin/stations/${eventId}`;

    return (
        <div className="max-w-2xl lg:max-w-none mx-auto">
            <Link to={backTo} className="inline-flex items-center gap-1 text-sm text-muted mb-2 min-h-[2.75rem]">
                <ChevronRight className="w-4 h-4" /> كل الطوابير
            </Link>

            <PageHeader
                title={data?.speciality || 'الطابور'}
                subtitle={`طابور اليوم، ${summary.in_queue ?? 0} في الانتظار`}
                actions={data?.event_specialty_id && isSuperAdmin && (
                    <button
                        type="button"
                        onClick={toggleOpen}
                        disabled={busy}
                        className={cx('inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-xs font-semibold border disabled:opacity-60',
                            data.is_open ? 'border-line text-muted bg-white' : 'border-st-queue/40 text-st-queue bg-st-queue-bg')}
                        title={data.is_open ? 'لن يُرسل مرضى جدد، ويُفحص من في الطابور' : 'يُرسل إليه المرضى المنتظرون فوراً'}
                    >
                        {data.is_open ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                        {data.is_open ? 'أغلق الطابور' : 'افتح الطابور'}
                    </button>
                )}
            />

            <StatStrip
                className="mb-4"
                items={[
                    { label: 'في الطابور', value: summary.in_queue, tone: 'text-st-queue' },
                    hasDilatation && { label: 'في التمدد', value: summary.dilatation, tone: 'text-st-dil' },
                    { label: 'أنهوا الفحص', value: summary.completed, tone: 'text-st-done' },
                    { label: 'في تخصص آخر أولاً', value: summary.waiting, tone: 'text-st-hold' },
                    { label: 'لم يحضروا بعد', value: summary.pending, tone: 'text-st-pending' },
                ]}
            />

            {/* Tools: scan, select, export */}
            <div className="lg:max-w-3xl">
            <div className="flex gap-2 mb-3">
                {isOfficer && (
                    <Button variant="primary" icon={ScanLine} className="flex-1" onClick={() => setScanAction('complete')}>
                        مسح للإجتياز
                    </Button>
                )}
                {canPushDown && (
                    <Button variant={isOfficer ? 'secondary' : 'primary'} icon={ChevronsDown} className="flex-1" onClick={() => setScanAction('pushdown')}>
                        مسح للإنزال
                    </Button>
                )}
                <IconButton icon={QrCode} label="مسح لعرض إجراءات المريض" className="bg-white border border-line" onClick={() => setScanAction('actions')} />
                {canPushDown && (
                    <IconButton
                        icon={selecting ? X : ListChecks}
                        label={selecting ? 'إلغاء التحديد' : 'تحديد عدة مرضى للإنزال'}
                        className={cx('border border-line', selecting ? 'bg-ink text-white hover:bg-ink' : 'bg-white')}
                        onClick={() => { setSelecting(!selecting); setSelectedIds([]); }}
                    />
                )}
                {user?.role_id === 1 && (
                    <IconButton icon={Download} label="تحميل CSV" className="bg-white border border-line" onClick={exportCsv} />
                )}
            </div>

            <SearchField value={search} onChange={setSearch} placeholder="ابحث بالاسم أو رقم المريض" className="mb-3" />
            <ChipGroup
                label="تصفية حسب الحالة"
                value={filter}
                onChange={setFilter}
                className="mb-2"
                options={[
                    { value: 'all', label: 'الكل', count: appointments.length },
                    { value: 'queue', label: 'في الطابور', count: counts.queue },
                    { value: 'pushed', label: 'تم إنزاله', count: counts.pushed },
                    ...(hasDilatation ? [{ value: 'away', label: 'في التمدد', count: counts.away }] : []),
                ]}
            />
            <ChipGroup
                label="تصفية حسب الجنس"
                value={sex}
                onChange={setSex}
                className="mb-4"
                options={[
                    { value: 'all', label: 'الجميع' },
                    { value: '0', label: 'ذكور' },
                    { value: '1', label: 'إناث' },
                ]}
            />
            </div>

            {selecting ? (
                <p className="text-sm text-muted mb-3">اختر المرضى غير الموجودين عند الباب، ثم اضغط «إنزال المحددين».</p>
            ) : canPushDown && (
                <p className="text-sm text-muted mb-3">
                    {isOfficer ? 'اضغط على بطاقة المريض لتسجيل الإجتياز أو الإنزال، أو امسح رمزه.' : 'اضغط على بطاقة المريض لإنزاله، أو امسح رمزه.'}
                </p>
            )}

            {visible.length === 0 ? (
                <EmptyState title={appointments.length ? 'لا أحد يطابق البحث' : 'الطابور فارغ'}>
                    {appointments.length ? 'جرّب اسماً أو رقماً آخر.' : 'يظهر المرضى هنا عند تسجيل حضورهم في الاستقبال.'}
                </EmptyState>
            ) : (
                <ol className="space-y-3 lg:grid lg:grid-cols-2 2xl:grid-cols-3 lg:gap-4 lg:space-y-0">
                    {visible.map((a) => {
                        const queued = inQueue(a);
                        const selected = selectedIds.includes(a.id);
                        const select = () => queued && setSelectedIds((prev) => (selected ? prev.filter((x) => x !== a.id) : [...prev, a.id]));
                        return (
                            <li key={a.id}>
                                <Ticket position={queued ? a.orderList : '—'} priority={a.is_priority} selected={selected} muted={!queued}>
                                    <div
                                        className={cx('flex items-start gap-2', (!selecting || queued) && 'cursor-pointer')}
                                        onClick={selecting ? select : () => setActionsFor(a)}
                                    >
                                        {selecting && queued && (
                                            <input type="checkbox" checked={selected} onChange={select} onClick={(e) => e.stopPropagation()}
                                                className="mt-1 w-5 h-5 accent-[#101E58]" aria-label={`تحديد المريض ${a.patient_id}`} />
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <p className="font-semibold text-ink leading-snug truncate">{a.full_name}</p>
                                            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted">
                                                <span className="font-semibold text-ink">#{a.patient_id}</span>
                                                <User className={cx('w-3.5 h-3.5', String(a.sex) === '1' ? 'text-rose' : 'text-ink-soft')} aria-label={String(a.sex) === '1' ? 'أنثى' : 'ذكر'} />
                                                <StatusBadge status={a.status} />
                                                {a.is_special && <span className="inline-flex items-center gap-1 text-rose"><Star className="w-3.5 h-3.5" />حالة خاصة</span>}
                                                {a.hour?.time && <span>موعده {a.hour.time.slice(0, 5)}</span>}
                                            </div>
                                            {canComment && a.comment && (
                                                <p className="mt-2 text-sm text-ink bg-paper rounded-lg px-2 py-1.5 line-clamp-2">{a.comment}</p>
                                            )}
                                        </div>
                                        {!selecting && (
                                            <IconButton icon={MoreVertical} label="إجراءات المريض" className="-me-2 -mt-1" />
                                        )}
                                    </div>

                                    {canPushDown && queued && !selecting && (
                                        <div className="mt-3">
                                            <button
                                                type="button"
                                                aria-haspopup="menu"
                                                aria-expanded={cardMenuId === a.id}
                                                disabled={busy}
                                                onClick={() => setCardMenuId(cardMenuId === a.id ? null : a.id)}
                                                className="w-full flex items-center justify-between gap-2 h-11 px-4 rounded-xl border border-line bg-white font-semibold text-ink disabled:opacity-60"
                                            >
                                                <span>الإجراء في الطابور</span>
                                                <ChevronDown className={cx('w-5 h-5 transition-transform', cardMenuId === a.id && 'rotate-180')} />
                                            </button>
                                            {cardMenuId === a.id && (
                                                <div role="menu" className="mt-1 rounded-xl border border-line bg-white overflow-hidden divide-y divide-line">
                                                    {isOfficer && (
                                                        <button type="button" role="menuitem" disabled={busy}
                                                            className="w-full flex items-center gap-2 h-12 px-4 text-st-done font-semibold hover:bg-paper disabled:opacity-60"
                                                            onClick={() => { setCardMenuId(null); pass(a); }}>
                                                            <Check className="w-5 h-5" /> إجتاز
                                                        </button>
                                                    )}
                                                    <button type="button" role="menuitem" disabled={busy}
                                                        className="w-full flex items-center gap-2 h-12 px-4 text-ink font-semibold hover:bg-paper disabled:opacity-60"
                                                        onClick={() => { setCardMenuId(null); openPushDown([a]); }}>
                                                        <ChevronsDown className="w-5 h-5" /> إنزال
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {!queued && (
                                        <p className="mt-2 text-xs text-st-dil">في قاعة التمدد، يعود تلقائياً بأولوية</p>
                                    )}
                                </Ticket>
                            </li>
                        );
                    })}
                </ol>
            )}

            {/* Bulk bar above the tab bar */}
            {selecting && (
                <div className="fixed inset-x-0 lg:start-24 bottom-[4.75rem] lg:bottom-6 z-40 px-4 lg:px-8">
                    <div className="max-w-2xl lg:max-w-3xl mx-auto flex items-center gap-2 bg-ink text-white rounded-2xl p-2 ps-4 shadow-lg">
                        <span className="flex-1 text-sm font-semibold">تم تحديد {selectedIds.length}</span>
                        <Button variant="warning" icon={ChevronsDown} disabled={!selectedIds.length || busy} onClick={() => openPushDown(appointments.filter((a) => selectedIds.includes(a.id)))}>
                            إنزال المحددين
                        </Button>
                    </div>
                </div>
            )}

            {/* Per-patient menu */}
            <Sheet open={!!actionsFor} onClose={() => setActionsFor(null)} title={actionsFor ? `#${actionsFor.patient_id} ${actionsFor.full_name}` : ''}>
                {actionsFor && (
                    <div className="divide-y divide-line">
                        {isOfficer && inQueue(actionsFor) && (
                            <SheetAction icon={Check} hint="انتهى فحصه، ينتقل إلى تخصصه التالي" onClick={() => { pass(actionsFor); setActionsFor(null); }}>
                                إجتاز
                            </SheetAction>
                        )}
                        {canPushDown && inQueue(actionsFor) && (
                            <SheetAction icon={ChevronsDown} hint="ليس عند الباب، يرجع بعض المراتب" onClick={() => { openPushDown([actionsFor]); setActionsFor(null); }}>
                                إنزال
                            </SheetAction>
                        )}
                        {isOfficer && inQueue(actionsFor) && hasDilatation && (
                            <SheetAction icon={Droplets} hint="يغادر الطابور ويعود بأولوية بعد التمدد" onClick={() => { toDilatation(actionsFor); setActionsFor(null); }}>
                                إرسال إلى قاعة التمدد
                            </SheetAction>
                        )}
                        {isOfficer && inQueue(actionsFor) && (
                            <SheetAction icon={Send} hint="لتخصص لم يحجزه، يدخل طابوره في المرتبة الثالثة" onClick={() => { openReferral(actionsFor); setActionsFor(null); }}>
                                إرسال إلى تخصص آخر
                            </SheetAction>
                        )}
                        {canComment && (
                            <SheetAction icon={MessageSquare} onClick={() => { setComment(actionsFor.comment || ''); setCommentFor(actionsFor); setActionsFor(null); }}>
                                {actionsFor.comment ? 'تعديل الملاحظة' : 'إضافة ملاحظة'}
                            </SheetAction>
                        )}
                        <SheetAction icon={Info} onClick={() => { openDetails(actionsFor); setActionsFor(null); }}>تفاصيل المريض ومواعيده</SheetAction>
                        <SheetAction icon={QrCode} onClick={() => { setQrFor(actionsFor); setActionsFor(null); }}>عرض رمز QR</SheetAction>
                    </div>
                )}
            </Sheet>

            {/* Push down: choose how many places with a vertical slider */}
            <Sheet
                open={!!pushFor}
                onClose={() => setPushFor(null)}
                title={pushFor?.length > 1 ? `إنزال ${pushFor.length} مرضى` : 'إنزال المريض'}
                footer={<Button variant="warning" block size="lg" icon={ChevronsDown} loading={busy} onClick={confirmPushDown}>إنزال {pushPlaces} مراتب</Button>}
            >
                <p className="text-sm text-muted mb-3">اسحب المؤشر للأسفل لزيادة عدد المراتب.</p>
                <div className="flex items-center justify-center gap-6 py-2">
                    <input
                        type="range"
                        min={1}
                        max={MAX_PUSH_PLACES}
                        step={1}
                        value={pushPlaces}
                        onChange={(e) => setPushPlaces(Number(e.target.value))}
                        aria-label="عدد المراتب"
                        className="accent-[#101E58] w-10 h-56"
                        style={{ writingMode: 'vertical-lr', direction: 'ltr' }}
                    />
                    <div className="text-center">
                        <p className="font-display text-5xl text-ink leading-none">{pushPlaces}</p>
                        <p className="text-sm text-muted mt-1">مراتب</p>
                    </div>
                </div>
            </Sheet>

            {/* Details */}
            <Sheet open={!!detailsFor} onClose={() => setDetailsFor(null)} title={detailsFor ? `#${detailsFor.patient_id} ${detailsFor.full_name}` : ''}>
                {detailsFor && (
                    <>
                        <dl className="grid grid-cols-2 gap-3 text-sm mb-4">
                            <div><dt className="text-muted">تاريخ الميلاد</dt><dd className="font-semibold">{detailsFor.birthday ? new Date(detailsFor.birthday).toLocaleDateString('en-GB') : '—'}</dd></div>
                            <div><dt className="text-muted">الجنس</dt><dd className="font-semibold">{String(detailsFor.sex) === '1' ? 'أنثى' : 'ذكر'}</dd></div>
                            <div className="col-span-2"><dt className="text-muted">الأمراض المزمنة</dt><dd className="font-semibold">{detailsFor.diseases && detailsFor.diseases !== 'nothing' ? detailsFor.diseases : 'لا يوجد'}</dd></div>
                        </dl>
                        <h3 className="font-semibold mb-2">مواعيده في هذا الحدث</h3>
                        {patientAppointments === null ? <LoadingState /> : (
                            <ul className="space-y-2">
                                {patientAppointments.map((p) => (
                                    <li key={p.id} className="rounded-xl border border-line p-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="font-semibold">{p.speciality_name}</span>
                                            <StatusBadge status={p.status} />
                                        </div>
                                        <p className="text-xs text-muted mt-1">{p.day || ''} {p.hour ? `الساعة ${p.hour.slice(0, 5)}` : ''}</p>
                                        {canComment && p.comment && <p className="text-sm mt-1">{p.comment}</p>}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </>
                )}
            </Sheet>

            {/* Comment */}
            <Sheet
                open={!!commentFor}
                onClose={() => setCommentFor(null)}
                title="ملاحظة على المريض"
                footer={<Button block size="lg" loading={busy} onClick={saveComment}>حفظ الملاحظة</Button>}
            >
                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={5}
                    autoFocus
                    className="w-full rounded-xl border border-line p-3 text-base focus:border-ink focus:outline-none"
                    placeholder="اكتب الملاحظة الطبية..."
                />
            </Sheet>

            {/* Send to another specialty */}
            <Sheet open={!!referralFor} onClose={() => setReferralFor(null)} title="إرسال إلى تخصص آخر">
                {referralFor && (
                    <>
                        <p className="text-sm text-muted mb-3">
                            يغادر #{referralFor.patient_id} هذا الطابور الآن ويدخل طابور التخصص المختار في المرتبة الثالثة، ثم يعود إلى {data?.speciality}.
                        </p>
                        {referralOptions === null ? <LoadingState /> : referralOptions.length === 0 ? (
                            <EmptyState title="لا يوجد تخصص متاح">كل التخصصات العاملة اليوم إما مغلقة أو محجوزة لهذا المريض.</EmptyState>
                        ) : (
                            <div className="divide-y divide-line">
                                {referralOptions.map((o) => (
                                    <SheetAction
                                        key={o.event_specialty_id}
                                        icon={Send}
                                        hint={`في الطابور الآن: ${o.queue_length}`}
                                        disabled={busy}
                                        onClick={async () => {
                                            const ok = await run(`/api/appointments/${referralFor.id}/refer`, { body: { event_specialty_id: o.event_specialty_id } });
                                            if (ok) setReferralFor(null);
                                        }}
                                    >
                                        {o.name}
                                    </SheetAction>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </Sheet>

            {/* QR of a patient */}
            <Sheet open={!!qrFor} onClose={() => setQrFor(null)} title="رمز QR للمريض">
                {qrFor && <PatientQRSection appointment={qrFor} />}
            </Sheet>

            {scanAction && (
                <QRScanner
                    onScanSuccess={handleScan}
                    onClose={() => setScanAction(null)}
                    eventId={eventId}
                    actionTitle={
                        scanAction === 'complete' ? 'امسح رمز المريض لتسجيل الإجتياز'
                            : scanAction === 'pushdown' ? 'امسح رمز المريض لإنزاله'
                                : 'امسح رمز المريض لعرض إجراءاته'
                    }
                />
            )}

            {data?.is_open === false && (
                <p className="mt-6 text-center text-xs text-muted">
                    هذا التخصص مغلق اليوم، لن يُرسل إليه مرضى جدد.{isSuperAdmin && ' افتحه بزر «افتح الطابور» أعلاه عند وصول الطبيب.'}
                </p>
            )}
            {busy && <span className="sr-only" role="status">جاري التنفيذ</span>}
            {hasDilatation && counts.away > 0 && filter !== 'away' && (
                <p className="mt-4 text-center text-xs text-muted">
                    {counts.away} في قاعة التمدد. <PriorityBadge className="ms-1" /> = عائد من التمدد أو حالة خاصة.
                </p>
            )}
        </div>
    );
}
