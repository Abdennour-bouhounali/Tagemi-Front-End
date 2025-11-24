import React, { useEffect, useState, useContext } from 'react';
import * as XLSX from 'xlsx';
const apiUrl = import.meta.env.VITE_API_URL;

import { Filter, Check, X, Trash2, ChevronDown, ChevronUp, Download, Phone, MapPin, MessageSquare, User } from "lucide-react";
import { Select } from '../../Common/FormInputs';
import { AppContext } from "../../../Context/AppContext";

const Messages = () => {
  const { token } = useContext(AppContext);
  const [messages, setMessages] = useState([]);
  const [cityFilter, setCityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [treatedFilter, setTreatedFilter] = useState('');
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [expandedMessage, setExpandedMessage] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = () => {
    setLoading(true);
    fetch(`${apiUrl}/api/contacts`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
      .then((response) => response.json())
      .then((data) => {
        const sortedData = sortMessages(data);
        setMessages(sortedData);
        setFilteredMessages(sortedData);
      })
      .catch((error) => console.error('Error fetching messages:', error))
      .finally(() => setLoading(false));
  };

  const sortMessages = (messagesArray) => {
    return [...messagesArray].sort((a, b) => {
      if (a.treated !== b.treated) {
        return a.treated ? 1 : -1;
      }
      return new Date(b.created_at) - new Date(a.created_at);
    });
  };

  useEffect(() => {
    filterMessages();
  }, [cityFilter, typeFilter, treatedFilter, messages]);

  const filterMessages = () => {
    let filtered = messages;

    if (cityFilter) {
      filtered = filtered.filter((message) =>
        message.wilaya?.toLowerCase().includes(cityFilter.toLowerCase()) ||
        message.state?.toLowerCase().includes(cityFilter.toLowerCase())
      );
    }

    if (typeFilter) {
      filtered = filtered.filter((message) =>
        message.type_message.toLowerCase() === typeFilter.toLowerCase()
      );
    }

    if (treatedFilter !== '') {
      const isTreated = treatedFilter === 'true';
      filtered = filtered.filter((message) => message.treated === isTreated);
    }

    setFilteredMessages(sortMessages(filtered));
  };

  const handleCityChange = (e) => {
    setCityFilter(e.target.value);
  };

  const handleTypeChange = (e) => {
    setTypeFilter(e.target.value);
  };

  const handleTreatedFilterChange = (e) => {
    setTreatedFilter(e.target.value);
  };

  const clearFilters = () => {
    setCityFilter('');
    setTypeFilter('');
    setTreatedFilter('');
  };

  const handleDownloadExcel = () => {
    const dataToExport = filteredMessages.map(msg => ({
      'الإسم': msg.first_name,
      'اللقب': msg.last_name,
      'رقم الهاتف': msg.phone,
      'الولاية': msg.wilaya || msg.state,
      'نوع الرسالة': getTypeLabel(msg.type_message),
      'الرسالة': msg.message,
      'الحالة': msg.treated ? 'معالجة' : 'غير معالجة',
      'تاريخ الإرسال': new Date(msg.created_at).toLocaleDateString('ar-DZ')
    }));
    
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'messages');
    XLSX.writeFile(wb, 'messages.xlsx');
  };

  const handleToggleTreated = (id) => {
    setProcessingId(id);
    fetch(`${apiUrl}/api/contacts/${id}/toggle-treated`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
      .then((response) => response.json())
      .then((data) => {
        const updatedMessages = messages.map((msg) =>
          msg.id === id ? { ...msg, treated: data.contact.treated, treated_at: data.contact.treated_at } : msg
        );
        setMessages(sortMessages(updatedMessages));
      })
      .catch((error) => console.error('Error toggling treated status:', error))
      .finally(() => setProcessingId(null));
  };

  const handleDelete = (id) => {
    fetch(`${apiUrl}/api/contacts/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
      .then(() => {
        setMessages(messages.filter((message) => message.id !== id));
        setFilteredMessages(filteredMessages.filter((message) => message.id !== id));
        setDeleteConfirm(null);
      })
      .catch((error) => console.error('Error deleting message:', error));
  };

  const getTypeLabel = (type) => {
    const types = {
      help: 'مساعدة',
      aide: 'رغبة في تقديم العون',
      project_aide: 'مساهمة في مشروع',
      question: 'إستفسار',
      other: 'أخرى',
    };
    return types[type] || type;
  };

  const getTypeBadgeColor = (type) => {
    const colors = {
      help: 'bg-red-100 text-red-700 border-red-200',
      aide: 'bg-green-100 text-green-700 border-green-200',
      project_aide: 'bg-blue-100 text-blue-700 border-blue-200',
      question: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      other: 'bg-gray-100 text-gray-700 border-gray-200',
    };
    return colors[type] || colors['other'];
  };

  const getRowBackground = (message, index) => {
    if (message.treated) {
      return 'bg-emerald-50 hover:bg-emerald-100';
    }
    return index % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 hover:bg-gray-100';
  };

  const getCardBackground = (message) => {
    if (message.treated) {
      return 'bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200';
    }
    return 'bg-white border-gray-200';
  };

  const totalMessages = messages.length;
  const treatedCount = messages.filter((m) => m.treated).length;
  const untreatedCount = messages.filter((m) => !m.treated).length;

  return (
    <div className="w-full max-w-7xl mx-auto py-4 sm:py-8 px-3 sm:px-4 font-droid-arabic-kufi">
      <div className="w-full">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-droid-arabic-kufi text-gray-800 mb-2">الرسائل</h1>
          <p className="text-sm sm:text-base text-gray-600 font-droid-arabic-kufi">إدارة وعرض جميع الرسائل الواردة</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-white rounded-lg sm:rounded-xl shadow p-3 sm:p-4 text-center">
            <p className="text-lg sm:text-2xl font-bold text-gray-800 font-droid-arabic-kufi">{totalMessages}</p>
            <p className="text-xs sm:text-sm text-gray-600 font-droid-arabic-kufi">إجمالي</p>
          </div>
          <div className="bg-emerald-50 rounded-lg sm:rounded-xl shadow p-3 sm:p-4 text-center border border-emerald-200">
            <p className="text-lg sm:text-2xl font-bold text-emerald-700 font-droid-arabic-kufi">{treatedCount}</p>
            <p className="text-xs sm:text-sm text-emerald-600 font-droid-arabic-kufi">معالجة</p>
          </div>
          <div className="bg-orange-50 rounded-lg sm:rounded-xl shadow p-3 sm:p-4 text-center border border-orange-200">
            <p className="text-lg sm:text-2xl font-bold text-orange-700 font-droid-arabic-kufi">{untreatedCount}</p>
            <p className="text-xs sm:text-sm text-orange-600 font-droid-arabic-kufi">غير معالجة</p>
          </div>
        </div>

        {/* Filters Card */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Search and Type filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-droid-arabic-kufi text-gray-700 mb-1 sm:mb-2">
                  البحث حسب الولاية
                </label>
                <input
                  type="text"
                  placeholder="أدخل اسم الولاية..."
                  value={cityFilter}
                  onChange={handleCityChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors font-droid-arabic-kufi"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-droid-arabic-kufi text-gray-700 mb-1 sm:mb-2">
                  نوع الرسالة
                </label>
                <Select
                  icon={Filter}
                  value={typeFilter}
                  onChange={handleTypeChange}
                  options={[
                    { value: '', label: 'جميع الأنواع' },
                    { value: 'help', label: 'مساعدة' },
                    { value: 'aide', label: 'رغبة في تقديم العون' },
                    { value: 'project_aide', label: 'مساهمة في مشروع' },
                    { value: 'question', label: 'إستفسار' },
                    { value: 'other', label: 'أخرى' },
                  ]}
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-droid-arabic-kufi text-gray-700 mb-1 sm:mb-2">
                  حالة المعالجة
                </label>
                <select
                  value={treatedFilter}
                  onChange={handleTreatedFilterChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors bg-white font-droid-arabic-kufi"
                >
                  <option value="">جميع الحالات</option>
                  <option value="false">غير معالجة</option>
                  <option value="true">معالجة</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {(cityFilter || typeFilter || treatedFilter) && (
                <button
                  onClick={clearFilters}
                  className="flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm sm:text-base font-droid-arabic-kufi rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-gray-400 flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  مسح الفلاتر
                </button>
              )}

              <button
                onClick={handleDownloadExcel}
                className="flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-sm sm:text-base font-droid-arabic-kufi rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 shadow-md flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                تحميل Excel
              </button>
            </div>
          </div>

          {/* Filter Status */}
          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200 flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs sm:text-sm text-gray-600 font-droid-arabic-kufi">
              عرض <span className="font-droid-arabic-kufi text-gray-900 font-bold">{filteredMessages.length}</span> من أصل{' '}
              <span className="font-droid-arabic-kufi text-gray-900 font-bold">{messages.length}</span> رسالة
            </div>
            {(cityFilter || typeFilter || treatedFilter) && (
              <div className="text-xs sm:text-sm text-blue-600 font-medium font-droid-arabic-kufi">تطبيق الفلاتر النشطة</div>
            )}
          </div>
        </div>

        {/* Messages - Desktop Table View */}
        <div className="hidden lg:block bg-white rounded-xl shadow-lg overflow-hidden">
          {loading ? (
            <LoadingState />
          ) : filteredMessages.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-50 to-blue-100 border-b-2 border-blue-200">
                  <tr>
                    <th className="px-4 py-4 text-right text-sm font-droid-arabic-kufi text-gray-700">الحالة</th>
                    <th className="px-4 py-4 text-right text-sm font-droid-arabic-kufi text-gray-700">الإسم</th>
                    <th className="px-4 py-4 text-right text-sm font-droid-arabic-kufi text-gray-700">اللقب</th>
                    <th className="px-4 py-4 text-right text-sm font-droid-arabic-kufi text-gray-700">رقم الهاتف</th>
                    <th className="px-4 py-4 text-right text-sm font-droid-arabic-kufi text-gray-700">الولاية</th>
                    <th className="px-4 py-4 text-right text-sm font-droid-arabic-kufi text-gray-700">نوع الرسالة</th>
                    <th className="px-4 py-4 text-right text-sm font-droid-arabic-kufi text-gray-700">الرسالة</th>
                    <th className="px-4 py-4 text-center text-sm font-droid-arabic-kufi text-gray-700">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredMessages.map((message, index) => (
                    <tr key={message.id} className={`transition-colors ${getRowBackground(message, index)}`}>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => handleToggleTreated(message.id)}
                          disabled={processingId === message.id}
                          className={`p-2 rounded-full transition-all ${
                            message.treated
                              ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                              : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                          } ${processingId === message.id ? 'opacity-50 cursor-wait' : ''}`}
                          title={message.treated ? 'تم المعالجة' : 'غير معالجة'}
                        >
                          {processingId === message.id ? (
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="none"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                              />
                            </svg>
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-800 font-medium font-droid-arabic-kufi">{message.first_name}</td>
                      <td className="px-4 py-4 text-sm text-gray-800 font-medium font-droid-arabic-kufi">{message.last_name}</td>
                      <td className="px-4 py-4 text-sm text-gray-600 font-mono" dir="ltr">
                        {message.phone}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-800 font-droid-arabic-kufi">{message.wilaya || message.state}</td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex px-3 py-1 text-xs font-droid-arabic-kufi rounded-full border ${getTypeBadgeColor(
                            message.type_message
                          )}`}
                        >
                          {getTypeLabel(message.type_message)}
                        </span>
                      </td>
                      <td className="px-4 py-4 max-w-xs">
                        {message.message.length > 50 ? (
                          <div>
                            <p className="text-sm text-gray-700 font-droid-arabic-kufi">
                              {expandedMessage === message.id
                                ? message.message
                                : `${message.message.substring(0, 50)}...`}
                            </p>
                            <button
                              onClick={() => setExpandedMessage(expandedMessage === message.id ? null : message.id)}
                              className="text-blue-600 hover:text-blue-800 text-xs font-medium mt-1 flex items-center gap-1 font-droid-arabic-kufi"
                            >
                              {expandedMessage === message.id ? (
                                <>
                                  <ChevronUp className="w-3 h-3" />
                                  إخفاء
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-3 h-3" />
                                  عرض المزيد
                                </>
                              )}
                            </button>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-700 font-droid-arabic-kufi">{message.message}</p>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={() => setDeleteConfirm(message.id)}
                          className="inline-flex items-center gap-1 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-droid-arabic-kufi rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          حذف
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Messages - Mobile Card View */}
        <div className="lg:hidden space-y-3">
          {loading ? (
            <LoadingState />
          ) : filteredMessages.length === 0 ? (
            <EmptyState />
          ) : (
            filteredMessages.map((message) => (
              <div
                key={message.id}
                className={`rounded-xl shadow-md p-4 border-2 transition-all ${getCardBackground(message)}`}
              >
                {/* Header with name and status */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 font-droid-arabic-kufi">
                        {message.first_name} {message.last_name}
                      </h3>
                      <span
                        className={`inline-flex px-2 py-0.5 text-xs font-droid-arabic-kufi rounded-full border ${getTypeBadgeColor(
                          message.type_message
                        )}`}
                      >
                        {getTypeLabel(message.type_message)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleTreated(message.id)}
                    disabled={processingId === message.id}
                    className={`p-2 rounded-full transition-all ${
                      message.treated
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                    } ${processingId === message.id ? 'opacity-50' : ''}`}
                  >
                    {processingId === message.id ? (
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <Check className="w-5 h-5" />
                    )}
                  </button>
                </div>

                {/* Contact Info */}
                <div className="space-y-2 mb-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600 font-droid-arabic-kufi">
                    <Phone className="w-4 h-4" />
                    <span dir="ltr">{message.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 font-droid-arabic-kufi">
                    <MapPin className="w-4 h-4" />
                    <span>{message.wilaya || message.state}</span>
                  </div>
                </div>

                {/* Message */}
                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                  <div className="flex items-start gap-2">
                    <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      {message.message.length > 100 ? (
                        <div>
                          <p className="text-sm text-gray-700 font-droid-arabic-kufi">
                            {expandedMessage === message.id
                              ? message.message
                              : `${message.message.substring(0, 100)}...`}
                          </p>
                          <button
                            onClick={() => setExpandedMessage(expandedMessage === message.id ? null : message.id)}
                            className="text-blue-600 hover:text-blue-800 text-xs font-medium mt-1 flex items-center gap-1 font-droid-arabic-kufi"
                          >
                            {expandedMessage === message.id ? (
                              <>
                                <ChevronUp className="w-3 h-3" />
                                إخفاء
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-3 h-3" />
                                عرض المزيد
                              </>
                            )}
                          </button>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-700 font-droid-arabic-kufi">{message.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Badge and Delete Button */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-droid-arabic-kufi ${
                      message.treated
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                        : 'bg-orange-100 text-orange-700 border border-orange-300'
                    }`}
                  >
                    {message.treated ? '✓ تم المعالجة' : '⏳ غير معالجة'}
                  </span>
                  <button
                    onClick={() => setDeleteConfirm(message.id)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-droid-arabic-kufi rounded-lg transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    حذف
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-5 sm:p-6 transform animate-scale-in">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-100 flex items-center justify-center ml-3 sm:ml-4">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-droid-arabic-kufi text-gray-900">حذف الرسالة</h3>
                <p className="text-xs sm:text-sm text-gray-500 font-droid-arabic-kufi">لا يمكن التراجع عن هذا الإجراء</p>
              </div>
            </div>
            <p className="text-sm sm:text-base text-gray-600 mb-5 sm:mb-6 font-droid-arabic-kufi">
              هل أنت متأكد من رغبتك في حذف هذه الرسالة نهائياً؟
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 sm:py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm sm:text-base font-droid-arabic-kufi rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                إلغاء
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 px-4 py-2 sm:py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm sm:text-base font-droid-arabic-kufi rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                حذف
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes scale-in {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

// Loading State Component
const LoadingState = () => (
  <div className="text-center py-12 sm:py-20">
    <svg className="animate-spin h-8 w-8 sm:h-10 sm:w-10 mx-auto text-blue-500 mb-4" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
    <p className="text-gray-500 text-base sm:text-lg font-droid-arabic-kufi">جاري التحميل...</p>
  </div>
);

// Empty State Component
const EmptyState = () => (
  <div className="text-center py-12 sm:py-20 px-4">
    <svg
      className="w-16 h-16 sm:w-20 sm:h-20 mx-auto text-gray-300 mb-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
      />
    </svg>
    <p className="text-gray-500 text-base sm:text-lg mb-2 font-droid-arabic-kufi">لا توجد رسائل</p>
    <p className="text-gray-400 text-sm font-droid-arabic-kufi">لم يتم العثور على أي رسائل تطابق معايير البحث</p>
  </div>
);

export default Messages;