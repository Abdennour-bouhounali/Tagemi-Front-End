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
    <div className="bg-gray-100 p-6 rounded-xl shadow-md max-w-md mx-auto mt-6 w-full">
      <form onSubmit={handleRegister} className="space-y-4">
        <input
          value={FormData.name}
          onChange={(e) => setFormData({ ...FormData, name: e.target.value })}
          type="text"
          name="name"
          id="name"
          placeholder="Full name"
          className="border p-2 rounded w-full"
          required
        />
        {errors.name && <p className="text-red-500 text-sm">{errors.name[0]}</p>}

        <input
          value={FormData.phone}
          onChange={(e) => setFormData({ ...FormData, phone: e.target.value })}
          type="tel"
          name="phone"
          id="phone"
          placeholder="Phone"
          className="border p-2 rounded w-full"
        />
        {errors.phone && <p className="text-red-500 text-sm">{errors.phone[0]}</p>}

        <input
          value={FormData.email}
          onChange={(e) => setFormData({ ...FormData, email: e.target.value })}
          type="email"
          name="email"
          id="email"
          placeholder="Email"
          className="border p-2 rounded w-full"
          required
        />
        {errors.email && <p className="text-red-500 text-sm">{errors.email[0]}</p>}

        <input
          value={FormData.password}
          onChange={(e) => setFormData({ ...FormData, password: e.target.value })}
          type="password"
          name="password"
          id="password"
          placeholder="Password"
          className="border p-2 rounded w-full"
          required
        />
        {errors.password && <p className="text-red-500 text-sm">{errors.password[0]}</p>}

        <select
          value={FormData.role_id}
          onChange={(e) => setFormData({ ...FormData, role_id: e.target.value })}
          className="border p-2 rounded w-full font-droid-arabic-kufi"
          required
        >
          <option value="">Select Role</option>
          {roles.map((role) => (
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

        <div className="text-center">
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Add Admin
          </button>
        </div>
      </form>
    </div>
  );
}

export default Addadmin;
