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
  Clock,
  Users,
  TrendingUp,
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

// Map all possible backend statuses to our 3 display categories
const STATUS_CONFIG = {
  // Completed category
  Completed: { label: "أنهى الفحص", color: "#10b981", icon: CheckCircle },
  
  // Pending category (Absent)
  Pending: { label: "غائب", color: "#ef4444", icon: AlertCircle },
  
  // Waiting category (all others: Cancelled, NoShow, Confirmed, etc.)
  Waiting: { label: "في الإنتظار", color: "#f59e0b", icon: Clock },
  
  // Backwards compatibility - map old status names
  "مكتمل": { label: "أنهى الفحص", color: "#10b981", icon: CheckCircle },
  "معلق": { label: "في الإنتظار", color: "#f59e0b", icon: Clock },
  "ملغي": { label: "في الإنتظار", color: "#f59e0b", icon: Clock },
  "غائب": { label: "غائب", color: "#ef4444", icon: AlertCircle },
};

// Function to get status config with fallback
const getStatusConfig = (status) => {
  return STATUS_CONFIG[status] || { label: "في الإنتظار", color: "#f59e0b", icon: Clock };
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
  const printWindow = window.open('', '_blank');
  const printContent = generatePrintDocument();
  printWindow.document.write(printContent);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
};

const generatePrintDocument = () => {
  const currentDate = new Date().toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const totalSpecialCases = statistics.reduce((sum, stat) => sum + parseInt(stat.special_count || 0), 0);

  const getStatusLabel = (status) => {
    if (status === 'Completed') return 'أنهى الفحص';
    if (status === 'Pending') return 'غائب';
    if (status === 'Waiting') return 'في الإنتظار';
    return status;
  };

  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>إحصائيات الحالات - ${event?.name}</title>
      <style>
        @page { size: A4; margin: 2cm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Arial', 'Tahoma', sans-serif; line-height: 1.6; color: #333; background: white; }
        
        .header {
          text-align: center;
          padding: 20px 0;
          border-bottom: 3px solid #10b981;
          margin-bottom: 30px;
        }
        .logo { width: 120px; height: auto; margin-bottom: 15px; }
        .header h1 { font-size: 28px; color: #10b981; margin-bottom: 8px; font-weight: bold; }
        .header .event-name { font-size: 18px; color: #666; margin-bottom: 5px; }
        .header .date { font-size: 14px; color: #999; }
        
        .section { margin-bottom: 35px; page-break-inside: avoid; }
        .section-title {
          font-size: 20px;
          font-weight: bold;
          color: #10b981;
          margin-bottom: 15px;
          padding-bottom: 8px;
          border-bottom: 2px solid #e5e7eb;
        }
        
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
          margin-bottom: 30px;
          padding: 20px;
          background: #f0fdf4;
          border-radius: 8px;
        }
        .summary-card { text-align: center; }
        .summary-card .label { font-size: 12px; color: #666; margin-bottom: 5px; }
        .summary-card .value { font-size: 24px; font-weight: bold; color: #10b981; }
        
        .special-box {
          padding: 20px;
          background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%);
          border: 2px solid #3b82f6;
          border-radius: 8px;
          margin-bottom: 30px;
          text-align: center;
        }
        .special-box h3 { color: #1e40af; font-size: 18px; margin-bottom: 10px; }
        .special-box .value { font-size: 36px; font-weight: bold; color: #2563eb; }
        
        .data-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 25px;
        }
        .data-table th {
          background-color: #10b981;
          color: white;
          padding: 12px;
          text-align: center;
          font-weight: bold;
          font-size: 14px;
        }
        .data-table td {
          border: 1px solid #e5e7eb;
          padding: 10px;
          text-align: center;
          font-size: 13px;
        }
        .data-table tr:nth-child(even) { background-color: #f9fafb; }
        
        .progress-bar {
          width: 100%;
          height: 20px;
          background-color: #e5e7eb;
          border-radius: 10px;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          background-color: #10b981;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 11px;
          font-weight: bold;
        }
        
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #e5e7eb;
          text-align: center;
          color: #999;
          font-size: 12px;
        }
        
        @media print {
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          .section { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <img src="/tagemi_logo.png" alt="Logo" class="logo" />
        <h1>تقرير إحصائيات الحالات</h1>
        <p class="event-name">${event?.name}</p>
        <p class="date">تاريخ الإصدار: ${currentDate}</p>
      </div>

      <div class="summary-grid">
        <div class="summary-card">
          <div class="label">إجمالي المواعيد</div>
          <div class="value">${totalAppointments}</div>
        </div>
        ${statistics.map(stat => {
          const percentage = totalAppointments > 0 
            ? ((parseInt(stat.count) / totalAppointments) * 100).toFixed(1) 
            : 0;
          return `
            <div class="summary-card">
              <div class="label">${getStatusLabel(stat.status)}</div>
              <div class="value">${stat.count}</div>
              <div class="label" style="font-size: 11px; margin-top: 5px;">${percentage}%</div>
            </div>
          `;
        }).join('')}
      </div>

      ${totalSpecialCases > 0 ? `
        <div class="special-box">
          <h3>إجمالي الحالات الخاصة</h3>
          <div class="value">${totalSpecialCases}</div>
          <p style="color: #6b7280; font-size: 14px; margin-top: 5px;">
            ${((totalSpecialCases / totalAppointments) * 100).toFixed(1)}% من إجمالي المواعيد
          </p>
        </div>
      ` : ''}

      <div class="section">
        <h2 class="section-title">تفاصيل الحالات</h2>
        <table class="data-table">
          <thead>
            <tr>
              <th>الحالة</th>
              <th>العدد</th>
              <th>حالات خاصة</th>
              <th>النسبة المئوية</th>
              <th>التمثيل البياني</th>
            </tr>
          </thead>
          <tbody>
            ${statistics.map(stat => {
              const percentage = totalAppointments > 0 
                ? ((parseInt(stat.count) / totalAppointments) * 100).toFixed(1) 
                : 0;
              const specialPercentage = stat.special_count > 0
                ? ((parseInt(stat.special_count) / parseInt(stat.count)) * 100).toFixed(1)
                : 0;
              
              return `
                <tr>
                  <td><strong>${getStatusLabel(stat.status)}</strong></td>
                  <td><strong>${stat.count}</strong></td>
                  <td>${stat.special_count > 0 ? `${stat.special_count} (${specialPercentage}%)` : '-'}</td>
                  <td><strong>${percentage}%</strong></td>
                  <td>
                    <div class="progress-bar">
                      <div class="progress-fill" style="width: ${percentage}%">
                        ${percentage}%
                      </div>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>

      <div class="footer">
        <p>هذا التقرير تم إنشاؤه تلقائياً بواسطة نظام إدارة الحملات الطبية</p>
        <p>جميع الحقوق محفوظة © ${new Date().getFullYear()}</p>
      </div>
    </body>
    </html>
  `;
};
  const handleExport = () => {
    const csvContent = [
      ["الحالة", "العدد", "حالات خاصة", "النسبة المئوية"],
      ...statistics.map(stat => {
        const percentage = totalAppointments > 0 
          ? ((parseInt(stat.count) / totalAppointments) * 100).toFixed(1) 
          : 0;
        return [
          getStatusConfig(stat.status).label,
          stat.count,
          stat.special_count || 0,
          percentage + "%"
        ];
      })
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

  const chartData = statistics.map(stat => {
    const percentage = totalAppointments > 0 
      ? ((parseInt(stat.count) / totalAppointments) * 100).toFixed(1) 
      : 0;
    
    return {
      name: getStatusConfig(stat.status).label,
      value: parseInt(stat.count),
      percentage: parseFloat(percentage),
      special_count: parseInt(stat.special_count || 0),
    };
  });

  const totalSpecialCases = statistics.reduce((sum, stat) => sum + parseInt(stat.special_count || 0), 0);

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
                  <p className="text-gray-600 font-droid-arabic-kufi">
                    {event?.name} - {event?.date && new Date(event.date).toLocaleDateString('ar-DZ', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
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
          {/* Total Appointments */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-600 font-droid-arabic-kufi text-sm">
                إجمالي المواعيد
              </span>
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900 font-droid-arabic-kufi mb-1">
              {totalAppointments}
            </p>
          </div>

          {/* Status Cards */}
          {statistics.map((stat, index) => {
            const config = getStatusConfig(stat.status);
            const Icon = config.icon;
            const percentage = totalAppointments > 0 
              ? ((parseInt(stat.count) / totalAppointments) * 100).toFixed(1) 
              : 0;
            
            return (
              <div key={index} className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-600 font-droid-arabic-kufi text-sm">
                    {config.label}
                  </span>
                  <Icon className="w-6 h-6" style={{ color: config.color }} />
                </div>
                <p className="text-3xl font-bold text-gray-900 font-droid-arabic-kufi mb-1">
                  {stat.count}
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500 font-droid-arabic-kufi">
                    {percentage}% من الإجمالي
                  </p>
                  {stat.special_count > 0 && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-droid-arabic-kufi font-semibold">
                      خاص: {stat.special_count}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Special Cases Summary */}
        {totalSpecialCases > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-md p-6 border border-blue-200 mb-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 font-droid-arabic-kufi mb-1">
                  إجمالي الحالات الخاصة
                </h3>
                <p className="text-gray-600 font-droid-arabic-kufi text-sm">
                  عدد المواعيد المصنفة كحالات خاصة في هذا الحدث
                </p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-blue-600 font-droid-arabic-kufi">
                  {totalSpecialCases}
                </p>
                <p className="text-sm text-gray-600 font-droid-arabic-kufi">
                  {((totalSpecialCases / totalAppointments) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        )}

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
                    const config = getStatusConfig(status);
                    return (
                      <Cell key={`cell-${index}`} fill={config.color} />
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
                    const config = getStatusConfig(status);
                    return (
                      <Cell key={`cell-${index}`} fill={config.color} />
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
            <h3 className="text-xl font-bold text-gray-900 font-droid-arabic-kufi">
              تفاصيل الحالات
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-right text-sm font-bold text-gray-700 font-droid-arabic-kufi">الحالة</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 font-droid-arabic-kufi">العدد</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 font-droid-arabic-kufi">حالات خاصة</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 font-droid-arabic-kufi">النسبة المئوية</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 font-droid-arabic-kufi">الرسم البياني</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {statistics.map((stat, index) => {
                  const config = getStatusConfig(stat.status);
                  const Icon = config.icon;
                  const percentage = totalAppointments > 0 
                    ? ((parseInt(stat.count) / totalAppointments) * 100).toFixed(1) 
                    : 0;
                  
                  return (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center gap-3">
                          <Icon className="w-5 h-5" style={{ color: config.color }} />
                          <span className="font-droid-arabic-kufi font-semibold text-gray-900">
                            {config.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-4 py-2 rounded-full text-sm font-semibold font-droid-arabic-kufi"
                          style={{ 
                            backgroundColor: config.color + '20',
                            color: config.color
                          }}>
                          {stat.count}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {stat.special_count > 0 ? (
                          <div className="flex flex-col items-center gap-1">
                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold font-droid-arabic-kufi">
                              {stat.special_count}
                            </span>
                            <span className="text-xs text-gray-500 font-droid-arabic-kufi">
                              {((parseInt(stat.special_count) / parseInt(stat.count)) * 100).toFixed(1)}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm font-droid-arabic-kufi">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center font-droid-arabic-kufi font-bold text-gray-900">
                        {percentage}%
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="h-3 rounded-full transition-all"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: config.color
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