import { Link } from "react-router-dom";

const AuthNavBar = ({user,specialities,dropdownRef,toggleDropdown,isOpen}) => {
    return (
        
        <nav className="ml-4 space-y-2">
                {user && (
                  <Link to="/appointment" className="block px-4 py-2 font-medium mx-4 mt-2 text-[#2F3645] hover:bg-[#131842] hover:text-white  rounded-full transition duration-300">أحجز موعدا</Link>

                )}

                {user && user.role_id === 5 && (
                  <Link to="/AllAppointments" className="block px-5 py-2 text-[#2F3645] hover:text-[#131842]  transition duration-300">جميع المواعيد </Link>
                )}

                {user && (user.role_id == 1 ||  user.role_id  == 3) && (<>
                  <Link to="/contacts"  className="block px-5 py-2 text-[#2F3645] font-droid-arabic-kufi hover:text-[#131842]  transition duration-300" >الإتصالات</Link>
                  <Link to="/voulenteers"  className="block px-5 py-2 text-[#2F3645] font-droid-arabic-kufi hover:text-[#131842]  transition duration-300" >المتطوعون</Link>
                  <Link to="/GeneralWaitingList"  className="block px-5 py-2 text-[#2F3645] font-droid-arabic-kufi hover:text-[#131842]  transition duration-300" >قائمة الإنتظار الكبيرة</Link>

                  
</>
)}

                {/* {user && user.role_id === 3 && (
                  <Link to="/specialCase" className="block font-medium px-4 py-2 text-[#2F3645] hover:bg-[#131842] hover:text-white  rounded-full transition duration-300"></Link>
                )} */}

                {user && user.role_id === 4 && (
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
    