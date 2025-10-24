import { useContext, useEffect, useState } from "react";
import { AppContext } from "../../../../Context/AppContext";
import { Loader2 } from "lucide-react";

const apiUrl = import.meta.env.VITE_API_URL;

export default function Events({events,getEvents}) {
  const { token } = useContext(AppContext);
    const [loadingId, setLoadingId] = useState(null);

  async function toggleStatus(id) {
    setLoadingId(id);
    await fetch(`${apiUrl}/api/events/${id}/toggle`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    setLoadingId(null);
    getEvents(); // refresh event list after toggling
  }

  if (!events || events.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500 font-droid-arabic-kufi">
        لا توجد أحداث حالياً
      </div>
    );
  }
async function archiveAppointments(id) {
  setLoadingId(id); // show spinner
  try {
    const res = await fetch(`${apiUrl}/api/events/${id}/archive`, {
      method: "POST", // or PATCH
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) throw new Error("خطأ أثناء أرشفة المواعيد");

    getEvents(); // refresh event list
  } catch (error) {
    console.error(error);
    alert("فشل أرشفة المواعيد");
  } finally {
    setLoadingId(null);
  }
}


  return (
    <div className="overflow-x-auto font-droid-arabic-kufi text-center">
      <table className="min-w-full border border-gray-200 bg-white rounded-2xl shadow-lg">
        <thead>
          <tr className="bg-gradient-to-r from-indigo-100 to-indigo-200 text-indigo-900">
            <th className="py-3 px-4 text-right font-semibold">الاسم</th>
            <th className="py-3 px-4 text-right font-semibold">التاريخ</th>
            <th className="py-3 px-4 text-right font-semibold">المكان</th>
            <th className="py-3 px-4 text-right font-semibold">الوصف</th>
            <th className="py-3 px-4 text-center font-semibold">الحالة</th>
            <th className="py-3 px-4 text-center font-semibold">الإجراء</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event, index) => (
            <tr
              key={event.id}
              className={`${
                index % 2 === 0 ? "bg-gray-50" : "bg-white"
              } border-b hover:bg-indigo-50 transition`}
            >
              <td className="py-3 px-4 text-gray-700 text-right">{event.name}</td>
              <td className="py-3 px-4 text-gray-700 text-right">
                {event.date}
              </td>
              <td className="py-3 px-4 text-gray-700 text-right">{event.place}</td>
              <td className="py-3 px-4 text-gray-700 text-right max-w-xs truncate">
                {event.description || "-"}
              </td>
              <td className="py-3 px-4 text-right">
               {!event.is_archived && 
               <span
                  className={`px-3 py-1 mx-2 rounded-full text-sm font-semibold ${
                    event.is_current
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {event.is_current ? "نشط" : "غير نشط"}
                  
                </span>}
                 {event.is_archived ? 
                                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700"
                  `}
                >
                  تمت الأرشفة                </span> : ''}
              </td>
           
              <td className="py-3 px-4 text-center flex justify-center gap-2">
                {/* Toggle status button */}

                <button
                    disabled={event.is_archived || loadingId === event.id}
                    onClick={() => toggleStatus(event.id)}
                      className={`flex items-center justify-center gap-2 px-4 py-1.5 rounded-full text-white font-semibold transition
                    ${
                    event.is_archived
                        ? "bg-gray-400 cursor-not-allowed" // gray if archived
                        : event.is_current
                        ? "bg-red-500 hover:bg-red-600"   // red if active
                        : "bg-green-500 hover:bg-green-600" // green if inactive
                    }
                    ${loadingId === event.id ? "opacity-70 cursor-wait" : ""}
                `}
                >
                    {loadingId === event.id ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>جارٍ التحديث...</span>
                    </>
                    ) : (
                    <span>{event.is_current ? "تعطيل" : "تفعيل"}</span>
                    )}
                </button>

                {/* Archive appointments button */}
                {!event.is_archived ?
               <button
                disabled={event.is_archived === 1 || loadingId !== event.id}
                onClick={() => {
                    if (window.confirm("هل أنت متأكد أنك تريد أرشفة جميع المواعيد لهذا الحدث؟")) {
                    archiveAppointments(event.id);
                    }
                }}
                  className={`flex items-center justify-center gap-2 px-4 py-1.5 rounded-full text-white font-semibold transition
                   ${
                    event.is_archived
                        ? "bg-gray-400 cursor-not-allowed" // gray if archived
                        : event.is_current
                        ? "bg-red-500 hover:bg-red-600"   // red if active
                        : "bg-green-500 hover:bg-green-600" // green if inactive
                    }
                    ${loadingId === event.id ? "opacity-70 cursor-wait" : ""}
                `}
                >
                {loadingId === event.id && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                )}
                {!loadingId && <span>أرشفة المواعيد</span>}
                </button> : ''}
                </td>

            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
