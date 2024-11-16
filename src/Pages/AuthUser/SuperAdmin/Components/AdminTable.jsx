import React from 'react';
const apiUrl = import.meta.env.VITE_API_URL; 

const AdminTable = ({ admins ,specialities,roles}) => {
  return (
    <table className="table-auto">
      <thead>
        <tr>
          <th>Role</th>
          <th>Name</th>
          <th>Email</th>
          <th>Speciality</th>
        </tr>
      </thead>
      <tbody>
        
        {admins.map((admin) => (
          <tr key={admin.id}>
            <td>{admin.role.name}</td>
            <td>{admin.name}</td>
            <td>{admin.email}</td>
            <td>{admin.specialty.name ? admin.specialty.name : 'No Speciality'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default AdminTable;
