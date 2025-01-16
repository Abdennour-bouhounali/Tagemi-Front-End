import { useContext, useEffect, useState } from "react"
import { AppContext } from "../../../Context/AppContext"
import AdminTable from './Components/AdminTable';
import UserTable from "./Components/UserTable";
const apiUrl = import.meta.env.VITE_API_URL;

export default function AllUsers() {
  const [admins, setAdmins] = useState([]);
  const [users, setUsers] = useState([]);
  const [specialities, setSpecialities] = useState([]);
  const [roles, setRoles] = useState([]);

  const { token } = useContext(AppContext);
  async function getUsers() {
    const res = await fetch(`${apiUrl}/api/role`, {
      headers: {

        Authorization: `Bearer ${token}`
      }
    });
    const data = await res.json();
    setAdmins(data['admins']);
    setUsers(data['users']);
    setSpecialities(data['specialities']);
    setRoles(data['roles']);

    // console.log(data);
  }
  useEffect(() => {
    getUsers();
  }, []);
  return (
    <div className="flex-grow container min-h-screen text-nowrap ">
      <h4 className="mb-6 text-xl font-bold text-black font-droid-arabic-kufi mt-4">
        كل من لديه مهمة      </h4>
      <AdminTable admins={admins} specialities={specialities} roles={roles} />

      <hr />
      <h4 className="mb-6 text-xl font-bold text-black font-droid-arabic-kufi">
        كل المستعملين
      </h4>
      <UserTable users={users} specialities={specialities} roles={roles} />
    </div>)

}