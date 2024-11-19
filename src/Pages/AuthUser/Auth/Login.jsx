import { useContext, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { AppContext } from "../../../Context/AppContext";
const apiUrl = import.meta.env.VITE_API_URL;

export default function Login() {
  const { token, setToken } = useContext(AppContext)
  const navigate = useNavigate();
  const [FormData, setFormData] = useState({
    'email': '',
    'password': '',

  })

  const [errors, setErrors] = useState({})

  async function handleLogin(e) {
    e.preventDefault();
    let headers = new Headers();

    headers.append('Content-Type', 'application/json');
    headers.append('Accept', 'application/json');
    headers.append('Access-Control-Allow-Origin', 'https://tagemi-foundation.org');
    headers.append('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
    // headers.append('Access-Control-Allow-Headers' ,'Origin, Content-Type, X-Auth-Token , Cookie');
    // headers.append('Access-Control-Allow-Credentials', 'true');

    const res = await fetch(`${apiUrl}/api/login`, {
      method: "post",
      body: JSON.stringify(FormData),
      headers: headers
    });

    const data = await res.json()
    if (data.errors) {
      setErrors(data.errors)
    } else {
      localStorage.setItem('token', data.token)
      setToken(data.token);
      navigate("/AllAppointments");

    }
  }

  return (


<div className="relative m-0 bg-slate-100 w-screen h-screen">
  <div className="flex items-center justify-center w-full text-center p-4 fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
    <div className=" text-sm sm:text-base lg:text-lg w-full max-w-[600px] text-white bg-opacity-50 rounded-xl">
      <div className=" bg-opacity-95 w-full bg-[#EEEDEB] px-3 py-3">
        {/* Picture and Title */}
        <div className="p-2 space-y-2">
          <h1 className="text-lg sm:text-xl font-bold mb-8 sm:mb-5 text-center font-droid-arabic-kufi text-[#2F3645]">أدخل إلى حسابك</h1>
          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <input
                value={FormData.email}
                onChange={(e) => setFormData({ ...FormData, email: e.target.value })}
                type="email"
                name="email"
                id="email"
                className="input-style text-sm sm:text-base"
                placeholder="name@company.com"
                required
              />
              {errors.email && <p className="error text-xs">{errors.email[0]}</p>}
            </div>
            <div>
              <input
                value={FormData.password}
                onChange={(e) => setFormData({ ...FormData, password: e.target.value })}
                type="password"
                name="password"
                id="password"
                className="input-style text-sm sm:text-base"
                placeholder="••••••••"
                required
              />
              {errors.password && <p className="error text-xs">{errors.password[0]}</p>}
            </div>
            <div className="text-center">
              <button type="submit" className="btn-primary font-droid-arabic-kufi bg-[#131842] text-[#EEEDEB] py-2 px-6 sm:px-8 text-center mb-3 rounded-lg mx-auto text-sm sm:text-base">
                دخول
              </button>
            </div>

            <p className="text-xs sm:text-sm font-light text-gray-500">
              ليس عندك حساب ؟ <Link to="/register" className="text-[#2F3645] font-bold hover:underline ml-4 font-droid-arabic-kufi">تسجيل</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  </div>
</div>


  )

}