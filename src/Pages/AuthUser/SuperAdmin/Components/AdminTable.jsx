import React from 'react';
const apiUrl = import.meta.env.VITE_API_URL;

const AdminTable = ({ admins, specialities, roles }) => {
  return (
    <table className="table-auto font-droid-arabic-kufi">
      <thead>
        <tr>
          <th>المهمة</th>
          <th>الإسم</th>
          <th>الإيمايل</th>
          <th>التخصص</th>
        </tr>
      </thead>
      <tbody>

        {admins.map((admin) => (
          <tr key={admin.id}>
            <td>

              {admin.role.name === 'SuperAdmin' ? 'الأدمين' : ''}
              {admin.role.name === 'SimpleUser' ? 'مستعمل عادي' : ''}
              {admin.role.name === 'SpecialAdmin' ? 'مسؤول الحالات الخاصة' : ''}
              {admin.role.name === 'CheckAdmin' ? 'مسؤول التخصص' : ''}
              {admin.role.name === 'RecipientAdmin' ? 'مسؤول الإستقبال' : ''}
              {admin.role.name === 'Doctor' ? 'طبيب' : ''}

            </td>
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
