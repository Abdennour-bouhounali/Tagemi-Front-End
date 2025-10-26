import React, { useState, useContext, useEffect } from "react";
import { AppContext } from "../../../Context/AppContext";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import BirthdayInput from "./Components/BirthdayInput";
const apiUrl = import.meta.env.VITE_API_URL;

const AddMultipleAppointments = () => {
  const { token } = useContext(AppContext);
  const [specialities, setSpecialities] = useState([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [appointments, setAppointments] = useState([
    {
      name: "",
      lastName: "",
      birthday: "",
      residence: "",
      diseases: "",
      phone: "",
      sex: "",
    },
  ]);
    const [Event, setEvent] = useState(null);

    async function getEvent() {
        const res = await fetch(`${apiUrl}/api/currentEvent`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setEvent(data["event"]);
        }

        useEffect(() => {
        getEvent();
        }, []);

  // Fetch specialties
  useEffect(() => {
    async function fetchSpecialities() {
      const res = await fetch(`${apiUrl}/api/specialty`, {
        headers: {
  "Content-Type": "application/json",
  "Accept": "application/json",
  Authorization: `Bearer ${token}`,
}
,
      });
      const data = await res.json();
      setSpecialities(
        data["specialties"].filter(
          (s) => s.id !== 6 && s.Flag !== "Closed" && s.is_active === 1
        )
      );
    }
    fetchSpecialities();
  }, []);

  const handleChange = (index, field, value) => {
    const updated = [...appointments];
    updated[index][field] = value;
    setAppointments(updated);
  };

  const addForm = () => {
    setAppointments([
      ...appointments,
      {
        name: "",
        lastName: "",
        birthday: "",
        residence: "",
        diseases: "",
        phone: "",
        sex: "",
      },
    ]);
  };

  const removeForm = (index) => {
    setAppointments(appointments.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSpecialty) {
      alert("يرجى اختيار التخصص أولاً!");
      return;
    }

    // Attach the selected specialty to all appointments
    const body = {
    event_id: Event.id,
    specialty_id: selectedSpecialty, // <--- send the selected specialty here
    appointments: appointments.map(app => ({
        name: app.name,
        lastName: app.lastName,
        birthday: app.birthday,
        residence: app.residence,
        diseases: app.diseases,
        phone: app.phone,
        sex: app.sex
    }))
    };

    try {
      const res = await fetch(`${apiUrl}/api/appointments/add-multiple`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
        });

      const data = await res.json();
      if (res.ok) {
        alert("تم إضافة المواعيد بنجاح!");
        setAppointments([
          {
            name: "",
            lastName: "",
            birthday: "",
            residence: "",
            diseases: "",
            phone: "",
            sex: "",
          },
        ]);
        setSelectedSpecialty("");
      } else {
        alert(JSON.stringify(data.errors || data.message));
      }
    } catch (err) {
      console.error(err);
      alert("حدث خطأ ما.");
    }
  };

  return (
<div className="w-full max-w-7xl bg-white rounded-2xl shadow-lg p-8 mb-10">
  <div className="text-center mb-8">
    <h2 className="text-3xl font-bold font-droid-arabic-kufi text-blue-900">
      إضافة عدة مواعيد
    </h2>
    {Event && (
      <p className="mt-2 text-gray-600 font-droid-arabic-kufi">
        الحدث الحالي: <span className="font-semibold">{Event.name}</span>
      </p>
    )}
  </div>

  <form onSubmit={handleSubmit} className="space-y-6">
    {/* Select Specialty */}
    <div className="mb-6">
      <label className="block mb-2 font-semibold text-gray-700 font-droid-arabic-kufi">
        اختر التخصص لجميع المواعيد:
      </label>
      <select
        value={selectedSpecialty}
        onChange={(e) => setSelectedSpecialty(e.target.value)}
        className="p-3 h-12 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-300 focus:outline-none"
        required
      >
        <option value="">اختر تخصصاً</option>
        {specialities.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
    </div>

    {appointments.map((app, idx) => (
      <div
        key={idx}
        className="p-6 bg-blue-50 rounded-xl shadow-inner border border-blue-100 hover:shadow-lg transition"
      >
        <h3 className="font-bold text-xl mb-4 text-blue-800">موعد #{idx + 1}</h3>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-4">
          <input
            type="text"
            placeholder="الإسم"
            value={app.name}
            onChange={(e) => handleChange(idx, "name", e.target.value)}
            className="p-3 h-12 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-200 focus:outline-none"
            required
          />
          <input
            type="text"
            placeholder="اللقب"
            value={app.lastName}
            onChange={(e) => handleChange(idx, "lastName", e.target.value)}
            className="p-3 h-12 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-200 focus:outline-none"
            required
          />
          <select
            value={app.residence}
            onChange={(e) => handleChange(idx, "residence", e.target.value)}
            className="p-3 h-12 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-200 focus:outline-none"
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
          <BirthdayInput
            value={app.birthday}
            onChange={(date) => handleChange(idx, "birthday", date)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <input
            type="tel"
            placeholder="رقم الهاتف"
            value={app.phone}
            onChange={(e) => handleChange(idx, "phone", e.target.value)}
            className="p-3 h-12 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-200 focus:outline-none"
            required
          />
          <select
            value={app.sex}
            onChange={(e) => handleChange(idx, "sex", e.target.value)}
            className="p-3 h-12 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-200 focus:outline-none"
            required
          >
            <option value="">اختر الجنس</option>
            <option value="0">ذكر</option>
            <option value="1">أنثى</option>
          </select>
          <input
            type="text"
            placeholder="الأمراض"
            value={app.diseases}
            onChange={(e) => handleChange(idx, "diseases", e.target.value)}
            className="p-3 h-12 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-200 focus:outline-none"
          />
          <div /> {/* Placeholder for grid alignment */}
        </div>

        {appointments.length > 1 && (
          <div className="flex justify-end mt-4">
            <button
              type="button"
              onClick={() => removeForm(idx)}
              className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-lg transition"
            >
              إزالة
            </button>
          </div>
        )}
      </div>
    ))}

    <div className="flex flex-col sm:flex-row justify-between gap-4 mt-6">
      <button
        type="button"
        onClick={addForm}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition font-droid-arabic-kufi"
      >
        + إضافة نموذج
      </button>
      <button
        type="submit"
        className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition font-droid-arabic-kufi"
      >
        إرسال جميع المواعيد
      </button>
    </div>
  </form>
</div>

  );
};

export default AddMultipleAppointments;
