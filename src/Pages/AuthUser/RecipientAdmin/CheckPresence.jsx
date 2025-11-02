import React, { useState, useEffect, useContext } from "react";
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
    FileText, // ✅ Add this

} from "lucide-react";
import { Select, Input } from '../../Common/FormInputs';
import AppointmentDocuments from '../SuperAdmin/AppointmentDocuments';

const apiUrl = import.meta.env.VITE_API_URL;

const CheckPresence = () => {
  const { eventId } = useParams();
  const { token, user } = useContext(AppContext);

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

  // Group appointments by patient_id and get primary appointment
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
        
        // Update primary if this has higher specialty_order
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

  const applyFilters = () => {
    let filtered = [...appointments];

    if (searchTerm) {
      filtered = filtered.filter(
        (apt) =>
          apt.patient_id?.toString().includes(searchTerm) ||
          apt.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
        (apt) => apt.day?.id?.toString() === dayFilter
      );
    }

    // Group by patient to show only one row per patient
    const uniquePatients = getUniquePatients(filtered);
    setFilteredAppointments(uniquePatients);
  };

  useEffect(() => {
    fetchEventDetails();
    fetchAppointments();
  }, [eventId]);

  useEffect(() => {
    applyFilters();
  }, [appointments, searchTerm, statusFilter, specialtyFilter, dayFilter]);

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

  // Export appointments grouped by specialty with logo
  const exportBySpecialty = () => {
    const appointmentsBySpecialty = {};
    
    // Group appointments by specialty
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
                      ${
                        apt.is_special 
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

  // Print individual patient card (A5 size)
  const printPatientCard = (appointment) => {
    const printWindow = window.open("", "_blank");
    const eventName = event?.name || "الحدث";
    const patientAppts = appointment.all_appointments || [appointment];
    const logoUrl = `${window.location.origin}/tagemi_logo.png`;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>بطاقة المريض - ${appointment.full_name}</title>
        <style>
          * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
          }
          @page {
            size: A5 portrait;
            margin: 0;
          }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            direction: rtl;
            width: 148mm;
            height: 210mm;
            margin: 0;
            padding: 0;
            background: white;
          }
          .card {
            width: 100%;
            height: 100%;
            padding: 10mm;
            display: flex;
            flex-direction: column;
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 8mm;
            margin-bottom: 6mm;
          }
          .logo {
            height: 20mm;
            max-width: 80%;
            margin: 0 auto 3mm;
            display: block;
          }
          .event-name {
            font-size: 18px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 2mm;
          }
          .card-title {
            font-size: 14px;
            color: #64748b;
          }
          .patient-info {
            background: #f8fafc;
            padding: 5mm;
            border-radius: 6px;
            margin-bottom: 5mm;
            border: 2px solid #e2e8f0;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            padding: 3mm 0;
            border-bottom: 1px solid #e2e8f0;
          }
          .info-row:last-child {
            border-bottom: none;
          }
          .info-label {
            font-weight: bold;
            color: #475569;
            font-size: 13px;
          }
          .info-value {
            color: #1e40af;
            font-weight: 600;
            font-size: 13px;
          }
          .appointments-section {
            flex: 1;
            margin-bottom: 4mm;
          }
          .section-title {
            font-size: 14px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 3mm;
            padding: 2mm;
            background: #dbeafe;
            border-radius: 4px;
            text-align: center;
          }
          .checklist {
            width: 100%;
            border-collapse: collapse;
          }
          .checklist th,
          .checklist td {
            border: 2px solid #475569;
            padding: 3mm;
            text-align: center;
            font-size: 12px;
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
            width: 18mm;
          }
          .checkbox {
            width: 5mm;
            height: 5mm;
            border: 2px solid #475569;
            border-radius: 2px;
            display: inline-block;
            background: white;
          }
          .specialty-name {
            text-align: right;
            font-weight: 600;
          }
          .footer {
            text-align: center;
            font-size: 9px;
            color: #64748b;
            padding-top: 3mm;
            border-top: 1px solid #e2e8f0;
          }
          .special-badge {
            background: #f3e8ff;
            color: #6b21a8;
            padding: 1mm 2mm;
            border-radius: 3px;
            font-size: 10px;
            font-weight: bold;
            display: inline-block;
            margin-right: 2mm;
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
            <div class="card-title">بطاقة متابعة المريض</div>
          </div>

          <div class="patient-info">
            <div class="info-row">
              <span class="info-label">رقم المريض:</span>
              <span class="info-value">#${appointment.patient_id || "-"}</span>
            </div>
            <div class="info-row">
              <span class="info-label">الاسم:</span>
              <span class="info-value">${appointment.full_name || "-"}${appointment.is_special ? ' <span class="special-badge">⭐ حالة خاصة</span>' : ''}</span>
            </div>
          </div>

          <div class="appointments-section">
            <div class="section-title">التخصصات والمتابعة (${patientAppts.length})</div>
            <table class="checklist">
              <thead>
                <tr>
                  <th>التخصص</th>
                  <th>حضر</th>
                  <th>غاب</th>
                  <th>إجتاز</th>
                </tr>
              </thead>
              <tbody>
                ${patientAppts.map(apt => `
                  <tr>
                    <td class="specialty-name">${apt.event_specialty?.specialty?.name || "-"}</td>
                    <td class="checkbox-cell"><span class="checkbox"></span></td>
                    <td class="checkbox-cell"><span class="checkbox"></span></td>
                    <td class="checkbox-cell"><span class="checkbox"></span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="footer">
            <p>تاريخ الطباعة: ${new Date().toLocaleDateString("ar-SA")} | نظام إدارة المواعيد © ${new Date().getFullYear()}</p>
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
        
        // REFRESH ALL APPOINTMENTS to get updated statuses from backend
        await fetchAppointments();

        // Update selected appointment modal if open
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
        
        // REFRESH ALL APPOINTMENTS to get updated data
        await fetchAppointments();

        // Close modal after refresh
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
                    ${
                      apt.is_special 
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
    // Check if it's a special case
    if (appointment.is_special === true || appointment.is_special === 1) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold font-droid-arabic-kufi bg-purple-100 text-purple-700">
          <Star className="w-3 h-3" />
          حالة خاصة
        </span>
      );
    }

    const statusConfig = {
      Present: {
        bg: "bg-green-100",
        text: "text-green-700",
        label: "حاضر",
        icon: CheckCircle,
      },
      Waiting: {
        bg: "bg-blue-100",
        text: "text-blue-700",
        label: "في الانتظار",
        icon: Clock,
      },
      Pending: {
        bg: "bg-yellow-100",
        text: "text-yellow-700",
        label: "لم يحضر بعد",
        icon: AlertCircle,
      },
      Completed: {
        bg: "bg-gray-100",
        text: "text-gray-700",
        label: "مكتمل",
        icon: CheckCheck,
      },
      Commingsoon: {
        bg: "bg-orange-100",
        text: "text-orange-700",
        label: "قادم قريباً",
        icon: Clock,
      },
    };

    const config = statusConfig[appointment.status] || statusConfig.Pending;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold font-droid-arabic-kufi ${config.bg} ${config.text}`}
      >
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const specialties = Array.from(
    new Set(
      appointments
        .map((apt) => apt.event_specialty?.specialty)
        .filter((s) => s)
        .map((s) => JSON.stringify(s))
    )
  ).map((s) => JSON.parse(s));
  
  const days = Array.from(
    new Set(
      appointments
        .map((apt) => apt.day)
        .filter((d) => d)
        .map((d) => JSON.stringify(d))
    )
  ).map((d) => JSON.parse(d))
    .sort((a, b) => {
      if (a.day_date && b.day_date) {
        return new Date(a.day_date) - new Date(b.day_date);
      }
      return 0;
    });

  const stats = {
    total: filteredAppointments.length,
    totalAppointments: filteredAppointments.reduce((sum, p) => sum + (p.appointment_count || 1), 0),
    present: filteredAppointments.filter((a) => a.status === "Present" || a.status === "Waiting").length,
    special: filteredAppointments.filter((a) => a.is_special === true || a.is_special === 1).length,
    pending: filteredAppointments.filter((a) => a.status === "Pending").length,
    completed: filteredAppointments.filter((a) => a.status === "Completed").length,
    commingsoon: filteredAppointments.filter((a) => a.status === "Commingsoon").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-droid-arabic-kufi">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen min-h-screen bg-gradient-to-b from-blue-100 via-blue-50 to-white flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-7xl mb-4">
        {/* Header */}
        <div className="mb-6">
          {user.role_id === 1 && (
            <Link
              to={`/admin/event-tracking/${eventId}`}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 font-droid-arabic-kufi transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              العودة إلى متابعة الحدث
            </Link>
          )}

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2 font-droid-arabic-kufi">
                  التحقق من الحضور
                </h1>
                <p className="text-gray-600 font-droid-arabic-kufi">
                  الحدث: {event?.name}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {event?.is_current && (
                  <span className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold font-droid-arabic-kufi flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    حدث نشط
                  </span>
                )}
                
                <button
                  onClick={exportBySpecialty}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors font-droid-arabic-kufi"
                  title="طباعة حسب التخصص"
                >
                  <Stethoscope className="w-4 h-4" />
                  طباعة حسب التخصص
                </button>
                
                <button
                  onClick={exportToPDF}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-droid-arabic-kufi"
                >
                  <Printer className="w-4 h-4" />
                  طباعة PDF
                </button>

                <button
                  onClick={fetchAppointments}
                  className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border-r-4 border-red-500 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-red-700 font-droid-arabic-kufi">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border-r-4 border-green-500 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <p className="text-green-700 font-droid-arabic-kufi">{success}</p>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4 border-r-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-droid-arabic-kufi mb-1">
                  عدد المرضى
                </p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-xs text-gray-500 font-droid-arabic-kufi mt-1">
                  ({stats.totalAppointments} موعد)
                </p>
              </div>
              <User className="w-10 h-10 text-blue-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 border-r-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-droid-arabic-kufi mb-1">حاضر</p>
                <p className="text-2xl font-bold text-green-600">{stats.present}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 border-r-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-droid-arabic-kufi mb-1">حالة خاصة</p>
                <p className="text-2xl font-bold text-purple-600">{stats.special}</p>
              </div>
              <Star className="w-10 h-10 text-purple-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 border-r-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-droid-arabic-kufi mb-1">
                  لم يحضر بعد
                </p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="w-10 h-10 text-yellow-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 border-r-4 border-gray-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-droid-arabic-kufi mb-1">مكتمل</p>
                <p className="text-2xl font-bold text-gray-600">{stats.completed}</p>
              </div>
              <CheckCheck className="w-10 h-10 text-gray-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 border-r-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-droid-arabic-kufi mb-1">
                  قادم قريباً
                </p>
                <p className="text-2xl font-bold text-orange-600">{stats.commingsoon}</p>
              </div>
              <Clock className="w-10 h-10 text-orange-500 opacity-20" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-bold text-gray-900 font-droid-arabic-kufi">
              البحث والتصفية
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
              icon={Search}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث برقم المريض، الاسم، أو رقم الهاتف..."
            />

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
            />

            <Select
              icon={Calendar}
              value={dayFilter}
              onChange={(e) => setDayFilter(e.target.value)}
              options={[
                { value: "all", label: "جميع الأيام" },
                ...days.map((day) => ({
                  value: day.id.toString(),
                  label: day.day_date || day.name || `يوم ${day.id}`,
                })),
              ]}
            />
          </div>
        </div>

        {/* Appointments Table */}
{/* Appointments Table */}
<div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <tr>
          <th className="px-4 py-3 text-right text-sm font-semibold font-droid-arabic-kufi">
            رقم المريض
          </th>
          <th className="px-4 py-3 text-right text-sm font-semibold font-droid-arabic-kufi">
            الاسم الكامل
          </th>
          <th className="px-4 py-3 text-right text-sm font-semibold font-droid-arabic-kufi">
            التخصص
          </th>
          <th className="px-4 py-3 text-right text-sm font-semibold font-droid-arabic-kufi">
            اليوم
          </th>
          <th className="px-4 py-3 text-right text-sm font-semibold font-droid-arabic-kufi">
            الساعة
          </th>
          <th className="px-4 py-3 text-right text-sm font-semibold font-droid-arabic-kufi">
            رقم الهاتف
          </th>
          <th className="px-4 py-3 text-right text-sm font-semibold font-droid-arabic-kufi">
            الحالة
          </th>
          <th className="px-4 py-3 text-center text-sm font-semibold font-droid-arabic-kufi">
            الإجراءات
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {filteredAppointments.length === 0 ? (
          <tr>
            <td colSpan="8" className="px-4 py-8 text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 font-droid-arabic-kufi">
                لا توجد مواعيد متاحة
              </p>
            </td>
          </tr>
        ) : (
          filteredAppointments.map((appointment) => (
            <tr
              key={appointment.id}
              className={`hover:bg-gray-50 transition-colors ${
                appointment.is_special ? 'bg-purple-50' : ''
              }`}
            >
              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                <div className="flex items-center gap-2">
                  <span>#{appointment.patient_id || "-"}</span>
                  {appointment.is_special && (
                    <Star className="w-3 h-3 text-purple-600" />
                  )}
                  {appointment.appointment_count > 1 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                      {appointment.appointment_count} مواعيد
                    </span>
                  )}
                  {/* ✅ NEW: Documents indicator badge */}
                  {appointment.medical_document_urls && appointment.medical_document_urls.length > 0 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                      <FileText className="w-3 h-3 mr-1" />
                      {appointment.medical_document_urls.length}
                    </span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-gray-700 font-droid-arabic-kufi">
                {appointment.full_name || "-"}
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
              <td className="px-4 py-3">
                {getStatusBadge(appointment)}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-center gap-2">
                  {/* ✅ NEW: Download documents button - Shows if documents exist */}
                  {appointment.medical_document_urls && appointment.medical_document_urls.length > 0 && (
                    <div className="relative group">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (appointment.medical_document_urls.length === 1) {
                            // If only one document, download directly
                            window.open(appointment.medical_document_urls[0], '_blank');
                          } else {
                            // If multiple documents, show in modal
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
                      
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        {appointment.medical_document_urls.length} مستند طبي
                      </div>
                    </div>
                  )}
                  
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
                  
                  {appointment.status == "Pending" && (
                    <button
                      onClick={() => updatePresenceStatus(appointment.id, "Present")}
                      disabled={updating}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                      title="تحديد كـ حاضر"
                    >
                      <CheckCheck className="w-4 h-4" />
                    </button>
                  )}

                  {!appointment.is_special && appointment.status !== "Completed" && (
                    <button
                      onClick={() => markAsSpecialCase(appointment.id)}
                      disabled={updating}
                      className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50"
                      title="تحديد كـ حالة خاصة"
                    >
                      <Star className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
</div>

        {/* Details Modal */}
        {showDetailsModal && selectedAppointment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 font-droid-arabic-kufi">
                    تفاصيل المريض
                  </h3>
                  <p className="text-sm text-gray-600 font-droid-arabic-kufi mt-1">
                    رقم المريض: #{selectedAppointment.patient_id}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => printPatientCard(selectedAppointment)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-droid-arabic-kufi"
                    title="طباعة بطاقة المريض"
                  >
                    <Printer className="w-4 h-4" />
                    طباعة البطاقة
                  </button>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6 text-gray-600" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Patient Information */}
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <h4 className="text-lg font-bold text-gray-900 mb-4 font-droid-arabic-kufi">
                    معلومات المريض
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-droid-arabic-kufi">
                            الاسم الكامل
                          </p>
                          <p className="font-semibold text-gray-900 font-droid-arabic-kufi">
                            {selectedAppointment.full_name}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="bg-green-100 p-2 rounded-lg">
                          <Calendar className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-droid-arabic-kufi">
                            تاريخ الميلاد
                          </p>
                          <p className="font-semibold text-gray-900 font-droid-arabic-kufi">
                            {selectedAppointment.birthday
                              ? new Date(selectedAppointment.birthday).toLocaleDateString("en-UK")
                              : "-"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="bg-purple-100 p-2 rounded-lg">
                          <MapPin className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-droid-arabic-kufi">
                            الإقامة
                          </p>
                          <p className="font-semibold text-gray-900 font-droid-arabic-kufi">
                            {selectedAppointment.state || "-"} | {selectedAppointment.city || "-"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-orange-100 p-2 rounded-lg">
                          <Phone className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-droid-arabic-kufi">
                            رقم الهاتف
                          </p>
                          <p className="font-semibold text-gray-900" dir="ltr">
                            {selectedAppointment.phone || "-"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="bg-yellow-100 p-2 rounded-lg">
                          <AlertCircle className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-droid-arabic-kufi">
                            الأمراض
                          </p>
                          <p className="font-semibold text-gray-900 font-droid-arabic-kufi">
                            {selectedAppointment.diseases && selectedAppointment.diseases !== "nothing"
                              ? selectedAppointment.diseases
                              : "لا يوجد"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Medical Documents Section - CORRECT PLACEMENT */}
                {user.role_id === 1 && (
                  <div className="mb-6">
                    <AppointmentDocuments appointment={selectedAppointment} />
                  </div>
                )}

                {/* All Appointments for this patient */}
                <div className="mb-6">
                  <h4 className="text-lg font-bold text-gray-900 mb-4 font-droid-arabic-kufi flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    المواعيد ({patientAllAppointments.length})
                  </h4>
                  
                  <div className="space-y-3">
                    {patientAllAppointments.map((apt, index) => (
                      <div
                        key={apt.id}
                        className={`border rounded-lg p-4 ${
                          apt.is_special ? 'border-purple-300 bg-purple-50' : 'border-gray-200 bg-white'
                        } ${apt.specialty_order === 1 ? 'ring-2 ring-blue-200' : ''}`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-700 font-droid-arabic-kufi">
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

                        <div className="grid grid-cols-2 gap-4 text-sm">
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

                        {/* Action buttons for each appointment */}
                        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                          {(apt.status == "Pending" || apt.status == "Absent") && (
                            <button
                              onClick={() => {
                                updatePresenceStatus(apt.id, "Present");
                              }}
                              disabled={updating}
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold font-droid-arabic-kufi transition-all disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                            >
                              <CheckCheck className="w-4 h-4" />
                              حاضر
                            </button>
                          )}

                          {!apt.is_special && apt.status !== "Completed" && (
                            <button
                              onClick={() => {
                                markAsSpecialCase(apt.id);
                              }}
                              disabled={updating}
                              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold font-droid-arabic-kufi transition-all disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                            >
                              <Star className="w-4 h-4" />
                              حالة خاصة
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
      </div>
    </div>
  );
};

export default CheckPresence;