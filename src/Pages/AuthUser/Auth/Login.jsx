import { useContext, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { AppContext } from "../../../Context/AppContext";

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
    const res = await fetch("/api/login", {
      method: "post",
      body: JSON.stringify(FormData)
    });

    const data = await res.json()
    if (data.errors) {
      setErrors(data.errors)
    } else {
      localStorage.setItem('token', data.token)
      setToken(data.token);
      navigate("/");
      console.log(data);
    }
  }

  return (



    <div className="relative w-full m-0 lg:h-[calc(100vh-111px)] sm:h-[calc(100vh-569px)] bg-center bg-no-repeat bg-contain sm:bg-contain" style={{ backgroundImage:  `url('/tagemi_consept.jpg')`  }}>
    <div className="flex items-center justify-center text-center p-4 sm:h-fit lg:h-[calc(100vh-84px)]">
        <div className="p-5 text-2xl min-w-[578px] text-white bg-opacity-50 rounded-xl">
          <div className=" min-w-[578px] mx-auto bg-opacity-95 bg-[#EEEDEB] px-8 py-10" >
            {/* Picture and Title */}
            <div className="p-6 space-y-4">
              <h1 className="text-xl font-bold mb-16 text-center font-droid-arabic-kufi text-[#2F3645]">أدخل إلى حسابك</h1>
              <form className="space-y-4" onSubmit={handleLogin}>
                <div>
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
                <div className="text-center">

                  <button type="submit" className="btn-primary font-droid-arabic-kufi bg-[#131842] text-[#EEEDEB] py-2 px-8 text-center mb-3 rounded-lg mx-auto">
                    دخول
                  </button>
                </div>

                <p className="text-sm font-light text-gray-500">
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