import { useState, useEffect, useContext } from "react";
import { API_BASE_URL } from '../../../../config/environment';
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
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const apiUrl = API_BASE_URL;

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
    if (!report) return '';

    const currentDate = new Date().toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const statusData = report.status_breakdown.map(stat => ({
      name: stat.status,
      nameAr: stat.status === 'Completed' ? 'أنهى الفحص' : 
              stat.status === 'Pending' ? 'غائب' : 
              stat.status === 'Waiting' ? 'في الإنتظار' : stat.status,
      count: parseInt(stat.count),
      special: parseInt(stat.special_count || 0)
    }));

    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>التقرير الشامل - ${report.event.name}</title>
        <style>
          @page {
            size: A4;
            margin: 1.5cm;
          }

          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: 'Arial', 'Tahoma', sans-serif;
            line-height: 1.6;
            color: #333;
            background: white;
          }

          .document {
            width: 100%;
            max-width: 210mm;
            margin: 0 auto;
          }

          .header {
            text-align: center;
            padding: 20px 0;
            border-bottom: 3px solid #dc2626;
            margin-bottom: 30px;
          }

          .logo {
            width: 120px;
            height: auto;
            margin-bottom: 15px;
          }

          .header h1 {
            font-size: 28px;
            color: #dc2626;
            margin-bottom: 8px;
            font-weight: bold;
          }

          .header .event-name {
            font-size: 18px;
            color: #666;
            margin-bottom: 5px;
          }

          .header .date {
            font-size: 14px;
            color: #999;
          }

          .info-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin-bottom: 30px;
            padding: 20px;
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
            border-radius: 8px;
            color: white;
          }

          .info-card {
            text-align: center;
          }

          .info-card .label {
            font-size: 12px;
            opacity: 0.9;
            margin-bottom: 5px;
          }

          .info-card .value {
            font-size: 20px;
            font-weight: bold;
          }

          .section {
            margin-bottom: 40px;
            page-break-inside: avoid;
          }

          .section-title {
            font-size: 20px;
            font-weight: bold;
            color: #dc2626;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e5e7eb;
          }

          .summary-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin-bottom: 25px;
          }

          .summary-card {
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            padding: 15px;
            text-align: center;
          }

          .summary-card .label {
            font-size: 12px;
            color: #666;
            margin-bottom: 8px;
          }

          .summary-card .value {
            font-size: 24px;
            font-weight: bold;
            color: #dc2626;
            margin-bottom: 5px;
          }

          .summary-card .percentage {
            font-size: 12px;
            color: #999;
          }

          .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
          }

          .data-table th {
            background-color: #dc2626;
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

          .data-table tr:nth-child(even) {
            background-color: #f9fafb;
          }

          .two-column {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 25px;
          }

          .analysis-box {
            border: 2px solid #dc2626;
            border-radius: 8px;
            padding: 20px;
            background-color: #fef2f2;
          }

          .analysis-box h3 {
            color: #dc2626;
            font-size: 16px;
            margin-bottom: 15px;
          }

          .analysis-box ul {
            list-style: none;
            padding-right: 0;
          }

          .analysis-box li {
            padding: 6px 0;
            padding-right: 20px;
            position: relative;
            font-size: 14px;
            line-height: 1.6;
          }

          .analysis-box li:before {
            content: "◆";
            position: absolute;
            right: 0;
            color: #dc2626;
            font-weight: bold;
          }

          .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            color: #999;
            font-size: 12px;
          }

          @media print {
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
            
            .section {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="document">
          <!-- Header -->
          <div class="header">
            <img src="/tagemi_logo.png" alt="Logo" class="logo" />
            <h1>التقرير الشامل للحملة الطبية</h1>
            <p class="event-name">${report.event.name}</p>
            <p class="date">تاريخ الإصدار: ${currentDate}</p>
          </div>

          <!-- Event Info -->
          <div class="info-grid">
            <div class="info-card">
              <div class="label">اسم الحدث</div>
              <div class="value">${report.event.name}</div>
            </div>
            <div class="info-card">
              <div class="label">تاريخ الحدث</div>
              <div class="value">${new Date(report.event.date).toLocaleDateString('en-UK')}</div>
            </div>
            <div class="info-card">
              <div class="label">إجمالي المواعيد</div>
              <div class="value">${report.total_appointments}</div>
            </div>
            <div class="info-card">
              <div class="label">الحالة</div>
              <div class="value">مؤرشف</div>
            </div>
          </div>

          <!-- Status Summary -->
          <div class="section">
            <h2 class="section-title">ملخص الحالات</h2>
            <div class="summary-grid">
              ${statusData.map(stat => `
                <div class="summary-card">
                  <div class="label">${stat.nameAr}</div>
                  <div class="value">${stat.count}</div>
                  <div class="percentage">${((stat.count / report.total_appointments) * 100).toFixed(1)}%</div>
                  ${stat.special > 0 ? `<div class="percentage">خاص: ${stat.special}</div>` : ''}
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Status Details -->
          <div class="section">
            <h2 class="section-title">تفاصيل توزيع الحالات</h2>
            <table class="data-table">
              <thead>
                <tr>
                  <th>الحالة</th>
                  <th>العدد</th>
                  <th>حالات خاصة</th>
                  <th>النسبة المئوية</th>
                </tr>
              </thead>
              <tbody>
                ${statusData.map(stat => `
                  <tr>
                    <td><strong>${stat.nameAr}</strong></td>
                    <td>${stat.count}</td>
                    <td>${stat.special > 0 ? stat.special : '-'}</td>
                    <td>${((stat.count / report.total_appointments) * 100).toFixed(1)}%</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- Specialty Statistics -->
          <div class="section">
            <h2 class="section-title">إحصائيات التخصصات الطبية</h2>
            <table class="data-table">
              <thead>
                <tr>
                  <th>التخصص</th>
                  <th>عدد المرضى</th>
                  <th>النسبة المئوية</th>
                </tr>
              </thead>
              <tbody>
                ${report.specialty_breakdown.map(stat => {
                  const percentage = ((parseInt(stat.count) / report.total_appointments) * 100).toFixed(1);
                  return `
                    <tr>
                      <td><strong>${stat.name}</strong></td>
                      <td>${stat.count}</td>
                      <td>${percentage}%</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>

          <!-- Gender & Age Demographics -->
          <div class="section">
            <h2 class="section-title">التوزيع الديموغرافي</h2>
            <div class="two-column">
              <div>
                <h3 style="font-size: 16px; margin-bottom: 10px; color: #666;">توزيع الجنس</h3>
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>الجنس</th>
                      <th>العدد</th>
                      <th>النسبة</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${report.gender_breakdown.map(stat => {
                      const genderName = stat.sex === '0' || stat.sex === 'ذكر' ? 'ذكر' : 'أنثى';
                      const percentage = ((parseInt(stat.count) / report.total_appointments) * 100).toFixed(1);
                      return `
                        <tr>
                          <td>${genderName}</td>
                          <td>${stat.count}</td>
                          <td>${percentage}%</td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>
              <div>
                <h3 style="font-size: 16px; margin-bottom: 10px; color: #666;">الفئات العمرية</h3>
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>الفئة العمرية</th>
                      <th>العدد</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${report.age_breakdown.map(stat => `
                      <tr>
                        <td>${stat.age_group} سنة</td>
                        <td>${stat.count}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Geographic Distribution -->
          <div class="section">
            <h2 class="section-title">التوزيع الجغرافي (أعلى 10 ولايات)</h2>
            <table class="data-table">
              <thead>
                <tr>
                  <th>الترتيب</th>
                  <th>الولاية</th>
                  <th>عدد المرضى</th>
                  <th>النسبة المئوية</th>
                </tr>
              </thead>
              <tbody>
                ${report.top_states.map((stat, index) => {
                  const percentage = ((parseInt(stat.count) / report.total_appointments) * 100).toFixed(1);
                  return `
                    <tr>
                      <td>${index + 1}</td>
                      <td><strong>${stat.state}</strong></td>
                      <td>${stat.count}</td>
                      <td>${percentage}%</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>

          <!-- Analysis -->
          <div class="section">
            <h2 class="section-title">التحليل والملاحظات</h2>
            <div class="analysis-box">
              <h3>النقاط الرئيسية:</h3>
              <ul>
                <li>إجمالي المواعيد المؤرشفة: <strong>${report.total_appointments}</strong> موعد</li>
                <li>عدد التخصصات الطبية المشاركة: <strong>${report.specialty_breakdown.length}</strong> تخصص</li>
                <li>التغطية الجغرافية: <strong>${report.top_states.length}+</strong> ولاية</li>
                <li>أكبر تخصص مشاركة: <strong>${report.specialty_breakdown[0]?.name}</strong> بـ <strong>${report.specialty_breakdown[0]?.count}</strong> مريض</li>
                <li>أكثر ولاية تمثيلاً: <strong>${report.top_states[0]?.state}</strong> بـ <strong>${report.top_states[0]?.count}</strong> مريض</li>
                <li>تاريخ الأرشفة: <strong>${new Date(report.event.updated_at).toLocaleDateString('en-UK')}</strong></li>
              </ul>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p>هذا التقرير تم إنشاؤه تلقائياً بواسطة نظام إدارة الحملات الطبية</p>
            <p>جميع الحقوق محفوظة © ${new Date().getFullYear()}</p>
          </div>
        </div>
      </body>
      </html>
    `;
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
              <p className="text-xl font-bold font-droid-arabic-kufi">{new Date(report.event.date).toLocaleDateString('en-UK')}</p>
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
                <span className="text-gray-600 font-droid-arabic-kufi text-sm">
              {stat.status === 'Completed' && 'أنهى الفحص'}
            {stat.status === 'Pending' && 'غائب'}
            {stat.status === 'Waiting' && 'في الإنتظار'}
                  
                  </span>
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
            {stat.status === 'Completed' && 'أنهى الفحص'}
            {stat.status === 'Pending' && 'غائب'}
            {stat.status === 'Waiting' && 'في الإنتظار'}
          </span>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <div>
                <span className="font-droid-arabic-kufi font-bold text-gray-900 block">
                  {stat.count}
                </span>
                <span className="text-xs text-gray-500 font-droid-arabic-kufi">
                  {((parseInt(stat.count) / report.total_appointments) * 100).toFixed(1)}%
                </span>
              </div>
              {stat.special_count > 0 && (
                <div className="bg-blue-100 px-2 py-1 rounded">
                  <span className="text-xs font-droid-arabic-kufi font-semibold text-blue-700">
                    خاص: {stat.special_count}
                  </span>
                </div>
              )}
            </div>
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
                    {new Date().toLocaleDateString('en-UK')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-droid-arabic-kufi text-sm">تاريخ الأرشفة:</span>
                  <span className="font-bold text-red-600 font-droid-arabic-kufi text-sm">
                    {new Date(report.event.updated_at).toLocaleDateString('en-UK')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComprehensiveReport;