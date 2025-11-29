import { useContext, useState } from "react";
import { AppContext } from "../../../../Context/AppContext";
import { 
  Eye, Archive, CheckCircle, X, Users, Edit, Link as LinkIcon, 
  Copy, Info, ExternalLink, RefreshCw, TrendingUp, Calendar, Clock
} from "lucide-react";
import EventAdminsManager from "./EventAdminsManager";
import EditEvent from "./EditEvent";
import EventDetails from "./EventDetails";
import { Link } from "react-router-dom";
import { FileText } from "lucide-react"; // Add FileText import

const apiUrl = import.meta.env.VITE_API_URL;

export default function Events({ events, getEvents, onViewDetails }) {
  const { token } = useContext(AppContext);
  const [loading, setLoading] = useState({});
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  
  // Panel states
  const [showAdminsPanel, setShowAdminsPanel] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [copiedEventId, setCopiedEventId] = useState(null);
  const [eventStats, setEventStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Set event as active
  async function handleSetActive(eventId) {
    setLoading((prev) => ({ ...prev, [eventId]: true }));

    try {
      const res = await fetch(`${apiUrl}/api/events/${eventId}/set-active`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("تم تعيين الحدث كحدث حالي بنجاح");
        setMessageType("success");
        getEvents();
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage(data.message || "حدث خطأ");
        setMessageType("error");
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (error) {
      console.error("Error setting active event:", error);
      setMessage("حدث خطأ في الاتصال");
      setMessageType("error");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setLoading((prev) => ({ ...prev, [eventId]: false }));
    }
  }

  // Archive event with appointments
  async function handleArchive(event) {
    // Get event statistics first to show in confirmation
    try {
      const statsRes = await fetch(`${apiUrl}/api/${event.id}/statistics`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      const stats = await statsRes.json();
      const appointmentsCount = stats.total_appointments || 0;
      
      const confirmMessage = appointmentsCount > 0 
        ? `هل أنت متأكد من أرشفة هذا الحدث؟\n\nسيتم أرشفة ${appointmentsCount} موعد مع هذا الحدث.\n\nملاحظة: يمكنك استعادة الحدث والمواعيد لاحقاً.`
        : `هل أنت متأكد من أرشفة هذا الحدث؟`;

      if (!window.confirm(confirmMessage)) {
        return;
      }

      setLoading((prev) => ({ ...prev, [event.id]: true }));

      const res = await fetch(`${apiUrl}/api/events/${event.id}/archive`, {
        method: "PATCH", // Changed from POST to PATCH
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const archivedCount = data.archived_appointments || appointmentsCount;
        setMessage(
          `تم أرشفة الحدث بنجاح${archivedCount > 0 ? ` مع ${archivedCount} موعد` : ''}`
        );
        setMessageType("success");
        getEvents();
        setTimeout(() => setMessage(""), 5000);
      } else {
        setMessage(data.message || "حدث خطأ أثناء الأرشفة");
        setMessageType("error");
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (error) {
      console.error("Error archiving event:", error);
      setMessage("حدث خطأ في الاتصال");
      setMessageType("error");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setLoading((prev) => ({ ...prev, [event.id]: false }));
    }
  }


  // Get event statistics
  async function handleViewStatistics(event) {
    setSelectedEvent(event);
    setShowStatsModal(true);
    setLoadingStats(true);

    try {
      const res = await fetch(`${apiUrl}/api/events/${event.id}/statistics`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      setEventStats(data);
    } catch (error) {
      console.error("Error fetching statistics:", error);
      setMessage("حدث خطأ في تحميل الإحصائيات");
      setMessageType("error");
    } finally {
      setLoadingStats(false);
    }
  }

  // Copy appointment link
  const copyAppointmentLink = (eventId) => {
    const link = `${window.location.origin}/appointment/${eventId}`;
    navigator.clipboard.writeText(link);
    setCopiedEventId(eventId);
    setTimeout(() => setCopiedEventId(null), 2000);
  };

    const copyEvaluationLink = (eventId) => {
    const link = `${window.location.origin}/evaluation/${eventId}`;
    navigator.clipboard.writeText(link);
    setCopiedEventId(eventId);
    setTimeout(() => setCopiedEventId(null), 2000);
  };

  // Open modals/panels
  const handleViewAdmins = (event) => {
    setSelectedEvent(event);
    setShowAdminsPanel(true);
  };

  const handleEditEvent = (event) => {
    setSelectedEvent(event);
    setShowEditModal(true);
  };

  const handleViewDetails = (event) => {
    setSelectedEvent(event);
    setShowDetailsModal(true);
  };

  // Close modals/panels
  const closeAllModals = () => {
    setShowAdminsPanel(false);
    setShowEditModal(false);
    setShowDetailsModal(false);
    setShowStatsModal(false);
    setSelectedEvent(null);
    setEventStats(null);
  };

  // Get status badge
  const getStatusBadge = (event) => {
    if (event.is_active) {
      return (
        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-bold font-droid-arabic-kufi flex items-center gap-1">
          <CheckCircle className="w-4 h-4" />
          حدث حالي
        </span>
      );
    }
    
    if (event.is_archived) {
      return (
        <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-bold font-droid-arabic-kufi flex items-center gap-1">
          <Archive className="w-4 h-4" />
          مؤرشف
        </span>
      );
    }

    // Check if ended
    const endDate = new Date(event.end_date);
    const now = new Date();
    if (endDate < now) {
      return (
        <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-bold font-droid-arabic-kufi flex items-center gap-1">
          <Clock className="w-4 h-4" />
          منتهي
        </span>
      );
    }

    return (
      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-bold font-droid-arabic-kufi">
        غير نشط
      </span>
    );
  };

  // Show admin panel
  if (showAdminsPanel && selectedEvent) {
    return (
      <div className="w-full">
        <div className="mb-6 flex items-center justify-between bg-white p-4 rounded-lg shadow">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 font-droid-arabic-kufi">
              {selectedEvent.name}
            </h2>
            <p className="text-gray-600 font-droid-arabic-kufi">
              التاريخ: {new Date(selectedEvent.date).toLocaleDateString("ar-DZ")}
            </p>
          </div>
          <button
            onClick={closeAllModals}
            className="flex items-center gap-2 px-4 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded-lg font-droid-arabic-kufi transition"
          >
            <X size={20} />
            رجوع
          </button>
        </div>

        <EventAdminsManager 
          eventId={selectedEvent.id} 
          eventName={selectedEvent.name}
          onRefresh={getEvents}
        />
      </div>
    );
  }

  return (
    <div className="w-full">
      {message && (
        <div
          className={`mb-4 p-4 border rounded-lg font-droid-arabic-kufi shadow-md animate-slide-in ${
            messageType === "success"
              ? "bg-green-50 border-green-400 text-green-800"
              : messageType === "error"
              ? "bg-red-50 border-red-400 text-red-800"
              : "bg-blue-50 border-blue-400 text-blue-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {messageType === "success" && <CheckCircle className="w-5 h-5" />}
            {messageType === "error" && <X className="w-5 h-5" />}
            {messageType === "info" && <Info className="w-5 h-5" />}
            {message}
          </div>
        </div>
      )}

      <div className="overflow-x-auto bg-white shadow-lg rounded-lg">
        <table className="w-full text-center border-collapse">
          <thead className="bg-gradient-to-r from-blue-100 to-indigo-100">
            <tr>
              <th className="px-4 py-3 font-bold text-gray-800 font-droid-arabic-kufi border-b">
                اسم الحدث
              </th>
              <th className="px-4 py-3 font-bold text-gray-800 font-droid-arabic-kufi border-b">
                تاريخ البداية
              </th>
              <th className="px-4 py-3 font-bold text-gray-800 font-droid-arabic-kufi border-b">
                تاريخ النهاية
              </th>
              <th className="px-4 py-3 font-bold text-gray-800 font-droid-arabic-kufi border-b">
                الحالة
              </th>
              <th className="px-4 py-3 font-bold text-gray-800 font-droid-arabic-kufi border-b">
                التخصصات
              </th>
              <th className="px-4 py-3 font-bold text-gray-800 font-droid-arabic-kufi border-b">
                الإجراءات
              </th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
              <tr>
                <td
                  colSpan="6"
                  className="px-4 py-8 text-gray-500 font-droid-arabic-kufi"
                >
                  لا توجد أحداث
                </td>
              </tr>
            ) : (
              events.map((event) => (
                <tr
                  key={event.id}
                  className="border-b hover:bg-gray-50 transition"
                >
                  <td className="px-4 py-3 font-droid-arabic-kufi font-semibold text-gray-800">
                    {event.name}
                  </td>
                  <td className="px-4 py-3 font-droid-arabic-kufi text-gray-600">
                    {new Date(event.start_date || event.date).toLocaleDateString("ar-DZ")}
                  </td>
                  <td className="px-4 py-3 font-droid-arabic-kufi text-gray-600">
                    {event.end_date 
                      ? new Date(event.end_date).toLocaleDateString("ar-DZ")
                      : '-'
                    }
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      {getStatusBadge(event)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                      {event.event_specialties_count || 0}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      {/* Statistics Button */}
                      {/* <button
                        onClick={() => handleViewStatistics(event)}
                        className="flex items-center gap-1 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-droid-arabic-kufi transition"
                        title="عرض الإحصائيات"
                      >
                        <TrendingUp className="w-4 h-4" />
                        الإحصائيات
                      </button> */}

                      {/* Copy Link Button */}
                      {!event.is_archived && (
                        <button
                          onClick={() => copyAppointmentLink(event.id)}
                          className="flex items-center gap-1 px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-droid-arabic-kufi transition"
                          title="نسخ رابط التسجيل"
                        >
                          {copiedEventId === event.id ? (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              تم النسخ
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              نسخ الرابط
                            </>
                          )}
                        </button>
                      )}

                                            {/* Copy Link Button */}
                      {!event.is_archived && (
                        <button
                          onClick={() => copyEvaluationLink(event.id)}
                          className="flex items-center gap-1 px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-droid-arabic-kufi transition"
                          title="نسخ رابط التقييم"
                        >
                          {copiedEventId === event.id ? (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              تم النسخ
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              نسخ الرابط
                            </>
                          )}
                        </button>
                      )}

                      {/* Details Button */}
                      <button
                        onClick={() => handleViewDetails(event)}
                        className="flex items-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-droid-arabic-kufi transition"
                        title="عرض التفاصيل"
                      >
                        <Info className="w-4 h-4" />
                        التفاصيل
                      </button>

                      {/* Edit Button */}
                      {!event.is_archived && (
                        <button
                          onClick={() => handleEditEvent(event)}
                          className="flex items-center gap-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-droid-arabic-kufi transition"
                          title="تعديل الحدث"
                        >
                          <Edit className="w-4 h-4" />
                          تعديل
                        </button>
                      )}

                      {/* View Admins Button */}
                      <button
                        onClick={() => handleViewAdmins(event)}
                        className="flex items-center gap-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-droid-arabic-kufi transition"
                        title="عرض المسؤولين"
                      >
                        <Users className="w-4 h-4" />
                        المسؤولين
                      </button>

                      {/* Set Active Button */}
                      {!event.is_archived && (
                        <button
                          onClick={() => handleSetActive(event.id)}
                          disabled={loading[event.id]}
                          className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-droid-arabic-kufi transition ${
                            loading[event.id]
                              ? "bg-gray-400 cursor-not-allowed"
                              : event.is_active == 1 ? "bg-orange-600 hover:bg-orange-700 text-white" : "bg-green-600 hover:bg-green-700 text-white"
                          }`}
                        >
                          <CheckCircle className="w-4 h-4" />
                          {loading[event.id] ? "جاري..." : event.is_active == 0 ? "تفعيل" : "إيقاف"}
                        </button>
                      )}


                      {/* Archive Button */}
                      {!event.is_archived && (
                        <button
                          onClick={() => handleArchive(event)}
                          disabled={loading[event.id]}
                          className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-droid-arabic-kufi transition ${
                            loading[event.id]
                              ? "bg-gray-400 cursor-not-allowed"
                              : "bg-orange-600 hover:bg-orange-700 text-white"
                          }`}
                        >
                          <Archive className="w-4 h-4" />
                          {loading[event.id] ? "جاري..." : "أرشفة"}
                        </button>
                      )}

                      {/* Restore Button */}
                  {event.is_archived && ( <>
                    <Link 
                      to={`/admin/archived/comprehensive-report/${event.id}`}
                      className="flex items-center gap-1 px-3 py-2 bg-yellow-500 text-white  hover:bg-yellow-600  rounded-lg text-sm font-droid-arabic-kufi transition"
                    >
                      <FileText className="w-4 h-4" />
                      تقرير إحصائي
                    </Link>
                    <Link 
                      to={`/admin/event-report/${event.id}`}
                      className="flex items-center gap-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-droid-arabic-kufi transition"
                      title="تقرير الحدث الشامل"
                    >
                      <FileText className="w-4 h-4" />
                      تقرير الحدث
                    </Link></>
                  )}
                      <Link 
                      to={`/admin/evaluation_stats/${event.id}`}
                      className="flex items-center gap-1 px-3 py-2 bg-blue-500 text-white  hover:bg-blue-600  rounded-lg text-sm font-droid-arabic-kufi transition"
                    >
                      <FileText className="w-4 h-4" />
                      تقييم المستفيدين
                    </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {showEditModal && selectedEvent && (
        <EditEvent
          event={selectedEvent}
          onClose={closeAllModals}
          onSuccess={getEvents}
        />
      )}

      {showDetailsModal && selectedEvent && (
        <EventDetails
          event={selectedEvent}
          onClose={closeAllModals}
        />
      )}

     

      <style>{`
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}