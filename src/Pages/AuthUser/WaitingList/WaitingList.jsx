import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from "../../../Context/AppContext";
import { useLocation, useParams, Link } from "react-router-dom";
import { ArrowLeft, RefreshCw, AlertCircle, Star, Clock } from 'lucide-react';

const apiUrl = import.meta.env.VITE_API_URL;

const WaitingList = () => {
  const { eventId } = useParams();
  
  const [event, setEvent] = useState(null);
  const [specialities, setSpecialities] = useState([]);
  const [waitingList, setWaitingList] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const { token } = useContext(AppContext);

  // Fetch event details
  async function getEventDetails() {
    try {
      const res = await fetch(`${apiUrl}/api/events/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) {
        setError('فشل في تحميل تفاصيل الحدث');
        return;
      }
      
      const data = await res.json();
      setEvent(data.event || data);
    } catch (error) {
      console.error('Error fetching event:', error);
      setError('حدث خطأ أثناء تحميل تفاصيل الحدث');
    }
  }

  // Fetch waiting list for specific event
  async function getWaitingList() {
    try {
      const res = await fetch(`${apiUrl}/api/waitinglist/getwaitinglist?event_id=${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) {
        console.error('Failed to fetch waiting list');
        setError('فشل في تحميل قائمة الإنتظار');
        return;
      }
      
      const data = await res.json();
      
      // The API returns { data: { specialty_id: [patients], ... } }
      if (data.data) {
        setWaitingList(data.data);
        setLastUpdated(new Date());
        setError("");
      } else {
        setWaitingList({});
      }
    } catch (error) {
      console.error('Error fetching waiting list:', error);
      setError('حدث خطأ أثناء تحميل قائمة الإنتظار');
    }
  }

  // Fetch specialities for this event
  async function getEventSpecialities() {
    try {
      const res = await fetch(`${apiUrl}/api/events/${eventId}/specialties`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) {
        console.error('Failed to fetch event specialities');
        return;
      }
      
      const data = await res.json();
      
      // Extract unique specialties from event_specialties
      const uniqueSpecialties = [];
      const seenIds = new Set();
      
      if (data.event_specialties) {
        data.event_specialties.forEach(es => {
          if (es.specialty && !seenIds.has(es.specialty.id)) {
            seenIds.add(es.specialty.id);
            uniqueSpecialties.push(es.specialty);
          }
        });
      }
      
      // Filter out NoSpeciality
      const filtered = uniqueSpecialties.filter(s => s.name !== 'NoSpeciality');
      setSpecialities(filtered);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching specialities:', error);
      setError('حدث خطأ أثناء تحميل التخصصات');
      setLoading(false);
    }
  }

  // Initial load
  useEffect(() => {
    if (token && eventId) {
      setLoading(true);
      getEventDetails();
      getEventSpecialities();
      getWaitingList();
    }
  }, [token, eventId]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (token && eventId) {
        getWaitingList();
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, [token, eventId]);

  // Manual refresh
  const handleRefresh = () => {
    getWaitingList();
  };

  // Check if patient is special case
  const isSpecialCase = (patient) => {
    if (!patient) return false;
    
    return (
      patient.is_special || 
      patient.is_priority || 
      patient.order === 0 ||
      patient.full_name?.includes('خاصة') || 
      patient.full_name?.includes('حالة')
    );
  };

  const maxRows = Math.max(...Object.values(waitingList).map(arr => arr?.length || 0), 0);

  if (loading) {
    return (
      <div className="w-screen min-h-screen bg-gradient-to-b from-blue-100 via-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-droid-arabic-kufi">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen min-h-screen bg-gradient-to-b from-blue-100 via-blue-50 to-white flex flex-col items-center py-10 px-4">
      {/* Back Button */}
      <div className="w-full max-w-7xl mb-4">
        <Link
          to={`/admin/event-tracking/${eventId}`}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 font-droid-arabic-kufi transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          العودة إلى متابعة الحدث
        </Link>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="w-full max-w-7xl mb-6 bg-red-50 border-r-4 border-red-500 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-700 font-droid-arabic-kufi">{error}</p>
          </div>
        </div>
      )}

      {/* Title Section */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-[#003366] font-droid-arabic-kufi">
            قائمة الإنتظار الكبيرة
          </h1>
          <button
            onClick={handleRefresh}
            className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
            title="تحديث"
          >
            <RefreshCw className="w-5 h-5 text-blue-600" />
          </button>
        </div>
        <p className="text-gray-600 text-sm font-droid-arabic-kufi mb-2">
          {event?.name || 'الحدث'}
        </p>
        <p className="text-gray-500 text-xs font-droid-arabic-kufi">
          عرض أول 10 مرضى من كل تخصص
        </p>
      </div>

      {/* Legend */}
      <div className="w-full max-w-7xl mb-6 flex items-center justify-center gap-6 text-sm font-droid-arabic-kufi">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-purple-600" />
          <span className="text-gray-700">حالة خاصة (أولوية)</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-green-500 animate-pulse" />
          <span className="text-gray-700">تحديث تلقائي كل 10 ثوانٍ</span>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto w-full px-4 sm:px-6 lg:px-8">
        <div className="inline-block min-w-full shadow-lg rounded-2xl bg-white border border-gray-200">
          <table className="min-w-full text-center border-collapse">
            <thead className="bg-gradient-to-r from-indigo-100 to-indigo-200">
              <tr>
                {specialities.length === 0 ? (
                  <th className="px-6 py-8 text-center text-gray-500 font-droid-arabic-kufi">
                    لا توجد تخصصات متاحة لهذا الحدث
                  </th>
                ) : (
                  specialities.map((speciality) => {
                    const count = waitingList[speciality.id]?.length || 0;
                    
                    return (
                      <th
                        key={speciality.id}
                        className="px-6 py-3 text-sm font-bold text-indigo-900 border-b border-gray-200 font-droid-arabic-kufi"
                      >
                        <span className="block mb-2 text-lg">{speciality.name}</span>
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>ID</span>
                          <span>الاسم الكامل</span>
                        </div>
                        <div className="text-xs text-indigo-600 font-semibold">
                          ({count} {count === 1 ? 'مريض' : 'مرضى'})
                        </div>
                      </th>
                    );
                  })
                )}
              </tr>
            </thead>
            <tbody className="bg-white">
              {specialities.length === 0 || maxRows === 0 ? (
                <tr>
                  <td 
                    colSpan={specialities.length || 1} 
                    className="px-6 py-8 text-center text-gray-500 font-droid-arabic-kufi"
                  >
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="font-semibold mb-1">لا توجد مواعيد في قائمة الإنتظار حالياً</p>
                    <p className="text-xs text-gray-400">سيتم عرض المرضى هنا عند تأكيد حضورهم</p>
                  </td>
                </tr>
              ) : (
                Array.from({ length: maxRows }).map((_, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className={`${
                      rowIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                    } hover:bg-indigo-50 transition-colors`}
                  >
                    {specialities.map((speciality) => {
                      const patients = waitingList[speciality.id] || [];
                      const patient = patients[rowIndex] || null;
                      const isSpecial = isSpecialCase(patient);
                      
                      return (
                        <td 
                          key={speciality.id} 
                          className={`px-6 py-4 border-b border-gray-200 font-droid-arabic-kufi transition-all ${
                            isSpecial ? 'bg-purple-50' : ''
                          }`}
                        >
                          {patient ? (
                            <div className="flex justify-between items-center">
                              <div className="w-1/3 text-sm font-semibold text-gray-700 flex items-center gap-1">
                                {isSpecial && (
                                  <Star className="w-4 h-4 text-purple-600 flex-shrink-0" />
                                )}
                                <span className={isSpecial ? 'text-purple-700' : ''}>
                                  TJM_{patient.patient_id}
                                </span>
                              </div>
                              <div 
                                className={`w-2/3 text-right font-medium ${
                                  isSpecial
                                    ? 'text-purple-700 font-bold' 
                                    : 'text-gray-800'
                                }`}
                              >
                                {patient.full_name || `${patient.name || ''} ${patient.lastName || ''}`.trim()}
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-between">
                              <div className="w-1/3 text-gray-300">-</div>
                              <div className="w-2/3 text-gray-300">-</div>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer / Last Updated */}
      <div className="mt-6 flex flex-col items-center gap-2">
        <div className="text-sm text-gray-500 font-droid-arabic-kufi flex items-center gap-2">
          <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          <p>يتم تحديث اللوائح تلقائياً كل 10 ثوانٍ</p>
        </div>
        {lastUpdated && (
          <p className="text-xs text-gray-400 font-droid-arabic-kufi">
            آخر تحديث: {lastUpdated.toLocaleTimeString('ar-SA')}
          </p>
        )}
      </div>

      {/* Statistics Summary */}
      {maxRows > 0 && (
        <div className="mt-8 w-full max-w-4xl">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 font-droid-arabic-kufi mb-4 text-center">
              إحصائيات سريعة
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">
                  {specialities.length}
                </p>
                <p className="text-sm text-gray-600 font-droid-arabic-kufi">تخصصات</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  {Object.values(waitingList).reduce((sum, arr) => sum + (arr?.length || 0), 0)}
                </p>
                <p className="text-sm text-gray-600 font-droid-arabic-kufi">مرضى في الإنتظار</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">
                  {Object.values(waitingList).reduce((sum, arr) => 
                    sum + (arr?.filter(p => isSpecialCase(p)).length || 0), 0
                  )}
                </p>
                <p className="text-sm text-gray-600 font-droid-arabic-kufi">حالات خاصة</p>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <p className="text-2xl font-bold text-orange-600">
                  {maxRows}
                </p>
                <p className="text-sm text-gray-600 font-droid-arabic-kufi">أقصى عمق</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaitingList;