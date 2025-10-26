import { Link } from "react-router-dom";
import { Users, Settings, FileText, ChevronDown, Phone, UserPlus, FolderOpen, Layers, Award, Target, Newspaper } from "lucide-react";

const SuperAdminNav = ({ user, specialities, dropdownRef, toggleDropdown, isOpen }) => {
  
  return (
    <nav className="p-4 space-y-1 h-full overflow-y-auto">
      {/* Section Header */}
      <div className="mb-4 pb-4 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-500 px-3 mb-2 font-droid-arabic-kufi">إدارة النظام</h3>
      </div>

      {/* Waiting Lists Dropdown */}
      <div>
        <button
          onClick={toggleDropdown}
          className="w-full flex items-center justify-between px-4 py-3 text-[#2F3645] hover:bg-gray-100 rounded-lg transition-colors"
        >
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5" />
            <span className="font-medium font-droid-arabic-kufi">لوائح الإنتظار</span>
          </div>
          <ChevronDown className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        {isOpen && (
          <div className="mt-2 space-y-1 pr-4">
            {specialities
              .filter(s => s.id !== 6)
              .map((speciality) => (
                <Link
                  key={speciality.id}
                  to={`/WaitingList/${speciality.id}`}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors font-droid-arabic-kufi"
                >
                  {speciality.name}
                </Link>
              ))}
          </div>
        )}
      </div>

      {/* Settings Links */}
      <Link 
        to="/settings" 
        className="flex items-center gap-3 px-4 py-3 text-[#2F3645] hover:bg-[#131842] hover:text-white rounded-lg transition-all duration-200 group"
      >
        <Settings className="w-5 h-5 group-hover:scale-110 transition-transform" />
        <span className="font-medium font-droid-arabic-kufi">إعدادات عامة</span>
      </Link>

      <Link 
        to="/rules" 
        className="flex items-center gap-3 px-4 py-3 text-[#2F3645] hover:bg-[#131842] hover:text-white rounded-lg transition-all duration-200 group"
      >
        <FileText className="w-5 h-5 group-hover:scale-110 transition-transform" />
        <span className="font-medium font-droid-arabic-kufi">التحكم في الضوابط</span>
      </Link>

      <Link 
        to="/contacts" 
        className="flex items-center gap-3 px-4 py-3 text-[#2F3645] hover:bg-[#131842] hover:text-white rounded-lg transition-all duration-200 group"
      >
        <Phone className="w-5 h-5 group-hover:scale-110 transition-transform" />
        <span className="font-medium font-droid-arabic-kufi">الإتصالات</span>
      </Link>

      <Link 
        to="/voulenteers" 
        className="flex items-center gap-3 px-4 py-3 text-[#2F3645] hover:bg-[#131842] hover:text-white rounded-lg transition-all duration-200 group"
      >
        <UserPlus className="w-5 h-5 group-hover:scale-110 transition-transform" />
        <span className="font-medium font-droid-arabic-kufi">المتطوعون</span>
      </Link>

      {/* Content Management Section */}
      <div className="pt-4 border-t border-gray-200 mt-4">
        <div className="px-3 mb-2">
          <h3 className="text-xs font-semibold text-gray-500 font-droid-arabic-kufi">التحكم في محتوى الموقع</h3>
        </div>
        <div className="space-y-1">
          <Link 
            to="/types" 
            className="flex items-center gap-3 px-4 py-3 text-[#2F3645] hover:bg-[#131842] hover:text-white rounded-lg transition-all duration-200 group"
          >
            <Layers className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="font-medium text-sm font-droid-arabic-kufi">مجالات الأنشطة</span>
          </Link>

          <Link 
            to="/activities" 
            className="flex items-center gap-3 px-4 py-3 text-[#2F3645] hover:bg-[#131842] hover:text-white rounded-lg transition-all duration-200 group"
          >
            <FolderOpen className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="font-medium text-sm font-droid-arabic-kufi">الأنشطة</span>
          </Link>

          <Link 
            to="/sponsors" 
            className="flex items-center gap-3 px-4 py-3 text-[#2F3645] hover:bg-[#131842] hover:text-white rounded-lg transition-all duration-200 group"
          >
            <Award className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="font-medium text-sm font-droid-arabic-kufi">الداعمون</span>
          </Link>

          <Link 
            to="/future-projects" 
            className="flex items-center gap-3 px-4 py-3 text-[#2F3645] hover:bg-[#131842] hover:text-white rounded-lg transition-all duration-200 group"
          >
            <Target className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="font-medium text-sm font-droid-arabic-kufi">مشاريع مستقبلية</span>
          </Link>

          <Link 
            to="/blogs" 
            className="flex items-center gap-3 px-4 py-3 text-[#2F3645] hover:bg-[#131842] hover:text-white rounded-lg transition-all duration-200 group"
          >
            <Newspaper className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="font-medium text-sm font-droid-arabic-kufi">مقالات</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default SuperAdminNav;