import { useContext, useState } from "react";
import { AppContext } from "../../../../Context/AppContext";
import {
  Archive, CheckCircle, X, Users, Edit, Link as LinkIcon,
  Info, RefreshCw, TrendingUp, Calendar, Clock,
  FileText
} from "lucide-react";
import EventAdminsManager from "./EventAdminsManager";
import EditEvent from "./EditEvent";
import EventDetails from "./EventDetails";
import { API_BASE_URL } from '../../../../config/environment';
import { Link } from "react-router-dom";

const apiUrl = API_BASE_URL;

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

  // --- Logic Functions (Unchanged) ---
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

  async function handleArchive(event) {
    try {
      const statsRes = await fetch(`${apiUrl}/api/${event.id}/statistics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const stats = await statsRes.json();
      const appointmentsCount = stats.total_appointments || 0;
      const confirmMessage = appointmentsCount > 0
        ? `هل أنت متأكد من أرشفة هذا الحدث؟\n\nسيتم أرشفة ${appointmentsCount} موعد مع هذا الحدث.\n\nملاحظة: يمكنك استعادة الحدث والمواعيد لاحقاً.`
        : `هل أنت متأكد من أرشفة هذا الحدث؟`;

      if (!window.confirm(confirmMessage)) return;

      setLoading((prev) => ({ ...prev, [event.id]: true }));
      const res = await fetch(`${apiUrl}/api/events/${event.id}/archive`, {
        method: "PATCH",
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

  async function handleViewStatistics(event) {
    setSelectedEvent(event);
    setShowStatsModal(true);
    setLoadingStats(true);
    try {
      const res = await fetch(`${apiUrl}/api/events/${event.id}/statistics`, {
        headers: { Authorization: `Bearer ${token}` },
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

  const closeAllModals = () => {
    setShowAdminsPanel(false);
    setShowEditModal(false);
    setShowDetailsModal(false);
    setShowStatsModal(false);
    setSelectedEvent(null);
    setEventStats(null);
  };

  // --- Helpers for UI ---

  const getStatusBadge = (event) => {
    if (event.is_active) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-green-50 text-green-700 border border-green-200">
          <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>
          حدث حالي
        </span>
      );
    }
    if (event.is_archived) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
          <Archive className="w-3 h-3" />
          مؤرشف
        </span>
      );
    }
    const endDate = new Date(event.end_date);
    const now = new Date();
    if (endDate < now) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200">
          <Clock className="w-3 h-3" />
          منتهي
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
        غير نشط
      </span>
    );
  };

  // Shared Action Buttons Component for Reuse in Table and Card views
  const EventActions = ({ event }) => (
    <div className="flex items-center gap-2 text-right flex-wrap justify-end">
      {/* Primary Actions Group */}
      {!event.is_archived && (
        <>
          <button
            onClick={() => handleSetActive(event.id)}
            disabled={loading[event.id]}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors border ${
              loading[event.id]
                ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                : event.is_active == 1
                ? "bg-white text-orange-600 border-orange-200 hover:bg-orange-50"
                : "bg-green-600 text-white border-transparent hover:bg-green-700 shadow-sm"
            }`}
          >
             {loading[event.id] ? <RefreshCw className="w-3 h-3 animate-spin"/> : <CheckCircle className="w-3 h-3" />}
            {loading[event.id] ? "..." : event.is_active == 0 ? "تفعيل" : "إيقاف"}
          </button>
        </>
      )}

      {/* Secondary Actions (Icon only on mobile maybe, or standard) */}
      {!event.is_archived && (
        <>
        <button
          onClick={() => handleEditEvent(event)}
          className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
          title="تعديل الحدث"
        >
          <Edit className="w-4 h-4" />
        </button>
        
        <div className="h-4 w-px bg-gray-200 mx-1"></div>
        </>
      )}


      {/* Link Actions */}
      {!event.is_archived && (
        <>
            <button
            onClick={() => copyAppointmentLink(event.id)}
            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            title="نسخ رابط التسجيل"
            >
            {copiedEventId === event.id ? <CheckCircle className="w-4 h-4 text-green-500" /> : <LinkIcon className="w-4 h-4" />}
            </button>
            <button
            onClick={() => copyEvaluationLink(event.id)}
            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            title="نسخ رابط التقييم"
            >
            <FileText className="w-4 h-4" />
            </button>
        </>
      )}

      {/* Info Actions */}
      <button
        onClick={() => handleViewDetails(event)}
        className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
        title="التفاصيل"
      >
        <Info className="w-4 h-4" />
      </button>

      <button
        onClick={() => handleViewAdmins(event)}
        className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
        title="المسؤولين"
      >
        <Users className="w-4 h-4" />
      </button>
      
      {/* Archive Actions */}
      {!event.is_archived && (
        <button
          onClick={() => handleArchive(event)}
          disabled={loading[event.id]}
          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
          title="أرشفة"
        >
          <Archive className="w-4 h-4" />
        </button>
      )}

      {/* Archived Event Specific Actions */}
      {event.is_archived && (
        <div className="flex items-center gap-2">
           <div className="h-4 w-px bg-gray-200 mx-1"></div>
            <Link
                to={`/admin/archived/comprehensive-report/${event.id}`}
                className="text-xs text-blue-600 hover:underline"
            >
                تقرير إحصائي
            </Link>
             <Link
                to={`/admin/event-report/${event.id}`}
                className="text-xs text-blue-600 hover:underline"
            >
                تقرير شامل
            </Link>
        </div>
      )}
       <Link 
            to={`/admin/evaluation_stats/${event.id}`}
            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            title="إحصائيات التقييم"
        >
            <TrendingUp className="w-4 h-4" />
        </Link>
    </div>
  );


  // --- Render ---

  if (showAdminsPanel && selectedEvent) {
    return (
      <div className="w-full animate-in fade-in duration-200">
        <div className="mb-6 flex items-center justify-between bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div>
            <h2 className="text-xl  font-bold text-gray-800 font-droid-arabic-kufi">
              {selectedEvent.name}
            </h2>
            <div className="flex items-center gap-2 text-gray-500 text-sm mt-1 font-droid-arabic-kufi">
              <Calendar className="w-4 h-4"/>
              {new Date(selectedEvent.date).toLocaleDateString("ar-DZ")}
            </div>
          </div>
          <button
            onClick={closeAllModals}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-all"
          >
            <X size={18} />
            إغلاق
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
    <div className="w-full font-droid-arabic-kufi">
      {/* Messages */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-center gap-3 shadow-sm border animate-slide-in ${
            messageType === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : messageType === "error"
              ? "bg-red-50 border-red-200 text-red-800"
              : "bg-blue-50 border-blue-200 text-blue-800"
          }`}
        >
          {messageType === "success" && <CheckCircle className="w-5 h-5 flex-shrink-0" />}
          {messageType === "error" && <X className="w-5 h-5 flex-shrink-0" />}
          {messageType === "info" && <Info className="w-5 h-5 flex-shrink-0" />}
          <span className="text-sm font-medium">{message}</span>
        </div>
      )}

      {/* --- Desktop View (Table) --- */}
      <div className="hidden md:block bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-right">
          <thead>
            <tr className="bg-gray-50 border-b text-center border-gray-200">
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">اسم الحدث</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">التاريخ</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">الحالة</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">التخصصات</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {events.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-3">
                        <Calendar className="w-10 h-10 text-gray-300" />
                        <p>لا توجد أحداث مسجلة حالياً</p>
                    </div>
                </td>
              </tr>
            ) : (
              events.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50/80 text-right transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900 text-left text-sm">{event.name}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="text-sm text-gray-600 dir-rtl">
                        {new Date(event.start_date || event.date).toLocaleDateString("ar-DZ")}
                        {event.end_date && (
                             <span className="text-gray-400 mx-1">-</span>
                        )}
                         {event.end_date && new Date(event.end_date).toLocaleDateString("ar-DZ")}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {getStatusBadge(event)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold">
                      {event.event_specialties_count || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <EventActions event={event} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* --- Mobile View (Cards) --- */}
      <div className="md:hidden space-y-4">
        {events.length === 0 ? (
           <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
               <p className="text-gray-500">لا توجد أحداث</p>
           </div>
        ) : (
          events.map((event) => (
            <div key={event.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 space-y-4">
              {/* Header */}
              <div className="flex justify-between items-start gap-3">
                <div>
                  <h3 className="font-bold text-gray-900 line-clamp-2 text-right">{event.name}</h3>
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                         {new Date(event.start_date || event.date).toLocaleDateString("ar-DZ")}
                    </span>
                  </div>
                </div>
                <div>{getStatusBadge(event)}</div>
              </div>
              
              {/* Info Row */}
              <div className="flex items-center justify-between text-sm py-2 border-t border-b border-gray-50">
                 <span className="text-gray-500">عدد التخصصات:</span>
                 <span className="font-semibold text-gray-700">{event.event_specialties_count || 0}</span>
              </div>

              {/* Actions */}
              <div className="pt-2">
                 <EventActions event={event} />
              </div>
            </div>
          ))
        )}
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
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}