import React, { useContext, useRef, useEffect, useState } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { AppContext } from "../../Context/AppContext";

const AuthNavBar = ({ user, specialities, dropdownRef, toggleDropdown, isOpen }) => {
  const { token, setToken } = useContext(AppContext);
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

    <nav className="ml-4 space-y-2 font-droid-arabic-kufi text-nowrap ">
      {user && (
        <>
          <Link to="/appointment" className="block px-4 py-2 font-medium font-droid-arabic-kufi mx-4 mt-2 text-[#2F3645] hover:bg-[#131842] hover:text-white  rounded-full transition duration-300">أحجز موعدا</Link>
          <Link to="/GeneralWaitingList" className="block px-4 py-2 font-medium font-droid-arabic-kufi mx-4 mt-2 text-[#2F3645] hover:bg-[#131842] hover:text-white  rounded-full transition duration-300" >قائمة الإنتظار الكبيرة</Link>
        </>
      )}

      {user && (user.role_id === 3 || user.role_id === 5) && (
        <Link to="/AllAppointments" className="block px-4 py-2 font-medium font-droid-arabic-kufi mx-4 mt-2 text-[#2F3645] hover:bg-[#131842] hover:text-white  rounded-full transition duration-300">جميع المواعيد </Link>
      )}

      {user && (user.role_id == 1) && (<>

      <Link to="/AllAppointments" className="block font-medium font-droid-arabic-kufi py-2 px-4 text-[#2F3645] hover:bg-[#131842] hover:text-white  rounded-full transition duration-300">جميع المواعيد</Link>
      <Link to="/AddMultipleAppointments" className="block px-4 font-medium font-droid-arabic-kufi  py-2 text-[#2F3645] hover:bg-[#131842] hover:text-white  rounded-full transition duration-300">إضافة مواعيد متعددة</Link>
      <Link to="/users" className="block px-4 font-medium font-droid-arabic-kufi  py-2 text-[#2F3645] hover:bg-[#131842] hover:text-white  rounded-full transition duration-300"> تسيير الأعضاء</Link>
      <Link to="/speciality" className="block font-medium font-droid-arabic-kufi  px-4 py-2 text-[#2F3645] hover:bg-[#131842] hover:text-white  rounded-full transition duration-300">تسيير التخصصات </Link>
      <Link to="/Statitistics" className="block font-medium font-droid-arabic-kufi px-4 py-2 text-[#2F3645] hover:bg-[#131842] hover:text-white  rounded-full transition duration-300">إحصائيات</Link>
      <Link to="/manageEvents" className="block font-medium font-droid-arabic-kufi px-4 py-2 text-[#2F3645] hover:bg-[#131842] hover:text-white  rounded-full transition duration-300">تسيير الفعاليات</Link>
      <button className="block px-4 py-2 font-medium font-droid-arabic-kufi mx-4 mt-2 text-[#2F3645] hover:bg-[#131842] hover:text-white  rounded-full transition duration-300" onClick={handlelogout}>خروج</button>

      </>
      )}

      {/* {user && user.role_id === 3 && (
                  <Link to="/specialCase" className="block font-medium px-4 py-2 text-[#2F3645] hover:bg-[#131842] hover:text-white  rounded-full transition duration-300"></Link>
                )} */}

      {user && (user.role_id === 4 || user.role_id == 6) && (
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={toggleDropdown}
            className=" text-[#2F3645] font-medium py-2 px-4 rounded-full inline-flex items-center bg-[#EEEDEB] mx-4 hover:bg-[#131842] hover:text-white transition duration-300"
          >
            <span>لوائح الانتظار</span>
            <svg className="fill-current h-4 w-4 ml-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M10 12l-6-6h12z" />
            </svg>
          </button>
          {isOpen && (
            <ul className="absolute left-0 top-full w-48 bg-white shadow-md rounded py-2 z-50">

              {specialities
                .filter(specialitie => specialitie.id !== 6)
                .map((speciality) => (
                  <li key={speciality.id}>
                    <Link
                      to={`/WaitingList/${speciality.id}`}
                      className="block px-4 py-2 text-[#2F3645] hover:bg-gray-100"
                    >
                      {speciality.name}
                    </Link>
                  </li>
                ))}
            </ul>
          )}
        </div>
      )}

    </nav>



  );
};

export default AuthNavBar;
