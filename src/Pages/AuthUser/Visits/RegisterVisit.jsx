import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../../Context/AppContext';
import logo from './tagemi_logo.png';
import { useTranslation } from 'react-i18next';
import BirthdayInput from '../SuperAdmin/Components/BirthdayInput';

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
  const [confirm, setConfirm] = useState(false);
  const [confirmafter, setConfirmAfter] = useState(false);
  const [acceptedRules, setAcceptedRules] = useState(false);
  const [isArabic, setIsArabic] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');
  const [Event, setEvent] = useState(undefined); // undefined = loading, null = no event, object = event exists

  const [formData, setFormData] = useState({
    name: '',
    lastName: '',
    birthday: '',
    residence: '',
    diseases: '',
    phone: '',
    sex: '',
    specialties: [{ specialty_id: '' }],
  });

  // ✅ Improved getEvent with 404 handling
  async function getEvent() {
    try {
      const res = await fetch(`${apiUrl}/api/currentEvent`);
      if (res.status === 404) {
        setEvent(null);
        return;
      }
      if (!res.ok) throw new Error('Server error');
      const data = await res.json();
      setEvent(data['event']);
    } catch (error) {
      console.error('Error fetching event:', error);
      setEvent(null);
    }
  }

  useEffect(() => {
    getEvent();
  }, []);

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
    const openSpecialities = data['specialties'].filter(
      (s) => s.id !== 6 && s.Flag !== 'Closed' && s.is_active === 1
    );
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
      index === i
        ? { ...specialty, [event.target.name]: event.target.value }
        : specialty
    );
    setFormData({ ...formData, specialties: updatedSpecialties });
  };

  const handleChangeData = (e) => {
    const { name, value } = e.target;
    const arabicRegex = /^[\u0621-\u064A\u0660-\u0669\s]*$/;

    if (name === 'name' || name === 'lastName') {
      if (arabicRegex.test(value)) {
        setFormData({ ...formData, [name]: value });
        setIsArabic(true);
        setValidationMessage('');
      } else {
        setIsArabic(false);
        setValidationMessage('يرجى إدخال أحرف عربية فقط');
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
      setIsArabic(true);
      setValidationMessage('');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const res = await fetch(`${apiUrl}/api/appointment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      setConfirmAfter(true);

      if (res.ok) {
        setAppointments(data['appointments'] || []);
        setMinTime(data['minTime']);
        getSpecialities();
        setFormData({
          name: '',
          lastName: '',
          birthday: '',
          residence: '',
          diseases: '',
          phone: '',
          sex: '',
          specialties: [{ specialty_id: '' }],
        });
        setMessage(data['message'] || 'تم إرسال البيانات بنجاح.');
        setWaiting(data['waitinglist_message'] || '');
      } else {
        setMessage(data['message'] || 'حدث خطأ أثناء إرسال الطلب.');
        setAppointments([]);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setMessage('حدث خطأ في الاتصال بالخادم.');
    }
  };

  const isFormValid =
    formData.name &&
    formData.birthday &&
    formData.residence &&
    formData.sex &&
    formData.specialties.every((s) => s.specialty_id);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Show loading while waiting for event */}
      {Event === undefined ? (
        <div className="text-center text-gray-500 font-droid-arabic-kufi">
          جاري التحميل...
        </div>
      ) : Event === null ? (
        // ✅ Show this when no event exists
        <div
          className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md text-center"
          dir="rtl"
        >
          <img
            src={logo}
            alt="Logo"
            className="h-24 mx-auto mb-4 opacity-80"
          />
          <h2 className="text-2xl font-bold text-[#131842] font-droid-arabic-kufi mb-2">
            🚫 لا يوجد حدث حالي
          </h2>
          <p className="text-gray-600 font-droid-arabic-kufi mb-4">
            لا توجد حالياً فعاليات طبية مفتوحة للحجز.
            <br />
            يرجى العودة لاحقاً أو متابعة صفحتنا الرسمية لمعرفة مواعيد الأحداث
            القادمة.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#2F3645] hover:bg-[#131842] text-white px-6 py-3 rounded-lg font-droid-arabic-kufi transition"
          >
            تحديث الصفحة 🔄
          </button>
        </div>
      ) : (
        // ✅ Event exists → keep your normal behavior
        <>
          {!confirm && (
            <div
              className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md"
              dir="rtl"
            >
              <h1 className="text-center text-2xl font-bold text-[#131842] font-droid-arabic-kufi mb-4">
                ضوابط نظام الفحوصات الطبية
              </h1>
              <ul className="list-disc list-inside mb-4 text-gray-700 space-y-2">
                {rules.map((rule) => (
                  <li
                    key={rule.id}
                    className={`font-droid-arabic-kufi font-bold ${
                      rule.id === 1 ? 'text-red-500' : ''
                    }`}
                  >
                    {rule.rule}
                  </li>
                ))}
              </ul>
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="acceptRules"
                  className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                  onChange={(e) => setAcceptedRules(e.target.checked)}
                />
                <label
                  htmlFor="acceptRules"
                  className="mr-2 text-gray-700 font-droid-arabic-kufi"
                >
                  أوافق على الضوابط
                </label>
              </div>
              <button
                disabled={!acceptedRules}
                onClick={() => setConfirm(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-droid-arabic-kufi"
              >
                تأكيد
              </button>
            </div>
          )}

          {confirm && (
            <div
              className="bg-white rounded-xl shadow-lg p-6 w-full max-w-lg mx-auto"
              dir="rtl"
            >
              {confirmafter && message && (
                <div className="bg-[#EEEDEB] border border-green-300 p-4 rounded-lg text-center mb-6">
                  {waiting && (
                    <p className="font-droid-arabic-kufi font-medium mb-2">
                      أنت في قائمة الإنتظار في هذه التخصصات: {waiting}
                    </p>
                  )}
                  <p className="font-droid-arabic-kufi font-black text-red-500 mb-2">
                    {message}
                  </p>
                  <p className="font-droid-arabic-kufi font-bold text-red-500 mb-2">
                    بالنسبة للنساء يجب الحضور بمحرم
                  </p>
                  <button
                    onClick={() => setConfirmAfter(false)}
                    className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg font-droid-arabic-kufi"
                  >
                    تأكيد
                  </button>
                </div>
              )}

              {!confirmafter && (
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="text-center mb-4">
                    <img
                      src={logo}
                      alt="Logo"
                      className="h-24 mx-auto mb-2"
                    />
                    <h1 className="text-xl md:text-2xl font-extrabold font-droid-arabic-kufi text-[#2F3645]">
                      {Event?.name}
                    </h1>
                    <p className="text-gray-600 font-droid-arabic-kufi">
                      {Event?.date} | {Event?.place}
                    </p>
                    <p className="font-droid-arabic-kufi mt-2">
                      أحجز موعدا مع الطبيب
                    </p>
                  </div>

                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChangeData}
                    placeholder="الإسم"
                    required
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-300 font-droid-arabic-kufi"
                  />
                  {!isArabic && formData.name && (
                    <p className="text-red-500 text-sm font-droid-arabic-kufi">
                      {validationMessage}
                    </p>
                  )}

                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChangeData}
                    placeholder="اللقب"
                    required
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-300 font-droid-arabic-kufi"
                  />
                  {!isArabic && formData.lastName && (
                    <p className="text-red-500 text-sm font-droid-arabic-kufi">
                      {validationMessage}
                    </p>
                  )}

                  <BirthdayInput
                    value={formData.birthday}
                    onChange={(date) =>
                      setFormData({ ...formData, birthday: date })
                    }
                  />

<select
  name="residence"
  value={formData.residence}
  onChange={handleChangeData}
  required
  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-300 font-droid-arabic-kufi"
>
  {/* ---- TAWAT local options ---- */}
  {Event?.type === 'TAWAT' && (
    <>
      <option value="">قصر الإنتماء</option>
      <option value="Tajnint">تجنينت</option>
      <option value="Bonora">آت بونور</option>
      <option value="Taghardait">تغردايت</option>
      <option value="Yazgan">آت يزجن</option>
      <option value="Mlichat">آت مليشت</option>
      <option value="Karara">إقرارن</option>
      <option value="Berian">آت برقان</option>
      <option value="Warjlan">وارجلان</option>
    </>
  )}

  {/* ---- National event: 58 wilayas ---- */}
  {Event?.type === 'National' && (
    <>
      <option value="">اختر ولايتك</option>
      <option value="Adrar">أدرار - 01</option>
      <option value="Chlef">الشلف - 02</option>
      <option value="Laghouat">الأغواط - 03</option>
      <option value="Oum El Bouaghi">أم البواقي - 04</option>
      <option value="Batna">باتنة - 05</option>
      <option value="Béjaïa">بجاية - 06</option>
      <option value="Biskra">بسكرة - 07</option>
      <option value="Béchar">بشار - 08</option>
      <option value="Blida">البليدة - 09</option>
      <option value="Bouira">البويرة - 10</option>
      <option value="Tamanrasset">تمنراست - 11</option>
      <option value="Tébessa">تبسة - 12</option>
      <option value="Tlemcen">تلمسان - 13</option>
      <option value="Tiaret">تيارت - 14</option>
      <option value="Tizi Ouzou">تيزي وزو - 15</option>
      <option value="Alger">الجزائر - 16</option>
      <option value="Djelfa">الجلفة - 17</option>
      <option value="Jijel">جيجل - 18</option>
      <option value="Sétif">سطيف - 19</option>
      <option value="Saïda">سعيدة - 20</option>
      <option value="Skikda">سكيكدة - 21</option>
      <option value="Sidi Bel Abbès">سيدي بلعباس - 22</option>
      <option value="Annaba">عنابة - 23</option>
      <option value="Guelma">قالمة - 24</option>
      <option value="Constantine">قسنطينة - 25</option>
      <option value="Médéa">المدية - 26</option>
      <option value="Mostaganem">مستغانم - 27</option>
      <option value="M'Sila">المسيلة - 28</option>
      <option value="Mascara">معسكر - 29</option>
      <option value="Ouargla">ورقلة - 30</option>
      <option value="Oran">وهران - 31</option>
      <option value="El Bayadh">البيض - 32</option>
      <option value="Illizi">إليزي - 33</option>
      <option value="Bordj Bou Arreridj">برج بوعريريج - 34</option>
      <option value="Boumerdès">بومرداس - 35</option>
      <option value="El Tarf">الطارف - 36</option>
      <option value="Tindouf">تندوف - 37</option>
      <option value="Tissemsilt">تيسمسيلت - 38</option>
      <option value="El Oued">الوادي - 39</option>
      <option value="Khenchela">خنشلة - 40</option>
      <option value="Souk Ahras">سوق أهراس - 41</option>
      <option value="Tipaza">تيبازة - 42</option>
      <option value="Mila">ميلة - 43</option>
      <option value="Aïn Defla">عين الدفلى - 44</option>
      <option value="Naâma">النعامة - 45</option>
      <option value="Aïn Témouchent">عين تموشنت - 46</option>
      <option value="Ghardaïa">غرداية - 47</option>
      <option value="Relizane">غليزان - 48</option>
      <option value="Timimoun">تيميمون - 49</option>
      <option value="Bordj Badji Mokhtar">برج باجي مختار - 50</option>
      <option value="Ouled Djellal">أولاد جلال - 51</option>
      <option value="Béni Abbès">بني عباس - 52</option>
      <option value="In Salah">عين صالح - 53</option>
      <option value="In Guezzam">عين قزّام - 54</option>
      <option value="Touggourt">توقرت - 55</option>
      <option value="Djanet">جانت - 56</option>
      <option value="El M'Ghair">المغير - 57</option>
      <option value="El Meniaa">المنيعة - 58</option>
    </>
  )}
</select>



                  <input
                    type="text"
                    name="diseases"
                    value={formData.diseases}
                    onChange={handleChangeData}
                    placeholder="يرجى ذكر الأمراض المزمنة إن وجدت"
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-300 font-droid-arabic-kufi"
                  />

                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChangeData}
                    placeholder="أدخل رقم هاتف الواتساب"
                    required
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-300 font-droid-arabic-kufi"
                    dir="rtl"
                  />

                  <select
                    name="sex"
                    value={formData.sex}
                    onChange={handleChangeData}
                    required
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-300 font-droid-arabic-kufi"
                  >
                    <option value="">اختر الجنس</option>
                    <option value="0">ذكر</option>
                    <option value="1">أنثى</option>
                  </select>

                  {formData.specialties.map((specialty, index) => (
                    <div key={index} className="flex flex-col space-y-2">
                      <select
                        name="specialty_id"
                        value={specialty.specialty_id}
                        onChange={(e) => handleChange(index, e)}
                        required
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-300 font-droid-arabic-kufi"
                      >
                        <option value="">إختر تخصصا</option>
                        {specialities
                          .filter(
                            (s) =>
                              s.id !== 6 &&
                              s.Flag !== 'Closed' &&
                              s.is_active === 1
                          )
                          .map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name === 'طب الأسنان'
                                ? 'طب الأسنان ( فحص و استشارة)'
                                : s.name}
                            </option>
                          ))}
                      </select>
                      <div className="flex space-x-2 justify-end">
                        {formData.specialties.length < 2 &&
                          openSpecialitiesCount > 1 && (
                            <button
                              type="button"
                              onClick={handleAddSpecialty}
                              className="bg-green-500 hover:bg-green-700 text-white px-4 py-2 rounded font-droid-arabic-kufi"
                            >
                              أضف تخصص آخر
                            </button>
                          )}
                        {formData.specialties.length > 1 && (
                          <button
                            type="button"
                            onClick={handleRemoveSpecialty}
                            className="bg-red-500 hover:bg-red-700 text-white px-4 py-2 rounded font-droid-arabic-kufi"
                          >
                            إزالة التخصص
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  <button
                    type="submit"
                    className="w-full bg-[#2F3645] hover:bg-[#131842] text-white py-3 rounded-lg font-droid-arabic-kufi"
                  >
                    إحجز موعدك
                  </button>
                </form>


              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RegisterVisit;
