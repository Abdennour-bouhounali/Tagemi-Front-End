import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppContext } from "../../../Context/AppContext";
const apiUrl = import.meta.env.VITE_API_URL; 

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
      navigate("/");
      // console.log(data);
    }
  }
//  text-[#2F3645] border border-green-300 rounded-lg bg-[#EEEDEB]
  return (
    


    <div className="relative w-full min-h-[12rem] lg:h-screen sm:h-fit bg-center bg-no-repeat bg-contain sm:bg-cover" style={{ backgroundImage: `url('/tagemi_consept.png')` }}>
      <div className="flex items-center justify-center text-center p-4 sm:h-fit lg:h-screen">
        <div className="p-5 text-2xl min-w-[578px] text-white bg-opacity-50 rounded-xl">
          <div className=" min-w-[578px] mx-auto bg-opacity-95 bg-[#EEEDEB] px-8 py-10" >
          <div className="px-6 space-y-4">
            <h1 className="text-xl font-bold text-gray-900 mb-4   font-droid-arabic-kufi  text-center">أنشئ حسابك</h1>
            <form className="space-y-4" onSubmit={handleRegister}>
              <div>
                <label className="block mb-2 text-sm font-medium  font-droid-arabic-kufi   text-[#2F3645] ">الإسم الكامل</label>
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
                <label className="block mb-2 text-sm font-droid-arabic-kufi  font-medium text-[#2F3645]  ">رقم الهانف</label>
                <input
                  value={FormData.phone}
                  onChange={(e) => setFormData({ ...FormData, phone: e.target.value })}
                  type="tel"
                  name="phone"
                  id="phone"
                  className="input-style font-droid-arabic-kufi"
                  placeholder="Ex: 0557211669"
                  required
                />
                {errors.phone && <p className="error">{errors.phone[0]}</p>}
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium  font-droid-arabic-kufi text-[#2F3645]   ">الايمايل</label>
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
                <label className="block mb-2 text-sm font-medium  font-droid-arabic-kufi   text-[#2F3645] ">كلمة المرور</label>
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
                <label className="block mb-2 text-sm font-medium font-droid-arabic-kufi    text-[#2F3645]  ">تأكيد كلمة المرور</label>
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
