import React, { useContext, useState } from 'react';
import { AppContext } from '../../../../Context/AppContext';
import { useNavigate } from 'react-router-dom';
const apiUrl = import.meta.env.VITE_API_URL; 

const SpecialityTable = ({ specialities, getSpecialites }) => {
  const { token } = useContext(AppContext);
  const navigate = useNavigate();

  async function handleActivate(e, specialityId) {
  e.preventDefault();

  const res = await fetch(`${apiUrl}/api/specialty/${specialityId}/activate`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  if (res.ok) {
    getSpecialites(); // refresh table
  } else {
    console.error(data.message);
  }
}


  return (
    <table className="table-auto py-4  text-center">
      <thead>
        <tr className="bg-gray-200">
          <th className="px-4 py-2">Name</th>
          <th className="px-4 py-2">Duration</th>
          <th className="px-4 py-2">Responsibles</th>
          <th className="px-4 py-2">Actions</th>
        </tr>
      </thead>
      <tbody>
        {specialities
        .filter(speciality => speciality.name !== 'NoSpeciality' )        
        .map((speciality) => (
          <tr key={speciality.id}>
            <td className="border px-4 py-2">{speciality.name}</td>
            <td className="border px-4 py-2">{speciality.duration}</td>
            <td className="border px-4 py-2">
              {speciality.users.map((user) => (
                <span key={user.id}>
                  {user.name} <br />
                </span>
              ))}
            </td>
            <td className="border px-4 py-2 items-center">
              {
                speciality.is_active == 0  ? ( <button
                onClick={(e) => handleActivate(e, speciality.id)}
                type="button"
                className="text-green-700 hover:text-white border border-green-700 hover:bg-green-800 focus:ring-4 focus:outline-none focus:ring-green-300 font-medium rounded-lg text-sm px-4 py-2"
              >
                Activate
              </button>) : (<button
                onClick={(e) => handleActivate(e, speciality.id)}
                type="button"
                className="text-red-700 hover:text-white border border-red-700 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-4 py-2"
              >
                Disactivate
              </button>) 
              }
              
            </td>
          </tr>
        ))}
      </tbody>
    </table>

  );
};

export default SpecialityTable;
