import React, { useState, useEffect, useContext, useRef } from "react";
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
  ChevronDown,
  Activity,
  Home,
} from "lucide-react";
import { AppContext } from "../../Context/AppContext"; // Adjust path as needed

const apiUrl = import.meta.env.VITE_API_URL;

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
  const [isEventTrackingOpen, setIsEventTrackingOpen] = useState(false);

  // 💻 Desktop dropdowns
  const [isGeneralDesktopOpen, setIsGeneralDesktopOpen] = useState(false);
  const [isEventTrackingDesktopOpen, setIsEventTrackingDesktopOpen] = useState(false);

  // Events state
  const [events, setEvents] = useState([]);
  const { token } = useContext(AppContext);

  // 🔗 Refs for click outside detection
  const eventTrackingDesktopRef = useRef(null);
  const generalDesktopRef = useRef(null);
  const moreMenuRef = useRef(null);
  const eventTrackingMobileRef = useRef(null);
  const generalMobileRef = useRef(null);

  // Fetch all events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/events`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setEvents(data.events || []);
      } catch (err) {
        console.error("Error fetching events:", err);
      }
    };

    if (token) {
      fetchEvents();
    }
  }, [token]);

  // 🖱️ Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Desktop dropdowns
      if (
        eventTrackingDesktopRef.current &&
        !eventTrackingDesktopRef.current.contains(event.target)
      ) {
        setIsEventTrackingDesktopOpen(false);
      }
      if (
        generalDesktopRef.current &&
        !generalDesktopRef.current.contains(event.target)
      ) {
        setIsGeneralDesktopOpen(false);
      }
      // Mobile dropdowns
      if (
        moreMenuRef.current &&
        !moreMenuRef.current.contains(event.target)
      ) {
        setIsMoreMenuOpen(false);
      }
      if (
        eventTrackingMobileRef.current &&
        !eventTrackingMobileRef.current.contains(event.target)
      ) {
        setIsEventTrackingOpen(false);
      }
      if (
        generalMobileRef.current &&
        !generalMobileRef.current.contains(event.target)
      ) {
        setIsGeneralMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Shortened text for compact display
  const navItems = [
    { icon: Home, text: "الرئيسية", href: "/home", roles: [1, 2, 3, 4, 5] },
    { icon: Calendar, text: "الفعاليات", href: "/admin/manage-events", roles: [1] },
    { icon: Users, text: "المستخدمين", href: "/admin/users", roles: [1] },
    { icon: Plus, text: "إضافة مواعيد", href: "/admin/add-multiple-appointments", roles: [1] },
    { icon: FileText, text: "التخصصات", href: "/admin/speciality", roles: [1] },
  ];

  const filteredItems = navItems.filter((item) => item.roles.includes(user?.role_id));

  // 🖥️ DESKTOP VERSION
  if (!mobile) {
    const itemsToShow = user?.role_id === 1 ? filteredItems : filteredItems.slice(0, 3);
    return (
      <div className="flex items-center gap-0.5 lg:gap-1 xl:gap-1.5 2xl:gap-2">
        {/* Regular visible links */}
        {itemsToShow.map((item, idx) => (
          <Link
            key={idx}
            to={item.href}
            className="flex items-center gap-1 lg:gap-1.5 px-2 lg:px-2.5 xl:px-3 2xl:px-4 py-1.5 lg:py-2 xl:py-2.5 text-[#2F3645] hover:bg-[#131842] hover:text-white rounded-full transition-all duration-200 font-medium whitespace-nowrap"
          >
            <item.icon className="w-3.5 h-3.5 lg:w-4 lg:h-4 flex-shrink-0" />
            <span className="text-[10px] lg:text-[11px] xl:text-xs 2xl:text-sm font-droid-arabic-kufi">{item.text}</span>
          </Link>
        ))}

        {/* متابعة الأحداث (Event Tracking) Dropdown */}
        {user?.role_id === 1 && (
          <div className="relative" ref={eventTrackingDesktopRef}>
            <button
              onClick={() => {
                setIsEventTrackingDesktopOpen(!isEventTrackingDesktopOpen);
                setIsGeneralDesktopOpen(false);
              }}
              className="flex items-center gap-1 lg:gap-1.5 px-2 lg:px-2.5 xl:px-3 2xl:px-4 py-1.5 lg:py-2 xl:py-2.5 text-[#2F3645] hover:bg-[#131842] hover:text-white rounded-full transition-all duration-200 font-medium whitespace-nowrap"
            >
              <Activity className="w-3.5 h-3.5 lg:w-4 lg:h-4 flex-shrink-0" />
              <span className="text-[10px] lg:text-[11px] xl:text-xs 2xl:text-sm font-droid-arabic-kufi">متابعة</span>
              <ChevronDown
                className={`w-3 h-3 transition-transform flex-shrink-0 ${isEventTrackingDesktopOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isEventTrackingDesktopOpen && (
              <div className="absolute right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-56 max-h-96 overflow-y-auto">
                {events.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-500 font-droid-arabic-kufi text-center">
                    لا توجد أحداث
                  </div>
                ) : (
                  events.map((event) => (
                    <Link
                      key={event.id}
                      to={`/admin/event-tracking/${event.id}`}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 font-droid-arabic-kufi border-b border-gray-100 last:border-0"
                      onClick={() => setIsEventTrackingDesktopOpen(false)}
                    >
                      <div className="flex items-center justify-between">
                        <span>{event.name}</span>
                        {event.is_current && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            نشط
                          </span>
                        )}
                        {event.is_archived && (
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                            مؤرشف
                          </span>
                        )}
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* إدارة عامة (General Management) Dropdown */}
        {user?.role_id === 1 && (
          <div className="relative" ref={generalDesktopRef}>
            <button
              onClick={() => {
                setIsGeneralDesktopOpen(!isGeneralDesktopOpen);
                setIsEventTrackingDesktopOpen(false);
              }}
              className="flex items-center gap-1 lg:gap-1.5 px-2 lg:px-2.5 xl:px-3 2xl:px-4 py-1.5 lg:py-2 xl:py-2.5 text-[#2F3645] hover:bg-[#131842] hover:text-white rounded-full transition-all duration-200 font-medium whitespace-nowrap"
            >
              <Settings className="w-3.5 h-3.5 lg:w-4 lg:h-4 flex-shrink-0" />
              <span className="text-[10px] lg:text-[11px] xl:text-xs 2xl:text-sm font-droid-arabic-kufi">إدارة</span>
              <ChevronDown
                className={`w-3 h-3 transition-transform flex-shrink-0 ${isGeneralDesktopOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isGeneralDesktopOpen && (
              <div className="absolute right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-56">
                <Link
                  to="/admin/rules"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 font-droid-arabic-kufi border-b border-gray-100"
                  onClick={() => setIsGeneralDesktopOpen(false)}
                >
                  التحكم في الضوابط
                </Link>
                <Link
                  to="/admin/contacts"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 font-droid-arabic-kufi border-b border-gray-100"
                  onClick={() => setIsGeneralDesktopOpen(false)}
                >
                  الإتصالات
                </Link>
                <Link
                  to="/admin/volunteers"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 font-droid-arabic-kufi"
                  onClick={() => setIsGeneralDesktopOpen(false)}
                >
                  المتطوعون
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // 📱 MOBILE VERSION
  const mainMobileLinks = filteredItems.slice(0, 3);
  const moreMobileLinks = filteredItems.slice(3);

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
        <div className="pt-2 mt-2" ref={moreMenuRef}>
          <button
            onClick={() => {
              setIsMoreMenuOpen(!isMoreMenuOpen);
              setIsEventTrackingOpen(false);
              setIsGeneralMenuOpen(false);
            }}
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

      {/* متابعة الأحداث (Event Tracking) Mobile */}
      {user?.role_id === 1 && (
        <div className="pt-2 mt-2" ref={eventTrackingMobileRef}>
          <button
            onClick={() => {
              setIsEventTrackingOpen(!isEventTrackingOpen);
              setIsMoreMenuOpen(false);
              setIsGeneralMenuOpen(false);
            }}
            className="w-full flex items-center justify-between px-4 py-3 text-[#2F3645] hover:bg-gray-100 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5" />
              <span className="font-medium text-sm font-droid-arabic-kufi">متابعة الأحداث</span>
            </div>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${isEventTrackingOpen ? "rotate-180" : ""}`}
            />
          </button>

          {isEventTrackingOpen && (
            <div className="mt-1 flex flex-col space-y-1 bg-gray-50 rounded-lg p-2 max-h-60 overflow-y-auto">
              {events.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500 font-droid-arabic-kufi text-center">
                  لا توجد أحداث
                </div>
              ) : (
                events.map((event) => (
                  <Link
                    key={event.id}
                    to={`/admin/event-tracking/${event.id}`}
                    className="flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg font-droid-arabic-kufi"
                    onClick={() => setIsEventTrackingOpen(false)}
                  >
                    <span>{event.name}</span>
                    {event.is_active && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        نشط
                      </span>
                    )}
                    {event.is_archived && (
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                        مؤرشف
                      </span>
                    )}
                  </Link>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* إدارة عامة (General Management) */}
      {user && user.role_id === 1 && (
        <div className="pt-2 mt-2" ref={generalMobileRef}>
          <button
            onClick={() => {
              setIsGeneralMenuOpen(!isGeneralMenuOpen);
              setIsMoreMenuOpen(false);
              setIsEventTrackingOpen(false);
            }}
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
              <Link
                to="/admin/rules"
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg font-droid-arabic-kufi"
                onClick={() => setIsGeneralMenuOpen(false)}
              >
                <FileText className="w-4 h-4 flex-shrink-0" />
                <span>التحكم في الضوابط</span>
              </Link>
              <Link
                to="/admin/contacts"
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg font-droid-arabic-kufi"
                onClick={() => setIsGeneralMenuOpen(false)}
              >
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span>الإتصالات</span>
              </Link>
              <Link
                to="/admin/volunteers"
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg font-droid-arabic-kufi"
                onClick={() => setIsGeneralMenuOpen(false)}
              >
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