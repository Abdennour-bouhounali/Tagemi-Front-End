import { API_BASE_URL } from '../../../config/environment';
import { useState, useEffect, useContext, useMemo, useCallback } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { AppContext } from "../../../Context/AppContext";
import QRScanner from './QRScanner';
import { escapeHtml, writePrintDocument, csvSafe } from "../../../utils/safeHtml";
import useLiveRefresh from "../../../utils/useLiveRefresh";
import { summarizeVisits, statusLabel, STATUS_LABELS } from "../../../utils/visitStatus";
import { renderToStaticMarkup } from "react-dom/server";
import { QRCodeSVG } from "qrcode.react";
import { PatientQRSection } from './PatientQRCode';
import AppointmentDocuments from '../SuperAdmin/AppointmentDocuments';
import {
  Check,
  ScanLine,
  Star,
  FileText,
  Download,
  Pencil,
  Trash2,
  MoreVertical,
  MessageCircle,
  ClipboardList,
  QrCode,
  Printer,
  Stethoscope,
  RefreshCw,
  SlidersHorizontal,
  User,
  ChevronRight,
  Info,
  Users,
  CheckCircle2,
} from "lucide-react";
import {
  Button, IconButton, StatusBadge, PageHeader, StatStrip, SearchField, ChipGroup, EmptyState,
  LoadingState, Sheet, SheetAction, useToast, Field, TextInput, SelectInput, cx,
} from "../../../Components/ui";

const apiUrl = API_BASE_URL;
const PAGE_SIZE = 60;

// Small dot in the status colour, for the per-specialty chips
const STATUS_DOT = {
  Present: 'bg-st-queue',
  Commingsoon: 'bg-st-pushed',
  Waiting: 'bg-st-hold',
  DilatationSent: 'bg-st-dil',
  Dilatation: 'bg-st-dil',
  Completed: 'bg-st-done',
  Pending: 'bg-st-pending',
};

const isTrue = (v) => v === true || v === 1;
const isSpecialPatient = (p) => (p.all_appointments || [p]).some((a) => isTrue(a.is_special));
const patientDocuments = (p) => [...new Set((p.all_appointments || [p]).flatMap((a) => a.medical_document_urls || []))];
const hasCheckedIn = (p) => (p.all_appointments || [p]).some((a) => a.status !== 'Pending');
const aptDay = (a) => a.day?.day_date || a.day?.date || "-";
const aptHour = (a) => a.hour?.time || a.hour?.hour || "-";

/**
 * Reception desk (role 5), special-cases desk (role 3) and super admin (1).
 * Main job: check patients in fast, by number or QR. Below: the event's
 * patients (one row per patient), with details and actions in sheets.
 */
const CheckPresence = () => {
  const { eventId } = useParams();
  const { token, user } = useContext(AppContext);
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const role = user?.role_id;
  const isAdmin = role === 1;
  const canCheckIn = role === 1 || role === 5;
  const canManageSpecial = role === 1 || role === 3;

  // Data
  const [event, setEvent] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [updating, setUpdating] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [specialtyFilter, setSpecialtyFilter] = useState("all");
  const [dayFilter, setDayFilter] = useState("all");
  const [sexFilter, setSexFilter] = useState("all");
  const [hourFilter, setHourFilter] = useState("all");
  const [reminderFilter, setReminderFilter] = useState("all");
  const [evaluatedFilter, setEvaluatedFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Sheets
  const [actionsFor, setActionsFor] = useState(null);      // patient (grouped) for the ⋮ menu
  const [detailsId, setDetailsId] = useState(null);        // patient_id shown in the details sheet
  const [qrFor, setQrFor] = useState(null);
  const [editFor, setEditFor] = useState(null);            // appointment being edited
  const [editedData, setEditedData] = useState({});
  const [appointmentToDelete, setAppointmentToDelete] = useState(null);
  const [transferFor, setTransferFor] = useState(null);    // appointment being moved
  const [availableSpecialties, setAvailableSpecialties] = useState(null);
  const [selectedTransferSpecialty, setSelectedTransferSpecialty] = useState(null);
  const [transferring, setTransferring] = useState(false);
  const [showExports, setShowExports] = useState(false);

  // Stats from the API
  const [reminderStats, setReminderStats] = useState({ total: 0, reminded: 0, not_reminded: 0 });
  const [evaluatedStats, setEvaluatedStats] = useState({ total: 0, evaluated: 0, not_evaluated: 0 });

  // QR scanner + manual check-in
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [scanAction, setScanAction] = useState(null); // 'present', 'special', 'details'
  const [manualPatientId, setManualPatientId] = useState("");

  // Stable close handlers: the kit's Sheet re-runs its focus effect when
  // onClose changes, so inline arrows would steal focus on every re-render
  // (typing, live refresh).
  const closeActions = useCallback(() => setActionsFor(null), []);
  const closeDetails = useCallback(() => setDetailsId(null), []);
  const closeQr = useCallback(() => setQrFor(null), []);
  const closeDelete = useCallback(() => setAppointmentToDelete(null), []);
  const closeTransfer = useCallback(() => { setTransferFor(null); setSelectedTransferSpecialty(null); }, []);
  const closeFilters = useCallback(() => setShowFilters(false), []);
  const closeExports = useCallback(() => setShowExports(false), []);
  const closeScanner = useCallback(() => setShowQRScanner(false), []);

  const openScanner = (action) => {
    setScanAction(action);
    setShowQRScanner(true);
  };

  // ------------------------------------------------------------- fetching

  const fetchReminderStats = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/appointments/reminder-stats/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.stats) setReminderStats(data.stats);
    } catch (err) {
      console.error("Error fetching reminder stats:", err);
    }
  };

  const fetchEvaluatedStats = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/appointments/evaluated-stats/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.stats) setEvaluatedStats(data.stats);
    } catch (err) {
      console.error("Error fetching evaluated stats:", err);
    }
  };

  const fetchEventDetails = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/events/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setEvent(data.event || data);
      } else {
        toast("تعذر تحميل معلومات الحدث. أعد تحميل الصفحة.", "error");
      }
    } catch (err) {
      console.error("Error fetching event:", err);
      toast("تعذر الاتصال بالخادم. تحقق من الشبكة.", "error");
    }
  };

  // silent: background refresh (live updates) without the loading screen
  const fetchAppointments = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await fetch(`${apiUrl}/api/appointments/by-event?event_id=${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok) {
        const list = data.appointments || data.data || [];
        setAppointments(list);
        setLoadError("");
        return list;
      }
      if (!silent) setLoadError("تعذر تحميل قائمة المرضى.");
    } catch (err) {
      console.error("Error fetching appointments:", err);
      if (!silent) setLoadError("تعذر الاتصال بالخادم. تحقق من الشبكة ثم أعد المحاولة.");
    } finally {
      if (!silent) setLoading(false);
    }
    return [];
  };

  useEffect(() => {
    fetchEventDetails();
    fetchAppointments();
    fetchReminderStats();
    fetchEvaluatedStats();
  }, [eventId]);

  // Other desks change statuses too (officers, other receptionists): reload when they do
  useLiveRefresh(eventId, token, () => {
    fetchAppointments(true);
    fetchReminderStats();
    fetchEvaluatedStats();
  });

  // The "مسح QR" bottom tab links here with ?scan=present: open the camera, then drop the param
  useEffect(() => {
    const mode = searchParams.get("scan");
    if (!mode) return;
    const allowed =
      (mode === "present" && canCheckIn) ||
      (mode === "special" && canManageSpecial) ||
      mode === "details";
    if (allowed) openScanner(mode);
    const next = new URLSearchParams(searchParams);
    next.delete("scan");
    setSearchParams(next, { replace: true });
  }, [searchParams]);

  // ------------------------------------------------------------- check-in

  // Patient (grouped appointments) by number; reloads once if not in the list yet
  const findPatient = async (patientId) => {
    const find = (list) => getUniquePatients(list).find((p) => p.patient_id?.toString() === patientId.toString());
    const patient = find(appointments) || find(await fetchAppointments(true));
    if (!patient) toast(`لا يوجد مريض برقم #${patientId} في هذا الحدث. تحقق من الرقم.`, "error");
    return patient || null;
  };

  // Opened during the click: browsers block pop-ups opened after a network wait
  const openPrintWindow = () => {
    const win = window.open("", "_blank");
    if (!win) {
      toast("المتصفح منع نافذة الطباعة. اسمح بالنوافذ المنبثقة لهذا الموقع.", "error");
      return null;
    }
    win.document.write('<p dir="rtl" style="font-family:sans-serif;padding:2rem">جاري تحضير بطاقة المتابعة...</p>');
    return win;
  };

  // حاضر: check in, then print the follow-up card (بطاقة المتابعة) right away
  const checkInAndPrint = async (patientId) => {
    const win = openPrintWindow();
    const list = await checkInPatient(patientId);
    const patient = list && getUniquePatients(list).find((p) => p.patient_id?.toString() === patientId.toString());
    if (patient && win) {
      printPatientCard(patient, win);
    } else {
      win?.close();
    }
    return !!list;
  };

  // Reprint for a patient already checked in
  const printCardFor = async (patientId, win = openPrintWindow()) => {
    const patient = await findPatient(patientId);
    if (patient && !hasCheckedIn(patient)) {
      toast(`المريض #${patientId} لم يُسجَّل حضوره بعد. سجّل حضوره أولاً.`, "error");
    } else if (patient && win) {
      printPatientCard(patient, win);
      return true;
    }
    win?.close();
    return false;
  };

  // Check-in by patient number (QR scan or typed). Only today's appointments
  // are activated by the server. Returns the reloaded list, or null on failure.
  const checkInPatient = async (patientId) => {
    setUpdating(true);
    try {
      const res = await fetch(`${apiUrl}/api/events/${eventId}/check-in`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ patient_id: Number(patientId) }),
      });
      const data = await res.json();

      if (res.ok) {
        const place = data.position ? `. ترتيبه في الطابور: ${data.position}` : "";
        // No open specialty: checked in, waits for a doctor to arrive
        toast(`${data.message}${place}`, data.appointment ? "success" : "info");
        setManualPatientId("");
        return await fetchAppointments(true);
      }
      toast(data.message || `تعذر تسجيل حضور المريض #${patientId}. تحقق من الرقم.`, "error");
    } catch (err) {
      console.error("Check-in error:", err);
      toast("تعذر الاتصال بالخادم. تحقق من الشبكة ثم أعد المحاولة.", "error");
    } finally {
      setUpdating(false);
    }
    return null;
  };

  // The typed number, or null (with a message) when it is not a number
  const typedPatientId = () => {
    const id = manualPatientId.trim();
    if (!/^\d+$/.test(id)) {
      toast("أدخل رقم المريض بالأرقام فقط.", "error");
      return null;
    }
    return id;
  };

  // سجّل الحضور (typed or scanned): show who it is first; the receptionist
  // confirms in the sheet, which checks in and prints the follow-up card
  const showForPresence = (patient) => {
    if (hasCheckedIn(patient)) toast(`المريض #${patient.patient_id} مسجل حاضراً من قبل.`, "info");
    setDetailsId(patient.patient_id);
  };

  // Buttons of the patient-number panel, by role, main one first
  const numberActions = [
    canCheckIn && { value: 'present', label: 'حاضر', icon: Check },
    canCheckIn && { value: 'print', label: 'طباعة بطاقة الحضور', icon: Printer },
    canManageSpecial && { value: 'special', label: 'حالة خاصة', icon: Star },
    { value: 'details', label: 'تفاصيل المريض', icon: Info },
  ].filter(Boolean);
  const mainAction = numberActions[0];

  // Runs an action on the typed number (Enter runs the main one)
  const runNumberAction = (action) => {
    const id = typedPatientId();
    if (!id) return;
    if (action === 'print') {
      printCardFor(id); // its window opens now, during the click
      return;
    }
    findPatient(id).then((patient) => {
      if (!patient) return;
      if (action === 'present') showForPresence(patient);
      else actOnPatient(action, patient);
    });
  };

  const actOnPatient = async (action, patient) => {
    if (action === 'details') {
      setDetailsId(patient.patient_id);
      return true;
    }
    if (isSpecialPatient(patient)) {
      toast(`المريض #${patient.patient_id} مسجل حالةً خاصة من قبل.`, "info");
      return true;
    }
    return markAsSpecialCase(patient.id);
  };

  // Returns false on failure so the scanner stays open for another try
  const handleQRScanSuccess = async (patientId) => {
    try {
      const patient = await findPatient(patientId);
      if (!patient) return false;

      // Presence: show who it is; the receptionist confirms in the sheet (check in + print)
      if (scanAction === 'present') {
        showForPresence(patient);
        return true;
      }

      if (scanAction === 'print') {
        if (!hasCheckedIn(patient)) {
          toast(`المريض #${patientId} لم يُسجَّل حضوره بعد. سجّل حضوره أولاً.`, "error");
          return false;
        }
        // The scan is not a click: show the sheet, where the print button opens the window
        setDetailsId(patient.patient_id);
        return true;
      }

      return await actOnPatient(scanAction, patient);
    } catch (err) {
      console.error("QR Scan Update Error:", err);
      toast("حدث خطأ أثناء معالجة الرمز. حاول مرة أخرى.", "error");
      return false;
    }
  };

  // ------------------------------------------------------------- WhatsApp

  const formatPhoneForWhatsApp = (phone) => {
    if (!phone) return '';

    // Remove all non-digit characters (spaces, dashes, parentheses, plus signs, etc.)
    let cleaned = phone.toString().replace(/\D/g, '');

    // Algerian numbers: 10 digits with a leading 0, or 9 without; country code 213
    if (cleaned.startsWith('213')) {
      return cleaned;
    } else if (cleaned.startsWith('0') && cleaned.length === 10) {
      return '213' + cleaned.substring(1);
    } else if (cleaned.length === 9) {
      return '213' + cleaned;
    } else if (cleaned.startsWith('00213')) {
      return cleaned.substring(2);
    } else {
      if (cleaned.length >= 9 && cleaned.length <= 10) {
        return '213' + cleaned.replace(/^0+/, '');
      }
      return cleaned;
    }
  };

  // Marks every appointment of a patient locally (is_reminded / is_evaluated)
  const markPatientLocally = (patientId, fields) => {
    setAppointments((prev) => prev.map((apt) => (apt.patient_id === patientId ? { ...apt, ...fields } : apt)));
  };

  const sendWhatsAppReminder = async (appointment) => {
    // Plain text for WhatsApp: no HTML escaping here
    const eventName = event?.name || "الحدث";
    const patientName = appointment.full_name || "المريض";
    const phone = appointment.phone?.replace(/[^0-9]/g, '');
    const phoneNumber = formatPhoneForWhatsApp(phone);

    if (!phoneNumber || phoneNumber.length < 10) {
      toast('رقم هاتف المريض غير صحيح. صحّحه من «عدّل البيانات» ثم أعد الإرسال.', 'error');
      return;
    }

    const allAppointments = appointment.all_appointments || [appointment];
    const appointmentCount = allAppointments.length;

    let appointmentsList = "";
    allAppointments.forEach((apt, index) => {
      const specialty = apt.event_specialty?.specialty?.name || "غير محدد";
      const date = apt.day?.day_date || apt.day?.date || "-";
      const time = String(apt.hour?.time || apt.hour?.hour || "-").slice(0, 5);
      // Patients come one hour before the hour they booked
      const [h, m] = time.split(":").map((n) => parseInt(n, 10));
      const arrival = Number.isNaN(h) ? "" : `${String(Math.max(0, h - 1)).padStart(2, "0")}:${String(m || 0).padStart(2, "0")}`;
      appointmentsList += `\n${index + 1}. التخصص: ${specialty}\n   التاريخ: ${date}\n   التوقيت: ${time}${arrival ? `\n   الحضور على الساعة: ${arrival}` : ""}\n`;
    });

    const message = `السلام عليكم ${patientName}،

نذكر سيادتكم المحترمة ${appointmentCount === 1 ? 'بموعد' : 'بمواعيد'} الفحوصات الطبية:

*${eventName}*
${appointmentsList}
*الحضور بمحرم إجباري بالنسبة للنساء*

نرجو الحضور ساعة قبل الموعد لضمان السيرورة الحسنة للفحوصات.

فريق مؤسسة تجمي للتنمية الإنسانية`;

    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');

    // Record the reminder
    try {
      const res = await fetch(`${apiUrl}/api/appointments/mark-multiple-reminded`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          patient_id: appointment.patient_id,
          event_id: eventId,
        }),
      });

      if (res.ok) {
        markPatientLocally(appointment.patient_id, { is_reminded: 1, reminded_at: new Date().toISOString() });
        setReminderStats((prev) => ({
          total: prev.total,
          reminded: prev.reminded + 1,
          not_reminded: prev.not_reminded > 0 ? prev.not_reminded - 1 : 0,
        }));
        toast("سُجّل التذكير لهذا المريض");
      } else {
        toast("أُرسلت الرسالة لكن تعذر تسجيل التذكير. أعد المحاولة لاحقاً.", "error");
      }
    } catch (err) {
      console.error("Error updating reminder status:", err);
      toast("أُرسلت الرسالة لكن تعذر تسجيل التذكير. تحقق من الشبكة.", "error");
    }
  };

  const generateEvaluationLink = (eventId, appointmentId) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/evaluation/${eventId}/${appointmentId}`;
  };

  const sendEvaluationLinkViaWhatsApp = async (appointment, eventId) => {
    const evaluationLink = generateEvaluationLink(eventId, appointment.id);

    const message = `${evaluationLink}

السلام عليكم ورحمة الله وبركاته ${appointment.full_name}،

نسأل الله الشفاء لكم ولجميع مرضى المسلمين.

نرجو منكم تقييم تجربتكم من خلال الرابط أعلاه.

تقييمكم يساعدنا على تحسين حملاتنا الطبية مستقبلا.

فريق مؤسسة تجمي للتنمية الإنسانية`;

    const phoneNumber = formatPhoneForWhatsApp(appointment.phone);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");

    // Record that the evaluation link was sent
    try {
      const res = await fetch(`${apiUrl}/api/appointments/mark-multiple-evaluated`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          patient_id: appointment.patient_id,
          event_id: eventId,
        }),
      });

      if (res.ok) {
        markPatientLocally(appointment.patient_id, { is_evaluated: 1, evaluated_at: new Date().toISOString() });
        setEvaluatedStats((prev) => ({
          total: prev.total,
          evaluated: prev.evaluated + 1,
          not_evaluated: prev.not_evaluated > 0 ? prev.not_evaluated - 1 : 0,
        }));
        toast("سُجّل إرسال رابط التقييم");
      } else {
        toast("أُرسلت الرسالة لكن تعذر تسجيل إرسال الرابط. أعد المحاولة لاحقاً.", "error");
      }
    } catch (err) {
      console.error("Error updating evaluated status:", err);
      toast("أُرسلت الرسالة لكن تعذر تسجيل إرسال الرابط. تحقق من الشبكة.", "error");
    }
  };

  // ------------------------------------------------------------- transfer

  const fetchAvailableSpecialties = async (appointment) => {
    setTransferFor(appointment);
    setAvailableSpecialties(null);
    setSelectedTransferSpecialty(null);
    try {
      const res = await fetch(`${apiUrl}/api/appointments/${appointment.id}/available-specialties`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok) {
        setAvailableSpecialties(data.available_specialties || []);
      } else {
        setTransferFor(null);
        toast(data.message || "تعذر تحميل التخصصات المتاحة. أعد المحاولة.", "error");
      }
    } catch (err) {
      console.error("Error fetching available specialties:", err);
      setTransferFor(null);
      toast("تعذر الاتصال بالخادم. تحقق من الشبكة.", "error");
    }
  };

  const transferSpecialty = async () => {
    if (!selectedTransferSpecialty || !transferFor) {
      toast("اختر التخصص الجديد أولاً.", "error");
      return;
    }

    setTransferring(true);
    try {
      const res = await fetch(`${apiUrl}/api/appointments/${transferFor.id}/transfer-specialty`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          new_event_specialty_id: selectedTransferSpecialty.event_specialty_id,
          use_closest_slot: true,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast(data.message || "نُقل الموعد إلى التخصص الجديد");
        await fetchAppointments(true);
        setTransferFor(null);
        setSelectedTransferSpecialty(null);
      } else {
        toast(data.message || "تعذر نقل الموعد. أعد المحاولة.", "error");
      }
    } catch (err) {
      console.error("Transfer error:", err);
      toast("تعذر الاتصال بالخادم. تحقق من الشبكة.", "error");
    } finally {
      setTransferring(false);
    }
  };

  // ------------------------------------------------------------- derived lists

  // Helper function to determine patient sex
  const getPatientSex = (appointment) => {
    const sex = String(appointment?.sex || '').toLowerCase().trim();

    if (sex == 0 || sex === 'ذكر' || sex === 'm' || sex === 'male') {
      return 'male';
    } else if (sex == 1 || sex === 'أنثى' || sex === 'f' || sex === 'female') {
      return 'female';
    }
    return 'unknown';
  };

  // Get unique days by day_date
  const days = useMemo(() => {
    const daysMap = new Map();
    appointments.forEach(apt => {
      if (apt.day && apt.day.day_date && !daysMap.has(apt.day.day_date)) {
        daysMap.set(apt.day.day_date, apt.day);
      }
    });
    return Array.from(daysMap.values()).sort((a, b) => new Date(a.day_date) - new Date(b.day_date));
  }, [appointments]);

  // Get unique hours
  const hours = useMemo(() => {
    const hoursSet = new Set();
    appointments.forEach(apt => {
      const timeStr = apt.hour?.time || apt.hour?.hour;
      if (timeStr) hoursSet.add(timeStr);
    });
    return Array.from(hoursSet).sort((a, b) => a.localeCompare(b));
  }, [appointments]);

  // Get unique specialties
  const specialties = useMemo(() => {
    const specialtiesMap = new Map();
    appointments.forEach(apt => {
      const specialty = apt.event_specialty?.specialty;
      if (specialty && specialty.id && !specialtiesMap.has(specialty.id)) {
        specialtiesMap.set(specialty.id, specialty);
      }
    });
    return Array.from(specialtiesMap.values());
  }, [appointments]);

  // Group appointments by patient_id
  function getUniquePatients(appointments) {
    const patientMap = new Map();

    appointments.forEach(apt => {
      if (!patientMap.has(apt.patient_id)) {
        patientMap.set(apt.patient_id, {
          primary: apt,
          all: [apt],
          count: 1
        });
      } else {
        const patient = patientMap.get(apt.patient_id);
        patient.all.push(apt);
        patient.count++;

        if (apt.specialty_order > patient.primary.specialty_order) {
          patient.primary = apt;
        }
      }
    });

    return Array.from(patientMap.values()).map(p => ({
      ...p.primary,
      appointment_count: p.count,
      all_appointments: p.all
    }));
  }

  // Every patient (unfiltered): used for the details sheet so it stays live
  const allPatients = useMemo(() => getUniquePatients(appointments), [appointments]);
  const selectedPatient = detailsId === null ? null : allPatients.find((p) => p.patient_id === detailsId) || null;

  // Filters apply to appointments, then rows are grouped per patient
  const filteredAppointments = useMemo(() => {
    let filtered = appointments;
    const q = searchTerm.trim();

    if (q) {
      filtered = filtered.filter(
        (apt) =>
          apt.patient_id?.toString().includes(q) ||
          apt.full_name?.includes(q) ||
          apt.phone?.includes(q)
      );
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter((apt) => apt.status === statusFilter);
    }
    if (specialtyFilter !== "all") {
      filtered = filtered.filter((apt) => apt.event_specialty?.specialty?.id?.toString() === specialtyFilter);
    }
    if (dayFilter !== "all") {
      filtered = filtered.filter((apt) => apt.day?.day_date === dayFilter);
    }
    if (hourFilter !== "all") {
      filtered = filtered.filter((apt) => (apt.hour?.time || apt.hour?.hour) === hourFilter);
    }
    if (sexFilter !== "all") {
      filtered = filtered.filter((apt) => getPatientSex(apt) === sexFilter);
    }
    if (reminderFilter !== "all") {
      filtered = filtered.filter((apt) =>
        reminderFilter === "reminded" ? isTrue(apt.is_reminded) : !isTrue(apt.is_reminded)
      );
    }
    if (evaluatedFilter !== "all") {
      filtered = filtered.filter((apt) =>
        evaluatedFilter === "evaluated" ? isTrue(apt.is_evaluated) : !isTrue(apt.is_evaluated)
      );
    }

    return getUniquePatients(filtered);
  }, [appointments, searchTerm, statusFilter, specialtyFilter, dayFilter, hourFilter, sexFilter, reminderFilter, evaluatedFilter]);

  // Long lists: render the first rows only
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchTerm, statusFilter, specialtyFilter, dayFilter, hourFilter, sexFilter, reminderFilter, evaluatedFilter]);

  // Same counting rules as every other statistics screen (utils/visitStatus.js)
  const visitSummary = summarizeVisits(filteredAppointments.flatMap((p) => p.all_appointments || [p]));
  const stats = {
    total: visitSummary.patients_total,
    totalAppointments: visitSummary.total,
    arrived: visitSummary.patients_arrived,
    special: filteredAppointments.filter((a) => a.is_special).length,
    notArrived: visitSummary.patients_total - visitSummary.patients_arrived,
    finished: visitSummary.patients_finished,
    inQueue: visitSummary.in_queue,
  };

  // Patients per status (chip counts)
  const statusCounts = useMemo(() => {
    const sets = {};
    appointments.forEach((apt) => {
      (sets[apt.status] = sets[apt.status] || new Set()).add(apt.patient_id);
    });
    return Object.fromEntries(Object.entries(sets).map(([k, s]) => [k, s.size]));
  }, [appointments]);

  // ------------------------------------------------------------- edit / delete / special

  const startEditing = (appointment) => {
    if (!appointment) return;
    const nameParts = appointment.full_name?.split(' ') || [];
    setEditedData({
      name: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      birthday: appointment.birthday || '',
      state: appointment.state || '',
      city: appointment.city || '',
      diseases: appointment.diseases === 'nothing' ? '' : (appointment.diseases || ''),
      phone: appointment.phone || '',
      phone2: appointment.phone2 || '',
      sex: appointment.sex?.toString() || '0',
    });
    setEditFor(appointment);
  };

  const cancelEditing = useCallback(() => {
    setEditFor(null);
    setEditedData({});
  }, []);

  const saveEditedAppointment = async () => {
    if (!editFor) return;
    setUpdating(true);
    try {
      const res = await fetch(`${apiUrl}/api/appointments/${editFor.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editedData),
      });

      const data = await res.json();

      if (res.ok) {
        toast("حُفظت بيانات المريض");
        await fetchAppointments(true);
        cancelEditing();
      } else {
        toast(data.message || "تعذر حفظ التعديلات. تحقق من الحقول وأعد المحاولة.", "error");
      }
    } catch (err) {
      console.error("Update error:", err);
      toast("تعذر الاتصال بالخادم. تحقق من الشبكة.", "error");
    } finally {
      setUpdating(false);
    }
  };

  const deleteAppointment = async (appointmentId) => {
    setUpdating(true);
    try {
      const res = await fetch(`${apiUrl}/api/appointments/${appointmentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        toast("حُذف الموعد");
        await fetchAppointments(true);
        setAppointmentToDelete(null);
      } else {
        toast(data.message || "تعذر حذف الموعد. أعد المحاولة.", "error");
      }
    } catch (err) {
      console.error("Delete error:", err);
      toast("تعذر الاتصال بالخادم. تحقق من الشبكة.", "error");
    } finally {
      setUpdating(false);
    }
  };

  // Not wired to any button (kept from the previous screen): PATCH /presence
  const updatePresenceStatus = async (appointmentId, status) => {
    setUpdating(true);
    try {
      const res = await fetch(`${apiUrl}/api/appointments/${appointmentId}/presence`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (res.ok) {
        toast("حُدّثت حالة الحضور");
        await fetchAppointments(true);
      } else {
        toast(data.message || "تعذر تحديث حالة الحضور.", "error");
      }
    } catch (err) {
      console.error("Update error:", err);
      toast("تعذر الاتصال بالخادم. تحقق من الشبكة.", "error");
    } finally {
      setUpdating(false);
    }
  };
  void updatePresenceStatus;

  const markAsSpecialCase = async (appointmentId) => {
    setUpdating(true);
    try {
      const res = await fetch(`${apiUrl}/api/waitinglist/Special/${appointmentId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        toast(data.message || "سُجّل المريض حالةً خاصة");
        await fetchAppointments(true);
        return true;
      }
      toast(data.message || "تعذر تسجيل الحالة الخاصة. أعد المحاولة.", "error");
    } catch (err) {
      console.error("Special case error:", err);
      toast("تعذر الاتصال بالخادم. تحقق من الشبكة.", "error");
    } finally {
      setUpdating(false);
    }
    return false;
  };

  // ------------------------------------------------------------- prints & exports
  // Print popups: writePrintDocument + escapeHtml on every interpolated value.

  const handleDownloadPDF = (patientData) => {
    const appointments = patientData.all_appointments || [patientData];
    const primaryAppointment = patientData;

    const printWindow = window.open("", "_blank");
    const eventName = escapeHtml(event?.name || "الحدث");
    const date = new Date().toLocaleDateString("ar-SA");
    const logoUrl = `${window.location.origin}/tagemi_logo.png`;

    const full_name = escapeHtml(primaryAppointment.full_name);
    const birthday = primaryAppointment.birthday
      ? new Date(primaryAppointment.birthday).toLocaleDateString("en-UK")
      : "-";
    const gender = primaryAppointment.sex === '0' || primaryAppointment.sex === 0 ? 'ذكر' : 'أنثى';
    const diseases = escapeHtml(primaryAppointment.diseases && primaryAppointment.diseases !== 'nothing'
      ? primaryAppointment.diseases
      : 'لا يوجد');

    const allMedicalDocs = [];
    appointments.forEach(apt => {
      if (apt.medical_document_urls && apt.medical_document_urls.length > 0) {
        allMedicalDocs.push(...apt.medical_document_urls);
      }
    });

    const appointmentsList = appointments.map(apt => ({
      specialty: escapeHtml(apt.event_specialty?.specialty?.name || "-"),
      date: escapeHtml(apt.day?.day_date || apt.day?.date || "-"),
      time: escapeHtml(apt.hour?.time || apt.hour?.hour || "-")
    }));

    writePrintDocument(printWindow, `
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>تأكيد الحجز - ${full_name}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          @page { size: A4 portrait; margin: 15mm; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; direction: rtl; line-height: 1.4; color: #333; font-size: 12px; }
          .header { text-align: center; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #2563eb; }
          .logo { height: 60px; max-width: 150px; margin: 0 auto 8px; display: block; }
          .header h1 { color: #16a34a; font-size: 22px; margin-bottom: 5px; }
          .header .event-name { color: #1e40af; font-size: 16px; font-weight: bold; margin-bottom: 3px; }
          .header .date { color: #64748b; font-size: 11px; }
          .screenshot-note { background: #fee2e2; border: 2px solid #dc2626; color: #991b1b; padding: 8px; border-radius: 6px; text-align: center; font-weight: bold; margin-bottom: 12px; font-size: 12px; }
          .section { margin-bottom: 12px; background: #f8fafc; padding: 10px; border-radius: 6px; border: 1px solid #e2e8f0; }
          .section-title { font-size: 14px; font-weight: bold; color: #1e40af; margin-bottom: 8px; padding-bottom: 5px; border-bottom: 2px solid #dbeafe; }
          .info-line { display: flex; flex-wrap: wrap; gap: 15px; margin-bottom: 5px; }
          .info-item { display: inline-flex; align-items: center; gap: 5px; }
          .info-label { font-weight: 600; color: #475569; }
          .info-value { color: #1e293b; }
          .divider { color: #cbd5e1; margin: 0 5px; }
          .documents-info { background: #dcfce7; border: 2px solid #16a34a; padding: 8px; border-radius: 6px; text-align: center; color: #166534; font-weight: 600; margin-bottom: 12px; font-size: 12px; }
          .appointments-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 10px; }
          .appointment-card { background: white; padding: 10px; border-radius: 6px; border: 2px solid #3b82f6; }
          .appointment-header { background: #3b82f6; color: white; padding: 5px 10px; border-radius: 4px; margin-bottom: 8px; font-weight: bold; text-align: center; font-size: 12px; }
          .appointment-row { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #e2e8f0; }
          .appointment-row:last-child { border-bottom: none; }
          .appointment-label { color: #64748b; font-size: 11px; }
          .appointment-value { font-weight: 600; color: #1e293b; font-size: 11px; }
          .footer { margin-top: 15px; text-align: center; padding-top: 10px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 10px; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="${logoUrl}" alt="Logo" class="logo" onerror="this.style.display='none'" />
          <h1>✓ تم الحجز بنجاح</h1>
          <div class="event-name">${eventName}</div>
          <div class="date">تاريخ الطباعة: ${date}</div>
        </div>
        <div class="screenshot-note">📸 يرجى حفظ هذا المستند وإحضاره عند الحضور للفحص</div>
        ${allMedicalDocs.length > 0 ? `<div class="documents-info">✓ تم تحميل ${allMedicalDocs.length} مستند طبي بنجاح</div>` : ''}
        <div class="section">
          <div class="section-title">معلومات المريض</div>
          <div class="info-line">
            <div class="info-item"><span class="info-label">الاسم:</span><span class="info-value">${full_name}</span></div>
            <span class="divider">|</span>
            <div class="info-item"><span class="info-label">تاريخ الميلاد:</span><span class="info-value">${birthday}</span></div>
            <span class="divider">|</span>
            <div class="info-item"><span class="info-label">الجنس:</span><span class="info-value">${gender}</span></div>
          </div>
          <div class="info-line">
            <div class="info-item"><span class="info-label">الهاتف:</span><span class="info-value">${escapeHtml(primaryAppointment.phone)}</span></div>
            <span class="divider">|</span>
            <div class="info-item"><span class="info-label">هاتف ثانوي:</span><span class="info-value">${escapeHtml(primaryAppointment.phone2 || "-")}</span></div>
            <span class="divider">|</span>
            <div class="info-item"><span class="info-label">العنوان:</span><span class="info-value">${escapeHtml(primaryAppointment.state)} - ${escapeHtml(primaryAppointment.city)}</span></div>
          </div>
          <div class="info-line">
            <div class="info-item"><span class="info-label">الأمراض المزمنة:</span><span class="info-value">${diseases}</span></div>
          </div>
        </div>
        <div class="section">
          <div class="section-title">تفاصيل المواعيد (${appointmentsList.length})</div>
          <div class="appointments-grid">
            ${appointmentsList.map((apt, index) => `
              <div class="appointment-card">
                ${appointmentsList.length > 1 ? `<div class="appointment-header">الموعد ${index + 1}</div>` : ''}
                <div class="appointment-row"><span class="appointment-label">التخصص:</span><span class="appointment-value">${apt.specialty}</span></div>
                <div class="appointment-row"><span class="appointment-label">التاريخ:</span><span class="appointment-value">${apt.date}</span></div>
                <div class="appointment-row"><span class="appointment-label">الوقت:</span><span class="appointment-value">${apt.time}</span></div>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="footer"><p>تم إصدار هذا المستند في: ${new Date().toLocaleString("ar-DZ")} | نظام إدارة المواعيد © ${new Date().getFullYear()}</p></div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 250);
  };

  const exportBySpecialty = () => {
    const appointmentsBySpecialty = {};

    filteredAppointments.forEach(apt => {
      const specialtyName = apt.event_specialty?.specialty?.name || "غير محدد";
      const specialtyId = apt.event_specialty?.specialty?.id || "unknown";

      if (!appointmentsBySpecialty[specialtyId]) {
        appointmentsBySpecialty[specialtyId] = {
          name: specialtyName,
          appointments: []
        };
      }
      appointmentsBySpecialty[specialtyId].appointments.push(apt);
    });

    const printWindow = window.open("", "_blank");
    const eventName = escapeHtml(event?.name || "الحدث");
    const date = new Date().toLocaleDateString("ar-SA");
    const logoUrl = `${window.location.origin}/tagemi_logo.png`;

    let specialtyPages = "";

    Object.values(appointmentsBySpecialty).forEach((specialty, index) => {
      const visit = summarizeVisits(specialty.appointments);
      const stats = {
        total: visit.total,
        completed: visit.completed,
        in_queue: visit.in_queue,
        pending: visit.pending,
        special: specialty.appointments.filter(a => a.is_special).length,
      };

      specialtyPages += `
        <div class="page" style="${index > 0 ? 'page-break-before: always;' : ''}">
          <div class="specialty-header">
            <img src="${logoUrl}" alt="Logo" class="header-logo" />
            <h2>${escapeHtml(specialty.name)}</h2>
            <p>الحدث: ${eventName} | التاريخ: ${date}</p>
          </div>
          
          <div class="stats-row">
            <div class="stat-item">
              <span class="stat-label">إجمالي</span>
              <span class="stat-value">${stats.total}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">أنهى الفحص</span>
              <span class="stat-value">${stats.completed}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">في الطابور</span>
              <span class="stat-value">${stats.in_queue}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">لم يحضر بعد</span>
              <span class="stat-value">${stats.pending}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">حالة خاصة</span>
              <span class="stat-value">${stats.special}</span>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>رقم المريض</th>
                <th>الاسم الكامل</th>
                <th>اليوم</th>
                <th>الساعة</th>
                <th>رقم الهاتف</th>
                <th>الحالة</th>
                <th style="width: 80px;">ملاحظات</th>
              </tr>
            </thead>
            <tbody>
              ${specialty.appointments
          .map(
            (apt) => `
                <tr>
                  <td>${escapeHtml(apt.patient_id || "-")}</td>
                  <td>${escapeHtml(apt.full_name || "-")}${apt.is_special ? ' ⭐' : ''}</td>
                  <td>${escapeHtml(apt.day?.day_date || "-")}</td>
                  <td>${escapeHtml(apt.hour?.time || apt.hour?.hour || "-")}</td>
                  <td>${escapeHtml(apt.phone || "-")}</td>
                  <td>
                    <span class="status status-${apt.is_special ? 'special' : escapeHtml(apt.status?.toLowerCase() || "pending")}">
                      ${apt.is_special
                ? "حالة خاصة"
                : apt.status === "Present"
                  ? "حاضر"
                  : apt.status === "Waiting"
                    ? "في الانتظار"
                    : apt.status === "Completed"
                      ? "مكتمل"
                      : "قيد الانتظار"
              }
                    </span>
                  </td>
                  <td style="border-left: 1px solid #e2e8f0;"></td>
                </tr>
              `
          )
          .join("")}
            </tbody>
          </table>
        </div>
      `;
    });

    writePrintDocument(printWindow, `
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>قائمة المواعيد حسب التخصص - ${eventName}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            padding: 20px;
            direction: rtl;
          }
          .page {
            margin-bottom: 40px;
          }
          .specialty-header {
            text-align: center;
            margin-bottom: 20px;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 10px;
            position: relative;
          }
          .header-logo {
            height: 50px;
            margin-bottom: 10px;
            background: white;
            padding: 5px;
            border-radius: 8px;
          }
          .specialty-header h2 {
            font-size: 28px;
            margin-bottom: 8px;
          }
          .specialty-header p {
            font-size: 14px;
            opacity: 0.9;
          }
          .stats-row {
            display: flex;
            justify-content: space-around;
            margin-bottom: 20px;
            gap: 10px;
          }
          .stat-item {
            background: #f8fafc;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            flex: 1;
            border: 2px solid #e2e8f0;
          }
          .stat-label {
            display: block;
            font-size: 12px;
            color: #64748b;
            margin-bottom: 5px;
          }
          .stat-value {
            display: block;
            font-size: 24px;
            font-weight: bold;
            color: #1e40af;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          th, td {
            border: 1px solid #e2e8f0;
            padding: 10px;
            text-align: right;
            font-size: 13px;
          }
          th {
            background-color: #2563eb;
            color: white;
            font-weight: bold;
          }
          tr:nth-child(even) {
            background-color: #f8fafc;
          }
          .status {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: bold;
            display: inline-block;
          }
          .status-present { background-color: #dcfce7; color: #166534; }
          .status-absent { background-color: #fee2e2; color: #991b1b; }
          .status-pending { background-color: #fef3c7; color: #92400e; }
          .status-special { background-color: #f3e8ff; color: #6b21a8; }
          .status-waiting { background-color: #dbeafe; color: #1e40af; }
          .status-completed { background-color: #f1f5f9; color: #475569; }
          @media print {
            body { padding: 10px; }
            .page { page-break-after: always; }
            .page:last-child { page-break-after: auto; }
          }
        </style>
      </head>
      <body>
        ${specialtyPages}
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  // printWindow: pass one opened during the click when printing after a request
  const printPatientCard = (appointment, printWindow = window.open("", "_blank")) => {
    if (!printWindow) {
      toast("المتصفح منع نافذة الطباعة. اسمح بالنوافذ المنبثقة لهذا الموقع.", "error");
      return;
    }
    const eventName = escapeHtml(event?.name || "الحدث");
    const patientAppts = appointment.all_appointments || [appointment];
    const logoUrl = `${window.location.origin}/tagemi_logo.png`;

    const fullName = escapeHtml(appointment.full_name || "-");
    const birthday = appointment.birthday
      ? new Date(appointment.birthday).toLocaleDateString('en-UK')
      : "-";
    const gender = appointment.sex == '0' ? 'ذكر' : appointment.sex == '1' ? 'أنثى' : '-';
    const diseases = escapeHtml(appointment.diseases && appointment.diseases !== 'nothing' ? appointment.diseases : "لا يوجد");
    // A5 landscape: rows shrink with the number of specialties so the table fits under the info
    const rowHeight = Math.max(7, Math.min(14, Math.floor(58 / Math.max(1, patientAppts.length))));
    // Same payload as PatientQRCode, so the presence/queue scanners can read the card
    const qrSvg = appointment.patient_id
      ? renderToStaticMarkup(
          <QRCodeSVG value={`patient_id:${appointment.patient_id}`} size={256} level="H" includeMargin={false} />
        )
      : "";

    writePrintDocument(printWindow, `
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>بطاقة المريض - ${fullName}</title>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap">
        <style>
          * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
          }
          @page {
            size: A5 landscape;
            margin: 0;
          }
          body, table, th, td {
            font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif;
            direction: rtl;
            width: 210mm;
            height: 148mm;
            margin: 0;
            padding: 0;
            background: white;
          }
          .card {
            width: 100%;
            height: 100%;
            padding: 6mm;
            display: flex;
            flex-direction: column;
          }
          .header {
            display: flex;
            align-items: center;
            gap: 4mm;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 2mm;
            margin-bottom: 3mm;
          }
          .brand {
            display: flex;
            align-items: center;
            gap: 3mm;
          }
          .logo {
            height: 13mm;
            max-width: 48mm;
            display: block;
          }
          .event-name {
            flex: 1;
            text-align: center;
            font-size: 15px;
            font-weight: bold;
            color: #1e40af;
          }
          .card-title {
            font-size: 17px;
            font-weight: 800;
            color: #1e40af;
            white-space: nowrap;
          }
          .content {
            display: flex;
            gap: 6mm;
            flex: 1;
            overflow: hidden;
          }
          .right-side {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 3mm;
            min-width: 0;
          }
          .qr-section {
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .qr-code svg {
            width: 44mm;
            height: 44mm;
            display: block;
          }
          .qr-patient-id {
            font-size: 24px;
            font-weight: bold;
            color: #1e40af;
            margin-top: 2mm;
          }
          .left-side {
            width: 58mm;
            flex: none;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid #e2e8f0;
            border-radius: 6px;
          }
          .section {
            background: #f8fafc;
            padding: 2.5mm;
            border-radius: 6px;
            border: 2px solid #e2e8f0;
          }
          .section-title {
            font-size: 12px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 2mm;
            padding: 1.5mm;
            background: #dbeafe;
            border-radius: 4px;
            text-align: center;
          }
          .info-line {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1.5mm 6mm;
            font-size: 13px;
            line-height: 1.3;
          }
          .info-item {
            display: flex;
            align-items: baseline;
            gap: 2mm;
            min-width: 0;
          }
          .info-label {
            font-weight: bold;
            color: #475569;
            white-space: nowrap;
          }
          .info-value {
            color: #1e40af;
            font-weight: 600;
          }
          .appointments-section {
            flex: 1;
            display: flex;
            flex-direction: column;
          }
          .table-wrapper {
            overflow: hidden;
          }
          .checklist {
            width: 100%;
            border-collapse: collapse;
          }
          .checklist th,
          .checklist td {
            border: 2px solid #475569;
            padding: 2mm;
            text-align: center;
            font-size: 10px;
          }
          .checklist th {
            padding: 1.2mm 2mm;
            background-color: #2563eb;
            color: white;
            font-weight: bold;
          }
          .checklist tr:nth-child(even) {
            background-color: #f8fafc;
          }
          .checkbox-cell {
            width: 24mm;
            height: ${rowHeight}mm;
          }
          .specialty-name {
            text-align: right;
            font-weight: 200;
            padding-right: 1mm !important;
          }
          .footer {
            text-align: center;
            font-size: 8px;
            color: #64748b;
            padding-top: 2mm;
            border-top: 1px solid #e2e8f0;
            margin-top: 3mm;
          }
          @media print {
            body { 
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <div class="brand">
              <img src="${logoUrl}" alt="Tagemi" class="logo" />
              <div class="card-title">بطاقة المتابعة</div>
            </div>
            <div class="event-name">${eventName}</div>
          </div>

          <div class="content">
            <div class="right-side">
              <div class="section">
                <div class="section-title">المعلومات الشخصية</div>
                <div class="info-line">
                  <div class="info-item">
                    <span class="info-label">الاسم:</span>
                    <span class="info-value">${fullName}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">تاريخ الميلاد:</span>
                    <span class="info-value">${birthday}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">الجنس:</span>
                    <span class="info-value">${gender}</span>
                  </div>
                  <div class="info-item" style="grid-column: 1 / -1">
                    <span class="info-label">الأمراض المزمنة:</span>
                    <span class="info-value">${diseases}</span>
                  </div>
                </div>
              </div>
              <div class="appointments-section">
                <div class="table-wrapper">
                  <table class="checklist">
                    <thead>
                      <tr>
                        <th>التخصص</th>
                        <th>القاعة الكبيرة</th>
                        <th>اجتاز</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${patientAppts.map(apt => `
                        <tr>
                          <td class="specialty-name">${escapeHtml(apt.event_specialty?.specialty?.name || "-")}</td>
                          <td class="checkbox-cell"></td>
                          <td class="checkbox-cell"></td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div class="left-side">
              ${qrSvg ? `
              <div class="qr-section">
                <div class="qr-code">${qrSvg}</div>
                <div class="qr-patient-id">#${escapeHtml(appointment.patient_id)}</div>
              </div>` : ''}
            </div>
          </div>

          <div class="footer">
            <p>تاريخ الطباعة: ${new Date().toLocaleDateString("en-UK")} | نظام إدارة المواعيد © ${new Date().getFullYear()}</p>
          </div>
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    // Print once Cairo and the logo are in, so the card never prints with fallbacks
    const doc = printWindow.document;
    const loaded = (el) => new Promise((resolve) => { el.onload = el.onerror = resolve; });
    const fontCss = doc.querySelector('link[rel="stylesheet"]');
    const fontsReady = (fontCss?.sheet ? Promise.resolve() : loaded(fontCss))
      .then(() => doc.fonts?.load("700 16px Cairo"))
      .then(() => doc.fonts?.ready);
    const logoReady = Array.from(doc.images).map((img) => (img.complete ? null : loaded(img)));
    const ready = Promise.all([fontsReady, ...logoReady]);
    const timeout = new Promise((resolve) => setTimeout(resolve, 3000));
    Promise.race([ready, timeout]).then(() => printWindow.print());
  };

  const exportToPDF = () => {
    const printWindow = window.open("", "_blank");
    const eventName = escapeHtml(event?.name || "الحدث");
    const date = new Date().toLocaleDateString("ar-SA");

    writePrintDocument(printWindow, `
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>قائمة المواعيد - ${eventName}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            padding: 20px;
            direction: rtl;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
          }
          .header h1 {
            color: #1e40af;
            font-size: 28px;
            margin-bottom: 10px;
          }
          .header p {
            color: #64748b;
            font-size: 14px;
          }
          .stats {
            display: flex;
            justify-content: space-around;
            margin-bottom: 20px;
            gap: 10px;
          }
          .stat-box {
            background: #f1f5f9;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            flex: 1;
          }
          .stat-box .number {
            font-size: 24px;
            font-weight: bold;
            color: #1e40af;
          }
          .stat-box .label {
            font-size: 12px;
            color: #64748b;
            margin-top: 5px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            border: 1px solid #e2e8f0;
            padding: 12px;
            text-align: right;
          }
          th {
            background-color: #2563eb;
            color: white;
            font-weight: bold;
          }
          tr:nth-child(even) {
            background-color: #f8fafc;
          }
          .status {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
          }
          .status-present { background-color: #dcfce7; color: #166534; }
          .status-absent { background-color: #fee2e2; color: #991b1b; }
          .status-pending { background-color: #fef3c7; color: #92400e; }
          .status-special { background-color: #f3e8ff; color: #6b21a8; }
          .footer {
            margin-top: 30px;
            text-align: center;
            color: #64748b;
            font-size: 12px;
            border-top: 2px solid #e2e8f0;
            padding-top: 20px;
          }
          @media print {
            body { padding: 10px; }
            .header h1 { font-size: 24px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>قائمة المواعيد - ${eventName}</h1>
          <p>تاريخ الطباعة: ${date}</p>
        </div>
        
        <div class="stats">
          <div class="stat-box">
            <div class="number">${filteredAppointments.length}</div>
            <div class="label">إجمالي المواعيد</div>
          </div>
          <div class="stat-box">
            <div class="number">${visitSummary.patients_arrived}</div>
            <div class="label">مرضى حضروا</div>
          </div>
          <div class="stat-box">
            <div class="number">${visitSummary.patients_finished}</div>
            <div class="label">أنهوا كل الفحوص</div>
          </div>
          <div class="stat-box">
            <div class="number">${visitSummary.patients_total - visitSummary.patients_arrived}</div>
            <div class="label">لم يحضروا بعد</div>
          </div>
          <div class="stat-box">
            <div class="number">${filteredAppointments.filter(a => a.is_special === true || a.is_special === 1).length}</div>
            <div class="label">حالة خاصة</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>رقم المريض</th>
              <th>الاسم الكامل</th>
              <th>التخصص</th>
              <th>اليوم</th>
              <th>الساعة</th>
              <th>رقم الهاتف</th>
              <th>الحالة</th>
            </tr>
          </thead>
          <tbody>
            ${filteredAppointments
        .map(
          (apt) => `
              <tr>
                <td>${escapeHtml(apt.patient_id || "-")}</td>
                <td>${escapeHtml(apt.full_name || "-")}${apt.is_special ? ' ⭐' : ''}</td>
                <td>${escapeHtml(apt.event_specialty?.specialty?.name || "-")}</td>
                <td>${escapeHtml(apt.day?.day_date || "-")}</td>
                <td>${escapeHtml(apt.hour?.time || apt.hour?.hour || "-")}</td>
                <td>${escapeHtml(apt.phone || "-")}</td>
                <td>
                  <span class="status status-${apt.is_special ? 'special' : escapeHtml(apt.status?.toLowerCase() || "pending")}">
                    ${apt.is_special
              ? "حالة خاصة"
              : apt.status === "Present"
                ? "حاضر"
                : apt.status === "Waiting"
                  ? "في الانتظار"
                  : apt.status === "Completed"
                    ? "مكتمل"
                    : "قيد الانتظار"
            }
                  </span>
                </td>
              </tr>
            `
        )
        .join("")}
          </tbody>
        </table>

        <div class="footer">
          <p>تم إنشاء هذا التقرير بواسطة نظام إدارة المواعيد</p>
          <p>جميع الحقوق محفوظة © ${new Date().getFullYear()}</p>
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const handleDownloadCSV = () => {
    // CSV follows the specialty filter: one specialty, or all of them
    const downloadSpecialtyFilter = specialtyFilter;
    let appointmentsToExport = appointments;

    if (downloadSpecialtyFilter !== "all") {
      appointmentsToExport = appointments.filter(
        (apt) => apt.event_specialty?.specialty?.id?.toString() === downloadSpecialtyFilter
      );
    }

    if (appointmentsToExport.length === 0) {
      toast("لا توجد مواعيد للتصدير.", "error");
      return;
    }

    const headers = [
      'رقم المريض',
      'الاسم الكامل',
      'التخصص',
      'اليوم',
      'الساعة',
      'الحالة',
      'تاريخ الميلاد',
      'الهاتف',
      'هاتف ثانوي',
      'الولاية',
      'البلدية',
      'الجنس',
      'الأمراض',
      'حالة خاصة',
      'تم التذكير'
    ];

    const csvRows = appointmentsToExport.map(appointment => {
      const status = appointment.is_special
        ? 'حالة خاصة'
        : statusLabel(appointment.status);
      const birthday = appointment.birthday
        ? new Date(appointment.birthday).toLocaleDateString('en-UK')
        : '-';
      const sex = appointment.sex === '0' || appointment.sex === 0 ? 'ذكر' : 'أنثى';
      const diseases = appointment.diseases && appointment.diseases !== 'nothing'
        ? appointment.diseases
        : '-';
      const isSpecial = appointment.is_special ? 'نعم' : 'لا';
      const isReminded = appointment.is_reminded ? 'نعم' : 'لا';

      return [
        appointment.patient_id || '-',
        appointment.full_name || '-',
        appointment.event_specialty?.specialty?.name || '-',
        appointment.day?.day_date || appointment.day?.date || '-',
        appointment.hour?.time || appointment.hour?.hour || '-',
        status,
        birthday,
        appointment.phone || '-',
        appointment.phone2 || '-',
        appointment.state || '-',
        appointment.city || '-',
        sex,
        diseases,
        isSpecial,
        isReminded
      ];
    });

    const BOM = '﻿';
    const csvContent = [
      headers.join(','),
      ...csvRows.map(row => row.map(cell => {
        const cellStr = csvSafe(cell).replace(/"/g, '""');
        return `"${cellStr}"`;
      }).join(','))
    ].join('\n');

    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    const specialtyName = downloadSpecialtyFilter === "all"
      ? "جميع_التخصصات"
      : specialties.find(s => s.id.toString() === downloadSpecialtyFilter)?.name || "تخصص";
    const eventName = event?.name?.replace(/\s+/g, '_') || 'الحدث';
    const filename = `${eventName}_${specialtyName}_${new Date().toLocaleDateString('en-UK').replace(/\//g, '-')}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast(`حُمّل ملف فيه ${appointmentsToExport.length} موعد`);
  };

  // ------------------------------------------------------------- view helpers

  const closeAllSheets = () => {
    setActionsFor(null);
    setDetailsId(null);
  };

  const extraFilterCount = [specialtyFilter, dayFilter, hourFilter, sexFilter, reminderFilter, evaluatedFilter]
    .filter((v) => v !== "all").length;

  const resetExtraFilters = () => {
    setSpecialtyFilter("all");
    setDayFilter("all");
    setHourFilter("all");
    setSexFilter("all");
    setReminderFilter("all");
    setEvaluatedFilter("all");
  };

  const statusOptions = [
    { value: "all", label: "الكل", count: allPatients.length },
    ...Object.keys(STATUS_LABELS).map((key) => ({ value: key, label: STATUS_LABELS[key], count: statusCounts[key] || 0 })),
  ];

  const sexIcon = (p) => {
    const sex = getPatientSex(p);
    return (
      <User
        className={cx('w-3.5 h-3.5 shrink-0', sex === 'female' ? 'text-rose' : sex === 'male' ? 'text-ink-soft' : 'text-muted')}
        aria-label={sex === 'female' ? 'أنثى' : sex === 'male' ? 'ذكر' : 'الجنس غير محدد'}
      />
    );
  };

  /** Rows of the per-patient menu; shared by the ⋮ sheet and the details sheet. */
  const renderPatientActions = (p) => {
    const special = isSpecialPatient(p);
    const checkedIn = hasCheckedIn(p);
    const run = (fn) => () => { closeAllSheets(); fn(); };
    return (
      <div className="divide-y divide-line">
        {/* Check-in and special case live here, not on the row, so a tap while scrolling cannot trigger them */}
        {canCheckIn && !checkedIn && (
          <div className="pb-3">
            <Button size="lg" block icon={Check} disabled={updating} onClick={run(() => checkInAndPrint(p.patient_id))}>
              حاضر، واطبع بطاقة المتابعة
            </Button>
          </div>
        )}
        {canManageSpecial && !special && p.status !== "Completed" && (
          <SheetAction icon={Star} tone="text-rose" hint="يدخل الطابور بأولوية" disabled={updating} onClick={run(() => markAsSpecialCase(p.id))}>
            سجّله حالة خاصة
          </SheetAction>
        )}
        <SheetAction icon={MessageCircle} hint={isTrue(p.is_reminded) ? 'سبق تذكيره، يمكن إعادة الإرسال' : 'يفتح واتساب برسالة فيها مواعيده'} onClick={run(() => sendWhatsAppReminder(p))}>
          أرسل تذكيراً بواتساب
        </SheetAction>
        <SheetAction icon={ClipboardList} hint={isTrue(p.is_evaluated) ? 'سبق إرسال الرابط' : 'رابط استبيان رضا المريض'} onClick={run(() => sendEvaluationLinkViaWhatsApp(p, eventId))}>
          أرسل رابط التقييم
        </SheetAction>
        <SheetAction icon={Pencil} onClick={run(() => startEditing(p))}>عدّل البيانات</SheetAction>
        {canManageSpecial && (
          <SheetAction icon={RefreshCw} hint="ينقل الموعد إلى أقرب موعد متاح في تخصص آخر" onClick={run(() => fetchAvailableSpecialties(p))}>
            غيّر التخصص
          </SheetAction>
        )}
        <SheetAction icon={QrCode} onClick={run(() => setQrFor(p))}>اعرض رمز QR</SheetAction>
        <SheetAction
          icon={Printer}
          disabled={!checkedIn}
          hint={checkedIn ? 'بطاقة فيها التخصصات ورمز QR' : 'سجّل حضوره أولاً'}
          onClick={run(() => printPatientCard(p))}
        >
          اطبع بطاقة المتابعة
        </SheetAction>
        <SheetAction icon={Download} hint="ورقة تأكيد الحجز بكل مواعيده" onClick={run(() => handleDownloadPDF(p))}>
          حمّل ورقة الموعد
        </SheetAction>
        {isAdmin && (
          <SheetAction icon={Trash2} tone="text-red-700" onClick={run(() => setAppointmentToDelete(p))}>
            احذف الموعد
          </SheetAction>
        )}
      </div>
    );
  };

  // ------------------------------------------------------------- view

  if (loading && appointments.length === 0) {
    return <LoadingState label="جاري تحميل المرضى..." />;
  }

  const shownPatients = filteredAppointments.slice(0, visibleCount);
  const editField = (key) => ({
    value: editedData[key] || '',
    onChange: (e) => setEditedData({ ...editedData, [key]: e.target.value }),
  });

  return (
    <div className="max-w-2xl lg:max-w-none mx-auto">
      {isAdmin && (
        <Link to={`/admin/event-tracking/${eventId}`} className="inline-flex items-center gap-1 text-sm text-muted mb-2 min-h-[2.75rem]">
          <ChevronRight className="w-4 h-4" /> متابعة الحدث
        </Link>
      )}

      <PageHeader
        title={role === 3 ? 'الحالات الخاصة' : 'الاستقبال'}
        subtitle={event?.name}
        actions={isAdmin && (
          <IconButton icon={MoreVertical} label="تصدير وطباعة" className="bg-white border border-line" onClick={() => setShowExports(true)} />
        )}
      />

      {/* Laptop: check-in panel in a sticky side column, patients in the rest */}
      <div className="lg:grid lg:grid-cols-[380px_minmax(0,1fr)] xl:grid-cols-[420px_minmax(0,1fr)] lg:gap-6 lg:items-start">
      <aside className="lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
      {/* Patient number: check-in (the main job), print, special case, details */}
      <form onSubmit={(e) => { e.preventDefault(); runNumberAction(mainAction.value); }} className="bg-white border border-line rounded-2xl p-4 mb-4">
          <label htmlFor="checkin-patient-id" className="block text-sm font-semibold text-ink mb-2">رقم المريض</label>
          <div className="flex gap-2">
            <input
              id="checkin-patient-id"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              enterKeyHint="go"
              value={manualPatientId}
              onChange={(e) => setManualPatientId(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="مثلاً 1024"
              className="min-w-0 flex-1 h-14 rounded-xl border border-line bg-white px-4 font-display text-2xl text-ink text-center placeholder:text-muted placeholder:text-base placeholder:font-ui focus:border-ink focus:outline-none"
            />
            <button
              type="button"
              onClick={() => openScanner(mainAction.value)}
              className="shrink-0 h-14 px-4 inline-flex flex-col items-center justify-center gap-0.5 rounded-xl border border-line bg-white text-ink hover:bg-ink-faint"
            >
              <ScanLine className="w-6 h-6" />
              <span className="text-[11px] font-semibold leading-none">مسح QR</span>
            </button>
          </div>
          {/* One tap per action, main one on top; Enter runs the main one */}
          <div className="mt-3 flex flex-col gap-2">
            {numberActions.map((a, k) => (
              <Button
                key={a.value}
                type={k === 0 ? 'submit' : 'button'}
                variant={k === 0 ? 'primary' : 'secondary'}
                size="lg"
                block
                icon={a.icon}
                loading={k === 0 && updating}
                disabled={!manualPatientId || updating}
                onClick={k === 0 ? undefined : () => runNumberAction(a.value)}
                className={k === 0 ? 'h-14 text-base' : undefined}
              >
                {a.label}
              </Button>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted text-center">زر «مسح QR» ينفّذ «{mainAction.label}».</p>
        </form>

      <StatStrip
        className="mb-4 lg:mb-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:mx-0 lg:px-0 lg:pb-0"
        items={[
          { label: `مريض (${stats.totalAppointments} موعد)`, value: stats.total },
          { label: 'حضروا', value: stats.arrived, tone: 'text-st-queue' },
          { label: 'لم يحضروا بعد', value: stats.notArrived, tone: 'text-st-pending' },
          { label: 'أنهوا الفحص', value: stats.finished, tone: 'text-st-done' },
          { label: 'في الطوابير الآن', value: stats.inQueue, tone: 'text-st-queue' },
          stats.special > 0 && { label: 'حالات خاصة', value: stats.special, tone: 'text-rose' },
          { label: `تم تذكيرهم من ${reminderStats.total || 0}`, value: reminderStats.reminded || 0 },
          { label: `رابط التقييم من ${evaluatedStats.total || 0}`, value: evaluatedStats.evaluated || 0 },
        ]}
      />
      </aside>

      <div className="min-w-0">
      {/* Filters */}
      <div className="flex gap-2 mb-3">
        <SearchField value={searchTerm} onChange={setSearchTerm} placeholder="ابحث بالاسم أو الرقم أو الهاتف" className="flex-1 min-w-0" />
        <button
          type="button"
          onClick={() => setShowFilters(true)}
          aria-label="تصفية إضافية"
          className={cx(
            'relative shrink-0 inline-flex items-center justify-center w-12 h-12 rounded-xl border',
            extraFilterCount ? 'bg-ink text-white border-ink' : 'bg-white text-ink border-line hover:bg-ink-faint'
          )}
        >
          <SlidersHorizontal className="w-5 h-5" />
          {extraFilterCount > 0 && (
            <span className="absolute -top-1.5 -end-1.5 min-w-[1.25rem] h-5 px-1 rounded-full bg-white text-ink border border-ink text-[11px] font-bold leading-[1.1rem] text-center">
              {extraFilterCount}
            </span>
          )}
        </button>
      </div>
      <ChipGroup label="تصفية حسب الحالة" value={statusFilter} onChange={setStatusFilter} options={statusOptions} className="mb-3" />

      {(searchTerm || statusFilter !== 'all' || extraFilterCount > 0) && (
        <p className="text-sm text-muted mb-3">{filteredAppointments.length} مريض يطابق التصفية</p>
      )}

      {/* Patients */}
      {loadError && appointments.length === 0 ? (
        <EmptyState title={loadError} action={<Button variant="secondary" icon={RefreshCw} onClick={() => fetchAppointments()}>أعد المحاولة</Button>}>
          تأكد من اتصال الهاتف بالإنترنت.
        </EmptyState>
      ) : filteredAppointments.length === 0 ? (
        <EmptyState icon={Users} title={appointments.length ? 'لا أحد يطابق البحث' : 'لا يوجد مرضى مسجلون بعد'}>
          {appointments.length ? 'جرّب اسماً أو رقماً آخر، أو امسح التصفية.' : 'يظهر المرضى هنا بعد حجزهم من استمارة التسجيل.'}
        </EmptyState>
      ) : (
        <>
          <ul className="space-y-2 2xl:grid 2xl:grid-cols-2 2xl:gap-3 2xl:space-y-0">
            {shownPatients.map((p) => {
              const special = isSpecialPatient(p);
              const docs = patientDocuments(p);
              return (
                <li key={p.patient_id}>
                  <div className={cx('flex items-start gap-1 bg-white border rounded-2xl ps-3 pe-1 py-2', special ? 'border-rose/50' : 'border-line')}>
                    <button type="button" onClick={() => setDetailsId(p.patient_id)} className="flex-1 min-w-0 text-start py-1">
                      <p className="font-semibold text-ink leading-snug truncate">{p.full_name || '-'}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted">
                        <span className="font-semibold text-ink">#{p.patient_id}</span>
                        {sexIcon(p)}
                        <StatusBadge status={p.status} />
                        {special && (
                          <span className="inline-flex items-center gap-1 text-rose font-semibold"><Star className="w-3.5 h-3.5" />حالة خاصة</span>
                        )}
                        {docs.length > 0 && (
                          <span className="inline-flex items-center gap-0.5" aria-label={`${docs.length} مستند طبي`}>
                            <FileText className="w-3.5 h-3.5" />{docs.length}
                          </span>
                        )}
                        {isTrue(p.is_reminded) && (
                          <span className="inline-flex items-center gap-0.5"><MessageCircle className="w-3.5 h-3.5" />ذُكّر</span>
                        )}
                        {isTrue(p.is_evaluated) && (
                          <span className="inline-flex items-center gap-0.5"><CheckCircle2 className="w-3.5 h-3.5" />التقييم</span>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {(p.all_appointments || [p]).map((a) => (
                          <span
                            key={a.id}
                            className="inline-flex items-center gap-1.5 h-6 px-2 rounded-md border border-line text-xs text-ink"
                            title={statusLabel(a.status)}
                          >
                            <span className={cx('w-2 h-2 rounded-full shrink-0', STATUS_DOT[a.status] || STATUS_DOT.Pending)} aria-hidden="true" />
                            {a.event_specialty?.specialty?.name || 'تخصص'}
                            <span className="sr-only">{statusLabel(a.status)}</span>
                          </span>
                        ))}
                      </div>
                    </button>
                    <div className="shrink-0 flex items-center gap-1 self-center">
                      <IconButton icon={MoreVertical} label={`خيارات المريض ${p.patient_id}`} onClick={() => setActionsFor(p)} />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          {filteredAppointments.length > visibleCount && (
            <Button variant="secondary" block className="mt-3" onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}>
              عرض المزيد ({filteredAppointments.length - visibleCount} متبقٍ)
            </Button>
          )}
        </>
      )}
      </div>
      </div>

      {/* ⋮ per patient */}
      <Sheet open={!!actionsFor} onClose={closeActions} title={actionsFor ? `#${actionsFor.patient_id} ${actionsFor.full_name || ''}` : ''}>
        {actionsFor && renderPatientActions(actionsFor)}
      </Sheet>

      {/* Patient details */}
      <Sheet
        size="lg"
        open={!!selectedPatient}
        onClose={closeDetails}
        title={selectedPatient ? `#${selectedPatient.patient_id} ${selectedPatient.full_name || ''}` : ''}
        // After a scan: the main action, always visible without scrolling (confirm presence, or print)
        footer={selectedPatient && canCheckIn && (hasCheckedIn(selectedPatient) ? (
          <Button size="lg" block variant="secondary" icon={Printer} onClick={() => printPatientCard(selectedPatient)}>
            اطبع بطاقة المتابعة
          </Button>
        ) : (
          <Button size="lg" block icon={Check} disabled={updating} onClick={() => { const id = selectedPatient.patient_id; closeAllSheets(); checkInAndPrint(id); }}>
            أكّد الحضور واطبع بطاقة المتابعة
          </Button>
        ))}
      >
        {selectedPatient && (
          <div className="space-y-5">
            {isSpecialPatient(selectedPatient) && (
              <p className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-rose-soft text-rose text-sm font-semibold">
                <Star className="w-4 h-4" /> حالة خاصة
              </p>
            )}
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-muted">الجنس</dt><dd className="font-semibold">{getPatientSex(selectedPatient) === 'female' ? 'أنثى' : getPatientSex(selectedPatient) === 'male' ? 'ذكر' : '-'}</dd></div>
              <div><dt className="text-muted">تاريخ الميلاد</dt><dd className="font-semibold">{selectedPatient.birthday ? new Date(selectedPatient.birthday).toLocaleDateString("en-GB") : '-'}</dd></div>
              <div><dt className="text-muted">الهاتف</dt><dd className="font-semibold" dir="ltr">{selectedPatient.phone || '-'}</dd></div>
              <div><dt className="text-muted">هاتف ثانوي</dt><dd className="font-semibold" dir="ltr">{selectedPatient.phone2 || '-'}</dd></div>
              <div className="col-span-2"><dt className="text-muted">الإقامة</dt><dd className="font-semibold">{[selectedPatient.state, selectedPatient.city].filter(Boolean).join('، ') || '-'}</dd></div>
              <div className="col-span-2"><dt className="text-muted">الأمراض المزمنة</dt><dd className="font-semibold">{selectedPatient.diseases && selectedPatient.diseases !== 'nothing' ? selectedPatient.diseases : 'لا يوجد'}</dd></div>
            </dl>

            <section>
              <h3 className="font-semibold text-ink mb-2">المواعيد ({(selectedPatient.all_appointments || []).length})</h3>
              <ul className="space-y-2">
                {(selectedPatient.all_appointments || [selectedPatient]).map((apt) => (
                  <li key={apt.id} className={cx('rounded-xl border p-3', isTrue(apt.is_special) ? 'border-rose/50' : 'border-line')}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold flex items-center gap-1.5 min-w-0">
                        <Stethoscope className="w-4 h-4 shrink-0 text-ink-soft" />
                        <span className="truncate">{apt.event_specialty?.specialty?.name || '-'}</span>
                      </span>
                      <StatusBadge status={apt.status} />
                    </div>
                    <p className="text-xs text-muted mt-1">
                      يوم {aptDay(apt)}، الساعة {aptHour(apt)}
                    </p>
                    {(canManageSpecial || isAdmin) && (
                      <div className="flex gap-2 mt-2">
                        {canManageSpecial && (
                          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={() => { setDetailsId(null); fetchAvailableSpecialties(apt); }}>
                            غيّر التخصص
                          </Button>
                        )}
                        {isAdmin && (
                          <Button variant="danger" size="sm" icon={Trash2} disabled={updating} onClick={() => { setDetailsId(null); setAppointmentToDelete(apt); }}>
                            احذف
                          </Button>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </section>

            <AppointmentDocuments
              appointment={{ ...selectedPatient, medical_document_urls: patientDocuments(selectedPatient) }}
              allowDownload={isAdmin}
            />

            <PatientQRSection appointment={selectedPatient} />

            <section>
              <h3 className="font-semibold text-ink mb-1">إجراءات</h3>
              {renderPatientActions(selectedPatient)}
            </section>
          </div>
        )}
      </Sheet>

      {/* QR of a patient */}
      <Sheet open={!!qrFor} onClose={closeQr} title="رمز QR للمريض">
        {qrFor && <PatientQRSection appointment={qrFor} />}
      </Sheet>

      {/* Edit patient data */}
      <Sheet
        open={!!editFor}
        onClose={cancelEditing}
        title={editFor ? `تعديل بيانات #${editFor.patient_id}` : ''}
        footer={
          <>
            <Button size="lg" className="flex-1" icon={Check} loading={updating} onClick={saveEditedAppointment}>احفظ التغييرات</Button>
            <Button size="lg" variant="secondary" disabled={updating} onClick={cancelEditing}>إلغاء</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="الاسم"><TextInput type="text" {...editField('name')} /></Field>
          <Field label="اللقب"><TextInput type="text" {...editField('lastName')} /></Field>
          <Field label="تاريخ الميلاد"><TextInput type="date" {...editField('birthday')} /></Field>
          <Field label="الجنس">
            <SelectInput value={editedData.sex || '0'} onChange={(e) => setEditedData({ ...editedData, sex: e.target.value })}>
              <option value="0">ذكر</option>
              <option value="1">أنثى</option>
            </SelectInput>
          </Field>
          <Field label="الولاية"><TextInput type="text" {...editField('state')} /></Field>
          <Field label="البلدية"><TextInput type="text" {...editField('city')} /></Field>
          <Field label="رقم الهاتف"><TextInput type="tel" inputMode="tel" dir="ltr" {...editField('phone')} /></Field>
          <Field label="رقم هاتف ثانوي"><TextInput type="tel" inputMode="tel" dir="ltr" {...editField('phone2')} /></Field>
          <Field label="الأمراض المزمنة" hint="اتركه فارغاً إن لم يكن له مرض مزمن" className="sm:col-span-2">
            <textarea
              rows={3}
              {...editField('diseases')}
              className="w-full rounded-xl border border-line bg-white p-3 text-base text-ink focus:border-ink focus:outline-none"
            />
          </Field>
        </div>
      </Sheet>

      {/* Delete confirmation */}
      <Sheet
        open={!!appointmentToDelete}
        onClose={closeDelete}
        title="حذف الموعد"
        footer={appointmentToDelete && (
          <>
            <Button size="lg" variant="danger" className="flex-1" icon={Trash2} loading={updating} onClick={() => deleteAppointment(appointmentToDelete.id)}>
              احذف الموعد
            </Button>
            <Button size="lg" variant="secondary" disabled={updating} onClick={() => setAppointmentToDelete(null)}>إلغاء</Button>
          </>
        )}
      >
        {appointmentToDelete && (
          <>
            <dl className="rounded-xl border border-line p-3 space-y-1.5 text-sm">
              <div className="flex justify-between gap-2"><dt className="text-muted">المريض</dt><dd className="font-semibold">#{appointmentToDelete.patient_id}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-muted">الاسم</dt><dd className="font-semibold truncate">{appointmentToDelete.full_name}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-muted">التخصص</dt><dd className="font-semibold truncate">{appointmentToDelete.event_specialty?.specialty?.name || '-'}</dd></div>
            </dl>
            <p className="mt-3 text-sm text-red-700">لا يمكن التراجع عن الحذف. مواعيد المريض الأخرى تبقى كما هي.</p>
          </>
        )}
      </Sheet>

      {/* Change specialty */}
      <Sheet
        open={!!transferFor}
        onClose={closeTransfer}
        title="تغيير التخصص"
        footer={availableSpecialties?.length > 0 && (
          <Button size="lg" block icon={RefreshCw} loading={transferring} disabled={!selectedTransferSpecialty} onClick={transferSpecialty}>
            انقل الموعد
          </Button>
        )}
      >
        {transferFor && (
          <>
            <p className="text-sm text-muted mb-3">
              موعد #{transferFor.patient_id} في {transferFor.event_specialty?.specialty?.name || 'تخصصه الحالي'} ينتقل إلى أقرب موعد متاح في التخصص المختار.
            </p>
            {availableSpecialties === null ? <LoadingState /> : availableSpecialties.length === 0 ? (
              <EmptyState title="لا يوجد تخصص متاح">كل التخصصات الأخرى ممتلئة أو محجوزة لهذا المريض.</EmptyState>
            ) : (
              <div role="radiogroup" aria-label="التخصص الجديد" className="space-y-2">
                {availableSpecialties.map((specialty) => {
                  const active = selectedTransferSpecialty?.event_specialty_id === specialty.event_specialty_id;
                  return (
                    <button
                      key={specialty.event_specialty_id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setSelectedTransferSpecialty(specialty)}
                      className={cx('w-full text-start rounded-xl border p-3 min-h-[3.25rem]', active ? 'border-ink ring-2 ring-ink' : 'border-line hover:bg-ink-faint')}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="font-semibold">{specialty.specialty_name}</span>
                        {active && <Check className="w-5 h-5" />}
                      </span>
                      {specialty.closest_slot && (
                        <span className="block text-xs text-muted mt-1">
                          أقرب موعد {new Date(specialty.closest_slot.day_date).toLocaleDateString("ar-DZ")} الساعة {specialty.closest_slot.time}، {specialty.total_available_slots} موعد متاح
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </Sheet>

      {/* More filters */}
      <Sheet
        open={showFilters}
        onClose={closeFilters}
        title="تصفية إضافية"
        footer={
          <>
            <Button size="lg" className="flex-1" onClick={() => setShowFilters(false)}>اعرض {filteredAppointments.length} مريض</Button>
            <Button size="lg" variant="secondary" disabled={!extraFilterCount} onClick={resetExtraFilters}>امسح التصفية</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="التخصص">
            <SelectInput value={specialtyFilter} onChange={(e) => setSpecialtyFilter(e.target.value)}>
              <option value="all">كل التخصصات</option>
              {specialties.map((s) => <option key={s.id} value={s.id.toString()}>{s.name}</option>)}
            </SelectInput>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="اليوم">
              <SelectInput value={dayFilter} onChange={(e) => setDayFilter(e.target.value)}>
                <option value="all">كل الأيام</option>
                {days.map((d) => <option key={d.day_date} value={d.day_date}>{new Date(d.day_date).toLocaleDateString("ar-DZ")}</option>)}
              </SelectInput>
            </Field>
            <Field label="الساعة">
              <SelectInput value={hourFilter} onChange={(e) => setHourFilter(e.target.value)}>
                <option value="all">كل الساعات</option>
                {hours.map((h) => <option key={h} value={h}>{h}</option>)}
              </SelectInput>
            </Field>
          </div>
          <div>
            <p className="mb-1.5 text-sm font-semibold text-ink">الجنس</p>
            <ChipGroup label="الجنس" value={sexFilter} onChange={setSexFilter} options={[
              { value: 'all', label: 'الجميع' },
              { value: 'male', label: 'ذكور' },
              { value: 'female', label: 'إناث' },
            ]} />
          </div>
          <div>
            <p className="mb-1.5 text-sm font-semibold text-ink">التذكير بواتساب</p>
            <ChipGroup label="التذكير" value={reminderFilter} onChange={setReminderFilter} options={[
              { value: 'all', label: 'الجميع' },
              { value: 'reminded', label: 'تم تذكيرهم' },
              { value: 'not_reminded', label: 'لم يُذكَّروا' },
            ]} />
          </div>
          <div>
            <p className="mb-1.5 text-sm font-semibold text-ink">رابط التقييم</p>
            <ChipGroup label="رابط التقييم" value={evaluatedFilter} onChange={setEvaluatedFilter} options={[
              { value: 'all', label: 'الجميع' },
              { value: 'evaluated', label: 'أُرسل' },
              { value: 'not_evaluated', label: 'لم يُرسل' },
            ]} />
          </div>
        </div>
      </Sheet>

      {/* Exports and prints (super admin) */}
      {isAdmin && (
        <Sheet open={showExports} onClose={closeExports} title="تصدير وطباعة">
          <div className="divide-y divide-line">
            <SheetAction
              icon={Download}
              disabled={appointments.length === 0}
              hint={specialtyFilter === 'all' ? 'كل المواعيد، كل التخصصات' : `مواعيد ${specialties.find((s) => s.id.toString() === specialtyFilter)?.name || 'التخصص المختار'} فقط`}
              onClick={() => { setShowExports(false); handleDownloadCSV(); }}
            >
              حمّل ملف CSV
            </SheetAction>
            <SheetAction icon={Stethoscope} hint="صفحة لكل تخصص، حسب التصفية الحالية" disabled={filteredAppointments.length === 0} onClick={() => { setShowExports(false); exportBySpecialty(); }}>
              اطبع القوائم حسب التخصص
            </SheetAction>
            <SheetAction icon={Printer} hint="قائمة واحدة، حسب التصفية الحالية" disabled={filteredAppointments.length === 0} onClick={() => { setShowExports(false); exportToPDF(); }}>
              اطبع قائمة المواعيد
            </SheetAction>
          </div>
        </Sheet>
      )}

      {showQRScanner && (
        <QRScanner
          onScanSuccess={handleQRScanSuccess}
          onClose={closeScanner}
          eventId={eventId}
          actionTitle={
            scanAction === 'present' ? 'امسح رمز المريض: تظهر معلوماته ثم أكّد حضوره' :
              scanAction === 'print' ? 'امسح رمز المريض لطباعة بطاقته' :
              scanAction === 'special' ? 'امسح رمز المريض لتسجيله حالة خاصة' :
                scanAction === 'details' ? 'امسح رمز المريض لعرض تفاصيله' :
                  'امسح رمز QR'
          }
        />
      )}
    </div>
  );
};

export default CheckPresence;
