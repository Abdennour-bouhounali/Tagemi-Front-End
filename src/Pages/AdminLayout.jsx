import React, { useContext, useRef, useEffect, useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { AppContext } from "../Context/AppContext";

import SuperAdminNav from "./Headers/SuperAdminNav";
import AuthNavBar from "./Headers/AuthNavBar";
import GuestNavBar from "./Headers/GuestNavBar";

export default function AdminLayout() {
  const { setUser, token, setToken } = useContext(AppContext);
  const navigate = useNavigate();
  const [specialities, setSpecialities] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  

  const dropdownRef = useRef(null);



  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    // Bind the event listener
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      // Unbind the event listener on cleanup
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  async function getSpecialites() {

    const res = await fetch("/api/specialty", {
      headers: {
        Authorization: `Bearer ${token}`,
      },

    });
    const data = await res.json();
    setSpecialities(data["specialties"]);
  }

  useEffect(() => {
    getSpecialites();
  }, []);

  async function handlelogout(e) {
    e.preventDefault();

    const res = await fetch("/api/logout", {
      method: "post",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      setUser(null);
      setToken(null);
      localStorage.removeItem("token");
      navigate("/");
    }
  }

  const { user } = useContext(AppContext);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };


  return (

    <div className="flex  min-h-fit overflow-x-hidden" >
      {/* Sidebar */}
      {user && user.role_id == 1 && (
        <div className={`fixed inset-y-0 right-0 bg-gradient-to-b mt-[90px] bg-[#EEEDEB] shadow-lg transform ${isSidebarOpen ? "translate-x-0" : "translate-x-full"} transition-transform duration-300 ease-in-out z-30 w-64`}>
          <SuperAdminNav user={user} specialities={specialities} dropdownRef={dropdownRef} toggleMobileMenu={toggleMobileMenu} toggleDropdown={toggleDropdown} isOpen={isOpen} />
        </div>
      )}

      {/* Main content */}
      <div className={`flex flex-col w-full flex-grow ml-0 transition-all duration-300 ease-in-out bg-[#F3F4F6]`}>
        <header className="bg-gradient-to-r bg-[#EEEDEB] shadow-lg sticky top-0 z-50 ">
          <div className="md:container mx-10 flex justify-between items-center">


            <div className="flex items-center">

              <div className="object-left flex items-center">
                {user && user.role_id == 1 && (
                  <button onClick={toggleSidebar} className="text-[#2F3645] hover:text-[#131842] mr-4">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
                    </svg>
                  </button>
                )}
                <Link to="/" className="text-[#2F3645] hover:text-[#131842] font-droid-arabic-kufi text-lg mr-8 font-bold">
                  الصفحة الرئيسية
                </Link>
              </div>

            </div>

            <div className="hidden md:flex space-x-6 items-center">

           {user && user.role_id == 2 && <GuestNavBar />
}
          <AuthNavBar user={user} specialities={specialities} dropdownRef={dropdownRef} toggleMobileMenu={toggleMobileMenu} toggleDropdown={toggleDropdown} isOpen={isOpen}/>
          

              {/*Language Selector  */}
{/* 
              <div className="relative px-4 py-3">
                <select
                  onChange={(e) => changeLanguage(e.target.value)} defaultValue={i18n.language}
                  className="block appearance-none w-full bg-[#EEEDEB] border border-[#2F3645] font-droid-arabic-kufi hover:border-[#131842] px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline"
                >
                  <option value="en" className="text-[#2F3645]">English</option>
                  <option value="fr" className="text-[#2F3645]">Français</option>
                  <option value="ar" className="text-[#2F3645]">العربية</option>
                </select>
              </div> */}


              {user ? (
                <>

                  <button className="text-[#2F3645] font-medium hover:bg-[#131842] px-4 py-2 font-droid-arabic-kufi hover:text-white  rounded-full" onClick={handlelogout}>خروج</button>
                </>
              ) : (
                <div className="space-x-4">
                  <Link to="/login" className="text-[#2F3645] font-medium hover:bg-[#131842] font-droid-arabic-kufi px-8 py-2 hover:text-white  rounded-full">دخول</Link>
                  <Link to="/register" className="text-[#2F3645] font-medium hover:bg-[#131842] font-droid-arabic-kufi px-4 py-2 hover:text-white  rounded-full">تسجيل</Link>
                </div>
              )}


            </div>


            <button className="text-[#2F3645] hover:text-[#131842] mr-4 ml-4 md:hidden" onClick={toggleMobileMenu}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path>
              </svg>
            </button>
          </div>


          {isMobileMenuOpen && (
            <div className="md:hidden mt-4">
              <div className="space-y-2 block">
              <GuestNavBar />
              <AuthNavBar user={user} specialities={specialities} />

              </div>
            </div>
          )}
        </header>
        
        
        <main className=" container p-0 mx-auto" >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
