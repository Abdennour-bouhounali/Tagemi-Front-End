import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
const apiUrl = import.meta.env.VITE_API_URL; 

import { 
  Filter
} from "lucide-react";
import {Select} from '../../Common/FormInputs';
const Messages = () => {
  const [messages, setMessages] = useState([]);
  const [cityFilter, setCityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [expandedMessage, setExpandedMessage] = useState(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = () => {
    setLoading(true);
    fetch(`${apiUrl}/api/contacts`)
      .then((response) => response.json())
      .then((data) => {
        setMessages(data);
        setFilteredMessages(data);
      })
      .catch((error) => console.error('Error fetching messages:', error))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    filterMessages();
  }, [cityFilter, typeFilter, messages]);

  const filterMessages = () => {
    let filtered = messages;

    if (cityFilter) {
      filtered = filtered.filter((message) =>
        message.wilaya.toLowerCase().includes(cityFilter.toLowerCase())
      );
    }

    if (typeFilter) {
      filtered = filtered.filter((message) =>
        message.type_message.toLowerCase() === typeFilter.toLowerCase()
      );
    }

    setFilteredMessages(filtered);
  };

  const handleCityChange = (e) => {
    setCityFilter(e.target.value);
  };

  const handleTypeChange = (e) => {
    setTypeFilter(e.target.value);
  };

  const clearFilters = () => {
    setCityFilter('');
    setTypeFilter('');
  };

  const handleDownloadExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredMessages);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'messages');
    XLSX.writeFile(wb, 'messages.xlsx');
  };

  const handleDelete = (id) => {
    fetch(`${apiUrl}/api/contacts/${id}`, {
      method: 'DELETE',
    })
    .then(() => {
      setMessages(messages.filter(message => message.id !== id));
      setFilteredMessages(filteredMessages.filter(message => message.id !== id));
      setDeleteConfirm(null);
    })
    .catch(error => console.error('Error deleting message:', error));
  };

  const getTypeLabel = (type) => {
    const types = {
      'help': 'مساعدة',
      'aide': 'رغبة في تقديم العون',
      'project_aide': 'مساهمة في مشروع',
      'question': 'إستفسار',
      'other': 'أخرى'
    };
    return types[type] || type;
  };

  const getTypeBadgeColor = (type) => {
    const colors = {
      'help': 'bg-red-100 text-red-700 border-red-200',
      'aide': 'bg-green-100 text-green-700 border-green-200',
      'project_aide': 'bg-blue-100 text-blue-700 border-blue-200',
      'question': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'other': 'bg-gray-100 text-gray-700 border-gray-200'
    };
    return colors[type] || colors['other'];
  };

  return (
<div className="w-full max-w-7xl mx-auto py-8 droid-arabic-kufi px-4">
  <div className="w-full">
        {/* Header */}
        <div className="mb-8 droid-arabic-kufi">
          <h1 className="text-4xl droid-arabic-kufi text-gray-800 mb-2">الرسائل</h1>
          <p className="text-gray-600 droid-arabic-kufi">إدارة وعرض جميع الرسائل الواردة</p>
        </div>

        {/* Filters Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm droid-arabic-kufi text-gray-700 mb-2">
                البحث حسب الولاية
              </label>
              <input
                type="text"
                placeholder="أدخل اسم الولاية..."
                value={cityFilter}
                onChange={handleCityChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            
            <div className="flex-1">
              <label className="block text-sm droid-arabic-kufi text-gray-700 mb-2">
                نوع الرسالة
              </label>
                  <Select
                    icon={Filter}
                    value={typeFilter}
                    onChange={handleTypeChange}
                    options={[
                      { value: "", label: "جميع الحالات" },
                      { value: "help", label: "مساعدة" },
                      { value: "aide", label: "رغبة في تقديم العون" },
                      { value: "project_aide", label: "مساهمة في مشروع" },
                      { value: "question", label: "إستفسار" },
                      { value: "other", label: "أخرى" }
                    ]}
                  />
              
            </div>

            <div className="flex gap-3">
              {(cityFilter || typeFilter) && (
                <button
                  onClick={clearFilters}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 droid-arabic-kufi rounded-lg transition-all transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-gray-400 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  مسح
                </button>
              )}
              
              <button
                onClick={handleDownloadExcel}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white droid-arabic-kufi rounded-lg transition-all transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 shadow-md flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                تحميل Excel
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              عرض <span className="droid-arabic-kufi text-gray-900">{filteredMessages.length}</span> من أصل <span className="droid-arabic-kufi text-gray-900">{messages.length}</span> رسالة
            </div>
            {(cityFilter || typeFilter) && (
              <div className="text-sm text-blue-600 font-medium">
                تطبيق الفلاتر النشطة
              </div>
            )}
          </div>
        </div>

        {/* Messages Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {loading ? (
            <div className="text-center py-20">
              <svg className="animate-spin h-10 w-10 mx-auto text-blue-500 mb-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-gray-500 text-lg">جاري التحميل...</p>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="text-center py-20">
              <svg className="w-20 h-20 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-gray-500 text-lg mb-2">لا توجد رسائل</p>
              <p className="text-gray-400">لم يتم العثور على أي رسائل تطابق معايير البحث</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-50 to-blue-100 border-b-2 border-blue-200">
                  <tr>
                    <th className="px-6 py-4 text-right text-sm droid-arabic-kufi text-gray-700">الإسم</th>
                    <th className="px-6 py-4 text-right text-sm droid-arabic-kufi text-gray-700">اللقب</th>
                    <th className="px-6 py-4 text-right text-sm droid-arabic-kufi text-gray-700">رقم الهاتف</th>
                    <th className="px-6 py-4 text-right text-sm droid-arabic-kufi text-gray-700">الولاية</th>
                    <th className="px-6 py-4 text-right text-sm droid-arabic-kufi text-gray-700">نوع الرسالة</th>
                    <th className="px-6 py-4 text-right text-sm droid-arabic-kufi text-gray-700">الرسالة</th>
                    <th className="px-6 py-4 text-center text-sm droid-arabic-kufi text-gray-700">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredMessages.map((message, index) => (
                    <tr 
                      key={message.id} 
                      className={`hover:bg-gray-50 transition-colors ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}
                    >
                      <td className="px-6 py-4 text-sm text-gray-800 font-medium">{message.first_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-800 font-medium">{message.last_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 font-mono">{message.phone}</td>
                      <td className="px-6 py-4 text-sm text-gray-800">{message.wilaya}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-3 py-1 text-xs droid-arabic-kufi rounded-full border ${getTypeBadgeColor(message.type_message)}`}>
                          {getTypeLabel(message.type_message)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {message.message.length > 50 ? (
                          <div>
                            <p className="text-sm text-gray-700">
                              {expandedMessage === message.id 
                                ? message.message 
                                : `${message.message.substring(0, 50)}...`
                              }
                            </p>
                            <button
                              onClick={() => setExpandedMessage(expandedMessage === message.id ? null : message.id)}
                              className="text-blue-600 hover:text-blue-800 text-xs font-medium mt-1"
                            >
                              {expandedMessage === message.id ? 'إخفاء' : 'عرض المزيد'}
                            </button>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-700">{message.message}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => setDeleteConfirm(message.id)}
                          className="inline-flex items-center gap-1 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 droid-arabic-kufi rounded-lg transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
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
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 transform animate-scale-in">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg droid-arabic-kufi text-gray-900">حذف الرسالة</h3>
                <p className="text-sm text-gray-500">لا يمكن التراجع عن هذا الإجراء</p>
              </div>
            </div>
            <p className="text-gray-600 mb-6">هل أنت متأكد من رغبتك في حذف هذه الرسالة نهائياً؟</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 droid-arabic-kufi rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                إلغاء
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white droid-arabic-kufi rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                حذف
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
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

export default Messages;