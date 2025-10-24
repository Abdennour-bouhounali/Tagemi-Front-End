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
    <div className="container mx-auto py-10 px-4">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-droid-arabic-kufi font-bold">إضافة عدة مواعيد</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Select Specialty at top */}
        <div className="mb-6">
          <label className="block mb-2 font-bold">اختر التخصص لجميع المواعيد:</label>
          <select
            value={selectedSpecialty}
            onChange={(e) => setSelectedSpecialty(e.target.value)}
            className="p-2 h-10 border rounded w-full"
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
            className="p-6 bg-white rounded-lg shadow-lg border border-gray-200 space-y-4 hover:shadow-xl transition"
          >
            <h3 className="font-bold text-xl mb-4">موعد #{idx + 1}</h3>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <input
                type="text"
                placeholder="الإسم"
                value={app.name}
                onChange={(e) => handleChange(idx, "name", e.target.value)}
                className="p-2 h-10 border rounded w-full"
                required
              />
              <input
                type="text"
                placeholder="اللقب"
                value={app.lastName}
                onChange={(e) => handleChange(idx, "lastName", e.target.value)}
                className="p-2 h-10 border rounded w-full"
                required
              />
              <select
                value={app.residence}
                onChange={(e) => handleChange(idx, "residence", e.target.value)}
                className="p-2 h-10 border rounded w-full"
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
                className="p-2 h-10 border rounded w-full"
                required
              />
              <select
                value={app.sex}
                onChange={(e) => handleChange(idx, "sex", e.target.value)}
                className="p-2 h-10 border rounded w-full"
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
                className="p-2 h-10 border rounded w-full"
              />
              <div /> {/* empty placeholder for grid alignment */}
            </div>

            {appointments.length > 1 && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => removeForm(idx)}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition"
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
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded transition"
          >
            + إضافة نموذج
          </button>
          <button
            type="submit"
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded transition"
          >
            إرسال جميع المواعيد
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddMultipleAppointments;
