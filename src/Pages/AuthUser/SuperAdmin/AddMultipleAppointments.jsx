import React, { useState, useContext, useEffect, useMemo } from "react";
import { AppContext } from "../../../Context/AppContext";
import BirthdayInput from "./Components/BirthdayInput";
import { Select } from '../../Common/FormInputs';
import { 
  Calendar, 
  Stethoscope, 
  CalendarDays, 
  Clock, 
  MapPin, 
  Building2, 
  User 
} from "lucide-react";
const apiUrl = import.meta.env.VITE_API_URL;
import algeriaLocations from '../../../data/algeria_locations.json';

const AddMultipleAppointments = () => {
  const { token } = useContext(AppContext);
  
  // State for events and selection
  const [activeEvents, setActiveEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventSpecialties, setEventSpecialties] = useState([]);
  const [selectedEventSpecialty, setSelectedEventSpecialty] = useState(null);
  const [days, setDays] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [hours, setHours] = useState([]);
  const [selectedHour, setSelectedHour] = useState(null);
  const [availableCities, setAvailableCities] = useState({});

  // State for appointments
  const [appointments, setAppointments] = useState([
    {
      name: "",
      lastName: "",
      birthday: "",
      state: "",
      city: "",
      diseases: "",
      phone: "",
      phone2: "",
      sex: "",
    },
  ]);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [availableSlots, setAvailableSlots] = useState(null);

  // Transform data to options format
  const eventOptions = useMemo(() => 
    activeEvents.map(event => ({
      value: event.id.toString(),
      label: event.name
    })), 
    [activeEvents]
  );

  const specialtyOptions = useMemo(() => 
    eventSpecialties.map(es => ({
      value: es.id.toString(),
      label: es.specialty?.name || es.name
    })), 
    [eventSpecialties]
  );

  const dayOptions = useMemo(() => 
    days.map(day => ({
      value: day.id.toString(),
      label: day.name || day.day_date
    })), 
    [days]
  );

  const hourOptions = useMemo(() => 
    hours.map(hour => ({
      value: hour.id.toString(),
      label: hour.time || hour.hour
    })), 
    [hours]
  );

  const stateOptions = useMemo(() => 
    algeriaLocations.algeria_locations.map(loc => ({
      value: loc.name_ar,
      label: `${loc.name_ar} - ${loc.code}`
    })), 
    []
  );

  const sexOptions = [
    { value: '0', label: 'ذكر' },
    { value: '1', label: 'أنثى' }
  ];

  // Fetch active events on component mount
  useEffect(() => {
    fetchActiveEvents();
  }, []);

  // Fetch event specialties when event is selected
  useEffect(() => {
    if (selectedEvent) {
      fetchEventSpecialties(selectedEvent.id);
    } else {
      setEventSpecialties([]);
      setSelectedEventSpecialty(null);
      setDays([]);
      setHours([]);
    }
  }, [selectedEvent]);

  // Fetch days when specialty is selected
  useEffect(() => {
    if (selectedEventSpecialty) {
      fetchDays(selectedEventSpecialty.id);
      checkAvailableSlots();
    } else {
      setDays([]);
      setSelectedDay(null);
      setHours([]);
    }
  }, [selectedEventSpecialty]);

  // Fetch hours when day is selected
  useEffect(() => {
    if (selectedDay) {
      fetchHours(selectedDay.id);
    } else {
      setHours([]);
      setSelectedHour(null);
    }
  }, [selectedDay]);

  // Check available slots when hour is selected
  useEffect(() => {
    if (selectedHour && selectedEventSpecialty && selectedDay) {
      checkAvailableSlots();
    }
  }, [selectedHour]);

  const fetchActiveEvents = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/events`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const active = data.events?.filter(e => e.is_active && !e.is_archived) || [];
      setActiveEvents(active);
      
      // Auto-select if only one active event
      if (active.length === 1) {
        setSelectedEvent(active[0]);
      }
    } catch (err) {
      console.error("Error fetching events:", err);
      setError("فشل في تحميل الأحداث النشطة");
    }
  };

  const fetchEventSpecialties = async (eventId) => {
    try {
      const res = await fetch(`${apiUrl}/api/events/${eventId}/specialties`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setEventSpecialties(data.event_specialties || []);
    } catch (err) {
      console.error("Error fetching specialties:", err);
      setError("فشل في تحميل التخصصات");
    }
  };

  const fetchDays = async (eventSpecialtyId) => {
    try {
      const res = await fetch(`${apiUrl}/api/event-specialties/${eventSpecialtyId}/days`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setDays(data.days || []);
    } catch (err) {
      console.error("Error fetching days:", err);
      setError("فشل في تحميل الأيام");
    }
  };

  const fetchHours = async (dayId) => {
    try {
      const res = await fetch(`${apiUrl}/api/days/${dayId}/hours`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setHours(data.hours || []);
    } catch (err) {
      console.error("Error fetching hours:", err);
      setError("فشل في تحميل الساعات");
    }
  };

  const checkAvailableSlots = async () => {
    if (!selectedEventSpecialty || !selectedDay || !selectedHour) return;

    try {
      const res = await fetch(
        `${apiUrl}/api/check-slot-availability?event_specialty_id=${selectedEventSpecialty.id}&day_id=${selectedDay.id}&hour_id=${selectedHour.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      setAvailableSlots(data);
    } catch (err) {
      console.error("Error checking slots:", err);
    }
  };

  // Handlers for the main selections
  const handleEventChange = (e) => {
    const eventId = parseInt(e.target.value);
    const event = activeEvents.find(ev => ev.id === eventId);
    setSelectedEvent(event || null);
  };

  const handleSpecialtyChange = (e) => {
    const specialtyId = parseInt(e.target.value);
    const specialty = eventSpecialties.find(s => s.id === specialtyId);
    setSelectedEventSpecialty(specialty || null);
  };

  const handleDayChange = (e) => {
    const dayId = parseInt(e.target.value);
    const day = days.find(d => d.id === dayId);
    setSelectedDay(day || null);
  };

  const handleHourChange = (e) => {
    const hourId = parseInt(e.target.value);
    const hour = hours.find(h => h.id === hourId);
    setSelectedHour(hour || null);
  };

  const handleChange = (index, field, value) => {
    const updated = [...appointments];
    updated[index][field] = value;
    setAppointments(updated);
  };

  const addForm = () => {
    setAppointments([
      ...appointments,
      {
        name: "",
        lastName: "",
        birthday: "",
        state: "",
        city: "",
        diseases: "",
        phone: "",
        phone2: "",
        sex: "",
      },
    ]);
  };

  const removeForm = (index) => {
    if (appointments.length === 1) return;
    setAppointments(appointments.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    if (!selectedEvent) {
      setError("يرجى اختيار الحدث");
      return false;
    }
    if (!selectedEventSpecialty) {
      setError("يرجى اختيار التخصص");
      return false;
    }
    if (!selectedDay) {
      setError("يرجى اختيار اليوم");
      return false;
    }
    if (!selectedHour) {
      setError("يرجى اختيار الساعة");
      return false;
    }

    // Check if we have enough available slots
    if (availableSlots && availableSlots.available !== undefined) {
      if (appointments.length > availableSlots.available) {
        setError(`عدد المواعيد المطلوبة (${appointments.length}) أكبر من الأماكن المتاحة (${availableSlots.available})`);
        return false;
      }
    }

    // Validate each appointment
    for (let i = 0; i < appointments.length; i++) {
      const app = appointments[i];
      if (!app.name || !app.lastName) {
        setError(`موعد #${i + 1}: يرجى إدخال الاسم الكامل`);
        return false;
      }
      if (!app.birthday) {
        setError(`موعد #${i + 1}: يرجى إدخال تاريخ الميلاد`);
        return false;
      }
      if (!app.state) {
        setError(`موعد #${i + 1}: يرجى اختيار الولاية`);
        return false;
      }
      if (!app.city) {
        setError(`موعد #${i + 1}: يرجى اختيار البلدية`);
        return false;
      }
    }

    return true;
  };

  const handleStateChange = (index, stateName) => {
    // Update the appointment's state and clear city
    const updated = [...appointments];
    updated[index].state = stateName;
    updated[index].city = '';
    setAppointments(updated);
    
    // Find the selected wilaya and set its communes for this specific appointment
    const selectedWilaya = algeriaLocations.algeria_locations.find(
      loc => loc.name_ar === stateName
    );
    
    if (selectedWilaya) {
      setAvailableCities(prev => ({
        ...prev,
        [index]: selectedWilaya.communes
      }));
    } else {
      setAvailableCities(prev => ({
        ...prev,
        [index]: []
      }));
    }
  };

  // Get city options for a specific appointment index
  const getCityOptions = (index) => {
    const cities = availableCities[index] || [];
    return cities.map(city => ({
      value: city,
      label: city
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    const body = {
      event_id: selectedEvent.id,
      event_specialty_id: selectedEventSpecialty.id,
      day_id: selectedDay.id,
      hour_id: selectedHour.id,
      appointments: appointments,
    };

    try {
      const res = await fetch(`${apiUrl}/api/appointments/add-multiple`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(
          `تم إضافة ${data.appointments?.length || appointments.length} موعد بنجاح! ` +
          (data.patient_ids ? `أرقام المرضى: ${data.patient_ids.join(", ")}` : "")
        );
        
        // Show waiting list message if any
        if (data.waiting_message) {
          setError(data.waiting_message);
        }

        // Reset form
        setAppointments([
          {
            name: "",
            lastName: "",
            birthday: "",
            state: "",
            city: "",
            diseases: "",
            phone: "",
            phone2: "",
            sex: "",
          },
        ]);
        
        // Refresh available slots
        checkAvailableSlots();
        
        // Scroll to top to show success message
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setError(data.message || "حدث خطأ أثناء إضافة المواعيد");
        if (data.errors) {
          console.error("Validation errors:", data.errors);
        }
      }
    } catch (err) {
      console.error("Submit error:", err);
      setError("حدث خطأ في الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto bg-white rounded-2xl shadow-lg p-8 mb-10">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold font-droid-arabic-kufi text-blue-900 mb-2">
          إضافة عدة مواعيد
        </h2>
        <p className="text-gray-600 font-droid-arabic-kufi">
          قم بإضافة مواعيد متعددة لنفس التخصص والوقت
        </p>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-r-4 border-red-500 text-red-700 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 ml-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="font-droid-arabic-kufi">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border-r-4 border-green-500 text-green-700 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 ml-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-droid-arabic-kufi">{success}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Event, Specialty, Day, and Hour Selection */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl shadow-sm border border-blue-100">
          <h3 className="text-xl font-bold text-blue-900 mb-4 font-droid-arabic-kufi">
            معلومات الموعد المشتركة
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Event Selection */}
            <Select
              icon={Calendar}
              label="اختر الحدث"
              name="event"
              type="select"
              value={selectedEvent?.id?.toString() || ""}
              onChange={handleEventChange}
              placeholder="اختر حدثاً نشطاً"
              required
              options={eventOptions}
            />

            {/* Specialty Selection */}
            <Select
              icon={Stethoscope}
              label="اختر التخصص"
              name="specialty"
              type="select"
              value={selectedEventSpecialty?.id?.toString() || ""}
              onChange={handleSpecialtyChange}
              placeholder="اختر تخصصاً"
              required
              disabled={!selectedEvent}
              options={specialtyOptions}
            />

            {/* Day Selection */}
            <Select
              icon={CalendarDays}
              label="اختر اليوم"
              name="day"
              type="select"
              value={selectedDay?.id?.toString() || ""}
              onChange={handleDayChange}
              placeholder="اختر يوماً"
              required
              disabled={!selectedEventSpecialty}
              options={dayOptions}
            />

            {/* Hour Selection */}
            <Select
              icon={Clock}
              label="اختر الساعة"
              name="hour"
              type="select"
              value={selectedHour?.id?.toString() || ""}
              onChange={handleHourChange}
              placeholder="اختر ساعة"
              required
              disabled={!selectedDay}
              options={hourOptions}
            />
          </div>

          {/* Available Slots Indicator */}
          {availableSlots && (
            <div className="mt-4 p-3 bg-white rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <span className="font-droid-arabic-kufi text-gray-700">
                  الأماكن المتاحة:
                </span>
                <span className={`font-bold text-lg font-droid-arabic-kufi ${
                  availableSlots.available > 5 ? 'text-green-600' :
                  availableSlots.available > 0 ? 'text-orange-600' :
                  'text-red-600'
                }`}>
                  {availableSlots.available} / {availableSlots.total}
                </span>
              </div>
              {availableSlots.available === 0 && (
                <p className="text-sm text-red-600 mt-2 font-droid-arabic-kufi">
                  تنبيه: لا توجد أماكن متاحة في هذا الوقت
                </p>
              )}
            </div>
          )}
        </div>

        {/* Appointments Forms */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-800 font-droid-arabic-kufi">
              بيانات المرضى ({appointments.length})
            </h3>
            <button
              type="button"
              onClick={addForm}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg transition font-droid-arabic-kufi flex items-center gap-2 shadow-md"
              disabled={!selectedHour || (availableSlots && appointments.length >= availableSlots.available)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              إضافة نموذج
            </button>
          </div>

          {appointments.map((app, idx) => (
            <div
              key={idx}
              className="p-6 bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-md border border-blue-100 hover:shadow-lg transition-all duration-200"
            >
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-lg text-blue-800 font-droid-arabic-kufi">
                  مريض #{idx + 1}
                </h4>
                {appointments.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeForm(idx)}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition flex items-center gap-2 shadow-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    إزالة
                  </button>
                )}
              </div>

              {/* Row 1: Name, Last Name, State, City */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-droid-arabic-kufi">
                    الاسم <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="الاسم"
                    value={app.name}
                    onChange={(e) => handleChange(idx, "name", e.target.value)}
                    className="p-3 h-12 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-300 focus:border-blue-300 focus:outline-none transition"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-droid-arabic-kufi">
                    اللقب <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="اللقب"
                    value={app.lastName}
                    onChange={(e) => handleChange(idx, "lastName", e.target.value)}
                    className="p-3 h-12 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-300 focus:border-blue-300 focus:outline-none transition"
                    required
                  />
                </div>

                {/* State Selection */}
                <Select
                  icon={MapPin}
                  label="الولاية"
                  name={`state_${idx}`}
                  type="select"
                  value={app.state}
                  onChange={(e) => handleStateChange(idx, e.target.value)}
                  placeholder="اختر الولاية"
                  required
                  options={stateOptions}
                />

                {/* City Selection */}
                <Select
                  icon={Building2}
                  label="البلدية"
                  name={`city_${idx}`}
                  type="select"
                  value={app.city}
                  onChange={(e) => handleChange(idx, "city", e.target.value)}
                  placeholder={app.state ? "اختر البلدية" : "اختر الولاية أولاً"}
                  required
                  disabled={!app.state || !availableCities[idx]?.length}
                  options={getCityOptions(idx)}
                />
              </div>

              {/* Row 2: Birthday, Phone, Phone2, Sex */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-droid-arabic-kufi">
                    تاريخ الميلاد <span className="text-red-500">*</span>
                  </label>
                  <BirthdayInput
                    value={app.birthday}
                    onChange={(date) => handleChange(idx, "birthday", date)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-droid-arabic-kufi">
                    رقم الهاتف 1 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="0XXXXXXXXX"
                    value={app.phone}
                    onChange={(e) => handleChange(idx, "phone", e.target.value)}
                    className="p-3 h-12 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-300 focus:border-blue-300 focus:outline-none transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-droid-arabic-kufi">
                    رقم الهاتف 2 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="0XXXXXXXXX"
                    value={app.phone2}
                    onChange={(e) => handleChange(idx, "phone2", e.target.value)}
                    className="p-3 h-12 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-300 focus:border-blue-300 focus:outline-none transition"
                    required
                  />
                </div>

                {/* Sex Selection */}
                <Select
                  icon={User}
                  label="الجنس"
                  name={`sex_${idx}`}
                  type="select"
                  value={app.sex}
                  onChange={(e) => handleChange(idx, "sex", e.target.value)}
                  placeholder="اختر الجنس"
                  required
                  options={sexOptions}
                />
              </div>

              {/* Row 3: Diseases */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-droid-arabic-kufi">
                    الأمراض
                  </label>
                  <input
                    type="text"
                    placeholder="اختياري"
                    value={app.diseases}
                    onChange={(e) => handleChange(idx, "diseases", e.target.value)}
                    className="p-3 h-12 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-300 focus:border-blue-300 focus:outline-none transition"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Submit Button */}
        <div className="flex justify-center pt-6">
          <button
            type="submit"
            disabled={loading || !selectedHour}
            className={`
              px-8 py-4 rounded-lg font-bold text-lg font-droid-arabic-kufi
              transition-all duration-200 shadow-lg flex items-center gap-3
              ${loading || !selectedHour
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white transform hover:scale-105'
              }
            `}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                جاري الحفظ...
              </>
            ) : (
              <>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                إرسال جميع المواعيد ({appointments.length})
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddMultipleAppointments;