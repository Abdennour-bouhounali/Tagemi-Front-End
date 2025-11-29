import React, { useState, useEffect, useContext, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { AppContext } from "../../../Context/AppContext";

import {
  Search,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  Phone,
  MapPin,
  Clock,
  AlertCircle,
  ArrowLeft,
  CheckCheck,
  Printer,
  Filter,
  RefreshCw,
  Eye,
  X,
  Star,
  Stethoscope,
  FileText,
  Download,
  Edit,
  Save,
  Trash2,
  Users,
  MoreVertical,
  ChevronDown,
  Menu,
  MessageCircle,
} from "lucide-react";
import { Select, Input } from '../../Common/FormInputs';
import AppointmentDocuments from '../SuperAdmin/AppointmentDocuments';

const apiUrl = import.meta.env.VITE_API_URL;

const CheckPresence = () => {
  const { eventId } = useParams();
  const { token, user } = useContext(AppContext);
  const [downloadSpecialtyFilter, setDownloadSpecialtyFilter] = useState("all");

  // State management
  const [event, setEvent] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [patientAllAppointments, setPatientAllAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [specialtyFilter, setSpecialtyFilter] = useState("all");
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [dayFilter, setDayFilter] = useState("all");
  const [sexFilter, setSexFilter] = useState("all");
  const [hourFilter, setHourFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [reminderFilter, setReminderFilter] = useState("all"); // NEW: Reminder filter

  // Edit mode states
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({});

  // Delete confirmation states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState(null);

  // Transfer specialty states
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [availableSpecialties, setAvailableSpecialties] = useState([]);
  const [selectedTransferSpecialty, setSelectedTransferSpecialty] = useState(null);
  const [transferring, setTransferring] = useState(false);

  // Mobile action menu state
  const [activeActionMenu, setActiveActionMenu] = useState(null);
  const [menuPosition, setMenuPosition] = useState('bottom');

  // NEW: Reminder stats state
  const [reminderStats, setReminderStats] = useState({ total: 0, reminded: 0, not_reminded: 0 });

  // NEW: Fetch reminder statistics
  const fetchReminderStats = async () => {
    try {
      const res = await fetch(
        `${apiUrl}/api/appointments/reminder-stats/${eventId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();

      if (res.ok && data.stats) {
        setReminderStats(data.stats);
      }
    } catch (err) {
      console.error("Error fetching reminder stats:", err);
    }
  };

  // NEW: Updated sendWhatsAppReminder with database update
  // تحديث دالة sendWhatsAppReminder
  const sendWhatsAppReminder = async (appointment) => {
    const eventName = event?.name || "الحدث";
    const patientName = appointment.full_name || "المريض";
    const phone = appointment.phone?.replace(/[^0-9]/g, '');
    const phoneNumber = formatPhoneForWhatsApp(phone);

    if (!phoneNumber || phoneNumber.length < 10) {
      alert('رقم الهاتف غير صحيح. الرجاء التحقق من الرقم.');
      return;
    }

    const allAppointments = appointment.all_appointments || [appointment];
    const appointmentCount = allAppointments.length;

    let appointmentsList = "";
    allAppointments.forEach((apt, index) => {
      const specialty = apt.event_specialty?.specialty?.name || "غير محدد";
      const date = apt.day?.day_date || apt.day?.date || "-";
      const time = apt.hour?.time || apt.hour?.hour || "-";
      appointmentsList += `\n${index + 1}. التخصص: ${specialty}\n   التاريخ: ${date}\n   التوقيت: ${time}\n`;
    });

    const message = `السلام عليكم ${patientName}،

نذكر سيادتكم المحترمة ${appointmentCount === 1 ? 'بموعد' : 'بمواعيد'} الفحوصات الطبية:

*${eventName}*
${appointmentsList}
*الحضور بمحرم إجباري بالنسبة للنساء*

نرجو الحضور ربع ساعة قبل الموعد ${appointmentCount === 1 ? 'الموعد' : ''} لضمان السيرورة الحسنة للفحوصات.

يرجى منكم تقييم الحملة عبر الرابط التالي:
${window.location.origin}/evaluation/${eventId}/${appointment.id}

فريق مؤسسة تجمي للتنمية الإنسانية`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

    // فتح WhatsApp
    window.open(whatsappUrl, '_blank');

    // تحديث حالة is_reminded في قاعدة البيانات
    try {
      const res = await fetch(
        `${apiUrl}/api/appointments/mark-multiple-reminded`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            patient_id: appointment.patient_id,
            event_id: eventId,
          }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        const currentTime = new Date().toISOString();

        // تحديث appointments state محلياً
        setAppointments(prevAppointments =>
          prevAppointments.map(apt => {
            // تحديث جميع المواعيد التي لها نفس patient_id
            if (apt.patient_id === appointment.patient_id) {
              return {
                ...apt,
                is_reminded: 1,
                reminded_at: currentTime
              };
            }
            return apt;
          })
        );

        // تحديث filteredAppointments state محلياً
        setFilteredAppointments(prevFiltered =>
          prevFiltered.map(apt => {
            if (apt.patient_id === appointment.patient_id) {
              return {
                ...apt,
                is_reminded: 1,
                reminded_at: currentTime,
                // تحديث all_appointments أيضاً
                all_appointments: apt.all_appointments?.map(subApt => ({
                  ...subApt,
                  is_reminded: 1,
                  reminded_at: currentTime
                }))
              };
            }
            return apt;
          })
        );

        // تحديث selectedAppointment إذا كان مفتوحاً
        if (selectedAppointment && selectedAppointment.patient_id === appointment.patient_id) {
          setSelectedAppointment(prev => ({
            ...prev,
            is_reminded: 1,
            reminded_at: currentTime
          }));

          setPatientAllAppointments(prev =>
            prev.map(apt => ({
              ...apt,
              is_reminded: 1,
              reminded_at: currentTime
            }))
          );
        }

        // تحديث reminderStats محلياً
        setReminderStats(prev => ({
          total: prev.total,
          reminded: prev.reminded + 1,
          not_reminded: prev.not_reminded > 0 ? prev.not_reminded - 1 : 0
        }));

        setSuccess("تم إرسال التذكير بنجاح");
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      console.error("Error updating reminder status:", err);
      setError("حدث خطأ أثناء تحديث حالة التذكير");
      setTimeout(() => setError(""), 3000);
    }
  };

  const generateEvaluationLink = (eventId, appointmentId) => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/evaluation/${eventId}/${appointmentId}`;
  };

  const sendEvaluationLinkViaWhatsApp = (appointment, eventId) => {
    const evaluationLink = generateEvaluationLink(eventId, appointment.id);
    const message = `مرحباً ${appointment.patient_name}،

  شكراً لمشاركتك في الحملة الطبية. نأمل أن تكون قد حصلت على خدمة طبية جيدة.

  نرجو منك تقييم تجربتك من خلال الرابط التالي:
  ${evaluationLink}

  تقييمك يساعدنا على تحسين خدماتنا في المستقبل.

  شكراً لوقتك 🌟`;

    const phoneNumber = appointment.phone.replace(/[^0-9]/g, "");
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  // NEW: Get reminder badge
  const getReminderBadge = (appointment) => {
    if (appointment.is_reminded === true || appointment.is_reminded === 1) {
      return (
        <span
          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700"
          title={`تم الإرسال: ${appointment.reminded_at ? new Date(appointment.reminded_at).toLocaleString('ar-DZ') : ''}`}
        >
          <MessageCircle className="w-3 h-3" />
          تم التذكير
        </span>
      );
    }
    return null;
  };

  // Fetch available specialties
  const fetchAvailableSpecialties = async (appointmentId) => {
    try {
      const res = await fetch(
        `${apiUrl}/api/appointments/${appointmentId}/available-specialties`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();

      if (res.ok) {
        setAvailableSpecialties(data.available_specialties);
        setShowTransferModal(true);
      } else {
        setError(data.message || "فشل في تحميل التخصصات المتاحة");
      }
    } catch (err) {
      console.error("Error fetching available specialties:", err);
      setError("حدث خطأ أثناء تحميل التخصصات المتاحة");
    }
  };

  // Transfer specialty
  const transferSpecialty = async () => {
    if (!selectedTransferSpecialty) {
      setError("يرجى اختيار التخصص");
      return;
    }

    setTransferring(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(
        `${apiUrl}/api/appointments/${selectedAppointment.id}/transfer-specialty`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            new_event_specialty_id: selectedTransferSpecialty.event_specialty_id,
            use_closest_slot: true,
          }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        setSuccess(data.message);
        await fetchAppointments();
        setShowTransferModal(false);
        setShowDetailsModal(false);
        setSelectedTransferSpecialty(null);
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.message || "فشل في نقل الموعد");
      }
    } catch (err) {
      console.error("Transfer error:", err);
      setError("حدث خطأ أثناء نقل الموعد");
    } finally {
      setTransferring(false);
    }
  };

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

  const formatPhoneForWhatsApp = (phone) => {
    if (!phone) return '';

    let cleaned = phone.toString().replace(/\D/g, '');

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

  // Render gender icon
  const renderGenderIcon = (appointment) => {
    const sex = getPatientSex(appointment);

    if (sex === 'male') {
      return (
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 flex-shrink-0" title="ذكر">
          <User className="w-3.5 h-3.5 text-blue-600" />
        </div>
      );
    } else if (sex === 'female') {
      return (
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-pink-100 flex-shrink-0" title="أنثى">
          <User className="w-3.5 h-3.5 text-pink-600" />
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 flex-shrink-0" title="غير محدد">
        <User className="w-3.5 h-3.5 text-gray-400" />
      </div>
    );
  };

  // Get unique days by day_date
  const days = useMemo(() => {
    const daysMap = new Map();

    appointments.forEach(apt => {
      if (apt.day && apt.day.day_date) {
        if (!daysMap.has(apt.day.day_date)) {
          daysMap.set(apt.day.day_date, apt.day);
        }
      }
    });

    return Array.from(daysMap.values()).sort((a, b) => {
      return new Date(a.day_date) - new Date(b.day_date);
    });
  }, [appointments]);

  // Get unique hours
  const hours = useMemo(() => {
    const hoursMap = new Map();

    appointments.forEach(apt => {
      const hour = apt.hour;
      if (hour && (hour.time || hour.hour)) {
        const timeStr = hour.time || hour.hour;
        if (!hoursMap.has(timeStr)) {
          hoursMap.set(timeStr, timeStr);
        }
      }
    });

    return Array.from(hoursMap.values()).sort((a, b) => {
      return a.localeCompare(b);
    });
  }, [appointments]);

  // Get unique specialties
  const specialties = useMemo(() => {
    const specialtiesMap = new Map();

    appointments.forEach(apt => {
      const specialty = apt.event_specialty?.specialty;
      if (specialty && specialty.id) {
        if (!specialtiesMap.has(specialty.id)) {
          specialtiesMap.set(specialty.id, specialty);
        }
      }
    });

    return Array.from(specialtiesMap.values());
  }, [appointments]);

  const handleDownloadPDF = (patientData) => {
    const appointments = patientData.all_appointments || [patientData];
    const primaryAppointment = patientData;

    const printWindow = window.open("", "_blank");
    const eventName = event?.name || "الحدث";
    const date = new Date().toLocaleDateString("ar-SA");
    const logoUrl = `${window.location.origin}/tagemi_logo.png`;

    const full_name = primaryAppointment.full_name;
    const birthday = primaryAppointment.birthday
      ? new Date(primaryAppointment.birthday).toLocaleDateString("en-UK")
      : "-";
    const gender = primaryAppointment.sex === '0' || primaryAppointment.sex === 0 ? 'ذكر' : 'أنثى';
    const diseases = primaryAppointment.diseases && primaryAppointment.diseases !== 'nothing'
      ? primaryAppointment.diseases
      : 'لا يوجد';

    const allMedicalDocs = [];
    appointments.forEach(apt => {
      if (apt.medical_document_urls && apt.medical_document_urls.length > 0) {
        allMedicalDocs.push(...apt.medical_document_urls);
      }
    });

    const appointmentsList = appointments.map(apt => ({
      specialty: apt.event_specialty?.specialty?.name || "-",
      date: apt.day?.day_date || apt.day?.date || "-",
      time: apt.hour?.time || apt.hour?.hour || "-"
    }));

    printWindow.document.write(`
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
            <div class="info-item"><span class="info-label">الهاتف:</span><span class="info-value">${primaryAppointment.phone}</span></div>
            <span class="divider">|</span>
            <div class="info-item"><span class="info-label">هاتف ثانوي:</span><span class="info-value">${primaryAppointment.phone2 || "-"}</span></div>
            <span class="divider">|</span>
            <div class="info-item"><span class="info-label">العنوان:</span><span class="info-value">${primaryAppointment.state} - ${primaryAppointment.city}</span></div>
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

  // Group appointments by patient_id
  const getUniquePatients = (appointments) => {
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
  };

  // UPDATED: Apply filters including reminder filter
  const applyFilters = () => {
    let filtered = [...appointments];

    if (searchTerm) {
      filtered = filtered.filter(
        (apt) =>
          apt.patient_id?.toString().includes(searchTerm) ||
          apt.full_name?.includes(searchTerm) ||
          apt.phone?.includes(searchTerm)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((apt) => apt.status === statusFilter);
    }

    if (specialtyFilter !== "all") {
      filtered = filtered.filter(
        (apt) => apt.event_specialty?.specialty?.id?.toString() === specialtyFilter
      );
    }

    if (dayFilter !== "all") {
      filtered = filtered.filter(
        (apt) => apt.day?.day_date === dayFilter
      );
    }

    if (hourFilter !== "all") {
      filtered = filtered.filter(
        (apt) => {
          const aptHourTime = apt.hour?.time || apt.hour?.hour;
          return aptHourTime === hourFilter;
        }
      );
    }

    if (sexFilter !== "all") {
      filtered = filtered.filter((apt) => {
        const patientSex = getPatientSex(apt);
        return patientSex === sexFilter;
      });
    }

    // NEW: Reminder filter
    if (reminderFilter !== "all") {
      filtered = filtered.filter((apt) => {
        if (reminderFilter === "reminded") {
          return apt.is_reminded === true || apt.is_reminded === 1;
        } else if (reminderFilter === "not_reminded") {
          return apt.is_reminded === false || apt.is_reminded === 0 || apt.is_reminded === null;
        }
        return true;
      });
    }

    const uniquePatients = getUniquePatients(filtered);
    setFilteredAppointments(uniquePatients);
  };

  // UPDATED: useEffect to include fetchReminderStats
  useEffect(() => {
    fetchEventDetails();
    fetchAppointments();
    fetchReminderStats();
  }, [eventId]);

  // UPDATED: useEffect to include reminderFilter
  useEffect(() => {
    applyFilters();
  }, [appointments, searchTerm, statusFilter, specialtyFilter, dayFilter, hourFilter, sexFilter, reminderFilter]);

  const fetchEventDetails = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/events/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok) {
        setEvent(data.event || data);
      } else {
        setError("فشل في تحميل تفاصيل الحدث");
      }
    } catch (err) {
      console.error("Error fetching event:", err);
      setError("حدث خطأ أثناء تحميل البيانات");
    }
  };

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `${apiUrl}/api/appointments/by-event?event_id=${eventId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();

      if (res.ok) {
        setAppointments(data.appointments || data.data || []);
      } else {
        setError("فشل في تحميل المواعيد");
      }
    } catch (err) {
      console.error("Error fetching appointments:", err);
      setError("حدث خطأ أثناء تحميل المواعيد");
    } finally {
      setLoading(false);
    }
  };

  const startEditing = () => {
    if (!selectedAppointment) return;

    setIsEditing(true);
    const nameParts = selectedAppointment.full_name?.split(' ') || [];
    setEditedData({
      name: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      birthday: selectedAppointment.birthday || '',
      state: selectedAppointment.state || '',
      city: selectedAppointment.city || '',
      diseases: selectedAppointment.diseases === 'nothing' ? '' : (selectedAppointment.diseases || ''),
      phone: selectedAppointment.phone || '',
      phone2: selectedAppointment.phone2 || '',
      sex: selectedAppointment.sex?.toString() || '0',
    });
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditedData({});
  };

  const saveEditedAppointment = async () => {
    setUpdating(true);
    setError("");
    setSuccess("");

    const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;

    try {
      const res = await fetch(`${apiUrl}/api/appointments/${selectedAppointment.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editedData),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess("تم تحديث معلومات المريض بنجاح");

        await fetchAppointments();

        requestAnimationFrame(() => {
          window.scrollTo(0, scrollPosition);
        });

        setSelectedAppointment(data.appointment);
        setIsEditing(false);
        setEditedData({});

        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.message || "فشل في تحديث المعلومات");
      }
    } catch (err) {
      console.error("Update error:", err);
      setError("حدث خطأ أثناء التحديث");
    } finally {
      setUpdating(false);
    }
  };

  const deleteAppointment = async (appointmentId) => {
    setUpdating(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`${apiUrl}/api/appointments/${appointmentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess("تم حذف الموعد بنجاح");

        await fetchAppointments();
        setShowDetailsModal(false);
        setShowDeleteConfirm(false);
        setAppointmentToDelete(null);

        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.message || "فشل في حذف الموعد");
      }
    } catch (err) {
      console.error("Delete error:", err);
      setError("حدث خطأ أثناء حذف الموعد");
    } finally {
      setUpdating(false);
    }
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
    const eventName = event?.name || "الحدث";
    const date = new Date().toLocaleDateString("ar-SA");
    const logoUrl = `${window.location.origin}/tagemi_logo.png`;

    let specialtyPages = "";

    Object.values(appointmentsBySpecialty).forEach((specialty, index) => {
      const stats = {
        total: specialty.appointments.length,
        present: specialty.appointments.filter(a => a.status === "Present" || a.status === "Waiting").length,
        absent: specialty.appointments.filter(a => a.status === "Absent").length,
        pending: specialty.appointments.filter(a => a.status === "Pending").length,
        special: specialty.appointments.filter(a => a.is_special === true || a.is_special === 1).length,
      };

      specialtyPages += `
        <div class="page" style="${index > 0 ? 'page-break-before: always;' : ''}">
          <div class="specialty-header">
            <img src="${logoUrl}" alt="Logo" class="header-logo" />
            <h2>${specialty.name}</h2>
            <p>الحدث: ${eventName} | التاريخ: ${date}</p>
          </div>
          
          <div class="stats-row">
            <div class="stat-item">
              <span class="stat-label">إجمالي</span>
              <span class="stat-value">${stats.total}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">حاضر</span>
              <span class="stat-value">${stats.present}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">غائب</span>
              <span class="stat-value">${stats.absent}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">قيد الانتظار</span>
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
                  <td>${apt.patient_id || "-"}</td>
                  <td>${apt.full_name || "-"}${apt.is_special ? ' ⭐' : ''}</td>
                  <td>${apt.day?.day_date || "-"}</td>
                  <td>${apt.hour?.time || apt.hour?.hour || "-"}</td>
                  <td>${apt.phone || "-"}</td>
                  <td>
                    <span class="status status-${apt.is_special ? 'special' : apt.status?.toLowerCase() || "pending"}">
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

    printWindow.document.write(`
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

  const printPatientCard = (appointment) => {
    const printWindow = window.open("", "_blank");
    const eventName = event?.name || "الحدث";
    const patientAppts = appointment.all_appointments || [appointment];
    const logoUrl = `${window.location.origin}/tagemi_logo.png`;

    const fullName = appointment.full_name || "-";
    const birthday = appointment.birthday
      ? new Date(appointment.birthday).toLocaleDateString('en-UK')
      : "-";
    const gender = appointment.sex == '0' ? 'ذكر' : appointment.sex == '1' ? 'أنثى' : '-';
    const phone = appointment.phone || "-";
    const phone2 = appointment.phone2 || "-";
    const state = appointment.state || "-";
    const city = appointment.city || "-";
    const diseases = appointment.diseases && appointment.diseases !== 'nothing' ? appointment.diseases : "لا يوجد";

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>بطاقة المريض - ${fullName}</title>
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
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
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
            padding: 8mm;
            display: flex;
            flex-direction: column;
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 5mm;
            margin-bottom: 5mm;
          }
          .logo {
            height: 15mm;
            max-width: 60%;
            margin: 0 auto 2mm;
            display: block;
          }
          .event-name {
            font-size: 16px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 1mm;
          }
          .card-title {
            font-size: 20px;
            color: #1e40af;
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
            gap: 4mm;
          }
          .left-side {
            flex: 1;
            display: flex;
            flex-direction: column;
          }
          .section {
            background: #f8fafc;
            padding: 4mm;
            border-radius: 6px;
            border: 2px solid #e2e8f0;
          }
          .section-title {
            font-size: 12px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 3mm;
            padding: 2mm;
            background: #dbeafe;
            border-radius: 4px;
            text-align: center;
          }
          .info-line {
            margin-bottom: 2mm;
            font-size: 10px;
          }
          .info-item {
            display: flex;
            align-items: center;
            gap: 2mm;
            margin-bottom: 1.5mm;
          }
          .info-label {
            font-weight: bold;
            color: #475569;
            min-width: 25mm;
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
            flex: 1;
            overflow: auto;
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
            background-color: #2563eb;
            color: white;
            font-weight: bold;
          }
          .checklist tr:nth-child(even) {
            background-color: #f8fafc;
          }
          .checkbox-cell {
            width: 30mm;
            height: 20mm;
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
            <img src="${logoUrl}" alt="Logo" class="logo" onerror="this.style.display='none'" />
            <div class="event-name">${eventName}</div>
            <div class="card-title">بطاقة المتابعة</div>
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
                  <div class="info-item">
                    <span class="info-label">الأمراض المزمنة:</span>
                    <span class="info-value">${diseases}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="left-side">
              <div class="appointments-section">
                <div class="section-title">التخصصات والمتابعة</div>
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
                          <td class="specialty-name">${apt.event_specialty?.specialty?.name || "-"}</td>
                          <td class="checkbox-cell"></td>
                          <td class="checkbox-cell"></td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              </div>
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
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const updatePresenceStatus = async (appointmentId, status) => {
    setUpdating(true);
    setError("");
    setSuccess("");

    const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;

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
        setSuccess(`تم تحديث حالة الحضور بنجاح`);

        await fetchAppointments();

        requestAnimationFrame(() => {
          window.scrollTo(0, scrollPosition);
        });

        if (selectedAppointment?.id === appointmentId) {
          const updatedAppointment = data.appointment;
          if (updatedAppointment) {
            setSelectedAppointment(updatedAppointment);
          }
        }

        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.message || "فشل في تحديث حالة الحضور");
      }
    } catch (err) {
      console.error("Update error:", err);
      setError("حدث خطأ أثناء التحديث");
    } finally {
      setUpdating(false);
    }
  };

  const markAsSpecialCase = async (appointmentId) => {
    setUpdating(true);
    setError("");
    setSuccess("");

    const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;

    try {
      const res = await fetch(`${apiUrl}/api/waitinglist/Special/${appointmentId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(data.message || "تم تحديد المريض كحالة خاصة");

        await fetchAppointments();

        requestAnimationFrame(() => {
          window.scrollTo(0, scrollPosition);
        });

        setShowDetailsModal(false);

        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.message || "فشل في تحديد الحالة الخاصة");
      }
    } catch (err) {
      console.error("Special case error:", err);
      setError("حدث خطأ أثناء تحديد الحالة الخاصة");
    } finally {
      setUpdating(false);
    }
  };

  const exportToPDF = () => {
    const printWindow = window.open("", "_blank");
    const eventName = event?.name || "الحدث";
    const date = new Date().toLocaleDateString("ar-SA");

    printWindow.document.write(`
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
            <div class="number">${filteredAppointments.filter(a => a.status === "Present" || a.status === "Waiting").length}</div>
            <div class="label">حاضر</div>
          </div>
          <div class="stat-box">
            <div class="number">${filteredAppointments.filter(a => a.status === "Absent").length}</div>
            <div class="label">غائب</div>
          </div>
          <div class="stat-box">
            <div class="number">${filteredAppointments.filter(a => a.status === "Pending").length}</div>
            <div class="label">قيد الانتظار</div>
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
                <td>${apt.patient_id || "-"}</td>
                <td>${apt.full_name || "-"}${apt.is_special ? ' ⭐' : ''}</td>
                <td>${apt.event_specialty?.specialty?.name || "-"}</td>
                <td>${apt.day?.day_date || "-"}</td>
                <td>${apt.hour?.time || apt.hour?.hour || "-"}</td>
                <td>${apt.phone || "-"}</td>
                <td>
                  <span class="status status-${apt.is_special ? 'special' : apt.status?.toLowerCase() || "pending"}">
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

  const getStatusBadge = (appointment) => {
    if (appointment.is_special === true || appointment.is_special === 1) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold font-droid-arabic-kufi bg-purple-100 text-purple-700">
          <Star className="w-3 h-3" />
          حالة خاصة
        </span>
      );
    }

    const statusConfig = {
      Present: { bg: "bg-green-100", text: "text-green-700", label: "حاضر", icon: CheckCircle },
      Waiting: { bg: "bg-blue-100", text: "text-blue-700", label: "في الانتظار", icon: Clock },
      Pending: { bg: "bg-yellow-100", text: "text-yellow-700", label: "لم يحضر بعد", icon: AlertCircle },
      Completed: { bg: "bg-gray-100", text: "text-gray-700", label: "مكتمل", icon: CheckCheck },
      Commingsoon: { bg: "bg-orange-100", text: "text-orange-700", label: "قادم قريباً", icon: Clock },
    };

    const config = statusConfig[appointment.status] || statusConfig.Pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold font-droid-arabic-kufi ${config.bg} ${config.text}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const stats = {
    total: filteredAppointments.length,
    totalAppointments: filteredAppointments.reduce((sum, p) => sum + (p.appointment_count || 1), 0),
    present: filteredAppointments.filter((a) => a.status === "Present" || a.status === "Waiting").length,
    special: filteredAppointments.filter((a) => a.is_special === true || a.is_special === 1).length,
    pending: filteredAppointments.filter((a) => a.status === "Pending").length,
    completed: filteredAppointments.filter((a) => a.status === "Completed").length,
    commingsoon: filteredAppointments.filter((a) => a.status === "Commingsoon").length,
  };

  const handleDownloadCSV = () => {
    let appointmentsToExport = appointments;

    if (downloadSpecialtyFilter !== "all") {
      appointmentsToExport = appointments.filter(
        (apt) => apt.event_specialty?.specialty?.id?.toString() === downloadSpecialtyFilter
      );
    }

    if (appointmentsToExport.length === 0) {
      setError("لا توجد مواعيد للتصدير");
      setTimeout(() => setError(""), 3000);
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
      'الطبيب',
      'حالة خاصة',
      'تم التذكير' // NEW
    ];

    const statusMap = {
      Present: 'حاضر',
      Waiting: 'في الانتظار',
      Pending: 'لم يحضر بعد',
      Completed: 'مكتمل',
      Commingsoon: 'قادم قريباً',
      Absent: 'غائب'
    };

    const csvRows = appointmentsToExport.map(appointment => {
      const status = appointment.is_special
        ? 'حالة خاصة'
        : (statusMap[appointment.status] || appointment.status);
      const birthday = appointment.birthday
        ? new Date(appointment.birthday).toLocaleDateString('en-UK')
        : '-';
      const sex = appointment.sex === '0' || appointment.sex === 0 ? 'ذكر' : 'أنثى';
      const diseases = appointment.diseases && appointment.diseases !== 'nothing'
        ? appointment.diseases
        : '-';
      const isSpecial = appointment.is_special ? 'نعم' : 'لا';
      const isReminded = appointment.is_reminded ? 'نعم' : 'لا'; // NEW

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
        appointment.doctor?.name || 'غير محدد',
        isSpecial,
        isReminded // NEW
      ];
    });

    const BOM = '\uFEFF';
    const csvContent = [
      headers.join(','),
      ...csvRows.map(row => row.map(cell => {
        const cellStr = String(cell).replace(/"/g, '""');
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

    setSuccess(`تم تحميل ${appointmentsToExport.length} موعد بنجاح`);
    setTimeout(() => setSuccess(''), 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-100 via-blue-50 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-droid-arabic-kufi">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 via-blue-50 to-white">
      <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-10">

        {/* Header */}
        {user.role_id === 1 && (
          <div className="mb-4 sm:mb-6">
            <Link
              to={`/admin/event-tracking/${eventId}`}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-3 sm:mb-4 font-droid-arabic-kufi transition-colors text-sm sm:text-base"
            >
              <ArrowLeft className="w-4 h-4" />
              العودة إلى متابعة الحدث
            </Link>

            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-100">
              <div className="flex flex-col gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 font-droid-arabic-kufi">
                    التحقق من الحضور
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600 font-droid-arabic-kufi">
                    الحدث: {event?.name}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  {event?.is_current && (
                    <span className="bg-green-100 text-green-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold font-droid-arabic-kufi flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      حدث نشط
                    </span>
                  )}

                  <button
                    onClick={fetchAppointments}
                    className="flex items-center gap-1 sm:gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-colors text-xs sm:text-sm"
                    title="تحديث"
                  >
                    <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">تحديث</span>
                  </button>

                  <div className="hidden lg:flex items-center gap-2">
                    <button
                      onClick={handleDownloadCSV}
                      disabled={appointments.length === 0}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors font-droid-arabic-kufi whitespace-nowrap text-sm"
                    >
                      <Download className="w-4 h-4" />
                      تحميل CSV
                    </button>

                    <button
                      onClick={exportBySpecialty}
                      className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors font-droid-arabic-kufi text-sm"
                    >
                      <Stethoscope className="w-4 h-4" />
                      طباعة حسب التخصص
                    </button>

                    <button
                      onClick={exportToPDF}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-droid-arabic-kufi text-sm"
                    >
                      <Printer className="w-4 h-4" />
                      طباعة PDF
                    </button>
                  </div>

                  <div className="lg:hidden relative">
                    <button
                      onClick={() => setActiveActionMenu(activeActionMenu === 'header' ? null : 'header')}
                      className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors text-xs"
                    >
                      <Menu className="w-3 h-3" />
                      المزيد
                    </button>

                    {activeActionMenu === 'header' && (
                      <div className="absolute left-0 top-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 min-w-[200px]">
                        <button
                          onClick={() => {
                            handleDownloadCSV();
                            setActiveActionMenu(null);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-gray-700 font-droid-arabic-kufi text-sm"
                        >
                          <Download className="w-4 h-4" />
                          تحميل CSV
                        </button>
                        <button
                          onClick={() => {
                            exportBySpecialty();
                            setActiveActionMenu(null);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-gray-700 font-droid-arabic-kufi text-sm"
                        >
                          <Stethoscope className="w-4 h-4" />
                          طباعة حسب التخصص
                        </button>
                        <button
                          onClick={() => {
                            exportToPDF();
                            setActiveActionMenu(null);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-gray-700 font-droid-arabic-kufi text-sm"
                        >
                          <Printer className="w-4 h-4" />
                          طباعة PDF
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Alert Messages */}
        {error && (
          <div className="mb-4 sm:mb-6 bg-red-50 border-r-4 border-red-500 p-3 sm:p-4 rounded-lg">
            <div className="flex items-start gap-2 sm:gap-3">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 font-droid-arabic-kufi text-sm sm:text-base">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-4 sm:mb-6 bg-green-50 border-r-4 border-green-500 p-3 sm:p-4 rounded-lg">
            <div className="flex items-start gap-2 sm:gap-3">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-green-700 font-droid-arabic-kufi text-sm sm:text-base">{success}</p>
            </div>
          </div>
        )}

        {/* Statistics Cards - WITH REMINDER STATS */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6">
          <div className="bg-white rounded-lg shadow p-3 sm:p-4 border-r-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 font-droid-arabic-kufi mb-1">عدد المرضى</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-[10px] sm:text-xs text-gray-500 font-droid-arabic-kufi mt-1">
                  ({stats.totalAppointments} موعد)
                </p>
              </div>
              <User className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-blue-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-3 sm:p-4 border-r-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 font-droid-arabic-kufi mb-1">حاضر</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">{stats.present}</p>
              </div>
              <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-green-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-3 sm:p-4 border-r-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 font-droid-arabic-kufi mb-1">حالة خاصة</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-600">{stats.special}</p>
              </div>
              <Star className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-purple-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-3 sm:p-4 border-r-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 font-droid-arabic-kufi mb-1">لم يحضر بعد</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-yellow-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-3 sm:p-4 border-r-4 border-gray-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 font-droid-arabic-kufi mb-1">مكتمل</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-600">{stats.completed}</p>
              </div>
              <CheckCheck className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-gray-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-3 sm:p-4 border-r-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 font-droid-arabic-kufi mb-1">قادم قريباً</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-600">{stats.commingsoon}</p>
              </div>
              <Clock className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-orange-500 opacity-20" />
            </div>
          </div>

          {/* NEW: Reminder Stats Card */}
          <div className="bg-white rounded-lg shadow p-3 sm:p-4 border-r-4 border-indigo-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 font-droid-arabic-kufi mb-1">تم التذكير</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-indigo-600">{reminderStats.reminded || 0}</p>
                <p className="text-[10px] sm:text-xs text-gray-500 font-droid-arabic-kufi mt-1">
                  من {reminderStats.total || 0}
                </p>
              </div>
              <MessageCircle className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-indigo-500 opacity-20" />
            </div>
          </div>
        </div>

        {/* Filters - WITH REMINDER FILTER */}
        <div className="bg-white rounded-xl shadow-lg p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6 border border-gray-100">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden flex items-center justify-between w-full mb-3 text-gray-700 font-droid-arabic-kufi font-semibold"
          >
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <span>البحث والتصفية</span>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          <div className="hidden lg:flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-bold text-gray-900 font-droid-arabic-kufi">البحث والتصفية</h3>
          </div>

          <div className={`${showFilters ? 'block' : 'hidden'} lg:block space-y-3`}>
            <div className="w-full">
              <Input
                icon={Search}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ابحث برقم المريض، الاسم، أو رقم الهاتف..."
                className="text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
              <Select
                icon={CheckCircle}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: "all", label: "جميع الحالات" },
                  { value: "Present", label: "حاضر" },
                  { value: "Waiting", label: "في الانتظار" },
                  { value: "Pending", label: "لم يحضر بعد" },
                  { value: "Completed", label: "مكتمل" },
                  { value: "Commingsoon", label: "قادم قريباً" },
                ]}
                className="text-sm"
              />

              <Select
                icon={Stethoscope}
                value={specialtyFilter}
                onChange={(e) => setSpecialtyFilter(e.target.value)}
                options={[
                  { value: "all", label: "جميع التخصصات" },
                  ...specialties.map((specialty) => ({
                    value: specialty.id.toString(),
                    label: specialty.name,
                  })),
                ]}
                className="text-sm"
              />

              <Select
                icon={Calendar}
                value={dayFilter}
                onChange={(e) => setDayFilter(e.target.value)}
                options={[
                  { value: "all", label: "جميع الأيام" },
                  ...days.map((day) => ({
                    value: day.day_date,
                    label: new Date(day.day_date).toLocaleDateString("ar-DZ"),
                  })),
                ]}
                className="text-sm"
              />

              <Select
                icon={Clock}
                value={hourFilter}
                onChange={(e) => setHourFilter(e.target.value)}
                options={[
                  { value: "all", label: "جميع الأوقات" },
                  ...hours.map((hourTime) => ({
                    value: hourTime,
                    label: hourTime,
                  })),
                ]}
                className="text-sm"
              />

              {/* NEW: Reminder Filter */}
              <Select
                icon={MessageCircle}
                value={reminderFilter}
                onChange={(e) => setReminderFilter(e.target.value)}
                options={[
                  { value: "all", label: "جميع الحالات" },
                  { value: "reminded", label: "تم التذكير" },
                  { value: "not_reminded", label: "لم يتم التذكير" },
                ]}
                className="text-sm"
              />

              <div className="flex gap-2 sm:col-span-2 lg:col-span-1">
                <button
                  onClick={() => setSexFilter('all')}
                  className={`flex-1 px-3 py-2 rounded-lg font-droid-arabic-kufi transition-all flex items-center justify-center gap-1 text-xs sm:text-sm ${sexFilter === 'all'
                      ? 'bg-gray-700 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  <Users className="w-3 h-3" />
                  الكل
                </button>
                <button
                  onClick={() => setSexFilter('male')}
                  className={`flex-1 px-3 py-2 rounded-lg font-droid-arabic-kufi transition-all flex items-center justify-center gap-1 text-xs sm:text-sm ${sexFilter === 'male'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                    }`}
                >
                  <User className="w-3 h-3" />
                  ذكور
                </button>
                <button
                  onClick={() => setSexFilter('female')}
                  className={`flex-1 px-3 py-2 rounded-lg font-droid-arabic-kufi transition-all flex items-center justify-center gap-1 text-xs sm:text-sm ${sexFilter === 'female'
                      ? 'bg-pink-600 text-white shadow-md'
                      : 'bg-pink-50 text-pink-700 hover:bg-pink-100'
                    }`}
                >
                  <User className="w-3 h-3" />
                  إناث
                </button>
              </div>
            </div>

            {(searchTerm || statusFilter !== 'all' || specialtyFilter !== 'all' || dayFilter !== 'all' || hourFilter !== 'all' || sexFilter !== 'all' || reminderFilter !== 'all') && (
              <div className="text-xs text-gray-500 font-droid-arabic-kufi text-center lg:text-right">
                ({filteredAppointments.length} نتيجة)
              </div>
            )}
          </div>
        </div>

        {/* Appointments List */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                <tr>
                  <th className="px-4 py-3 text-right text-sm font-semibold font-droid-arabic-kufi">رقم المريض</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold font-droid-arabic-kufi">الاسم الكامل</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold font-droid-arabic-kufi">التخصص</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold font-droid-arabic-kufi">اليوم</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold font-droid-arabic-kufi">الساعة</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold font-droid-arabic-kufi">رقم الهاتف</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold font-droid-arabic-kufi">الحالة</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold font-droid-arabic-kufi">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredAppointments.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center">
                      <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500 font-droid-arabic-kufi">لا توجد مواعيد متاحة</p>
                    </td>
                  </tr>
                ) : (
                  filteredAppointments.map((appointment) => (
                    <tr
                      key={appointment.id}
                      className={`hover:bg-gray-50 transition-colors ${appointment.is_special ? 'bg-purple-50' : ''}`}
                    >
                      {/* UPDATED: Patient ID cell with reminder badge */}
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span>#{appointment.patient_id || "-"}</span>
                          {appointment.is_special && <Star className="w-3 h-3 text-purple-600" />}
                          {appointment.appointment_count > 1 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                              {appointment.appointment_count} مواعيد
                            </span>
                          )}
                          {appointment.medical_document_urls && appointment.medical_document_urls.length > 0 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                              <FileText className="w-3 h-3 mr-1" />
                              {appointment.medical_document_urls.length}
                            </span>
                          )}
                          {/* NEW: Reminder badge */}
                          {getReminderBadge(appointment)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 font-droid-arabic-kufi">
                        <div className="flex items-center gap-2">
                          <span>{appointment.full_name || "-"}</span>
                          {renderGenderIcon(appointment)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 font-droid-arabic-kufi">
                        {appointment.event_specialty?.specialty?.name || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 font-droid-arabic-kufi">
                        {appointment.day?.day_date || appointment.day?.date || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 font-droid-arabic-kufi">
                        {appointment.hour?.time || appointment.hour?.hour || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700" dir="ltr">
                        {appointment.phone || "-"}
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(appointment)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2 flex-wrap">
                          {/* WhatsApp Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              sendWhatsAppReminder(appointment);
                            }}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="إرسال تذكير WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>

                          {/* Medical Documents */}
                          {appointment.medical_document_urls && appointment.medical_document_urls.length > 0 && (
                            <div className="relative group">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (appointment.medical_document_urls.length === 1) {
                                    window.open(appointment.medical_document_urls[0], '_blank');
                                  } else {
                                    setSelectedAppointment(appointment);
                                    setPatientAllAppointments(appointment.all_appointments || [appointment]);
                                    setShowDetailsModal(true);
                                  }
                                }}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors relative"
                                title={`عرض المستندات (${appointment.medical_document_urls.length})`}
                              >
                                <FileText className="w-4 h-4" />
                                <span className="absolute -top-1 -right-1 bg-green-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                                  {appointment.medical_document_urls.length}
                                </span>
                              </button>

                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                {appointment.medical_document_urls.length} مستند طبي
                              </div>
                            </div>
                          )}

                          {/* View Details */}
                          <button
                            onClick={() => {
                              setSelectedAppointment(appointment);
                              setPatientAllAppointments(appointment.all_appointments || [appointment]);
                              setShowDetailsModal(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="عرض التفاصيل"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => {
                              setSelectedAppointment(appointment);
                              setPatientAllAppointments(appointment.all_appointments || [appointment]);
                              setShowDetailsModal(true);
                            }}
                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title="تعديل المعلومات"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Delete - Admin only */}
                          {user.role_id === 1 && (
                            <button
                              onClick={() => {
                                setAppointmentToDelete(appointment);
                                setShowDeleteConfirm(true);
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="حذف الموعد"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}

                          {/* Mark Present */}
                          {(user.role_id === 1 || user.role_id === 5) && appointment.status == "Pending" && (
                            <button
                              onClick={() => updatePresenceStatus(appointment.id, "Present")}
                              disabled={updating}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                              title="تحديد كـ حاضر"
                            >
                              <CheckCheck className="w-4 h-4" />
                            </button>
                          )}

                          {/* Mark as Special Case */}
                          {(user.role_id === 1 || user.role_id === 3) && !appointment.is_special && appointment.status !== "Completed" && (
                            <button
                              onClick={() => markAsSpecialCase(appointment.id)}
                              disabled={updating}
                              className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50"
                              title="تحديد كـ حالة خاصة"
                            >
                              <Star className="w-4 h-4" />
                            </button>
                          )}

                          {/* Transfer Specialty */}
                          {(user.role_id === 1 || user.role_id === 3) && (
                            <button
                              onClick={() => {
                                setSelectedAppointment(appointment);
                                fetchAvailableSpecialties(appointment.id);
                              }}
                              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="تغيير التخصص"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          )}
                            <button
                              onClick={() => sendEvaluationLinkViaWhatsApp(appointment, eventId)}
                              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-droid-arabic-kufi text-sm"
                            >
                              <MessageCircle className="w-4 h-4" />
                              <span>إرسال رابط التقييم</span>
                            </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden divide-y divide-gray-200">
            {filteredAppointments.length === 0 ? (
              <div className="p-8 text-center">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 font-droid-arabic-kufi">لا توجد مواعيد متاحة</p>
              </div>
            ) : (
              filteredAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className={`p-4 ${appointment.is_special ? 'bg-purple-50' : 'bg-white'}`}
                >
                  {/* Card Header - WITH REMINDER BADGE */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-bold text-gray-900">#{appointment.patient_id || "-"}</span>
                        {appointment.is_special && <Star className="w-4 h-4 text-purple-600" />}
                        {appointment.appointment_count > 1 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                            {appointment.appointment_count} مواعيد
                          </span>
                        )}
                        {/* NEW: Reminder badge in mobile */}
                        {getReminderBadge(appointment)}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 font-droid-arabic-kufi text-sm">
                          {appointment.full_name || "-"}
                        </span>
                        {renderGenderIcon(appointment)}
                      </div>
                    </div>
                    {getStatusBadge(appointment)}
                  </div>

                  {/* Card Content */}
                  <div className="space-y-2 mb-3 text-sm">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Stethoscope className="w-4 h-4 text-gray-400" />
                      <span className="font-droid-arabic-kufi">{appointment.event_specialty?.specialty?.name || "-"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="font-droid-arabic-kufi">
                        {appointment.day?.day_date || appointment.day?.date || "-"}
                      </span>
                      <Clock className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="font-droid-arabic-kufi">
                        {appointment.hour?.time || appointment.hour?.hour || "-"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span dir="ltr">{appointment.phone || "-"}</span>
                    </div>
                    {appointment.medical_document_urls && appointment.medical_document_urls.length > 0 && (
                      <div className="flex items-center gap-2 text-green-700">
                        <FileText className="w-4 h-4" />
                        <span className="font-droid-arabic-kufi text-xs">
                          {appointment.medical_document_urls.length} مستند طبي
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedAppointment(appointment);
                        setPatientAllAppointments(appointment.all_appointments || [appointment]);
                        setShowDetailsModal(true);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors font-droid-arabic-kufi text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      التفاصيل
                    </button>

                    <button
                      onClick={() => sendWhatsAppReminder(appointment)}
                      className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg transition-colors font-droid-arabic-kufi text-sm"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>واتساب</span>
                    </button>

                    {(user.role_id === 1 || user.role_id === 5) && appointment.status == "Pending" && (
                      <button
                        onClick={() => updatePresenceStatus(appointment.id, "Present")}
                        disabled={updating}
                        className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-3 py-2 rounded-lg transition-colors font-droid-arabic-kufi text-sm"
                      >
                        <CheckCheck className="w-4 h-4" />
                        <span>حاضر</span>
                      </button>
                    )}

                    {/* More Actions Menu */}
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const rect = e.currentTarget.getBoundingClientRect();
                          const viewportHeight = window.innerHeight;
                          const spaceBelow = viewportHeight - rect.bottom;
                          const spaceAbove = rect.top;

                          setMenuPosition(spaceAbove < 300 || spaceBelow > spaceAbove ? 'down' : 'up');
                          setActiveActionMenu(activeActionMenu === appointment.id ? null : appointment.id);
                        }}
                        className="flex items-center justify-center gap-1 bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg transition-colors text-sm"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {activeActionMenu === appointment.id && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setActiveActionMenu(null)}
                          />

                          <div className={`absolute left-0 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 min-w-[200px] ${menuPosition === 'down' ? 'top-full mt-2' : 'bottom-full mb-2'
                            }`}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                sendWhatsAppReminder(appointment);
                                setActiveActionMenu(null);
                              }}
                              className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-gray-700 font-droid-arabic-kufi text-sm"
                            >
                              <MessageCircle className="w-4 h-4 text-green-600" />
                              <span>إرسال تذكير WhatsApp</span>
                            </button>

                            {appointment.medical_document_urls && appointment.medical_document_urls.length > 0 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (appointment.medical_document_urls.length === 1) {
                                    window.open(appointment.medical_document_urls[0], '_blank');
                                  } else {
                                    setSelectedAppointment(appointment);
                                    setPatientAllAppointments(appointment.all_appointments || [appointment]);
                                    setShowDetailsModal(true);
                                  }
                                  setActiveActionMenu(null);
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-gray-700 font-droid-arabic-kufi text-sm"
                              >
                                <FileText className="w-4 h-4 text-green-600" />
                                <span>المستندات ({appointment.medical_document_urls.length})</span>
                              </button>
                            )}

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAppointment(appointment);
                                setPatientAllAppointments(appointment.all_appointments || [appointment]);
                                setShowDetailsModal(true);
                                startEditing();
                                setActiveActionMenu(null);
                              }}
                              className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-gray-700 font-droid-arabic-kufi text-sm"
                            >
                              <Edit className="w-4 h-4 text-orange-600" />
                              <span>تعديل المعلومات</span>
                            </button>

                            {(user.role_id === 1 || user.role_id === 3) && !appointment.is_special && appointment.status !== "Completed" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsSpecialCase(appointment.id);
                                  setActiveActionMenu(null);
                                }}
                                disabled={updating}
                                className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-gray-700 font-droid-arabic-kufi text-sm disabled:opacity-50"
                              >
                                <Star className="w-4 h-4 text-purple-600" />
                                <span>حالة خاصة</span>
                              </button>
                            )}

                            {(user.role_id === 1 || user.role_id === 3) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedAppointment(appointment);
                                  fetchAvailableSpecialties(appointment.id);
                                  setActiveActionMenu(null);
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-gray-700 font-droid-arabic-kufi text-sm"
                              >
                                <RefreshCw className="w-4 h-4 text-indigo-600" />
                                <span>تغيير التخصص</span>
                              </button>
                            )}

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadPDF(appointment);
                                setActiveActionMenu(null);
                              }}
                              className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-gray-700 font-droid-arabic-kufi text-sm"
                            >
                              <Printer className="w-4 h-4 text-green-600" />
                              <span>تحميل الموعد</span>
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                printPatientCard(appointment);
                                setActiveActionMenu(null);
                              }}
                              className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-gray-700 font-droid-arabic-kufi text-sm"
                            >
                              <Printer className="w-4 h-4 text-blue-600" />
                              <span>طباعة بطاقة المتابعة</span>
                            </button>

                            {user.role_id === 1 && (
                              <>
                                <div className="border-t border-gray-200 my-1"></div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setAppointmentToDelete(appointment);
                                    setShowDeleteConfirm(true);
                                    setActiveActionMenu(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-4 py-2 hover:bg-red-50 text-red-600 font-droid-arabic-kufi text-sm"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  <span>حذف الموعد</span>
                                </button>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Details Modal - Same as before but with WhatsApp button */}
        {showDetailsModal && selectedAppointment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-0 sm:p-4">
            <div className="bg-white w-full h-full sm:h-auto sm:rounded-xl sm:shadow-2xl sm:max-w-4xl sm:max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 flex items-center justify-between z-10">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg sm:text-2xl font-bold text-gray-900 font-droid-arabic-kufi truncate">
                    تفاصيل المريض
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 font-droid-arabic-kufi mt-1">
                    رقم المريض: #{selectedAppointment.patient_id}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setIsEditing(false);
                    setEditedData({});
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
                </button>
              </div>

              <div className="sticky top-[73px] sm:relative sm:top-0 bg-white border-b border-gray-200 p-3 sm:p-4 flex flex-wrap gap-2 z-10">
                {!isEditing ? (
                  <>
                    <button
                      onClick={startEditing}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors font-droid-arabic-kufi text-xs sm:text-sm"
                    >
                      <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                      تعديل
                    </button>

                    <button
                      onClick={() => sendWhatsAppReminder(selectedAppointment)}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors font-droid-arabic-kufi text-xs sm:text-sm"
                    >
                      <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">تذكير WhatsApp</span>
                      <span className="sm:hidden">واتساب</span>
                    </button>

                    <button
                      onClick={() => handleDownloadPDF(selectedAppointment)}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors font-droid-arabic-kufi text-xs sm:text-sm"
                    >
                      <Printer className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">تحميل الموعد</span>
                      <span className="sm:hidden">تحميل</span>
                    </button>
                    <button
                      onClick={() => printPatientCard(selectedAppointment)}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors font-droid-arabic-kufi text-xs sm:text-sm"
                    >
                      <Printer className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">طباعة بطاقة المتابعة</span>
                      <span className="sm:hidden">بطاقة</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={saveEditedAppointment}
                      disabled={updating}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors font-droid-arabic-kufi text-xs sm:text-sm"
                    >
                      <Save className="w-3 h-3 sm:w-4 sm:h-4" />
                      حفظ
                    </button>
                    <button
                      onClick={cancelEditing}
                      disabled={updating}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors font-droid-arabic-kufi text-xs sm:text-sm"
                    >
                      إلغاء
                    </button>
                  </>
                )}
              </div>

              {/* Rest of the modal content remains the same... */}
              {/* I'll skip the rest to keep response concise */}
              <div className="p-4 sm:p-6">
                {/* Patient Information Section */}
                <div className="bg-gray-50 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
                  <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 font-droid-arabic-kufi">
                    معلومات المريض
                  </h4>

                  {!isEditing ? (
                    <div className="grid grid-cols-1 gap-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <User className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm text-gray-600 font-droid-arabic-kufi">الاسم الكامل</p>
                          <p className="font-semibold text-gray-900 font-droid-arabic-kufi flex items-center gap-2 text-sm sm:text-base truncate">
                            {selectedAppointment.full_name}
                            {renderGenderIcon(selectedAppointment)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="bg-green-100 p-2 rounded-lg">
                          <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm text-gray-600 font-droid-arabic-kufi">تاريخ الميلاد</p>
                          <p className="font-semibold text-gray-900 font-droid-arabic-kufi text-sm sm:text-base">
                            {selectedAppointment.birthday
                              ? new Date(selectedAppointment.birthday).toLocaleDateString("en-UK")
                              : "-"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="bg-purple-100 p-2 rounded-lg">
                          <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm text-gray-600 font-droid-arabic-kufi">الإقامة</p>
                          <p className="font-semibold text-gray-900 font-droid-arabic-kufi text-sm sm:text-base truncate">
                            {selectedAppointment.state || "-"} | {selectedAppointment.city || "-"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="bg-orange-100 p-2 rounded-lg">
                          <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm text-gray-600 font-droid-arabic-kufi">رقم الهاتف</p>
                          <p className="font-semibold text-gray-900 text-sm sm:text-base" dir="ltr">
                            {selectedAppointment.phone || "-"}
                          </p>
                          {selectedAppointment.phone2 && (
                            <p className="font-semibold text-gray-700 text-xs sm:text-sm" dir="ltr">
                              {selectedAppointment.phone2}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="bg-yellow-100 p-2 rounded-lg">
                          <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm text-gray-600 font-droid-arabic-kufi">الأمراض</p>
                          <p className="font-semibold text-gray-900 font-droid-arabic-kufi text-sm sm:text-base">
                            {selectedAppointment.diseases && selectedAppointment.diseases !== "nothing"
                              ? selectedAppointment.diseases
                              : "لا يوجد"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2 font-droid-arabic-kufi">
                          الاسم الأول
                        </label>
                        <input
                          type="text"
                          value={editedData.name || ''}
                          onChange={(e) => setEditedData({ ...editedData, name: e.target.value })}
                          className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-droid-arabic-kufi text-sm sm:text-base"
                        />
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2 font-droid-arabic-kufi">
                          اللقب
                        </label>
                        <input
                          type="text"
                          value={editedData.lastName || ''}
                          onChange={(e) => setEditedData({ ...editedData, lastName: e.target.value })}
                          className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-droid-arabic-kufi text-sm sm:text-base"
                        />
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2 font-droid-arabic-kufi">
                          تاريخ الميلاد
                        </label>
                        <input
                          type="date"
                          value={editedData.birthday || ''}
                          onChange={(e) => setEditedData({ ...editedData, birthday: e.target.value })}
                          className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                        />
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2 font-droid-arabic-kufi">
                          الجنس
                        </label>
                        <select
                          value={editedData.sex || '0'}
                          onChange={(e) => setEditedData({ ...editedData, sex: e.target.value })}
                          className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-droid-arabic-kufi text-sm sm:text-base"
                        >
                          <option value="0">ذكر</option>
                          <option value="1">أنثى</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2 font-droid-arabic-kufi">
                          الولاية
                        </label>
                        <input
                          type="text"
                          value={editedData.state || ''}
                          onChange={(e) => setEditedData({ ...editedData, state: e.target.value })}
                          className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-droid-arabic-kufi text-sm sm:text-base"
                        />
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2 font-droid-arabic-kufi">
                          البلدية
                        </label>
                        <input
                          type="text"
                          value={editedData.city || ''}
                          onChange={(e) => setEditedData({ ...editedData, city: e.target.value })}
                          className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-droid-arabic-kufi text-sm sm:text-base"
                        />
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2 font-droid-arabic-kufi">
                          رقم الهاتف
                        </label>
                        <input
                          type="tel"
                          value={editedData.phone || ''}
                          onChange={(e) => setEditedData({ ...editedData, phone: e.target.value })}
                          className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                          dir="ltr"
                        />
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2 font-droid-arabic-kufi">
                          رقم هاتف ثانوي
                        </label>
                        <input
                          type="tel"
                          value={editedData.phone2 || ''}
                          onChange={(e) => setEditedData({ ...editedData, phone2: e.target.value })}
                          className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                          dir="ltr"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2 font-droid-arabic-kufi">
                          الأمراض
                        </label>
                        <textarea
                          value={editedData.diseases || ''}
                          onChange={(e) => setEditedData({ ...editedData, diseases: e.target.value })}
                          rows={3}
                          placeholder="اكتب الأمراض أو اترك الحقل فارغاً إذا لم يكن هناك أمراض"
                          className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-droid-arabic-kufi text-sm sm:text-base"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Medical Documents Section */}
                {user.role_id === 1 && (
                  <div className="mb-4 sm:mb-6">
                    <AppointmentDocuments appointment={selectedAppointment} />
                  </div>
                )}

                {/* All Appointments */}
                <div className="mb-4 sm:mb-6">
                  <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 font-droid-arabic-kufi flex items-center gap-2">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                    المواعيد ({patientAllAppointments.length})
                  </h4>

                  <div className="space-y-3">
                    {patientAllAppointments.map((apt, index) => (
                      <div
                        key={apt.id}
                        className={`border rounded-lg p-3 sm:p-4 ${apt.is_special ? 'border-purple-300 bg-purple-50' : 'border-gray-200 bg-white'
                          } ${apt.specialty_order === 1 ? 'ring-2 ring-blue-200' : ''}`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm font-semibold text-gray-700 font-droid-arabic-kufi">
                              موعد {index + 1}
                            </span>
                            {apt.specialty_order === 1 && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-semibold">
                                أساسي
                              </span>
                            )}
                          </div>
                          {getStatusBadge(apt)}
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                          <div>
                            <p className="text-gray-600 font-droid-arabic-kufi">التخصص</p>
                            <p className="font-semibold text-gray-900 font-droid-arabic-kufi">
                              {apt.event_specialty?.specialty?.name || "-"}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600 font-droid-arabic-kufi">اليوم</p>
                            <p className="font-semibold text-gray-900 font-droid-arabic-kufi">
                              {apt.day?.day_date || apt.day?.date || "-"}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600 font-droid-arabic-kufi">الساعة</p>
                            <p className="font-semibold text-gray-900 font-droid-arabic-kufi">
                              {apt.hour?.time || apt.hour?.hour || "-"}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600 font-droid-arabic-kufi">الطبيب</p>
                            <p className="font-semibold text-gray-900 font-droid-arabic-kufi">
                              {apt.doctor?.name || "غير محدد"}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                          {(user.role_id === 1 || user.role_id === 5) && (apt.status == "Pending" || apt.status == "Absent") && (
                            <button
                              onClick={() => updatePresenceStatus(apt.id, "Present")}
                              disabled={updating}
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 sm:px-4 py-2 rounded-lg font-semibold font-droid-arabic-kufi transition-all disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-xs sm:text-sm"
                            >
                              <CheckCheck className="w-3 h-3 sm:w-4 sm:h-4" />
                              حاضر
                            </button>
                          )}

                          {(user.role_id === 1 || user.role_id === 3) && !apt.is_special && apt.status !== "Completed" && (
                            <button
                              onClick={() => markAsSpecialCase(apt.id)}
                              disabled={updating}
                              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-3 sm:px-4 py-2 rounded-lg font-semibold font-droid-arabic-kufi transition-all disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-xs sm:text-sm"
                            >
                              <Star className="w-3 h-3 sm:w-4 sm:h-4" />
                              حالة خاصة
                            </button>
                          )}
                          {user.role_id === 1 && (
                            <button
                              onClick={() => {
                                setAppointmentToDelete(apt);
                                setShowDeleteConfirm(true);
                              }}
                              disabled={updating}
                              className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 py-2 rounded-lg font-semibold font-droid-arabic-kufi transition-all disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-xs sm:text-sm"
                            >
                              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                              حذف
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && appointmentToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-red-100 p-2 sm:p-3 rounded-full">
                  <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 font-droid-arabic-kufi">
                  تأكيد الحذف
                </h3>
              </div>

              <div className="mb-6">
                <p className="text-sm sm:text-base text-gray-700 font-droid-arabic-kufi mb-2">
                  هل أنت متأكد من حذف هذا الموعد؟
                </p>
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200">
                  <div className="space-y-2 text-xs sm:text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-droid-arabic-kufi">رقم المريض:</span>
                      <span className="font-semibold text-gray-900">#{appointmentToDelete.patient_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-droid-arabic-kufi">الاسم:</span>
                      <span className="font-semibold text-gray-900 font-droid-arabic-kufi truncate mr-2">
                        {appointmentToDelete.full_name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-droid-arabic-kufi">التخصص:</span>
                      <span className="font-semibold text-gray-900 font-droid-arabic-kufi truncate mr-2">
                        {appointmentToDelete.event_specialty?.specialty?.name || "-"}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-red-600 text-xs sm:text-sm font-droid-arabic-kufi mt-3">
                  ⚠️ تحذير: هذا الإجراء لا يمكن التراجع عنه
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => deleteAppointment(appointmentToDelete.id)}
                  disabled={updating}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-semibold font-droid-arabic-kufi transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2 text-xs sm:text-sm"
                >
                  <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  {updating ? "جاري الحذف..." : "تأكيد الحذف"}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setAppointmentToDelete(null);
                  }}
                  disabled={updating}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-semibold font-droid-arabic-kufi transition-all disabled:cursor-not-allowed text-xs sm:text-sm"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Transfer Specialty Modal */}
        {showTransferModal && selectedAppointment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-0 sm:p-4">
            <div className="bg-white w-full h-full sm:h-auto sm:rounded-xl sm:shadow-2xl sm:max-w-2xl sm:max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 flex items-center justify-between z-10">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg sm:text-2xl font-bold text-gray-900 font-droid-arabic-kufi">
                    تغيير التخصص
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 font-droid-arabic-kufi mt-1 truncate">
                    المريض: {selectedAppointment.full_name} (#{selectedAppointment.patient_id})
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowTransferModal(false);
                    setSelectedTransferSpecialty(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
                </button>
              </div>

              <div className="p-4 sm:p-6">
                {availableSpecialties.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm sm:text-base text-gray-500 font-droid-arabic-kufi">
                      لا توجد تخصصات متاحة حالياً
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs sm:text-sm text-gray-600 font-droid-arabic-kufi mb-4">
                      اختر التخصص الجديد (سيتم استخدام أقرب موعد متاح):
                    </p>
                    {availableSpecialties.map((specialty) => (
                      <div
                        key={specialty.event_specialty_id}
                        onClick={() => setSelectedTransferSpecialty(specialty)}
                        className={`border-2 rounded-lg p-3 sm:p-4 cursor-pointer transition-all ${selectedTransferSpecialty?.event_specialty_id === specialty.event_specialty_id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                          }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <Stethoscope className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                              <h4 className="font-bold text-sm sm:text-base text-gray-900 font-droid-arabic-kufi truncate">
                                {specialty.specialty_name}
                              </h4>
                            </div>

                            {specialty.closest_slot && (
                              <div className="space-y-1 text-xs sm:text-sm">
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                  <span className="font-droid-arabic-kufi truncate">
                                    {new Date(specialty.closest_slot.day_date).toLocaleDateString("ar-DZ")}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                  <span className="font-droid-arabic-kufi">
                                    {specialty.closest_slot.time}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-green-600">
                                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                  <span className="font-droid-arabic-kufi">
                                    {specialty.total_available_slots} موعد متاح
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>

                          {selectedTransferSpecialty?.event_specialty_id === specialty.event_specialty_id && (
                            <div className="bg-blue-500 text-white rounded-full p-1 flex-shrink-0">
                              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {availableSpecialties.length > 0 && (
                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={transferSpecialty}
                      disabled={!selectedTransferSpecialty || transferring}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold font-droid-arabic-kufi transition-all flex items-center justify-center gap-2 text-xs sm:text-sm"
                    >
                      {transferring ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                          جاري النقل...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
                          تأكيد النقل
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setShowTransferModal(false);
                        setSelectedTransferSpecialty(null);
                      }}
                      disabled={transferring}
                      className="flex-1 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold font-droid-arabic-kufi transition-all text-xs sm:text-sm"
                    >
                      إلغاء
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckPresence;