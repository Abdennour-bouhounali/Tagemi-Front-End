import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  Users,
  BarChart3,
  Settings,
  FileText,
  LogOut,
  Plus,
  UserCog,
  MoreHorizontal,
  Phone,
  UserPlus,
  Layers,
  Award,
  Target,
  Newspaper,
  ChevronDown,
} from "lucide-react";

const AuthNavBar = ({
  user,
  specialities,
  dropdownRef,
  toggleDropdown,
  isOpen,
  handlelogout,
  mobile = false,
}) => {
  // 📱 Mobile dropdowns
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isWaitingListOpen, setIsWaitingListOpen] = useState(false);
  const [isGeneralMenuOpen, setIsGeneralMenuOpen] = useState(false);

  // 💻 Desktop dropdowns
  const [isGeneralDesktopOpen, setIsGeneralDesktopOpen] = useState(false);

  const navItems = [
    { icon: Calendar, text: "أحجز موعدا", href: "/appointment", roles: [1, 2, 3, 4, 5, 6] },
    { icon: Users, text: "قائمة الإنتظار الكبيرة", href: "/GeneralWaitingList", roles: [1, 2, 3, 4, 5, 6] },
    { icon: Calendar, text: "جميع المواعيد", href: "/AllAppointments", roles: [1, 3, 5] },
    { icon: Plus, text: "إضافة مواعيد متعددة", href: "/AddMultipleAppointments", roles: [1] },
    { icon: UserCog, text: "تسيير الأعضاء", href: "/users", roles: [1] },
    { icon: FileText, text: "تسيير التخصصات", href: "/speciality", roles: [1] },
    { icon: BarChart3, text: "إحصائيات", href: "/Statitistics", roles: [1] },
    { icon: Calendar, text: "تسيير الفعاليات", href: "/manageEvents", roles: [1] },
  ];

  const filteredItems = navItems.filter((item) => item.roles.includes(user?.role_id));

  // 🖥️ DESKTOP VERSION
  if (!mobile) {
    const itemsToShow = user?.role_id === 1 ? filteredItems : filteredItems.slice(0,3);
    return (
      <>
        {/* Regular visible links */}
        {itemsToShow.map((item, idx) => (
          <Link
            key={idx}
            to={item.href}
            className="flex items-center gap-2 px-4 py-2 text-[#2F3645] hover:bg-[#131842] hover:text-white rounded-full transition-all duration-200 font-medium"
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm font-droid-arabic-kufi whitespace-nowrap">{item.text}</span>
          </Link>
        ))}

        {/* إدارة عامة (General Management) Dropdown */}
        {user?.role_id === 1 && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsGeneralDesktopOpen(!isGeneralDesktopOpen)}
              className="flex items-center gap-2 px-4 py-2 text-[#2F3645] hover:bg-[#131842] hover:text-white rounded-full transition-all duration-200 font-medium"
            >
              <Settings className="w-4 h-4" />
              <span className="text-sm font-droid-arabic-kufi">إدارة عامة</span>
              <ChevronDown
                className={`w-3 h-3 transition-transform ${isGeneralDesktopOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isGeneralDesktopOpen && (
              <div className="absolute right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-56">
                <Link
                  to="/settings"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 font-droid-arabic-kufi"
                >
                  إعدادات عامة
                </Link>
                <Link
                  to="/rules"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 font-droid-arabic-kufi"
                >
                  التحكم في الضوابط
                </Link>
                <Link
                  to="/contacts"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 font-droid-arabic-kufi"
                >
                  الإتصالات
                </Link>
                <Link
                  to="/voulenteers"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 font-droid-arabic-kufi"
                >
                  المتطوعون
                </Link>
              </div>
            )}
          </div>
        )}

        {/* لوائح الإنتظار (Waiting List) Dropdown */}
        {(user && [1, 4, 6].includes(user.role_id)) && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={toggleDropdown}
              className="flex items-center gap-2 px-4 py-2 text-[#2F3645] hover:bg-[#131842] hover:text-white rounded-full transition-all duration-200 font-medium"
            >
              <Users className="w-4 h-4" />
              <span className="text-sm font-droid-arabic-kufi">لوائح الإنتظار</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen && (
              <div className="absolute right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-56">
                {specialities
                  .filter((s) => s.id !== 6)
                  .map((speciality) => (
                    <Link
                      key={speciality.id}
                      to={`/WaitingList/${speciality.id}`}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 font-droid-arabic-kufi"
                    >
                      {speciality.name}
                    </Link>
                  ))}
              </div>
            )}
          </div>
        )}
      </>
    );
  }

  // 📱 MOBILE VERSION
  const mainMobileLinks = filteredItems.slice(0, 2);
  const moreMobileLinks = filteredItems.slice(2);

  return (
    <div className="flex flex-col space-y-2 w-full">
      {/* Main links */}
      {mainMobileLinks.map((item, idx) => (
        <Link
          key={idx}
          to={item.href}
          className="flex items-center gap-3 px-4 py-3 text-[#2F3645] hover:bg-[#131842] hover:text-white rounded-lg transition-all duration-200 active:scale-95"
        >
          <item.icon className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium text-sm font-droid-arabic-kufi">{item.text}</span>
        </Link>
      ))}

      {/* المزيد (More) */}
      {moreMobileLinks.length > 0 && (
        <div className="pt-2 mt-2">
          <button
            onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
            className="w-full flex items-center justify-between px-4 py-3 text-[#2F3645] hover:bg-gray-100 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-3">
              <MoreHorizontal className="w-5 h-5" />
              <span className="font-medium text-sm font-droid-arabic-kufi">المزيد</span>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform ${isMoreMenuOpen ? "rotate-180" : ""}`} />
          </button>

          {isMoreMenuOpen && (
            <div className="mt-1 flex flex-col space-y-1 bg-gray-50 rounded-lg p-2">
              {moreMobileLinks.map((item, idx) => (
                <Link
                  key={idx}
                  to={item.href}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg font-droid-arabic-kufi"
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.text}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

   

      {/* لوائح الإنتظار (Waiting List) */}
      {(user && [1, 4, 6].includes(user.role_id)) && (
        <div className="pt-2 mt-2 flex flex-col space-y-1">
          <button
            onClick={() => setIsWaitingListOpen(!isWaitingListOpen)}
            className="w-full flex items-center justify-between px-4 py-3 text-[#2F3645] hover:bg-gray-100 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5" />
              <span className="font-medium text-sm font-droid-arabic-kufi">لوائح الإنتظار</span>
            </div>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${isWaitingListOpen ? "rotate-180" : ""}`}
            />
          </button>

          {isWaitingListOpen && (
            <div className="mt-1 flex flex-col space-y-1 bg-gray-50 rounded-lg p-2">
              {specialities
                .filter((s) => s.id !== 6)
                .map((speciality) => (
                  <Link
                    key={speciality.id}
                    to={`/WaitingList/${speciality.id}`}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg font-droid-arabic-kufi"
                  >
                    {speciality.name}
                  </Link>
                ))}
            </div>
          )}
        </div>
      )}

   {/* إدارة عامة (General Management) */}
      {(user && user.role_id === 1) && (
        <div className="pt-2 mt-2">
          <button
            onClick={() => setIsGeneralMenuOpen(!isGeneralMenuOpen)}
            className="w-full flex items-center justify-between px-4 py-3 text-[#2F3645] hover:bg-gray-100 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5" />
              <span className="font-medium text-sm font-droid-arabic-kufi">إدارة عامة</span>
            </div>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${isGeneralMenuOpen ? "rotate-180" : ""}`}
            />
          </button>

          {isGeneralMenuOpen && (
            <div className="mt-1 flex flex-col space-y-1 bg-gray-50 rounded-lg p-2">
              <Link to="/settings" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg font-droid-arabic-kufi">
                <Settings className="w-4 h-4 flex-shrink-0" />
                <span>إعدادات عامة</span>
              </Link>
              <Link to="/rules" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg font-droid-arabic-kufi">
                <FileText className="w-4 h-4 flex-shrink-0" />
                <span>التحكم في الضوابط</span>
              </Link>
              <Link to="/contacts" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg font-droid-arabic-kufi">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span>الإتصالات</span>
              </Link>
              <Link to="/voulenteers" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg font-droid-arabic-kufi">
                <UserPlus className="w-4 h-4 flex-shrink-0" />
                <span>المتطوعون</span>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Logout */}
      <button
        onClick={handlelogout}
        className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 w-full mt-2"
      >
        <LogOut className="w-5 h-5 flex-shrink-0" />
        <span className="font-medium text-sm font-droid-arabic-kufi">خروج</span>
      </button>
    </div>
  );
};

export default AuthNavBar;
