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
  User,
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
  Users,
  AlertTriangle,
  Upload,
  FileText,
  X
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

// Specialty Card Component
const SpecialtyCard = ({ 
  specialty, 
  index, 
  event, 
  availableSlots, 
  onChange, 
  onRemove,
  canRemove 
}) => {
  const [expanded, setExpanded] = useState(true);

  // Filter out saturated specialties
  const availableSpecialties = event?.event_specialties?.filter(es => !es.is_saturated) || [];

  return (
    <div className={`
      border rounded-xl p-5 transition-all duration-300
      ${expanded ? 'bg-gradient-to-br from-blue-50 to-white shadow-lg' : 'bg-gray-50'}
    `}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
            {index + 1}
          </div>
          <h4 className="font-bold text-lg font-droid-arabic-kufi">
            التخصص {index + 1}
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
          {/* Check if there are available specialties */}
          {availableSpecialties.length === 0 ? (
            <Alert 
              type="warning" 
              message="عذراً، جميع التخصصات مشبعة حالياً. لا يمكن إضافة مواعيد جديدة." 
            />
          ) : (
            <>
              {/* Specialty Selection - Only show non-saturated */}
              <Select
                icon={Heart}
                label="التخصص الطبي"
                name="event_specialty_id"
                type="select"
                value={specialty.event_specialty_id}
                onChange={(e) => onChange(index, 'event_specialty_id', e.target.value)}
                placeholder="اختر التخصص"
                required
                options={availableSpecialties.map(es => ({
                  value: es.id,
                  label: es.specialty?.name
                }))}
              />

              {/* Day Selection */}
              {specialty.event_specialty_id && (
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
              )}

              {/* Hour Selection */}
              {specialty.day_id && (
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
                    label: new Date(slot.time).toISOString().split('T')[1].substring(0, 5)
                  }))}
                  disabled={!availableSlots[`${index}`]?.length}
                />
              )}

              {/* Visual feedback for slot availability */}
              {specialty.day_id && availableSlots[`${index}`]?.length === 0 && (
                <Alert 
                  type="warning" 
                  message="عذراً، لا توجد مواعيد متاحة لهذا اليوم. يرجى اختيار يوم آخر." 
                />
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
      const res = await fetch(`${apiUrl}/api/rules`);
      const data = await res.json();
      setRules(data);
    } catch (error) {
      console.error('Error fetching rules:', error);
    }
  }, []);

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
    if (formData.specialties.length < 2) {
      setFormData(prev => ({
        ...prev,
        specialties: [
          ...prev.specialties,
          { event_specialty_id: '', day_id: '', hour_id: '' }
        ],
      }));
    }
  }, [formData.specialties.length]);

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
  }, [formData.specialties, fetchAvailableSlots]);

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
  }, [validateField]);

  const handleBirthdayChange = useCallback((birthday) => {
    setFormData(prev => ({ ...prev, birthday }));
    validateField('birthday', birthday);
  }, [validateField]);

  const handleStateChange = useCallback((e) => {
    const stateName = e.target.value;
    setFormData(prev => ({ ...prev, state: stateName, city: '' }));
    
    setFieldErrors(prev => ({ ...prev, state: '', city: '' }));
    
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
      // Create FormData for file upload
      const formDataToSend = new FormData();
      
      // Append regular form data
      formDataToSend.append('name', formData.name);
      formDataToSend.append('lastName', formData.lastName);
      formDataToSend.append('birthday', formData.birthday);
      formDataToSend.append('state', formData.state);
      formDataToSend.append('city', formData.city);
      formDataToSend.append('diseases', formData.diseases || '');
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('phone2', formData.phone2);
      formDataToSend.append('sex', formData.sex);
      
      // Append specialties as JSON
      formData.specialties.forEach((specialty, index) => {
        formDataToSend.append(`specialties[${index}][event_specialty_id]`, specialty.event_specialty_id);
        formDataToSend.append(`specialties[${index}][day_id]`, specialty.day_id);
        formDataToSend.append(`specialties[${index}][hour_id]`, specialty.hour_id);
      });

      // Append files
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
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border border-green-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-500 text-white rounded-lg flex items-center justify-center">
              <Heart className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg font-droid-arabic-kufi text-gray-800">
              التخصصات المتاحة
            </h3>
          </div>
          <div className="space-y-2">
            {event?.event_specialties?.map(es => (
              <div key={es.id} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${es.is_saturated ? 'bg-red-400' : 'bg-green-400'}`}></div>
                  <span className={`font-droid-arabic-kufi text-sm ${es.is_saturated ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                    {es.specialty?.name}
                  </span>
                </div>
                {es.is_saturated && (
                  <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-droid-arabic-kufi">
                    مكتمل
                  </span>
                )}
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

        {/* Capacity Card */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-5 border border-orange-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-orange-500 text-white rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg font-droid-arabic-kufi text-gray-800">
              معلومات إضافية
            </h3>
          </div>
          <p className="text-gray-700 font-droid-arabic-kufi text-sm leading-relaxed">
            {event?.additional_info || 'يرجى الحضور قبل الموعد بـ 15 دقيقة'}
          </p>
        </div>
      </div>

      {/* Important Notes */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 mt-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
          <div>
            <h4 className="font-bold text-gray-800 font-droid-arabic-kufi mb-2">
              ملاحظات مهمة
            </h4>
            <ul className="space-y-1 text-sm text-gray-700 font-droid-arabic-kufi">
              <li>• يرجى الحضور بمحرم بالنسبة للنساء</li>
              <li>• الالتزام بالموعد المحدد</li>
            </ul>
          </div>
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
      
      <div className="grid md:grid-cols-2 gap-4">
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
      
      <BirthdayInput
        value={formData.birthday}
        onChange={handleBirthdayChange}
        error={fieldErrors.birthday}
      />
      
      <div className="grid md:grid-cols-2 gap-4">
        <Select
          icon={MapPin}
          label="الولاية"
          name="state"
          type="select"
          value={formData.state}
          onChange={handleStateChange}
          placeholder="اختر الولاية"
          required
          error={fieldErrors.state}
          options={algeriaLocations.algeria_locations.map(loc => ({
            value: loc.name_ar,
            label: `${loc.name_ar} - ${loc.code}`
          }))}
        />
        
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
      </div>
      
      <div className="grid md:grid-cols-2 gap-4">
        <Input
          icon={Phone}
          label="رقم الواتساب الأساسي"
          name="phone"
          type="tel"
          value={formData.phone}
          onChange={handleChangeData}
          placeholder="أدخل رقم الواتساب"
          required
          error={fieldErrors.phone}
        />
        
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
      
      <Input
        icon={Heart}
        label="الأمراض المزمنة"
        name="diseases"
        value={formData.diseases}
        onChange={handleChangeData}
        placeholder="يرجى ذكر الأمراض المزمنة إن وجدت"
      />

      {/* File Upload Field */}
      <FileUploadField
        files={medicalDocuments}
        onChange={handleFileChange}
        error={fieldErrors.medical_documents}
      />

      {/* Info box about medical documents */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
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
            />
          ))}
          
          {formData.specialties.length < 2 && 
           availableSpecialtiesCount > 1 && 
           availableSpecialtiesCount > formData.specialties.length && (
            <button
              type="button"
              onClick={handleAddSpecialty}
              className="w-full py-3 border-2 border-dashed border-blue-300 rounded-lg
                       text-blue-600 font-medium font-droid-arabic-kufi
                       hover:bg-blue-50 transition-all duration-300
                       flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              أضف تخصص آخر
            </button>
          )}
        </div>
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
              <p className="text-gray-700 font-droid-arabic-kufi text-sm leading-relaxed">
                {rule.rule}
              </p>
            </div>
          ))}
        </div>
      </div>
      
      <label className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors">
        <input
          type="checkbox"
          checked={acceptedRules}
          onChange={(e) => setAcceptedRules(e.target.checked)}
          className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
        />
        <span className="font-droid-arabic-kufi text-gray-700">
          أوافق على جميع الشروط والأحكام المذكورة أعلاه
        </span>
      </label>
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
          time: slot?.time ? new Date(slot.time).toISOString().split('T')[1].substring(0, 5) : 'غير محدد'
        };
      });
      
      return summaries;
    };

    const appointments = getAppointmentSummary();

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-2xl mx-4 animate-bounceIn max-h-[90vh] overflow-y-auto">
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-12 h-12 text-green-500 animate-pulse" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2 font-droid-arabic-kufi">
              تم الحجز بنجاح!
            </h3>
            <p className="text-gray-600 font-droid-arabic-kufi mb-6">
              سيتم التواصل معك قريباً عبر الواتساب
            </p>
            
            {/* Document Upload Confirmation */}
            {medicalDocuments.length > 0 && (
              <div className="w-full bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 justify-center">
                  <FileText className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-800 font-droid-arabic-kufi">
                    تم تحميل {medicalDocuments.length} مستند طبي بنجاح
                  </span>
                </div>
              </div>
            )}
            
            {/* Appointment Details */}
            <div className="w-full bg-blue-50 rounded-xl p-6 mb-6 text-right">
              <h4 className="font-bold text-lg text-gray-800 mb-4 font-droid-arabic-kufi flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                تفاصيل موعدك
              </h4>
              
              {appointments.map((apt, index) => (
                <div key={index} className="bg-white rounded-lg p-4 mb-3 border border-blue-200">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-blue-500" />
                      <span className="font-medium font-droid-arabic-kufi text-gray-700">
                        التخصص: {apt.specialty}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-blue-500" />
                      <span className="font-medium font-droid-arabic-kufi text-gray-700">
                        التاريخ: {apt.date}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <span className="font-medium font-droid-arabic-kufi text-gray-700">
                        الوقت: {apt.time}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Important Reminder */}
            <div className="w-full bg-yellow-50 border-2 border-yellow-200 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
                <div className="text-right">
                  <h4 className="font-bold text-gray-800 font-droid-arabic-kufi mb-2">
                    تنبيه مهم
                  </h4>
                  <ul className="space-y-1 text-sm text-gray-700 font-droid-arabic-kufi">
                    <li>• يرجى الالتزام بالموعد المحدد والحضور قبله بـ 15 دقيقة</li>
                    <li>• في حالة عدم القدرة على الحضور، يرجى إبلاغنا مسبقاً</li>
                    <li>• سنتواصل معك على الرقم: {formData.phone}</li>
                    {formData.phone2 && (
                      <li>• أو الرقم الثانوي: {formData.phone2}</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
            
            <button
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
              className="mt-6 px-6 py-3 bg-blue-500 text-white rounded-lg font-medium font-droid-arabic-kufi hover:bg-blue-600 transition-colors"
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
      ? formData.name && formData.lastName && formData.birthday && formData.state && formData.city && formData.phone && formData.sex
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
                  onClick={() => setCurrentStep(prev => prev - 1)}
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
                  onClick={() => setCurrentStep(prev => prev + 1)}
                  disabled={!canProceed}
                  className={`
                    flex-1 px-6 py-3 rounded-lg font-medium font-droid-arabic-kufi
                    transition-all duration-300 flex items-center justify-center gap-2
                    ${canProceed
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-lg transform hover:scale-105'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
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