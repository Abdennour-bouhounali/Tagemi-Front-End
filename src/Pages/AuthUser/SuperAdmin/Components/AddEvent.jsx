const apiUrl = import.meta.env.VITE_API_URL;

import { useState, useContext, useEffect, useCallback } from "react";
import { Trash2, Plus, Loader2, CheckCircle, Copy, Eye, EyeOff } from "lucide-react";
import { AppContext } from "../../../../Context/AppContext";
import { Select } from '../../../Common/FormInputs';
import algeriaLocations from '../../../../data/algeria_locations.json';
import { CheckSquare, Square,Shield } from 'lucide-react';

export default function AddEvent({ getEvents }) {
  const { token } = useContext(AppContext);
  
  // Form state
const [form, setForm] = useState({
    name: "",
    date: "",
    state: "",
    nbr_of_allowed_specialties: 1,
    city: "",
    description: "",
    rules_ids: [], // ADD THIS
    is_active: true,
    is_tawat: true,
  });

  const fetchRules = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/rules`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('Failed to fetch rules');
      
      const data = await res.json();
      setRules(data || []);
    } catch (err) {
      console.error("Error fetching rules:", err);
      setMessage("❌ خطأ في تحميل القواعد");
    }
  };
  
  // Data state
  const [specialties, setSpecialties] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [eventSpecialties, setEventSpecialties] = useState([]);
  const [availableCities, setAvailableCities] = useState([]);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [message, setMessage] = useState("");
  
  // Credentials display state
  const [showCredentials, setShowCredentials] = useState(false);
  const [credentials, setCredentials] = useState(null);
  const [showPasswords, setShowPasswords] = useState({});
  const [copiedField, setCopiedField] = useState(null);
  const [rules, setRules] = useState([]);
  const [selectedRules, setSelectedRules] = useState([]);
  // Fetch initial data
useEffect(() => {
    const loadData = async () => {
      setDataLoading(true);
      await Promise.all([fetchSpecialties(), fetchDoctors(), fetchRules()]);
      setDataLoading(false);
    };
    loadData();
  }, [token]);
  const toggleRuleSelection = useCallback((ruleId) => {
    setSelectedRules(prev => {
      if (prev.includes(ruleId)) {
        return prev.filter(id => id !== ruleId);
      } else {
        return [...prev, ruleId];
      }
    });
  }, []);

  const fetchSpecialties = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/specialty`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('Failed to fetch specialties');
      
      const data = await res.json();
      setSpecialties(data.specialties || []);
    } catch (err) {
      console.error("Error fetching specialties:", err);
      setMessage("❌ خطأ في تحميل التخصصات");
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/doctors`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) throw new Error('Failed to fetch doctors');
      
      const data = await res.json();
      setDoctors(data.doctors || []);
    } catch (err) {
      console.error("Error fetching doctors:", err);
      setMessage("❌ خطأ في تحميل الأطباء");
    }
  };

  const handleChange = useCallback((e) => {
    const { name, type, checked, value } = e.target;
    setForm(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  }, []);

  // Handle state selection and populate cities
  const handleStateChange = useCallback((e) => {
    const stateName = e.target.value;
    setForm(prev => ({ ...prev, state: stateName, city: '' }));
    
    // Find the selected wilaya and set its communes
    const selectedWilaya = algeriaLocations.algeria_locations.find(
      loc => loc.name_ar === stateName
    );
    
    if (selectedWilaya) {
      setAvailableCities(selectedWilaya.communes || []);
    } else {
      setAvailableCities([]);
    }
  }, []);

  // Specialty operations
const addSpecialty = useCallback(() => {
  const defaultHours = Array.from({ length: 10 }, (_, i) => ({
    time: `${String(8 + i).padStart(2, '0')}:00:00`
  }));

  setEventSpecialties(prev => [
    ...prev,
    {
      id: "",
      description: "", // ADD THIS
      doctors: [],
      is_saturated: false,
      days: [{
        day_date: form.date,
        number_per_hour: 20,
        hours: defaultHours,
      }],
    },
  ]);
}, [form.date]);
const updateSpecialtyDescription = useCallback((index, description) => {
  setEventSpecialties(prev => {
    const updated = [...prev];
    updated[index].description = description;
    return updated;
  });
}, []);
  const addDay = useCallback((specIndex) => {
    // Create default hours from 8:00 to 17:00
    const defaultHours = Array.from({ length: 10 }, (_, i) => ({
      time: `${String(8 + i).padStart(2, '0')}:00:00`
    }));

    setEventSpecialties(prev => {
      const updated = [...prev];
      updated[specIndex].days.push({
        day_date: form.date,
        number_per_hour: 20,
        hours: defaultHours,
      });
      return updated;
    });
  }, [form.date]);

  const updateDayNumberPerHour = useCallback((specIndex, dayIndex, value) => {
    setEventSpecialties(prev => {
      const updated = [...prev];
      updated[specIndex].days[dayIndex].number_per_hour = Math.min(400, Math.max(1, parseInt(value) || 6));
      return updated;
    });
  }, []);

  const removeSpecialty = useCallback((index) => {
    if (window.confirm('هل أنت متأكد من حذف هذا التخصص؟')) {
      setEventSpecialties(prev => prev.filter((_, i) => i !== index));
    }
  }, []);

  const updateSpecialty = useCallback((index, specialtyId) => {
    setEventSpecialties(prev => {
      const updated = [...prev];
      updated[index].id = parseInt(specialtyId);
      return updated;
    });
  }, []);

  const toggleSaturated = useCallback((index) => {
    setEventSpecialties(prev => {
      const updated = [...prev];
      updated[index].is_saturated = !updated[index].is_saturated;
      return updated;
    });
  }, []);

  const updateDoctors = useCallback((index, doctorIds) => {
    setEventSpecialties(prev => {
      const updated = [...prev];
      updated[index].doctors = doctorIds.map((id) => parseInt(id));
      return updated;
    });
  }, []);

  const removeDay = useCallback((specIndex, dayIndex) => {
    if (window.confirm('هل أنت متأكد من حذف هذا اليوم؟')) {
      setEventSpecialties(prev => {
        const updated = [...prev];
        updated[specIndex].days = updated[specIndex].days.filter(
          (_, i) => i !== dayIndex
        );
        return updated;
      });
    }
  }, []);

  const updateDay = useCallback((specIndex, dayIndex, field, value) => {
    setEventSpecialties(prev => {
      const updated = [...prev];
      updated[specIndex].days[dayIndex][field] = value;
      return updated;
    });
  }, []);

  // Hour operations
  const addHour = useCallback((specIndex, dayIndex, time) => {
    setEventSpecialties(prev => {
      const updated = [...prev];
      const existingHours = updated[specIndex].days[dayIndex].hours;
      
      const formattedTime = `${String(time).padStart(2, '0')}:00:00`;
      
      if (existingHours.some(h => h.time === formattedTime)) {
        setMessage("⚠️ هذه الساعة موجودة بالفعل");
        setTimeout(() => setMessage(""), 3000);
        return prev;
      }
      
      updated[specIndex].days[dayIndex].hours.push({ time: formattedTime });
      return updated;
    });
  }, []);

  const removeHour = useCallback((specIndex, dayIndex, hourIndex) => {
    setEventSpecialties(prev => {
      const updated = [...prev];
      updated[specIndex].days[dayIndex].hours = updated[specIndex].days[
        dayIndex
      ].hours.filter((_, i) => i !== hourIndex);
      return updated;
    });
  }, []);

  const validateForm = () => {
    if (eventSpecialties.length === 0) {
      setMessage("❌ يجب إضافة تخصص واحد على الأقل");
      return false;
    }

    for (let i = 0; i < eventSpecialties.length; i++) {
      const spec = eventSpecialties[i];
      
      if (!spec.id) {
        setMessage(`❌ يجب اختيار التخصص ${i + 1}`);
        return false;
      }

      if (spec.days.length === 0) {
        setMessage(`❌ يجب إضافة يوم واحد على الأقل للتخصص ${i + 1}`);
        return false;
      }

      for (let j = 0; j < spec.days.length; j++) {
        const day = spec.days[j];
        
        if (!day.day_date) {
          setMessage(`❌ يجب تحديد تاريخ اليوم ${j + 1} في التخصص ${i + 1}`);
          return false;
        }

        if (day.hours.length === 0) {
          setMessage(`❌ يجب إضافة ساعة واحدة على الأقل لليوم ${j + 1} في التخصص ${i + 1}`);
          return false;
        }
      }
    }

    return true;
  };

  // Copy to clipboard function
  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Toggle password visibility
  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // Download credentials as CSV
  const downloadCredentials = () => {
    if (!credentials) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "النوع,التخصص,الاسم,البريد الإلكتروني,كلمة المرور\n";
    
    if (credentials.special_admin) {
      const row = [
        credentials.special_admin.type,
        credentials.special_admin.specialty,
        credentials.special_admin.name,
        credentials.special_admin.email,
        credentials.special_admin.password
      ].map(cell => `"${cell}"`).join(",");
      csvContent += row + "\n";
    }

    if (credentials.recipient_admin) {
      const row = [
        credentials.recipient_admin.type,
        credentials.recipient_admin.specialty,
        credentials.recipient_admin.name,
        credentials.recipient_admin.email,
        credentials.recipient_admin.password
      ].map(cell => `"${cell}"`).join(",");
      csvContent += row + "\n";
    }

    if (credentials.check_admin) {
      const row = [
        credentials.check_admin.type,
        credentials.check_admin.specialty,
        credentials.check_admin.name,
        credentials.check_admin.email,
        credentials.check_admin.password
      ].map(cell => `"${cell}"`).join(",");
      csvContent += row + "\n";
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${form.name}_credentials.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setShowCredentials(false);
    setCredentials(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    const payload = {
      ...form,
      rules_ids: selectedRules, // ADD THIS
      specialties: eventSpecialties,
    };

    try {
      const res = await fetch(`${apiUrl}/api/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      
      if (res.ok) {
        setMessage(`✅ ${data.message}`);
        
        if (data.credentials) {
          setCredentials(data.credentials);
          setShowCredentials(true);
        }
        
        setForm({
          name: "",
          date: "",
          state: "",
          city: "",
          description: "",
          is_active: true,
          is_tawat: true,
        });
        setEventSpecialties([]);
        setAvailableCities([]);
        
        if (getEvents) {
          await getEvents();
        }
        
        setTimeout(() => {
          document.getElementById('credentials-section')?.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }, 100);
      } else {
        setMessage(`❌ ${data.message || 'حدث خطأ أثناء إنشاء الحدث'}`);
      }
    } catch (error) {
      console.error("Error creating event:", error);
      setMessage("❌ خطأ في الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  };

  const timeOptions = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

  if (dataLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="animate-spin" size={40} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Credentials Display Section */}
      {showCredentials && credentials && (
        <div id="credentials-section" className="mb-8 bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl shadow-xl p-6 border-2 border-green-200">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="text-green-600" size={32} />
              <div>
                <h2 className="text-2xl font-bold text-gray-800 font-droid-arabic-kufi">
                  تم إنشاء الحدث بنجاح! 🎉
                </h2>
                <p className="text-sm text-gray-600 font-droid-arabic-kufi mt-1">
                  احفظ بيانات الدخول التالية في مكان آمن
                </p>
              </div>
            </div>
            <button
              onClick={downloadCredentials}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition font-droid-arabic-kufi"
            >
              <Loader2 size={18} />
              تحميل CSV
            </button>
          </div>

          <div className="space-y-4">
            {/* Special Admin */}
            {credentials.special_admin && (
              <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500 shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-lg text-blue-700 font-droid-arabic-kufi">
                    {credentials.special_admin.type}
                  </h3>
                  <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-droid-arabic-kufi">
                    {credentials.special_admin.specialty}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-droid-arabic-kufi">الاسم:</span>
                    <span className="font-mono font-semibold">{credentials.special_admin.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-droid-arabic-kufi">البريد:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono bg-gray-100 px-2 py-1 rounded">{credentials.special_admin.email}</span>
                      <button
                        onClick={() => copyToClipboard(credentials.special_admin.email, 'special-email')}
                        className="text-blue-600 hover:text-blue-800"
                        title="نسخ"
                      >
                        {copiedField === 'special-email' ? <CheckCircle size={16} /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-droid-arabic-kufi">كلمة المرور:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                        {showPasswords['special'] ? credentials.special_admin.password : '••••••••'}
                      </span>
                      <button
                        onClick={() => togglePasswordVisibility('special')}
                        className="text-gray-600 hover:text-gray-800"
                        title="إظهار/إخفاء"
                      >
                        {showPasswords['special'] ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <button
                        onClick={() => copyToClipboard(credentials.special_admin.password, 'special-pass')}
                        className="text-blue-600 hover:text-blue-800"
                        title="نسخ"
                      >
                        {copiedField === 'special-pass' ? <CheckCircle size={16} /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Recipient Admin */}
            {credentials.recipient_admin && (
              <div className="bg-white rounded-lg p-4 border-l-4 border-purple-500 shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-lg text-purple-700 font-droid-arabic-kufi">
                    {credentials.recipient_admin.type}
                  </h3>
                  <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-droid-arabic-kufi">
                    {credentials.recipient_admin.specialty}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-droid-arabic-kufi">الاسم:</span>
                    <span className="font-mono font-semibold">{credentials.recipient_admin.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-droid-arabic-kufi">البريد:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono bg-gray-100 px-2 py-1 rounded">{credentials.recipient_admin.email}</span>
                      <button
                        onClick={() => copyToClipboard(credentials.recipient_admin.email, 'recipient-email')}
                        className="text-blue-600 hover:text-blue-800"
                        title="نسخ"
                      >
                        {copiedField === 'recipient-email' ? <CheckCircle size={16} /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-droid-arabic-kufi">كلمة المرور:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                        {showPasswords['recipient'] ? credentials.recipient_admin.password : '••••••••'}
                      </span>
                      <button
                        onClick={() => togglePasswordVisibility('recipient')}
                        className="text-gray-600 hover:text-gray-800"
                        title="إظهار/إخفاء"
                      >
                        {showPasswords['recipient'] ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <button
                        onClick={() => copyToClipboard(credentials.recipient_admin.password, 'recipient-pass')}
                        className="text-blue-600 hover:text-blue-800"
                        title="نسخ"
                      >
                        {copiedField === 'recipient-pass' ? <CheckCircle size={16} /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Check Admin */}
            {credentials.check_admin && (
              <div className="bg-white rounded-lg p-4 border-l-4 border-green-500 shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-lg text-green-700 font-droid-arabic-kufi">
                    {credentials.check_admin.type}
                  </h3>
                  <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-droid-arabic-kufi">
                    {credentials.check_admin.specialty}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-droid-arabic-kufi">الاسم:</span>
                    <span className="font-mono font-semibold">{credentials.check_admin.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-droid-arabic-kufi">البريد:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono bg-gray-100 px-2 py-1 rounded">{credentials.check_admin.email}</span>
                      <button
                        onClick={() => copyToClipboard(credentials.check_admin.email, 'check-email')}
                        className="text-blue-600 hover:text-blue-800"
                        title="نسخ"
                      >
                        {copiedField === 'check-email' ? <CheckCircle size={16} /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-droid-arabic-kufi">كلمة المرور:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                        {showPasswords['check'] ? credentials.check_admin.password : '••••••••'}
                      </span>
                      <button
                        onClick={() => togglePasswordVisibility('check')}
                        className="text-gray-600 hover:text-gray-800"
                        title="إظهار/إخفاء"
                      >
                        {showPasswords['check'] ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <button
                        onClick={() => copyToClipboard(credentials.check_admin.password, 'check-pass')}
                        className="text-blue-600 hover:text-blue-800"
                        title="نسخ"
                      >
                        {copiedField === 'check-pass' ? <CheckCircle size={16} /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded font-droid-arabic-kufi">
            <p className="text-yellow-800 text-sm">
              <strong>⚠️ تحذير:</strong> لن تتمكن من عرض كلمات المرور مرة أخرى. يرجى حفظها في مكان آمن أو تحميل ملف CSV الآن!
            </p>
          </div>
        </div>
      )}

      {/* Event Creation Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8 mb-8 font-droid-arabic-kufi">
        <h2 className="text-3xl font-bold mb-6 text-gray-800 text-center">إضافة حدث جديد</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="event-name" className="block text-sm font-medium mb-1 text-gray-700">
              اسم الحدث *
            </label>
            <input
              type="text"
              id="event-name"
              name="name"
              placeholder="اسم الحدث"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label htmlFor="event-date" className="block text-sm font-medium mb-1 text-gray-700">
              تاريخ الحدث *
            </label>
            <input
              type="date"
              id="event-date"
              name="date"
              value={form.date}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        {/* State and City Selection using Select component */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Select
            label="الولاية"
            name="state"
            value={form.state}
            onChange={handleStateChange}
            options={algeriaLocations.algeria_locations.map(loc => ({
              value: loc.name_ar,
              label: `${loc.name_ar} - ${loc.code}`
            }))}
            placeholder="اختر الولاية"
          />

          <Select
            label="البلدية"
            name="city"
            value={form.city}
            onChange={handleChange}
            options={availableCities.map(city => ({
              value: city,
              label: city
            }))}
            placeholder={form.state ? "اختر البلدية" : "اختر الولاية أولاً"}
            disabled={!form.state || availableCities.length === 0}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="flex items-center">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="is_active"
                checked={form.is_active}
                onChange={handleChange}
                className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">الحدث نشط</span>
                <p className="text-xs text-gray-500">تفعيل الحدث يسمح بالحجوزات</p>
              </div>
            </label>
          </div>

          <div className="flex items-center">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="is_tawat"
                checked={form.is_tawat}
                onChange={handleChange}
                className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">حدث TAWAT</span>
                <p className="text-xs text-gray-500">تحديد نوع الحدث</p>
              </div>
            </label>
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="event-description" className="block text-sm font-medium mb-1 text-gray-700">
            الوصف
          </label>
          <textarea
            id="event-description"
            name="description"
            placeholder="الوصف"
            value={form.description}
            onChange={handleChange}
            rows="3"
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="nbr-specialties" className="block text-sm font-medium mb-1 text-gray-700">
            عدد التخصصات المسموح بها للحجز *
          </label>
          <input
            type="number"
            id="nbr-specialties"
            name="nbr_of_allowed_specialties"
            value={form.nbr_of_allowed_specialties}
            onChange={handleChange}
            min="1"
            max="5"
            required
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            الحد الأدنى: 1، الحد الأقصى: 5 تخصصات
          </p>
        </div>
                <div className="mb-6 border-t pt-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-6 h-6 text-blue-600" />
            <h3 className="text-xl font-bold text-gray-800">قواعد الحدث</h3>
          </div>
          
          {rules.length === 0 ? (
            <p className="text-gray-500 text-center py-4">لا توجد قواعد متاحة</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto bg-gray-50 rounded-lg p-4">
              {rules.map((rule) => (
                <label
                  key={rule.id}
                  className={`
                    flex items-start gap-3 p-4 rounded-lg cursor-pointer transition-all
                    ${selectedRules.includes(rule.id)
                      ? 'bg-blue-100 border-2 border-blue-500'
                      : 'bg-white border-2 border-gray-200 hover:border-blue-300'
                    }
                  `}
                >
                  <div className="flex-shrink-0 mt-1">
                    {selectedRules.includes(rule.id) ? (
                      <CheckSquare className="w-5 h-5 text-blue-600" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedRules.includes(rule.id)}
                    onChange={() => toggleRuleSelection(rule.id)}
                    className="hidden"
                  />
                  <div className="flex-1">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {rule.rule}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          )}
          
          <p className="text-sm text-gray-500 mt-2">
            تم تحديد {selectedRules.length} من {rules.length} قاعدة
          </p>
        </div>
        {/* Specialties Section */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800">التخصصات</h3>
            <button
              type="button"
              onClick={addSpecialty}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
            >
              <Plus size={20} />
              إضافة تخصص
            </button>
          </div>

          {eventSpecialties.length === 0 && (
            <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <p className="text-gray-500">لم تتم إضافة أي تخصصات بعد</p>
              <p className="text-sm text-gray-400 mt-1">انقر على "إضافة تخصص" للبدء</p>
            </div>
          )}

          {eventSpecialties.map((spec, specIndex) => (
            <div key={specIndex} className="border rounded-lg p-4 mb-4 bg-gray-50">
              <div className="flex justify-between items-start mb-4">
                <h4 className="font-bold text-lg">تخصص {specIndex + 1}</h4>
                <button
                  type="button"
                  onClick={() => removeSpecialty(specIndex)}
                  className="text-red-600 hover:text-red-800 transition"
                  title="حذف التخصص"
                >
                  <Trash2 size={20} />
                </button>
              </div>

              {/* Specialty Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  التخصص *
                </label>
                <select
                  value={spec.id}
                  onChange={(e) => updateSpecialty(specIndex, e.target.value)}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  required
                >
                  <option value="">اختر التخصص</option>
                  {specialties.map((specialty) => (
                    <option key={specialty.id} value={specialty.id}>
                      {specialty.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-gray-700">
                وصف التخصص (اختياري)
              </label>
              <textarea
                value={spec.description || ""}
                onChange={(e) => updateSpecialtyDescription(specIndex, e.target.value)}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                rows="3"
                placeholder="أضف وصفاً للتخصص (مثال: متطلبات خاصة، ملاحظات، إلخ)"
                maxLength="500"
              />
              <p className="text-xs text-gray-500 mt-1">
                الحد الأقصى: 500 حرف ({spec.description?.length || 0}/500)
              </p>
            </div>

              {/* Saturation */}
              <div className="mb-4">
                <div className="flex items-center">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={spec.is_saturated}
                      onChange={() => toggleSaturated(specIndex)}
                      className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700">التخصص مشبع</span>
                      <p className="text-xs text-gray-500">تحديد هذا الخيار يعني أن التخصص ممتلئ</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Doctors Selection */}
              <div className="mb-3">
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  الأطباء (اختياري)
                </label>
                <select
                  multiple
                  value={spec.doctors}
                  onChange={(e) =>
                    updateDoctors(
                      specIndex,
                      Array.from(e.target.selectedOptions, (o) => o.value)
                    )
                  }
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  size="3"
                >
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">اضغط Ctrl لاختيار عدة أطباء</p>
              </div>

              {/* Days Section */}
              <div className="mb-3">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-medium text-gray-700">الأيام *</label>
                  <button
                    type="button"
                    onClick={() => addDay(specIndex)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                  >
                    <Plus size={16} />
                    إضافة يوم
                  </button>
                </div>

                {spec.days.length === 0 && (
                  <div className="text-center py-4 bg-white rounded border border-gray-200">
                    <p className="text-sm text-gray-500">لم تتم إضافة أي أيام بعد</p>
                  </div>
                )}

                {spec.days.map((day, dayIndex) => (
                  <div key={dayIndex} className="border rounded p-3 mb-3 bg-white">
                    <div className="flex justify-between items-start mb-2">
                      <h5 className="font-semibold">يوم {dayIndex + 1}</h5>
                      <button
                        type="button"
                        onClick={() => removeDay(specIndex, dayIndex)}
                        className="text-red-600 hover:text-red-800 transition"
                        title="حذف اليوم"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="mb-2">
                      <label className="block text-xs font-medium mb-1 text-gray-600">
                        التاريخ *
                      </label>
                      <input
                        type="date"
                        value={day.day_date}
                        onChange={(e) =>
                          updateDay(specIndex, dayIndex, "day_date", e.target.value)
                        }
                        className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>

                    <div className="mb-2">
                      <label className="block text-xs font-medium mb-1 text-gray-600">
                        عدد الأشخاص في الساعة *
                      </label>
                      <input
                        type="number"
                        value={day.number_per_hour}
                        onChange={(e) => updateDayNumberPerHour(specIndex, dayIndex, e.target.value)}
                        className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-indigo-500"
                        min="1"
                        max="400"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">الحد الأدنى: 1، الحد الأقصى: 400</p>
                    </div>

                    {/* Hours Selection */}
                    <div>
                      <label className="block text-xs font-medium mb-2 text-gray-600">
                        الساعات *
                      </label>
                      <div className="flex gap-2 flex-wrap mb-2">
                        {timeOptions.map((hour) => (
                          <button
                            key={hour}
                            type="button"
                            onClick={() => addHour(specIndex, dayIndex, hour)}
                            className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded text-sm hover:bg-indigo-200 transition"
                            title={`إضافة الساعة ${hour}:00`}
                          >
                            {hour}:00
                          </button>
                        ))}
                      </div>

                      {day.hours.length === 0 ? (
                        <div className="text-center py-2 bg-gray-50 rounded border border-gray-200">
                          <p className="text-xs text-gray-500">لم تتم إضافة أي ساعات بعد</p>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {day.hours.map((hour, hourIndex) => (
                            <div
                              key={hourIndex}
                              className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded text-sm"
                            >
                              <span>{hour.time.slice(0, 5)}</span>
                              <button
                                type="button"
                                onClick={() => removeHour(specIndex, dayIndex, hourIndex)}
                                className="text-red-600 hover:text-red-800 font-bold transition"
                                title="حذف الساعة"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              جارٍ الإضافة...
            </>
          ) : (
            "إضافة الحدث"
          )}
        </button>

        {message && !showCredentials && (
          <div className={`text-center font-semibold mt-4 p-3 rounded-lg ${
            message.includes('✅') ? 'bg-green-100 text-green-800' : 
            message.includes('⚠️') ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {message}
          </div>
        )}
      </form>
    </div>
  );
}