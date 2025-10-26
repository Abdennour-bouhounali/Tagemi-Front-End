import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from "../../../Context/AppContext";
const apiUrl = import.meta.env.VITE_API_URL;
import { useLocation } from "react-router-dom";

const WaitingList = () => {
  const [specialities, setSpecialities] = useState([]);
  const [waitingList, setWaitingList] = useState({});
  const { token, startDay, setStartDay } = useContext(AppContext);
  const location = useLocation();
  const loggedIn = location.state?.loggedIn;
  const [loggedIns, setIoggedIns] = useState(loggedIn);

  // Fetch waiting list
  async function getWaitingList() {
    const res = await fetch(`${apiUrl}/api/waitinglist/getwaitinglist`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setWaitingList(data);
  }

  // Fetch specialities
  async function getSpecialities() {
    const res = await fetch(`${apiUrl}/api/specialty`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    const filtered = data['specialties'].filter(s => s.name !== 'NoSpeciality');
    setSpecialities(filtered);
  }

  // Fetch start day
  async function getStartDay() {
    const res = await fetch(`${apiUrl}/api/getstartDay`);
    const data = await res.json();
    setStartDay(data);
  }

  useEffect(() => {
    const interval = setInterval(() => {
      if (startDay) {
        getStartDay();
        getWaitingList();
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [startDay, token]);

  useEffect(() => {
    getSpecialities();
    getWaitingList();
  }, [token]);

  const maxRows = Math.max(...Object.values(waitingList).map(arr => arr.length), 0);

  return (
<div className="w-screen min-h-screen bg-gradient-to-b from-blue-100 via-blue-50 to-white flex flex-col items-center py-10 px-4">
      {/* Title Section */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-[#003366] font-droid-arabic-kufi mb-2">
قائمة الإنتظار الكبيرة        </h1>
        <p className="text-gray-600 text-sm font-droid-arabic-kufi">
          قائمة محدثة للمرضى حسب التخصصات الطبية
        </p>
      </div>

      {/* Table Container */}
<div className="overflow-x-auto w-full px-4 sm:px-6 lg:px-8">
  <div className="inline-block min-w-full shadow-lg rounded-2xl bg-white border border-gray-200">
    <table className="min-w-full text-center border-collapse">
      <thead className="bg-blue-100">
        <tr>
          {specialities.map((speciality) => (
            <th
              key={speciality.id}
              className="px-6 py-3 text-sm font-bold text-blue-900 border-b border-gray-200 font-droid-arabic-kufi"
            >
              <span className="block mb-2 text-lg">{speciality.name}</span>
              <div className="flex justify-between text-xs text-gray-600">
                <span>ID</span>
                <span>الاسم الكامل</span>
              </div>
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="bg-white">
        {Array.from({ length: maxRows }).map((_, rowIndex) => (
          <tr
            key={rowIndex}
            className={rowIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
          >
            {specialities.map((speciality) => {
              const patients = waitingList[speciality.id] || [];
              const patient = patients[rowIndex] || null;
              return (
                <td key={speciality.id} className="px-6 py-4 border-b border-gray-200 font-droid-arabic-kufi">
                  {patient ? (
                    <div className="flex justify-between">
                      <div className="w-1/3">{patient.patient_id}</div>
                      <div className={patient.name.includes('خاصة') ? 'text-red-500' : ''}>
                        {patient.lastName} {patient.name}
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between">
                      <div className="w-1/3">&nbsp;</div>
                      <div className="w-2/3">&nbsp;</div>
                    </div>
                  )}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>


      {/* Footer / Last Updated */}
      <div className="mt-6 text-sm text-gray-500 font-droid-arabic-kufi">
        <p>🔄 يتم تحديث اللوائح تلقائيا كل 10 ثواني</p>
      </div>
    </div>
  );
};

export default WaitingList;
