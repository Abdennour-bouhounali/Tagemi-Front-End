import React, { useContext, useRef, useEffect, useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { AppContext } from "../Context/AppContext";
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';

export default function AdminLayout() {
  const { setUser, token, setToken } = useContext(AppContext);
  const navigate = useNavigate();
  const [specialities, setSpecialities] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { t } = useTranslation();
  const dropdownRef = useRef(null);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

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

    <div className="flex  min-h-fit" >
      {/* Sidebar */}
      {user && user.role_id == 1 && (
        <div className={`fixed inset-y-0 left-0 bg-gradient-to-b mt-[110px] bg-[#EEEDEB] shadow-lg transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} transition-transform duration-300 ease-in-out z-30 w-64`}>


          <nav className="mt-4 space-y-2 block">
            <Link to="/settings" className="block font-medium px-4 py-2 text-[#2F3645] hover:bg-[#131842] hover:text-white  rounded-full transition duration-300">Settings</Link>
            <Link to="/users" className="block px-4 font-medium py-2 text-[#2F3645] hover:bg-[#131842] hover:text-white  rounded-full transition duration-300">Manage Users</Link>
            <Link to="/speciality" className="block font-medium px-4 py-2 text-[#2F3645] hover:bg-[#131842] hover:text-white  rounded-full transition duration-300">Manage Specialities</Link>
            
            <Link to="/Statitistics" className="block font-medium px-4 py-2 text-[#2F3645] hover:bg-[#131842] hover:text-white  rounded-full transition duration-300">Statitistics</Link>

          </nav>
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
                <Link to="/" className="text-[#2F3645] hover:text-[#131842] text-2xl font-bold">
                  Home
                </Link>
              </div>

            </div>
            
            <div className="hidden md:flex space-x-6 items-center">
            
              <nav className="ml-4 space-y-2">
                {user && (
                  <Link to="/appointment" className="block px-4 py-2 font-medium mx-4 mt-2 text-[#2F3645] hover:bg-[#131842] hover:text-white  rounded-full transition duration-300">Make An Appointment</Link>

                )}
                {user && user.role_id === 1 && (
                  <>
                    <Link to="/specialCase" className="block font-medium px-4 py-2 text-[#2F3645] hover:bg-[#131842] hover:text-white  rounded-full transition duration-300">SpecialCase</Link>

                    <Link to="/AllAppointments" className="block px-4 font-medium mx-4 py-2 text-[#2F3645] hover:bg-[#131842] hover:text-white  rounded-full transition duration-300">All Appointments</Link>
                    <div className="relative" ref={dropdownRef}>
                      <button
                        onClick={toggleDropdown}
                        className=" text-[#2F3645] font-medium py-2 px-4 rounded-full inline-flex items-center bg-[#EEEDEB] mx-4 hover:bg-[#131842] hover:text-white transition duration-300"
                      >
                        <span>Waiting Lists</span>
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
                  </>
                )}
                {user && user.role_id === 5 && (
                  <Link to="/AllAppointments" className="block px-4 py-2 text-[#2F3645] hover:text-[#131842]  transition duration-300">All Appointments</Link>
                )}
              </nav>

              {/*Language Selector  */}
              <div className="relative px-4 py-3">
                <select
                  onChange={(e) => changeLanguage(e.target.value)} defaultValue={i18n.language}
                  className="block appearance-none w-full bg-[#EEEDEB] border border-[#2F3645] hover:border-[#131842] px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline"
                >
                  <option value="en" className="text-[#2F3645]">English</option>
                  <option value="fr" className="text-[#2F3645]">Français</option>
                  <option value="ar" className="text-[#2F3645]">العربية</option>
                </select>
              </div>



              {user ? (
                <>

                  <button className="text-[#2F3645] font-medium hover:bg-[#131842] px-4 py-2 hover:text-white  rounded-full" onClick={handlelogout}>Logout</button>
                </>
              ) : (
                <div className="space-x-4">
                  <Link to="/login" className="text-[#2F3645] font-medium hover:bg-[#131842] px-6 py-2 hover:text-white  rounded-full">Login</Link>
                  <Link to="/register" className="text-[#2F3645] font-medium hover:bg-[#131842] px-4 py-2 hover:text-white  rounded-full">Register</Link>
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
                <Link to="/appointment"                        
                      className=" text-[#2F3645] font-medium py-2 px-4 rounded-full inline-flex items-center bg-[#EEEDEB] hover:bg-[#131842] hover:text-white transition duration-300">
                        Make An Appointment
                </Link>
                {user && user.role_id === 1 && (
                  <div className="block">
                    <Link to="/users" 
                          className=" text-[#2F3645] font-medium py-2 px-4 rounded-full inline-flex items-center bg-[#EEEDEB] hover:bg-[#131842] hover:text-white transition duration-300"
                          >Manage Users
                    </Link>
                    <Link to="/speciality"                         
                          className=" text-[#2F3645] font-medium py-2 px-4 rounded-full inline-flex items-center bg-[#EEEDEB] hover:bg-[#131842] hover:text-white transition duration-300">
                      Manage Specialities
                    </Link>
                    <Link to="/AllAppointments"                        
                          className=" text-[#2F3645] font-medium py-2 px-4 rounded-full inline-flex items-center bg-[#EEEDEB] hover:bg-[#131842] hover:text-white transition duration-300">
                      All Appointments
                    </Link>
                    <div className="relative">
                      <button
                        onClick={toggleDropdown}
                        className=" text-[#2F3645] font-medium py-2 px-4 rounded-full inline-flex items-center bg-[#EEEDEB] hover:bg-[#131842] hover:text-white transition duration-300"
                      >
                        <span>Waiting Lists</span>
                        <svg className="fill-current h-4 w-4 ml-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                          <path d="M10 12l-6-6h12z" />
                        </svg>
                      </button>
                      {isOpen && (
                        <ul className="absolute left-0 top-full w-48 bg-white shadow-md rounded mt-2 py-2 z-50">
                          {specialities.map((speciality) => (
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

                  </div>
                )}
                {user && user.role_id === 5 && (
                  <Link to="/AllAppointments" className="block text-white font-medium hover:text-gray-200">All Appointments</Link>
                )}
              </div>
            </div>
          )}
        </header>

        <main className="flex-grow container min-h-screen" >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
