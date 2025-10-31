import { useContext, useEffect, useState } from "react";
import { AppContext } from "../../../../Context/AppContext";
import { Copy, Eye, EyeOff, Trash2, RotateCcw, Download, Loader2 } from "lucide-react";

const apiUrl = import.meta.env.VITE_API_URL;

export default function EventAdminsManager({ eventId, eventName, onRefresh }) {
  const { token } = useContext(AppContext);
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState({});
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);

  useEffect(() => {
    if (eventId) {
      fetchCredentials();
    }
  }, [eventId]);

  async function fetchCredentials() {
    setLoading(true);
    try {
      const res = await fetch(
        `${apiUrl}/api/events/${eventId}/admins/credentials`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await res.json();
      if (res.ok) {
        setCredentials(data.credentials || []);
        if (data.credentials.length === 0) {
          setMessage("لم يتم العثور على بيانات مسؤولين");
          setMessageType("info");
        }
      } else {
        setMessage(data.message || "فشل تحميل بيانات المسؤولين");
        setMessageType("error");
      }
    } catch (error) {
      console.error("Error fetching credentials:", error);
      setMessage("خطأ في الاتصال بالخادم");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword() {
    const newPassword = prompt("أدخل كلمة المرور الجديدة للمسؤولين الثلاثة:");
    if (!newPassword || newPassword.length < 6) {
      setMessage("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      setMessageType("error");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `${apiUrl}/api/events/${eventId}/reset-passwords`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ new_password: newPassword }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        setMessage(`✅ تم تحديث ${data.updated_admins_count} حساب بنجاح`);
        setMessageType("success");
        setTimeout(() => {
          fetchCredentials();
          setMessage("");
        }, 1500);
      } else {
        setMessage(data.message || "فشل تحديث كلمات المرور");
        setMessageType("error");
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      setMessage("خطأ في الاتصال بالخادم");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteAdmins() {
    if (
      !window.confirm(
        "هل أنت متأكد من حذف المسؤولين الثلاثة؟ لا يمكن التراجع عن هذا الإجراء"
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `${apiUrl}/api/events/${eventId}/admins`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await res.json();
      if (res.ok) {
        setMessage(`✅ تم حذف ${data.deleted_admins_count} حساب بنجاح`);
        setMessageType("success");
        setCredentials([]);
        if (onRefresh) onRefresh();
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage(data.message || "فشل حذف المسؤولين");
        setMessageType("error");
      }
    } catch (error) {
      console.error("Error deleting admins:", error);
      setMessage("خطأ في الاتصال بالخادم");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard(text, index) {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  }

  function togglePasswordVisibility(index) {
    setShowPassword((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  }

  function downloadCredentials() {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "النوع,التخصص,الاسم,البريد الإلكتروني,كلمة المرور\n";

    credentials.forEach((cred) => {
      const row = [cred.type, cred.specialty, cred.name, cred.email, cred.password]
        .map((cell) => `"${cell}"`)
        .join(",");
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${eventName}_credentials.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  if (loading && credentials.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <Loader2 className="animate-spin mx-auto mb-4" size={40} />
        <p className="text-gray-600 font-droid-arabic-kufi">
          جاري تحميل بيانات المسؤولين الثلاثة...
        </p>
      </div>
    );
  }

  if (credentials.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <p className="text-gray-600 font-droid-arabic-kufi">
          لم يتم العثور على بيانات مسؤولين
        </p>
      </div>
    );
  }

  // Group credentials by type for better display
  const specialAdmin = credentials.find(c => c.type === 'Special Admin');
  const recipientAdmin = credentials.find(c => c.type === 'Recipient Admin');
  const checkAdmin = credentials.find(c => c.type === 'Check Admin');

  const AdminCard = ({ admin, index, bgColor, textColor, borderColor }) => (
    <div className={`bg-white rounded-lg p-4 border-l-4 ${borderColor} shadow-md`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className={`font-bold text-lg ${textColor} font-droid-arabic-kufi`}>
          {admin.type}
        </h3>
        <span className={`text-xs ${bgColor} px-3 py-1 rounded-full font-droid-arabic-kufi`}>
          {admin.specialty}
        </span>
      </div>
      
      <div className="space-y-3 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-gray-600 font-droid-arabic-kufi">الاسم:</span>
          <span className="font-mono font-semibold">{admin.name}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-600 font-droid-arabic-kufi">البريد:</span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded max-w-xs truncate">
              {admin.email}
            </span>
            <button
              onClick={() => copyToClipboard(admin.email, `email-${index}`)}
              className="text-blue-600 hover:text-blue-800 transition flex-shrink-0"
              title="نسخ البريد"
            >
              {copiedIndex === `email-${index}` ? (
                <span className="text-xs text-green-600">✓</span>
              ) : (
                <Copy size={16} />
              )}
            </button>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-600 font-droid-arabic-kufi">كلمة المرور:</span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
              {showPassword[index]
                ? admin.password
                : "•".repeat(admin.password ? admin.password.length : 8)}
            </span>
            <button
              onClick={() => togglePasswordVisibility(index)}
              className="text-gray-600 hover:text-gray-800 transition flex-shrink-0"
              title="إظهار/إخفاء"
            >
              {showPassword[index] ? (
                <EyeOff size={16} />
              ) : (
                <Eye size={16} />
              )}
            </button>
            <button
              onClick={() => copyToClipboard(admin.password, `pass-${index}`)}
              className="text-blue-600 hover:text-blue-800 transition flex-shrink-0"
              title="نسخ كلمة المرور"
            >
              {copiedIndex === `pass-${index}` ? (
                <span className="text-xs text-green-600">✓</span>
              ) : (
                <Copy size={16} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
      {/* Header with buttons */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-gray-800 font-droid-arabic-kufi">
          المسؤولين الثلاثة للحدث
        </h3>
        <div className="flex gap-2">
          <button
            onClick={downloadCredentials}
            disabled={loading}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50 font-droid-arabic-kufi text-sm"
            title="تحميل بيانات المسؤولين"
          >
            <Download size={18} />
            تحميل CSV
          </button>
          <button
            onClick={handleResetPassword}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50 font-droid-arabic-kufi text-sm"
            title="تحديث كلمات المرور"
          >
            <RotateCcw size={18} />
            تحديث كلمات
          </button>
          <button
            onClick={handleDeleteAdmins}
            disabled={loading}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50 font-droid-arabic-kufi text-sm"
            title="حذف جميع المسؤولين"
          >
            <Trash2 size={18} />
            حذف الكل
          </button>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-lg font-droid-arabic-kufi text-sm ${
            messageType === "success"
              ? "bg-green-100 text-green-800 border border-green-400"
              : messageType === "error"
              ? "bg-red-100 text-red-800 border border-red-400"
              : "bg-blue-100 text-blue-800 border border-blue-400"
          }`}
        >
          {message}
        </div>
      )}

      {/* Admin Cards Display */}
      <div className="space-y-4 mb-6">
        {specialAdmin && (
          <AdminCard 
            admin={specialAdmin} 
            index={0}
            bgColor="bg-blue-100 text-blue-700"
            textColor="text-blue-700"
            borderColor="border-blue-500"
          />
        )}
        
        {recipientAdmin && (
          <AdminCard 
            admin={recipientAdmin} 
            index={1}
            bgColor="bg-green-100 text-green-700"
            textColor="text-green-700"
            borderColor="border-green-500"
          />
        )}
        
        {checkAdmin && (
          <AdminCard 
            admin={checkAdmin} 
            index={2}
            bgColor="bg-purple-100 text-purple-700"
            textColor="text-purple-700"
            borderColor="border-purple-500"
          />
        )}
      </div>

      {/* Table view as alternative */}
      <div className="mb-6 border-t pt-6">
        <h4 className="text-lg font-bold text-gray-800 font-droid-arabic-kufi mb-4">
          عرض جدول
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 border-b-2">
              <tr>
                <th className="px-4 py-3 text-right font-droid-arabic-kufi text-xs">النوع</th>
                <th className="px-4 py-3 text-right font-droid-arabic-kufi text-xs">الاسم</th>
                <th className="px-4 py-3 text-right font-droid-arabic-kufi text-xs">البريد</th>
                <th className="px-4 py-3 text-right font-droid-arabic-kufi text-xs">كلمة المرور</th>
              </tr>
            </thead>
            <tbody>
              {credentials.map((cred, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-droid-arabic-kufi text-xs">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      cred.type === "Check Admin"
                        ? "bg-purple-100 text-purple-800"
                        : cred.type === "Special Admin"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-green-100 text-green-800"
                    }`}>
                      {cred.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-droid-arabic-kufi text-xs font-semibold">{cred.name}</td>
                  <td className="px-4 py-3 text-xs">
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded truncate block max-w-xs">
                      {cred.email}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                      {showPassword[index]
                        ? cred.password
                        : "•".repeat(cred.password ? cred.password.length : 8)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Security Note */}
      <div className="p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded font-droid-arabic-kufi">
        <p className="text-yellow-800 text-sm font-bold mb-2">
          ⚠️ ملاحظة أمنية مهمة:
        </p>
        <ul className="text-yellow-800 text-sm space-y-1">
          <li>✓ تم إنشاء 3 مسؤولين منفصلين لهذا الحدث (Special, Recipient, Check)</li>
          <li>✓ احفظ بيانات الدخول في مكان آمن جداً</li>
          <li>✓ سيتم طلب تغيير كلمة المرور عند أول دخول</li>
          <li>✓ يمكنك تحديث كلمات المرور في أي وقت</li>
          <li>✓ حمّل ملف CSV للنسخ الاحتياطي</li>
        </ul>
      </div>
    </div>
  );
}