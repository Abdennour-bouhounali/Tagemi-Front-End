import { useState, useEffect, useContext } from "react";
import { API_BASE_URL } from '../../../../config/environment';
import { useParams } from "react-router-dom";
import { AppContext } from "../../../../Context/AppContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import {
  TrendingUp,
  Users,
  ThumbsUp,
  Star,
  Loader,
} from "lucide-react";

const apiUrl = API_BASE_URL;

const EvaluationStatistics = () => {
  const { eventId } = useParams();
  const { token } = useContext(AppContext);
  const [statistics, setStatistics] = useState(null);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

  useEffect(() => {
    fetchStatistics();
  }, [eventId]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiUrl}/api/events/${eventId}/evaluations/statistics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok) {
        setEvent(data.event);
        setStatistics(data.statistics);
      }
    } catch (err) {
      console.error("Error fetching statistics:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-droid-arabic-kufi">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <p className="text-gray-600 font-droid-arabic-kufi text-lg">
              لا توجد إحصائيات متاحة لهذا الحدث
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Prepare data for charts
  const ratingsData = [
    { name: "التنظيم العام", value: statistics.average_ratings.overall_organization },
    { name: "الجودة الطبية", value: statistics.average_ratings.medical_quality },
    { name: "أداء الطاقم", value: statistics.average_ratings.staff_performance },
    { name: "سهولة التسجيل", value: statistics.average_ratings.registration_ease },
    { name: "تنظيم المنصة", value: statistics.average_ratings.platform_organization },
  ];

  const recommendationData = [
    { name: "ينصح", value: statistics.would_recommend },
    { name: "لا ينصح", value: statistics.would_not_recommend },
  ];

  const ageData = Object.entries(statistics.age_distribution).map(([name, value]) => ({
    name,
    value,
  }));

  const genderData = Object.entries(statistics.gender_distribution).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 via-blue-50 to-white">
      <div className="w-screen max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-10">

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 font-droid-arabic-kufi">
            إحصائيات التقييمات
          </h1>
          <p className="text-gray-600 font-droid-arabic-kufi text-lg">{event?.name}</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-600 font-droid-arabic-kufi">
                إجمالي التقييمات
              </h3>
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-4xl font-bold text-gray-900 font-droid-arabic-kufi">
              {statistics.total_evaluations}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-600 font-droid-arabic-kufi">
                نسبة التوصية
              </h3>
              <ThumbsUp className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-4xl font-bold text-gray-900 font-droid-arabic-kufi">
              {statistics.recommendation_percentage}%
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-600 font-droid-arabic-kufi">
                متوسط التقييم
              </h3>
              <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-bold text-gray-900 font-droid-arabic-kufi">
                {statistics.average_ratings.overall_average}
              </p>
              <span className="text-lg text-gray-500 font-droid-arabic-kufi">/ 5</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-600 font-droid-arabic-kufi">
                نسبة المعالجة
              </h3>
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-4xl font-bold text-gray-900 font-droid-arabic-kufi">
              {Math.round(
                (statistics.processed_count / statistics.total_evaluations) * 100
              )}
              %
            </p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Average Ratings Bar Chart */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 font-droid-arabic-kufi">
              متوسط التقييمات حسب المعايير
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ratingsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  style={{ fontSize: "12px", fontFamily: "Droid Arabic Kufi" }}
                />
                <YAxis domain={[0, 5]} />
                <Tooltip />
                <Bar dataKey="value" fill="#3B82F6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Recommendation Pie Chart */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 font-droid-arabic-kufi">
              نسبة التوصية
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={recommendationData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {recommendationData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === 0 ? "#10B981" : "#EF4444"}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Age Distribution */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 font-droid-arabic-kufi">
              توزيع الفئات العمرية
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  style={{ fontSize: "11px", fontFamily: "Droid Arabic Kufi" }}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Gender Distribution */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 font-droid-arabic-kufi">
              توزيع الجنس
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {genderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Radar Chart for Overall Performance */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 font-droid-arabic-kufi">
            الأداء الشامل
          </h2>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={ratingsData}>
              <PolarGrid />
              <PolarAngleAxis
                dataKey="name"
                style={{ fontSize: "12px", fontFamily: "Droid Arabic Kufi" }}
              />
              <PolarRadiusAxis angle={90} domain={[0, 5]} />
              <Radar
                name="التقييم"
                dataKey="value"
                stroke="#3B82F6"
                fill="#3B82F6"
                fillOpacity={0.6}
              />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default EvaluationStatistics;