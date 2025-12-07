import { useContext, useState } from "react";
import { AppContext } from "../../../../Context/AppContext";
import { API_BASE_URL } from '../../../../config/environment';
import { Loader2, CheckCircle, Plus } from "lucide-react";

const apiUrl = API_BASE_URL;

export default function AddSpecialty({ getSpecialites }) {
  const { token } = useContext(AppContext);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!name.trim()) {
      setMessage("❌ الرجاء إدخال اسم التخصص");
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("");
    setMessageType(null);

    try {
      const res = await fetch(`${apiUrl}/api/specialty`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: name.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(data.message);
        setMessageType("success");
        setName("");
        getSpecialites();

        setTimeout(() => {
          setMessage("");
          setMessageType(null);
        }, 3000);
      } else {
        const errorMsg = data.message || "حدث خطأ أثناء الإضافة";
        const errors = data.errors;

        if (errors) {
          const firstError = Object.values(errors)[0][0];
          setMessage(firstError);
        } else {
          setMessage(errorMsg);
        }
        setMessageType("error");
      }
    } catch (error) {
      console.error("Error adding specialty:", error);
      setMessage("خطأ في الاتصال بالخادم");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-indigo-100 p-3 rounded-full">
          <Plus className="text-indigo-600" size={24} />
        </div>
        <h3 className="text-2xl font-bold text-gray-800 font-droid-arabic-kufi">
          إضافة تخصص جديد
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="specialty-name"
            className="block text-sm font-semibold mb-2 text-gray-700 font-droid-arabic-kufi"
          >
            اسم التخصص <span className="text-red-500">*</span>
          </label>
          <input
            id="specialty-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="مثال: القلب، العظام، الأطفال، الجلدية..."
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-droid-arabic-kufi transition"
            required
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-droid-arabic-kufi shadow-md"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              جاري الإضافة...
            </>
          ) : (
            <>
              <CheckCircle size={20} />
              إضافة التخصص
            </>
          )}
        </button>

        {message && (
          <div
            className={`p-4 rounded-lg font-droid-arabic-kufi font-semibold animate-slide-in ${
              messageType === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {message}
          </div>
        )}
      </form>

      <style>{`
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}