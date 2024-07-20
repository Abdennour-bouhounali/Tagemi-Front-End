import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppContext } from "../../../Context/AppContext";

export default function Register() {
  const { token, setToken } = useContext(AppContext);
  const navigate = useNavigate();
  const [FormData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    password_confirmation: ''
  });

  const [errors, setErrors] = useState({});

  async function handleRegister(e) {
    e.preventDefault();
    const res = await fetch("/api/register", {
      method: "post",
      body: JSON.stringify(FormData)
    });

    const data = await res.json();
    if (data.errors) {
      setErrors(data.errors);
    } else {
      localStorage.setItem('token', data.token);
      setToken(data.token);
      navigate("/");
      console.log(data);
    }
  }
//  text-[#2F3645] border border-green-300 rounded-lg bg-[#EEEDEB]
  return (
    
      <section className="flex items-center justify-center mt-6">
        <div className="w-full max-w-lg px-5 bg-[#EEEDEB] rounded-lg shadow-md">
          <div className="p-6 space-y-4">
            <h1 className="text-xl font-bold text-gray-900 mb-16 text-center">Create an Account</h1>
            <form className="space-y-4" onSubmit={handleRegister}>
              <div>
                <label className="block mb-2 text-sm font-medium text-[#2F3645] ">Your Name</label>
                <input
                  value={FormData.name}
                  onChange={(e) => setFormData({ ...FormData, name: e.target.value })}
                  type="text"
                  name="name"
                  id="name"
                  className="input-style"
                  placeholder="Mouhammed"
                  required
                />
                {errors.name && <p className="error">{errors.name[0]}</p>}
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-[#2F3645]  ">Your Phone Number</label>
                <input
                  value={FormData.phone}
                  onChange={(e) => setFormData({ ...FormData, phone: e.target.value })}
                  type="tel"
                  name="phone"
                  id="phone"
                  className="input-style"
                  placeholder="Ex: 0557211669"
                  required
                />
                {errors.phone && <p className="error">{errors.phone[0]}</p>}
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-[#2F3645] ">Your Email</label>
                <input
                  value={FormData.email}
                  onChange={(e) => setFormData({ ...FormData, email: e.target.value })}
                  type="email"
                  name="email"
                  id="email"
                  className="input-style"
                  placeholder="name@company.com"
                  required
                />
                {errors.email && <p className="error">{errors.email[0]}</p>}
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-[#2F3645] ">Password</label>
                <input
                  value={FormData.password}
                  onChange={(e) => setFormData({ ...FormData, password: e.target.value })}
                  type="password"
                  name="password"
                  id="password"
                  className="input-style"
                  placeholder="••••••••"
                  required
                />
                {errors.password && <p className="error">{errors.password[0]}</p>}
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-[#2F3645]  ">Confirm Password</label>
                <input
                  value={FormData.password_confirmation}
                  onChange={(e) => setFormData({ ...FormData, password_confirmation: e.target.value })}
                  type="password"
                  name="password_confirmation"
                  id="confirm-password"
                  className="input-style"
                  placeholder="••••••••"
                  required
                />
                {errors.password_confirmation && <p className="error">{errors.password_confirmation[0]}</p>}
              </div>
<div className="text-center">

              <button type="submit" className="btn-primary bg-[#131842] text-[#EEEDEB] py-2 px-4 text-center mb-3 rounded-lg mx-auto">
                Create an Account
              </button>
              </div>

              <p className="text-sm font-light text-gray-500 ">
                Already have an account ?    <Link to="/login" className="text-[#2F3645] font-bold hover:underline ml-4">       Login here</Link>
              </p> 
            </form>
          </div>
        </div>
      </section>
    
  );
}
