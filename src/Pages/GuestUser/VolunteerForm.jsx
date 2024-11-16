import React, { useEffect, useState } from 'react';
import { useLanguage } from "../../Context/LanguageContext";
import Footer from './HomePage/Components/Footer';

const apiUrl = import.meta.env.VITE_API_URL; 
const VolunteerForm = () => {
    const { language } = useLanguage(); // Destructure language from useLanguage
    const [types, setTypes] = useState([]);

    const [formData, setFormData] = useState({
        full_name: '',
        date_of_birth: '',
        gender: '',
        phone_number: '',
        email_address: '',
        city: '',
        state: '',
        relevant_skills: '',
        previous_volunteering_experience: '',
        professional_background: '',
        areas_of_interest: '',
        preferred_types_of_activities: '',
        reasons_for_volunteering: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });

        if (name === 'city') {
            setFormData({
                ...formData,
                state: '',
                city: value
            });
        }
    };


  async function getTypes() {
    const res = await fetch(`${apiUrl}/api/types`);
    const data = await res.json();
    setTypes(data);
  } 
  useEffect(() => {
    getTypes();
  }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${apiUrl}/api/volunteers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                const data = await response.json();
                // console.log(data);
                setMessage(language === 'en' ? 'Form submitted successfully!' : 'تم إرسال النموذج بنجاح!');

                setFormData({
                    full_name: '',
                    date_of_birth: '',
                    gender: '',
                    phone_number: '',
                    email_address: '',
                    city: '',
                    state: '',
                    relevant_skills: '',
                    previous_volunteering_experience: '',
                    professional_background: '',
                    areas_of_interest: '',
                    preferred_types_of_activities: '',
                    reasons_for_volunteering: ''
                });

                setTimeout(() => {
                    setMessage(null);
                }, 5000);
            } else {
                setMessage(language === 'en' ? 'Error submitting form' : 'خطأ في إرسال النموذج');
            }
        } catch (error) {
            console.error('Error:', error);
            setMessage(language === 'en' ? 'Error submitting form' : 'خطأ في إرسال النموذج');
        }
    };

    const [message, setMessage] = useState('');

    const wilayas = [
        { value: 'أدرار 01', label: language === 'en' ? 'Adrar 01' : 'أدرار 01' },
        { value: 'الشلف 02', label: language === 'en' ? 'Chlef 02' : 'الشلف 02' },
        { value: 'الأغواط 03', label: language === 'en' ? 'Laghouat 03' : 'الأغواط 03' },
        { value: 'أم البواقي 04', label: language === 'en' ? 'Oum El Bouaghi 04' : 'أم البواقي 04' },
        { value: 'باتنة 05', label: language === 'en' ? 'Batna 05' : 'باتنة 05' },
        { value: 'بجاية 06', label: language === 'en' ? 'Bejaia 06' : 'بجاية 06' },
        { value: 'بسكرة 07', label: language === 'en' ? 'Biskra 07' : 'بسكرة 07' },
        { value: 'بشار 08', label: language === 'en' ? 'Bechar 08' : 'بشار 08' },
        { value: 'البليدة 09', label: language === 'en' ? 'Blida 09' : 'البليدة 09' },
        { value: 'البويرة 10', label: language === 'en' ? 'Bouira 10' : 'البويرة 10' },
        { value: 'تمنراست 11', label: language === 'en' ? 'Tamanrasset 11' : 'تمنراست 11' },
        { value: 'تبسة 12', label: language === 'en' ? 'Tebessa 12' : 'تبسة 12' },
        { value: 'تلمسان 13', label: language === 'en' ? 'Tlemcen 13' : 'تلمسان 13' },
        { value: 'تيارت 14', label: language === 'en' ? 'Tiaret 14' : 'تيارت 14' },
        { value: 'تيزي وزو 15', label: language === 'en' ? 'Tizi Ouzou 15' : 'تيزي وزو 15' },
        { value: 'الجزائر العاصمة 16', label: language === 'en' ? 'Algiers 16' : 'الجزائر العاصمة 16' },
        { value: 'الجلفة 17', label: language === 'en' ? 'Djelfa 17' : 'الجلفة 17' },
        { value: 'جيجل 18', label: language === 'en' ? 'Jijel 18' : 'جيجل 18' },
        { value: 'سطيف 19', label: language === 'en' ? 'Setif 19' : 'سطيف 19' },
        { value: 'سعيدة 20', label: language === 'en' ? 'Saida 20' : 'سعيدة 20' },
        { value: 'سكيكدة 21', label: language === 'en' ? 'Skikda 21' : 'سكيكدة 21' },
        { value: 'سيدي بلعباس 22', label: language === 'en' ? 'Sidi Bel Abbes 22' : 'سيدي بلعباس 22' },
        { value: 'عنابة 23', label: language === 'en' ? 'Annaba 23' : 'عنابة 23' },
        { value: 'قالمة 24', label: language === 'en' ? 'Guelma 24' : 'قالمة 24' },
        { value: 'قسنطينة 25', label: language === 'en' ? 'Constantine 25' : 'قسنطينة 25' },
        { value: 'المدية 26', label: language === 'en' ? 'Medea 26' : 'المدية 26' },
        { value: 'مستغانم 27', label: language === 'en' ? 'Mostaganem 27' : 'مستغانم 27' },
        { value: 'المسيلة 28', label: language === 'en' ? "M'Sila 28" : 'المسيلة 28' },
        { value: 'معسكر 29', label: language === 'en' ? 'Mascara 29' : 'معسكر 29' },
        { value: 'ورقلة 30', label: language === 'en' ? 'Ouargla 30' : 'ورقلة 30' },
        { value: 'وهران 31', label: language === 'en' ? 'Oran 31' : 'وهران 31' },
        { value: 'البيض 32', label: language === 'en' ? 'El Bayadh 32' : 'البيض 32' },
        { value: 'إليزي 33', label: language === 'en' ? 'Illizi 33' : 'إليزي 33' },
        { value: 'برج بوعريريج 34', label: language === 'en' ? 'Bordj Bou Arreridj 34' : 'برج بوعريريج 34' },
        { value: 'بومرداس 35', label: language === 'en' ? 'Boumerdes 35' : 'بومرداس 35' },
        { value: 'الطارف 36', label: language === 'en' ? 'El Tarf 36' : 'الطارف 36' },
        { value: 'تندوف 37', label: language === 'en' ? 'Tindouf 37' : 'تندوف 37' },
        { value: 'تيسمسيلت 38', label: language === 'en' ? 'Tissemsilt 38' : 'تيسمسيلت 38' },
        { value: 'الوادي 39', label: language === 'en' ? 'El Oued 39' : 'الوادي 39' },
        { value: 'خنشلة 40', label: language === 'en' ? 'Khenchela 40' : 'خنشلة 40' },
        { value: 'سوق أهراس 41', label: language === 'en' ? 'Souk Ahras 41' : 'سوق أهراس 41' },
        { value: 'تيبازة 42', label: language === 'en' ? 'Tipaza 42' : 'تيبازة 42' },
        { value: 'ميلة 43', label: language === 'en' ? 'Mila 43' : 'ميلة 43' },
        { value: 'عين الدفلى 44', label: language === 'en' ? 'Aïn Defla 44' : 'عين الدفلى 44' },
        { value: 'النعامة 45', label: language === 'en' ? 'Naama 45' : 'النعامة 45' },
        { value: 'عين تموشنت 46', label: language === 'en' ? 'Aïn Témouchent 46' : 'عين تموشنت 46' },
        { value: 'غرداية 47', label: language === 'en' ? 'Ghardaia 47' : 'غرداية 47' },
        { value: 'غليزان 48', label: language === 'en' ? 'Guelma 48' : 'غليزان 48' },
        { value: 'تيميمون 49', label: language === 'en' ? 'Timimoun 49' : 'تيميمون 49' },
        { value: 'برج باجي مختار 50', label: language === 'en' ? 'Bordj Badji Mokhtar 50' : 'برج باجي مختار 50' },
        { value: 'أولاد جلال 51', label: language === 'en' ? 'Oulad Djellal 51' : 'أولاد جلال 51' },
        { value: 'بني عباس 52', label: language === 'en' ? 'Beni Abbès 52' : 'بني عباس 52' },
        { value: 'عين صالح 53', label: language === 'en' ? 'Aïn Salah 53' : 'عين صالح 53' },
        { value: 'عين قزام 54', label: language === 'en' ? 'Aïn Guezzam 54' : 'عين قزام 54' },
        { value: 'تقرت 55', label: language === 'en' ? 'Tugurt 55' : 'تقرت 55' },
        { value: 'جانت 56', label: language === 'en' ? 'Djanet 56' : 'جانت 56' },
        { value: 'المغير 57', label: language === 'en' ? 'El M’Ghair 57' : 'المغير 57' },
        { value: 'المنيعة 58', label: language === 'en' ? 'El Menia 58' : 'المنيعة 58' }
    ];
    
    
    return (
        <>
        <div className="min-h-screen px-10 block mx-auto py-12 bg-gradient-to-b from-white to-[#DAE0F5]">
            {message && (
                <div className="flex items-center p-4 mb-4 text-sm text-[#2F3645] border border-green-300 rounded-lg bg-[#EEEDEB]" role="alert">
                    <svg className="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
                    </svg>
                    <div>
                        <span className="font-medium">{message}</span>
                    </div>
                </div>
            )}
            <h1 className="text-5xl font-bold mb-8 text-center text-[#101E58]">{language === 'en' ? 'Volunteer Form' : 'إستمارة المتطوعين'}</h1>
            <p className="text-xl leading-relaxed mb-10 text-center text-[#E03A6F] font-droid-arabic-kufi">
                {language === 'en' ? 'Let’s work together for a better future' : 'لنعمل سويا من أجل حياة أبدية'}
            </p>        
            <form className="space-y-6 w-full max-w-screen-lg mx-auto" onSubmit={handleSubmit}>
                <div className="flex flex-wrap -mx-2">
                    <div className="w-full sm:w-1/2 px-2 mb-4 sm:mb-0">
                        <label className="block text-xl mb-2 text-gray-800">{language === 'en' ? 'Full Name' : 'الاسم الكامل'}<span className="text-red-500">*</span></label>
                        <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:border-blue-500" required />
                    </div>
                    <div className="w-full sm:w-1/2 px-2">
                        <label className="block text-xl mb-2 text-gray-800">{language === 'en' ? 'Date of Birth' : 'تاريخ الميلاد'}<span className="text-red-500">*</span></label>
                        <input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:border-blue-500" required />
                    </div>
                </div>
                <div className="flex flex-wrap -mx-2">
                    <div className="w-full sm:w-1/2 px-2 mb-4 sm:mb-0">
                        <label className="block text-xl mb-2 text-gray-800">{language === 'en' ? 'Gender' : 'الجنس'}<span className="text-red-500">*</span></label>
                        <select name="gender" value={formData.gender} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:border-blue-500" required>
                            <option value="">{language === 'en' ? 'Select Gender' : 'اختر الجنس'}</option>
                            <option value="Male">{language === 'en' ? 'Male' : 'ذكر'}</option>
                            <option value="Female">{language === 'en' ? 'Female' : 'أنثى'}</option>
                        </select>
                    </div>
                    <div className="w-full sm:w-1/2 px-2">
                        <label className="block text-xl mb-2 text-gray-800">{language === 'en' ? 'Phone Number' : 'رقم الهاتف'}<span className="text-red-500">*</span></label>
                        <input type="tel" name="phone_number" value={formData.phone_number} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:border-blue-500" required />
                    </div>
                </div>
                <div className="flex flex-wrap -mx-2">
                    <div className="w-full sm:w-1/2 px-2">
                        <label className="block text-xl mb-2 text-gray-800">{language === 'en' ? 'City' : 'الولاية'}<span className="text-red-500">*</span></label>
                        <select name="city" value={formData.city} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:border-blue-500" required>
                            <option value="">{language === 'en' ? 'Select City' : 'اختر الولاية'}</option>
                            {wilayas.map((city, index) => (
                                <option key={index} value={city.value}>{city.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="w-full sm:w-1/2 px-2 mb-4 sm:mb-0">
                        <label className="block text-xl mb-2 text-gray-800">{language === 'en' ? 'Commun' : 'البلدية'}<span className="text-red-500">*</span></label>
                        <input type="text" name="state" value={formData.state} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:border-blue-500" required />
                    </div>
                </div>
                <div className="flex flex-wrap -mx-2">
                <div className="w-full px-2">
                        <label className="block text-xl mb-2 text-gray-800">{language === 'en' ? 'Email' : ' الايمايل'}<span className="text-red-500">*</span></label>
                        <input type="email" name="email_address" value={formData.email_address} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:border-blue-500" required />
                    </div>
                </div>
                <div className="flex flex-wrap -mx-2">
                    <div className="w-full px-2 mb-4 sm:mb-0">
                        <label className="block text-xl mb-2 text-gray-800">{language === 'en' ? 'Relevant Skills' : 'المهارات ذات الصلة'}</label>
                        <textarea name="relevant_skills" value={formData.relevant_skills} onChange={handleChange} rows="4" className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:border-blue-500"></textarea>
                    </div>
                </div>
                <div className="flex flex-wrap -mx-2">
                    <div className="w-full px-2 mb-4 sm:mb-0">
                        <label className="block text-xl mb-2 text-gray-800">{language === 'en' ? 'Previous Volunteering Experience' : 'الخبرة السابقة في التطوع'}</label>
                        <textarea name="previous_volunteering_experience" value={formData.previous_volunteering_experience} onChange={handleChange} rows="4" className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:border-blue-500"></textarea>
                    </div>
                </div>
                <div className="flex flex-wrap -mx-2">
                    <div className="w-full px-2 mb-4 sm:mb-0">
                        <label className="block text-xl mb-2 text-gray-800">{language === 'en' ? 'Professional Background' : 'الخلفية المهنية'}</label>
                        <textarea name="professional_background" value={formData.professional_background} onChange={handleChange} rows="4" className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:border-blue-500"></textarea>
                    </div>
                </div>
                <div className="flex flex-wrap -mx-2">
                    <div className="w-full px-2 mb-4 sm:mb-0">
                        <label className="block text-xl mb-2 text-gray-800">{language === 'en' ? 'Areas of Interest' : 'مجالات الاهتمام'}</label>
                        <textarea name="areas_of_interest" value={formData.areas_of_interest} onChange={handleChange} rows="4" className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:border-blue-500"></textarea>
                    </div>
                </div>
                <div className="flex flex-wrap -mx-2">
                    <div className="w-full px-2 mb-4 sm:mb-0">
                        <label className="block text-xl mb-2 text-gray-800">{language === 'en' ? 'Preferred Types of Activities' : 'أنواع الأنشطة المفضلة'}</label>
                        <textarea name="preferred_types_of_activities" value={formData.preferred_types_of_activities} onChange={handleChange} rows="4" className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:border-blue-500"></textarea>
                    </div>
                </div>
                <div className="flex flex-wrap -mx-2">
                    <div className="w-full px-2 mb-4 sm:mb-0">
                        <label className="block text-xl mb-2 text-gray-800">{language === 'en' ? 'Reasons for Volunteering' : 'أسباب التطوع'}</label>
                        <textarea name="reasons_for_volunteering" value={formData.reasons_for_volunteering} onChange={handleChange} rows="4" className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:border-blue-500"></textarea>
                    </div>
                </div>
                <div className="flex justify-center">
                    <button type="submit" className="w-full px-6 py-3 bg-[#E03A6F] text-white font-semibold text-lg rounded-lg shadow-lg hover:bg-[#BF2D56]">{language === 'en' ? 'Submit' : 'إرسال'}</button>
                </div>
            </form>
        </div>
       
        <Footer types={types} />

        </>
    );
};

export default VolunteerForm;
