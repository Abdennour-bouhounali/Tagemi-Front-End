import { useContext, useEffect, useState } from 'react';
import { API_BASE_URL } from '../../../config/environment';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AppContext } from "../../../Context/AppContext";
import { 
  ArrowLeft, 
  Calendar, 
  Users, 
  TrendingUp, 
  MapPin, 
  User,
  UserCheck,
  UserX,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Download,
  Building2
} from 'lucide-react';

const apiUrl = API_BASE_URL;

const VisitsStatistics = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const { token } = useContext(AppContext);
    
    const [loading, setLoading] = useState(true);
    const [event, setEvent] = useState(null);
    const [statistics, setStatistics] = useState([]);
    const [totals, setTotals] = useState({});
    const [residenceCounts, setResidenceCounts] = useState([]);
    const [cityCounts, setCityCounts] = useState([]); // NEW: City statistics
    const [error, setError] = useState('');

    useEffect(() => {
        if (eventId) {
            fetchEventDetails();
            fetchStatistics();
        }
    }, [eventId]);

    const fetchEventDetails = async () => {
        try {
            const res = await fetch(`${apiUrl}/api/events/${eventId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const data = await res.json();
            
            if (res.ok) {
                setEvent(data.event || data);
            }
        } catch (err) {
            console.error('Error fetching event:', err);
        }
    };

    const fetchStatistics = async () => {
        try {
            setLoading(true);
            setError('');

            const res = await fetch(`${apiUrl}/api/appointments/event-statistics/${eventId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (!res.ok) {
                throw new Error('Failed to fetch statistics');
            }

            const data = await res.json();
            console.log('Statistics data:', data);

            // Process specialty statistics
            const specialtyStats = data.by_specialty || [];
            setStatistics(specialtyStats);

            // Calculate totals
            const calculatedTotals = {
                total: data.statistics?.total || 0,
                total_present: data.statistics?.present || 0,
                total_absent: data.statistics?.absent || 0,
                total_pending: data.statistics?.pending || 0,
                total_waiting: data.statistics?.waiting || 0,
            };
            setTotals(calculatedTotals);

            // Fetch additional demographic data
            await fetchDemographics();

        } catch (err) {
            console.error('Error fetching statistics:', err);
            setError('حدث خطأ أثناء تحميل الإحصائيات');
        } finally {
            setLoading(false);
        }
    };

    const fetchDemographics = async () => {
        try {
            // Fetch all appointments for this event to calculate demographics
            const res = await fetch(`${apiUrl}/api/appointments/by-event?event_id=${eventId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (res.ok) {
                const data = await res.json();
                const appointments = data.appointments || [];

                // Calculate demographics
                const uniquePatients = new Map();
                appointments.forEach(apt => {
                    if (!uniquePatients.has(apt.patient_id)) {
                        uniquePatients.set(apt.patient_id, apt);
                    }
                });

                const uniqueAppointments = Array.from(uniquePatients.values());

                // Count by gender
                const males = uniqueAppointments.filter(apt => apt.sex === '0' || apt.sex === 0).length;
                const females = uniqueAppointments.filter(apt => apt.sex === '1' || apt.sex === 1).length;

                // Count children (under 10 years old)
                const now = new Date();
                const children = uniqueAppointments.filter(apt => {
                    if (!apt.birthday) return false;
                    const birthDate = new Date(apt.birthday);
                    const age = (now - birthDate) / (1000 * 60 * 60 * 24 * 365.25);
                    return age < 10;
                }).length;

                // Count by residence (state)
                const residenceMap = new Map();
                uniqueAppointments.forEach(apt => {
                    const residence = apt.state || 'unknown';
                    residenceMap.set(residence, (residenceMap.get(residence) || 0) + 1);
                });

                const residenceArray = Array.from(residenceMap.entries()).map(([residence, count]) => ({
                    residence,
                    count
                })).sort((a, b) => b.count - a.count);

                setResidenceCounts(residenceArray);

                // NEW: Count by city
                const cityMap = new Map();
                uniqueAppointments.forEach(apt => {
                    const city = apt.city || 'unknown';
                    cityMap.set(city, (cityMap.get(city) || 0) + 1);
                });

                const cityArray = Array.from(cityMap.entries()).map(([city, count]) => ({
                    city,
                    count
                })).sort((a, b) => b.count - a.count);

                setCityCounts(cityArray);

                // Update totals with demographic data
                setTotals(prev => ({
                    ...prev,
                    total_patients: uniqueAppointments.length,
                    total_males: males,
                    total_females: females,
                    total_children_under_10: children
                }));
            }
        } catch (err) {
            console.error('Error fetching demographics:', err);
        }
    };

    const getResidenceName = (residence) => {
        const residenceNames = {
            tajnint: 'تجنينت',
            bonora: 'آت بونور',
            taghardait: 'تغردايت',
            yazgan: 'آت يزجن',
            mlichat: 'آت مليشت',
            karara: 'القرارة',
            berian: 'بريان',
            warjlan: 'وارجلان'
        };
        return residenceNames[residence] || residence || 'غير معروف';
    };

    const exportToCSV = () => {
        const csvData = [];
        
        // Header
        csvData.push(['التخصص', 'قيد الانتظار', 'حاضر', 'غائب', 'المجموع']);
        
        // Data rows
        statistics.forEach(stat => {
            csvData.push([
                stat.specialty_name,
                stat.pending,
                stat.present,
                stat.absent,
                stat.total
            ]);
        });
        
        // Totals row
        csvData.push([
            'المجموع',
            totals.total_pending,
            totals.total_present,
            totals.total_absent,
            totals.total
        ]);
        
        // Convert to CSV string
        const csvString = csvData.map(row => row.join(',')).join('\n');
        
        // Download
        const blob = new Blob(['\ufeff' + csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `event_${eventId}_statistics.csv`;
        link.click();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 font-droid-arabic-kufi">جاري التحميل...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-red-50 border-r-4 border-red-500 p-6 rounded-lg">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="w-6 h-6 text-red-600" />
                            <p className="text-red-700 font-droid-arabic-kufi">{error}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
    <div className="w-screen min-h-screen bg-gradient-to-b from-blue-100 via-blue-50 to-white flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-7xl mb-4">
                {/* Header */}
                <div className="mb-6">
                    <Link
                        to={`/admin/event-tracking/${eventId}`}
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 font-droid-arabic-kufi transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        العودة إلى متابعة الحدث
                    </Link>

                    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div className="flex items-center gap-4">
                                <div className="bg-blue-100 p-3 rounded-lg">
                                    <TrendingUp className="w-8 h-8 text-blue-600" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900 mb-1 font-droid-arabic-kufi">
                                        إحصائيات الحدث
                                    </h1>
                                    {event && (
                                        <p className="text-gray-600 font-droid-arabic-kufi flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            {event.name}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={fetchStatistics}
                                    className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    تحديث
                                </button>
                                <button
                                    onClick={exportToCSV}
                                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors font-droid-arabic-kufi"
                                >
                                    <Download className="w-4 h-4" />
                                    تصدير CSV
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow p-6 border-r-4 border-blue-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 font-droid-arabic-kufi mb-1">إجمالي المواعيد</p>
                                <p className="text-3xl font-bold text-gray-900">{totals.total || 0}</p>
                            </div>
                            <Users className="w-12 h-12 text-blue-500 opacity-20" />
                        </div>
                    </div>

                    {/* NEW: Total Patients Card */}
                    <div className="bg-white rounded-lg shadow p-6 border-r-4 border-purple-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 font-droid-arabic-kufi mb-1">عدد المرضى</p>
                                <p className="text-3xl font-bold text-purple-600">{totals.total_patients || 0}</p>
                            </div>
                            <User className="w-12 h-12 text-purple-500 opacity-20" />
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6 border-r-4 border-green-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 font-droid-arabic-kufi mb-1">حاضر</p>
                                <p className="text-3xl font-bold text-green-600">{totals.total_present || 0}</p>
                            </div>
                            <UserCheck className="w-12 h-12 text-green-500 opacity-20" />
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6 border-r-4 border-red-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 font-droid-arabic-kufi mb-1">غائب</p>
                                <p className="text-3xl font-bold text-red-600">{totals.total_absent || 0}</p>
                            </div>
                            <UserX className="w-12 h-12 text-red-500 opacity-20" />
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6 border-r-4 border-yellow-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 font-droid-arabic-kufi mb-1">قيد الانتظار</p>
                                <p className="text-3xl font-bold text-yellow-600">{totals.total_pending || 0}</p>
                            </div>
                            <Clock className="w-12 h-12 text-yellow-500 opacity-20" />
                        </div>
                    </div>
                </div>

                {/* Specialty Statistics Table */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6 border border-gray-100">
                    <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-700 border-b border-blue-800">
                        <h2 className="text-xl font-bold text-white font-droid-arabic-kufi flex items-center gap-2">
                            <CheckCircle className="w-6 h-6" />
                            إحصائيات حسب التخصص
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-center">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-sm font-semibold text-gray-700 font-droid-arabic-kufi">
                                        التخصص
                                    </th>
                                    <th className="px-6 py-3 text-sm font-semibold text-gray-700 font-droid-arabic-kufi">
                                        قيد الانتظار
                                    </th>
                                    <th className="px-6 py-3 text-sm font-semibold text-gray-700 font-droid-arabic-kufi">
                                        حاضر
                                    </th>
                                    <th className="px-6 py-3 text-sm font-semibold text-gray-700 font-droid-arabic-kufi">
                                        غائب
                                    </th>
                                    <th className="px-6 py-3 text-sm font-semibold text-gray-700 font-droid-arabic-kufi">
                                        المجموع
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {statistics.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-8 text-center text-gray-500 font-droid-arabic-kufi">
                                            لا توجد إحصائيات متاحة
                                        </td>
                                    </tr>
                                ) : (
                                    <>
                                        {statistics.map((stat) => (
                                            <tr key={stat.specialty_id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900 font-droid-arabic-kufi">
                                                    {stat.specialty_name}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-yellow-600 font-bold">
                                                    {stat.pending}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-green-600 font-bold">
                                                    {stat.present}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-red-600 font-bold">
                                                    {stat.absent}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900 font-bold">
                                                    {stat.total}
                                                </td>
                                            </tr>
                                        ))}
                                        <tr className="bg-blue-50 font-bold border-t-2 border-blue-200">
                                            <td className="px-6 py-4 text-sm text-gray-900 font-droid-arabic-kufi">
                                                المجموع
                                            </td>
                                            <td className="px-6 py-4 text-sm text-yellow-600">
                                                {totals.total_pending || 0}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-green-600">
                                                {totals.total_present || 0}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-red-600">
                                                {totals.total_absent || 0}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                {totals.total || 0}
                                            </td>
                                        </tr>
                                    </>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Demographics Section - Updated Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* General Demographics */}
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                        <div className="p-6 bg-gradient-to-r from-purple-600 to-purple-700 border-b border-purple-800">
                            <h2 className="text-xl font-bold text-white font-droid-arabic-kufi flex items-center gap-2">
                                <User className="w-6 h-6" />
                                إحصائيات عامة
                            </h2>
                        </div>
                        <div className="p-6">
                            <table className="w-full text-center">
                                <thead className="border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-3 text-sm font-semibold text-gray-700 font-droid-arabic-kufi">
                                            الفئة
                                        </th>
                                        <th className="px-4 py-3 text-sm font-semibold text-gray-700 font-droid-arabic-kufi">
                                            المجموع
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    <tr className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm text-gray-900 font-droid-arabic-kufi">
                                            المسجلون
                                        </td>
                                        <td className="px-4 py-3 text-sm font-bold text-gray-900">
                                            {totals.total_patients || 0}
                                        </td>
                                    </tr>
                                    <tr className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm text-gray-900 font-droid-arabic-kufi">
                                            الذكور
                                        </td>
                                        <td className="px-4 py-3 text-sm font-bold text-blue-600">
                                            {totals.total_males || 0}
                                        </td>
                                    </tr>
                                    <tr className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm text-gray-900 font-droid-arabic-kufi">
                                            الإناث
                                        </td>
                                        <td className="px-4 py-3 text-sm font-bold text-pink-600">
                                            {totals.total_females || 0}
                                        </td>
                                    </tr>
                                    <tr className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm text-gray-900 font-droid-arabic-kufi">
                                            الأطفال (أقل من 10 سنوات)
                                        </td>
                                        <td className="px-4 py-3 text-sm font-bold text-green-600">
                                            {totals.total_children_under_10 || 0}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Residence Statistics */}
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                        <div className="p-6 bg-gradient-to-r from-indigo-600 to-indigo-700 border-b border-indigo-800">
                            <h2 className="text-xl font-bold text-white font-droid-arabic-kufi flex items-center gap-2">
                                <MapPin className="w-6 h-6" />
                                إحصائيات حسب الولاية
                            </h2>
                        </div>
                        <div className="p-6 max-h-96 overflow-y-auto">
                            <table className="w-full text-center">
                                <thead className="border-b border-gray-200 sticky top-0 bg-white">
                                    <tr>
                                        <th className="px-4 py-3 text-sm font-semibold text-gray-700 font-droid-arabic-kufi">
                                            المكان
                                        </th>
                                        <th className="px-4 py-3 text-sm font-semibold text-gray-700 font-droid-arabic-kufi">
                                            العدد
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {residenceCounts.length === 0 ? (
                                        <tr>
                                            <td colSpan="2" className="px-4 py-8 text-center text-gray-500 font-droid-arabic-kufi">
                                                لا توجد بيانات متاحة
                                            </td>
                                        </tr>
                                    ) : (
                                        residenceCounts.map((residence, index) => (
                                            <tr key={index} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 text-sm text-gray-900 font-droid-arabic-kufi">
                                                    {getResidenceName(residence.residence)}
                                                </td>
                                                <td className="px-4 py-3 text-sm font-bold text-gray-900">
                                                    {residence.count}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* NEW: City Statistics */}
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                        <div className="p-6 bg-gradient-to-r from-teal-600 to-teal-700 border-b border-teal-800">
                            <h2 className="text-xl font-bold text-white font-droid-arabic-kufi flex items-center gap-2">
                                <Building2 className="w-6 h-6" />
                                إحصائيات حسب المدينة
                            </h2>
                        </div>
                        <div className="p-6 max-h-96 overflow-y-auto">
                            <table className="w-full text-center">
                                <thead className="border-b border-gray-200 sticky top-0 bg-white">
                                    <tr>
                                        <th className="px-4 py-3 text-sm font-semibold text-gray-700 font-droid-arabic-kufi">
                                            المدينة
                                        </th>
                                        <th className="px-4 py-3 text-sm font-semibold text-gray-700 font-droid-arabic-kufi">
                                            العدد
                                        </th>
                                    </tr>
                                </thead>
                               <tbody className="divide-y divide-gray-200">
                                {cityCounts.length === 0 ? (
                                    <tr>
                                    <td colSpan="2" className="px-4 py-8 text-center text-gray-500 font-droid-arabic-kufi">
                                        لا توجد بيانات متاحة
                                    </td>
                                    </tr>
                                ) : (
                                    cityCounts.map((cityItem, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm text-gray-900 font-droid-arabic-kufi">
                                        {cityItem.city === 'unknown' ? 'غير معروف' : 
                                            cityItem.city === "tajnint" ? "تاجنينت" :
                                            cityItem.city === "bonora" ? "آت بونور" :
                                            cityItem.city === "taghardait" ? "تغردايت" :
                                            cityItem.city === "mlichat" ? "آت مليشت" :
                                            cityItem.city === "yazgan" ? "آت يزجن" :
                                            cityItem.city === "berian" ? "آت برقان" :
                                            cityItem.city === "karara" ? "القرارة" :
                                            cityItem.city === "warglen" ? "وارجلان" :
                                            cityItem.city
                                        }
                                        </td>
                                        <td className="px-4 py-3 text-sm font-bold text-gray-900">
                                        {cityItem.count}
                                        </td>
                                    </tr>
                                    ))
                                )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VisitsStatistics;