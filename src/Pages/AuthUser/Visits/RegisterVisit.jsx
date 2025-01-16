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
  const [confirm, setConfirm] = useState(false)
  const [confirmafter, setConfirmAfter] = useState(false)
  const [acceptedRules, setAcceptedRules] = useState(false);
  const [isArabic, setIsArabic] = useState(false);
  const [validationMessage, setValidationMessage] = useState(""); // Track validation message


  const [formData, setFormData] = useState({
    name: '',
    lastName: '',
    birthday: '',
    residence: '',
    diseases: '',
    phone: '',
    sex: '', // TinyInt for sex (0 or 1)
    specialties: [{ specialty_id: '' }],
  });

  useEffect(() => {
    getSpecialities();
    getRules();
  }, []);

  async function getRules() {
    const res = await fetch(`${apiUrl}/api/rules`);
    const data = await res.json();
    setRules(data);
  }

  async function getSpecialities() {
    const res = await fetch(`${apiUrl}/api/specialty`);
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

  const handleChangeData = (e) => {
    const { name, value } = e.target;

    const arabicRegex = /^[\u0621-\u064A\u0660-\u0669\s]*$/;

    // If the name is 'name' or 'lastName', we validate Arabic input
    if (name === 'name' || name === 'lastName') {
      if (arabicRegex.test(value)) {
        // Input is valid (Arabic)
        setFormData({
          ...formData,
          [name]: value,
        });
        setIsArabic(true);
        setValidationMessage("");  // Clear validation message
      } else {
        // Input is invalid (non-Arabic)
        setIsArabic(false);
        setValidationMessage("يرجى إدخال أحرف عربية فقط");
      }
    } else {
      // For other fields, just update form data
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
      setIsArabic(true); // Assuming other fields are valid
      setValidationMessage(""); // Clear validation message
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


  const handleSubmit = async (event) => {

    event.preventDefault();

    formData.specialties.forEach((specialty, index) => {
      console.log(`Specialty ${index + 1} ID:`, specialty.specialty_id);
    });


    const res = await fetch(`${apiUrl}/api/appointment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });
    const data = await res.json();
    console.log(res);
    setConfirmAfter(true);
    if (res.ok) {
      setAppointments(data['appointments']);
      setMinTime(data['minTime']);
      getSpecialities();

      setFormData({
        name: '',
        lastName: '',
        birthday: '',
        residence: '',
        diseases: '',
        phone: '',
        sex: '', // TinyInt for sex (0 or 1)
        specialties: [{ specialty_id: '' }],
      });
      setMessage(data['message']);
      setWaiting(data['waitinglist_message']);
    }


  };

  const isFormValid = formData.name && formData.birthday && formData.residence && formData.sex && formData.specialties.every(specialty => specialty.specialty_id);

  return (
    <div className="relative md:static bg-slate-100 w-screen h-screen">
      {!confirm && (
        <div className="rules w-full max-w-[600px] h-auto bg-white  shadow-lg rounded-lg p-4 sm:p-2 fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" dir="rtl">
          <h1 className="text-2xl font-semibold mb-4 sm:mb-6 text-[#131842] text-center font-droid-arabic-kufi">
            ضوابط نظام الفحوصات الطبية
          </h1>
          <ul className="list-disc list-inside mb-4 sm:mb-6 px-4 space-y-2 text-gray-800">
            {rules.map(rule => (

              <li key={rule.id} className={`font-bold font-droid-arabic-kufi  ${rule.id == 1 ? 'text-red-500' : ''}`}>
                {rule.rule}
              </li>
            ))}
          </ul>
          <div className="flex items-center px-4 text-center mb-4">
            <input
              type="checkbox"
              id="acceptRules"
              className="h-4 w-4 sm:h-5 sm:w-5 text-3xl sm:text-lg font-bold font-droid-arabic-kufi  text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              onChange={(e) => setAcceptedRules(e.target.checked)}
            />
            <label htmlFor="acceptRules" className="mx-3 text-gray-700 text-lg font-droid-arabic-kufi">
              أوافق على الضوابط
            </label>
          </div>
          <div className="text-center">

            <button
              onClick={() => setConfirm(true)}
              className="text-white bg-blue-600 w-1/2 mx-auto focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-lg px-8 py-3 text-center disabled:bg-gray-300 font-droid-arabic-kufi"
              disabled={!acceptedRules}
            >
              تأكيد
            </button>
          </div>
        </div>

      )}


      {confirm && (
        <div className="p-2 text-l  h-fit text-white bg-opacity-50 rounded-xl container mx-auto">
          <div className=" mx-auto bg-opacity-95   py-10">

            {/* <div className="p-2 text-lg sm:text-2xl min-w-[300px] sm:min-w-[500px] h-fit text-white bg-opacity-50 rounded-xl "> */}
            {/* <div className="min-w-[250px] sm:min-w-[578px] mx-auto bg-opacity-95 bg-[#EEEDEB] px-4 sm:px-8 py-6 sm:py-10 "> */}
            {/* Picture and Title */}


            {/* Success Message */}
            {(message && confirmafter) && (
              <div className="flex flex-col  items-center text-center max-w-[700px] container p-3 sm:p-4 mb-4 text-lg sm:text-lg text-[#2F3645] border border-green-300 rounded-lg bg-[#EEEDEB] fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" role="alert">
                <span className="sr-only font-droid-arabic-kufi">ملاحظة</span>

                {/* Close Button */}
                {/* <button
                  onClick={() => setConfirmAfter(false)}
                  className="absolute top-2 right-2 text-[#2F3645] bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  ×
                </button> */}

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
                    <>
                      <span className='font-droid-arabic-kufi my-4 text-xl'>نسأل الله الشفاء لكل مرضى المسلمين</span>
                      <br />
                      <br />
                      {/* <span className=' font-black font-droid-arabic-kufi'>   نرجوا القدوم ساعة قبل   </span>    <span className='text-red-600 font-black font-droid-arabic-kufi'>{message}</span> */}
                      <span className='font-droid-arabic-kufi font-black text-red-500'>{message}</span>
                      <br />
                      <br />
                      <span className="text-lg text-red-500 font-bold my-4 font-droid-arabic-kufi">
                        بالنسبة للنساء يجب الحضور بمحرم                      </span>
                      <br />
                      <br />
                      <span className="font-extrabold font-droid-arabic-kufi my-4">إحجز لشخص آخر</span>
                      <br />
                      <br />
                    </>
                  )}
                </div>
                <button
                  onClick={() => setConfirmAfter(false)}
                  className="text-white bg-blue-600 w-1/2 mx-auto focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-lg px-8 py-3 text-center disabled:bg-gray-300 font-droid-arabic-kufi"
                >
                  تأكيد
                </button>
              </div>

            )}

            {/* Appointment Form */}
            {/* <form onSubmit={handleSubmit} className="space-y-4 text-lg"> */}
            <div className={`flex justify-center flex-col tetx-center max-w-[700px] mx-auto px-1 py-5 bg-[#EEEDEB] ${confirmafter ? 'hidden' : ''}`}>
              <div className="flex items-center justify-center mb-4 sm:mb-8">
                <div className="text-center">
                  <img src={logo} alt="Appointment Form" className="h-44 w-auto mb-4 mx-auto" />
                  <h1 className="md:text-2xl text-lg font-extrabold font-droid-arabic-kufi text-[#2F3645]"> مركب الفلك وهران</h1>
                  <h1 className="md:text-2xl text-lg font-extrabold font-droid-arabic-kufi text-[#2F3645] mb-3">الفحوصات الطبية 17 جانفي 2025</h1>
                  <h1 className="md:text-2xl text-sm font-bold font-droid-arabic-kufi text-[#2F3645]">أحجز موعدا مع الطبيب</h1>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 md:text-lg max-w-[600px] mx-auto  sm:text-lg ">

                {/* Name Field */}
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChangeData}
                  className="mt-1 block min-w-[320px] rounded-md sm:w-80 font-droid-arabic-kufi border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  placeholder="الإسم"
                  required
                />{!isArabic && formData.name && (
                  <p className="text-red-500 font-droid-arabic-kufi text-sm mt-1">{validationMessage}</p>
                )}

                {/* Last Name Field */}
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChangeData}
                  className="mt-1 block  text-black rounded-md font-droid-arabic-kufi border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  placeholder="اللقب"
                  required
                />
                {!isArabic && formData.name && (
                  <p className="text-red-500 text-sm mt-1 font-droid-arabic-kufi">{validationMessage}</p>
                )}
                {/* Birthday Field */}
                <label htmlFor="birthday" className="block text-gray-700 font-droid-arabic-kufi">تاريخ الميلاد :</label>
                <input
                  type="date"
                  id="birthday"
                  name="birthday"
                  value={formData.birthday}
                  onChange={handleChangeData}
                  className="mt-1 block  text-black px-5 rounded-md font-droid-arabic-kufi border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  required
                />

                {/* Residence Field */}
                {/* <label htmlFor="residence" className="block text-gray-700 font-droid-arabic-kufi">الإقامة :</label> */}

                <select
                  id="residence"
                  name="residence"
                  value={formData.residence}
                  onChange={handleChangeData}
                  className="mt-1 block  text-black rounded-md font-droid-arabic-kufi border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  required
                >
                  <option value="">قصر الإنتماء</option>
                  <option value="tajnint">تجنينت</option>
                  <option value="bonora">آت بونور</option>
                  <option value="taghardait">تغردايت</option>
                  <option value="yazgan">آت يزجن</option>
                  <option value="mlichat">آت مليشت</option>
                  <option value="karara">إقرارن</option>
                  <option value="berian">آت برقان</option>
                  <option value="warjlan">وارجلان</option>
                </select>


                {/* Diseases Field */}
                {/* <label htmlFor="diseases" className="block text-gray-700 font-droid-arabic-kufi">الأمراض :</label> */}
                <input
                  type="text"
                  id="diseases"
                  name="diseases"
                  value={formData.diseases}
                  onChange={handleChangeData}
                  className="mt-1 block  rounded-md text-black font-droid-arabic-kufi border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  placeholder="يرجى ذكر الأمراض المزمنة إن وجدت"

                />

                {/* Phone Field */}
                {/* <label htmlFor="phone" className="block text-gray-700 font-droid-arabic-kufi">رقم الهاتف :</label> */}
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChangeData}
                  className="mt-1 block rtl text-black rounded-md font-droid-arabic-kufi border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  placeholder="أدخل رقم هاتف الواتساب"
                  required
                  dir="rtl" // This ensures RTL text direction for the placeholder and user input
                />


                {/* Sex Field */}
                {/* <label htmlFor="sex" className="block text-gray-700 font-droid-arabic-kufi">الجنس :</label> */}
                <select
                  id="sex"
                  name="sex"
                  value={formData.sex}
                  onChange={handleChangeData}
                  className="mt-1 block  text-black rounded-md font-droid-arabic-kufi border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  required
                >
                  <option value="">اختر الجنس</option>
                  <option value="0">ذكر</option>
                  <option value="1">أنثى</option>
                </select>


                {formData.specialties.map((specialty, index) => (
                  <div key={index} className="block sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 items-end">
                    <div className="mx-auto">
                      {index === formData.specialties.length - 1 && formData.specialties.length > 1 && (


                        <span className='mr-0 text-red-600 font-droid-arabic-kufi'>حسب توفر الوقت</span>

                      )}
                      {/* <label htmlFor={`specialty_id_${index}`} className="block text-gray-700 font-droid-arabic-kufi">إختر التخصص</label> */}
                      <div className="relative w-1/2">

                        <select
                          id={`specialty_id_${index}`}
                          required
                          name="specialty_id"
                          value={specialty.specialty_id}
                          onChange={(event) => handleChange(index, event)}
                          dir="rtl" // This ensures the entire select dropdown is RTL
                          className="block mt-2 appearance-none text-black font-normal font-droid-arabic-kufi text-lg w-auto bg-[#EEEDEB] border border-[#2F3645] hover:border-[#131842]  py-2 pl-5 pr-1 rounded-md shadow-sm focus:outline-none focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                        >

                          <option value="" className='text-red-600 font-droid-arabic-kufi' dir="rtl">إختر تخصصا</option> {/* Ensure RTL for this option */}
                          {specialities
                            .filter(specialty => (specialty.id !== 6 && specialty.Flag !== 'Closed'))
                            .map(specialty => (
                              <option className='font-droid-arabic-kufi' dir="rtl" key={specialty.id} value={specialty.id}>
                                {specialty.name == 'طب الأسنان' ? 'طب الأسنان ( فحص و استشارة)' : specialty.name}
                              </option> // Ensure RTL for each option
                            ))}
                        </select>

                      </div>




                      {index === formData.specialties.length - 1 && (
                        <div className="flex w-full mt-3">
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
                            <div className='flex w-full flex-row'>

                              <button
                                type="button"
                                onClick={handleRemoveSpecialty}
                                className="bg-red-500  hover:bg-red-700 text-white py-2 px-4 rounded font-droid-arabic-kufi"
                              >
                                إزالة التخصص
                              </button>

                            </div>
                          )}
                        </div>
                      )}

                    </div>


                  </div>
                ))}

                <div className="flex items-center justify-center">
                  <button
                    type="submit"
                    // disabled={!isFormValid}
                    className="text-white bg-[#2F3645] hover:bg-[#131842] focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-lg px-8 py-3 text-center font-droid-arabic-kufi"
                  >
                    إحجز موعدك
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisterVisit;
