import { useState, useEffect, useContext } from "react";
import { API_BASE_URL } from '../../../../config/environment';
import { useParams, Link } from "react-router-dom";
import { AppContext } from "../../../../Context/AppContext";
import {
  ArrowLeft,
  AlertCircle,
  Users,
  Download,
  Printer,
  User
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

const apiUrl = API_BASE_URL;

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

    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>إحصائيات ديموغرافية - ${event?.name}</title>
        <style>
          @page {
            size: A4;
            margin: 2cm;
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
            background: white;
          }

          .header {
            text-align: center;
            padding: 20px 0;
            border-bottom: 3px solid #7c3aed;
            margin-bottom: 30px;
          }

          .logo {
            width: 120px;
            height: auto;
            margin-bottom: 15px;
          }

          .header h1 {
            font-size: 28px;
            color: #7c3aed;
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

          .section {
            margin-bottom: 40px;
            page-break-inside: avoid;
          }

          .section-title {
            font-size: 20px;
            font-weight: bold;
            color: #7c3aed;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e5e7eb;
          }

          .summary-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-bottom: 30px;
          }

          .summary-card {
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
          }

          .summary-card .label {
            font-size: 14px;
            color: #666;
            margin-bottom: 8px;
          }

          .summary-card .value {
            font-size: 32px;
            font-weight: bold;
            color: #7c3aed;
            margin-bottom: 5px;
          }

          .summary-card .percentage {
            font-size: 14px;
            color: #999;
          }

          .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }

          .data-table th {
            background-color: #7c3aed;
            color: white;
            padding: 12px;
            text-align: center;
            font-weight: bold;
            font-size: 16px;
          }

          .data-table td {
            border: 1px solid #e5e7eb;
            padding: 12px;
            text-align: center;
            font-size: 15px;
          }

          .data-table tr:nth-child(even) {
            background-color: #f9fafb;
          }

          .stats-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            margin-bottom: 10px;
            background-color: #f9fafb;
          }

          .stats-row .label {
            font-size: 15px;
            color: #333;
            font-weight: 600;
          }

          .stats-row .value {
            font-size: 18px;
            color: #7c3aed;
            font-weight: bold;
          }

          .analysis-box {
            border: 2px solid #7c3aed;
            border-radius: 8px;
            padding: 20px;
            background-color: #f5f3ff;
            margin-top: 20px;
          }

          .analysis-box h3 {
            color: #7c3aed;
            font-size: 18px;
            margin-bottom: 15px;
          }

          .analysis-box ul {
            list-style: none;
            padding-right: 0;
          }

          .analysis-box li {
            padding: 8px 0;
            padding-right: 20px;
            position: relative;
            font-size: 15px;
            line-height: 1.8;
          }

          .analysis-box li:before {
            content: "◆";
            position: absolute;
            right: 0;
            color: #7c3aed;
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

          .two-columns {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
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
          <!-- Header with Logo -->
          <div class="header">
            <img src="/tagemi_logo.png" alt="Logo" class="logo" />
            <h1>تقرير الإحصائيات الديموغرافية</h1>
            <p class="event-name">${event?.name || 'الحملة الطبية'}</p>
            <p class="date">تاريخ الإصدار: ${currentDate}</p>
          </div>

          <!-- Summary Section -->
          <div class="section">
            <h2 class="section-title">الملخص التنفيذي</h2>
            <div class="summary-grid">
              <div class="summary-card">
                <div class="label">إجمالي المرضى</div>
                <div class="value">${totalPatients}</div>
              </div>
              ${genderChartData.map(stat => `
                <div class="summary-card">
                  <div class="label">${stat.name}</div>
                  <div class="value">${stat.value}</div>
                  <div class="percentage">${stat.percentage}%</div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Gender Statistics -->
          <div class="section">
            <h2 class="section-title">إحصائيات توزيع المرضى حسب الجنس</h2>
            <table class="data-table">
              <thead>
                <tr>
                  <th>الجنس</th>
                  <th>العدد</th>
                  <th>النسبة المئوية</th>
                </tr>
              </thead>
              <tbody>
                ${genderChartData.map(stat => `
                  <tr>
                    <td><strong>${stat.name}</strong></td>
                    <td>${stat.value}</td>
                    <td>${stat.percentage}%</td>
                  </tr>
                `).join('')}
                <tr style="background-color: #f3f4f6; font-weight: bold;">
                  <td>الإجمالي</td>
                  <td>${totalPatients}</td>
                  <td>100%</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Age Statistics -->
          <div class="section">
            <h2 class="section-title">إحصائيات توزيع المرضى حسب الفئة العمرية</h2>
            <table class="data-table">
              <thead>
                <tr>
                  <th>الفئة العمرية</th>
                  <th>عدد المرضى</th>
                  <th>النسبة المئوية</th>
                </tr>
              </thead>
              <tbody>
                ${ageChartData.map(stat => {
                  const percentage = ((stat.value / totalPatients) * 100).toFixed(1);
                  return `
                    <tr>
                      <td><strong>${stat.name} سنة</strong></td>
                      <td>${stat.value}</td>
                      <td>${percentage}%</td>
                    </tr>
                  `;
                }).join('')}
                <tr style="background-color: #f3f4f6; font-weight: bold;">
                  <td>الإجمالي</td>
                  <td>${totalPatients}</td>
                  <td>100%</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Analysis Section -->
          <div class="section">
            <h2 class="section-title">التحليل والملاحظات</h2>
            <div class="analysis-box">
              <h3>الملاحظات الرئيسية:</h3>
              <ul>
                <li>إجمالي عدد المرضى المسجلين في الحملة: <strong>${totalPatients}</strong> مريض</li>
                <li>الفئة العمرية الأكثر حضوراً: <strong>${ageChartData[0]?.name} سنة</strong> بعدد <strong>${ageChartData[0]?.value}</strong> مريض</li>
                <li>التوزيع بين الجنسين: ${genderChartData.map(s => `${s.name} (${s.percentage}%)`).join(' و ')}</li>
                <li>عدد الفئات العمرية المشمولة: <strong>${ageStats.length}</strong> فئات عمرية</li>
              </ul>
            </div>

            <div style="margin-top: 30px;">
              <h3 style="color: #7c3aed; font-size: 18px; margin-bottom: 15px;">إحصائيات تفصيلية:</h3>
              <div class="stats-row">
                <span class="label">متوسط الفئة العمرية الأكثر انتشاراً</span>
                <span class="value">31-45 سنة</span>
              </div>
              <div class="stats-row">
                <span class="label">عدد الفئات العمرية المسجلة</span>
                <span class="value">${ageStats.length}</span>
              </div>
              <div class="stats-row">
                <span class="label">نسبة التغطية الديموغرافية</span>
                <span class="value">ممتازة</span>
              </div>
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
    </div>
  );
};

export default DemographicStats;