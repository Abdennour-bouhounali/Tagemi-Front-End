import { API_BASE_URL } from '../../../../config/environment';
import { useState, useEffect, useContext } from 'react';
import { AppContext } from '../../../../Context/AppContext';
import { 
  Calendar, 
  Clock, 
  Users, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  BarChart3,
  X
} from 'lucide-react';

const apiUrl = API_BASE_URL;

export default function AppointmentDistribution({ eventId, onClose }) {
  const { token } = useContext(AppContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDistribution();
  }, [eventId]);

  const fetchDistribution = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/events/${eventId}/appointment-distribution`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Failed to fetch distribution');

      const result = await res.json();
      setData(result);
      console.log('data')
      console.log(data)
    } catch (err) {
      console.error('Error fetching distribution:', err);
      setError('فشل في تحميل توزيع المواعيد');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'full':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'almost_full':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'half_full':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'available':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'empty':
        return 'bg-gray-100 text-gray-600 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-300';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'full':
        return <XCircle className="w-3 h-3 sm:w-4 sm:h-4" />;
      case 'almost_full':
        return <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />;
      case 'available':
      case 'half_full':
        return <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />;
      default:
        return <Clock className="w-3 h-3 sm:w-4 sm:h-4" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'full':
        return 'ممتلئ';
      case 'almost_full':
        return 'شبه ممتلئ';
      case 'half_full':
        return 'نصف ممتلئ';
      case 'available':
        return 'متاح';
      case 'empty':
        return 'فارغ';
      default:
        return 'غير معروف';
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-6 max-w-sm w-full">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
            <p className="text-red-800 font-droid-arabic-kufi">{error}</p>
          </div>
          <button
            onClick={onClose}
            className="w-full mt-4 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg font-droid-arabic-kufi transition"
          >
            إغلاق
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-7xl w-full max-h-[95vh] flex flex-col">
        {/* Header - Fixed */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3 sm:p-6 rounded-t-xl sm:rounded-t-2xl flex-shrink-0">
          <div className="flex justify-between items-start gap-2">
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-2xl font-bold font-droid-arabic-kufi mb-1 sm:mb-2 truncate">
                توزيع المواعيد - {data.event.name}
              </h2>
              <p className="text-blue-100 font-droid-arabic-kufi text-xs sm:text-sm truncate">
                {data.event.place}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-1.5 sm:p-2 transition flex-shrink-0"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Overall Statistics */}
          <div className="p-3 sm:p-6 bg-gray-50 border-b">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4">
              <div className="bg-white rounded-lg p-2 sm:p-4 border-2 border-blue-200">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs text-gray-600 font-droid-arabic-kufi truncate">إجمالي الحجوزات</p>
                    <p className="text-lg sm:text-2xl font-bold text-blue-600">{data.statistics.total_appointments}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-2 sm:p-4 border-2 border-green-200">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs text-gray-600 font-droid-arabic-kufi truncate">عدد المرضى</p>
                    <p className="text-lg sm:text-2xl font-bold text-green-600">{data.statistics.total_patients}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-2 sm:p-4 border-2 border-green-200">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs text-gray-600 font-droid-arabic-kufi truncate">السعة الكلية</p>
                    <p className="text-lg sm:text-2xl font-bold text-green-600">{data.statistics.total_capacity}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-2 sm:p-4 border-2 border-orange-200">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs text-gray-600 font-droid-arabic-kufi truncate">الأماكن المتاحة</p>
                    <p className="text-lg sm:text-2xl font-bold text-orange-600">{data.statistics.total_available}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-2 sm:p-4 border-2 border-purple-200 col-span-2 sm:col-span-1">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs text-gray-600 font-droid-arabic-kufi truncate">نسبة الامتلاء</p>
                    <p className="text-lg sm:text-2xl font-bold text-purple-600">{data.statistics.percentage_full}%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Distribution by Specialty */}
          <div className="p-3 sm:p-6">
            {data.distribution.map((specialty, specIndex) => (
              <div key={specIndex} className="mb-4 sm:mb-6 last:mb-0">
                {/* Specialty Header */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 sm:p-4 mb-2 sm:mb-3 border-l-4 border-blue-500">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-12 sm:h-12 bg-blue-500 text-white rounded-lg flex items-center justify-center font-bold text-sm sm:text-lg flex-shrink-0">
                        {specIndex + 1}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base sm:text-xl font-bold text-gray-800 font-droid-arabic-kufi truncate">
                          {specialty.specialty_name}
                        </h3>
                        {specialty.is_saturated && (
                          <span className="inline-block bg-red-100 text-red-600 text-[10px] sm:text-xs px-2 py-0.5 sm:py-1 rounded-full font-droid-arabic-kufi">
                            مشبع
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right sm:text-left mr-10 sm:mr-0">
                      <p className="text-xs sm:text-sm text-gray-600 font-droid-arabic-kufi">الحجوزات</p>
                      <p className="text-lg sm:text-2xl font-bold text-blue-600">
                        {specialty.total_appointments} / {specialty.total_capacity}
                      </p>
                      <div className="w-24 sm:w-32 h-1.5 sm:h-2 bg-gray-200 rounded-full mt-1">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ width: `${specialty.percentage_full}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Days */}
                <div className="space-y-2 sm:space-y-3 pr-2 sm:pr-8">
                  {specialty.days.map((day, dayIndex) => (
                    <div key={dayIndex} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                      {/* Day Header */}
                      <div className="bg-gray-50 px-3 sm:px-4 py-2 sm:py-3 border-b flex justify-between items-center">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="font-bold text-gray-800 font-droid-arabic-kufi text-sm sm:text-base truncate">
                              {day.day_name}
                            </p>
                            <p className="text-[10px] sm:text-xs text-gray-600 font-droid-arabic-kufi">
                              {day.formatted_date}
                            </p>
                          </div>
                        </div>
                        <div className="text-left flex-shrink-0">
                          <p className="text-xs sm:text-sm text-gray-600 font-droid-arabic-kufi">
                            {day.total_appointments} / {day.total_capacity}
                          </p>
                          <p className="text-[10px] sm:text-xs text-gray-500 font-droid-arabic-kufi">
                            {day.number_per_hour} شخص/ساعة
                          </p>
                        </div>
                      </div>

                      {/* Hours Grid */}
                      <div className="p-2 sm:p-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-1.5 sm:gap-2">
                        {day.hours.map((hour, hourIndex) => (
                          <div
                            key={hourIndex}
                            className={`
                              p-1.5 sm:p-3 rounded-lg border-2 transition-all
                              ${getStatusColor(hour.status)}
                              hover:scale-105 cursor-pointer
                            `}
                            title={`${getStatusText(hour.status)} - ${hour.counter}/${hour.max_allowed}`}
                          >
                            <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                              <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                              {getStatusIcon(hour.status)}
                            </div>
                            <p className="text-sm sm:text-lg font-bold font-mono">
                              {hour.formatted_time}
                            </p>
                            <div className="flex items-center justify-between mt-1 sm:mt-2 text-[9px] sm:text-xs">
                              <span className="font-bold">{hour.counter}/{hour.max_allowed}</span>
                              <span className="font-droid-arabic-kufi hidden sm:inline">
                                {hour.available > 0 ? `${hour.available} متاح` : 'ممتلئ'}
                              </span>
                            </div>
                            <div className="w-full h-0.5 sm:h-1 bg-white bg-opacity-50 rounded-full mt-1 sm:mt-2">
                              <div
                                className="h-full bg-current rounded-full transition-all"
                                style={{ width: `${hour.percentage_full}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Legend - Sticky at bottom */}
        <div className="p-3 sm:p-6 bg-gray-50 border-t rounded-b-xl sm:rounded-b-2xl flex-shrink-0 sticky bottom-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
          <p className="text-xs sm:text-sm font-bold text-gray-700 mb-2 sm:mb-3 font-droid-arabic-kufi">
            دليل الألوان:
          </p>
          <div className="flex flex-wrap gap-1.5 sm:gap-3">
            {[
              { status: 'empty', label: 'فارغ' },
              { status: 'available', label: 'متاح' },
              { status: 'half_full', label: 'نصف ممتلئ' },
              { status: 'almost_full', label: 'شبه ممتلئ' },
              { status: 'full', label: 'ممتلئ' }
            ].map((item) => (
              <div
                key={item.status}
                className={`
                  flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-2 rounded-lg border-2
                  ${getStatusColor(item.status)}
                `}
              >
                {getStatusIcon(item.status)}
                <span className="text-[10px] sm:text-sm font-droid-arabic-kufi">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}