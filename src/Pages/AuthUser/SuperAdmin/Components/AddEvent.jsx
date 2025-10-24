import { useState, useContext } from "react";
import { AppContext } from "../../../../Context/AppContext";


const apiUrl = import.meta.env.VITE_API_URL;

export default function AddEvent({getEvents}) {
  const { token } = useContext(AppContext);
  const [form, setForm] = useState({
    name: "",
    date: "",
    place: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`${apiUrl}/api/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (res.ok) {
        getEvents();
        setMessage("✅ تم إضافة الحدث بنجاح");
        setForm({ name: "", date: "", place: "", description: "" });
      } else {
        setMessage("❌ حدث خطأ أثناء الإضافة");
      }
    } catch (err) {
      setMessage("❌ خطأ في الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl shadow-lg p-6 border font-droid-arabic-kufi border-gray-200 w-full max-w-2xl"
    >
      <div className="grid grid-cols-1 gap-4">
        <input
          type="text"
          name="name"
          placeholder="اسم الحدث"
          value={form.name}
          onChange={handleChange}
          className="p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          required
        />

        <input
          type="date"
          name="date"
          value={form.date}
          onChange={handleChange}
          className="p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          required
        />

        <input
          type="text"
          name="place"
          placeholder="المكان"
          value={form.place}
          onChange={handleChange}
          className="p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          required
        />

        <textarea
          name="description"
          placeholder="الوصف"
          value={form.description}
          onChange={handleChange}
          rows="3"
          className="p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
        ></textarea>

        <button
          type="submit"
          disabled={loading}
          className="bg-indigo-600 text-white font-bold py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
        >
          {loading ? "جارٍ الإضافة..." : "إضافة الحدث"}
        </button>

        {message && (
          <p className="text-center font-semibold mt-2 text-gray-700">
            {message}
          </p>
        )}
      </div>
    </form>
  );
}
