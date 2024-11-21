import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppContext } from "../../../Context/AppContext";
const apiUrl = import.meta.env.VITE_API_URL; 
import logo from '/tagemi_logo.png';
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
    let headers = new Headers();

    headers.append('Content-Type', 'application/json');
    headers.append('Accept', 'application/json');
  
    headers.append('Access-Control-Allow-Origin', 'https://tagemi-foundation.org');
    headers.append('Access-Control-Allow-Methods','GET, POST, PUT, OPTIONS');
    headers.append('Access-Control-Allow-Headers' ,'Origin, Content-Type, X-Auth-Token , Cookie');
    headers.append('Access-Control-Allow-Credentials', 'true');
    const res = await fetch(`${apiUrl}/api/register`, {
      method: "post",
      body: JSON.stringify(FormData),
      headers : headers
    });

    const data = await res.json();
    if (data.errors) {
      setErrors(data.errors);
    } else {
      localStorage.setItem('token', data.token);
      setToken(data.token);
      navigate("/GeneralWaitingList", { state: { loggedIn: true } });
      // console.log(data);
    }
  }
//  text-[#2F3645] border border-green-300 rounded-lg bg-[#EEEDEB]
  return (
    


<div className="relative m-0 bg-slate-100 w-screen h-screen">
  <div className="flex items-center justify-center w-full text-center p-4 fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
    <div className=" text-sm sm:text-base lg:text-lg w-full max-w-[600px] text-white bg-opacity-50 rounded-xl">
      <div className=" bg-opacity-95 w-full bg-[#EEEDEB] px-3 py-3">
          <div className="px-6 space-y-4">
          <div className="text-center w-1/2 mx-auto">
                  <img src={logo} alt="Appointment Form" className=" mb-4 mx-auto" />
                  <h1 className="md:text-2xl text-sm font-bold font-droid-arabic-kufi text-[#2F3645]">أنشئ حسابك</h1>
                </div>
            <form className="space-y-4" onSubmit={handleRegister}>
              <div>
                <input
                  value={FormData.name}
                  onChange={(e) => setFormData({ ...FormData, name: e.target.value })}
                  type="text"
                  name="name"
                  id="name"
                  className="input-style font-droid-arabic-kufi"
                  placeholder="الإسم الكامل"
                  required
                />
                {errors.name && <p className="error">{errors.name[0]}</p>}
              </div>
              <div>
                <input
                  value={FormData.phone}
                  onChange={(e) => setFormData({ ...FormData, phone: e.target.value })}
                  type="tel"
                  name="phone"
                  id="phone"
                  className="input-style font-droid-arabic-kufi"
                  placeholder="رقم الهاتف"
                  required
                  dir="rtl"
                />
                {errors.phone && <p className="error">{errors.phone[0]}</p>}
              </div>
              <div>
                <input
                  value={FormData.email}
                  onChange={(e) => setFormData({ ...FormData, email: e.target.value })}
                  type="email"
                  name="email"
                  id="email"
                  className="input-style font-droid-arabic-kufi"
                  placeholder="الايمايل"
                  required
                />
                {errors.email && <p className="error">{errors.email[0]}</p>}
              </div>
              <div>
                <input
                  value={FormData.password}
                  onChange={(e) => setFormData({ ...FormData, password: e.target.value })}
                  type="password"
                  name="password"
                  id="password"
                  className="input-style font-droid-arabic-kufi"
                  placeholder="كلمة السر"
                  required
                />
                {errors.password && <p className="error">{errors.password[0]}</p>}
              </div>
              <div>
                <input
                  value={FormData.password_confirmation}
                  onChange={(e) => setFormData({ ...FormData, password_confirmation: e.target.value })}
                  type="password"
                  name="password_confirmation"
                  id="confirm-password"
                  className="input-style font-droid-arabic-kufi"
                  placeholder="تأكيد كلمة السر"
                  required
                />
                {errors.password_confirmation && <p className="error">{errors.password_confirmation[0]}</p>}
              </div>
<div className="text-center">

              <button type="submit" className="btn-primary   font-droid-arabic-kufi  bg-[#131842] text-[#EEEDEB] py-2 px-4 text-center mb-3 rounded-lg mx-auto">
                أنشئ حسابك
              </button>
              </div>

              <p className="text-sm font-light font-droid-arabic-kufi  text-gray-500   ">
                لديك حساب بالفعل ؟     <Link to="/login" className="text-[#2F3645]  font-droid-arabic-kufi   font-bold hover:underline ml-4"> دخول</Link>
              </p> 
            </form>
          </div>
        </div>
        </div>
        </div>
        </div>
  );
}
