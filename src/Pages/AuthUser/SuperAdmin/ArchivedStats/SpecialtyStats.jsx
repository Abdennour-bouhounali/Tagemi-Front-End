// src/pages/Admin/ArchivedStats/SpecialtyStats.jsx

import React, { useState, useEffect, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import { AppContext } from "../../../../Context/AppContext";
import {
  ArrowLeft,
  AlertCircle,
  BarChart3,
  Download,
  Printer,
  TrendingUp,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const apiUrl = import.meta.env.VITE_API_URL;

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const SpecialtyStats = () => {
  const { eventId } = useParams();
  const { token } = useContext(AppContext);
  
  const [event, setEvent] = useState(null);
  const [statistics, setStatistics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, [eventId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiUrl}/api/archived-events/${eventId}/specialty-stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      
      if (res.ok) {
        setEvent(data.event);
        setStatistics(data.statistics);
      } else {
        setError(data.message || "فشل في تحميل البيانات");
      }
    } catch (err) {
      console.error("Error:", err);
      setError("حدث خطأ أثناء تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    const csvContent = [
      ["التخصص", "إجمالي المواعيد", "مكتمل", "ملغي", "غائب", "معلق"],
      ...statistics.map(stat => [
        stat.name,
        stat.total_appointments,
        stat.completed,
        stat.cancelled,
        stat.no_show,
        stat.pending
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `specialty_stats_${eventId}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-droid-arabic-kufi">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <div className="flex items-center gap-3 mb-3">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <h3 className="text-lg font-bold text-red-800 font-droid-arabic-kufi">خطأ</h3>
          </div>
          <p className="text-red-700 font-droid-arabic-kufi">{error}</p>
        </div>
      </div>
    );
  }

  const totalAppointments = statistics.reduce((sum, stat) => sum + parseInt(stat.total_appointments), 0);
  const pieData = statistics.map(stat => ({
    name: stat.name,
    value: parseInt(stat.total_appointments)
  }));

  return (
    <div className="w-screen min-h-screen bg-gradient-to-b from-blue-50 to-white p-6 flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-7xl mb-4">
        {/* Header */}
        <div className="mb-6 no-print">
          <Link
            to={`/admin/event-tracking/${eventId}`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 font-droid-arabic-kufi transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            العودة إلى صفحة المتابعة
          </Link>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 w-16 h-16 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 font-droid-arabic-kufi">
                    إحصائيات التخصصات
                  </h1>
                  <p className="text-gray-600 font-droid-arabic-kufi">{event?.name}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-droid-arabic-kufi"
                >
                  <Download className="w-4 h-4" />
                  تصدير CSV
                </button>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-droid-arabic-kufi"
                >
                  <Printer className="w-4 h-4" />
                  طباعة
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 font-droid-arabic-kufi text-sm">إجمالي المواعيد</span>
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900 font-droid-arabic-kufi">{totalAppointments}</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 font-droid-arabic-kufi text-sm">عدد التخصصات</span>
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900 font-droid-arabic-kufi">{statistics.length}</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 font-droid-arabic-kufi text-sm">مكتمل</span>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <p className="text-3xl font-bold text-green-600 font-droid-arabic-kufi">
              {statistics.reduce((sum, stat) => sum + parseInt(stat.completed), 0)}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 font-droid-arabic-kufi text-sm">ملغي + غائب</span>
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            </div>
            <p className="text-3xl font-bold text-red-600 font-droid-arabic-kufi">
              {statistics.reduce((sum, stat) => sum + parseInt(stat.cancelled) + parseInt(stat.no_show), 0)}
            </p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Bar Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-4 font-droid-arabic-kufi">
              توزيع المواعيد حسب التخصص
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statistics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} style={{ fontSize: '12px' }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total_appointments" fill="#3b82f6" name="إجمالي المواعيد" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-4 font-droid-arabic-kufi">
              النسب المئوية للتخصصات
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 font-droid-arabic-kufi">
              تفاصيل التخصصات
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-right text-sm font-bold text-gray-700 font-droid-arabic-kufi">التخصص</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 font-droid-arabic-kufi">إجمالي</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 font-droid-arabic-kufi">مكتمل</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 font-droid-arabic-kufi">ملغي</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 font-droid-arabic-kufi">غائب</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 font-droid-arabic-kufi">معلق</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 font-droid-arabic-kufi">معدل الإكمال</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {statistics.map((stat, index) => {
                  const completionRate = ((parseInt(stat.completed) / parseInt(stat.total_appointments)) * 100).toFixed(1);
                  return (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-right font-droid-arabic-kufi font-semibold text-gray-900">
                        {stat.name}
                      </td>
                      <td className="px-6 py-4 text-center font-droid-arabic-kufi text-gray-900 font-bold">
                        {stat.total_appointments}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold font-droid-arabic-kufi">
                          {stat.completed}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold font-droid-arabic-kufi">
                          {stat.cancelled}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold font-droid-arabic-kufi">
                          {stat.no_show}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold font-droid-arabic-kufi">
                          {stat.pending}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-droid-arabic-kufi font-semibold text-gray-900">
                        {completionRate}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
};

export default SpecialtyStats;