import { useContext, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { AppContext } from "../../../Context/AppContext";
import { Eye, EyeOff, Mail, Lock, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
const apiUrl = import.meta.env.VITE_API_URL;
import logo from '/tagemi_logo.png';

export default function Login() {
  const { token, setToken } = useContext(AppContext)
  const navigate = useNavigate();
  const [FormData, setFormData] = useState({
    'email': '',
    'password': '',
  })

  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleLogin(e) {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    let headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('Accept', 'application/json');
    headers.append('Access-Control-Allow-Origin', 'https://tagemi-foundation.org');
    headers.append('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');

    try {
      const res = await fetch(`${apiUrl}/api/login`, {
        method: "post",
        body: JSON.stringify(FormData),
        headers: headers
      });

      const data = await res.json()
      
      if (data.errors) {
        setErrors(data.errors)
        setIsLoading(false)
      } else {
        setSuccess(true)
        localStorage.setItem('token', data.token)
        setToken(data.token);
        
        // Navigate after showing success state
        setTimeout(() => {
          navigate("/home", { state: { loggedIn: true } });
        }, 800);
      }
    } catch (error) {
      setErrors({ general: ['حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.'] })
      setIsLoading(false)
    }
  }

  return (
    <div className="relative m-0 bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 w-screen h-screen overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

      <div className="flex items-center justify-center w-full min-h-screen p-4">
        <div className="w-full max-w-md">
          <div className={`bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl overflow-hidden transition-all duration-500 ${
            success ? 'scale-105' : 'scale-100'
          }`}>
            
            {/* Header Section */}
            <div className="bg-gradient-to-br from-[#131842] to-[#2F3645] p-8 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>
              <div className="relative z-10">
                <div className="w-24 h-24 mx-auto mb-4 bg-white rounded-full p-4 shadow-lg transform transition-transform hover:scale-110 duration-300">
                  <img src={logo} alt="Tagemi Logo" className="w-full h-full object-contain" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold font-droid-arabic-kufi text-white mb-2">
                  أهلاً بك
                </h1>
                <p className="text-white/80 text-sm font-droid-arabic-kufi">
                  سجل دخولك للمتابعة
                </p>
              </div>
            </div>

            {/* Form Section */}
            <div className="p-8">
              {/* Success Message */}
              {success && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 animate-in slide-in-from-top">
                  <CheckCircle2 className="text-green-600 flex-shrink-0" size={20} />
                  <p className="text-green-700 text-sm font-droid-arabic-kufi">
                    تم تسجيل الدخول بنجاح! جاري التحويل...
                  </p>
                </div>
              )}

              {/* General Error */}
              {errors.general && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 animate-in slide-in-from-top">
                  <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
                  <p className="text-red-700 text-sm font-droid-arabic-kufi">
                    {errors.general[0]}
                  </p>
                </div>
              )}

              <form className="space-y-5" onSubmit={handleLogin}>
                {/* Email Input */}
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 font-droid-arabic-kufi text-right">
                    البريد الإلكتروني
                  </label>
                  <div className="relative">
                    <input
                      value={FormData.email}
                      onChange={(e) => setFormData({ ...FormData, email: e.target.value })}
                      type="email"
                      name="email"
                      id="email"
                      disabled={isLoading || success}
                      className={`w-full px-4 py-3 pr-11 bg-gray-50 border rounded-lg font-droid-arabic-kufi text-right
                        focus:ring-2 focus:ring-[#131842] focus:border-transparent outline-none
                        transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed
                        ${errors.email ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'}
                      `}
                      placeholder="example@email.com"
                      required
                    />
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  </div>
                  {errors.email && (
                    <p className="text-red-600 text-xs font-droid-arabic-kufi text-right flex items-center gap-1 justify-end animate-in slide-in-from-top">
                      <span>{errors.email[0]}</span>
                      <AlertCircle size={14} />
                    </p>
                  )}
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 font-droid-arabic-kufi text-right">
                    كلمة المرور
                  </label>
                  <div className="relative">
                    <input
                      value={FormData.password}
                      onChange={(e) => setFormData({ ...FormData, password: e.target.value })}
                      type={showPassword ? "text" : "password"}
                      name="password"
                      id="password"
                      disabled={isLoading || success}
                      className={`w-full px-4 py-3 pr-11 bg-gray-50 border rounded-lg font-droid-arabic-kufi text-right
                        focus:ring-2 focus:ring-[#131842] focus:border-transparent outline-none
                        transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed
                        ${errors.password ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'}
                      `}
                      placeholder="••••••••"
                      required
                    />
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      disabled={isLoading || success}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-600 text-xs font-droid-arabic-kufi text-right flex items-center gap-1 justify-end animate-in slide-in-from-top">
                      <span>{errors.password[0]}</span>
                      <AlertCircle size={14} />
                    </p>
                  )}
                </div>

                {/* Forgot Password Link */}
                <div className="text-right">
                  <Link 
                    to="/forgot-password" 
                    className="text-sm text-[#131842] hover:text-[#2F3645] font-droid-arabic-kufi transition-colors hover:underline"
                  >
                    نسيت كلمة المرور؟
                  </Link>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading || success}
                  className="w-full bg-gradient-to-r from-[#131842] to-[#2F3645] text-white py-3 px-6 rounded-lg
                    font-droid-arabic-kufi font-medium text-base
                    hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]
                    disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100
                    transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      <span>جاري تسجيل الدخول...</span>
                    </>
                  ) : success ? (
                    <>
                      <CheckCircle2 size={20} />
                      <span>تم بنجاح!</span>
                    </>
                  ) : (
                    <span>تسجيل الدخول</span>
                  )}
                </button>

                {/* Register Link */}
                {/* <div className="text-center pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 font-droid-arabic-kufi">
                    ليس لديك حساب؟{' '}
                    <Link 
                      to="/register" 
                      className="text-[#131842] font-bold hover:text-[#2F3645] transition-colors hover:underline"
                    >
                      إنشاء حساب جديد
                    </Link>
                  </p>
                </div> */}
              </form>
            </div>
          </div>

          {/* Footer Text */}
          <p className="text-center mt-6 text-sm text-gray-600 font-droid-arabic-kufi">
            © 2024 مؤسسة تاجمي. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>

      {/* Add custom animations to your global CSS */}
      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -50px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(50px, 50px) scale(1.05); }
        }
        .animate-blob {
          animation: blob 15s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes slide-in-from-top {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-in {
          animation: slide-in-from-top 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}