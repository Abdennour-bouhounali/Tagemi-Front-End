import { useContext, useEffect, useState } from "react";
import { AppContext } from "../../../Context/AppContext";
import SpecialityTable from "./Components/SpecialityTable";
import AddSpeciality from "./Components/AddSpeciality";
import { API_BASE_URL } from '../../../config/environment';
import { List } from "lucide-react";

const apiUrl = API_BASE_URL;

export default function ManageSpeciality() {
  const [specialities, setSpecialities] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useContext(AppContext);

  async function getSpecialites() {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/specialty`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      setSpecialities(data["specialties"]);
    } catch (error) {
      console.error("Error fetching specialties:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    getSpecialites();
  }, []);

  return (
    <div className="flex-grow container min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-xl p-6 text-white">
          <div className="flex items-center gap-3">
            <List size={32} />
            <div>
              <h1 className="text-3xl font-bold font-droid-arabic-kufi">
                إدارة التخصصات الطبية
              </h1>
              <p className="text-indigo-100 mt-1 font-droid-arabic-kufi">
                إضافة، تعديل، وحذف التخصصات الطبية
              </p>
            </div>
          </div>
        </div>

        {/* Add Specialty Form */}
        <AddSpeciality getSpecialites={getSpecialites} />

        {/* Specialties Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b">
            <h2 className="text-xl font-bold text-gray-800 font-droid-arabic-kufi flex items-center gap-2">
              <List size={24} />
              قائمة التخصصات ({specialities.length})
            </h2>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <SpecialityTable
              specialities={specialities}
              getSpecialites={getSpecialites}
            />
          )}
        </div>
      </div>
    </div>
  );
}