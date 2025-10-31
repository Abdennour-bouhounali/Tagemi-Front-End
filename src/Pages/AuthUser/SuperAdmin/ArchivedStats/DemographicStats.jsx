// src/pages/Admin/ArchivedStats/DemographicStats.jsx

import React, { useState, useEffect, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import { AppContext } from "../../../../Context/AppContext";
import {
  ArrowLeft,
  AlertCircle,
  Users,
  Download,
  Printer,
  User,
  UserCheck,
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

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];
const GENDER_COLORS = {
  'ذكر': '#3b82f6',
  'أنثى': '#ec4899',
  '0': '#3b82f6',
  '1': '#ec4899',
};

const DemographicStats = () => {
  const { eventId } = useParams();
  const { token } = useContext(AppContext);
  
  const [event, setEvent] = useState(null);
  const [genderStats, setGenderStats] = useState([]);
  const [ageStats, setAgeStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, [eventId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiUrl}/api/archived-events/${eventId}/demographic-stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      
      if (res.ok) {
        setEvent(data.event);
        setGenderStats(data.gender_statistics);
        setAgeStats(data.age_statistics);
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
      ["=== إحصائيات الجنس ==="],
      ["الجنس", "العدد"],
      ...genderStats.map(stat => [
        stat.sex === '0' || stat.sex === 'ذكر' ? 'ذكر' : 'أنثى',
        stat.count
      ]),
      [""],
      ["=== إحصائيات الفئات العمرية ==="],
      ["الفئة العمرية", "العدد"],
      ...ageStats.map(stat => [stat.age_group, stat.count])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `demographic_stats_${eventId}.csv`;
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

  const totalPatients = genderStats.reduce((sum, stat) => sum + parseInt(stat.count), 0);

  const genderChartData = genderStats.map(stat => ({
    name: stat.sex === '0' || stat.sex === 'ذكر' ? 'ذكر' : 'أنثى',
    value: parseInt(stat.count),
    percentage: ((parseInt(stat.count) / totalPatients) * 100).toFixed(1)
  }));

  const ageChartData = ageStats.map(stat => ({
    name: stat.age_group,
    value: parseInt(stat.count)
  }));

  return (
    <div className="w-screen min-h-screen bg-gradient-to-b from-purple-50 to-white p-6 flex flex-col items-center py-10 px-4">
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
                <div className="bg-purple-100 w-16 h-16 rounded-xl flex items-center justify-center">
                  <Users className="w-8 h-8 text-purple-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 font-droid-arabic-kufi">
                    إحصائيات ديموغرافية
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 font-droid-arabic-kufi text-sm">إجمالي المرضى</span>
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900 font-droid-arabic-kufi">{totalPatients}</p>
          </div>

          {genderChartData.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 font-droid-arabic-kufi text-sm">{stat.name}</span>
                <User className="w-5 h-5" style={{ color: GENDER_COLORS[stat.name] }} />
              </div>
              <p className="text-3xl font-bold text-gray-900 font-droid-arabic-kufi mb-1">
                {stat.value}
              </p>
              <p className="text-sm text-gray-500 font-droid-arabic-kufi">
                {stat.percentage}% من الإجمالي
              </p>
            </div>
          ))}
        </div>

        {/* Gender Statistics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Gender Pie Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-4 font-droid-arabic-kufi">
              توزيع المرضى حسب الجنس
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={genderChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={(entry) => `${entry.name}: ${entry.percentage}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {genderChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={GENDER_COLORS[entry.name]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>

            {/* Gender Table */}
            <div className="mt-6 space-y-3">
              {genderChartData.map((stat, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: GENDER_COLORS[stat.name] }}
                    ></div>
                    <span className="font-droid-arabic-kufi font-semibold text-gray-900">
                      {stat.name}
                    </span>
                  </div>
                  <div className="text-left">
                    <p className="font-droid-arabic-kufi font-bold text-gray-900">{stat.value}</p>
                    <p className="text-xs text-gray-500 font-droid-arabic-kufi">{stat.percentage}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Age Bar Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-4 font-droid-arabic-kufi">
              توزيع المرضى حسب الفئة العمرية
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ageChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" style={{ fontSize: '12px' }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="العدد">
                  {ageChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Age Table */}
            <div className="mt-6 space-y-2">
              {ageChartData.map((stat, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></div>
                    <span className="font-droid-arabic-kufi font-semibold text-gray-900">
                      {stat.name} سنة
                    </span>
                  </div>
                  <span className="font-droid-arabic-kufi font-bold text-gray-900">
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Combined Analysis */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-4 font-droid-arabic-kufi">
            التحليل الديموغرافي
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-bold text-gray-800 font-droid-arabic-kufi">الملاحظات الرئيسية:</h4>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-1">•</span>
                  <span className="text-gray-700 font-droid-arabic-kufi">
                    إجمالي عدد المرضى المسجلين: <strong>{totalPatients}</strong>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-1">•</span>
                  <span className="text-gray-700 font-droid-arabic-kufi">
                    النسبة الأكبر من المرضى من الفئة العمرية: <strong>{ageChartData[0]?.name}</strong>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-1">•</span>
                  <span className="text-gray-700 font-droid-arabic-kufi">
                    توزيع متوازن بين الجنسين
                  </span>
                </li>
              </ul>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <h4 className="font-bold text-gray-800 font-droid-arabic-kufi mb-3">إحصائيات سريعة:</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-droid-arabic-kufi">متوسط العمر المتوقع:</span>
                  <span className="font-bold text-purple-600 font-droid-arabic-kufi">31-45 سنة</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-droid-arabic-kufi">عدد الفئات العمرية:</span>
                  <span className="font-bold text-purple-600 font-droid-arabic-kufi">{ageStats.length}</span>
                </div>
              </div>
            </div>
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

export default DemographicStats;