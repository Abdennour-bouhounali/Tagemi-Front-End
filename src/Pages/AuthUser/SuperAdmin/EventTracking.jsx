import React, { useState, useEffect, useContext } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { AppContext } from "../../../Context/AppContext";
import {
  Calendar,
  Users,
  CheckCircle,
  ClipboardList,
  Activity,
  ArrowLeft,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  BarChart3,
  PieChart,
  Archive,
  FileText,
  UserCheck,
  MapPin,
} from "lucide-react";

const apiUrl = import.meta.env.VITE_API_URL;

const EventTracking = () => {
  const { eventId } = useParams();
  const { token, user } = useContext(AppContext);
  const navigate = useNavigate();
  
  const [event, setEvent] = useState(null);
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isWaitingListOpen, setIsWaitingListOpen] = useState(false);

  useEffect(() => {
    if (eventId) {
      fetchEventDetails();
      fetchEventSpecialties();
    }
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const fetchEventSpecialties = async () => {
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

  // Active event tracking pages
  const activeTrackingPages = [
    {
      title: "التحقق من الحضور",
      description: "تتبع حضور المرضى وتحديث حالة المواعيد",
      icon: CheckCircle,
      path: `/admin/check-presence/${eventId}`,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      textColor: "text-green-600",
    },
    {
      title: "لائحة الإنتظار الكبيرة",
      description: "عرض أول عشر مواعيد من كل تخصص",
      icon: ClipboardList,
      path: `/admin/big-list-waiting/${eventId}`,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
    },
    {
      title: "توزيع المواعيد",
      description: "عرض توزيع المواعيد حسب التخصص والوقت",
      icon: PieChart,
      path: `/admin/appointment-distribution/${eventId}`,
      color: "from-indigo-500 to-indigo-600",
      bgColor: "bg-indigo-50",
      textColor: "text-indigo-600",
    },
    {
      title: "إحصائيات الحدث",
      description: "تقارير وإحصائيات مفصلة عن الحدث",
      icon: Activity,
      path: `/admin/event-statistics/${eventId}`,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      textColor: "text-purple-600",
    }
  ];

  // Archived event statistics pages (Read-only)
  const archivedStatisticsPages = [
    {
      title: "إحصائيات التخصصات",
      description: "توزيع المواعيد حسب التخصصات الطبية",
      icon: BarChart3,
      path: `/admin/archived/specialty-stats/${eventId}`,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
    },
    {
      title: "إحصائيات الحالات",
      description: "توزيع المواعيد حسب الحالة (مكتمل، ملغي، غائب)",
      icon: PieChart,
      path: `/admin/archived/status-stats/${eventId}`,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      textColor: "text-green-600",
    },
    {
      title: "إحصائيات ديموغرافية",
      description: "توزيع المرضى حسب العمر والجنس",
      icon: Users,
      path: `/admin/archived/demographic-stats/${eventId}`,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      textColor: "text-purple-600",
    },
    {
      title: "إحصائيات جغرافية",
      description: "توزيع المرضى حسب الولاية والمدينة",
      icon: MapPin,
      path: `/admin/archived/geographic-stats/${eventId}`,
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50",
      textColor: "text-orange-600",
    },
    {
      title: "قائمة المرضى الكاملة",
      description: "عرض جميع بيانات المرضى والمواعيد",
      icon: FileText,
      path: `/admin/archived/patients-list/${eventId}`,
      color: "from-indigo-500 to-indigo-600",
      bgColor: "bg-indigo-50",
      textColor: "text-indigo-600",
    },
    {
      title: "تقرير شامل",
      description: "تقرير مفصل يحتوي على جميع الإحصائيات",
      icon: Activity,
      path: `/admin/archived/comprehensive-report/${eventId}`,
      color: "from-red-500 to-red-600",
      bgColor: "bg-red-50",
      textColor: "text-red-600",
    }
  ];

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

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <div className="flex items-center gap-3 mb-3">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <h3 className="text-lg font-bold text-red-800 font-droid-arabic-kufi">خطأ</h3>
          </div>
          <p className="text-red-700 font-droid-arabic-kufi">{error}</p>
          <Link
            to="/"
            className="mt-4 inline-flex items-center gap-2 text-red-600 hover:text-red-700 font-droid-arabic-kufi"
          >
            <ArrowLeft className="w-4 h-4" />
            العودة إلى الصفحة الرئيسية
          </Link>
        </div>
      </div>
    );
  }

  const trackingPages = event?.is_archived ? archivedStatisticsPages : activeTrackingPages;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 via-blue-50 to-white">
      <div className="w-screen max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-10">

        {/* Header Section */}
        <div className="mb-8">
          <Link
            to="/home"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 font-droid-arabic-kufi transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            العودة إلى الصفحة الرئيسية
          </Link>

          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2 font-droid-arabic-kufi">
                  {event?.is_archived ? "أرشيف الحدث" : "متابعة الحدث"}
                </h1>
                <p className="text-xl text-gray-600 font-droid-arabic-kufi">
                  {event?.name}
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                {event?.is_active && !event?.is_archived && (
                  <span className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold font-droid-arabic-kufi flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    حدث نشط
                  </span>
                )}
                {event?.is_archived && (
                  <span className="bg-amber-100 text-amber-700 px-4 py-2 rounded-full text-sm font-semibold font-droid-arabic-kufi flex items-center gap-2">
                    <Archive className="w-4 h-4" />
                    مؤرشف
                  </span>
                )}
              </div>
            </div>

            {event?.is_archived && (
              <div className="mt-4 pt-4 border-t border-amber-100 bg-amber-50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-amber-800 font-droid-arabic-kufi font-semibold mb-1">
                      حدث مؤرشف
                    </p>
                    <p className="text-sm text-amber-700 font-droid-arabic-kufi">
                      هذا الحدث مؤرشف ويمكن عرض الإحصائيات والتقارير فقط. لا يمكن إجراء أي تعديلات.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {event?.description && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-gray-600 font-droid-arabic-kufi">{event.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Tracking/Statistics Cards Grid */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className={`${event?.is_archived ? 'bg-amber-100' : 'bg-blue-100'} w-10 h-10 rounded-lg flex items-center justify-center`}>
              {event?.is_archived ? (
                <Archive className={`w-5 h-5 ${event?.is_archived ? 'text-amber-600' : 'text-blue-600'}`} />
              ) : (
                <Activity className="w-5 h-5 text-blue-600" />
              )}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 font-droid-arabic-kufi">
              {event?.is_archived ? "الإحصائيات والتقارير" : "أدوات المتابعة"}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trackingPages.map((page, index) => (
              <Link
                key={index}
                to={page.path}
                className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-200 transform hover:-translate-y-1"
              >
                <div className={`h-2 bg-gradient-to-r ${page.color}`}></div>
                
                <div className="p-6">
                  <div className={`${page.bgColor} w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <page.icon className={`w-7 h-7 ${page.textColor}`} />
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-2 font-droid-arabic-kufi group-hover:text-blue-600 transition-colors">
                    {page.title}
                  </h3>

                  <p className="text-gray-600 text-sm font-droid-arabic-kufi leading-relaxed">
                    {page.description}
                  </p>

                  <div className="mt-4 flex items-center text-blue-600 font-semibold text-sm font-droid-arabic-kufi group-hover:gap-3 transition-all">
                    <span>{event?.is_archived ? "عرض" : "الانتقال"}</span>
                    <ArrowLeft className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Waiting Lists Section - Only for active events */}
        {!event?.is_archived && user && [1, 4, 6].includes(user.role_id) && specialties.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden mb-6">
            <button
              onClick={() => setIsWaitingListOpen(!isWaitingListOpen)}
              className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="bg-indigo-50 w-14 h-14 rounded-xl flex items-center justify-center">
                  <ClipboardList className="w-7 h-7 text-indigo-600" />
                </div>
                <div className="text-right">
                  <h3 className="text-xl font-bold text-gray-900 font-droid-arabic-kufi">
                    قوائم الانتظار
                  </h3>
                  <p className="text-sm text-gray-600 font-droid-arabic-kufi">
                    إدارة قوائم الانتظار للتخصصات المختلفة
                  </p>
                </div>
              </div>
              {isWaitingListOpen ? (
                <ChevronUp className="w-6 h-6 text-gray-600" />
              ) : (
                <ChevronDown className="w-6 h-6 text-gray-600" />
              )}
            </button>

            {isWaitingListOpen && (
              <div className="border-t border-gray-100 bg-gradient-to-br from-gray-50 to-indigo-50 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {specialties
                    .filter((specialty) => specialty.id !== 6)
                    .map((specialty) => (
                      <Link
                        key={specialty.id}
                        to={`/admin/event-waiting-lists/${eventId}/${specialty.id}`}
                        className="group flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all duration-300"
                      >
                        <div className="bg-indigo-100 w-10 h-10 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                          <ClipboardList className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-gray-900 font-droid-arabic-kufi group-hover:text-indigo-600 transition-colors">
                            {specialty.name}
                          </h4>
                          <p className="text-xs text-gray-500 font-droid-arabic-kufi">
                            قائمة الانتظار
                          </p>
                        </div>
                        <ArrowLeft className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                      </Link>
                    ))}
                </div>

                {specialties.filter(s => s.id !== 6).length === 0 && (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 font-droid-arabic-kufi">
                      لا توجد تخصصات متاحة لهذا الحدث
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Event Info Footer */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4 font-droid-arabic-kufi">
            معلومات الحدث
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 font-droid-arabic-kufi mb-1">رقم الحدث</p>
              <p className="text-2xl font-bold text-gray-900 font-droid-arabic-kufi">
                #{event?.id}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 font-droid-arabic-kufi mb-1">الحالة</p>
              <p className="text-lg font-semibold text-gray-900 font-droid-arabic-kufi">
                {event?.is_archived ? "مؤرشف" : event?.is_active ? "نشط" : "غير نشط"}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 font-droid-arabic-kufi mb-1">تاريخ الإنشاء</p>
              <p className="text-lg font-semibold text-gray-900 font-droid-arabic-kufi">
                {event?.created_at ? new Date(event.created_at).toLocaleDateString('en-UK') : '-'}
              </p>
            </div>
          </div>

          {specialties.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 font-droid-arabic-kufi">
                  عدد التخصصات المتاحة:
                </span>
                <span className="text-lg font-bold text-indigo-600 font-droid-arabic-kufi">
                  {specialties.length}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventTracking;