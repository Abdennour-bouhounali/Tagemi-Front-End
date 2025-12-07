import { API_BASE_URL } from '../../../config/environment';
import { useState, useContext, useEffect, useMemo } from "react";
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
  User,
  TestTube2,
  Zap,
  Trash2,
  RotateCcw
} from "lucide-react";
import algeriaLocations from '../../../data/algeria_locations.json';

const apiUrl = API_BASE_URL;

const TEST_EVENT_ID = 2;

const AddMultipleAppointments = () => {
  const { token } = useContext(AppContext);
  
  // Mode selection: 'same', 'different', or 'test'
  const [mode, setMode] = useState('same');
  
  // State for events and selection
  const [activeEvents, setActiveEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  // For 'same' mode
  const [eventSpecialties, setEventSpecialties] = useState([]);
  const [selectedEventSpecialty, setSelectedEventSpecialty] = useState(null);
  const [days, setDays] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [hours, setHours] = useState([]);
  const [selectedHour, setSelectedHour] = useState(null);
  const [availableSlots, setAvailableSlots] = useState(null);
  
  // For 'different' mode - store specialties, days, hours per appointment
  const [appointmentSpecialties, setAppointmentSpecialties] = useState({});
  const [appointmentDays, setAppointmentDays] = useState({});
  const [appointmentHours, setAppointmentHours] = useState({});
    // ✅ ADD THESE TWO LINES - For test mode
  const [testEventInfo, setTestEventInfo] = useState(null);
  const [testAppointmentsCount, setTestAppointmentsCount] = useState(0);
  const [counting, setCounting] = useState(false);
  
  // For 'test' mode
  // At the top of the component
const TEST_EVENT_ID = 2;
  useEffect(() => {
  if (mode === 'test') {
    loadTestEventInfo();
  }
}, [mode]);
  const [availableCities, setAvailableCities] = useState({});

  // State for appointments (for same/different modes)
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
      // For 'different' mode
      event_specialty_id: "",
      day_id: "",
      hour_id: "",
    },
  ]);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [info, setInfo] = useState("");

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
      if (mode === 'test') {
        countTestAppointments(selectedEvent.id);
      }
    } else {
      setEventSpecialties([]);
      setSelectedEventSpecialty(null);
      setDays([]);
      setHours([]);
      setTestAppointmentsCount(0);
    }
  }, [selectedEvent]);

  // For 'same' mode - fetch days when specialty is selected
  useEffect(() => {
    if (mode === 'same' && selectedEventSpecialty) {
      fetchDays(selectedEventSpecialty.id);
    } else if (mode === 'same') {
      setDays([]);
      setSelectedDay(null);
      setHours([]);
    }
  }, [selectedEventSpecialty, mode]);

  // For 'same' mode - fetch hours when day is selected
  useEffect(() => {
    if (mode === 'same' && selectedDay) {
      fetchHours(selectedDay.id);
    } else if (mode === 'same') {
      setHours([]);
      setSelectedHour(null);
    }
  }, [selectedDay, mode]);

  // For 'same' mode - check available slots when hour is selected
  useEffect(() => {
    if (mode === 'same' && selectedHour && selectedEventSpecialty && selectedDay) {
      checkAvailableSlots();
    }
  }, [selectedHour, mode]);

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


  // Add this function - loads test event information
const loadTestEventInfo = async () => {
  try {
    const res = await fetch(`${apiUrl}/api/events/${TEST_EVENT_ID}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    if (!res.ok) {
      throw new Error('Test event not found');
    }
    
    const data = await res.json();
    setTestEventInfo(data.event || data);
    
    // Fetch specialties for test event
    await fetchEventSpecialtiesForTest(TEST_EVENT_ID);
    
    // Count existing test appointments
    await countTestAppointments();
  } catch (err) {
    console.error("Error loading test event:", err);
    setError("فشل في تحميل حدث الاختبار (ID: 2). تأكد من وجود الحدث.");
  }
};

const fetchEventSpecialtiesForTest = async (eventId) => {
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
      const daysData = data.days || [];
      setDays(daysData);
      return daysData;
    } catch (err) {
      console.error("Error fetching days:", err);
      setError("فشل في تحميل الأيام");
      return [];
    }
  };

  const fetchHours = async (dayId) => {
    try {
      const res = await fetch(`${apiUrl}/api/days/${dayId}/hours`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const hoursData = data.hours || [];
      setHours(hoursData);
      return hoursData;
    } catch (err) {
      console.error("Error fetching hours:", err);
      setError("فشل في تحميل الساعات");
      return [];
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

 // Update countTestAppointments - no event_id parameter needed
const countTestAppointments = async () => {
  setCounting(true);
  try {
    const res = await fetch(`${apiUrl}/api/test-appointments/count`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setTestAppointmentsCount(data.count || 0);
  } catch (err) {
    console.error("Error counting test appointments:", err);
  } finally {
    setCounting(false);
  }
};

// Update all test mode API calls to remove event_id from body
const handleCreateTestAppointments = async () => {
  setLoading(true);
  setError("");
  setSuccess("");
  setInfo("جاري إنشاء المواعيد التجريبية... قد يستغرق هذا بضع ثوانٍ");

  try {
    const res = await fetch(`${apiUrl}/api/test-appointments/create-all`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      // No body needed - backend uses fixed TEST_EVENT_ID
    });

    const data = await res.json();

    if (res.ok) {
      setSuccess(
        `تم إنشاء ${data.created_count} موعد تجريبي بنجاح! ` +
        `(${data.patients_count} مريض × ${data.specialties_count} تخصص)`
      );
      
      if (data.warning_message) {
        setInfo(data.warning_message);
      }

      await countTestAppointments();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setError(data.message || "حدث خطأ أثناء إنشاء المواعيد التجريبية");
    }
  } catch (err) {
    console.error("Create test appointments error:", err);
    setError("حدث خطأ في الاتصال بالخادم");
  } finally {
    setLoading(false);
    setInfo("");
  }
};

  // Handler for mode change
  const handleModeChange = (newMode) => {
    setMode(newMode);
    setError("");
    setSuccess("");
    setInfo("");
    
    // Reset appointments
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
        event_specialty_id: "",
        day_id: "",
        hour_id: "",
      },
    ]);
    
    // Clear mode-specific state
    if (newMode === 'same') {
      setAppointmentSpecialties({});
      setAppointmentDays({});
      setAppointmentHours({});
    } else if (newMode === 'different') {
      setSelectedEventSpecialty(null);
      setSelectedDay(null);
      setSelectedHour(null);
      setAvailableSlots(null);
    }
    
    // Refresh test count if switching to test mode
    if (newMode === 'test' && selectedEvent) {
      countTestAppointments(selectedEvent.id);
    }
  };

  // Handlers for the main selections (same mode)
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

  // Handlers for 'different' mode - per appointment specialty/day/hour
  const handleAppointmentSpecialtyChange = async (index, specialtyId) => {
    const updated = [...appointments];
    updated[index].event_specialty_id = specialtyId;
    updated[index].day_id = "";
    updated[index].hour_id = "";
    setAppointments(updated);

    if (specialtyId) {
      const days = await fetchDays(specialtyId);
      setAppointmentDays(prev => ({ ...prev, [index]: days }));
      setAppointmentHours(prev => ({ ...prev, [index]: [] }));
    } else {
      setAppointmentDays(prev => ({ ...prev, [index]: [] }));
      setAppointmentHours(prev => ({ ...prev, [index]: [] }));
    }
  };

  const handleAppointmentDayChange = async (index, dayId) => {
    const updated = [...appointments];
    updated[index].day_id = dayId;
    updated[index].hour_id = "";
    setAppointments(updated);

    if (dayId) {
      const hours = await fetchHours(dayId);
      setAppointmentHours(prev => ({ ...prev, [index]: hours }));
    } else {
      setAppointmentHours(prev => ({ ...prev, [index]: [] }));
    }
  };

  const handleAppointmentHourChange = (index, hourId) => {
    const updated = [...appointments];
    updated[index].hour_id = hourId;
    setAppointments(updated);
  };

  const getAppointmentDayOptions = (index) => {
    const days = appointmentDays[index] || [];
    return days.map(day => ({
      value: day.id.toString(),
      label: day.name || day.day_date
    }));
  };

  const getAppointmentHourOptions = (index) => {
    const hours = appointmentHours[index] || [];
    return hours.map(hour => ({
      value: hour.id.toString(),
      label: hour.time || hour.hour
    }));
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
        event_specialty_id: "",
        day_id: "",
        hour_id: "",
      },
    ]);
  };

  const removeForm = (index) => {
    if (appointments.length === 1) return;
    setAppointments(appointments.filter((_, i) => i !== index));
    
    if (mode === 'different') {
      const newAppointmentDays = { ...appointmentDays };
      const newAppointmentHours = { ...appointmentHours };
      delete newAppointmentDays[index];
      delete newAppointmentHours[index];
      
      const reindexedDays = {};
      const reindexedHours = {};
      Object.keys(newAppointmentDays).forEach(key => {
        const numKey = parseInt(key);
        if (numKey > index) {
          reindexedDays[numKey - 1] = newAppointmentDays[key];
        } else {
          reindexedDays[key] = newAppointmentDays[key];
        }
      });
      Object.keys(newAppointmentHours).forEach(key => {
        const numKey = parseInt(key);
        if (numKey > index) {
          reindexedHours[numKey - 1] = newAppointmentHours[key];
        } else {
          reindexedHours[key] = newAppointmentHours[key];
        }
      });
      
      setAppointmentDays(reindexedDays);
      setAppointmentHours(reindexedHours);
    }
  };

  const validateForm = () => {
    if (!selectedEvent) {
      setError("يرجى اختيار الحدث");
      return false;
    }

    if (mode === 'same') {
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

      if (availableSlots && availableSlots.available !== undefined) {
        if (appointments.length > availableSlots.available) {
          setError(`عدد المواعيد المطلوبة (${appointments.length}) أكبر من الأماكن المتاحة (${availableSlots.available})`);
          return false;
        }
      }
    }

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
      if (!app.phone) {
        setError(`موعد #${i + 1}: يرجى إدخال رقم الهاتف`);
        return false;
      }
      
      if (mode === 'different') {
        if (!app.event_specialty_id) {
          setError(`موعد #${i + 1}: يرجى اختيار التخصص`);
          return false;
        }
        if (!app.day_id) {
          setError(`موعد #${i + 1}: يرجى اختيار اليوم`);
          return false;
        }
        if (!app.hour_id) {
          setError(`موعد #${i + 1}: يرجى اختيار الساعة`);
          return false;
        }
      }
    }

    return true;
  };

  const handleStateChange = (index, stateName) => {
    const updated = [...appointments];
    updated[index].state = stateName;
    updated[index].city = '';
    setAppointments(updated);
    
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

    let body;
    let endpoint;

    if (mode === 'same') {
      body = {
        event_id: selectedEvent.id,
        event_specialty_id: selectedEventSpecialty.id,
        day_id: selectedDay.id,
        hour_id: selectedHour.id,
        appointments: appointments.map(app => ({
          name: app.name,
          lastName: app.lastName,
          birthday: app.birthday,
          state: app.state,
          city: app.city,
          diseases: app.diseases,
          phone: app.phone,
          phone2: app.phone2,
          sex: app.sex,
        })),
      };
      endpoint = `${apiUrl}/api/appointments/add-multiple`;
    } else {
      body = {
        event_id: selectedEvent.id,
        appointments: appointments.map(app => ({
          name: app.name,
          lastName: app.lastName,
          birthday: app.birthday,
          state: app.state,
          city: app.city,
          diseases: app.diseases,
          phone: app.phone,
          phone2: app.phone2,
          sex: app.sex,
          event_specialty_id: app.event_specialty_id,
          day_id: app.day_id,
          hour_id: app.hour_id,
        })),
      };
      endpoint = `${apiUrl}/api/appointments/add-multiple-different`;
    }

    try {
      const res = await fetch(endpoint, {
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
        
        if (data.waiting_message || data.warning_message) {
          setError(data.waiting_message || data.warning_message);
        }

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
            event_specialty_id: "",
            day_id: "",
            hour_id: "",
          },
        ]);
        
        if (mode === 'different') {
          setAppointmentDays({});
          setAppointmentHours({});
        }
        
        if (mode === 'same') {
          checkAvailableSlots();
        }
        
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

  const handleResetTestAppointments = async () => {
    if (testAppointmentsCount === 0) {
      setError("لا توجد مواعيد تجريبية لإعادة تعيينها");
      return;
    }

    const confirmReset = window.confirm(
      `هل أنت متأكد من إعادة تعيين حالة جميع المواعيد التجريبية (${testAppointmentsCount}) إلى "قيد الانتظار"؟`
    );

    if (!confirmReset) return;

    setLoading(true);
    setError("");
    setSuccess("");
    setInfo("جاري إعادة تعيين الحالات...");

    try {
      const res = await fetch(`${apiUrl}/api/test-appointments/reset-status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(`تم إعادة تعيين حالة ${data.updated_count} موعد تجريبي إلى "قيد الانتظار" بنجاح!`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setError(data.message || "حدث خطأ أثناء إعادة تعيين الحالات");
      }
    } catch (err) {
      console.error("Reset status error:", err);
      setError("حدث خطأ في الاتصال بالخادم");
    } finally {
      setLoading(false);
      setInfo("");
    }
  };

  const handleDeleteTestAppointments = async () => {
    if (testAppointmentsCount === 0) {
      setError("لا توجد مواعيد تجريبية لحذفها");
      return;
    }

    const confirmDelete = window.confirm(
      `هل أنت متأكد من حذف جميع المواعيد التجريبية (${testAppointmentsCount} موعد)؟\n` +
      "هذا الإجراء لا يمكن التراجع عنه!"
    );

    if (!confirmDelete) return;

    setLoading(true);
    setError("");
    setSuccess("");
    setInfo("جاري حذف المواعيد التجريبية...");

    try {
      const res = await fetch(`${apiUrl}/api/test-appointments/delete-all`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(`تم حذف ${data.deleted_count} موعد تجريبي بنجاح!`);
        await countTestAppointments();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setError(data.message || "حدث خطأ أثناء حذف المواعيد التجريبية");
      }
    } catch (err) {
      console.error("Delete test appointments error:", err);
      setError("حدث خطأ في الاتصال بالخادم");
    } finally {
      setLoading(false);
      setInfo("");
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
          قم بإضافة مواعيد متعددة في نفس الحدث
        </p>
      </div>

      {/* Mode Selector */}
      <div className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-xl border border-purple-200">
        <h3 className="text-lg font-bold text-gray-800 mb-4 font-droid-arabic-kufi">
          اختر طريقة الإضافة
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() => handleModeChange('same')}
            className={`p-4 rounded-lg border-2 transition-all duration-200 ${
              mode === 'same'
                ? 'border-blue-600 bg-blue-50 shadow-md'
                : 'border-gray-300 bg-white hover:border-blue-400'
            }`}
          >
            <div className="flex items-center justify-center gap-3">
              <Calendar className={`w-6 h-6 ${mode === 'same' ? 'text-blue-600' : 'text-gray-600'}`} />
              <div className="text-right">
                <h4 className={`font-bold font-droid-arabic-kufi ${mode === 'same' ? 'text-blue-900' : 'text-gray-700'}`}>
                  نفس التخصص والوقت
                </h4>
                <p className="text-sm text-gray-600 font-droid-arabic-kufi">
                  جميع المرضى في نفس التخصص واليوم والساعة
                </p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleModeChange('different')}
            className={`p-4 rounded-lg border-2 transition-all duration-200 ${
              mode === 'different'
                ? 'border-purple-600 bg-purple-50 shadow-md'
                : 'border-gray-300 bg-white hover:border-purple-400'
            }`}
          >
            <div className="flex items-center justify-center gap-3">
              <CalendarDays className={`w-6 h-6 ${mode === 'different' ? 'text-purple-600' : 'text-gray-600'}`} />
              <div className="text-right">
                <h4 className={`font-bold font-droid-arabic-kufi ${mode === 'different' ? 'text-purple-900' : 'text-gray-700'}`}>
                  تخصصات وأوقات مختلفة
                </h4>
                <p className="text-sm text-gray-600 font-droid-arabic-kufi">
                  كل مريض في تخصص ويوم وساعة مختلفة
                </p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleModeChange('test')}
            className={`p-4 rounded-lg border-2 transition-all duration-200 ${
              mode === 'test'
                ? 'border-orange-600 bg-orange-50 shadow-md'
                : 'border-gray-300 bg-white hover:border-orange-400'
            }`}
          >
            <div className="flex items-center justify-center gap-3">
              <TestTube2 className={`w-6 h-6 ${mode === 'test' ? 'text-orange-600' : 'text-gray-600'}`} />
              <div className="text-right">
                <h4 className={`font-bold font-droid-arabic-kufi ${mode === 'test' ? 'text-orange-900' : 'text-gray-700'}`}>
                  مواعيد تجريبية
                </h4>
                <p className="text-sm text-gray-600 font-droid-arabic-kufi">
                  إنشاء مواعيد تجريبية للتدريب
                </p>
              </div>
            </div>
          </button>
        </div>
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

      {info && (
        <div className="mb-6 p-4 bg-blue-50 border-r-4 border-blue-500 text-blue-700 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 ml-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span className="font-droid-arabic-kufi">{info}</span>
          </div>
        </div>
      )}

      {/* Test Mode Content */}

      {/* ✅ UPDATED: Test Mode Content - No event selection needed */}
      {mode === 'test' && (
        <>
          {/* Test Event Info */}
          {testEventInfo && (
            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-6 rounded-xl shadow-sm border border-orange-100 mb-6">
              <h3 className="text-xl font-bold text-orange-900 mb-4 font-droid-arabic-kufi flex items-center gap-2">
                <TestTube2 className="w-6 h-6" />
                حدث الاختبار
              </h3>
              <div className="bg-white p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-droid-arabic-kufi">اسم الحدث:</span>
                  <span className="font-bold text-orange-600 font-droid-arabic-kufi">{testEventInfo.name}</span>
                </div>
                <div className="mt-2 text-sm text-gray-500 font-droid-arabic-kufi">
                  رقم الحدث: {TEST_EVENT_ID}
                </div>
              </div>
            </div>
          )}

          {/* Test Info */}
          {eventSpecialties.length > 0 && (
            <div className="mb-6 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
              <h3 className="font-bold text-blue-900 mb-3 font-droid-arabic-kufi flex items-center gap-2">
                <TestTube2 className="w-5 h-5" />
                معلومات المواعيد التجريبية
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700 font-droid-arabic-kufi">
                <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                  <span>عدد التخصصات:</span>
                  <span className="font-bold text-blue-600">{eventSpecialties.length}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                  <span>عدد المرضى لكل تخصص:</span>
                  <span className="font-bold text-blue-600">15</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                  <span>إجمالي المواعيد المتوقعة:</span>
                  <span className="font-bold text-green-600">{eventSpecialties.length * 15}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                  <span>المواعيد التجريبية الحالية:</span>
                  <span className="font-bold text-purple-600">
                    {counting ? "..." : testAppointmentsCount}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              type="button"
              onClick={handleCreateTestAppointments}
              disabled={loading || !testEventInfo || eventSpecialties.length === 0}
              className={`
                px-6 py-4 rounded-xl font-bold text-lg font-droid-arabic-kufi
                transition-all duration-200 shadow-lg flex items-center justify-center gap-3
                ${loading || !testEventInfo || eventSpecialties.length === 0
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
                  جاري الإنشاء...
                </>
              ) : (
                <>
                  <Zap className="w-6 h-6" />
                  إنشاء مواعيد تجريبية
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleResetTestAppointments}
              disabled={loading || testAppointmentsCount === 0}
              className={`
                px-6 py-4 rounded-xl font-bold text-lg font-droid-arabic-kufi
                transition-all duration-200 shadow-lg flex items-center justify-center gap-3
                ${loading || testAppointmentsCount === 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white transform hover:scale-105'
                }
              `}
            >
              <RotateCcw className="w-6 h-6" />
              إعادة تعيين الحالات
            </button>

            <button
              type="button"
              onClick={handleDeleteTestAppointments}
              disabled={loading || testAppointmentsCount === 0}
              className={`
                px-6 py-4 rounded-xl font-bold text-lg font-droid-arabic-kufi
                transition-all duration-200 shadow-lg flex items-center justify-center gap-3
                ${loading || testAppointmentsCount === 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white transform hover:scale-105'
                }
              `}
            >
              <Trash2 className="w-6 h-6" />
              حذف جميع المواعيد التجريبية
            </button>
          </div>
        </>
      )}

      {/* Same/Different Mode Content */}
      {(mode === 'same' || mode === 'different') && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Event Selection (Always visible) */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl shadow-sm border border-blue-100">
            <h3 className="text-xl font-bold text-blue-900 mb-4 font-droid-arabic-kufi">
              اختيار الحدث
            </h3>
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
          </div>

          {/* For 'same' mode - Show shared specialty/day/hour */}
          {mode === 'same' && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl shadow-sm border border-blue-100">
              <h3 className="text-xl font-bold text-blue-900 mb-4 font-droid-arabic-kufi">
                معلومات الموعد المشتركة
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          )}

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
                disabled={
                  (mode === 'same' && (!selectedHour || (availableSlots && appointments.length >= availableSlots.available)))
                }
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

                {/* For 'different' mode - Show specialty/day/hour per appointment */}
                {mode === 'different' && (
                  <div className="mb-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <h5 className="text-sm font-bold text-purple-900 mb-3 font-droid-arabic-kufi">
                      معلومات الموعد الخاصة بهذا المريض
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Select
                        icon={Stethoscope}
                        label="التخصص"
                        name={`specialty_${idx}`}
                        type="select"
                        value={app.event_specialty_id}
                        onChange={(e) => handleAppointmentSpecialtyChange(idx, e.target.value)}
                        placeholder="اختر تخصصاً"
                        required
                        disabled={!selectedEvent}
                        options={specialtyOptions}
                      />

                      <Select
                        icon={CalendarDays}
                        label="اليوم"
                        name={`day_${idx}`}
                        type="select"
                        value={app.day_id}
                        onChange={(e) => handleAppointmentDayChange(idx, e.target.value)}
                        placeholder="اختر يوماً"
                        required
                        disabled={!app.event_specialty_id}
                        options={getAppointmentDayOptions(idx)}
                      />

                      <Select
                        icon={Clock}
                        label="الساعة"
                        name={`hour_${idx}`}
                        type="select"
                        value={app.hour_id}
                        onChange={(e) => handleAppointmentHourChange(idx, e.target.value)}
                        placeholder="اختر ساعة"
                        required
                        disabled={!app.day_id}
                        options={getAppointmentHourOptions(idx)}
                      />
                    </div>
                  </div>
                )}

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
                      رقم الهاتف 2
                    </label>
                    <input
                      type="tel"
                      placeholder="0XXXXXXXXX (اختياري)"
                      value={app.phone2}
                      onChange={(e) => handleChange(idx, "phone2", e.target.value)}
                      className="p-3 h-12 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-300 focus:border-blue-300 focus:outline-none transition"
                    />
                  </div>

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
              disabled={loading || (mode === 'same' && !selectedHour)}
              className={`
                px-8 py-4 rounded-lg font-bold text-lg font-droid-arabic-kufi
                transition-all duration-200 shadow-lg flex items-center gap-3
                ${loading || (mode === 'same' && !selectedHour)
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
      )}
    </div>
  );
};

export default AddMultipleAppointments;