import { API_BASE_URL } from '../../../config/environment';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    Check, ChevronsDown, MoreVertical, ScanLine, Droplets, Send, MessageSquare, Info, QrCode,
    Lock, Unlock, Download, ListChecks, X, User, Star, ChevronRight, DoorOpen, Undo2, Stethoscope, History, UserPlus, ArrowLeftRight,
} from 'lucide-react';
import { AppContext } from '../../../Context/AppContext';
import { csvSafe } from '../../../utils/safeHtml';
import useLiveRefresh from '../../../utils/useLiveRefresh';
import { statusLabel } from '../../../utils/visitStatus';
import { elapsedSeconds, formatElapsed, serverOffset, useNow } from '../../../utils/visitTimer';
import DoctorsStrip from './DoctorsStrip';
import EnterSheet from './EnterSheet';
import QRScanner from '../RecipientAdmin/QRScannerLazy';
import { PatientQRSection } from '../RecipientAdmin/PatientQRCode';
import { PatientHistorySheet } from '../RecipientAdmin/PatientLog';
import {
    Button, IconButton, Ticket, StatusBadge, PriorityBadge, PageHeader, StatStrip, SearchField,
    ChipGroup, EmptyState, LoadingState, Sheet, SheetAction, Field, TextInput, useToast, cx,
} from '../../../Components/ui';

const apiUrl = API_BASE_URL;
const QUEUED = ['Present', 'Commingsoon'];
const AWAY = ['DilatationSent', 'Dilatation'];
const inQueue = (a) => QUEUED.includes(a.status);
const inside = (a) => a.status === 'Entered';
const doctorKey = (specialityId) => `tagemi.doctor.${specialityId}`;
const DEFAULT_PUSH_PLACES = 5;
const MAX_PUSH_PLACES = 30;

/**
 * Specialty queue (مسؤول التخصص / الطبيب). Patients are shown as tickets in
 * queue order. The officer picks one of the present doctors, marks the
 * patient «دخل» (alone or with family members) and later «إجتاز», which times
 * the visit; they also push down, send to dilatation or to another specialty,
 * or switch the patient to another specialty they already booked.
 * The patient manager (مسؤول القاعة الصغرى) only pushes down; the doctor reads
 * and writes notes; the organizer (مسؤول التنظيم) does what the officer does and
 * also pushes down. Every action works
 * from the buttons and from a QR scan of the patient's card.
 */
export default function CheckPatient() {
    const { eventId, specialityId } = useParams();
    const { user, token } = useContext(AppContext);
    const toast = useToast();

    const isOfficer = user && [1, 4, 9].includes(user.role_id);
    // إنزال: super admin, patient manager and organizer (removed for the specialty officer on 2026-11-05)
    const canPushDown = user && [1, 8, 9].includes(user.role_id);
    const canSelect = isOfficer || canPushDown; // family entry and/or bulk إنزال
    const isSuperAdmin = user?.role_id === 1; // opens / closes the queue on visit day
    const canComment = user && [1, 4, 6, 9].includes(user.role_id);

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
    // «تبديل التخصص»: the patient's other booked specialties
    const [switchFor, setSwitchFor] = useState(null);
    const [switchOptions, setSwitchOptions] = useState(null);
    const [qrFor, setQrFor] = useState(null);
    const [historyFor, setHistoryFor] = useState(null);
    const closeHistory = useCallback(() => setHistoryFor(null), []);
    const [scanAction, setScanAction] = useState(null);

    // Push down (إنزال): the appointments to move and how many places, picked with the slider
    const [pushFor, setPushFor] = useState(null);
    const [pushPlaces, setPushPlaces] = useState(DEFAULT_PUSH_PLACES);

    // Doctors of the specialty; the chosen one receives the next «دخل»
    const [doctors, setDoctors] = useState(null);
    const [offsetMs, setOffsetMs] = useState(0);
    const [doctorId, setDoctorId] = useState(() => {
        try { return Number(localStorage.getItem(doctorKey(specialityId))) || null; } catch { return null; }
    });
    const [attendBusy, setAttendBusy] = useState(null);

    // «دخل» sheet: the patient, proposed relatives and family added by hand
    const [enterMembers, setEnterMembers] = useState(null);
    // Doctor of the open «دخل» sheet, and the visit a late relative joins (null = new visit)
    const [enterDoctor, setEnterDoctor] = useState(null);
    const [joinVisit, setJoinVisit] = useState(null);
    // «دخل» pressed with no doctor chosen: what to do once one is picked
    const [pickFor, setPickFor] = useState(null);
    const [enterLoading, setEnterLoading] = useState(false);
    const [picked, setPicked] = useState([]);
    const [cancelFor, setCancelFor] = useState(null);
    const [undoPassFor, setUndoPassFor] = useState(null);
    // «سجّل زائراً»: an existing patient of the event registered in this specialty
    const [registerOpen, setRegisterOpen] = useState(false);
    const [regNumber, setRegNumber] = useState('');
    const [regPreview, setRegPreview] = useState(null);
    const [regError, setRegError] = useState('');
    const [regLoading, setRegLoading] = useState(false);

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
                if (json.event_specialty_id) {
                    const dr = await fetch(`${apiUrl}/api/event-specialties/${json.event_specialty_id}/doctors-present`, { headers: authHeaders });
                    const drJson = await dr.json().catch(() => ({}));
                    if (dr.ok) {
                        setDoctors(drJson.doctors || []);
                        setOffsetMs(serverOffset(drJson.server_time));
                    }
                } else {
                    setDoctors([]);
                }
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
    // Only this specialty, its doctors (arrive / leave) and which queues are open
    useLiveRefresh(eventId, token, () => load(true), {
        parts: data?.event_specialty_id ? [`es_${data.event_specialty_id}`, 'doctors', 'open'] : null,
    });

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

    const all = data?.appointments || [];
    const recentlyPassed = data?.recently_completed || [];
    // Those who passed in the same click (past the last rows of the list: the name of the one chosen still shows)
    const passedWith = (a) => {
        const family = a.visit_group ? recentlyPassed.filter((x) => x.visit_group === a.visit_group && x.completed_at === a.completed_at) : [];
        return family.length ? family : [a];
    };
    const appointments = all.filter((a) => !inside(a));
    const hasDilatation = !!data?.has_dilatation;
    const doctorName = (id) => doctors?.find((d) => d.doctor_id === id)?.full_name || 'الطبيب';
    // A doctor who left still finishes the patients already in the queue
    const selectedDoctor = doctors?.find((d) => d.doctor_id === doctorId && (d.present || d.left_at) && !d.busy) || null;

    // Patients with a doctor now, one card per visit (a family entered together)
    const visits = Object.values(all.filter(inside).reduce((groups, a) => {
        const key = a.visit_group || `a${a.id}`;
        (groups[key] ||= []).push(a);
        return groups;
    }, {})).map((patients) => {
        const doctor = doctors?.find((d) => d.doctor_id === patients[0].doctor_id);
        return {
            key: patients[0].visit_group || patients[0].id,
            patients,
            doctorName: doctorName(patients[0].doctor_id),
            enteredAt: doctor?.current?.entered_at ?? patients[0].entered_at,
            alarmAfter: doctor?.current?.alarm_after_seconds ?? (doctor?.planned_minutes ? doctor.planned_minutes * 90 * patients.length : null),
        };
    });

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

    // The card passes everyone in the visit; one patient's own action passes only them
    const pass = (a) => run(`/api/waitinglist/Complete/${a.id}`, { success: 'تم الفحص' });
    const passAlone = (a) => run(`/api/waitinglist/Complete/${a.id}`, { body: { only: true }, success: 'تم الفحص' });
    const hasCompanions = (a) => !!a.visit_group && all.some((x) => inside(x) && x.id !== a.id && x.visit_group === a.visit_group);

    const chooseDoctor = (id) => {
        setDoctorId(id);
        try {
            if (id) localStorage.setItem(doctorKey(specialityId), String(id));
            else localStorage.removeItem(doctorKey(specialityId));
        } catch { /* private mode: the choice just isn't remembered */ }
    };

    const attend = async (d, action) => {
        setAttendBusy(`${action}-${d.doctor_id}`);
        await run(`/api/event-specialties/${data.event_specialty_id}/doctors/${d.doctor_id}/${action}`);
        setAttendBusy(null);
    };

    const asMember = (a) => ({ id: a.id, patient_id: a.patient_id, full_name: a.full_name, place: a.orderList, can_enter: true, reason: null });

    /** Family of an appointment queued in this specialty (same phone). */
    const fetchRelatives = async (appointmentId) => {
        try {
            const res = await fetch(`${apiUrl}/api/waitinglist/relatives/${appointmentId}`, { headers: authHeaders });
            const json = await res.json().catch(() => ({}));
            return res.ok ? json.relatives || [] : [];
        } catch {
            toast('تعذر جلب أفراد العائلة، يمكنك إضافتهم يدوياً', 'error');
            return [];
        }
    };

    /** «دخل» on one patient: their family in this queue is proposed, ticked. No doctor chosen yet: pick one first. */
    const openEnter = async (a, doctor = selectedDoctor) => {
        if (!doctor) {
            setPickFor({ kind: 'one', a });
            return;
        }
        setEnterDoctor(doctor);
        setJoinVisit(null);
        setEnterMembers([asMember(a)]);
        setPicked([a.id]);
        setEnterLoading(true);
        const relatives = await fetchRelatives(a.id);
        setEnterMembers([asMember(a), ...relatives]);
        setPicked([a.id, ...relatives.filter((r) => r.can_enter).map((r) => r.id)]);
        setEnterLoading(false);
    };

    /** «دخل (n)» from the selection bar: the ticked patients enter together. */
    const openEnterMany = (list, doctor = selectedDoctor) => {
        if (!doctor) {
            setPickFor({ kind: 'many', list });
            return;
        }
        setEnterDoctor(doctor);
        setJoinVisit(null);
        setEnterMembers(list.map(asMember));
        setPicked(list.map((a) => a.id));
    };

    /** Doctor picked in the window opened by «دخل»: remembered, then «دخل» goes on. */
    const pickDoctor = (d) => {
        chooseDoctor(d.doctor_id);
        const pending = pickFor;
        setPickFor(null);
        if (pending?.kind === 'one') openEnter(pending.a, d);
        else if (pending?.kind === 'many') openEnterMany(pending.list, d);
    };

    /** «أضف إليه»: a relative who came late joins this visit (same doctor, they pass together). */
    const openJoin = async (visit) => {
        const doctorIdOfVisit = visit.patients[0].doctor_id;
        setEnterDoctor(doctors?.find((d) => d.doctor_id === doctorIdOfVisit) || { doctor_id: doctorIdOfVisit, full_name: visit.doctorName });
        setJoinVisit(visit);
        setEnterMembers([]);
        setPicked([]);
        setEnterLoading(true);
        const relatives = await fetchRelatives(visit.patients[0].id);
        setEnterMembers(relatives);
        setPicked(relatives.filter((r) => r.can_enter).map((r) => r.id));
        setEnterLoading(false);
    };

    const addMember = (a) => {
        setEnterMembers((prev) => (prev.some((m) => m.id === a.id) ? prev : [...prev, asMember(a)]));
        setPicked((prev) => (prev.includes(a.id) ? prev : [...prev, a.id]));
    };

    const confirmEnter = async () => {
        const ok = await run('/api/waitinglist/enter', { body: { ids: picked, doctor_id: enterDoctor?.doctor_id, join: !!joinVisit } });
        if (ok) { setEnterMembers(null); setJoinVisit(null); setSelectedIds([]); setSelecting(false); }
    };

    const cancelEnter = async (visit) => {
        setCancelFor(null);
        for (const a of visit.patients) {
            // eslint-disable-next-line no-await-in-loop
            await run(`/api/waitinglist/cancel-enter/${a.id}`);
        }
    };
    const undoPass = async (a) => {
        setUndoPassFor(null);
        await run(`/api/waitinglist/undo-complete/${a.id}`);
    };
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

    const openSwitch = async (a) => {
        setSwitchFor(a);
        setSwitchOptions(null);
        try {
            const res = await fetch(`${apiUrl}/api/appointments/${a.id}/switch-options`, { headers: authHeaders });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(json.message);
            setSwitchOptions(json.specialties || []);
        } catch (e) {
            // Not an empty list: the patient may well have other specialties
            setSwitchFor(null);
            toast(e.message || 'تعذر جلب تخصصات الزائر', 'error');
        }
    };

    const confirmSwitch = async (option) => {
        const ok = await run(`/api/appointments/${switchFor.id}/switch-specialty`, { body: { appointment_id: option.appointment_id } });
        if (ok) setSwitchFor(null);
    };

    const saveComment = async () => {
        const ok = await run('/api/appointment/addComment', { body: { appointment_id: commentFor.id, comment }, success: 'تم حفظ الملاحظة' });
        if (ok) setCommentFor(null);
    };

    const openRegister = () => { setRegNumber(''); setRegPreview(null); setRegError(''); setRegisterOpen(true); };
    const lookupRegister = async (number) => {
        const n = String(number || '').replace(/\D/g, '');
        if (!n || !data?.event_specialty_id) return;
        setRegNumber(n);
        setRegLoading(true);
        setRegPreview(null);
        setRegError('');
        try {
            const res = await fetch(`${apiUrl}/api/event-specialties/${data.event_specialty_id}/register-patient/${n}`, { headers: authHeaders });
            const json = await res.json().catch(() => ({}));
            if (res.ok) setRegPreview(json);
            else setRegError(json.message || 'تعذر جلب بيانات الزائر');
        } catch {
            setRegError('تعذر الاتصال بالخادم');
        } finally {
            setRegLoading(false);
        }
    };
    const confirmRegister = async () => {
        const ok = await run(`/api/event-specialties/${data.event_specialty_id}/register-patient`, { body: { patient_id: Number(regPreview.patient_id) } });
        if (ok) setRegisterOpen(false);
    };

    // Returns false so the scanner stays open when the patient can't take the action
    const handleScan = async (patientId) => {
        if (scanAction === 'register') {
            // Any patient of the event, not only this queue
            setScanAction(null);
            setRegisterOpen(true);
            lookupRegister(patientId);
            return;
        }
        const a = all.find((x) => String(x.patient_id) === String(patientId));
        if (!a) {
            toast(`الزائر #${patientId} ليس في هذا الطابور اليوم`, 'error');
            return false;
        }
        if (scanAction === 'complete' && !inside(a)) {
            toast(inQueue(a) ? `الزائر #${patientId} لم يدخل بعد، اضغط «دخل» أولاً` : `الزائر #${patientId} ليس عند الطبيب (${statusLabel(a.status)})`, 'error');
            return false;
        }
        if (['enter', 'relative', 'pushdown'].includes(scanAction) && !inQueue(a)) {
            toast(`الزائر #${patientId} ليس في الطابور الآن (${statusLabel(a.status)})`, 'error');
            return false;
        }
        if (scanAction === 'relative') {
            // Family members one after another: the scanner stays open
            addMember(a);
            toast(`أضيف ${a.full_name}`);
            return false;
        }
        setScanAction(null);
        if (scanAction === 'enter') return openEnter(a);
        if (scanAction === 'complete') return passAlone(a);
        if (scanAction === 'pushdown') return openPushDown([a]);
        // "actions": the same menu as tapping the patient's card
        setActionsFor(a);
    };

    const exportCsv = () => {
        const rows = [['الترتيب', 'رقم الزائر', 'الاسم', 'الحالة', 'الساعة', 'الهاتف', 'ملاحظة']];
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
                        title={data.is_open ? 'لن يُرسل زوار جدد، ويُفحص من في الطابور' : 'يُرسل إليه الزوار المنتظرون فوراً'}
                    >
                        {data.is_open ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                        {data.is_open ? 'أغلق الطابور' : 'افتح الطابور'}
                    </button>
                )}
            />

            {data?.event_specialty_id && (data.is_open === false || data.capacity?.full) && (
                <div role="status" className="mb-4 flex items-start gap-2 rounded-2xl border border-rose/40 bg-rose-soft px-4 py-3 text-sm text-ink">
                    <Lock className="w-4 h-4 mt-0.5 shrink-0 text-rose" />
                    <p>
                        <span className="font-semibold">هذا التخصص مغلق: لن يُرسل إليه زوار جدد، ويُفحص فقط الزوار الموجودون فيه.</span>
                        {data.capacity?.full && ` بلغ عدد الزوار ${data.capacity.load} من ${data.capacity.capacity} زيارة مقررة للأطباء الحاضرين.`}
                        {data.is_open === false && isSuperAdmin && ' يُفتح عند تسجيل وصول طبيب.'}
                    </p>
                </div>
            )}

            {doctors && (
                <DoctorsStrip
                    doctors={doctors}
                    selectedId={selectedDoctor?.doctor_id ?? null}
                    onSelect={isOfficer ? chooseDoctor : null}
                    onAttend={isSuperAdmin ? attend : null}
                    busyKey={attendBusy}
                    offsetMs={offsetMs}
                />
            )}

            <StatStrip
                className="mb-4"
                items={[
                    { label: 'في الطابور', value: summary.in_queue, tone: 'text-st-queue' },
                    { label: 'عند الطبيب', value: summary.in_visit, tone: 'text-st-visit' },
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
                    <>
                        <Button variant="primary" icon={ScanLine} className="flex-1" onClick={() => setScanAction('enter')}>
                            مسح للدخول
                        </Button>
                        <Button variant="secondary" icon={Check} className="flex-1" onClick={() => setScanAction('complete')}>
                            مسح للإجتياز
                        </Button>
                    </>
                )}
                {canPushDown && !isOfficer && (
                    <Button variant="primary" icon={ChevronsDown} className="flex-1" onClick={() => setScanAction('pushdown')}>
                        مسح للإنزال
                    </Button>
                )}
                <IconButton icon={QrCode} label="مسح لعرض إجراءات الزائر" className="bg-white border border-line" onClick={() => setScanAction('actions')} />
                {isOfficer && (
                    <IconButton icon={UserPlus} label="سجّل زائراً موجوداً في هذا التخصص" className="bg-white border border-line" onClick={openRegister} />
                )}
                {canSelect && (
                    <IconButton
                        icon={selecting ? X : ListChecks}
                        label={selecting ? 'إلغاء التحديد' : !canPushDown ? 'تحديد عدة زوار (دخول عائلة)' : isOfficer ? 'تحديد عدة زوار (دخول عائلة أو إنزال)' : 'تحديد عدة زوار للإنزال'}
                        className={cx('border border-line', selecting ? 'bg-ink text-white hover:bg-ink' : 'bg-white')}
                        onClick={() => { setSelecting(!selecting); setSelectedIds([]); }}
                    />
                )}
                {user?.role_id === 1 && (
                    <IconButton icon={Download} label="تحميل CSV" className="bg-white border border-line" onClick={exportCsv} />
                )}
            </div>

            <SearchField value={search} onChange={setSearch} placeholder="ابحث بالاسم أو رقم الزائر" className="mb-3" />
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

            {visits.length > 0 && (
                <section className="mb-5" aria-label="عند الطبيب الآن">
                    <h2 className="flex items-center gap-1.5 font-semibold text-ink mb-2">
                        <Stethoscope className="w-4 h-4 text-st-visit" /> عند الطبيب الآن
                    </h2>
                    <ul className="space-y-3 lg:grid lg:grid-cols-2 2xl:grid-cols-3 lg:gap-4 lg:space-y-0">
                        {visits.map((v) => (
                            <li key={v.key}>
                                <VisitCard
                                    visit={v}
                                    offsetMs={offsetMs}
                                    canAct={isOfficer}
                                    busy={busy}
                                    onPass={() => pass(v.patients[0])}
                                    onJoin={() => openJoin(v)}
                                    onCancel={() => setCancelFor(v)}
                                    onOpen={(a) => setActionsFor(a)}
                                    onDilate={hasDilatation ? toDilatation : undefined}
                                />
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {isOfficer && recentlyPassed.length > 0 && (
                <details className="mb-5 rounded-xl border border-line bg-white">
                    <summary className="flex items-center gap-1.5 min-h-[44px] px-3 font-semibold text-ink cursor-pointer">
                        <Check className="w-4 h-4 text-st-done" /> آخر من اجتاز ({recentlyPassed.length})
                    </summary>
                    <ul className="divide-y divide-line border-t border-line">
                        {recentlyPassed.map((a) => (
                            <li key={a.id} className="flex items-center gap-2 px-3 py-2">
                                <div className="min-w-0 flex-1">
                                    <p className="font-semibold text-ink truncate">{a.full_name}</p>
                                    <p className="text-xs text-muted">
                                        <span className="font-semibold text-ink">#{a.patient_id}</span>
                                        {a.doctor_name && ` · ${a.doctor_name}`}
                                    </p>
                                </div>
                                <Button variant="secondary" size="sm" icon={Undo2} disabled={busy} onClick={() => setUndoPassFor(a)}>
                                    تراجع
                                </Button>
                            </li>
                        ))}
                    </ul>
                </details>
            )}

            {selecting ? (
                <p className="text-sm text-muted mb-3">
                    {!canPushDown ? 'اختر أفراد العائلة ثم «دخل».' : isOfficer ? 'اختر أفراد العائلة ثم «دخل»، أو الزوار غير الموجودين عند الباب ثم «إنزال».' : 'اختر الزوار غير الموجودين عند الباب، ثم اضغط «إنزال المحددين».'}
                </p>
            ) : canSelect && (
                <p className="text-sm text-muted mb-3">
                    {isOfficer ? 'اختر الطبيب ثم اضغط «دخل» على بطاقة الزائر، أو امسح رمزه.' : 'اضغط على بطاقة الزائر لإنزاله، أو امسح رمزه.'}
                </p>
            )}

            {visible.length === 0 ? (
                <EmptyState title={appointments.length ? 'لا أحد يطابق البحث' : 'الطابور فارغ'}>
                    {appointments.length ? 'جرّب اسماً أو رقماً آخر.' : 'يظهر الزوار هنا عند تسجيل حضورهم في الاستقبال.'}
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
                                                className="mt-1 w-5 h-5 accent-[#101E58]" aria-label={`تحديد الزائر ${a.patient_id}`} />
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
                                            <IconButton icon={MoreVertical} label="إجراءات الزائر" className="-me-2 -mt-1" />
                                        )}
                                    </div>

                                    {canSelect && queued && !selecting && (
                                        <div className="mt-3 flex gap-2">
                                            {isOfficer && (
                                                <Button icon={DoorOpen} className="flex-1" disabled={busy} onClick={() => openEnter(a)}>
                                                    دخل
                                                </Button>
                                            )}
                                            {canPushDown && (
                                                <Button variant="secondary" icon={ChevronsDown} className={isOfficer ? '' : 'flex-1'} disabled={busy} onClick={() => openPushDown([a])}>
                                                    إنزال
                                                </Button>
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
                        {isOfficer && (
                            <Button variant="success" icon={DoorOpen} disabled={!selectedIds.length || busy} onClick={() => openEnterMany(appointments.filter((a) => selectedIds.includes(a.id)))}>
                                دخل ({selectedIds.length})
                            </Button>
                        )}
                        {canPushDown && (
                            <Button variant="warning" icon={ChevronsDown} disabled={!selectedIds.length || busy} onClick={() => openPushDown(appointments.filter((a) => selectedIds.includes(a.id)))}>
                                {isOfficer ? 'إنزال' : 'إنزال المحددين'}
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {/* Per-patient menu */}
            <Sheet open={!!actionsFor} onClose={() => setActionsFor(null)} title={actionsFor ? `#${actionsFor.patient_id} ${actionsFor.full_name}` : ''}>
                {actionsFor && (
                    <div className="divide-y divide-line">
                        {isOfficer && inQueue(actionsFor) && (
                            <SheetAction icon={DoorOpen} hint={selectedDoctor ? `عند ${selectedDoctor.full_name}` : 'تختار الطبيب بعدها'} onClick={() => { openEnter(actionsFor); setActionsFor(null); }}>
                                دخل
                            </SheetAction>
                        )}
                        {isOfficer && inside(actionsFor) && (
                            <SheetAction icon={Check} hint={hasCompanions(actionsFor) ? 'هذا الزائر فقط: ينتقل إلى تخصصه التالي، ويبقى من دخل معه عند الطبيب' : 'انتهى فحصه، ينتقل إلى تخصصه التالي'} onClick={() => { passAlone(actionsFor); setActionsFor(null); }}>
                                إجتاز
                            </SheetAction>
                        )}
                        {canPushDown && inQueue(actionsFor) && (
                            <SheetAction icon={ChevronsDown} hint="ليس عند الباب، يرجع بعض المراتب" onClick={() => { openPushDown([actionsFor]); setActionsFor(null); }}>
                                إنزال
                            </SheetAction>
                        )}
                        {isOfficer && (inQueue(actionsFor) || inside(actionsFor)) && hasDilatation && (
                            <SheetAction icon={Droplets} hint="يغادر الطابور ويعود بأولوية بعد التمدد" onClick={() => { toDilatation(actionsFor); setActionsFor(null); }}>
                                إرسال إلى قاعة التمدد
                            </SheetAction>
                        )}
                        {isOfficer && (inQueue(actionsFor) || inside(actionsFor)) && (
                            <SheetAction icon={ArrowLeftRight} hint="إلى تخصص آخر سجّل فيه، ويبقى هذا التخصص محجوزاً له" onClick={() => { openSwitch(actionsFor); setActionsFor(null); }}>
                                تبديل التخصص
                            </SheetAction>
                        )}
                        {isOfficer && (inQueue(actionsFor) || inside(actionsFor)) && (
                            <SheetAction icon={Send} hint="لتخصص لم يحجزه، يدخل طابوره في المرتبة الثالثة" onClick={() => { openReferral(actionsFor); setActionsFor(null); }}>
                                إرسال إلى تخصص آخر
                            </SheetAction>
                        )}
                        {canComment && (
                            <SheetAction icon={MessageSquare} onClick={() => { setComment(actionsFor.comment || ''); setCommentFor(actionsFor); setActionsFor(null); }}>
                                {actionsFor.comment ? 'تعديل الملاحظة' : 'إضافة ملاحظة'}
                            </SheetAction>
                        )}
                        <SheetAction icon={Info} onClick={() => { openDetails(actionsFor); setActionsFor(null); }}>تفاصيل الزائر ومواعيده</SheetAction>
                        <SheetAction icon={History} hint="كل تغييرات حالته: من قام بها ومتى" onClick={() => { setHistoryFor(actionsFor); setActionsFor(null); }}>سجل الزائر</SheetAction>
                        <SheetAction icon={QrCode} onClick={() => { setQrFor(actionsFor); setActionsFor(null); }}>عرض رمز QR</SheetAction>
                    </div>
                )}
            </Sheet>

            {/* Push down: choose how many places with a vertical slider */}
            <Sheet
                open={!!pushFor}
                onClose={() => setPushFor(null)}
                title={pushFor?.length > 1 ? `إنزال ${pushFor.length} زوار` : 'إنزال الزائر'}
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

            <PatientHistorySheet patient={historyFor} eventId={eventId} token={token} onClose={closeHistory} />

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
                title="ملاحظة على الزائر"
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

            {/* Switch to another specialty the patient booked */}
            <Sheet open={!!switchFor} onClose={() => setSwitchFor(null)} title="تبديل التخصص">
                {switchFor && (
                    <>
                        <p className="text-sm text-muted mb-3">
                            يغادر #{switchFor.patient_id} {inside(switchFor) ? 'الطبيب' : 'هذا الطابور'} الآن ويدخل آخر طابور التخصص المختار، ويعود إلى {data?.speciality} لاحقاً في آخر طابوره.
                        </p>
                        {switchOptions === null ? <LoadingState /> : switchOptions.length === 0 ? (
                            <EmptyState title="لا يوجد تخصص آخر">هذا الزائر مسجل في {data?.speciality} فقط.</EmptyState>
                        ) : (
                            <div className="divide-y divide-line">
                                {switchOptions.map((o) => (
                                    <SheetAction
                                        key={o.appointment_id}
                                        icon={ArrowLeftRight}
                                        hint={o.can_switch ? `في الطابور الآن: ${o.queue_length}` : o.reason}
                                        disabled={busy || !o.can_switch}
                                        onClick={() => confirmSwitch(o)}
                                    >
                                        {o.name}
                                    </SheetAction>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </Sheet>

            {/* Send to another specialty */}
            <Sheet open={!!referralFor} onClose={() => setReferralFor(null)} title="إرسال إلى تخصص آخر">
                {referralFor && (
                    <>
                        <p className="text-sm text-muted mb-3">
                            يغادر #{referralFor.patient_id} هذا الطابور الآن ويدخل طابور التخصص المختار في المرتبة الثالثة، ثم يعود إلى {data?.speciality}.
                        </p>
                        {referralOptions === null ? <LoadingState /> : referralOptions.length === 0 ? (
                            <EmptyState title="لا يوجد تخصص متاح">كل التخصصات العاملة اليوم إما مغلقة أو محجوزة لهذا الزائر.</EmptyState>
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

            {/* «دخل»: who goes in to the chosen doctor */}
            {/* «دخل» with no doctor chosen yet: pick the doctor, then «دخل» goes on */}
            <Sheet open={!!pickFor} onClose={() => setPickFor(null)} title="اختر الطبيب">
                {pickFor && (() => {
                    const free = (doctors || []).filter((d) => (d.present || d.left_at) && !d.busy);
                    const busyOnes = (doctors || []).filter((d) => d.busy);
                    return (
                        <div className="space-y-3">
                            <p className="text-sm text-muted">
                                {pickFor.kind === 'one' ? `عند من يدخل ${pickFor.a.full_name}؟` : `عند من يدخل ${pickFor.list.length} زوار؟`} يبقى الطبيب مختاراً للزوار التاليين.
                            </p>
                            {free.length === 0 ? (
                                <p className="rounded-xl border border-dashed border-line bg-paper px-4 py-3 text-sm text-ink">
                                    {busyOnes.length ? 'كل الأطباء مع زوار الآن. اضغط «إجتاز» عند انتهاء زيارة، أو «أضف إليه» لإدخال قريب مع زائر عند الطبيب.' : 'لم يصل أي طبيب في هذا التخصص اليوم.'}
                                </p>
                            ) : (
                                <ul className="divide-y divide-line rounded-2xl border border-line">
                                    {free.map((d) => (
                                        <li key={d.doctor_id}>
                                            <button type="button" onClick={() => pickDoctor(d)}
                                                className="w-full flex items-center gap-3 px-4 min-h-[3.5rem] text-start hover:bg-ink-faint">
                                                <Stethoscope className="w-5 h-5 text-st-queue shrink-0" />
                                                <span className="flex-1 min-w-0">
                                                    <span className="block font-semibold text-ink truncate">{d.full_name}</span>
                                                    <span className="block text-xs text-muted">
                                                        {d.present ? 'حاضر ومتاح' : `غادر ${d.left_at} · يُكمل من في الطابور`} · عالج {d.treated}
                                                    </span>
                                                </span>
                                                <DoorOpen className="w-5 h-5 text-muted" />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {busyOnes.length > 0 && free.length > 0 && (
                                <p className="text-xs text-muted">مع زائر الآن: {busyOnes.map((d) => d.full_name).join('، ')}</p>
                            )}
                        </div>
                    );
                })()}
            </Sheet>

            <EnterSheet
                open={!!enterMembers}
                doctorName={enterDoctor?.full_name}
                joining={joinVisit}
                members={enterMembers || []}
                loading={enterLoading}
                picked={picked}
                onToggle={(id) => setPicked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))}
                candidates={appointments.filter((a) => inQueue(a) && !enterMembers?.some((m) => m.id === a.id))}
                onAdd={addMember}
                onScan={() => setScanAction('relative')}
                onConfirm={confirmEnter}
                onClose={() => { setEnterMembers(null); setJoinVisit(null); }}
                busy={busy}
            />

            <Sheet
                open={!!cancelFor}
                onClose={() => setCancelFor(null)}
                title="إلغاء الدخول"
                footer={<Button variant="danger" block size="lg" icon={Undo2} loading={busy} onClick={() => cancelEnter(cancelFor)}>إلغاء الدخول</Button>}
            >
                {cancelFor && (
                    <p className="text-sm text-ink">
                        {cancelFor.patients.map((a) => a.full_name).join('، ')} {cancelFor.patients.length > 1 ? 'يعودون' : 'يعود'} إلى أول الطابور، ولا يُحسب وقت هذه الزيارة. استعمله عند الضغط على «دخل» بالخطأ.
                    </p>
                )}
            </Sheet>

            {/* Undo «إجتاز»: a family that passed together comes back together */}
            <Sheet
                open={!!undoPassFor}
                onClose={() => setUndoPassFor(null)}
                title="التراجع عن «إجتاز»"
                footer={<Button variant="danger" block size="lg" icon={Undo2} loading={busy} onClick={() => undoPass(undoPassFor)}>تراجع عن «إجتاز»</Button>}
            >
                {undoPassFor && (
                    <p className="text-sm text-ink">
                        {passedWith(undoPassFor).map((a) => a.full_name).join('، ')} {passedWith(undoPassFor).length > 1 ? 'يعودون' : 'يعود'} إلى الطبيب ويتواصل وقت الزيارة، أو إلى أول الطابور إن كان الطبيب مع زائر آخر. وإن انتقل إلى تخصصه التالي، يعود ذلك الموعد إلى الانتظار.
                    </p>
                )}
            </Sheet>

            {/* Register an existing patient in this specialty */}
            <Sheet
                open={registerOpen}
                onClose={() => setRegisterOpen(false)}
                title={`تسجيل زائر في ${data?.speciality || 'هذا التخصص'}`}
                footer={regPreview && (regPreview.undo_complete ? (
                    <Button block size="lg" icon={Undo2} disabled={busy} onClick={() => { setRegisterOpen(false); setUndoPassFor(regPreview.undo_complete); }}>
                        تراجع عن «إجتاز»
                    </Button>
                ) : (
                    <Button block size="lg" icon={UserPlus} loading={busy} disabled={!regPreview.allowed} onClick={confirmRegister}>
                        سجّل #{regPreview.patient_id} في {regPreview.specialty}
                    </Button>
                ))}
            >
                <div className="space-y-4">
                    <p className="text-sm text-muted">لزائر مسجّل في الحدث ولم يحجز هذا التخصص. يُسجَّل لليوم في ساعة التسجيل.</p>
                    <form className="flex gap-2 items-end" onSubmit={(e) => { e.preventDefault(); lookupRegister(regNumber); }}>
                        <Field label="رقم الزائر" className="flex-1">
                            <TextInput type="text" inputMode="numeric" dir="ltr" autoFocus value={regNumber} onChange={(e) => setRegNumber(e.target.value)} placeholder="مثال: 1234" />
                        </Field>
                        <Button type="submit" variant="secondary" loading={regLoading} disabled={!regNumber.trim()}>ابحث</Button>
                        <IconButton icon={QrCode} label="امسح رمز الزائر" className="bg-white border border-line" onClick={() => { setRegisterOpen(false); setScanAction('register'); }} />
                    </form>
                    {regError && <p role="alert" className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700">{regError}</p>}
                    {regPreview && (
                        <section className="rounded-xl border border-line p-3 space-y-2">
                            <p className="font-semibold text-ink">#{regPreview.patient_id} {regPreview.full_name}</p>
                            <ul className="space-y-1 text-sm">
                                {regPreview.specialties.map((sp, i) => (
                                    <li key={i} className="flex items-center justify-between gap-2">
                                        <span className="flex items-center gap-1.5 min-w-0">
                                            <Stethoscope className="w-4 h-4 shrink-0 text-ink-soft" />
                                            <span className="truncate">{sp.name || '-'}</span>
                                            {sp.beyond_limit && <span className="text-xs text-muted">(فوق العدد)</span>}
                                        </span>
                                        <StatusBadge status={sp.status} />
                                    </li>
                                ))}
                            </ul>
                            <p className="text-xs text-muted">
                                الحدث يسمح بـ {regPreview.limit} تخصص لكل زائر، والزائر حاجز {regPreview.counted}.
                            </p>
                            {regPreview.undo_complete ? (
                                <p className="text-sm text-ink-soft">أنهى الزائر هذا التخصص اليوم. إن ضُغط «إجتاز» بالخطأ، تراجع عنه من هنا.</p>
                            ) : regPreview.already_booked ? (
                                <p className="text-sm text-red-700">الزائر حاجز هذا التخصص مسبقاً.</p>
                            ) : regPreview.at_limit && !regPreview.may_exceed ? (
                                <p className="text-sm text-red-700">بلغ العدد المسموح. التسجيل فوق العدد يفعّله المدير العام لمسؤولي التخصص.</p>
                            ) : regPreview.at_limit ? (
                                <p className="text-sm text-ink-soft">بلغ العدد المسموح: يُسجَّل فوق العدد (مسموح من المدير العام).</p>
                            ) : null}
                        </section>
                    )}
                </div>
            </Sheet>

            {/* QR of a patient */}
            <Sheet open={!!qrFor} onClose={() => setQrFor(null)} title="رمز QR للزائر">
                {qrFor && <PatientQRSection appointment={qrFor} />}
            </Sheet>

            {scanAction && (
                <QRScanner
                    onScanSuccess={handleScan}
                    onClose={() => setScanAction(null)}
                    eventId={eventId}
                    actionTitle={{
                        enter: 'امسح رمز الزائر لإدخاله عند الطبيب',
                        relative: 'امسح رموز أفراد العائلة واحداً بعد الآخر',
                        complete: 'امسح رمز الزائر لتسجيل الإجتياز',
                        pushdown: 'امسح رمز الزائر لإنزاله',
                        register: 'امسح رمز الزائر لتسجيله في هذا التخصص',
                    }[scanAction] || 'امسح رمز الزائر لعرض إجراءاته'}
                />
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

/** A visit in progress: doctor, patient(s) and the live timer (rose past the alarm). */
function VisitCard({ visit, offsetMs, canAct, busy, onPass, onJoin, onCancel, onOpen, onDilate }) {
    const now = useNow();
    const elapsed = elapsedSeconds(visit.enteredAt, now, offsetMs);
    const late = visit.alarmAfter && elapsed > visit.alarmAfter;
    const family = visit.patients.length > 1;
    const canDilate = canAct && !!onDilate;
    const dilateButton = (a, props) => (
        <Button variant="secondary" icon={Droplets} disabled={busy} onClick={() => onDilate(a)} aria-label={`أرسل ${a.full_name} إلى التمدد`} {...props}>
            أرسله إلى التمدد
        </Button>
    );

    return (
        <article className={cx('rounded-2xl border bg-white p-3', late ? 'border-rose bg-rose-soft' : 'border-st-visit/30')}>
            <div className="flex items-center gap-2 mb-2">
                <span className="flex-1 min-w-0 text-sm text-muted truncate">
                    عند <span className="font-semibold text-ink">{visit.doctorName}</span>{family && ` · عائلة (${visit.patients.length})`}
                </span>
                <span dir="ltr" className={cx('font-display text-xl tabular-nums', late ? 'text-rose' : 'text-st-visit')}>{formatElapsed(elapsed)}</span>
            </div>
            {late && <p className="text-xs font-semibold text-rose mb-2">تجاوزت الزيارة مرة ونصف المدة المقررة</p>}
            <ul className="space-y-1 mb-3">
                {visit.patients.map((a) => (
                    <li key={a.id} className="flex items-center gap-2">
                        <button type="button" className="flex-1 min-w-0 text-start rounded-lg px-2 py-1.5 hover:bg-ink-faint" onClick={() => onOpen(a)}>
                            <span className="font-semibold text-ink">{a.full_name}</span>
                            <span className="text-xs text-muted ms-2">#{a.patient_id}</span>
                        </button>
                        {/* In a family the doctor orders it for one member; the others stay in */}
                        {canDilate && family && dilateButton(a, { size: 'sm', className: 'shrink-0 whitespace-nowrap' })}
                    </li>
                ))}
            </ul>
            {canDilate && !family && dilateButton(visit.patients[0], { block: true, className: 'mb-2' })}
            {canAct && (
                <div className="flex gap-2">
                    <Button variant="success" icon={Check} className="flex-1" disabled={busy} onClick={onPass}>
                        {family ? 'إجتازوا' : 'إجتاز'}
                    </Button>
                    {/* A relative who came late goes in to this same visit */}
                    <Button variant="secondary" icon={UserPlus} disabled={busy} onClick={onJoin} aria-label="أضف قريباً إلى هذه الزيارة">
                        أضف إليه
                    </Button>
                    <Button variant="secondary" icon={Undo2} disabled={busy} onClick={onCancel} aria-label="إلغاء الدخول">
                        إلغاء
                    </Button>
                </div>
            )}
        </article>
    );
}
