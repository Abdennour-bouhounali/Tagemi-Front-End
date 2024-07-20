import { useContext, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { AppContext } from "../../../Context/AppContext";

export default function Login(){
    const {token ,setToken} = useContext(AppContext)
    const navigate = useNavigate();
    const [FormData,setFormData] = useState({
        'email' : '',
        'password' : '',
 
    })

    const [errors,setErrors] = useState({})

    async function handleLogin(e){
        e.preventDefault();
        const res = await fetch("/api/login",{
            method : "post",
            body: JSON.stringify(FormData)
        });

        const data = await res.json()
        if (data.errors) {
            setErrors(data.errors)
        }else{
            localStorage.setItem('token',data.token)
            setToken(data.token);
            navigate("/");
            console.log(data);
        }
    }
    
    return (
    <section className="flex items-center justify-center mt-6">
    <div className="w-full max-w-md px-5 bg-[#EEEDEB] rounded-lg shadow-md">
      <div className="p-6 space-y-4">
        <h1 className="text-xl font-bold mb-16 text-center text-[#2F3645]">Sign in to your account</h1>
        <form className="space-y-4" onSubmit={handleLogin}>
          <div>
            <label className="block mb-2 text-sm font-medium text-[#2F3645]">Your Email</label>
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
            <label className="block mb-2 text-sm font-medium text-[#2F3645]">Password</label>
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

<button type="submit" className="btn-primary bg-[#131842] text-[#EEEDEB] py-2 px-8 text-center mb-3 rounded-lg mx-auto">
Sign in
</button>
</div>
         
          <p className="text-sm font-light text-gray-500">
            Don’t have an account yet? <Link to="/register" className="text-[#2F3645] font-bold hover:underline ml-4">Register</Link>
          </p>
        </form>
      </div>
    </div>
  </section>)
    
}