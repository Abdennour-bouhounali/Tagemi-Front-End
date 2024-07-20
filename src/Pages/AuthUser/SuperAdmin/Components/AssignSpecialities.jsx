
import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../../../Context/AppContext';
import { useNavigate } from 'react-router-dom';

const AssignSpecialities = ({ specialities, getSpecialites }) => {
  const { token } = useContext(AppContext);
  const navigate = useNavigate();
  const [specialitiesAdmins, setSpecialitiesAdmins] = useState({});


  async function getSpecialtiesAdmins() {
    const res = await fetch('/api/role', {
      headers: {
        Authorization: `Bearer ${token}`,
      },

    })
    const data = await res.json();
    if (res.ok) {
      setSpecialitiesAdmins(data['SpecialtiesAdmins']);
      // console.log(specialitiesAdmins);
    }
  }

  useEffect(() => {
    getSpecialtiesAdmins();

  }, [])

  async function handleAssignSpeciality(e, specialityId) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const userId = formData.get('user_id');

    const res = await fetch('/api/role/AssignSpeciality', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        user_id: userId,
        speciality_id: specialityId,
      }),
    })
    const data = await res.json();
    if (res.ok) {
      getSpecialtiesAdmins();
      getSpecialites();
    }

    // console.log(data);
  }

  return (
    <table className="table-auto py-4 text-center">
      <thead>
        <tr className="bg-gray-200">
          <th className="px-4 py-2">Name</th>
          <th className="px-4 py-2">Admin Responsible</th>
        </tr>
      </thead>
      <tbody>
        {specialities.map((speciality) => (
          <tr key={speciality.id}>
            <td className="border px-4 py-2">{speciality.name}</td>
            <td className="border px-4 py-2 text-center">
              {specialitiesAdmins.length > 0 ? (
                <form onSubmit={(e) => handleAssignSpeciality(e, speciality.id)} className="flex max-w-sm mx-auto">
                  <select
                    name="user_id"
                    className="block appearance-none w-full bg-[#EEEDEB] border border-[#2F3645] hover:border-[#131842] px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline"
                  >
                    {specialitiesAdmins.map((specialitiesAdmin) => (
                      <option key={specialitiesAdmin.id} value={specialitiesAdmin.id}>
                        {specialitiesAdmin.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="text-blue-700 ml-6 hover:text-white border border-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2 dark:border-blue-500 dark:text-blue-500 dark:hover:text-white dark:hover:bg-blue-500 dark:focus:ring-blue-800"
                  >
                    Assign
                  </button>
                </form>
              ) : (
                <h1 className='text-[#2F3645] font-bold text-center'>No Speciality Admins Exist</h1>
              )}


            </td>
          </tr>
        ))}
      </tbody>
    </table>


  );
};

export default AssignSpecialities;
