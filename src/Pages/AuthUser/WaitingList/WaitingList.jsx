import { API_BASE_URL } from '../../../config/environment';
import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowRight, RefreshCw, AlertCircle, Clock, Users, User, UserCircle, Monitor, ListFilter, Maximize, Minimize, Eye, EyeOff } from 'lucide-react';

const apiUrl = API_BASE_URL;

// Hall screen: up to 5 specialty columns at once, otherwise several views
// (two halves for up to 10) shown in turn, or picked by hand
const MAX_COLUMNS = 5;
const ROTATION_MS = 10000;

// Display settings are kept per device (each screen shows its own specialties)
const settingsKey = (eventId) => `hall-screen:${eventId}`;
const loadSettings = (eventId) => {
  try {
    return JSON.parse(localStorage.getItem(settingsKey(eventId))) || {};
  } catch {
    return {};
  }
};
import { AppContext } from "../../../Context/AppContext";

const WaitingList = () => {
  const { eventId } = useParams();
  const { user } = useContext(AppContext);
  const navigate = useNavigate();
  const location = useLocation();
  // Back to the page the user came from; home only if this page was opened directly
  const goBack = () => (location.key === 'default' ? navigate('/') : navigate(-1));
  
  const [event, setEvent] = useState(null);
  const [allSpecialities, setAllSpecialities] = useState([]);
  const [waitingList, setWaitingList] = useState({});
  const [filteredWaitingList, setFilteredWaitingList] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [sexFilter, setSexFilter] = useState('all'); // 'all', 'male', 'female'
  // More than 5 specialties don't fit on the hall screen: show them in views
  // that take turns every 10 seconds ('auto') or the one picked ('manual').
  const [groupIndex, setGroupIndex] = useState(() => loadSettings(eventId).view || 0);
  const [displayMode, setDisplayMode] = useState(() => loadSettings(eventId).mode || 'auto');
  // Specialties this screen shows; empty = all of them
  const [selectedIds, setSelectedIds] = useState(() => loadSettings(eventId).specialties || []);
  // Filters, display settings and legend can be hidden to leave only the lists
  const [showControls, setShowControls] = useState(() => loadSettings(eventId).controls !== false);

  useEffect(() => {
    try {
      localStorage.setItem(settingsKey(eventId), JSON.stringify({ mode: displayMode, view: groupIndex, specialties: selectedIds, controls: showControls }));
    } catch {
      // Private mode / storage blocked: settings just won't be remembered
    }
  }, [eventId, displayMode, groupIndex, selectedIds, showControls]);

  // Full screen for the hall TV/laptop (the browser's own Esc also leaves it)
  const [isFullscreen, setIsFullscreen] = useState(() => !!document.fullscreenElement);
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);
  const toggleFullscreen = () => {
    const request = document.fullscreenElement
      ? document.exitFullscreen()
      : document.documentElement.requestFullscreen?.();
    request?.catch?.((err) => console.error('Fullscreen error:', err));
  };

  const toggleSpecialty = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    setGroupIndex(0);
  };

  // Helper function to determine patient sex
  const getPatientSex = (patient) => {
    const sex = String(patient?.sex || '').toLowerCase().trim();
    
    if (sex ==  0 || sex === 'ذكر' || sex === 'm' || sex === 'male') {
      return 'male';
    } else if (sex == 1 || sex === 'أنثى' || sex === 'f' || sex === 'female') {
      return 'female';
    }
    return 'unknown';
  };

  // Render gender icon
  const renderGenderIcon = (patient) => {
    const sex = getPatientSex(patient);
    
    if (sex === 'male') {
      return (
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100" title="ذكر">
          <User className="w-4 h-4 text-blue-600" />
        </div>
      );
    } else if (sex === 'female') {
      return (
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-pink-100" title="أنثى">
          <User className="w-4 h-4 text-pink-600" />
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100" title="غير محدد">
        <User className="w-4 h-4 text-gray-400" />
      </div>
    );
  };

  // Fetch event details (PUBLIC)
  async function getEventDetails() {
    try {
      const res = await fetch(`${apiUrl}/api/public/events/${eventId}`);
      
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

  // Fetch waiting list for specific event (PUBLIC)
  async function getWaitingList() {
    try {
      const res = await fetch(`${apiUrl}/api/public/waitinglist?event_id=${eventId}`);
      
      if (!res.ok) {
        console.error('Failed to fetch waiting list');
        setError('فشل في تحميل قائمة الإنتظار');
        return;
      }
      
      const data = await res.json();
      
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

  // Fetch specialities for this event (PUBLIC)
  async function getEventSpecialities() {
    try {
      const res = await fetch(`${apiUrl}/api/public/events/${eventId}/specialties`);
      
      if (!res.ok) {
        console.error('Failed to fetch event specialities');
        return;
      }
      
      const data = await res.json();
      
      const uniqueSpecialties = [];
      const seenIds = new Set();
      
      if (data.event_specialties) {
        data.event_specialties.forEach(es => {
          if (es.specialty && !seenIds.has(es.specialty.id)) {
            seenIds.add(es.specialty.id);
            uniqueSpecialties.push({ ...es.specialty, queue_open: es.queue_open });
          }
        });
      }
      
      const filtered = uniqueSpecialties.filter(s => s.name !== 'NoSpeciality');
      setAllSpecialities(filtered);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching specialities:', error);
      setError('حدث خطأ أثناء تحميل التخصصات');
      setLoading(false);
    }
  }

  // Apply sex filter to waiting list
  useEffect(() => {
    if (sexFilter === 'all') {
      setFilteredWaitingList(waitingList);
    } else {
      const filtered = {};
      Object.keys(waitingList).forEach(specialityId => {
        const patients = waitingList[specialityId] || [];
        filtered[specialityId] = patients.filter(patient => {
          const patientSex = getPatientSex(patient);
          return patientSex === sexFilter;
        });
      });
      setFilteredWaitingList(filtered);
    }
  }, [waitingList, sexFilter]);

  // Initial load
  useEffect(() => {
    if (eventId) {
      setLoading(true);
      getEventDetails();
      getEventSpecialities();
      getWaitingList();
    }
  }, [eventId]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (eventId) {
        getWaitingList();
        getEventSpecialities();
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, [eventId]);

  // Only specialties opened today (doctor present), or still finishing their queue,
  // and only those chosen for this screen
  const isActive = (s) => s.queue_open || (waitingList[s.id] || []).length > 0;
  const specialities = allSpecialities.filter(s => isActive(s) && (selectedIds.length === 0 || selectedIds.includes(s.id)));
  const groupCount = Math.max(1, Math.ceil(specialities.length / MAX_COLUMNS));
  const groupSize = Math.ceil(specialities.length / groupCount);
  const specialtyGroups = Array.from({ length: groupCount }, (_, i) => specialities.slice(i * groupSize, (i + 1) * groupSize));
  const currentGroup = groupIndex % specialtyGroups.length;
  const visibleSpecialities = specialtyGroups[currentGroup];

  useEffect(() => {
    if (displayMode !== 'auto' || specialtyGroups.length < 2) return undefined;
    const rotation = setInterval(() => setGroupIndex((i) => (i + 1) % specialtyGroups.length), ROTATION_MS);
    return () => clearInterval(rotation);
  }, [displayMode, specialtyGroups.length]);

  // Manual refresh
  const handleRefresh = () => {
    getWaitingList();
  };

  // Get counts for statistics
  const getTotalCount = () => {
    return specialities.reduce((sum, s) => sum + (filteredWaitingList[s.id]?.length || 0), 0);
  };

  const maxRows = Math.max(...visibleSpecialities.map(s => filteredWaitingList[s.id]?.length || 0), 0);

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
      {user &&
      <div className="w-full max-w-7xl mb-4">
        <button
          type="button"
          onClick={goBack}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 font-droid-arabic-kufi transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          العودة إلى الصفحة السابقة
        </button>
      </div>}

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
            قائمة الإنتظار
          </h1>
          <button
            onClick={handleRefresh}
            className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
            title="تحديث"
          >
            <RefreshCw className="w-5 h-5 text-blue-600" />
          </button>
          {document.fullscreenEnabled && (
            <button
              onClick={toggleFullscreen}
              className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
              title={isFullscreen ? 'الخروج من ملء الشاشة' : 'ملء الشاشة'}
              aria-label={isFullscreen ? 'الخروج من ملء الشاشة' : 'ملء الشاشة'}
            >
              {isFullscreen
                ? <Minimize className="w-5 h-5 text-blue-600" />
                : <Maximize className="w-5 h-5 text-blue-600" />}
            </button>
          )}
        </div>
        <p className="text-gray-600 text-sm font-droid-arabic-kufi mb-2">
          {event?.name || 'الحدث'}
        </p>
        <p className="text-gray-500 text-xs font-droid-arabic-kufi">
          عرض أول 10 مرضى من كل تخصص
        </p>
        <button
          onClick={() => setShowControls(!showControls)}
          aria-expanded={showControls}
          className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-droid-arabic-kufi bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          {showControls ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {showControls ? 'إخفاء الإعدادات' : 'إظهار الإعدادات'}
        </button>
      </div>

      {showControls && (<>
      {/* Sex Filter */}
      <div className="w-full max-w-7xl mb-6">
        <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-600" />
              <span className="text-gray-700 font-droid-arabic-kufi font-semibold">تصفية حسب الجنس:</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSexFilter('all')}
                className={`px-4 py-2 rounded-lg font-droid-arabic-kufi transition-all flex items-center gap-2 ${
                  sexFilter === 'all'
                    ? 'bg-gray-700 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Users className="w-4 h-4" />
                الكل
              </button>
              <button
                onClick={() => setSexFilter('male')}
                className={`px-4 py-2 rounded-lg font-droid-arabic-kufi transition-all flex items-center gap-2 ${
                  sexFilter === 'male'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                }`}
              >
                <User className="w-4 h-4" />
                ذكور
              </button>
              <button
                onClick={() => setSexFilter('female')}
                className={`px-4 py-2 rounded-lg font-droid-arabic-kufi transition-all flex items-center gap-2 ${
                  sexFilter === 'female'
                    ? 'bg-pink-600 text-white shadow-md'
                    : 'bg-pink-50 text-pink-700 hover:bg-pink-100 border border-pink-200'
                }`}
              >
                <User className="w-4 h-4" />
                إناث
              </button>
            </div>
            {sexFilter !== 'all' && (
              <span className="text-sm text-gray-500 font-droid-arabic-kufi">
                ({getTotalCount()} نتيجة)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Display settings: auto / manual views, specialties shown on this screen */}
      <div className="w-full max-w-7xl mb-6">
        <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200 space-y-4">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <Monitor className="w-5 h-5 text-gray-600" />
              <span className="text-gray-700 font-droid-arabic-kufi font-semibold">طريقة العرض:</span>
            </div>
            <div className="flex gap-2">
              {[
                { value: 'auto', label: 'تلقائي' },
                { value: 'manual', label: 'يدوي' },
              ].map((m) => (
                <button
                  key={m.value}
                  onClick={() => setDisplayMode(m.value)}
                  className={`px-4 py-2 rounded-lg font-droid-arabic-kufi transition-all ${
                    displayMode === m.value
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
            {displayMode === 'manual' && specialtyGroups.length > 1 && (
              <div className="flex flex-wrap justify-center gap-2 border-r pr-4 mr-2">
                {specialtyGroups.map((group, i) => (
                  <button
                    key={i}
                    onClick={() => setGroupIndex(i)}
                    title={group.map((s) => s.name).join('، ')}
                    className={`px-4 py-2 rounded-lg font-droid-arabic-kufi transition-all max-w-xs ${
                      currentGroup === i
                        ? 'bg-gray-700 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span className="block font-semibold">العرض {i + 1}</span>
                    <span className="block text-xs truncate opacity-80">{group.map((s) => s.name).join('، ')}</span>
                  </button>
                ))}
              </div>
            )}
            {displayMode === 'manual' && specialtyGroups.length < 2 && (
              <span className="text-sm text-gray-500 font-droid-arabic-kufi">كل التخصصات في عرض واحد</span>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 border-t border-gray-100 pt-4">
            <div className="flex items-center gap-2 ml-2">
              <ListFilter className="w-5 h-5 text-gray-600" />
              <span className="text-gray-700 font-droid-arabic-kufi font-semibold">التخصصات المعروضة:</span>
            </div>
            <button
              onClick={() => { setSelectedIds([]); setGroupIndex(0); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-droid-arabic-kufi transition-all ${
                selectedIds.length === 0
                  ? 'bg-gray-700 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              الكل
            </button>
            {allSpecialities.map((s) => {
              const selected = selectedIds.includes(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => toggleSpecialty(s.id)}
                  aria-pressed={selected}
                  className={`px-3 py-1.5 rounded-lg text-sm font-droid-arabic-kufi transition-all ${
                    selected
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                  } ${isActive(s) ? '' : 'opacity-60'}`}
                  title={isActive(s) ? '' : 'مغلق اليوم، يظهر عند فتحه'}
                >
                  {s.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="w-full max-w-7xl mb-6 flex flex-wrap items-center justify-center gap-6 text-sm font-droid-arabic-kufi">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100">
            <User className="w-4 h-4 text-blue-600" />
          </div>
          <span className="text-gray-700">ذكر</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-pink-100">
            <User className="w-4 h-4 text-pink-600" />
          </div>
          <span className="text-gray-700">أنثى</span>
        </div>
         {/* NEW: CommingSoon Legend */}
      <div className="flex items-center gap-2 border-r pr-6 mr-2">
        <div className="flex items-center gap-1 bg-red-50 border-2 border-red-400 rounded-lg px-2 py-1">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span className="text-red-700 font-semibold">تم إنزاله</span>
        </div>
        <span className="text-red-600 text-xs">(لم يكن عند الباب، سيُنادى بعد قليل)</span>
      </div>
        <div className="flex items-center gap-2 border-r pr-6 mr-2">
          <Clock className="w-4 h-4 text-green-500 animate-pulse" />
          <span className="text-gray-700">تحديث تلقائي كل 10 ثوانٍ</span>
        </div>
        {specialtyGroups.length > 1 && (
          <div className="flex items-center gap-2 border-r pr-6 mr-2">
            <RefreshCw className="w-4 h-4 text-indigo-500" />
            <span className="text-gray-700">
              التخصصات {currentGroup + 1} / {specialtyGroups.length}{' '}
              {displayMode === 'auto' ? '(تتبدل كل 10 ثوانٍ)' : '(عرض يدوي)'}
            </span>
          </div>
        )}
      </div>

      </>)}

      {/* Table Container */}
      <div className="overflow-x-auto w-full px-4 sm:px-6 lg:px-8">
        <div className="inline-block min-w-full shadow-lg rounded-2xl bg-white border border-gray-200">
          <table className="min-w-full text-center border-collapse">
            <thead className="bg-gradient-to-r from-indigo-100 to-indigo-200">
              <tr>
                {specialities.length === 0 ? (
                  <th className="px-6 py-8 text-center text-gray-500 font-droid-arabic-kufi">
                    {selectedIds.length > 0
                      ? 'لا يوجد تخصص مفتوح اليوم من التخصصات المختارة'
                      : 'لا توجد تخصصات متاحة لهذا الحدث'}
                  </th>
                ) : (
                  visibleSpecialities.map((speciality) => {
                    const count = filteredWaitingList[speciality.id]?.length || 0;
                    
                    return (
                      <th
                        key={speciality.id}
                        className="px-6 py-3 text-sm font-bold text-indigo-900 border-b border-gray-200 font-droid-arabic-kufi"
                      >
                        <span className="block mb-2 text-lg">{speciality.name}</span>
                        <div className="flex justify-between text-xs text-gray-600 mb-1 px-2">
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
                    colSpan={visibleSpecialities.length || 1} 
                    className="px-6 py-8 text-center text-gray-500 font-droid-arabic-kufi"
                  >
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="font-semibold mb-1">
                      {sexFilter !== 'all' 
                        ? 'لا توجد نتائج للفلتر المحدد'
                        : 'لا توجد مواعيد في قائمة الإنتظار حالياً'
                      }
                    </p>
                    <p className="text-xs text-gray-400">
                      {sexFilter !== 'all'
                        ? 'جرب تغيير الفلتر أو اختر "الكل"'
                        : 'سيتم عرض المرضى هنا عند تأكيد حضورهم'
                      }
                    </p>
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
                    {visibleSpecialities.map((speciality) => {
                      const patients = filteredWaitingList[speciality.id] || [];
                      const patient = patients[rowIndex] || null;
                      
                      return (
                        <td 
                          key={speciality.id} 
                          className="px-4 py-3 border-b border-gray-200 font-droid-arabic-kufi transition-all"
                        >
                          {patient ? (
                          <div 
                            className={`flex items-center justify-between gap-2 transition-all ${
                              patient.is_coming_soon || patient.status === 'Commingsoon'
                                ? 'bg-red-50 border-2 border-red-400 rounded-lg px-2 py-1 animate-pulse'
                                : ''
                            }`}
                          >
                            {/* Patient ID */}
                            <div className={`w-1/3 text-sm font-semibold ${
                              patient.is_coming_soon || patient.status === 'Commingsoon'
                                ? 'text-red-700'
                                : 'text-gray-700'
                            }`}>
                              {patient.patient_id}
                            </div>
                            
                            {/* Patient Name with Gender Icon and Warning */}
                            <div className="w-2/3 flex items-center justify-end gap-2">
                              {(patient.is_coming_soon || patient.status === 'Commingsoon') && (
                                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" title="تم إنزاله: سيُنادى بعد قليل" />
                              )}
                              <span className={`font-medium ${
                                patient.is_coming_soon || patient.status === 'Commingsoon'
                                  ? 'text-red-800 font-bold'
                                  : 'text-gray-800'
                              }`}>
                                {patient.full_name}
                              </span>
                              {renderGenderIcon(patient)}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-2">
                            <div className="w-1/3 text-gray-300">-</div>
                            <div className="w-2/3 text-gray-300 text-right">-</div>
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
              {sexFilter !== 'all' && (
                <span className="text-sm font-normal text-gray-500 mr-2">
                  ({sexFilter === 'male' ? 'ذكور فقط' : 'إناث فقط'})
                </span>
              )}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">
                  {specialities.length}
                </p>
                <p className="text-sm text-gray-600 font-droid-arabic-kufi">تخصصات</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  {getTotalCount()}
                </p>
                <p className="text-sm text-gray-600 font-droid-arabic-kufi">مرضى في الإنتظار</p>
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