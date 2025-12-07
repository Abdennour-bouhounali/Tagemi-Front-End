const AdminTable = ({ admins, specialities, roles }) => {
  return (
<div className="overflow-x-auto w-full rounded-lg shadow-md">
  <table className="min-w-full text-center border-collapse font-droid-arabic-kufi">
    <thead className="bg-blue-100 text-blue-900">
      <tr>
        <th className="p-3">المهمة</th>
        <th className="p-3">الإسم</th>
        <th className="p-3">رقم الهاتف</th>
        <th className="p-3">الإيمايل</th>
        <th className="p-3">التخصص</th>
      </tr>
    </thead>
    <tbody>
      {admins.map(admin => (
        <tr key={admin.id} className="even:bg-gray-50">
          <td className="p-3">{/* Role mapping */}</td>
          <td className="p-3">{admin.name}</td>
          <td className="p-3">{admin.phone}</td>
          <td className="p-3">{admin.email}</td>
          <td className="p-3">{admin.specialty?.name || 'No Speciality'}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

  );
};

export default AdminTable;
