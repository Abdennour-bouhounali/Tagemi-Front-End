import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, CheckCircle, Send, Loader,Check, AlertCircle } from 'lucide-react';


const apiUrl = import.meta.env.VITE_API_URL;

const EvaluationForm = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [event, setEvent] = useState(null);
  const [specialties, setSpecialties] = useState([]);
  
  // Get eventId and appointmentId from URL params manually
  const urlParams = new URLSearchParams(window.location.search);
  console.log(urlParams);
  
  const pathParts = window.location.pathname.split('/');  
  // ["", "evaluation", "38", "1384"]

  const eventId = pathParts[2];        // "38"
  const appointmentId = pathParts[3];  // "1384"

  const [formData, setFormData] = useState({
    event_id: eventId,
    appointment_id: appointmentId || null,
    age_range: '',
    gender: '',
    specialties: [], // Changed from specialty to specialties array
    overall_organization: 0,
    medical_quality: 0,
    staff_performance: 0,
    registration_ease: 0,
    platform_organization: 0,
    suggested_specialties: '',
    positive_points: '',
    negative_points: '',
    suggestions: '',
    would_recommend: null,
    contact_name: '',
    contact_phone: '',
    contact_email: '',
  });

  useEffect(() => {
    fetchFormData();
  }, []);

  const fetchFormData = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/evaluations/form-data/${eventId}`);
      const data = await res.json();
      
      if (res.ok) {
        setEvent(data.event);
        setSpecialties(data.specialties);
      } else {
        setError('فشل في تحميل بيانات الحدث');
      }
    } catch (err) {
      setError('حدث خطأ أثناء تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleRatingChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  // Handle specialty checkbox changes
  const handleSpecialtyToggle = (specialty) => {
    setFormData(prev => {
      const currentSpecialties = prev.specialties;
      const isSelected = currentSpecialties.includes(specialty);
      
      if (isSelected) {
        return {
          ...prev,
          specialties: currentSpecialties.filter(s => s !== specialty)
        };
      } else {
        return {
          ...prev,
          specialties: [...currentSpecialties, specialty]
        };
      }
    });
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    const requiredFields = [
      'age_range', 'gender', 'specialties', 
      'overall_organization', 'medical_quality', 'staff_performance',
      'registration_ease', 'platform_organization',
      'suggested_specialties', 'positive_points', 'negative_points', 'suggestions'
    ];
    console.log('formData');
    console.log(formData);
    console.log('missingFields');
    
    const missingFields = requiredFields.filter(field => !formData[field]);
    if (formData.specialties.length === 0) {
      setError('يرجى اختيار تخصص واحد على الأقل');
      return false;
    }
    console.log(missingFields);
    
    if (missingFields.length > 0) {
      setError('يرجى ملء جميع الحقول المطلوبة');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    if (formData.would_recommend === null) {
      setError('يرجى الإجابة على سؤال التوصية');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`${apiUrl}/api/evaluations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setSubmitted(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => {
          window.location.href = '/home';
        }, 3000);
      } else {
        setError(data.message || 'فشل في إرسال التقييم');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      setError('حدث خطأ أثناء إرسال التقييم');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  const RatingQuestion = ({ label, field, required = true }) => (
    <div className="mb-6">
      <label className="block text-sm sm:text-base font-bold text-gray-800 mb-3 font-droid-arabic-kufi">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="flex flex-wrap gap-2 sm:gap-3">
        {[
          { value: 5, label: 'ممتاز' },
          { value: 4, label: 'جيد جدا' },
          { value: 3, label: 'جيد' },
          { value: 2, label: 'مقبول' },
          { value: 1, label: 'ضعيف' },
        ].map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => handleRatingChange(field, option.value)}
            className={`flex-1 min-w-[80px] px-3 py-2 sm:py-3 rounded-lg border-2 transition-all font-droid-arabic-kufi text-xs sm:text-sm ${
              formData[field] === option.value
                ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-105'
                : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
            }`}
          >
            <div className="flex flex-col items-center gap-1">
              <Star className={`w-4 h-4 sm:w-5 sm:h-5 ${formData[field] === option.value ? 'fill-current' : ''}`} />
              <span className="font-semibold">{option.label}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-droid-arabic-kufi">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-6 sm:p-8 text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-green-600" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 font-droid-arabic-kufi">
            تم إرسال التقييم بنجاح!
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 font-droid-arabic-kufi">
            شكراً لك على تخصيص وقتك لتقييم خدماتنا. ملاحظاتك تساعدنا على التحسين المستمر.
          </p>
          <p className="text-xs sm:text-sm text-gray-500 font-droid-arabic-kufi">
            سيتم توجيهك للصفحة الرئيسية خلال لحظات...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 via-blue-50 to-white">
      <div className="w-screen max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-10">

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 mb-6 border-t-4 border-blue-600">
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 font-droid-arabic-kufi">
              تقييم برنامج الفحوصات الطبية
            </h1>
            <h2 className="text-lg sm:text-xl font-semibold text-blue-600 mb-2 font-droid-arabic-kufi">
              {event?.name || 'مؤسسة تجمي للتنمية الإنسانية'}
            </h2>
            <p className="text-sm sm:text-base text-gray-600 font-droid-arabic-kufi">
              نقدر مشاركتك في تقييم خدماتنا
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border-r-4 border-red-500 p-3 sm:p-4 rounded-lg mb-6">
              <div className="flex items-start gap-2 sm:gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm sm:text-base text-red-700 font-droid-arabic-kufi">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
          {/* معلومات ديموغرافية */}
          <div className="mb-8">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 pb-2 border-b-2 border-blue-200 font-droid-arabic-kufi">
              المعلومات الأساسية
            </h3>

            {/* العمر */}
            <div className="mb-6">
              <label className="block text-sm sm:text-base font-bold text-gray-800 mb-3 font-droid-arabic-kufi">
                العمر <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {['أقل من 18 سنة', '18-35 سنة', '36-50 سنة', 'أكثر من 50 سنة'].map((age) => (
                  <button
                    key={age}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, age_range: age }))}
                    className={`px-3 py-2 sm:py-3 rounded-lg border-2 transition-all font-droid-arabic-kufi text-xs sm:text-sm ${
                      formData.age_range === age
                        ? 'bg-blue-600 text-white border-blue-600 shadow-lg'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    {age}
                  </button>
                ))}
              </div>
            </div>

            {/* الجنس */}
            <div className="mb-6">
              <label className="block text-sm sm:text-base font-bold text-gray-800 mb-3 font-droid-arabic-kufi">
                الجنس <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {['ذكر', 'أنثى'].map((gender) => (
                  <button
                    key={gender}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, gender }))}
                    className={`px-4 py-2 sm:py-3 rounded-lg border-2 transition-all font-droid-arabic-kufi text-sm sm:text-base ${
                      formData.gender === gender
                        ? 'bg-blue-600 text-white border-blue-600 shadow-lg'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    {gender}
                  </button>
                ))}
              </div>
            </div>

            {/* التخصص */}
           
              <div className="md:col-span-2">
                <label className="block text-gray-700 font-semibold mb-3 text-sm sm:text-base">
                  التخصصات التي زرتها <span className="text-red-500">*</span>
                  <span className="text-xs text-gray-500 font-normal mr-2">(يمكنك اختيار أكثر من تخصص)</span>
                </label>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {specialties.map((spec, index) => (
                    <label
                      key={index}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        formData.specialties.includes(spec)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-25'
                      }`}
                    >
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={formData.specialties.includes(spec)}
                          onChange={() => handleSpecialtyToggle(spec)}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                          formData.specialties.includes(spec)
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300 bg-white'
                        }`}>
                          {formData.specialties.includes(spec) && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                      </div>
                      <span className="text-sm font-medium text-gray-700">{spec}</span>
                    </label>
                  ))}
                </div>

                {/* Other specialty input */}

               
              
            </div>
          </div>

          {/* التقييمات */}
          <div className="mb-8">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 pb-2 border-b-2 border-blue-200 font-droid-arabic-kufi">
              تقييم الخدمة
            </h3>

            <RatingQuestion
              label="كيف تقيم تنظيم الفعالية بشكل عام؟"
              field="overall_organization"
            />

            <RatingQuestion
              label="كيف تقيم جودة الفحوصات الطبية المقدمة؟"
              field="medical_quality"
            />

            <RatingQuestion
              label="كيف تقيم أداء الأطباء والكادر الطبي؟"
              field="staff_performance"
            />

            <RatingQuestion
              label="كيف كان تسجيلك عبر المنصة الإلكترونية؟"
              field="registration_ease"
            />

            <RatingQuestion
              label="كيف تقيم طريقة تنظيم الفعالية باستخدام المنصة الإلكترونية؟"
              field="platform_organization"
            />
          </div>

          {/* أسئلة مفتوحة */}
          <div className="mb-8">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 pb-2 border-b-2 border-blue-200 font-droid-arabic-kufi">
              ملاحظاتك واقتراحاتك
            </h3>

            <div className="mb-6">
              <label className="block text-sm sm:text-base font-bold text-gray-800 mb-3 font-droid-arabic-kufi">
                ما هي الفحوصات التي تقترحها مستقبلاً؟ <span className="text-red-500">*</span>
              </label>
              <textarea
                name="suggested_specialties"
                value={formData.suggested_specialties}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none font-droid-arabic-kufi text-sm sm:text-base resize-none"
                placeholder="اكتب اقتراحاتك هنا..."
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm sm:text-base font-bold text-gray-800 mb-3 font-droid-arabic-kufi">
                ما هي النقاط الإيجابية التي لاحظتها خلال الفعالية؟ <span className="text-red-500">*</span>
              </label>
              <textarea
                name="positive_points"
                value={formData.positive_points}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none font-droid-arabic-kufi text-sm sm:text-base resize-none"
                placeholder="اكتب النقاط الإيجابية..."
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm sm:text-base font-bold text-gray-800 mb-3 font-droid-arabic-kufi">
                ما هي النقاط السلبية التي واجهتها؟ <span className="text-red-500">*</span>
              </label>
              <textarea
                name="negative_points"
                value={formData.negative_points}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none font-droid-arabic-kufi text-sm sm:text-base resize-none"
                placeholder="اكتب النقاط السلبية..."
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm sm:text-base font-bold text-gray-800 mb-3 font-droid-arabic-kufi">
                هل لديك أي اقتراحات لتحسين الفعاليات المستقبلية؟ <span className="text-red-500">*</span>
              </label>
              <textarea
                name="suggestions"
                value={formData.suggestions}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none font-droid-arabic-kufi text-sm sm:text-base resize-none"
                placeholder="اكتب اقتراحاتك..."
              />
            </div>
          </div>

          {/* التوصية */}
          <div className="mb-8">
            <label className="block text-sm sm:text-base font-bold text-gray-800 mb-3 font-droid-arabic-kufi">
              هل تنصح الآخرين بالمشاركة في فعالياتنا المستقبلية؟ <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: true, label: 'نعم' },
                { value: false, label: 'لا' },
              ].map((option) => (
                <button
                  key={option.value.toString()}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, would_recommend: option.value }))}
                  className={`px-4 py-3 rounded-lg border-2 transition-all font-droid-arabic-kufi text-sm sm:text-base ${
                    formData.would_recommend === option.value
                      ? option.value
                        ? 'bg-green-600 text-white border-green-600 shadow-lg'
                        : 'bg-red-600 text-white border-red-600 shadow-lg'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* معلومات الاتصال (اختياري) */}
          <div className="mb-8 bg-gray-50 rounded-xl p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4 font-droid-arabic-kufi">
              معلومات الاتصال (اختياري)
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 mb-4 font-droid-arabic-kufi">
              إذا كنت ترغب في أن نتواصل معك للمتابعة، يرجى ترك معلومات الاتصال
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <input
                type="text"
                name="contact_name"
                value={formData.contact_name}
                onChange={handleInputChange}
                placeholder="الاسم الكامل"
                className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none font-droid-arabic-kufi text-sm sm:text-base"
              />
              <input
                type="tel"
                name="contact_phone"
                value={formData.contact_phone}
                onChange={handleInputChange}
                placeholder="رقم الهاتف"
                className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-sm sm:text-base"
                dir="ltr"
              />
              <input
                type="email"
                name="contact_email"
                value={formData.contact_email}
                onChange={handleInputChange}
                placeholder="البريد الإلكتروني"
                className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-sm sm:text-base"
                dir="ltr"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-4 rounded-xl font-bold text-base sm:text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed font-droid-arabic-kufi flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  جاري الإرسال...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  إرسال التقييم
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-xs sm:text-sm text-gray-600 font-droid-arabic-kufi">
          <p>شكراً لك على وقتك ومشاركتك القيمة</p>
          <p className="mt-2">مؤسسة تجمي للتنمية الإنسانية © {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  );
};

export default EvaluationForm;