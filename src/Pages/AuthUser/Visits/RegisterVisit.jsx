import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../../Context/AppContext';
import logo from './tagemi_logo.png';
import { useTranslation } from 'react-i18next';
const apiUrl = import.meta.env.VITE_API_URL; 
const RegisterVisit = ({ setSpecialities, specialities }) => {
  const { token } = useContext(AppContext);
  const { t } = useTranslation();
  const [message, setMessage] = useState('');
  const [waiting, setWaiting] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [minTime, setMinTime] = useState(0);
  const [openSpecialitiesCount, setOpenSpecialitiesCount] = useState(0);
  const [rules, setRules] = useState([]);
  const [confirm,setConfirm] = useState(false)
  const [acceptedRules, setAcceptedRules] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    specialties: [{ specialty_id: '' }],
  });

  useEffect(() => {
    getSpecialities();
    getRules();
  }, []);

  async function getRules() {
    const res = await fetch(`${apiUrl}/api/rules`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    setRules(data);
  }

  async function getSpecialities() {
    const res = await fetch(`${apiUrl}/api/specialty`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    setSpecialities(data['specialties']);
    const openSpecialities = data['specialties'].filter(specialty => specialty.id !== 6 && specialty.Flag !== 'Closed');
    setOpenSpecialitiesCount(openSpecialities.length);
  }

  const handleAddSpecialty = () => {
    if (formData.specialties.length < 2) {
      setFormData({
        ...formData,
        specialties: [...formData.specialties, { specialty_id: '' }],
      });
    }
  };

  const handleRemoveSpecialty = () => {
    if (formData.specialties.length > 1) {
      setFormData({
        ...formData,
        specialties: formData.specialties.slice(0, -1),
      });
    }
  };

  const handleChange = (index, event) => {
    const updatedSpecialties = formData.specialties.map((specialty, i) =>
      index === i ? { ...specialty, [event.target.name]: event.target.value } : specialty
    );
    setFormData({ ...formData, specialties: updatedSpecialties });
  };

  const handleChangeName = (event) => {
    setFormData({ ...formData, name: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const res = await fetch(`${apiUrl}/api/appointment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(formData),
    });
    const data = await res.json();

    if (res.ok) {
      setAppointments(data['appointments']);
      setMinTime(data['minTime']);
      getSpecialities();
      setFormData({
        name: '',
        specialties: [{ specialty_id: '' }],
      });
      setMessage(data['message']);
      setWaiting(data['waitinglist_message']);
    }

    setTimeout(() => {
      setMessage(null);
      setWaiting(null);
    }, 5000);
  };

  const isFormValid = formData.name && formData.specialties.every(specialty => specialty.specialty_id);

  return (
    <div className="relative md:static">
      {!confirm && (
        <div className="rules w-full max-w-md h-auto bg-white shadow-lg rounded-lg fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 p-6" dir="rtl">
        <h2 className="font-sans text-2xl font-semibold mb-6 text-center">
          ضوابط نظام الفحوصات الطبية
        </h2>
        <ul className="list-disc list-inside mb-6 space-y-2 text-gray-800">
          {rules.map(rule => (
            <li key={rule.id} className="text-sm">
              {rule.rule}
            </li>
          ))}
        </ul>
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="acceptRules"
            className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            onChange={(e) => setAcceptedRules(e.target.checked)}
          />
          <label htmlFor="acceptRules" className="mx-3 text-gray-700 text-sm">
            أوافق على الشروط
          </label>
        </div>
        <button
          onClick={() => setConfirm(true)}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={!acceptedRules}
        >
          تأكيد
        </button>
      </div>
      
      )}

      <img src="/tagemi_consept.jpg" className="hidden lg:block w-full h-auto" alt="Concept Image" />

      {confirm && (
        <div className="p-2 text-2xl min-w-[500px] h-fit text-white bg-opacity-50 rounded-xl fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="min-w-[578px] mx-auto bg-opacity-95 bg-[#EEEDEB] px-8 py-10">
            {/* Picture and Title */}
            <div className="flex items-center justify-center mb-8">
              <div className="text-center">
                <img src={logo} alt="Appointment Form" className="h-44 w-auto mb-4 mx-auto" />
                <h1 className="md:text-2xl text-sm font-bold font-droid-arabic-kufi text-[#2F3645]">أحجز موعدا مع الطبيب</h1>
              </div>
            </div>

            {/* Success Message */}
            {(message || waiting) && (
              <div className="flex items-center p-4 mb-4 text-sm text-[#2F3645] border border-green-300 rounded-lg bg-[#EEEDEB]" role="alert">
                <svg className="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
                </svg>
                <span className="sr-only font-droid-arabic-kufi">ملاحظة</span>
                <div>
                  {waiting && waiting.length > 0 && (
                    <>
                      <span className="font-medium font-droid-arabic-kufi">
                        أنت في قائمة الإنتظار في هذه التخصصات : {waiting}
                      </span>
                      <br />
                    </>
                  )}

                  {message && message.length > 0 && (
                    <span className="font-medium font-droid-arabic-kufi">{message}</span>
                  )}
                </div>
              </div>
            )}

            {/* Appointment Form */}
            <form onSubmit={handleSubmit} className="space-y-4 text-lg">
              <div>
                <label htmlFor="name" className="block text-gray-700 font-droid-arabic-kufi">الإسم الكامل :</label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={handleChangeName}
                  className="mt-1 block w-full rounded-md font-droid-arabic-kufi border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  placeholder="أكتب إسمك كاملا"
                  required
                />
              </div>
              {formData.specialties.map((specialty, index) => (
                <div key={index} className="flex space-x-4 items-end">
                  <div className='mx-4'>
                    <label htmlFor={`specialty_id_${index}`} className="block text-gray-700 font-droid-arabic-kufi">إختر التخصص</label>
                    <div className="relative">
                      <select
                        id={`specialty_id_${index}`}
                        required
                        name="specialty_id"
                        value={specialty.specialty_id}
                        onChange={(event) => handleChange(index, event)}
                        className="block appearance-none text-black font-normal text-lg w-full bg-[#EEEDEB] border border-[#2F3645] hover:border-[#131842] px-4 py-2 pr-8 rounded-md shadow-sm focus:outline-none focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                      >
                        <option value="">إختر تخصصا</option>
                        {specialities
                          .filter(specialty => specialty.id !== 6 && specialty.Flag !== 'Closed')
                          .map(specialty => (
                            <option key={specialty.id} value={specialty.id}>
                              {specialty.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                  {index === formData.specialties.length - 1 && (
                    <div className="flex space-x-2">
                      {formData.specialties.length < 2 && openSpecialitiesCount > 1 && (
                        <button
                          type="button"
                          onClick={handleAddSpecialty}
                          className="bg-green-500 hover:bg-green-700 text-white py-2 px-4 rounded font-droid-arabic-kufi"
                        >
                          أضف تخصص آخر
                        </button>
                      )}
                      {formData.specialties.length > 1 && (
                        <button
                          type="button"
                          onClick={handleRemoveSpecialty}
                          className="bg-red-500 hover:bg-red-700 text-white py-2 px-4 rounded font-droid-arabic-kufi"
                        >
                          إزالة التخصص
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
              <div className="flex items-center justify-center">
                <button
                  type="submit"
                  disabled={!isFormValid}
                  className="text-white bg-[#2F3645] hover:bg-[#131842] focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-lg px-8 py-3 text-center disabled:bg-gray-300 font-droid-arabic-kufi"
                >
                  إحجز موعدك
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisterVisit;
