import { useContext, useState } from "react";
import { AppContext } from "../../../../Context/AppContext";
import { API_BASE_URL } from '../../../../config/environment';
import { Edit, X, Save, Loader2 } from "lucide-react";

const apiUrl = API_BASE_URL;

const SpecialityTable = ({ specialities, getSpecialites }) => {
  const { token } = useContext(AppContext);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [loading, setLoading] = useState({});
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  // Start editing
  const handleEdit = (specialty) => {
    setEditingId(specialty.id);
    setEditName(specialty.name);
  };

  // Cancel editing
  const handleCancel = () => {
    setEditingId(null);
    setEditName("");
  };

  // Save edit
  const handleSave = async (specialtyId) => {
    if (!editName.trim()) {
      setMessage("الرجاء إدخال اسم التخصص");
      setMessageType("error");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    setLoading((prev) => ({ ...prev, [specialtyId]: true }));

    try {
      const res = await fetch(`${apiUrl}/api/specialty/${specialtyId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: editName.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(data.message);
        setMessageType("success");
        setEditingId(null);
        setEditName("");
        getSpecialites();
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage(data.message || "حدث خطأ أثناء التعديل");
        setMessageType("error");
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (error) {
      console.error("Error updating specialty:", error);
      setMessage("خطأ في الاتصال بالخادم");
      setMessageType("error");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setLoading((prev) => ({ ...prev, [specialtyId]: false }));
    }
  };

  // Delete specialty
  const handleDelete = async (specialtyId, specialtyName) => {
    if (
      !window.confirm(
        `هل أنت متأكد من حذف تخصص "${specialtyName}"؟\n\nتنبيه: سيتم حذف جميع البيانات المرتبطة بهذا التخصص.`
      )
    ) {
      return;
    }

    setLoading((prev) => ({ ...prev, [specialtyId]: true }));

    try {
      const res = await fetch(`${apiUrl}/api/specialty/${specialtyId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(data.message);
        setMessageType("success");
        getSpecialites();
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage(data.message || "حدث خطأ أثناء الحذف");
        setMessageType("error");
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (error) {
      console.error("Error deleting specialty:", error);
      setMessage("خطأ في الاتصال بالخادم");
      setMessageType("error");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setLoading((prev) => ({ ...prev, [specialtyId]: false }));
    }
  };

  const filteredSpecialties = specialities.filter(
    (s) => s.name !== "NoSpeciality"
  );

  return (
    <div className="p-6">
      {message && (
        <div
          className={`mb-4 p-4 rounded-lg font-droid-arabic-kufi font-semibold animate-slide-in ${
            messageType === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message}
        </div>
      )}

      {filteredSpecialties.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 font-droid-arabic-kufi text-lg">
            لا توجد تخصصات حالياً
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gray-100 to-gray-200">
                <th className="px-6 py-4 text-right font-bold text-gray-800 font-droid-arabic-kufi">
                  #
                </th>
                <th className="px-6 py-4 text-right font-bold text-gray-800 font-droid-arabic-kufi">
                  اسم التخصص
                </th>
                <th className="px-6 py-4 text-center font-bold text-gray-800 font-droid-arabic-kufi">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredSpecialties.map((specialty, index) => (
                <tr
                  key={specialty.id}
                  className="border-b hover:bg-gray-50 transition"
                >
                  <td className="px-6 py-4 font-droid-arabic-kufi text-gray-700">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4">
                    {editingId === specialty.id ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full p-2 border-2 border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-droid-arabic-kufi"
                        autoFocus
                      />
                    ) : (
                      <span className="font-droid-arabic-kufi font-semibold text-gray-800">
                        {specialty.name}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      {editingId === specialty.id ? (
                        <>
                          <button
                            onClick={() => handleSave(specialty.id)}
                            disabled={loading[specialty.id]}
                            className="flex items-center gap-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-droid-arabic-kufi transition disabled:opacity-50"
                          >
                            {loading[specialty.id] ? (
                              <Loader2 className="animate-spin" size={16} />
                            ) : (
                              <Save size={16} />
                            )}
                            حفظ
                          </button>
                          <button
                            onClick={handleCancel}
                            className="flex items-center gap-1 px-4 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded-lg font-droid-arabic-kufi transition"
                          >
                            <X size={16} />
                            إلغاء
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEdit(specialty)}
                            disabled={loading[specialty.id]}
                            className="flex items-center gap-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-droid-arabic-kufi transition disabled:opacity-50"
                          >
                            <Edit size={16} />
                            تعديل
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
};

export default SpecialityTable;