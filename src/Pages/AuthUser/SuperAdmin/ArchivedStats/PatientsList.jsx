// src/pages/Admin/ArchivedStats/PatientsList.jsx

import React, { useState, useEffect, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import { AppContext } from "../../../../Context/AppContext";
import {
  ArrowLeft,
  AlertCircle,
  FileText,
  Download,
  Printer,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  User,
  Phone,
  Calendar,
  MapPin,
  Stethoscope,
  Clock,
  CheckCircle,
  XCircle,
  UserX,
} from "lucide-react";

const apiUrl = import.meta.env.VITE_API_URL;

const STATUS_CONFIG = {
  Completed: { label: "مكتمل", color: "bg-green-100 text-green-700", icon: CheckCircle },
  Cancelled: { label: "ملغي", color: "bg-red-100 text-red-700", icon: XCircle },
  NoShow: { label: "غائب", color: "bg-orange-100 text-orange-700", icon: UserX },
  Pending: { label: "معلق", color: "bg-blue-100 text-blue-700", icon: Clock },
};

const PatientsList = () => {
  const { eventId } = useParams();
  const { token } = useContext(AppContext);
  
  const [event, setEvent] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage, setPerPage] = useState(50);

  useEffect(() => {
    fetchEvent();
    fetchSpecialties();
  }, [eventId]);

  useEffect(() => {
    fetchPatients();
  }, [eventId, searchTerm, statusFilter, specialtyFilter, currentPage, perPage]);

  const fetchEvent = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/events/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setEvent(data.event || data);
      }
    } catch (err) {
      console.error("Error fetching event:", err);
    }
  };

  const fetchSpecialties = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/events/${eventId}/specialties`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      
      if (res.ok) {
        const uniqueSpecialties = [];
        const specialtyIds = new Set();
        
        (data.event_specialties || []).forEach(es => {
          if (es.specialty && !specialtyIds.has(es.specialty.id)) {
            specialtyIds.add(es.specialty.id);
            uniqueSpecialties.push(es.specialty);
          }
        });
        
        setSpecialties(uniqueSpecialties);
      }
    } catch (err) {
      console.error("Error fetching specialties:", err);
    }
  };

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        per_page: perPage,
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      if (specialtyFilter) params.append('specialty_id', specialtyFilter);

      const res = await fetch(`${apiUrl}/api/archived-events/${eventId}/patients-list?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      
      if (res.ok) {
        setAppointments(data.appointments.data);
        setTotalPages(data.appointments.last_page);
      } else {
        setError(data.message || "فشل في تحميل البيانات");
      }
    } catch (err) {
      console.error("Error:", err);
      setError("حدث خطأ أثناء تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    const csvContent = [
      ["الرقم", "الاسم الكامل", "تاريخ الميلاد", "الجنس", "الهاتف", "الولاية", "المدينة", "التخصص", "الطبيب", "اليوم", "الساعة", "الحالة"],
      ...appointments.map(apt => [
        apt.id,
        apt.full_name,
        apt.birthday,
        apt.sex === '0' ? 'ذكر' : 'أنثى',
        apt.phone,
        apt.state || '',
        apt.city || '',
        apt.event_specialty?.specialty?.name || '',
        apt.doctor?.name || '',
        apt.day?.name || '',
        apt.hour?.time || '',
        STATUS_CONFIG[apt.status]?.label || apt.status
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `patients_list_${eventId}.csv`;
    link.click();
  };

  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setSpecialtyFilter("");
    setCurrentPage(1);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <div className="flex items-center gap-3 mb-3">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <h3 className="text-lg font-bold text-red-800 font-droid-arabic-kufi">خطأ</h3>
          </div>
          <p className="text-red-700 font-droid-arabic-kufi">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen min-h-screen bg-gradient-to-b from-indigo-50 to-white p-6 flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-7xl mb-4">
        {/* Header */}
        <div className="mb-6 no-print">
          <Link
            to={`/admin/event-tracking/${eventId}`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 font-droid-arabic-kufi transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            العودة إلى صفحة المتابعة
          </Link>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-indigo-100 w-16 h-16 rounded-xl flex items-center justify-center">
                  <FileText className="w-8 h-8 text-indigo-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 font-droid-arabic-kufi">
                    قائمة المرضى الكاملة
                  </h1>
                  <p className="text-gray-600 font-droid-arabic-kufi">{event?.name}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-droid-arabic-kufi"
                >
                  <Download className="w-4 h-4" />
                  تصدير CSV
                </button>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-droid-arabic-kufi"
                >
                  <Printer className="w-4 h-4" />
                  طباعة
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 mb-6 no-print">
          <div className="flex items-center gap-3 mb-4">
            <Filter className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-bold text-gray-900 font-droid-arabic-kufi">الفلاتر</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="بحث (الاسم، الهاتف، رقم المريض)"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-droid-arabic-kufi"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-droid-arabic-kufi"
            >
              <option value="">جميع الحالات</option>
              <option value="Completed">مكتمل</option>
              <option value="Cancelled">ملغي</option>
              <option value="NoShow">غائب</option>
              <option value="Pending">معلق</option>
            </select>

            {/* Specialty Filter */}
            <select
              value={specialtyFilter}
              onChange={(e) => {
                setSpecialtyFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-droid-arabic-kufi"
            >
              <option value="">جميع التخصصات</option>
              {specialties.map(specialty => (
                <option key={specialty.id} value={specialty.id}>{specialty.name}</option>
              ))}
            </select>

            {/* Reset Button */}
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-droid-arabic-kufi font-semibold"
            >
              إعادة تعيين
            </button>
          </div>

          {/* Per Page Selector */}
          <div className="mt-4 flex items-center gap-3">
            <span className="text-sm text-gray-600 font-droid-arabic-kufi">عدد النتائج في الصفحة:</span>
            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-droid-arabic-kufi"
            >
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-600 font-droid-arabic-kufi">جاري التحميل...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Patients Table */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900 font-droid-arabic-kufi">
                    المرضى ({appointments.length})
                  </h3>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 font-droid-arabic-kufi">الرقم</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 font-droid-arabic-kufi">الاسم الكامل</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 font-droid-arabic-kufi">الجنس</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 font-droid-arabic-kufi">تاريخ الميلاد</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 font-droid-arabic-kufi">الهاتف</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 font-droid-arabic-kufi">الموقع</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 font-droid-arabic-kufi">التخصص</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 font-droid-arabic-kufi">الموعد</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 font-droid-arabic-kufi">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {appointments.map((apt) => {
                      const statusConfig = STATUS_CONFIG[apt.status];
                      const StatusIcon = statusConfig?.icon || Clock;
                      return (
                        <tr key={apt.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-right font-droid-arabic-kufi text-sm text-gray-900 font-semibold">
                            {apt.id}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <span className="font-droid-arabic-kufi text-sm font-semibold text-gray-900">
                                {apt.full_name}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center font-droid-arabic-kufi text-sm text-gray-600">
                            {apt.sex === '0' ? 'ذكر' : 'أنثى'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Calendar className="w-3 h-3 text-gray-400" />
                              <span className="font-droid-arabic-kufi text-xs text-gray-600">
                                {apt.birthday}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Phone className="w-3 h-3 text-gray-400" />
                              <span className="font-droid-arabic-kufi text-xs text-gray-600">
                                {apt.phone}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-gray-400" />
                              <span className="font-droid-arabic-kufi text-xs text-gray-600">
                                {apt.city}, {apt.state}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center gap-1">
                              <Stethoscope className="w-3 h-3 text-gray-400" />
                              <span className="font-droid-arabic-kufi text-xs text-gray-600">
                                {apt.event_specialty?.specialty?.name || '-'}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center font-droid-arabic-kufi text-xs text-gray-600">
                            {apt.day?.name} - {apt.hour?.time}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold font-droid-arabic-kufi ${statusConfig?.color}`}>
                              <StatusIcon className="w-3 h-3" />
                              {statusConfig?.label || apt.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {appointments.length === 0 && (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 font-droid-arabic-kufi">لا توجد نتائج</p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2 no-print">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {[...Array(totalPages)].map((_, index) => {
                  const page = index + 1;
                  // Show first page, last page, current page, and pages around current
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-4 py-2 rounded-lg font-droid-arabic-kufi font-semibold transition-colors ${
                          currentPage === page
                            ? 'bg-indigo-600 text-white'
                            : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  } else if (page === currentPage - 2 || page === currentPage + 2) {
                    return <span key={page} className="px-2">...</span>;
                  }
                  return null;
                })}

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <style jsx>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
};

export default PatientsList;