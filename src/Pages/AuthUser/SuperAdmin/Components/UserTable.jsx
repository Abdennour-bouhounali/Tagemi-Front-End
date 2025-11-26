import React, { useContext, useState } from 'react';
import { AppContext } from '../../../../Context/AppContext';
const apiUrl = import.meta.env.VITE_API_URL;

const UserTable = ({ users, specialities, roles, events }) => {
  const { token } = useContext(AppContext);

  async function handleAssignUser(e, userId) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const roleId = formData.get('role');
    const eventId = formData.get('event');

    if (!roleId || !eventId) {
      alert('Please select both a role and an event.');
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/api/users/${userId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          event_id: eventId,
          role_id: roleId,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert('تم تعيين المستخدم بنجاح');
        // Optionally refresh the list or update local state
      } else {
        alert(data.message || 'فشل تعيين المستخدم');
      }
    } catch (error) {
      console.error('Error assigning user:', error);
      alert('حدث خطأ أثناء تعيين المستخدم');
    }
  }

  return (
    <div className="overflow-x-auto w-full px-4 sm:px-6 lg:px-8">
      <div className="inline-block min-w-full shadow-lg rounded-2xl bg-white border border-gray-200">
        <table className="min-w-full text-center border-collapse">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone Number</th>
              <th>Assign Role & Event</th>
            </tr>
          </thead>
          <tbody>
            {users
              .filter(user => user.role_id !== 1)
              .map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.phone}</td>
                  <td>
                    <form onSubmit={(e) => handleAssignUser(e, user.id)} className="flex flex-col md:flex-row gap-2 max-w-2xl mx-auto items-center justify-center">

                      {/* Event Selection */}
                      <select name="event"
                        className="block appearance-none w-44 bg-[#EEEDEB] font-droid-arabic-kufi border border-[#2F3645] hover:border-[#131842] px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline"
                        defaultValue={user.event_id || ""}
                      >
                        <option value="" disabled>اختر الحدث</option>
                        {events && events.map((event) => (
                          <option key={event.id} value={event.id}>
                            {event.name}
                          </option>
                        ))}
                      </select>

                      {/* Role Selection */}
                      <select name="role"
                        className="block appearance-none w-44 bg-[#EEEDEB] font-droid-arabic-kufi border border-[#2F3645] hover:border-[#131842] px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline"
                        defaultValue={user.role_id || ""}
                      >
                        <option value="" disabled>اختر المهمة</option>
                        {roles
                          .filter(role => role.name !== 'SuperAdmin')
                          .map((role) => (
                            <option key={role.id} value={role.id} className='font-droid-arabic-kufi'>
                              {role.name === 'SimpleUser' ? 'مستعمل عادي' : ''}
                              {role.name === 'SpecialAdmin' ? 'مسؤول الحالات الخاصة' : ''}
                              {role.name === 'CheckAdmin' ? 'مسؤول التخصص' : ''}
                              {role.name === 'RecipientAdmin' ? 'مسؤول الإستقبال' : ''}
                              {role.name === 'Doctor' ? 'طبيب' : ''}
                              {role.name === 'ContentAdmin' ? 'مسؤول المحتوى' : ''}
                            </option>
                          ))}
                      </select>

                      <button type="submit" className="text-blue-700 hover:text-white border border-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:border-blue-500 dark:text-blue-500 dark:hover:text-white dark:hover:bg-blue-500 dark:focus:ring-blue-800">
                        Assign
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
          </tbody>
        </table></div></div>
  );
};

export default UserTable;
