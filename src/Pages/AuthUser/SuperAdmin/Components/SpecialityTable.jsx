import React, { useContext, useState } from 'react';
import { AppContext } from '../../../../Context/AppContext';
import { useNavigate } from 'react-router-dom';
const apiUrl = import.meta.env.VITE_API_URL; 

const SpecialityTable = ({ specialities, getSpecialites }) => {
  const { token } = useContext(AppContext);
  const navigate = useNavigate();
  async function handleDelete(e, specialityId) {
    e.preventDefault();

    console.log(specialityId);
    const res = await fetch(`${apiUrl}/api/specialty/${specialityId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      }
    })
    const data = await res.json();
    if (res.ok) {
      getSpecialites();
    }
    console.log(data);
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
              <button
                onClick={(e) => handleDelete(e, speciality.id)}
                type="button"
                className="text-red-700 hover:text-white border border-red-700 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-4 py-2"
              >
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>

  );
};

export default SpecialityTable;
