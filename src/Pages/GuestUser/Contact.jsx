import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../Context/LanguageContext';
import Footer from './HomePage/Components/Footer';


const apiUrl = import.meta.env.VITE_API_URL; 
const Contact = ({ project, projectName }) => {
  const { language } = useLanguage(); // Destructure language from useLanguage
  const [types, setTypes] = useState([]);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    message: project ? projectName : '',
    wilaya: '',
    type_message: project ? 'project_aide' : '',
  });

  const [message, setMessage] = useState('');

  async function getTypes() {
    const res = await fetch(`${apiUrl}/api/types`);
    const data = await res.json();
    setTypes(data);
  } 
  useEffect(() => {
    getTypes();
  }, []);
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${apiUrl}/api/contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        console.log(data);
        setMessage(data['message']);

        setFormData({
          first_name: '',
          last_name: '',
          phone: '',
          message: project ? projectName : '',
          wilaya: '',
          type_message: project ? (language === 'en' ? 'Project Assistance' : 'مساعدة في مشروع') : '',
        });

        setTimeout(() => {
          setMessage(null);
        }, 5000);
      } else {
        console.error('Error submitting form');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const wilayas = [
    'أدرار', 'الشلف', 'الأغواط', 'أم البواقي', 'باتنة', 'بجاية', 'بسكرة', 'بشار', 'البليدة', 'البويرة',
    'تمنراست', 'تبسة', 'تلمسان', 'تيارت', 'تيزي وزو', 'الجزائر', 'الجلفة', 'جيجل', 'سطيف', 'سعيدة',
    'سكيكدة', 'سيدي بلعباس', 'عنابة', 'قالمة', 'قسنطينة', 'المدية', 'مستغانم', 'المسيلة', 'معسكر', 'ورقلة',
    'وهران', 'البيض', 'إليزي', 'برج بوعريريج', 'بومرداس', 'الطارف', 'تندوف', 'تيسمسيلت', 'الوادي', 'خنشلة',
    'سوق أهراس', 'تيبازة', 'ميلة', 'عين الدفلى', 'النعامة', 'عين تموشنت', 'غرداية', 'غليزان'
  ];

  return (
    <>    <div className={`${project ? 'min-h-fit' : 'min-h-screen'} px-10 block mx-auto py-12 bg-gradient-to-b from-white to-[#DAE0F5]`}>
      {message && (
        <div className="flex items-center p-4 mb-4 text-sm text-[#2F3645] border border-green-300 rounded-lg bg-[#EEEDEB]" role="alert">
          <svg className="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
          </svg>
          <div>
            {message && message.length > 0 && (
              <span className="font-medium font-droid-arabic-kufi">{message}</span>
            )}
          </div>
        </div>
      )}
      <h1 className="text-5xl font-bold mb-8 text-center text-[#101E58] font-droid-arabic-kufi sm:text-2xl">
        {project ? (language === 'en' ? 'Contribute to this Project' : 'ساهم في تجسيد هذا المشروع') : (language === 'en' ? 'Contact Us' : 'تواصل معنا')}
      </h1>
      <p className="text-xl leading-relaxed mb-10 text-center text-[#E03A6F] font-droid-arabic-kufi">
        {language === 'en' ? 'Let’s work together for an eternal life' : 'لنعمل سويا من أجل حياة أبدية'}
      </p>
      <form className="space-y-6 w-full max-w-screen-lg mx-auto" onSubmit={handleSubmit}>
        <div className="flex flex-wrap -mx-2">
          <div className="w-full sm:w-1/2 px-2 mb-4 sm:mb-0">
            <label className="block text-xl mb-2 text-gray-800 font-droid-arabic-kufi">{language === 'en' ? 'First Name' : 'الإسم'}</label>
            <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:border-blue-500" />
          </div>
          <div className="w-full sm:w-1/2 px-2">
            <label className="block text-xl mb-2 text-gray-800 font-droid-arabic-kufi">{language === 'en' ? 'Last Name' : 'اللقب'}</label>
            <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:border-blue-500" />
          </div>
        </div>
        <div className="flex flex-wrap -mx-2">
          <div className="w-full sm:w-1/2 px-2 mb-4 sm:mb-0">
            <label className="block text-xl mb-2 text-gray-800 font-droid-arabic-kufi">{language === 'en' ? 'Phone Number (WhatsApp)' : 'رقم الهاتف (الواتساب)'}</label>
            <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:border-blue-500" />
          </div>
          <div className="w-full sm:w-1/2 px-2">
            <label className="block text-xl mb-2 text-gray-800 font-droid-arabic-kufi">{language === 'en' ? 'Wilaya' : 'الولاية'}</label>
            <select name="wilaya" value={formData.wilaya} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:border-blue-500">
              <option value="" className='font-droid-arabic-kufi'>{language === 'en' ? 'Select Wilaya' : 'اختر الولاية'}</option>
              {wilayas.map((wilaya, index) => (
                <option key={index} value={wilaya} className='font-droid-arabic-kufi'>{wilaya}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          {!project && (
            <>
              <label className="block text-xl mb-2 text-gray-800 font-droid-arabic-kufi">{language === 'en' ? 'Message' : 'الرسالة'}</label>
              <textarea name="message" value={formData.message} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm h-32 focus:outline-none focus:border-blue-500"></textarea>
            </>
          )}
        </div>
        <div>
          {!project && (
            <>
              <label className="block text-xl mb-2 text-gray-800 font-droid-arabic-kufi" hidden={project}>{language === 'en' ? 'Message Type' : 'نوع الرسالة'}</label>
              <select name="type_message" value={formData.type_message} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:border-blue-500" hidden={project}>
                <option value="" className='font-droid-arabic-kufi'>{language === 'en' ? 'Select Message Type' : 'اختر نوع الرسالة'}</option>
                <option value="project_aide" className='font-droid-arabic-kufi'>{language === 'en' ? 'Project Assistance' : 'مساعدة في مشروع'}</option>
                <option value="aide" className='font-droid-arabic-kufi'>{language === 'en' ? 'Ask Help' : 'طلبة مساعدة'}</option>
                <option value="question" className='font-droid-arabic-kufi'>{language === 'en' ? 'Question' : 'استفسار'}</option>
                <option value="other" className='font-droid-arabic-kufi'>{language === 'en' ? 'Other' : 'أخرى'}</option>
              </select>
            </>
          )}
        </div>
        <div>
          <button type="submit" className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
            {language === 'en' ? 'Submit' : 'إرسال'}
          </button>
        </div>
      </form>
    </div>
<Footer types={types} />
    </>

  );
};

export default Contact;
