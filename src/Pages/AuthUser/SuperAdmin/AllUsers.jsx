import { API_BASE_URL } from '../../../config/environment';
import { useContext, useEffect, useState, useCallback } from "react";
import { AppContext } from "../../../Context/AppContext";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Trash2,
  Edit2,
  UserCheck,
  UserX,
  Loader2,
  X,
  Save,
  RefreshCw,
  Copy,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  Phone,
  Mail,
  Calendar,
} from "lucide-react";

const apiUrl = API_BASE_URL;

// Static roles definition (since roles are fixed in the system)
const ROLES = [
  { id: 1, name: "SuperAdmin" },
  { id: 2, name: "SimpleUser" },
  { id: 3, name: "SpecialAdmin" },
  { id: 4, name: "CheckAdmin" },
  { id: 5, name: "RecipientAdmin" },
  { id: 6, name: "Doctor" },
  { id: 7, name: "ContentAdmin" },
];

export default function AllUsers() {
  const { token } = useContext(AppContext);

  // Data state
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState(ROLES);
  const [events, setEvents] = useState([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterEvent, setFilterEvent] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Modal state
  const [editModal, setEditModal] = useState({ open: false, user: null });
  const [assignModal, setAssignModal] = useState({ open: false, user: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, user: null });
  const [bulkAssignModal, setBulkAssignModal] = useState({ open: false });


  // Copy registration link
  const [copied, setCopied] = useState(false);

  // Fetch all data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch users
      const usersRes = await fetch(`${apiUrl}/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!usersRes.ok) {
        throw new Error("Failed to fetch users");
      }
      const usersData = await usersRes.json();
      setUsers(usersData.users || []);

      // Fetch events (only active ones)
      const eventsRes = await fetch(`${apiUrl}/api/events`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!eventsRes.ok) {
        throw new Error("Failed to fetch events");
      }
      const eventsData = await eventsRes.json();
      // Filter only active events (is_active = true and is_archived = false)
      const activeEvents = (eventsData.events || []).filter(
        (event) => event.is_active && !event.is_archived
      );
      setEvents(activeEvents);

      // Try to fetch roles from API, fallback to static roles
      try {
        const rolesRes = await fetch(`${apiUrl}/api/role`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (rolesRes.ok) {
          const rolesData = await rolesRes.json();
          if (rolesData.roles) {
            setRoles(rolesData.roles);
          } else if (Array.isArray(rolesData)) {
            setRoles(rolesData);
          }
          if (rolesData.users && Array.isArray(rolesData.users)) {
            setUsers(rolesData.users);
          }
        }
      } catch (roleErr) {
        console.log("Using static roles");
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      showMessage("خطأ في تحميل البيانات", "error");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Show message helper
  const showMessage = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 4000);
  };

  // Copy registration link
  const copyRegistrationLink = () => {
    const link = `${window.location.origin}/register`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showMessage("تم نسخ رابط التسجيل", "success");
  };

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.includes(searchTerm);

    const matchesRole = filterRole ? user.role_id == filterRole : true;
    const matchesEvent = filterEvent
      ? filterEvent === "unassigned"
        ? !user.event_id
        : user.event_id == filterEvent
      : true;

    return matchesSearch && matchesRole && matchesEvent;
  });

  // Get role name in Arabic
  const getRoleName = (roleId) => {
    const roleNames = {
      1: "مدير عام",
      2: "مستخدم عادي",
      3: "مسؤول الحالات الخاصة",
      4: "مسؤول التخصص",
      5: "مسؤول الإستقبال",
      6: "طبيب",
      7: "مسؤول المحتوى",
    };
    return roleNames[roleId] || "غير محدد";
  };

  // Get role color
  const getRoleColor = (roleId) => {
    const colors = {
      1: "bg-red-100 text-red-800",
      2: "bg-gray-100 text-gray-800",
      3: "bg-purple-100 text-purple-800",
      4: "bg-blue-100 text-blue-800",
      5: "bg-green-100 text-green-800",
      6: "bg-yellow-100 text-yellow-800",
      7: "bg-indigo-100 text-indigo-800",
    };
    return colors[roleId] || "bg-gray-100 text-gray-800";
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setFilterRole("");
    setFilterEvent("");
  };

  const hasActiveFilters = searchTerm || filterRole || filterEvent;

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh]">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
        <p className="mt-4 text-gray-600 font-droid-arabic-kufi">
          جاري تحميل البيانات...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-blue-100 via-blue-50 to-white py-4 sm:py-6 lg:py-10 px-3 sm:px-4 md:px-8 lg:px-16 xl:px-20 font-droid-arabic-kufi">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3">
          <Users className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600 flex-shrink-0" />
          إدارة المستخدمين
        </h1>
        <p className="text-gray-600 mt-1 text-sm sm:text-base">
          إدارة جميع المستخدمين وتعيين الأدوار والأحداث
        </p>
      </div>

      {/* Message Alert */}
      {message.text && (
        <div
          className={`mb-4 p-3 sm:p-4 rounded-lg flex items-center gap-2 text-sm sm:text-base ${
            message.type === "error"
              ? "bg-red-100 text-red-800"
              : "bg-green-100 text-green-800"
          }`}
        >
          {message.type === "error" ? (
            <AlertCircle size={18} className="flex-shrink-0" />
          ) : (
            <CheckCircle size={18} className="flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Registration Link Card */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 text-white shadow-lg">
        <div className="flex flex-col gap-3 sm:gap-4">
          <div>
            <h2 className="text-base sm:text-xl font-bold flex items-center gap-2">
              <UserPlus size={20} className="sm:w-6 sm:h-6 flex-shrink-0" />
              رابط التسجيل للمستخدمين الجدد
            </h2>
            <p className="text-indigo-100 mt-1 text-xs sm:text-sm">
              شارك هذا الرابط مع الأشخاص الذين تريد إضافتهم كمسؤولين
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <code className="bg-white/20 px-3 py-2 rounded-lg text-xs sm:text-sm break-all flex-1 overflow-x-auto">
              {window.location.origin}/register
            </code>
            <button
              onClick={copyRegistrationLink}
              className="bg-white text-indigo-600 px-4 py-2 rounded-lg font-medium hover:bg-indigo-50 transition flex items-center justify-center gap-2 text-sm sm:text-base whitespace-nowrap"
            >
              {copied ? <CheckCircle size={18} /> : <Copy size={18} />}
              {copied ? "تم النسخ" : "نسخ الرابط"}
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Assign Event Card */}
      <div className="bg-gradient-to-r from-green-500 to-teal-600 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-xl font-bold flex items-center gap-2">
              <Calendar size={20} className="sm:w-6 sm:h-6 flex-shrink-0" />
              تعيين حدث لجميع المستخدمين
            </h2>
            <p className="text-green-100 mt-1 text-xs sm:text-sm">
              مفيد للتدريب - تعيين حدث واحد لجميع المستخدمين مع الحفاظ على أدوارهم
            </p>
          </div>
          <button
            onClick={() => setBulkAssignModal({ open: true })}
            className="bg-white text-green-600 px-4 py-2 rounded-lg font-medium hover:bg-green-50 transition flex items-center justify-center gap-2 text-sm sm:text-base whitespace-nowrap w-full sm:w-auto"
          >
            <UserCheck size={18} />
            تعيين الكل
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 mb-4 sm:mb-6">
        {/* Search Bar & Mobile Toggle */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="بحث بالاسم أو البريد أو الهاتف..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-4 pl-10 py-2 sm:py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm sm:text-base"
            />
          </div>

          {/* Mobile: Filter toggle & Refresh */}
          <div className="flex gap-2 sm:hidden">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition text-sm ${
                showFilters || hasActiveFilters
                  ? "bg-indigo-100 text-indigo-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              <Filter size={16} />
              فلترة
              {hasActiveFilters && (
                <span className="w-2 h-2 bg-indigo-600 rounded-full"></span>
              )}
            </button>
            <button
              onClick={fetchData}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
            >
              <RefreshCw size={16} />
            </button>
          </div>

          {/* Desktop: Inline filters */}
          <div className="hidden sm:flex gap-2 sm:gap-3">
            {/* Role Filter */}
            <div className="relative">
              <Filter
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={16}
              />
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="pr-9 pl-8 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 appearance-none bg-white min-w-[150px] lg:min-w-[180px] text-sm"
              >
                <option value="">كل الأدوار</option>
                {roles
                  .filter((r) => r.name !== "SuperAdmin")
                  .map((role) => (
                    <option key={role.id} value={role.id}>
                      {getRoleName(role.id)}
                    </option>
                  ))}
              </select>
              <ChevronDown
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={16}
              />
            </div>

            {/* Event Filter */}
            <div className="relative">
              <select
                value={filterEvent}
                onChange={(e) => setFilterEvent(e.target.value)}
                className="pr-4 pl-8 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 appearance-none bg-white min-w-[150px] lg:min-w-[180px] text-sm"
              >
                <option value="">كل الأحداث</option>
                <option value="unassigned">غير معين</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={16}
              />
            </div>

            {/* Refresh */}
            <button
              onClick={fetchData}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition text-sm"
            >
              <RefreshCw size={16} />
              <span className="hidden lg:inline">تحديث</span>
            </button>
          </div>
        </div>

        {/* Mobile: Expandable filters */}
        {showFilters && (
          <div className="sm:hidden mt-3 pt-3 border-t border-gray-100 space-y-3">
            <div className="relative">
              <label className="block text-xs text-gray-500 mb-1">الدور</label>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full pr-4 pl-8 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 appearance-none bg-white text-sm"
              >
                <option value="">كل الأدوار</option>
                {roles
                  .filter((r) => r.name !== "SuperAdmin")
                  .map((role) => (
                    <option key={role.id} value={role.id}>
                      {getRoleName(role.id)}
                    </option>
                  ))}
              </select>
              <ChevronDown
                className="absolute left-3 bottom-3 text-gray-400"
                size={16}
              />
            </div>

            <div className="relative">
              <label className="block text-xs text-gray-500 mb-1">الحدث</label>
              <select
                value={filterEvent}
                onChange={(e) => setFilterEvent(e.target.value)}
                className="w-full pr-4 pl-8 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 appearance-none bg-white text-sm"
              >
                <option value="">كل الأحداث</option>
                <option value="unassigned">غير معين</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="absolute left-3 bottom-3 text-gray-400"
                size={16}
              />
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="w-full py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                مسح جميع الفلاتر
              </button>
            )}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100">
          <div className="text-xl sm:text-2xl font-bold text-indigo-600">
            {users.length}
          </div>
          <div className="text-gray-600 text-xs sm:text-sm">
            إجمالي المستخدمين
          </div>
        </div>
        <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100">
          <div className="text-xl sm:text-2xl font-bold text-green-600">
            {users.filter((u) => u.event_id).length}
          </div>
          <div className="text-gray-600 text-xs sm:text-sm">معينين لأحداث</div>
        </div>
        <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100">
          <div className="text-xl sm:text-2xl font-bold text-yellow-600">
            {users.filter((u) => !u.event_id && u.role_id !== 1).length}
          </div>
          <div className="text-gray-600 text-xs sm:text-sm">غير معينين</div>
        </div>
        <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100">
          <div className="text-xl sm:text-2xl font-bold text-purple-600">
            {users.filter((u) => [3, 4, 5].includes(u.role_id)).length}
          </div>
          <div className="text-gray-600 text-xs sm:text-sm">مسؤولين</div>
        </div>
      </div>

      {/* Results count */}
      {hasActiveFilters && (
        <div className="mb-3 text-sm text-gray-600">
          عدد النتائج: {filteredUsers.length} من {users.length}
        </div>
      )}

      {/* Users - Desktop Table / Mobile Cards */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 table-fixed text-center">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-[350px] lg:w-[350px] px-3 lg:px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المستخدم
                </th>
                <th className="w-[2000px] lg:w-[210px] px-2 lg:px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الهاتف
                </th>
                <th className="w-[190px] lg:w-[210px] px-2 lg:px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الدور
                </th>
                <th className="px-3 lg:px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الحدث
                </th>
                <th className="w-[150px] px-1 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  إجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    لا توجد نتائج مطابقة للبحث
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition">
                    <td className="px-3 lg:px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs lg:text-sm flex-shrink-0">
                          {user.name?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                        <span className="font-medium text-gray-900 text-sm truncate" title={user.name}>
                          {user.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-2 lg:px-3 py-3 whitespace-nowrap text-gray-600 text-xs lg:text-sm">
                      <span dir="ltr">{user.phone || "-"}</span>
                    </td>
                    <td className="px-2 lg:px-3 py-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleColor(
                          user.role_id
                        )}`}
                      >
                        {getRoleName(user.role_id)}
                      </span>
                    </td>
                    <td className="px-3 lg:px-4 py-3 text-sm">
                      {user.event ? (
                        <span className="text-gray-900 line-clamp-1" title={user.event.name}>
                          {user.event.name}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">غير معين</span>
                      )}
                    </td>
                    <td className="px-1 py-3 whitespace-nowrap">
                      {user.role_id !== 1 && (
                        <div className="flex items-center justify-center gap-0">
                          <button
                            onClick={() =>
                              setAssignModal({ open: true, user })
                            }
                            className="p-1 text-indigo-600 mx-2 hover:bg-indigo-50 rounded transition"
                            title="تعيين"
                          >
                            <UserCheck size={20} />
                          </button>
                          <button
                            onClick={() => setEditModal({ open: true, user })}
                            className="p-1 text-blue-600 mx-2 hover:bg-blue-50 rounded transition"
                            title="تعديل"
                          >
                            <Edit2 size={20} />
                          </button>
                          <button
                            onClick={() =>
                              setDeleteModal({ open: true, user })
                            }
                            className="p-1 text-red-600 mx-2 hover:bg-red-50 rounded transition"
                            title="حذف"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-gray-100">
          {filteredUsers.length === 0 ? (
            <div className="px-4 py-12 text-center text-gray-500">
              لا توجد نتائج مطابقة للبحث
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div key={user.id} className="p-4">
                {/* User Header */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold flex-shrink-0">
                    {user.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-gray-900 truncate">
                      {user.name}
                    </div>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${getRoleColor(
                        user.role_id
                      )}`}
                    >
                      {getRoleName(user.role_id)}
                    </span>
                  </div>
                </div>

                {/* User Details */}
                <div className="space-y-2 text-sm mb-3">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail size={14} className="flex-shrink-0 text-gray-400" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  {user.phone && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone size={14} className="flex-shrink-0 text-gray-400" />
                      <span dir="ltr">{user.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar
                      size={14}
                      className="flex-shrink-0 text-gray-400"
                    />
                    <span>
                      {user.event ? (
                        user.event.name
                      ) : (
                        <span className="text-gray-400">غير معين لحدث</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                {user.role_id !== 1 && (
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => setAssignModal({ open: true, user })}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition text-sm font-medium"
                    >
                      <UserCheck size={16} />
                      تعيين
                    </button>
                    <button
                      onClick={() => setEditModal({ open: true, user })}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition text-sm font-medium"
                    >
                      <Edit2 size={16} />
                      تعديل
                    </button>
                    <button
                      onClick={() => setDeleteModal({ open: true, user })}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition text-sm font-medium"
                    >
                      <Trash2 size={16} />
                      حذف
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editModal.open && (
        <EditUserModal
          user={editModal.user}
          token={token}
          onClose={() => setEditModal({ open: false, user: null })}
          onSuccess={() => {
            fetchData();
            showMessage("تم تحديث بيانات المستخدم بنجاح");
          }}
          onError={(msg) => showMessage(msg, "error")}
        />
      )}

      {/* Assign Modal */}
      {assignModal.open && (
        <AssignUserModal
          user={assignModal.user}
          roles={roles}
          events={events}
          token={token}
          onClose={() => setAssignModal({ open: false, user: null })}
          onSuccess={() => {
            fetchData();
            showMessage("تم تعيين المستخدم بنجاح");
          }}
          onError={(msg) => showMessage(msg, "error")}
          getRoleName={getRoleName}
        />
      )}

      {/* Delete Modal */}
      {deleteModal.open && (
        <DeleteUserModal
          user={deleteModal.user}
          token={token}
          onClose={() => setDeleteModal({ open: false, user: null })}
          onSuccess={() => {
            fetchData();
            showMessage("تم حذف المستخدم بنجاح");
          }}
          onError={(msg) => showMessage(msg, "error")}
        />
      )}


      
    {/* Bulk Assign Event Modal */}
  {bulkAssignModal.open && (
    <BulkAssignEventModal
      events={events}
      token={token}
      onClose={() => setBulkAssignModal({ open: false })}
      onSuccess={() => {
        fetchData();
        showMessage("تم تعيين الحدث لجميع المستخدمين بنجاح");
      }}
      onError={(msg) => showMessage(msg, "error")}
    />
  )}
    </div>
  );
}

// Edit User Modal Component
function EditUserModal({ user, token, onClose, onSuccess, onError }) {
  const [form, setForm] = useState({
    name: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;

      const res = await fetch(`${apiUrl}/api/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        onError(data.message || "فشل تحديث البيانات");
      }
    } catch (err) {
      onError("خطأ في الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto font-droid-arabic-kufi">
        <div className="flex items-center justify-between p-3 sm:p-4 border-b sticky top-0 bg-white z-10">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
            <Edit2 size={18} className="text-blue-600" />
            تعديل بيانات المستخدم
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-3 sm:p-4 space-y-3 sm:space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              الاسم
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full p-2.5 sm:p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm sm:text-base"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              البريد الإلكتروني
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full p-2.5 sm:p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm sm:text-base"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              الهاتف
            </label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full p-2.5 sm:p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm sm:text-base"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              كلمة المرور الجديدة (اختياري)
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full p-2.5 sm:p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm sm:text-base"
              placeholder="اتركه فارغاً للإبقاء على كلمة المرور الحالية"
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2.5 sm:py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition text-sm sm:text-base"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2.5 sm:py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Save size={18} />
              )}
              حفظ التغييرات
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Assign User Modal Component
function AssignUserModal({
  user,
  roles,
  events,
  token,
  onClose,
  onSuccess,
  onError,
  getRoleName,
}) {
  // Auto-select first event if user has no event assigned
  const defaultEventId =
    user.event_id || (events.length > 0 ? events[0].id : "");

  const [form, setForm] = useState({
    event_id: defaultEventId,
    role_id: user.role_id || 2,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${apiUrl}/api/users/${user.id}/assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        onError(data.message || "فشل تعيين المستخدم");
      }
    } catch (err) {
      onError("خطأ في الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  };

  const handleUnassign = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/users/${user.id}/unassign`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        onError(data.message || "فشل إلغاء التعيين");
      }
    } catch (err) {
      onError("خطأ في الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto font-droid-arabic-kufi">
        <div className="flex items-center justify-between p-3 sm:p-4 border-b sticky top-0 bg-white z-10">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
            <UserCheck size={18} className="text-indigo-600" />
            تعيين المستخدم
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-3 sm:p-4 space-y-3 sm:space-y-4">
          {/* User Info */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="font-medium text-gray-900 text-sm sm:text-base">
              {user.name}
            </div>
            <div className="text-xs sm:text-sm text-gray-500 truncate">
              {user.email}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              الحدث النشط
            </label>
            {events.length === 0 ? (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-xs sm:text-sm">
                لا توجد أحداث نشطة حالياً
              </div>
            ) : (
              <select
                value={form.event_id}
                onChange={(e) =>
                  setForm({ ...form, event_id: e.target.value })
                }
                className="w-full p-2.5 sm:p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-sm sm:text-base"
              >
                <option value="">بدون حدث</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              الدور
            </label>
            <select
              value={form.role_id}
              onChange={(e) => setForm({ ...form, role_id: e.target.value })}
              className="w-full p-2.5 sm:p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-sm sm:text-base"
              required
            >
              {roles
                .filter((r) => r.name !== "SuperAdmin")
                .map((role) => (
                  <option key={role.id} value={role.id}>
                    {getRoleName(role.id)}
                  </option>
                ))}
            </select>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 text-white py-2.5 sm:py-3 rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <UserCheck size={18} />
              )}
              تعيين
            </button>
            {user.event_id && (
              <button
                type="button"
                onClick={handleUnassign}
                disabled={loading}
                className="w-full sm:w-auto px-4 py-2.5 sm:py-3 bg-yellow-100 text-yellow-700 rounded-lg font-medium hover:bg-yellow-200 transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <UserX size={18} />
                إلغاء التعيين
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

  // Delete User Modal Component
  function DeleteUserModal({ user, token, onClose, onSuccess, onError }) {
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
      setLoading(true);

      try {
        const res = await fetch(`${apiUrl}/api/users/${user.id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (res.ok) {
          onSuccess();
          onClose();
        } else {
          onError(data.message || "فشل حذف المستخدم");
        }
      } catch (err) {
        onError("خطأ في الاتصال بالخادم");
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-sm font-droid-arabic-kufi">
          <div className="p-4 sm:p-6 text-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={28} className="sm:w-8 sm:h-8 text-red-600" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">
              حذف المستخدم
            </h3>
            <p className="text-gray-600 mb-2 text-sm sm:text-base">
              هل أنت متأكد من حذف المستخدم؟
            </p>
            <p className="font-medium text-gray-900 mb-3 sm:mb-4 truncate px-2">
              {user.name}
            </p>
            <p className="text-xs sm:text-sm text-red-600 mb-4 sm:mb-6">
              لا يمكن التراجع عن هذا الإجراء
            </p>

            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={onClose}
                className="flex-1 bg-gray-100 text-gray-700 py-2.5 sm:py-3 rounded-lg font-medium hover:bg-gray-200 transition text-sm sm:text-base"
              >
                إلغاء
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 bg-red-600 text-white py-2.5 sm:py-3 rounded-lg font-medium hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <Trash2 size={18} />
                )}
                نعم، احذف
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
// Bulk Assign Event Modal Component
function BulkAssignEventModal({ events, token, onClose, onSuccess, onError }) {
  const [selectedEventId, setSelectedEventId] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);

  const handlePreview = () => {
    const event = events.find(e => e.id == selectedEventId);
    if (event) {
      setPreview(event);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedEventId) {
      onError("يرجى اختيار حدث");
      return;
    }

    const confirmed = window.confirm(
      `هل أنت متأكد من تعيين الحدث "${preview?.name || 'المحدد'}" لجميع المستخدمين؟\n\n` +
      `سيتم تعيين هذا الحدث لجميع المستخدمين (عدا المدير العام) مع الحفاظ على أدوارهم الحالية.`
    );

    if (!confirmed) return;

    setLoading(true);

    try {
      const res = await fetch(`${apiUrl}/api/events/${selectedEventId}/assign-to-all-users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        onError(data.message || "فشل تعيين الحدث");
      }
    } catch (err) {
      onError("خطأ في الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto font-droid-arabic-kufi">
        <div className="flex items-center justify-between p-3 sm:p-4 border-b sticky top-0 bg-white z-10">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
            <UserCheck size={18} className="text-green-600" />
            تعيين حدث لجميع المستخدمين
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-3 sm:p-4 space-y-3 sm:space-y-4">
          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
            <div className="flex items-start gap-2">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium mb-1">ملاحظة مهمة:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>سيتم تعيين الحدث لجميع المستخدمين</li>
                  <li>سيتم الحفاظ على أدوار المستخدمين الحالية</li>
                  <li>لن يتم تعيين المدير العام (SuperAdmin)</li>
                  <li>مفيد للتدريب باستخدام الحدث التجريبي</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              اختر الحدث <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedEventId}
              onChange={(e) => {
                setSelectedEventId(e.target.value);
                setPreview(null);
              }}
              className="w-full p-2.5 sm:p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white text-sm sm:text-base"
              required
            >
              <option value="">-- اختر حدثاً --</option>
              <optgroup label="الأحداث النشطة">
                {events
                  .filter(e => e.is_active && !e.is_archived)
                  .map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.name} {event.id === 2 ? "(تجريبي)" : ""}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="الأحداث المؤرشفة">
                {events
                  .filter(e => e.is_archived)
                  .map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.name} (مؤرشف)
                    </option>
                  ))}
              </optgroup>
            </select>
          </div>

          {selectedEventId && !preview && (
            <button
              type="button"
              onClick={handlePreview}
              className="w-full py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition"
            >
              عرض تفاصيل الحدث
            </button>
          )}

          {preview && (
            <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">اسم الحدث:</span>
                <span className="font-medium text-gray-900">{preview.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">الحالة:</span>
                <span className={`font-medium ${preview.is_active ? 'text-green-600' : 'text-gray-500'}`}>
                  {preview.is_active ? 'نشط' : 'غير نشط'}
                </span>
              </div>
              {preview.is_archived && (
                <div className="flex justify-between">
                  <span className="text-gray-600">مؤرشف:</span>
                  <span className="font-medium text-orange-600">نعم</span>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2.5 sm:py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition text-sm sm:text-base"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading || !selectedEventId}
              className="flex-1 bg-green-600 text-white py-2.5 sm:py-3 rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <UserCheck size={18} />
              )}
              تعيين للجميع
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}