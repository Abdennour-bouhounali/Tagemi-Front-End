import React, { useContext, useEffect, useState, useCallback, useMemo } from 'react';
import logo from './tagemi_logo.png';
import { AppContext } from '../../../Context/AppContext';
import { useParams } from 'react-router-dom';
import { Select } from '../../Common/FormInputs';
import { Input } from '../../Common/FormInputs';
import { 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Calendar,
  Clock,
  Phone,
  MapPin,
  Heart,
  Plus,
  Trash2,
  ChevronRight,
  Shield,
  Info,
  Building2,
  CalendarDays,
  User,
  Users,
  AlertTriangle,
  Upload,
  FileText,
  X,
  Printer
} from 'lucide-react';
import BirthdayInput from '../SuperAdmin/Components/BirthdayInput';
import algeriaLocations from '../../../data/algeria_locations.json';

const apiUrl = import.meta.env.VITE_API_URL;

// ==================== HELPER COMPONENTS ====================

// Progress Bar Component
const ProgressBar = ({ currentStep, totalSteps }) => (
  <div className="w-full mb-8">
    <div className="flex items-center justify-between mb-2">
      {[...Array(totalSteps)].map((_, index) => (
        <div key={index} className="flex items-center flex-1">
          <div 
            className={`
              w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
              ${index < currentStep 
                ? 'bg-green-500 text-white' 
                : index === currentStep 
                  ? 'bg-blue-500 text-white animate-pulse' 
                  : 'bg-gray-200 text-gray-400'
              }
            `}
          >
            {index < currentStep ? <CheckCircle2 className="w-5 h-5" /> : index + 1}
          </div>
          {index < totalSteps - 1 && (
            <div 
              className={`flex-1 h-1 mx-2 transition-all duration-300 ${
                index < currentStep ? 'bg-green-500' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  </div>
);

// Alert Component
const Alert = ({ type, message, onClose }) => {
  const configs = {
    success: {
      bgColor: 'bg-green-50 border-green-200',
      textColor: 'text-green-800',
      icon: <CheckCircle2 className="w-5 h-5 text-green-500" />
    },
    error: {
      bgColor: 'bg-red-50 border-red-200',
      textColor: 'text-red-800',
      icon: <XCircle className="w-5 h-5 text-red-500" />
    },
    warning: {
      bgColor: 'bg-yellow-50 border-yellow-200',
      textColor: 'text-yellow-800',
      icon: <AlertCircle className="w-5 h-5 text-yellow-500" />
    },
    info: {
      bgColor: 'bg-blue-50 border-blue-200',
      textColor: 'text-blue-800',
      icon: <Info className="w-5 h-5 text-blue-500" />
    }
  };

  const config = configs[type] || configs.info;

  return (
    <div 
      className={`
        ${config.bgColor} ${config.textColor} 
        border rounded-lg p-4 mb-4 flex items-start gap-3
        animate-slideIn
      `}
    >
      {config.icon}
      <div className="flex-1">
        <p className="font-droid-arabic-kufi text-sm">{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <XCircle className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

// Missing Fields Alert Component - NEW
const MissingFieldsAlert = ({ missingFields, onClose }) => {
  if (!missingFields || missingFields.length === 0) return null;

  const fieldLabels = {
    name: 'الاسم',
    lastName: 'اللقب',
    birthday: 'تاريخ الميلاد',
    state: 'الولاية',
    city: 'البلدية',
    phone: 'رقم الهاتف الأساسي',
    phone2: 'رقم الهاتف الثاني',
    sex: 'الجنس',
    event_specialty_id: 'التخصص الطبي',
    day_id: 'اليوم',
    hour_id: 'الوقت'
  };

  return (
    <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-4 mb-4 animate-slideIn">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-orange-600" />
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-orange-800 font-droid-arabic-kufi mb-2">
            يرجى إكمال الحقول التالية:
          </h4>
          <ul className="space-y-1">
            {missingFields.map((field, index) => (
              <li key={index} className="flex items-center gap-2 text-sm text-orange-700 font-droid-arabic-kufi">
                <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                {fieldLabels[field] || field}
              </li>
            ))}
          </ul>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-orange-400 hover:text-orange-600">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

// Loading Skeleton
const LoadingSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    <div className="h-12 bg-gray-200 rounded-lg"></div>
    <div className="h-12 bg-gray-200 rounded-lg"></div>
    <div className="h-12 bg-gray-200 rounded-lg"></div>
    <div className="h-32 bg-gray-200 rounded-lg"></div>
  </div>
);

// File Upload Component
const FileUploadField = ({ files, onChange, error }) => {
  const [preview, setPreview] = useState([]);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    // Validate file size (10MB max per file)
    const validFiles = selectedFiles.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        alert(`الملف ${file.name} أكبر من 10MB`);
        return false;
      }
      return true;
    });

    onChange(validFiles);
    
    // Create preview
    const newPreviews = validFiles.map(file => ({
      name: file.name,
      size: (file.size / 1024).toFixed(2) + ' KB',
      type: file.type
    }));
    setPreview(newPreviews);
  };

  const removeFile = (index) => {
    const newFiles = files.filter((_, i) => i !== index);
    onChange(newFiles);
    setPreview(preview.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700 mb-1 font-droid-arabic-kufi">
        المستندات الطبية (اختياري)
      </label>
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 transition-colors">
        <input
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          onChange={handleFileChange}
          className="hidden"
          id="medical-documents-upload"
        />
        <label 
          htmlFor="medical-documents-upload"
          className="flex flex-col items-center cursor-pointer"
        >
          <Upload className="w-10 h-10 text-gray-400 mb-2" />
          <span className="text-sm text-gray-600 font-droid-arabic-kufi text-center">
            انقر لتحميل المستندات الطبية
          </span>
          <span className="text-xs text-gray-500 font-droid-arabic-kufi mt-1">
            (PDF, JPG, PNG, DOC - حتى 10MB لكل ملف)
          </span>
        </label>
      </div>

      {/* File Preview */}
      {preview.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700 font-droid-arabic-kufi">
            الملفات المحددة ({preview.length}):
          </p>
          {preview.map((file, index) => (
            <div 
              key={index}
              className="flex items-center justify-between bg-blue-50 p-3 rounded-lg"
            >
              <div className="flex items-center gap-2 flex-1">
                <FileText className="w-5 h-5 text-blue-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate font-droid-arabic-kufi">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">{file.size}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="p-1 hover:bg-red-100 rounded text-red-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="text-red-500 text-xs mt-1 font-droid-arabic-kufi animate-slideIn">
          {error}
        </p>
      )}
    </div>
  );
};

// Specialty Card Component - IMPROVED
const SpecialtyCard = ({ 
  specialty, 
  index, 
  event, 
  availableSlots, 
  onChange, 
  onRemove,
  canRemove,
  allSpecialties
}) => {
  const [expanded, setExpanded] = useState(true);

  // Filter out saturated specialties
  const availableSpecialties = event?.event_specialties?.filter(es => !es.is_saturated) || [];
  
  // Filter out already selected specialties (except current one)
  const filteredSpecialties = availableSpecialties.filter(es => {
    if (es.id == specialty.event_specialty_id) {
      return true;
    }
    return !allSpecialties.some((spec, idx) => 
      idx !== index && spec.event_specialty_id == es.id
    );
  });
  
  // Get selected specialty details
  const selectedSpecialty = availableSpecialties.find(
    es => es.id == specialty.event_specialty_id
  );

  // Check if this specialty has only one day
  const hasOnlyOneDay = selectedSpecialty?.days?.length === 1;
  
  // Get no slots message based on context
  const getNoSlotsMessage = () => {
    if (hasOnlyOneDay) {
      return 'عذراً، جميع المواعيد المتاحة لهذا التخصص محجوزة. يرجى اختيار تخصص آخر أو التواصل مع المنظمين.';
    }
    return 'عذراً، لا توجد مواعيد متاحة لهذا اليوم. يرجى اختيار يوم آخر.';
  };

  // Check if specialty selection is complete
  const isComplete = specialty.event_specialty_id && specialty.day_id && specialty.hour_id;

  return (
    <div className={`
      border rounded-xl p-5 transition-all duration-300
      ${isComplete 
        ? 'bg-gradient-to-br from-green-50 to-white border-green-300 shadow-lg' 
        : expanded 
          ? 'bg-gradient-to-br from-blue-50 to-white shadow-lg' 
          : 'bg-gray-50'
      }
    `}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 ${isComplete ? 'bg-green-500' : 'bg-blue-500'} text-white rounded-full flex items-center justify-center font-bold`}>
            {isComplete ? <CheckCircle2 className="w-5 h-5" /> : index + 1}
          </div>
          <h4 className="font-bold text-lg font-droid-arabic-kufi">
            التخصص {index + 1}
            {isComplete && <span className="text-green-600 text-sm mr-2">(مكتمل)</span>}
          </h4>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ChevronRight 
              className={`w-5 h-5 text-gray-600 transition-transform ${expanded ? 'rotate-90' : ''}`} 
            />
          </button>
          {canRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="p-2 hover:bg-red-100 text-red-500 rounded-lg transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="space-y-4 animate-slideIn">
          {filteredSpecialties.length === 0 ? (
            <Alert 
              type="warning" 
              message="عذراً، جميع التخصصات المتاحة تم اختيارها بالفعل أو مشبعة حالياً." 
            />
          ) : (
            <>
              {/* Specialty Selection */}
              <Select
                icon={Heart}
                label="التخصص الطبي"
                name="event_specialty_id"
                type="select"
                value={specialty.event_specialty_id}
                onChange={(e) => onChange(index, 'event_specialty_id', e.target.value)}
                placeholder="اختر التخصص"
                required
                options={filteredSpecialties.map(es => ({
                  value: es.id,
                  label: es.specialty?.name
                }))}
              />

              {/* Specialty Description Display */}
              {selectedSpecialty?.description && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-5 animate-slideIn shadow-md">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Info className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h5 className="text-base font-bold text-blue-900 font-droid-arabic-kufi mb-2 flex items-center gap-2">
                        📋 معلومات مهمة عن التخصص
                      </h5>
                      <p className="text-sm text-blue-800 font-droid-arabic-kufi leading-relaxed whitespace-pre-line">
                        {selectedSpecialty.description}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Day Selection - Only show if specialty selected */}
              {specialty.event_specialty_id && (
                <>
                  {/* Show auto-selected day info if only one day */}
                  {hasOnlyOneDay && specialty.day_id && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-500" />
                        <span className="text-sm text-blue-700 font-droid-arabic-kufi">
                          تم اختيار اليوم تلقائياً (يوم واحد متاح فقط)
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <Select
                    icon={Calendar}
                    label="اليوم"
                    name="day_id"
                    type="select"
                    value={specialty.day_id}
                    onChange={(e) => onChange(index, 'day_id', e.target.value)}
                    placeholder="اختر اليوم"
                    required
                    options={availableSpecialties
                      .find(es => es.id == specialty.event_specialty_id)
                      ?.days?.map(day => ({
                        value: day.id,
                        label: new Date(day.day_date).toLocaleDateString('ar-DZ', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      }))}
                  />
                </>
              )}

              {/* Hour Selection - Only show if day selected */}
              {specialty.day_id && (
                <>
                  {/* Show auto-selected time info if only one slot */}
                  {availableSlots[`${index}`]?.length === 1 && specialty.hour_id && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-500" />
                        <span className="text-sm text-blue-700 font-droid-arabic-kufi">
                          تم اختيار الوقت تلقائياً (موعد واحد متاح فقط)
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {availableSlots[`${index}`]?.length > 0 ? (
                    <Select
                      icon={Clock}
                      label="الوقت"
                      name="hour_id"
                      type="select"
                      value={specialty.hour_id}
                      onChange={(e) => onChange(index, 'hour_id', e.target.value)}
                      placeholder="اختر الوقت"
                      required
                      options={availableSlots[`${index}`]?.map(slot => ({
                        value: slot.hour_id,
                        label: slot.time.substring(0, 5)
                      }))}
                    />
                  ) : (
                    <Alert 
                      type="warning" 
                      message={getNoSlotsMessage()} 
                    />
                  )}
                </>
              )}

              {/* Completion indicator */}
              {isComplete && (
                <div className="bg-green-50 border-2 border-green-300 rounded-lg p-3 animate-slideIn">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-bold text-green-700 font-droid-arabic-kufi">
                      تم اختيار التخصص والموعد بنجاح ✓
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

// ==================== MAIN COMPONENT ====================

const RegisterVisit = () => {
  const { eventID } = useParams();
  const { token } = useContext(AppContext);
  
  // State management
  const [currentStep, setCurrentStep] = useState(0);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [event, setEvent] = useState(null);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableSlots, setAvailableSlots] = useState({});
  const [acceptedRules, setAcceptedRules] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [appointmentDetails, setAppointmentDetails] = useState(null);
  const [availableCities, setAvailableCities] = useState([]);
  const [medicalDocuments, setMedicalDocuments] = useState([]);
  const [showMissingFields, setShowMissingFields] = useState(false);
  const [missingFields, setMissingFields] = useState([]);
  const maxAllowedSpecialties = event?.nbr_of_allowed_specialties || 1;
  
  const [formData, setFormData] = useState({
    name: '',
    lastName: '',
    birthday: '',
    state: '',
    city: '',
    diseases: '',
    phone: '',
    phone2: '',
    sex: '',
    specialties: [
      { event_specialty_id: '', day_id: '', hour_id: '' }
    ],
  });

  // Validation rules
  const arabicRegex = /^[\u0621-\u064A\u0660-\u0669\s]*$/;
  const phoneRegex = /^[0-9+\-\s()]+$/;

  // Check if all specialties are saturated
  const allSpecialtiesSaturated = useMemo(() => {
    if (!event?.event_specialties) return false;
    const availableSpecialties = event.event_specialties.filter(es => !es.is_saturated);
    return availableSpecialties.length === 0;
  }, [event]);

  // Get count of available specialties
  const availableSpecialtiesCount = useMemo(() => {
    if (!event?.event_specialties) return 0;
    return event.event_specialties.filter(es => !es.is_saturated).length;
  }, [event]);

  // Check if current specialty selection is complete - NEW
  const isCurrentSpecialtyComplete = useMemo(() => {
    const lastSpecialty = formData.specialties[formData.specialties.length - 1];
    return lastSpecialty?.event_specialty_id && lastSpecialty?.day_id && lastSpecialty?.hour_id;
  }, [formData.specialties]);

  // Get missing fields for current step - NEW
  const getMissingFieldsForStep = useCallback((step) => {
    const missing = [];
    
    if (step === 1) {
      if (!formData.name) missing.push('name');
      if (!formData.lastName) missing.push('lastName');
      if (!formData.birthday) missing.push('birthday');
      if (!formData.state) missing.push('state');
      if (!formData.city) missing.push('city');
      if (!formData.phone) missing.push('phone');
      if (!formData.phone2) missing.push('phone2');
      if (!formData.sex) missing.push('sex');
    } else if (step === 2) {
      formData.specialties.forEach((spec, index) => {
        if (!spec.event_specialty_id) missing.push('event_specialty_id');
        if (!spec.day_id) missing.push('day_id');
        if (!spec.hour_id) missing.push('hour_id');
      });
    }
    
    return [...new Set(missing)]; // Remove duplicates
  }, [formData]);

  // ==================== API CALLS ====================

  // Fetch event data
  const getEvent = useCallback(async () => {
    setLoading(true);
    try {
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${apiUrl}/api/public/events/${eventID}`, {
        headers: headers
      });
      
      if (res.status === 404) {
        setEvent(null);
        setMessage({ type: 'error', text: 'الحدث غير موجود' });
        return;
      }
      
      if (!res.ok) throw new Error('Server error');
      
      const data = await res.json();
      setEvent(data.event);
      
      const availableSpecs = data.event?.event_specialties?.filter(es => !es.is_saturated) || [];
      if (availableSpecs.length === 0) {
        setMessage({ 
          type: 'warning', 
          text: 'عذراً، جميع التخصصات في هذا الحدث مشبعة حالياً. لا يمكن إضافة حجوزات جديدة.' 
        });
      }
    } catch (error) {
      console.error('Error fetching event:', error);
      setEvent(null);
      setMessage({ type: 'error', text: 'حدث خطأ في تحميل بيانات الحدث' });
    } finally {
      setLoading(false);
    }
  }, [eventID, token]);

  // Fetch rules
  const getRules = useCallback(async () => {
    try {
      const eventRes = await fetch(`${apiUrl}/api/public/events/${eventID}`);
      const eventData = await eventRes.json();
      
      if (eventData.event?.rules_ids && eventData.event.rules_ids.length > 0) {
        const allRulesRes = await fetch(`${apiUrl}/api/rules`);
        const allRulesData = await allRulesRes.json();
        
        const eventRules = allRulesData.filter(rule => 
          eventData.event.rules_ids.includes(rule.id)
        );
        
        setRules(eventRules);
      } else {
        const res = await fetch(`${apiUrl}/api/rules`);
        const data = await res.json();
        setRules(data);
      }
    } catch (error) {
      console.error('Error fetching rules:', error);
    }
  }, [eventID, token]);

  // Fetch available slots
  const fetchAvailableSlots = useCallback(async (eventSpecialtyId, dayId, specialtyIndex) => {
    try {
      const res = await fetch(
        `${apiUrl}/api/appointments/available-slots?event_specialty_id=${eventSpecialtyId}&day_id=${dayId}`
      );
      const data = await res.json();
      
      setAvailableSlots(prev => ({
        ...prev,
        [`${specialtyIndex}`]: data.available_slots || []
      }));
      
      // Auto-select hour if only one slot available
      if (data.available_slots?.length === 1) {
        setFormData(prev => ({
          ...prev,
          specialties: prev.specialties.map((spec, idx) => 
            idx === specialtyIndex 
              ? { ...spec, hour_id: data.available_slots[0].hour_id }
              : spec
          )
        }));
      }
    } catch (error) {
      console.error('Error fetching available slots:', error);
      setMessage({ type: 'warning', text: 'فشل في تحميل المواعيد المتاحة' });
    }
  }, []);

  // Initialize
  useEffect(() => {
    getEvent();
    getRules();
  }, [getEvent, getRules]);

  // ==================== FORM HANDLERS ====================
  
  const handleAddSpecialty = useCallback(() => {
    if (formData.specialties.length < maxAllowedSpecialties && isCurrentSpecialtyComplete) {
      setFormData(prev => ({
        ...prev,
        specialties: [
          ...prev.specialties,
          { event_specialty_id: '', day_id: '', hour_id: '' }
        ],
      }));
    }
  }, [formData.specialties.length, maxAllowedSpecialties, isCurrentSpecialtyComplete]);

  const handleRemoveSpecialty = useCallback((index) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.filter((_, i) => i !== index),
    }));
    
    setAvailableSlots(prev => {
      const newSlots = { ...prev };
      delete newSlots[`${index}`];
      return newSlots;
    });
  }, []);

  const handleSpecialtyChange = useCallback((index, field, value) => {
    const updatedSpecialties = formData.specialties.map((specialty, i) => {
      if (index === i) {
        const updated = { ...specialty, [field]: value };
        
        if (field === 'event_specialty_id') {
          updated.day_id = '';
          updated.hour_id = '';
          setAvailableSlots(prev => ({ ...prev, [`${index}`]: [] }));
          
          // Auto-select day if only one option available
          const selectedEventSpecialty = event?.event_specialties?.find(es => es.id == value);
          if (selectedEventSpecialty?.days?.length === 1) {
            const onlyDay = selectedEventSpecialty.days[0];
            updated.day_id = onlyDay.id;
            // Fetch slots for the auto-selected day
            fetchAvailableSlots(value, onlyDay.id, index);
          }
        } else if (field === 'day_id') {
          updated.hour_id = '';
          if (specialty.event_specialty_id && value) {
            fetchAvailableSlots(specialty.event_specialty_id, value, index);
          }
        }
        
        return updated;
      }
      return specialty;
    });
    
    setFormData(prev => ({ ...prev, specialties: updatedSpecialties }));
    setShowMissingFields(false); // Hide missing fields alert when user makes changes
  }, [formData.specialties, fetchAvailableSlots, event]);

  const validateField = useCallback((name, value) => {
    let error = '';
    
    switch (name) {
      case 'name':
      case 'lastName':
        if (!arabicRegex.test(value)) {
          error = 'يرجى إدخال أحرف عربية فقط';
        } else if (value.length < 2) {
          error = 'يجب أن يكون الاسم حرفين على الأقل';
        }
        break;
      case 'phone':
      case 'phone2':
        if (!phoneRegex.test(value)) {
          error = 'رقم الهاتف غير صحيح';
        } else if (value.length < 9) {
          error = 'رقم الهاتف قصير جداً';
        }
        break;
      case 'birthday':
        const birthDate = new Date(value);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        if (age < 0 || age > 120) {
          error = 'تاريخ الميلاد غير صحيح';
        }
        break;
    }
    
    setFieldErrors(prev => ({ ...prev, [name]: error }));
    return !error;
  }, [arabicRegex, phoneRegex]);

  const handleChangeData = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    validateField(name, value);
    setShowMissingFields(false);
  }, [validateField]);

  const handleBirthdayChange = useCallback((birthday) => {
    setFormData(prev => ({ ...prev, birthday }));
    validateField('birthday', birthday);
    setShowMissingFields(false);
  }, [validateField]);

  const handleStateChange = useCallback((e) => {
    const stateName = e.target.value;
    setFormData(prev => ({ ...prev, state: stateName, city: '' }));
    
    setFieldErrors(prev => ({ ...prev, state: '', city: '' }));
    setShowMissingFields(false);
    
    const selectedWilaya = algeriaLocations.algeria_locations.find(
      loc => loc.name_ar === stateName
    );
    
    if (selectedWilaya) {
      setAvailableCities(selectedWilaya.communes);
    } else {
      setAvailableCities([]);
    }
  }, []);

  const handleFileChange = useCallback((files) => {
    setMedicalDocuments(files);
    if (files.length > 0) {
      setFieldErrors(prev => ({ ...prev, medical_documents: '' }));
    }
  }, []);

  // Handle next step with validation - IMPROVED
  const handleNextStep = useCallback(() => {
    const missing = getMissingFieldsForStep(currentStep);
    
    if (missing.length > 0) {
      setMissingFields(missing);
      setShowMissingFields(true);
      setMessage({ type: 'warning', text: 'يرجى إكمال جميع الحقول المطلوبة قبل المتابعة' });
      return;
    }
    
    setShowMissingFields(false);
    setMessage({ type: '', text: '' });
    setCurrentStep(prev => prev + 1);
  }, [currentStep, getMissingFieldsForStep]);

  // ==================== FORM SUBMISSION ====================

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!acceptedRules) {
      setMessage({ type: 'warning', text: 'يجب الموافقة على الشروط والأحكام' });
      return;
    }
    
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });
    
    const eventId = event?.id;
    if (!eventId) {
      setMessage({ type: 'error', text: 'خطأ: لم يتم العثور على معرف الحدث' });
      setIsSubmitting(false);
      return;
    }
    
    try {
      const formDataToSend = new FormData();
      
      formDataToSend.append('name', formData.name);
      formDataToSend.append('lastName', formData.lastName);
      formDataToSend.append('birthday', formData.birthday);
      formDataToSend.append('state', formData.state);
      formDataToSend.append('city', formData.city);
      formDataToSend.append('diseases', formData.diseases || '');
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('phone2', formData.phone2);
      formDataToSend.append('sex', formData.sex);
      
      formData.specialties.forEach((specialty, index) => {
        formDataToSend.append(`specialties[${index}][event_specialty_id]`, specialty.event_specialty_id);
        formDataToSend.append(`specialties[${index}][day_id]`, specialty.day_id);
        formDataToSend.append(`specialties[${index}][hour_id]`, specialty.hour_id);
      });

      medicalDocuments.forEach((file, index) => {
        formDataToSend.append(`medical_documents[${index}]`, file);
      });

      const headers = {};
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${apiUrl}/api/appointment/${eventId}`, {
        method: 'POST',
        headers: headers,
        body: formDataToSend,
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'فشل في إرسال الحجز');
      }
      
      const data = await res.json();
      
      setShowSuccessAnimation(true);
      setMessage({ 
        type: 'success', 
        text: data.message || 'تم الحجز بنجاح! سيتم التواصل معك قريباً.' 
      });
      
      setAppointmentDetails({
        ...formData,
        eventInfo: event,
        documentsCount: medicalDocuments.length
      });
      
    } catch (error) {
      console.error('Submission error:', error);
      setMessage({ 
        type: 'error', 
        text: error.message || 'حدث خطأ أثناء إرسال الحجز. يرجى المحاولة مرة أخرى.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==================== FORM VALIDATION ====================

  const isFormValid = useMemo(() => {
    return (
      formData.name &&
      formData.lastName &&
      formData.birthday &&
      formData.state &&
      formData.city &&
      formData.phone &&
      formData.phone2 &&
      formData.sex &&
      formData.specialties.every(s => 
        s.event_specialty_id && s.day_id && s.hour_id
      ) &&
      !Object.values(fieldErrors).some(error => error) &&
      acceptedRules
    );
  }, [formData, fieldErrors, acceptedRules]);

  // ==================== RENDER METHODS ====================

  const renderEventInfo = () => (
    <div className="space-y-6 animate-fadeIn">
      {allSpecialtiesSaturated && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h4 className="font-bold text-lg text-red-800 font-droid-arabic-kufi mb-2">
                تنبيه: الحدث مكتمل
              </h4>
              <p className="text-red-700 font-droid-arabic-kufi leading-relaxed">
                عذراً، جميع التخصصات في هذا الحدث مشبعة حالياً ولا يمكن قبول حجوزات جديدة. 
                يرجى التواصل مع المنظمين للمزيد من المعلومات.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Event Logo and Title */}
      <div className="text-center">
        {logo && (
          <img 
            src={logo} 
            alt="Event Logo" 
            className="w-40 h-40 mx-auto mb-4 object-cover"
          />
        )}
        <h2 className="text-2xl font-bold text-gray-800 font-droid-arabic-kufi mb-3">
          {event?.name}
        </h2>
        <p className="text-gray-600 font-droid-arabic-kufi max-w-2xl mx-auto">
          {event?.description || 'مرحباً بكم في نظام حجز المواعيد الإلكتروني'}
        </p>
      </div>

      {/* Event Details Cards */}
      <div className="grid md:grid-cols-2 gap-4 mt-8">
        {/* Event Days Card */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-500 text-white rounded-lg flex items-center justify-center">
              <CalendarDays className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg font-droid-arabic-kufi text-gray-800">
              أيام الحدث
            </h3>
          </div>
          <div className="space-y-2">
            {(() => {
              const allDays = event?.event_specialties?.flatMap(es => 
                es.days?.map(day => new Date(day.day_date)) || []
              ) || [];
              
              if (allDays.length === 0) {
                return (
                  <div className="text-gray-500 font-droid-arabic-kufi text-sm">
                    لا توجد أيام متاحة
                  </div>
                );
              }
              
              const minDate = new Date(Math.min(...allDays));
              const maxDate = new Date(Math.max(...allDays));
              
              return (
                <>
                  <div className="flex items-center gap-2 text-gray-700">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="font-droid-arabic-kufi text-sm font-medium">
                      {minDate.getTime() !== maxDate.getTime() && (<span>من:</span>)} {minDate.toLocaleDateString('ar-DZ', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  {minDate.getTime() !== maxDate.getTime() && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                      <span className="font-droid-arabic-kufi text-sm font-medium">
                        إلى: {maxDate.toLocaleDateString('ar-DZ', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>

        {/* Location Card */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 border border-purple-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-500 text-white rounded-lg flex items-center justify-center">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg font-droid-arabic-kufi text-gray-800">
              مكان الحدث
            </h3>
          </div>
          <p className="text-gray-700 font-droid-arabic-kufi text-sm leading-relaxed">
            {event?.state || 'سيتم تحديد المكان لاحقاً'} | {event?.city || '-'}
          </p>
        </div>

        {/* Specialties Card */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border border-green-200 md:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-500 text-white rounded-lg flex items-center justify-center">
              <Heart className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg font-droid-arabic-kufi text-gray-800">
              التخصصات المتاحة
            </h3>
          </div>
          
          <div className="grid md:grid-cols-2 gap-3">
            {event?.event_specialties?.map(es => (
              <div 
                key={es.id} 
                className={`bg-white rounded-lg p-4 border-2 transition-all ${
                  es.is_saturated 
                    ? 'border-gray-200 opacity-60' 
                    : 'border-green-200 hover:border-green-400 hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${es.is_saturated ? 'bg-red-400' : 'bg-green-400'}`}></div>
                    <span className={`font-bold font-droid-arabic-kufi ${
                      es.is_saturated ? 'text-gray-400 line-through' : 'text-gray-800'
                    }`}>
                      {es.specialty?.name}
                    </span>
                  </div>
                  {es.is_saturated && (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-droid-arabic-kufi font-bold">
                      مكتمل
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {availableSpecialtiesCount > 0 && (
            <div className="mt-3 pt-3 border-t border-green-200">
              <p className="text-sm text-gray-600 font-droid-arabic-kufi">
                {availableSpecialtiesCount > 2 && <> <span className="font-bold text-green-600">{availableSpecialtiesCount}</span> تخصصات متاحة للحجز</>}
                {availableSpecialtiesCount < 3 && <> <span className="font-bold text-green-600">{availableSpecialtiesCount}</span> تخصص متاح للحجز</>}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderPersonalInfo = () => (
    <div className="space-y-4 animate-fadeIn">
      <h3 className="text-xl font-bold text-gray-800 mb-4 font-droid-arabic-kufi flex items-center gap-2">
        <User className="w-6 h-6 text-blue-500" />
        المعلومات الشخصية
      </h3>
      
      {/* Missing Fields Alert */}
      {showMissingFields && currentStep === 1 && (
        <MissingFieldsAlert 
          missingFields={missingFields} 
          onClose={() => setShowMissingFields(false)}
        />
      )}
      
      <div className="grid md:grid-cols-2 gap-4">
        <div className={!formData.name && showMissingFields ? 'ring-2 ring-orange-400 rounded-lg' : ''}>
          <Input
            icon={User}
            label="الاسم"
            name="name"
            value={formData.name}
            onChange={handleChangeData}
            placeholder="أدخل اسمك"
            required
            error={fieldErrors.name}
          />
        </div>
        
        <div className={!formData.lastName && showMissingFields ? 'ring-2 ring-orange-400 rounded-lg' : ''}>
          <Input
            icon={User}
            label="اللقب"
            name="lastName"
            value={formData.lastName}
            onChange={handleChangeData}
            placeholder="أدخل لقبك"
            required
            error={fieldErrors.lastName}
          />
        </div>
      </div>
      
      <div className={!formData.birthday && showMissingFields ? 'ring-2 ring-orange-400 rounded-lg' : ''}>
        <BirthdayInput
          value={formData.birthday}
          onChange={handleBirthdayChange}
          error={fieldErrors.birthday}
        />
      </div>
      
      <div className="grid md:grid-cols-2 gap-4">
        <div className={!formData.state && showMissingFields ? 'ring-2 ring-orange-400 rounded-lg' : ''}>
          <Select
            icon={MapPin}
            label="ولاية الإقامة"
            name="state"
            type="select"
            value={formData.state}
            onChange={handleStateChange}
            placeholder="اختر ولاية الإقامة"
            required
            error={fieldErrors.state}
            options={algeriaLocations.algeria_locations.map(loc => ({
              value: loc.name_ar,
              label: `${loc.name_ar} - ${loc.code}`
            }))}
          />
        </div>
        
        <div className={!formData.city && showMissingFields ? 'ring-2 ring-orange-400 rounded-lg' : ''}>
          {event?.is_tawat ? (
            <Select
              icon={MapPin}
              label="القصر"
              name="city"
              type="select"
              value={formData.city}
              onChange={handleChangeData}
              placeholder="اختر القصر"
              required
              options={[
                { value: "tajnint", label: "تاجنينت" },
                { value: "bonora", label: "آت بونور" },
                { value: "taghardait", label: "تغردايت" },
                { value: "mlichat", label: "آت مليشت" },
                { value: "yazgan", label: "آت يزجن" },
                { value: "berian", label: "آت برقان" },
                { value: "karara", label: "القرارة" },
                { value: "warglen", label: "وارجلان" }
              ]}
            />
          ) : (
            <Select
              icon={MapPin}
              label="البلدية"
              name="city"
              type="select"
              value={formData.city}
              onChange={handleChangeData}
              placeholder={formData.state ? "اختر البلدية" : "اختر الولاية أولاً"}
              required
              disabled={!formData.state || availableCities.length === 0}
              error={fieldErrors.city}
              options={availableCities.map(city => ({
                value: city,
                label: city
              }))}
            />
          )}
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 gap-4">
        <div className={!formData.phone && showMissingFields ? 'ring-2 ring-orange-400 rounded-lg' : ''}>
          <Input
            icon={Phone}
            label="رقم الواتساب الأساسي"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChangeData}
            placeholder="أدخل رقم الهاتف (الواتساب إن وجد)"
            required
            error={fieldErrors.phone}
          />
        </div>
        
        <div className={!formData.phone2 && showMissingFields ? 'ring-2 ring-orange-400 rounded-lg' : ''}>
          <Input
            icon={Phone}
            label="رقم هاتف ثاني (شخصي أو لفرد عائلي)"
            name="phone2"
            type="tel"
            value={formData.phone2}
            onChange={handleChangeData}
            placeholder="رقم شخصي"
            required
            error={fieldErrors.phone2}
          />
        </div>
      </div>
      
      <div className={!formData.sex && showMissingFields ? 'ring-2 ring-orange-400 rounded-lg' : ''}>
        <Select
          icon={User}
          label="الجنس"
          name="sex"
          type="select"
          value={formData.sex}
          onChange={handleChangeData}
          placeholder="اختر الجنس"
          required
          options={[
            { value: '0', label: 'ذكر' },
            { value: '1', label: 'أنثى' }
          ]}
        />
      </div>
      
      <Input
        icon={Heart}
        label="الأمراض المزمنة"
        name="diseases"
        value={formData.diseases}
        onChange={handleChangeData}
        placeholder="يرجى ذكر الأمراض المزمنة إن وجدت"
      />
    </div>
  );

  const renderSpecialtySelection = () => {
    if (allSpecialtiesSaturated) {
      return (
        <div className="space-y-4 animate-fadeIn">
          <h3 className="text-xl font-bold text-gray-800 mb-4 font-droid-arabic-kufi flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-500" />
            اختر التخصصات والمواعيد
          </h3>
          
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8 text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h4 className="font-bold text-xl text-red-800 font-droid-arabic-kufi mb-2">
              عذراً، لا يمكن الحجز حالياً
            </h4>
            <p className="text-red-700 font-droid-arabic-kufi leading-relaxed">
              جميع التخصصات في هذا الحدث مشبعة ولا يمكن قبول حجوزات جديدة. 
              يرجى التواصل مع المنظمين للمزيد من المعلومات.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4 animate-fadeIn">
        <h3 className="text-xl font-bold text-gray-800 mb-4 font-droid-arabic-kufi flex items-center gap-2">
          <Calendar className="w-6 h-6 text-blue-500" />
          اختر التخصصات والمواعيد
        </h3>
        
        {/* Missing Fields Alert */}
        {showMissingFields && currentStep === 2 && (
          <MissingFieldsAlert 
            missingFields={missingFields} 
            onClose={() => setShowMissingFields(false)}
          />
        )}
        
        {availableSpecialtiesCount < event?.event_specialties?.length && (
          <Alert 
            type="info" 
            message={`بعض التخصصات مكتملة. متاح للحجز: ${availableSpecialtiesCount} من ${event?.event_specialties?.length} تخصص`}
          />
        )}
        
        <div className="space-y-4">
          {formData.specialties.map((specialty, index) => (
            <SpecialtyCard
              key={index}
              specialty={specialty}
              index={index}
              event={event}
              availableSlots={availableSlots}
              onChange={handleSpecialtyChange}
              onRemove={() => handleRemoveSpecialty(index)}
              canRemove={formData.specialties.length > 1}
              allSpecialties={formData.specialties}
            />
          ))}
          
          {/* Add specialty button - only show if current specialty is complete */}
          {formData.specialties.length < maxAllowedSpecialties && 
            availableSpecialtiesCount > 1 && 
            availableSpecialtiesCount > formData.specialties.length && (
              <div className="space-y-2">
                {!isCurrentSpecialtyComplete ? (
                  <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <p className="text-gray-500 font-droid-arabic-kufi text-sm">
                      أكمل اختيار التخصص والموعد الحالي لإضافة تخصص آخر
                    </p>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleAddSpecialty}
                    className="w-full py-3 border-2 border-dashed border-blue-300 rounded-lg
                            text-blue-600 font-medium font-droid-arabic-kufi
                            hover:bg-blue-50 transition-all duration-300
                            flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    أضف تخصص آخر (متاح: {maxAllowedSpecialties - formData.specialties.length})
                  </button>
                )}
              </div>
            )}
        </div>
        
        {maxAllowedSpecialties === 1 && formData.specialties[0].event_specialty_id && (
          <div className="mt-6 animate-slideIn">
            <FileUploadField
              files={medicalDocuments}
              onChange={handleFileChange}
              error={fieldErrors.medical_documents}
            />
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-3">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-800 font-droid-arabic-kufi leading-relaxed">
                    يمكنك تحميل المستندات الطبية (تقارير، تحاليل، أشعة) لمساعدة الطبيب على فهم حالتك بشكل أفضل. 
                    هذا الخيار اختياري ولن يؤثر على حجزك.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderRulesAcceptance = () => (
    <div className="space-y-4 animate-fadeIn">
      <h3 className="text-xl font-bold text-gray-800 mb-4 font-droid-arabic-kufi flex items-center gap-2">
        <Shield className="w-6 h-6 text-blue-500" />
        الشروط والأحكام
      </h3>
      
      <div className="bg-gray-50 rounded-lg p-6 max-h-96 overflow-y-auto">
          <div className="space-y-3">
        {rules.map((rule, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 text-sm font-bold">
              {index + 1}
            </div>
            <p className={`text-sm leading-relaxed font-droid-arabic-kufi ${rule.id === 6 ? 'text-red-600 font-bold' : 'text-gray-700'}`}>
              {rule.rule}
            </p>
          </div>
        ))}
        </div>
      </div>
      
      <label className={`flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-colors ${
        acceptedRules ? 'bg-green-50 border-2 border-green-300' : 'bg-blue-50 hover:bg-blue-100'
      }`}>
        <input
          type="checkbox"
          checked={acceptedRules}
          onChange={(e) => setAcceptedRules(e.target.checked)}
          className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
        />
        <span className="font-droid-arabic-kufi text-gray-700">
          أوافق على جميع الشروط والأحكام المذكورة أعلاه
        </span>
        {acceptedRules && <CheckCircle2 className="w-5 h-5 text-green-500 mr-auto" />}
      </label>
      
      {!acceptedRules && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-700 font-droid-arabic-kufi flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            يجب الموافقة على الشروط والأحكام للمتابعة
          </p>
        </div>
      )}
    </div>
  );

  // ==================== SUCCESS ANIMATION ====================

  const SuccessAnimation = () => {
    const getAppointmentSummary = () => {
      const summaries = formData.specialties.map((spec, index) => {
        const specialty = event?.event_specialties?.find(es => es.id == spec.event_specialty_id);
        const day = specialty?.days?.find(d => d.id == spec.day_id);
        const slot = availableSlots[`${index}`]?.find(s => s.hour_id == spec.hour_id);
        
        return {
          specialty: specialty?.specialty?.name || 'غير محدد',
          date: day ? new Date(day.day_date).toLocaleDateString('ar-DZ', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }) : 'غير محدد',
          time: slot?.time ? slot.time.substring(0, 5) : 'غير محدد'
        };
      });
      
      return summaries;
    };

    const appointments = getAppointmentSummary();
    const fullName = `${formData.name} ${formData.lastName}`;

    // Print PDF Function using window.open (like CheckPresence)
   const handleDownloadPDF = () => {
  const printWindow = window.open("", "_blank");
  const eventName = event?.name || "الحدث";
  const date = new Date().toLocaleDateString("ar-SA");
  const logoUrl = `${window.location.origin}/tagemi_logo.png`;
  const cityNames = {
  tajnint: "تاجنينت",
  bonora: "آت بونور",
  taghardait: "تغردايت",
  mlichat: "آت مليشت",
  yazgan: "آت يزجن",
  berian: "آت برقان",
  karara: "القرارة",
  warglen: "وارجلان"
};

  const birthday = formData.birthday 
    ? new Date(formData.birthday).toLocaleDateString("en-UK") 
    : "-";
  const gender = formData.sex === '0' ? 'ذكر' : 'أنثى';
  const diseases = formData.diseases && formData.diseases !== 'nothing' 
    ? formData.diseases 
    : 'لا يوجد';
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تأكيد الحجز - ${fullName}</title>
      <style>
        * { 
          margin: 0; 
          padding: 0; 
          box-sizing: border-box; 
        }
        @page {
          size: A4 portrait;
          margin: 15mm;
        }
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          direction: rtl;
          line-height: 1.4;
          color: #333;
          font-size: 12px;
        }
        .header {
          text-align: center;
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 2px solid #2563eb;
        }
        .logo {
          height: 60px;
          max-width: 150px;
          margin: 0 auto 8px;
          display: block;
        }
        .header h1 {
          color: #16a34a;
          font-size: 22px;
          margin-bottom: 5px;
        }
        .header .event-name {
          color: #1e40af;
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 3px;
        }
        .header .date {
          color: #64748b;
          font-size: 11px;
        }
        .screenshot-note {
          background: #fee2e2;
          border: 2px solid #dc2626;
          color: #991b1b;
          padding: 8px;
          border-radius: 6px;
          text-align: center;
          font-weight: bold;
          margin-bottom: 12px;
          font-size: 12px;
        }
        .section {
          margin-bottom: 12px;
          background: #f8fafc;
          padding: 10px;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
        }
        .section-title {
          font-size: 14px;
          font-weight: bold;
          color: #1e40af;
          margin-bottom: 8px;
          padding-bottom: 5px;
          border-bottom: 2px solid #dbeafe;
        }
        .info-line {
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
          margin-bottom: 5px;
        }
        .info-item {
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }
        .info-label {
          font-weight: 600;
          color: #475569;
        }
        .info-value {
          color: #1e293b;
        }
        .divider {
          color: #cbd5e1;
          margin: 0 5px;
        }
        .documents-info {
          background: #dcfce7;
          border: 2px solid #16a34a;
          padding: 8px;
          border-radius: 6px;
          text-align: center;
          color: #166534;
          font-weight: 600;
          margin-bottom: 12px;
          font-size: 12px;
        }
        .appointments-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 10px;
        }
        .appointment-card {
          background: white;
          padding: 10px;
          border-radius: 6px;
          border: 2px solid #3b82f6;
        }
        .appointment-header {
          background: #3b82f6;
          color: white;
          padding: 5px 10px;
          border-radius: 4px;
          margin-bottom: 8px;
          font-weight: bold;
          text-align: center;
          font-size: 12px;
        }
        .appointment-row {
          display: flex;
          justify-content: space-between;
          padding: 4px 0;
          border-bottom: 1px solid #e2e8f0;
        }
        .appointment-row:last-child {
          border-bottom: none;
        }
        .appointment-label {
          color: #64748b;
          font-size: 11px;
        }
        .appointment-value {
          font-weight: 600;
          color: #1e293b;
          font-size: 11px;
        }
        .footer {
          margin-top: 15px;
          text-align: center;
          padding-top: 10px;
          border-top: 1px solid #e2e8f0;
          color: #64748b;
          font-size: 10px;
        }
        @media print {
          body { 
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <img src="${logoUrl}" alt="Logo" class="logo" onerror="this.style.display='none'" />
        <h1>✓ تم الحجز بنجاح</h1>
        <div class="event-name">${eventName}</div>
        <div class="date">تاريخ الطباعة: ${date}</div>
      </div>

      <div class="screenshot-note">
        📸 يرجى حفظ هذا المستند وإحضاره عند الحضور للفحص
      </div>

      ${medicalDocuments.length > 0 ? `
        <div class="documents-info">
          ✓ تم تحميل ${medicalDocuments.length} مستند طبي بنجاح
        </div>
      ` : ''}

      <!-- Patient Information - Compact Inline -->
      <div class="section">
        <div class="section-title">معلومات المريض</div>
        <div class="info-line">
          <div class="info-item">
            <span class="info-label">الاسم:</span>
            <span class="info-value">${fullName}</span>
          </div>
          <span class="divider">|</span>
          <div class="info-item">
            <span class="info-label">تاريخ الميلاد:</span>
            <span class="info-value">${birthday}</span>
          </div>
          <span class="divider">|</span>
          <div class="info-item">
            <span class="info-label">الجنس:</span>
            <span class="info-value">${gender}</span>
          </div>
        </div>
        <div class="info-line">
          <div class="info-item">
            <span class="info-label">الهاتف:</span>
            <span class="info-value">${formData.phone}</span>
          </div>
          <span class="divider">|</span>
          <div class="info-item">
            <span class="info-label">هاتف ثانوي:</span>
            <span class="info-value">${formData.phone2}</span>
          </div>
          <span class="divider">|</span>

          <div class="info-item">
            <span class="info-label">العنوان:</span>
            <span class="info-value">${formData.state} - ${cityNames[formData.city] || formData.city}</span>
          </div>
      
        </div>
        <div class="info-line">
          <div class="info-item">
            <span class="info-label">الأمراض المزمنة:</span>
            <span class="info-value">${diseases}</span>
          </div>
        </div>
      </div>

      <!-- Appointments - Compact Grid -->
      <div class="section">
        <div class="section-title">تفاصيل المواعيد (${appointments.length})</div>
        <div class="appointments-grid">
          ${appointments.map((apt, index) => `
            <div class="appointment-card">
              ${appointments.length > 1 ? `
                <div class="appointment-header">الموعد ${index + 1}</div>
              ` : ''}
              <div class="appointment-row">
                <span class="appointment-label">التخصص:</span>
                <span class="appointment-value">${apt.specialty}</span>
              </div>
              <div class="appointment-row">
                <span class="appointment-label">التاريخ:</span>
                <span class="appointment-value">${apt.date}</span>
              </div>
              <div class="appointment-row">
                <span class="appointment-label">الوقت:</span>
                <span class="appointment-value">${apt.time}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="footer">
        <p>تم إصدار هذا المستند في: ${new Date().toLocaleString("ar-DZ")} | نظام إدارة المواعيد © ${new Date().getFullYear()}</p>
      </div>
    </body>
    </html>
  `);
  
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 250);
};

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 md:p-6">
        <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-2xl mx-auto animate-bounceIn max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl">
          {/* Header Section */}
          <div className="sticky top-0 bg-gradient-to-b from-green-50 to-white pt-6 pb-4 px-4 sm:px-6 md:px-8 border-b border-green-100">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mb-3 sm:mb-4 shadow-lg">
                <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 text-white animate-pulse" />
              </div>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-2 font-droid-arabic-kufi">
                تم الحجز بنجاح!
              </h3>
              <p className="text-sm sm:text-base text-red-600 font-droid-arabic-kufi">
                يرجى حفظ هذه المعلومات لعرضها عند الحضور للفحص
              </p>
            </div>
          </div>

          {/* Content Section */}
          <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-6 space-y-4 sm:space-y-5">
            {/* Patient Name */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-blue-200">
              <div className="flex items-center gap-3 justify-center sm:justify-start">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="text-center sm:text-right">
                  <p className="text-xs sm:text-sm text-gray-600 font-droid-arabic-kufi mb-1">
                    السيد :
                  </p>
                  <p className="text-base sm:text-lg md:text-xl font-bold text-gray-800 font-droid-arabic-kufi">
                    {fullName}
                  </p>
                </div>
              </div>
            </div>

            {/* Document Upload Confirmation */}
            {medicalDocuments.length > 0 && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm">
                <div className="flex items-center gap-2 sm:gap-3 justify-center">
                  <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 flex-shrink-0" />
                  <span className="text-sm sm:text-base font-semibold text-green-800 font-droid-arabic-kufi">
                    تم تحميل {medicalDocuments.length} مستند طبي بنجاح
                  </span>
                </div>
              </div>
            )}
            
            {/* Appointment Details */}
            <div className="bg-gradient-to-br text-left from-blue-50 via-indigo-50 to-purple-50 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-sm border border-blue-200">
              <h4 className="font-bold text-left text-base sm:text-lg md:text-xl text-gray-800 mb-3 sm:mb-4 font-droid-arabic-kufi flex items-center gap-2 justify-center sm:justify-start">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                <span>تفاصيل المواعيد</span>
              </h4>
              
              <div className="space-y-3">
                {appointments.map((apt, index) => (
                  <div 
                    key={index} 
                    className="bg-white text-left rounded-lg sm:rounded-xl p-3 sm:p-4 border-2 border-blue-200 shadow-sm hover:shadow-md transition-shadow"
                  >
                    {appointments.length > 1 && (
                      <div className="flex text-left justify-center mb-3">
                        <span className="inline-block px-3 py-1 bg-blue-500 text-white text-xs sm:text-sm font-bold rounded-full">
                          الموعد {index + 1}
                        </span>
                      </div>
                    )}
                    
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex items-start gap-2 sm:gap-3">
                        <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 flex-shrink-0 mt-1" />
                        <div className="text-left flex-1">
                          <p className="text-xs text-gray-500 font-droid-arabic-kufi mb-1">التخصص</p>
                          <p className="font-semibold text-sm sm:text-base font-droid-arabic-kufi text-gray-800">
                            {apt.specialty}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-2 sm:gap-3">
                        <CalendarDays className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 flex-shrink-0 mt-1" />
                        <div className="text-left flex-1">
                          <p className="text-xs text-gray-500 font-droid-arabic-kufi mb-1">التاريخ</p>
                          <p className="font-semibold text-sm sm:text-base font-droid-arabic-kufi text-gray-800 leading-relaxed">
                            {apt.date}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-2 sm:gap-3">
                        <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 flex-shrink-0 mt-1" />
                        <div className="text-left flex-1">
                          <p className="text-xs text-gray-500 font-droid-arabic-kufi mb-1">الوقت</p>
                          <p className="font-semibold text-sm sm:text-base font-droid-arabic-kufi text-gray-800">
                            {apt.time}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Important Reminder */}
            <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300 rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm" dir="rtl">
              <div className="flex items-start gap-2 sm:gap-3">
                <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 flex-shrink-0 mt-1" />
                <div className="text-left flex-1">
                  <h4 className="font-bold text-base sm:text-lg text-gray-800 font-droid-arabic-kufi mb-2 sm:mb-3">
                    تنبيه مهم
                  </h4>
                  <ul className="space-y-2 text-xs sm:text-sm text-gray-700 font-droid-arabic-kufi leading-relaxed">
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-600 font-bold flex-shrink-0">•</span>
                      <span>يرجى الالتزام بالموعد المحدد والحضور قبله بـ 15 دقيقة</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-600 font-bold flex-shrink-0">•</span>
                      <span>في حالة عدم القدرة على الحضور، يرجى إبلاغنا مسبقاً</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-600 font-bold flex-shrink-0">•</span>
                      <span>سنتواصل معك على الرقم: <span className="font-bold text-gray-800">{formData.phone}</span></span>
                    </li>
                    {formData.phone2 && (
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-600 font-bold flex-shrink-0">•</span>
                        <span>أو الرقم الثانوي: <span className="font-bold text-gray-800">{formData.phone2}</span></span>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="sticky bottom-0 bg-gradient-to-t from-white to-transparent pt-4 pb-6 px-4 sm:px-6 md:px-8 space-y-3">
            {/* Download PDF Button */}
            <button
              type="button"
              onClick={handleDownloadPDF}
              className="w-full px-6 py-3 sm:py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg sm:rounded-xl text-sm sm:text-base md:text-lg font-bold font-droid-arabic-kufi hover:from-green-600 hover:to-emerald-700 active:scale-[0.98] transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <Printer className="w-5 h-5" />
              تحميل تأكيد الحجز
            </button>

            {/* New Appointment Button */}
            <button
              type="button"
              onClick={() => {
                setShowSuccessAnimation(false);
                setFormData({
                  name: '',
                  lastName: '',
                  birthday: '',
                  state: '',
                  city: '',
                  diseases: '',
                  phone: '',
                  phone2: '',
                  sex: '',
                  specialties: [{ event_specialty_id: '', day_id: '', hour_id: '' }],
                });
                setMedicalDocuments([]);
                setCurrentStep(0);
                setAcceptedRules(false);
                setAvailableCities([]);
              }}
              className="w-full px-6 py-3 sm:py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg sm:rounded-xl text-sm sm:text-base md:text-lg font-bold font-droid-arabic-kufi hover:from-blue-600 hover:to-blue-700 active:scale-[0.98] transition-all shadow-lg hover:shadow-xl"
            >
              حجز موعد آخر
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ==================== MAIN RENDER ====================

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <LoadingSkeleton />
        </div>
      </div>
    );
  }

  if (!event || event.is_active == 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2 font-droid-arabic-kufi">
            الحدث غير موجود
          </h2>
          <p className="text-gray-600 font-droid-arabic-kufi">
            عذراً، لا يمكن العثور على الحدث المطلوب
          </p>
        </div>
      </div>
    );
  }

  if (allSpecialtiesSaturated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-white p-4 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full">
          <div className="text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-12 h-12 text-red-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4 font-droid-arabic-kufi">
              الحدث مكتمل
            </h2>
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-6">
              <p className="text-red-800 font-droid-arabic-kufi text-lg leading-relaxed mb-4">
                عذراً، جميع التخصصات في حدث <span className="font-bold">"{event.name}"</span> مشبعة حالياً 
                ولا يمكن قبول حجوزات جديدة.
              </p>
              <p className="text-red-700 font-droid-arabic-kufi">
                يرجى التواصل مع المنظمين للمزيد من المعلومات أو متابعة الإعلانات عن أحداث جديدة.
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-6 text-right">
              <h3 className="font-bold text-lg font-droid-arabic-kufi mb-3 text-gray-800">
                معلومات الحدث:
              </h3>
              <div className="space-y-2 text-gray-600 font-droid-arabic-kufi">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>{event.state || 'غير محدد'} | {event.city || '-'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const steps = [
    { title: 'معلومات الحدث', component: renderEventInfo },
    { title: 'المعلومات الشخصية', component: renderPersonalInfo },
    { title: 'اختر التخصص', component: renderSpecialtySelection },
    { title: 'الشروط والأحكام', component: renderRulesAcceptance }
  ];

  const currentStepData = steps[currentStep];
  const canProceed = currentStep === 0 
    ? !allSpecialtiesSaturated
    : currentStep === 1 
      ? formData.name && formData.lastName && formData.birthday && formData.state && formData.city && formData.phone && formData.phone2 && formData.sex
      : currentStep === 2 
        ? formData.specialties.every(s => s.event_specialty_id && s.day_id && s.hour_id)
        : acceptedRules;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4" dir="rtl">
      {showSuccessAnimation && <SuccessAnimation />}
      
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-fadeIn">
          <p className="text-gray-600 font-droid-arabic-kufi">
            نظام حجز المواعيد الإلكتروني
          </p>
        </div>

        {/* Main Form Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Progress Bar */}
          <div className="p-6 bg-gradient-to-r from-blue-500 to-purple-500">
            <ProgressBar currentStep={currentStep} totalSteps={steps.length} />
          </div>
          
          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6 md:p-8">
            {/* Messages */}
            {message.text && (
              <Alert 
                type={message.type} 
                message={message.text} 
                onClose={() => setMessage({ type: '', text: '' })}
              />
            )}
            
            {/* Current Step Content */}
            <div className="mb-8">
              {currentStepData.component()}
            </div>
            
            {/* Navigation Buttons */}
            <div className="flex justify-between items-center gap-4">
              {currentStep > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep(prev => prev - 1);
                    setShowMissingFields(false);
                    setMessage({ type: '', text: '' });
                  }}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg
                           font-medium font-droid-arabic-kufi hover:bg-gray-50
                           transition-all duration-300 flex items-center gap-2"
                >
                  <ChevronRight className="w-5 h-5 rotate-180" />
                  السابق
                </button>
              )}
              
              {currentStep < steps.length - 1 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className={`
                    flex-1 px-6 py-3 rounded-lg font-medium font-droid-arabic-kufi
                    transition-all duration-300 flex items-center justify-center gap-2
                    ${canProceed
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-lg transform hover:scale-105'
                      : 'bg-gradient-to-r from-blue-400 to-purple-400 text-white cursor-pointer'
                    }
                  `}
                >
                  التالي
                  <ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!isFormValid || isSubmitting || allSpecialtiesSaturated}
                  className={`
                    flex-1 px-6 py-3 rounded-lg font-bold font-droid-arabic-kufi
                    transition-all duration-300 flex items-center justify-center gap-2
                    ${isFormValid && !isSubmitting && !allSpecialtiesSaturated
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-lg transform hover:scale-105'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }
                  `}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      جاري إرسال الحجز...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      تأكيد الحجز
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
        
        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500 font-droid-arabic-kufi">
          <p>جميع الحقوق محفوظة © 2024</p>
        </div>
      </div>
    </div>
  );
};

export default RegisterVisit;