import React, { useState, useContext } from 'react';
import { AppContext } from '../../../../Context/AppContext';
const apiUrl = import.meta.env.VITE_API_URL;

const Addadmin = ({ roles }) => {
  const { token, setToken } = useContext(AppContext);
  const [FormData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    role_id: "",
  });

  const [errors, setErrors] = useState({});

  async function handleRegister(e) {
    e.preventDefault();
    let headers = new Headers();

    headers.append("Content-Type", "application/json");
    headers.append("Accept", "application/json");
    headers.append("Access-Control-Allow-Origin", "https://tagemi-foundation.org");
    headers.append("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
    headers.append("Access-Control-Allow-Headers", "Origin, Content-Type, X-Auth-Token, Cookie");
    headers.append("Access-Control-Allow-Credentials", "true");

    const res = await fetch(`${apiUrl}/api/register`, {
      method: "POST",
      body: JSON.stringify(FormData),
      headers: headers,
    });

    const data = await res.json();
    if (data.errors) {
      setErrors(data.errors);
    } else {
      alert("Admin added successfully!");
    //   localStorage.setItem("token", data.token);
    //   setToken(data.token);
      setFormData({
        name: "",
        phone: "",
        email: "",
        password: "",
        role_id: "",
      });
    }
  }
 return (
   <div className="bg-blue-50 p-6 rounded-xl shadow-inner max-w-md mx-auto w-full">
  <form onSubmit={handleRegister} className="space-y-4">
    <input
      value={FormData.name}
      onChange={(e) => setFormData({ ...FormData, name: e.target.value })}
      type="text"
      placeholder="الإسم الكامل"
      className="p-3 h-12 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:outline-none"
      required
    />
    {errors.name && <p className="text-red-500 text-sm">{errors.name[0]}</p>}

    <input
      value={FormData.phone}
      onChange={(e) => setFormData({ ...FormData, phone: e.target.value })}
      type="tel"
      placeholder="رقم الهاتف"
      className="p-3 h-12 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:outline-none"
    />
    {errors.phone && <p className="text-red-500 text-sm">{errors.phone[0]}</p>}

    <input
      value={FormData.email}
      onChange={(e) => setFormData({ ...FormData, email: e.target.value })}
      type="email"
      placeholder="البريد الإلكتروني"
      className="p-3 h-12 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:outline-none"
      required
    />
    {errors.email && <p className="text-red-500 text-sm">{errors.email[0]}</p>}

    <input
      value={FormData.password}
      onChange={(e) => setFormData({ ...FormData, password: e.target.value })}
      type="password"
      placeholder="كلمة المرور"
      className="p-3 h-12 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:outline-none"
      required
    />
    {errors.password && <p className="text-red-500 text-sm">{errors.password[0]}</p>}

    <select
      value={FormData.role_id}
      onChange={(e) => setFormData({ ...FormData, role_id: e.target.value })}
      className="p-3 h-12 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:outline-none font-droid-arabic-kufi"
      required
    >
      <option value="">اختر المهمة</option>
      {roles.map(role => (
        <option key={role.id} value={role.id}>
          {role.name === 'SuperAdmin' ? 'الأدمين' : ''}
          {role.name === 'SimpleUser' ? 'مستعمل عادي' : ''}
          {role.name === 'SpecialAdmin' ? 'مسؤول الحالات الخاصة' : ''}
          {role.name === 'CheckAdmin' ? 'مسؤول التخصص' : ''}
          {role.name === 'RecipientAdmin' ? 'مسؤول الإستقبال' : ''}
          {role.name === 'Doctor' ? 'طبيب' : ''}
        </option>
      ))}
    </select>
    {errors.role_id && <p className="text-red-500 text-sm">{errors.role_id[0]}</p>}

    <div className="text-center mt-4">
      <button
        type="submit"
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition font-droid-arabic-kufi"
      >
        إضافة
      </button>
    </div>
  </form>
</div>

  );
}

export default Addadmin;
