// src/pages/Admin/ArchivedStats/ComprehensiveReport.jsx

import React, { useState, useEffect, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import { AppContext } from "../../../../Context/AppContext";
import {
  ArrowLeft,
  AlertCircle,
  Activity,
  Download,
  Printer,
  BarChart3,
  Users,
  MapPin,
  PieChart as PieChartIcon,
  CheckCircle,
  TrendingUp,
  Calendar,
  FileText,
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

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const ComprehensiveReport = () => {
  const { eventId } = useParams();
  const { token } = useContext(AppContext);
  
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchReport();
  }, [eventId]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiUrl}/api/archived-events/${eventId}/comprehensive-report`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      
      if (res.ok) {
        setReport(data.report);
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
    if (!report) return;

    const csvContent = [
      ["=== تقرير شامل للحدث ==="],
      ["اسم الحدث:", report.event.name],
      ["التاريخ:", report.event.date],
      [""],
      ["=== الإحصائيات العامة ==="],
      ["إجمالي المواعيد:", report.total_appointments],
      [""],
      ["=== توزيع الحالات ==="],
      ["الحالة", "العدد"],
      ...report.status_breakdown.map(stat => [stat.status, stat.count]),
      [""],
      ["=== توزيع التخصصات ==="],
      ["التخصص", "العدد"],
      ...report.specialty_breakdown.map(stat => [stat.name, stat.count]),
      [""],
      ["=== توزيع الجنس ==="],
      ["الجنس", "العدد"],
      ...report.gender_breakdown.map(stat => [stat.sex === '0' ? 'ذكر' : 'أنثى', stat.count]),
      [""],
      ["=== الفئات العمرية ==="],
      ["الفئة", "العدد"],
      ...report.age_breakdown.map(stat => [stat.age_group, stat.count]),
      [""],
      ["=== أعلى 10 ولايات ==="],
      ["الولاية", "العدد"],
      ...report.top_states.map(stat => [stat.state, stat.count]),
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `comprehensive_report_${eventId}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-droid-arabic-kufi">جاري تحميل التقرير...</p>
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

  if (!report) return null;

  const statusData = report.status_breakdown.map(stat => ({
    name: stat.status,
    value: parseInt(stat.count)
  }));

  const specialtyData = report.specialty_breakdown.map(stat => ({
    name: stat.name,
    value: parseInt(stat.count)
  }));

  const genderData = report.gender_breakdown.map(stat => ({
    name: stat.sex === '0' || stat.sex === 'ذكر' ? 'ذكر' : 'أنثى',
    value: parseInt(stat.count)
  }));

  const ageData = report.age_breakdown.map(stat => ({
    name: stat.age_group,
    value: parseInt(stat.count)
  }));

  return (
    <div className="w-screen min-h-screen bg-gradient-to-b from-red-50 to-white p-6 flex flex-col items-center py-10 px-4">
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
                <div className="bg-red-100 w-16 h-16 rounded-xl flex items-center justify-center">
                  <Activity className="w-8 h-8 text-red-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 font-droid-arabic-kufi">
                    التقرير الشامل
                  </h1>
                  <p className="text-gray-600 font-droid-arabic-kufi">{report.event.name}</p>
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

        {/* Event Info Card */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-2xl shadow-lg p-8 mb-6 text-white">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-80" />
              <p className="text-sm opacity-80 font-droid-arabic-kufi mb-1">اسم الحدث</p>
              <p className="text-xl font-bold font-droid-arabic-kufi">{report.event.name}</p>
            </div>
            <div className="text-center">
              <Calendar className="w-8 h-8 mx-auto mb-2 opacity-80" />
              <p className="text-sm opacity-80 font-droid-arabic-kufi mb-1">التاريخ</p>
              <p className="text-xl font-bold font-droid-arabic-kufi">{report.event.date}</p>
            </div>
            <div className="text-center">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-80" />
              <p className="text-sm opacity-80 font-droid-arabic-kufi mb-1">إجمالي المواعيد</p>
              <p className="text-3xl font-bold font-droid-arabic-kufi">{report.total_appointments}</p>
            </div>
            <div className="text-center">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-80" />
              <p className="text-sm opacity-80 font-droid-arabic-kufi mb-1">الحالة</p>
              <p className="text-xl font-bold font-droid-arabic-kufi">مؤرشف</p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          {report.status_breakdown.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 font-droid-arabic-kufi text-sm">{stat.status}</span>
                <TrendingUp className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-3xl font-bold text-gray-900 font-droid-arabic-kufi">{stat.count}</p>
              <p className="text-xs text-gray-500 font-droid-arabic-kufi mt-1">
                {((parseInt(stat.count) / report.total_appointments) * 100).toFixed(1)}%
              </p>
            </div>
          ))}
        </div>

        {/* Status & Specialty Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Status Pie Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <PieChartIcon className="w-6 h-6 text-red-600" />
              <h3 className="text-xl font-bold text-gray-900 font-droid-arabic-kufi">
                توزيع الحالات
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Specialty Bar Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className="w-6 h-6 text-blue-600" />
              <h3 className="text-xl font-bold text-gray-900 font-droid-arabic-kufi">
                توزيع التخصصات
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={specialtyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} style={{ fontSize: '10px' }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" name="العدد">
                  {specialtyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Demographics Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Gender Distribution */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-6 h-6 text-purple-600" />
              <h3 className="text-xl font-bold text-gray-900 font-droid-arabic-kufi">
                توزيع الجنس
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {genderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.name === 'ذكر' ? '#3b82f6' : '#ec4899'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Age Distribution */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <Activity className="w-6 h-6 text-orange-600" />
              <h3 className="text-xl font-bold text-gray-900 font-droid-arabic-kufi">
                الفئات العمرية
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={ageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" style={{ fontSize: '12px' }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" name="العدد" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Geographic Distribution */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <MapPin className="w-6 h-6 text-green-600" />
            <h3 className="text-xl font-bold text-gray-900 font-droid-arabic-kufi">
              أعلى 10 ولايات
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={report.top_states} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="state" type="category" width={100} style={{ fontSize: '12px' }} />
              <Tooltip />
              <Bar dataKey="count" name="عدد المرضى" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Detailed Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Specialty Table */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-100">
              <h4 className="font-bold text-gray-900 font-droid-arabic-kufi">تفاصيل التخصصات</h4>
            </div>
            <div className="p-4">
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {report.specialty_breakdown.map((stat, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-droid-arabic-kufi text-sm font-semibold text-gray-900">
                      {stat.name}
                    </span>
                    <span className="font-droid-arabic-kufi font-bold text-blue-600">
                      {stat.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Status Table */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-100">
              <h4 className="font-bold text-gray-900 font-droid-arabic-kufi">تفاصيل الحالات</h4>
            </div>
            <div className="p-4">
              <div className="space-y-2">
                {report.status_breakdown.map((stat, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-droid-arabic-kufi text-sm font-semibold text-gray-900">
                      {stat.status}
                    </span>
                    <div className="text-left">
                      <span className="font-droid-arabic-kufi font-bold text-gray-900 block">
                        {stat.count}
                      </span>
                      <span className="text-xs text-gray-500 font-droid-arabic-kufi">
                        {((parseInt(stat.count) / report.total_appointments) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Summary Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-4 font-droid-arabic-kufi">
            ملخص التقرير
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-bold text-gray-800 font-droid-arabic-kufi">النقاط الرئيسية:</h4>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-red-600 mt-1">•</span>
                  <span className="text-gray-700 font-droid-arabic-kufi">
                    إجمالي المواعيد المؤرشفة: <strong>{report.total_appointments}</strong>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 mt-1">•</span>
                  <span className="text-gray-700 font-droid-arabic-kufi">
                    عدد التخصصات: <strong>{report.specialty_breakdown.length}</strong>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 mt-1">•</span>
                  <span className="text-gray-700 font-droid-arabic-kufi">
                    التغطية الجغرافية: <strong>{report.top_states.length}+</strong> ولاية
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 mt-1">•</span>
                  <span className="text-gray-700 font-droid-arabic-kufi">
                    أكبر تخصص: <strong>{report.specialty_breakdown[0]?.name}</strong> ({report.specialty_breakdown[0]?.count} مريض)
                  </span>
                </li>
              </ul>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <h4 className="font-bold text-gray-800 font-droid-arabic-kufi mb-3">معلومات إضافية:</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-droid-arabic-kufi text-sm">تاريخ التقرير:</span>
                  <span className="font-bold text-red-600 font-droid-arabic-kufi text-sm">
                    {new Date().toLocaleDateString('ar-SA')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-droid-arabic-kufi text-sm">تاريخ الأرشفة:</span>
                  <span className="font-bold text-red-600 font-droid-arabic-kufi text-sm">
                    {new Date(report.event.updated_at).toLocaleDateString('ar-SA')}
                  </span>
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

export default ComprehensiveReport;