import { useContext, useEffect, useState } from "react"
import { AppContext } from "../../../Context/AppContext"
import AdminTable from './Components/AdminTable';
import UserTable from "./Components/UserTable";
import Addadmin from "./Components/Addadmin";
const apiUrl = import.meta.env.VITE_API_URL;

export default function AllUsers() {
  const [admins, setAdmins] = useState([]);
  const [users, setUsers] = useState([]);
  const [specialities, setSpecialities] = useState([]);
  const [roles, setRoles] = useState([]);

  const { token } = useContext(AppContext);

  async function getUsers() {
    const res = await fetch(`${apiUrl}/api/role`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    setAdmins(data['admins']);
    setUsers(data['users']);
    setSpecialities(data['specialities']);
    setRoles(data['roles']);
  }

  useEffect(() => {
    getUsers();
  }, []);

  return (
    <div className="flex-grow w-full max-w-7xl mx-auto py-10 space-y-10">

      {/* Add Admin Section */}
      <section className="bg-white rounded-2xl shadow-lg p-6">
        <h4 className="mb-6 text-2xl font-bold text-blue-900 font-droid-arabic-kufi">
          إضافة أدمين
        </h4>
        <Addadmin specialities={specialities} roles={roles} />
      </section>

      {/* Admin Table Section */}
      <section className="bg-white rounded-2xl shadow-lg p-6">
        <h4 className="mb-6 text-2xl font-bold text-blue-900 font-droid-arabic-kufi">
          كل من لديه مهمة
        </h4>
        <AdminTable admins={admins} specialities={specialities} roles={roles} />
      </section>

      {/* Users Table Section */}
      <section className="bg-white rounded-2xl shadow-lg p-6">
        <h4 className="mb-6 text-2xl font-bold text-blue-900 font-droid-arabic-kufi">
          كل المستعملين
        </h4>
        <UserTable users={users} specialities={specialities} roles={roles} />
      </section>
    </div>
  );
}
