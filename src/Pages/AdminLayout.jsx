import React, { useContext, useRef, useEffect, useState } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { AppContext } from "../Context/AppContext";
import { Menu, X, LogOut } from "lucide-react";

import AuthNavBar from "./Headers/AuthNavBar";
import GuestNavBar from "./Headers/GuestNavBar";
import WaitingList from "./AuthUser/WaitingList/WaitingList";
const apiUrl = import.meta.env.VITE_API_URL;

export default function AdminLayout() {
  const { setUser, token, setToken, user } = useContext(AppContext);
  const navigate = useNavigate();
  const [specialities, setSpecialities] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const loggedIn = location.state?.loggedIn;
  const [loggedIns, setIoggedIns] = useState(loggedIn);
  const [acceptedRules, setAcceptedRules] = useState(false);

  const dropdownRef = useRef(null);

  const toggleDropdown = () => setIsOpen(!isOpen);
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsSidebarOpen(false);
  }, [location.pathname]);

  async function getSpecialites() {
    const res = await fetch(`${apiUrl}/api/specialty`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setSpecialities(data["specialties"]);
  }

  useEffect(() => {
    getSpecialites();
    console.log(user.role_id)
  }, []);

  async function handlelogout(e) {
    e.preventDefault();
    let headers = new Headers();

    headers.append('Content-Type', 'application/json');
    headers.append('Accept', 'application/json');
    headers.append('Access-Control-Allow-Origin', 'https://tagemi-foundation.org');
    headers.append('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
    headers.append('Authorization', `Bearer ${token}`);
    
    const res = await fetch(`${apiUrl}/api/logout`, {
      method: "post",
      headers: headers,
    });

    if (res.ok) {
      setUser(null);
      setToken(null);
      localStorage.removeItem("token");
      navigate("/");
    }
  }

  return (
    
    <div className="flex min-h-screen overflow-x-hidden bg-gray-50">
      {loggedIns ? (
        // Rules Modal
        <div className="rules w-screen max-w-[600px] border-[#131842] border-2 p-2 h-auto bg-white shadow-lg rounded-lg sm:p-2 fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50" dir="rtl">
          <h1 className="text-2xl font-semibold mb-4 sm:mb-6 mt-8 text-center text-[#131842] font-droid-arabic-kufi">
            ضوابط نظام الفحوصات الطبية
          </h1>
          <ul className="list-disc list-inside mb-4 px-4 sm:mb-6 space-y-2 text-gray-800">
            <li className="font-bold font-droid-arabic-kufi">
              الالتزام بالمواعيد والحضور الفعّال طوال فترة الحملة.
            </li>
            <li className="font-bold font-droid-arabic-kufi">
              اتباع التعليمات والبروتوكولات المعتمدة من الفريق المسؤول.
            </li>
            <li className="font-bold font-droid-arabic-kufi">
              التعاون والعمل بروح الفريق لتحقيق أهداف الحملة.
            </li>
            <li className="font-bold font-droid-arabic-kufi">
              التعامل بمرونة واحترام مع الجمهور والفريق.
            </li>
            <li className="font-bold font-droid-arabic-kufi">
              الحفاظ على سرية المعلومات والامتناع عن تقديم استشارات غير مخولة.
            </li>
          </ul>
          <div className="flex items-center text-center mb-4 px-4">
            <input
              type="checkbox"
              id="acceptRules"
              className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              onChange={(e) => setAcceptedRules(e.target.checked)}
            />
            <label htmlFor="acceptRules" className="mx-3 text-gray-700 text-lg font-droid-arabic-kufi">
              سألتزم بالتعليمات
            </label>
          </div>
          <div className="text-center">
            <button
              onClick={() => setIoggedIns(false)}
              className="text-white bg-blue-600 mb-7 w-1/2 mx-auto focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-lg px-8 py-3 text-center disabled:bg-gray-300 font-droid-arabic-kufi"
              disabled={!acceptedRules}
            >
              تأكيد
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Sidebar for Super Admin only */}
          {user && user.role_id === 1 && (
            <>
              {/* Overlay */}
              {isSidebarOpen && (
                <div
                  onClick={() => setIsSidebarOpen(false)}
                  className="fixed inset-0 bg-black bg-opacity-30 z-20 top-[73px]"
                />
              )}
              

            </>
          )}

          {/* Main content wrapper */}
          <div className="flex flex-col w-full flex-grow">
  {user && (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          
          {/* Left: Hamburger + Title */}
          <div className="flex items-center gap-6">
        <button
          onClick={toggleMobileMenu}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors block lg:hidden"
        >
          {isMobileMenuOpen ? (
            <X className="w-6 h-6 text-gray-700" />
          ) : (
            <Menu className="w-6 h-6 text-gray-700" />
          )}
</button>


            {/* <Link to="/" className="text-xl font-bold text-[#131842] font-droid-arabic-kufi">
              نظام المواعيد
            </Link> */}
          </div>

          {/* Center: Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 flex-wrap justify-center max-w-full">
            {user.role_id === 2 && <GuestNavBar />}
            <AuthNavBar 
              user={user} 
              specialities={specialities} 
              dropdownRef={dropdownRef} 
              toggleDropdown={toggleDropdown} 
              isOpen={isOpen}
              handlelogout={handlelogout}
              mobile={false}
            />
          </nav>

          {/* Right: Logout */}
          <button 
            onClick={handlelogout}
            className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
            title="خروج"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 mt-4 bg-white">
            <nav className="p-3 space-y-1">
              {user.role_id === 2 && <GuestNavBar mobile />}
              <AuthNavBar 
                user={user} 
                specialities={specialities} 
                dropdownRef={dropdownRef} 
                toggleDropdown={toggleDropdown} 
                isOpen={isOpen}
                handlelogout={handlelogout}
                mobile={true}
              />
            </nav>
          </div>
        )}
      </div>
    </header>
  )}
<main className="overflow-x-auto">
  <div className="w-screen min-h-screen bg-gradient-to-b from-blue-100 via-blue-50 to-white flex flex-col items-center px-4">
    <Outlet />
  </div>
</main>

</div>
        </>
      )}
    </div>
  );
}