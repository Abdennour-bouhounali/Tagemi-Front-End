import { useState, useEffect, useContext } from "react";
import { API_BASE_URL } from '../../../../config/environment';
import { useParams, Link } from "react-router-dom";
import { AppContext } from "../../../../Context/AppContext";
import {
  ArrowLeft,
  AlertCircle,
  MapPin,
  Download,
  Printer,
  Map,
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

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const GeographicStats = () => {
  const { eventId } = useParams();
  const { token } = useContext(AppContext);
  
  const [event, setEvent] = useState(null);
  const [stateStats, setStateStats] = useState([]);
  const [cityStats, setCityStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, [eventId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiUrl}/api/archived-events/${eventId}/geographic-stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      
      if (res.ok) {
        setEvent(data.event);
        setStateStats(data.state_statistics);
        setCityStats(data.city_statistics);
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

// STEP 2: With these two functions:
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

  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>إحصائيات جغرافية - ${event?.name}</title>
      <style>
        @page { size: A4; margin: 2cm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Arial', 'Tahoma', sans-serif; line-height: 1.6; color: #333; }
        
        .header {
          text-align: center;
          padding: 20px 0;
          border-bottom: 3px solid #f59e0b;
          margin-bottom: 30px;
        }
        .logo { width: 120px; height: auto; margin-bottom: 15px; }
        .header h1 { font-size: 28px; color: #f59e0b; margin-bottom: 8px; font-weight: bold; }
        
        .data-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 25px;
        }
        .data-table th {
          background-color: #f59e0b;
          color: white;
          padding: 12px;
          text-align: center;
        }
        .data-table td {
          border: 1px solid #e5e7eb;
          padding: 10px;
          text-align: center;
        }
        
        @media print {
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <img src="/tagemi_logo.png" alt="Logo" class="logo" />
        <h1>تقرير الإحصائيات الجغرافية</h1>
        <p>${event?.name}</p>
        <p>تاريخ الإصدار: ${currentDate}</p>
      </div>

      <h2>إحصائيات الولايات</h2>
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
          ${stateStats.map((stat, index) => {
            const percentage = ((parseInt(stat.count) / totalPatients) * 100).toFixed(1);
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

      <h2>أعلى 20 مدينة</h2>
      <table class="data-table">
        <thead>
          <tr>
            <th>الترتيب</th>
            <th>المدينة</th>
            <th>الولاية</th>
            <th>العدد</th>
          </tr>
        </thead>
        <tbody>
          ${cityStats.map((stat, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${stat.city}</td>
              <td>${stat.state}</td>
              <td>${stat.count}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;
};
  const handleExport = () => {
    const csvContent = [
      ["=== إحصائيات الولايات ==="],
      ["الولاية", "العدد"],
      ...stateStats.map(stat => [stat.state, stat.count]),
      [""],
      ["=== إحصائيات المدن (أعلى 20) ==="],
      ["المدينة", "الولاية", "العدد"],
      ...cityStats.map(stat => [stat.city, stat.state, stat.count])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `geographic_stats_${eventId}.csv`;
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

  const totalPatients = stateStats.reduce((sum, stat) => sum + parseInt(stat.count), 0);

  const stateChartData = stateStats.slice(0, 10).map(stat => ({
    name: stat.state,
    value: parseInt(stat.count)
  }));

  const cityChartData = cityStats.slice(0, 15).map(stat => ({
    name: stat.city,
    value: parseInt(stat.count),
    state: stat.state
  }));

  return (
    <div className="w-screen min-h-screen bg-gradient-to-b from-orange-50 to-white p-6 flex flex-col items-center py-10 px-4">
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
                <div className="bg-orange-100 w-16 h-16 rounded-xl flex items-center justify-center">
                  <MapPin className="w-8 h-8 text-orange-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 font-droid-arabic-kufi">
                    إحصائيات جغرافية
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
              <MapPin className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900 font-droid-arabic-kufi">{totalPatients}</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 font-droid-arabic-kufi text-sm">عدد الولايات</span>
              <Map className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900 font-droid-arabic-kufi">{stateStats.length}</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 font-droid-arabic-kufi text-sm">عدد المدن</span>
              <MapPin className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900 font-droid-arabic-kufi">{cityStats.length}</p>
          </div>
        </div>

        {/* State Statistics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* States Bar Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-4 font-droid-arabic-kufi">
              أعلى 10 ولايات
            </h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={stateChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} style={{ fontSize: '11px' }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="عدد المرضى">
                  {stateChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* States Table */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-4 font-droid-arabic-kufi">
              جميع الولايات
            </h3>
            <div className="max-h-[350px] overflow-y-auto">
              <div className="space-y-2">
                {stateStats.map((stat, index) => {
                  const percentage = ((parseInt(stat.count) / totalPatients) * 100).toFixed(1);
                  return (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-orange-100 rounded-lg">
                          <span className="text-xs font-bold text-orange-600 font-droid-arabic-kufi">
                            {index + 1}
                          </span>
                        </div>
                        <span className="font-droid-arabic-kufi font-semibold text-gray-900">
                          {stat.state}
                        </span>
                      </div>
                      <div className="text-left">
                        <p className="font-droid-arabic-kufi font-bold text-gray-900">{stat.count}</p>
                        <p className="text-xs text-gray-500 font-droid-arabic-kufi">{percentage}%</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* City Statistics */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 font-droid-arabic-kufi">
              أعلى 20 مدينة
            </h3>
          </div>

          {/* Cities Bar Chart */}
          <div className="p-6">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={cityChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={120} style={{ fontSize: '11px' }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="عدد المرضى" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Cities Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-right text-sm font-bold text-gray-700 font-droid-arabic-kufi">الترتيب</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-gray-700 font-droid-arabic-kufi">المدينة</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-gray-700 font-droid-arabic-kufi">الولاية</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 font-droid-arabic-kufi">العدد</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 font-droid-arabic-kufi">النسبة المئوية</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {cityStats.map((stat, index) => {
                  const percentage = ((parseInt(stat.count) / totalPatients) * 100).toFixed(1);
                  return (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-right">
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-orange-100 text-orange-600 rounded-lg font-bold text-sm font-droid-arabic-kufi">
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-droid-arabic-kufi font-semibold text-gray-900">
                        {stat.city}
                      </td>
                      <td className="px-6 py-4 text-right font-droid-arabic-kufi text-gray-600">
                        {stat.state}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold font-droid-arabic-kufi">
                          {stat.count}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-droid-arabic-kufi font-semibold text-gray-900">
                        {percentage}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Geographic Insights */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-4 font-droid-arabic-kufi">
            الملاحظات الجغرافية
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <span className="text-orange-600 mt-1">•</span>
                <span className="text-gray-700 font-droid-arabic-kufi">
                  أكثر ولاية تمثيلاً: <strong>{stateStats[0]?.state}</strong> بـ <strong>{stateStats[0]?.count}</strong> مريض
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-orange-600 mt-1">•</span>
                <span className="text-gray-700 font-droid-arabic-kufi">
                  أكثر مدينة تمثيلاً: <strong>{cityStats[0]?.city}</strong> بـ <strong>{cityStats[0]?.count}</strong> مريض
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-orange-600 mt-1">•</span>
                <span className="text-gray-700 font-droid-arabic-kufi">
                  التغطية الجغرافية: <strong>{stateStats.length}</strong> ولاية و <strong>{cityStats.length}</strong> مدينة
                </span>
              </div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <h4 className="font-bold text-gray-800 font-droid-arabic-kufi mb-3">إحصائيات إضافية:</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-droid-arabic-kufi">متوسط المرضى لكل ولاية:</span>
                  <span className="font-bold text-orange-600 font-droid-arabic-kufi">
                    {Math.round(totalPatients / stateStats.length)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-droid-arabic-kufi">متوسط المرضى لكل مدينة:</span>
                  <span className="font-bold text-orange-600 font-droid-arabic-kufi">
                    {Math.round(totalPatients / cityStats.length)}
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

export default GeographicStats;