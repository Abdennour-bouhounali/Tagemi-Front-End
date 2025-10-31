// src/pages/Admin/ArchivedStats/StatusStats.jsx

import React, { useState, useEffect, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import { AppContext } from "../../../../Context/AppContext";
import {
  ArrowLeft,
  AlertCircle,
  PieChart as PieChartIcon,
  Download,
  Printer,
  CheckCircle,
  XCircle,
  Clock,
  UserX,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const apiUrl = import.meta.env.VITE_API_URL;

const STATUS_CONFIG = {
  Completed: { label: "مكتمل", color: "#10b981", icon: CheckCircle },
  Cancelled: { label: "ملغي", color: "#ef4444", icon: XCircle },
  NoShow: { label: "غائب", color: "#f59e0b", icon: UserX },
  Pending: { label: "معلق", color: "#3b82f6", icon: Clock },
};

const StatusStats = () => {
  const { eventId } = useParams();
  const { token } = useContext(AppContext);
  
  const [event, setEvent] = useState(null);
  const [statistics, setStatistics] = useState([]);
  const [totalAppointments, setTotalAppointments] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, [eventId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiUrl}/api/archived-events/${eventId}/status-stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      
      if (res.ok) {
        setEvent(data.event);
        setStatistics(data.statistics);
        setTotalAppointments(data.total_appointments);
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
      ["الحالة", "العدد", "النسبة المئوية"],
      ...statistics.map(stat => [
        STATUS_CONFIG[stat.status]?.label || stat.status,
        stat.count,
        stat.percentage + "%"
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `status_stats_${eventId}.csv`;
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

  const chartData = statistics.map(stat => ({
    name: STATUS_CONFIG[stat.status]?.label || stat.status,
    value: parseInt(stat.count),
    percentage: parseFloat(stat.percentage),
  }));

  return (
    <div className="w-screen min-h-screen bg-gradient-to-b from-green-50 to-white p-6 flex flex-col items-center py-10 px-4">
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
                <div className="bg-green-100 w-16 h-16 rounded-xl flex items-center justify-center">
                  <PieChartIcon className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 font-droid-arabic-kufi">
                    إحصائيات الحالات
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {statistics.map((stat, index) => {
            const config = STATUS_CONFIG[stat.status];
            const Icon = config?.icon || Clock;
            return (
              <div key={index} className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-600 font-droid-arabic-kufi text-sm">
                    {config?.label || stat.status}
                  </span>
                  <Icon className="w-6 h-6" style={{ color: config?.color }} />
                </div>
                <p className="text-3xl font-bold text-gray-900 font-droid-arabic-kufi mb-1">
                  {stat.count}
                </p>
                <p className="text-sm text-gray-500 font-droid-arabic-kufi">
                  {stat.percentage}% من الإجمالي
                </p>
              </div>
            );
          })}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Pie Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-4 font-droid-arabic-kufi">
              توزيع الحالات
            </h3>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={(entry) => `${entry.name}: ${entry.percentage}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => {
                    const status = statistics[index].status;
                    return (
                      <Cell key={`cell-${index}`} fill={STATUS_CONFIG[status]?.color || '#8884d8'} />
                    );
                  })}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-4 font-droid-arabic-kufi">
              مقارنة الأعداد
            </h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" style={{ fontSize: '12px' }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="العدد">
                  {chartData.map((entry, index) => {
                    const status = statistics[index].status;
                    return (
                      <Cell key={`cell-${index}`} fill={STATUS_CONFIG[status]?.color || '#8884d8'} />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 font-droid-arabic-kufi">
                تفاصيل الحالات
              </h3>
              <span className="text-sm text-gray-600 font-droid-arabic-kufi">
                إجمالي المواعيد: <span className="font-bold text-gray-900">{totalAppointments}</span>
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-right text-sm font-bold text-gray-700 font-droid-arabic-kufi">الحالة</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 font-droid-arabic-kufi">العدد</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 font-droid-arabic-kufi">النسبة المئوية</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 font-droid-arabic-kufi">الرسم البياني</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {statistics.map((stat, index) => {
                  const config = STATUS_CONFIG[stat.status];
                  const Icon = config?.icon || Clock;
                  return (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center gap-3">
                          <Icon className="w-5 h-5" style={{ color: config?.color }} />
                          <span className="font-droid-arabic-kufi font-semibold text-gray-900">
                            {config?.label || stat.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-4 py-2 rounded-full text-sm font-semibold font-droid-arabic-kufi"
                          style={{ 
                            backgroundColor: config?.color + '20',
                            color: config?.color
                          }}>
                          {stat.count}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-droid-arabic-kufi font-bold text-gray-900">
                        {stat.percentage}%
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="h-3 rounded-full transition-all"
                            style={{
                              width: `${stat.percentage}%`,
                              backgroundColor: config?.color
                            }}
                          ></div>
                        </div>
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

export default StatusStats;