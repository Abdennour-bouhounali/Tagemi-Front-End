import { useState, useContext, useEffect } from "react";
import { API_BASE_URL } from '../../../../config/environment';
import { X, Calendar, MapPin, Users, Clock, Link as LinkIcon, Copy, CheckCircle, Eye, Monitor } from "lucide-react";
import { AppContext } from "../../../../Context/AppContext";

const apiUrl = API_BASE_URL;

const  EventDetails = ({ event, onClose }) => {
  const { token } = useContext(AppContext);
  const [eventDetails, setEventDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copiedWaitingList, setCopiedWaitingList] = useState(false);

  useEffect(() => {
    fetchEventDetails();
  }, [event.id]);

  async function fetchEventDetails() {
    try {
      const res = await fetch(`${apiUrl}/api/events/${event.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        const data = await res.json();
        setEventDetails(data.event);
      }
    } catch (error) {
      console.error("Error fetching event details:", error);
    } finally {
      setLoading(false);
    }
  }

  const appointmentLink = `${window.location.origin}/appointment/${event.id}`;
  const waitingListLink = `${window.location.origin}/waiting-list/${event.id}`;

  const copyLink = () => {
    navigator.clipboard.writeText(appointmentLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyWaitingListLink = () => {
    navigator.clipboard.writeText(waitingListLink);
    setCopiedWaitingList(true);
    setTimeout(() => setCopiedWaitingList(false), 2000);
  };

  // Helper function to get unique days across all specialties
  const getUniqueDays = () => {
    if (!eventDetails?.event_specialties) return [];
    
    const allDays = eventDetails.event_specialties.flatMap(es => es.days || []);
    const uniqueDaysMap = new Map();
    
    allDays.forEach(day => {
      if (day.day_date && !uniqueDaysMap.has(day.day_date)) {
        uniqueDaysMap.set(day.day_date, day);
      }
    });
    
    return Array.from(uniqueDaysMap.values()).sort((a, b) => 
      new Date(a.day_date) - new Date(b.day_date)
    );
  };

  // Helper function to get unique days for a specific specialty
  const getUniqueDaysForSpecialty = (days) => {
    if (!days || days.length === 0) return [];
    
    const uniqueDaysMap = new Map();
    
    days.forEach(day => {
      if (day.day_date && !uniqueDaysMap.has(day.day_date)) {
        uniqueDaysMap.set(day.day_date, day);
      }
    });
    
    return Array.from(uniqueDaysMap.values()).sort((a, b) => 
      new Date(a.day_date) - new Date(b.day_date)
    );
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-droid-arabic-kufi">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  const uniqueDays = getUniqueDays();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h2 className="text-3xl font-bold font-droid-arabic-kufi mb-2">
                {eventDetails?.name}
              </h2>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar size={16} />
                  <span>{new Date(eventDetails?.date).toLocaleDateString("ar-DZ")}</span>
                </div>
                {eventDetails?.place && (
                  <div className="flex items-center gap-2">
                    <MapPin size={16} />
                    <span>{eventDetails.place}</span>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition"
            >
              <X size={24} />
            </button>
          </div>

          {/* Status Badge */}
          <div className="mt-4">
            {eventDetails?.is_current ? (
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 rounded-full text-sm font-bold">
                <CheckCircle size={16} />
                حدث حالي
              </span>
            ) : eventDetails?.is_archived ? (
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-gray-500 rounded-full text-sm font-bold">
                <Eye size={16} />
                مؤرشف
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500 rounded-full text-sm font-bold">
                <Clock size={16} />
                غير نشط
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Links Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Appointment Link */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
              <label className="block text-sm font-bold text-blue-900 mb-2 font-droid-arabic-kufi items-center gap-2">
                <LinkIcon size={16} />
                رابط التسجيل
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={appointmentLink}
                  readOnly
                  className="flex-1 p-3 bg-white border border-blue-300 rounded-lg font-mono text-xs"
                />
                <button
                  onClick={copyLink}
                  className="flex items-center gap-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-droid-arabic-kufi text-sm"
                >
                  {copied ? (
                    <>
                      <CheckCircle size={18} />
                      تم
                    </>
                  ) : (
                    <>
                      <Copy size={18} />
                      نسخ
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-blue-700 mt-2 font-droid-arabic-kufi">
                شارك هذا الرابط مع المرضى للتسجيل في الحدث
              </p>
            </div>

            {/* Waiting List Link */}
            <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
              <label className="block text-sm font-bold text-purple-900 mb-2 font-droid-arabic-kufi items-center gap-2">
                <Monitor size={16} />
                قاعة الانتظار الكبيرة
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={waitingListLink}
                  readOnly
                  className="flex-1 p-3 bg-white border border-purple-300 rounded-lg font-mono text-xs"
                />
                <button
                  onClick={copyWaitingListLink}
                  className="flex items-center gap-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition font-droid-arabic-kufi text-sm"
                >
                  {copiedWaitingList ? (
                    <>
                      <CheckCircle size={18} />
                      تم
                    </>
                  ) : (
                    <>
                      <Copy size={18} />
                      نسخ
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-purple-700 mt-2 font-droid-arabic-kufi">
                رابط شاشة العرض لقاعة الانتظار
              </p>
            </div>
          </div>

          {/* Description */}
          {eventDetails?.description && (
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-2 font-droid-arabic-kufi">
                الوصف
              </h3>
              <p className="text-gray-600 font-droid-arabic-kufi bg-gray-50 p-4 rounded-lg">
                {eventDetails.description}
              </p>
            </div>
          )}

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {eventDetails?.event_specialties?.length || 0}
              </div>
              <div className="text-sm text-blue-800 font-droid-arabic-kufi">
                التخصصات
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
              <div className="text-3xl font-bold text-green-600 mb-1">
                {eventDetails?.event_specialties?.reduce((sum, es) => 
                  sum + (es.appointments?.length || 0), 0) || 0}
              </div>
              <div className="text-sm text-green-800 font-droid-arabic-kufi">
                المواعيد
              </div>
            </div>

            {/* FIXED: Unique days count */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
              <div className="text-3xl font-bold text-purple-600 mb-1">
                {uniqueDays.length}
              </div>
              <div className="text-sm text-purple-800 font-droid-arabic-kufi">
                الأيام
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
              <div className="text-3xl font-bold text-orange-600 mb-1">
                {eventDetails?.event_specialties?.reduce((sum, es) => 
                  sum + es.days?.reduce((daySum, day) => 
                    daySum + (day.hours?.length || 0), 0), 0) || 0}
              </div>
              <div className="text-sm text-orange-800 font-droid-arabic-kufi">
                الساعات
              </div>
            </div>
          </div>

          {/* Specialties */}
        {eventDetails?.event_specialties && eventDetails.event_specialties.length > 0 && (
  <div>
    <h3 className="text-lg font-bold text-gray-800 mb-3 font-droid-arabic-kufi flex items-center gap-2">
      <Users size={20} />
      التخصصات
    </h3>
    <div className="space-y-3">
      {eventDetails.event_specialties.map((es, index) => {
        // Get unique days for this specialty
        const uniqueSpecialtyDays = getUniqueDaysForSpecialty(es.days);
        
        return (
        <div 
          key={index} 
          className="bg-gray-50 border border-gray-200 rounded-lg p-4"
        >
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-bold text-gray-800 font-droid-arabic-kufi">
                {es.specialty?.name || 'غير محدد'}
              </h4>
              
              {/* ADD THIS - Display description if exists */}
              {es.description && (
                <p className="text-sm text-gray-600 mt-2 font-droid-arabic-kufi bg-blue-50 p-2 rounded border border-blue-100">
                  {es.description}
                </p>
              )}
              
              <p className="text-sm text-gray-600 mt-1 font-droid-arabic-kufi">
                الأيام: {uniqueSpecialtyDays.length}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {es.appointments?.length || 0}
              </div>
              <div className="text-xs text-gray-500 font-droid-arabic-kufi">
                مواعيد
              </div>
            </div>
          </div>

          {/* Days section - FIXED: Show only unique days */}
          {uniqueSpecialtyDays.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-300">
              <div className="flex flex-wrap gap-2">
                {uniqueSpecialtyDays.map((day, dayIndex) => (
                  <div 
                    key={day.day_date || dayIndex}
                    className="bg-white px-3 py-1 rounded border border-gray-300 text-xs"
                  >
                    <div className="font-semibold text-gray-700">
                      {new Date(day.day_date).toLocaleDateString("ar-DZ")}
                    </div>
                    <div className="text-gray-500 font-droid-arabic-kufi">
                      {day.hours?.length || 0} ساعات
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )})}
    </div>
  </div>
)}

          {/* Type and Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-600 mb-1 font-droid-arabic-kufi">
                نوع الحدث
              </div>
              <div className="text-lg font-bold text-gray-800">
                {eventDetails?.type || 'غير محدد'}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-600 mb-1 font-droid-arabic-kufi">
                تاريخ الإنشاء
              </div>
              <div className="text-lg font-bold text-gray-800">
                {new Date(eventDetails?.created_at).toLocaleDateString("ar-DZ")}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 p-4 rounded-b-2xl border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg font-bold font-droid-arabic-kufi transition"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
export default EventDetails;