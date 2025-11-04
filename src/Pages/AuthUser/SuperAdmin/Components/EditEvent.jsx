import { useState, useContext, useEffect, useCallback } from "react";
import { X, Save, Loader2, Plus, Trash2 } from "lucide-react";
import { AppContext } from "../../../../Context/AppContext";

const apiUrl = import.meta.env.VITE_API_URL;

export default function EditEvent({ event, onClose, onSuccess }) {
  const { token } = useContext(AppContext);
  
  // Form state
  const [form, setForm] = useState({
    name: event.name || "",
    date: event.date ? event.date.split('T')[0] : "",
    state: event.state || "",
    city: event.city || "",
    description: event.description || "",
    is_active: event.is_active ?? true,
    is_tawat: event.is_tawat ?? true,
  });
  
  // Data state
  const [specialties, setSpecialties] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [eventSpecialties, setEventSpecialties] = useState([]);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [message, setMessage] = useState("");

  // Fetch initial data
  useEffect(() => {
    const loadData = async () => {
      setDataLoading(true);
      await Promise.all([
        fetchSpecialties(), 
        fetchDoctors(),
        fetchEventSpecialties()
      ]);
      setDataLoading(false);
    };
    loadData();
  }, [event.id]);

  const fetchSpecialties = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/specialty`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('Failed to fetch specialties');
      
      const data = await res.json();
      setSpecialties(data.specialties || data || []);
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

  const updateDayNumberPerHour = useCallback((specIndex, dayIndex, value) => {
    setEventSpecialties(prev => {
      const updated = [...prev];
      updated[specIndex].days[dayIndex].number_per_hour = Math.min(400, Math.max(1, parseInt(value) || 6));
      return updated;
    });
  }, []);

const fetchEventSpecialties = async () => {
  try {
    const res = await fetch(`${apiUrl}/api/events/${event.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!res.ok) throw new Error('Failed to fetch event specialties');
    
    const data = await res.json();
    
    const transformedSpecialties = await Promise.all(
      (data.event?.event_specialties || []).map(async (es) => {
        const daysRes = await fetch(
          `${apiUrl}/api/event-specialties/${es.id}/days`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const daysData = await daysRes.json();
        
        const daysWithHours = await Promise.all(
          (daysData.days || []).map(async (day) => {
            const hoursRes = await fetch(
              `${apiUrl}/api/days/${day.id}/hours`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            const hoursData = await hoursRes.json();
            
            return {
              id: day.id,
              day_date: day.day_date,
              number_per_hour: day.number_per_hour || 6,
              hours: (hoursData.hours || []).map(h => ({
                id: h.id,
                time: h.time
              }))
            };
          })
        );
        
        return {
          id: es.specialty_id,
          eventSpecialtyId: es.id,
          description: es.description || "", // ADD THIS
          doctors: (es.doctors || []).map(d => d.id),
          is_saturated: es.is_saturated || false,
          days: daysWithHours
        };
      })
    );
    
    setEventSpecialties(transformedSpecialties);
  } catch (err) {
    console.error("Error fetching event specialties:", err);
    setMessage("❌ خطأ في تحميل تخصصات الحدث");
  }
};

// 2. Add handler for description updates
const updateSpecialtyDescription = useCallback((index, description) => {
  setEventSpecialties(prev => {
    const updated = [...prev];
    updated[index].description = description;
    return updated;
  });
}, []);

  const handleChange = useCallback((e) => {
    const { name, type, checked, value } = e.target;
    setForm(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
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

  const updateDoctors = useCallback((index, doctorIds) => {
    setEventSpecialties(prev => {
      const updated = [...prev];
      updated[index].doctors = doctorIds.map((id) => parseInt(id));
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

  const addDay = useCallback((specIndex) => {
    setEventSpecialties(prev => {
      const updated = [...prev];
      updated[specIndex].days.push({
        id: null,
        day_date: "",
        number_per_hour: 20,
        hours: [],
        isNew: true
      });
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
      
      updated[specIndex].days[dayIndex].hours.push({ 
        id: null,
        time: formattedTime,
        isNew: true
      });
      return updated;
    });
  }, []);
const addSpecialty = useCallback(() => {
  setEventSpecialties(prev => [
    ...prev,
    {
      id: "",
      eventSpecialtyId: null,
      description: "", // ADD THIS
      doctors: [],
      is_saturated: false,
      days: [],
      isNew: true
    },
  ]);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...form,
        specialties: eventSpecialties,
      };

      const res = await fetch(`${apiUrl}/api/events/${event.id}/full`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'فشل تحديث الحدث');
      }
      
      setMessage("✅ تم تحديث الحدث والتخصصات بنجاح");
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);

    } catch (error) {
      console.error("Error updating event:", error);
      setMessage(`❌ ${error.message || 'خطأ في الاتصال بالخادم'}`);
    } finally {
      setLoading(false);
    }
  };

  const timeOptions = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

  if (dataLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8">
          <Loader2 className="animate-spin mx-auto" size={40} />
          <p className="text-center mt-4 font-droid-arabic-kufi">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full my-8">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl flex justify-between items-center z-10">
          <h2 className="text-2xl font-bold font-droid-arabic-kufi">
            تعديل الحدث: {event.name}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Event Basic Info */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-bold mb-4 text-gray-800 font-droid-arabic-kufi">
              معلومات الحدث الأساسية
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 font-droid-arabic-kufi">
                  اسم الحدث *
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 font-droid-arabic-kufi">
                  التاريخ *
                </label>
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 font-droid-arabic-kufi">
                  الولاية
                </label>
                <input
                  type="text"
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 font-droid-arabic-kufi">
                  المدينة
                </label>
                <input
                  type="text"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="flex items-center">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={form.is_active}
                    onChange={handleChange}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700 font-droid-arabic-kufi">
                      الحدث نشط
                    </span>
                    <p className="text-xs text-gray-500 font-droid-arabic-kufi">
                      تفعيل الحدث يسمح بالحجوزات
                    </p>
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
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700 font-droid-arabic-kufi">
                      حدث TAWAT
                    </span>
                    <p className="text-xs text-gray-500 font-droid-arabic-kufi">
                      تحديد نوع الحدث
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium mb-1 text-gray-700 font-droid-arabic-kufi">
                الوصف
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows="3"
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Specialties Section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800 font-droid-arabic-kufi">
                التخصصات ({eventSpecialties.length})
              </h3>
              <button
                type="button"
                onClick={addSpecialty}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition font-droid-arabic-kufi"
              >
                <Plus size={20} />
                إضافة تخصص
              </button>
            </div>

            {eventSpecialties.length === 0 && (
              <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <p className="text-gray-500 font-droid-arabic-kufi">لا توجد تخصصات</p>
                <p className="text-sm text-gray-400 mt-1 font-droid-arabic-kufi">
                  انقر على "إضافة تخصص" للبدء
                </p>
              </div>
            )}

            {eventSpecialties.map((spec, specIndex) => (
              <div key={specIndex} className="border rounded-lg p-4 mb-4 bg-gray-50">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="font-bold text-lg font-droid-arabic-kufi">
                    تخصص {specIndex + 1}
                    {!spec.isNew && <span className="text-xs text-gray-500 mr-2">(موجود)</span>}
                  </h4>
                  <button
                    type="button"
                    onClick={() => removeSpecialty(specIndex)}
                    className="text-red-600 hover:text-red-800 transition"
                    title="حذف التخصص"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2 text-gray-700 font-droid-arabic-kufi">
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
                  <label className="block text-sm font-medium mb-2 text-gray-700 font-droid-arabic-kufi">
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
                  <p className="text-xs text-gray-500 mt-1 font-droid-arabic-kufi">
                    الحد الأقصى: 500 حرف ({spec.description?.length || 0}/500)
                  </p>
                </div>

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
                        <span className="text-sm font-medium text-gray-700 font-droid-arabic-kufi">
                          التخصص مشبع
                        </span>
                        <p className="text-xs text-gray-500 font-droid-arabic-kufi">
                          تحديد هذا الخيار يعني أن التخصص ممتلئ
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="block text-sm font-medium mb-2 text-gray-700 font-droid-arabic-kufi">
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
                  <p className="text-xs text-gray-500 mt-1 font-droid-arabic-kufi">
                    اضغط Ctrl لاختيار عدة أطباء
                  </p>
                </div>

                <div className="mb-3">
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-sm font-medium text-gray-700 font-droid-arabic-kufi">
                      الأيام *
                    </label>
                    <button
                      type="button"
                      onClick={() => addDay(specIndex)}
                      className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 font-droid-arabic-kufi"
                    >
                      <Plus size={16} />
                      إضافة يوم
                    </button>
                  </div>

                  {spec.days.length === 0 && (
                    <div className="text-center py-4 bg-white rounded border border-gray-200">
                      <p className="text-sm text-gray-500 font-droid-arabic-kufi">
                        لم تتم إضافة أي أيام بعد
                      </p>
                    </div>
                  )}

                  {spec.days.map((day, dayIndex) => (
                    <div key={dayIndex} className="border rounded p-3 mb-3 bg-white">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-semibold font-droid-arabic-kufi">
                          يوم {dayIndex + 1}
                          {!day.isNew && <span className="text-xs text-gray-500 mr-2">(موجود)</span>}
                        </h5>
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
                        <label className="block text-xs font-medium mb-1 text-gray-600 font-droid-arabic-kufi">
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
                        <label className="block text-xs font-medium mb-1 text-gray-600 font-droid-arabic-kufi">
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
                        <p className="text-xs text-gray-500 mt-1 font-droid-arabic-kufi">
                          الحد الأدنى: 1، الحد الأقصى: 400
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-medium mb-2 text-gray-600 font-droid-arabic-kufi">
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
                            <p className="text-xs text-gray-500 font-droid-arabic-kufi">
                              لم تتم إضافة أي ساعات بعد
                            </p>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {day.hours.map((hour, hourIndex) => (
                              <div
                                key={hourIndex}
                                className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded text-sm"
                              >
                                <span>{hour.time.slice(0, 5)}</span>
                                {!hour.isNew && <span className="text-xs">(موجود)</span>}
                                <button
                                  type="button"
                                  onClick={() => removeHour(specIndex, dayIndex, hourIndex)}
                                  className="text-red-600 hover:text-red-800 font-bold transition ml-1"
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

          {message && (
            <div className={`p-3 rounded-lg text-center font-droid-arabic-kufi ${
              message.includes('✅') 
                ? 'bg-green-100 text-green-800' 
                : message.includes('⚠️')
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {message}
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t sticky bottom-0 bg-white">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold font-droid-arabic-kufi transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Save size={20} />
                  حفظ جميع التعديلات
                </>
              )}
            </button>
            
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 bg-gray-300 hover:bg-gray-400 text-gray-800 py-3 rounded-lg font-bold font-droid-arabic-kufi transition disabled:opacity-50"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}