import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from "../../../Context/AppContext";
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Search,
    UserCheck,
    UserX,
    Clock,
    MessageSquare,
    RefreshCw,
    AlertCircle,
    CheckCircle,
    XCircle,
    ChevronDown,
    ChevronUp,
    Calendar,
    Phone,
    MapPin,
    Heart,
    User,
    Activity,
    Filter,
    Download,
    FileText,
    Users
} from 'lucide-react';
import { Select, Input, Textarea } from '../../Common/FormInputs';

const apiUrl = import.meta.env.VITE_API_URL;

const CheckPatient = () => {
    const { eventId, specialityId } = useParams();
    const navigate = useNavigate();
    const { user, token } = useContext(AppContext);
    
    const [event, setEvent] = useState(null);
    const [speciality, setSpeciality] = useState('');
    const [appointments, setAppointments] = useState([]);
    const [expandedRows, setExpandedRows] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [comment, setComment] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [sexFilter, setSexFilter] = useState('all');
    const [patientAppointments, setPatientAppointments] = useState({});
    const [loadingAppointments, setLoadingAppointments] = useState({});

    // Helper function to determine patient sex
    const getPatientSex = (appointment) => {
        const sex = String(appointment?.sex ?? '').toLowerCase().trim();
        
        if (sex == 0 || sex === 'ذكر' || sex === 'm' || sex === 'male') {
            return 'male';
        } else if (sex == 1 || sex === 'أنثى' || sex === 'f' || sex === 'female') {
            return 'female';
        }
        return 'unknown';
    };

    // Render gender icon component
    const renderGenderIcon = (appointment) => {
        const sex = getPatientSex(appointment);
        
        if (sex === 'male') {
            return (
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 flex-shrink-0" title="ذكر">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                </div>
            );
        } else if (sex === 'female') {
            return (
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-pink-100 flex-shrink-0" title="أنثى">
                    <User className="w-3.5 h-3.5 text-pink-600" />
                </div>
            );
        }
        return (
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 flex-shrink-0" title="غير محدد">
                <User className="w-3.5 h-3.5 text-gray-400" />
            </div>
        );
    };

    useEffect(() => {
        if (eventId && specialityId) {
            fetchEventDetails();
            getWaitingListBySpeciality();
        }
    }, [eventId, specialityId]);

    const fetchEventDetails = async () => {
        try {
            const res = await fetch(`${apiUrl}/api/events/${eventId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            
            if (res.ok) {
                setEvent(data.event || data);
            }
        } catch (error) {
            console.error("Error fetching event:", error);
        }
    };

    const getWaitingListBySpeciality = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${apiUrl}/api/waitinglist/GetWaitingListBySpeciality/${eventId}/${specialityId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setAppointments(data.appointments || []);
            setSpeciality(data.speciality || '');
        } catch (error) {
            console.error("Error fetching waiting list:", error);
            setMessage({ 
                type: 'error', 
                text: 'حدث خطأ أثناء تحميل قائمة الانتظار' 
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchPatientAppointments = async (patientId) => {
        if (patientAppointments[patientId]) {
            return;
        }

        setLoadingAppointments(prev => ({ ...prev, [patientId]: true }));

        try {
            const res = await fetch(`${apiUrl}/api/appointment/patient-appointments/${patientId}/${eventId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            
            if (res.ok) {
                setPatientAppointments(prev => ({
                    ...prev,
                    [patientId]: data.appointments || []
                }));
            }
        } catch (error) {
            console.error("Error fetching patient appointments:", error);
        } finally {
            setLoadingAppointments(prev => ({ ...prev, [patientId]: false }));
        }
    };

    const toggleRow = (patientId) => {
        const isExpanding = !expandedRows[patientId];
        
        setExpandedRows((prev) => ({
            ...prev,
            [patientId]: isExpanding,
        }));

        if (isExpanding) {
            fetchPatientAppointments(patientId);
        }
    };

    const handleSearchChange = (e) => setSearchTerm(e.target.value);

    const filteredAppointments = appointments.filter((appointment) => {
        const matchesSearch = appointment.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            appointment.patient_id?.toString().includes(searchTerm) ||
                            appointment.phone?.includes(searchTerm);
        
        const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter;
        
        const matchesSex = sexFilter === 'all' || getPatientSex(appointment) === sexFilter;
        
        return matchesSearch && matchesStatus && matchesSex;
    });

    // Get displayed appointments (only allowed statuses)
    const displayedAppointments = filteredAppointments.filter(appointment => {
        const allowedStatuses = ['present', 'commingsoon', 'dilatation'];
        const currentStatus = appointment.status?.toLowerCase();
        return allowedStatuses.includes(currentStatus);
    });

    const handleAbsent = async (e, appointmentId) => {
        e.preventDefault();
        try {
            const res = await fetch(`${apiUrl}/api/waitinglist/Absent/${appointmentId}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            
            if (res.ok) {
                setMessage({ type: 'success', text: 'تم تحديد المريض كغائب' });
                setTimeout(() => setMessage({ type: '', text: '' }), 3000);
                getWaitingListBySpeciality();
            }
        } catch (error) {
            console.error("Error marking absent:", error);
            setMessage({ type: 'error', text: 'حدث خطأ أثناء تحديث الحالة' });
        }
    };

    const handleComplete = async (e, appointmentId) => {
        e.preventDefault();
        try {
            const res = await fetch(`${apiUrl}/api/waitinglist/Complete/${appointmentId}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            
            if (res.ok) {
                setMessage({ 
                    type: 'success', 
                    text: data.message || 'تم إجتياز الفحص بنجاح' 
                });
                setTimeout(() => setMessage({ type: '', text: '' }), 3000);
                getWaitingListBySpeciality();
            }
        } catch (error) {
            console.error("Error marking complete:", error);
            setMessage({ type: 'error', text: 'حدث خطأ أثناء تحديث الحالة' });
        }
    };

    const handleAlterSpeciality = async (e, id) => {
        e.preventDefault();
        try {
            const res = await fetch(`${apiUrl}/api/waitinglist/alterSpeciality/${id}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            
            if (res.ok) {
                setMessage({ type: 'success', text: 'تم تبديل التخصصات بنجاح' });
                setTimeout(() => setMessage({ type: '', text: '' }), 3000);
                getWaitingListBySpeciality();
            }
        } catch (error) {
            console.error("Error changing specialty:", error);
            setMessage({ type: 'error', text: 'حدث خطأ أثناء تبديل التخصص' });
        }
    };

    const handleDilatation = async (e, appointmentId) => {
        e.preventDefault();
        try {
            const res = await fetch(`${apiUrl}/api/waitinglist/Dilatation/${appointmentId}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            
            if (res.ok) {
                setMessage({ type: 'info', text: 'تم وضع المريض في حالة التمدد' });
                setTimeout(() => setMessage({ type: '', text: '' }), 3000);
                getWaitingListBySpeciality();
            }
        } catch (error) {
            console.error("Error marking Dilatation:", error);
            setMessage({ type: 'error', text: 'حدث خطأ أثناء تحديث الحالة' });
        }
    };

    const handleFinishedDilatation = async (e, appointmentId) => {
        e.preventDefault();
        try {
            const res = await fetch(`${apiUrl}/api/waitinglist/FinishedDilatation/${appointmentId}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            
            if (res.ok) {
                setMessage({ type: 'success', text: 'تم إنهاء التمدد' });
                setTimeout(() => setMessage({ type: '', text: '' }), 3000);
                getWaitingListBySpeciality();
            }
        } catch (error) {
            console.error("Error marking Finished Dilatation:", error);
            setMessage({ type: 'error', text: 'حدث خطأ أثناء تحديث الحالة' });
        }
    };

    const handleCommingsoon = async (e, appointmentId, position) => {
        e.preventDefault();
        try {
            const res = await fetch(`${apiUrl}/api/waitinglist/Commingsoon/${appointmentId}`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({ position }),
            });
            
            if (res.ok) {
                setMessage({ type: 'info', text: 'تم إنزال المريض في القائمة' });
                setTimeout(() => setMessage({ type: '', text: '' }), 3000);
                getWaitingListBySpeciality();
            }
        } catch (error) {
            console.error("Error marking Comingsoon:", error);
            setMessage({ type: 'error', text: 'حدث خطأ أثناء تحديث الموضع' });
        }
    };

    const openCommentModal = (appointmentId) => {
        setSelectedAppointment(appointmentId);
        setIsModalOpen(true);
    };

    const closeCommentModal = () => {
        setIsModalOpen(false);
        setSelectedAppointment(null);
        setComment('');
    };

    const addComment = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${apiUrl}/api/appointment/addComment`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    appointment_id: selectedAppointment,
                    comment: comment,
                }),
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'تم إضافة الملاحظة بنجاح' });
                setTimeout(() => setMessage({ type: '', text: '' }), 3000);
                closeCommentModal();
                getWaitingListBySpeciality();
            }
        } catch (error) {
            console.error("Error adding comment:", error);
            setMessage({ type: 'error', text: 'حدث خطأ أثناء إضافة الملاحظة' });
        }
    };

    const formatTime = (time) => {
        if (!time) return 'غير محدد';
        return time;
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            Present: { bg: 'bg-green-100', text: 'text-green-700', label: 'حاضر', icon: UserCheck },
            Waiting: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'في الانتظار', icon: Clock },
            Commingsoon: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'قادم قريباً', icon: Activity },
            Dilatation: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'في التمدد', icon: Clock },
            Absent: { bg: 'bg-red-100', text: 'text-red-700', label: 'غائب', icon: UserX },
            Completed: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'مكتمل', icon: CheckCircle },
        };

        const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-700', label: status || 'غير معروف', icon: AlertCircle };
        const Icon = config.icon;

        return (
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold font-droid-arabic-kufi ${config.bg} ${config.text}`}>
                <Icon className="w-3 h-3" />
                {config.label}
            </span>
        );
    };

    const isEyeSpecialty = speciality?.toLowerCase().includes('عيون') || 
                             speciality?.toLowerCase().includes('eye');

    const stats = {
        total: appointments.length,
        present: appointments.filter(a => a.status === 'Present').length,
        waiting: appointments.filter(a => a.status === 'Waiting').length,
        commingsoon: appointments.filter(a => a.status === 'Commingsoon').length,
        dilatation: appointments.filter(a => a.status === 'Dilatation').length,
        completed: appointments.filter(a => a.status === 'Completed').length,
        absent: appointments.filter(a => a.status === 'Absent').length,
    };

    const statusOptions = [
        { value: 'all', label: 'جميع الحالات' },
        { value: 'Present', label: 'حاضر' },
        { value: 'Waiting', label: 'في الانتظار' },
        { value: 'Commingsoon', label: 'قادم قريباً' },
        ...(isEyeSpecialty ? [{ value: 'Dilatation', label: 'في التمدد' }] : []),
        { value: 'Completed', label: 'مكتمل' },
        { value: 'Absent', label: 'غائب' },
    ];

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

    const handleDownloadCSV = () => {
        const headers = [
            'رقم المريض',
            'الاسم الكامل',
            'الحالة',
            'الساعة',
            'الترتيب',
            'تاريخ الميلاد',
            'الهاتف',
            'هاتف ثانوي',
            'الولاية',
            'البلدية',
            'الجنس',
            'الأمراض',
            'الملاحظات'
        ];

        const statusMap = {
            Present: 'حاضر',
            Waiting: 'في الانتظار',
            Commingsoon: 'قادم قريباً',
            Dilatation: 'في التمدد',
            Absent: 'غائب',
            Completed: 'مكتمل'
        };

        const csvRows = filteredAppointments.map(appointment => {
            const status = statusMap[appointment.status] || appointment.status;
            const time = appointment.is_special === 1 ? 'حالة خاصة' : (appointment.hour?.time || 'غير محدد');
            const birthday = appointment.birthday ? new Date(appointment.birthday).toLocaleDateString('en-UK') : '-';
            const sex = appointment.sex === '0' || appointment.sex === 0 ? 'ذكر' : 'أنثى';
            const diseases = appointment.diseases && appointment.diseases !== 'nothing' ? appointment.diseases : '-';
            
            return [
                appointment.patient_id,
                appointment.full_name,
                status,
                time,
                appointment.orderList,
                birthday,
                appointment.phone || '-',
                appointment.phone2 || '-',
                appointment.state || '-',
                appointment.city || '-',
                sex,
                diseases,
                appointment.comment || '-'
            ];
        });

        const BOM = '\uFEFF';
        const csvContent = [
            headers.join(','),
            ...csvRows.map(row => row.map(cell => {
                const cellStr = String(cell).replace(/"/g, '""');
                return `"${cellStr}"`;
            }).join(','))
        ].join('\n');

        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        const filename = `قائمة_الانتظار_${speciality}_${new Date().toLocaleDateString('ar-SA').replace(/\//g, '-')}.csv`;
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setMessage({ 
            type: 'success', 
            text: `تم تحميل ${filteredAppointments.length} موعد بنجاح` 
        });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    };

    return (
        <div className="w-screen min-h-screen bg-gradient-to-b from-blue-100 via-blue-50 to-white flex flex-col items-center py-10 px-4">
            <div className="w-full max-w-7xl mb-4">
                {/* Header */}
                <div className="mb-6">
                    {user.role_id === 1 && 
                    <Link
                        to={`/admin/event-tracking/${eventId}`}
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 font-droid-arabic-kufi transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        العودة إلى متابعة الحدث
                    </Link>
                    }
                    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold text-gray-900 font-droid-arabic-kufi">{speciality}</h1>

                            {user.role_id === 1 && 
                            <button
                                onClick={handleDownloadCSV}
                                disabled={filteredAppointments.length === 0}
                                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors font-droid-arabic-kufi"
                            >
                                <Download className="w-4 h-4" />
                                تحميل CSV
                                {filteredAppointments.length > 0 && (
                                    <span className="bg-green-800 px-2 py-0.5 rounded text-xs">
                                        {filteredAppointments.length}
                                    </span>
                                )}
                            </button>}

                            <button
                                onClick={getWaitingListBySpeciality}
                                className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
                            >
                                <RefreshCw className="w-4 h-4" />
                                تحديث
                            </button>
                        </div>
                    </div>
                </div>

                {/* Alert Messages */}
                {message.text && (
                    <div className={`mb-6 border-r-4 p-4 rounded-lg ${
                        message.type === 'success' ? 'bg-green-50 border-green-500' :
                        message.type === 'error' ? 'bg-red-50 border-red-500' :
                        message.type === 'info' ? 'bg-blue-50 border-blue-500' :
                        'bg-yellow-50 border-yellow-500'
                    }`}>
                        <div className="flex items-center gap-3">
                            {message.type === 'success' && <CheckCircle className="w-5 h-5 text-green-600" />}
                            {message.type === 'error' && <XCircle className="w-5 h-5 text-red-600" />}
                            {message.type === 'info' && <AlertCircle className="w-5 h-5 text-blue-600" />}
                            <p className={`font-droid-arabic-kufi ${
                                message.type === 'success' ? 'text-green-700' :
                                message.type === 'error' ? 'text-red-700' :
                                message.type === 'info' ? 'text-blue-700' :
                                'text-yellow-700'
                            }`}>
                                {message.text}
                            </p>
                        </div>
                    </div>
                )}

                {/* Statistics Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
                    <div className="bg-white rounded-lg shadow p-4 border-r-4 border-blue-500">
                        <p className="text-xs text-gray-600 font-droid-arabic-kufi mb-1">المجموع</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4 border-r-4 border-green-500">
                        <p className="text-xs text-gray-600 font-droid-arabic-kufi mb-1">حاضر</p>
                        <p className="text-2xl font-bold text-green-600">{stats.present}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4 border-r-4 border-blue-500">
                        <p className="text-xs text-gray-600 font-droid-arabic-kufi mb-1">في الانتظار</p>
                        <p className="text-2xl font-bold text-blue-600">{stats.waiting}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4 border-r-4 border-yellow-500">
                        <p className="text-xs text-gray-600 font-droid-arabic-kufi mb-1">قادم قريباً</p>
                        <p className="text-2xl font-bold text-yellow-600">{stats.commingsoon}</p>
                    </div>
                    {isEyeSpecialty && (
                        <div className="bg-white rounded-lg shadow p-4 border-r-4 border-orange-500">
                            <p className="text-xs text-gray-600 font-droid-arabic-kufi mb-1">في التمدد</p>
                            <p className="text-2xl font-bold text-orange-600">{stats.dilatation}</p>
                        </div>
                    )}
                    <div className="bg-white rounded-lg shadow p-4 border-r-4 border-purple-500">
                        <p className="text-xs text-gray-600 font-droid-arabic-kufi mb-1">مكتمل</p>
                        <p className="text-2xl font-bold text-purple-600">{stats.completed}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4 border-r-4 border-red-500">
                        <p className="text-xs text-gray-600 font-droid-arabic-kufi mb-1">غائب</p>
                        <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-100">
                    <div className="flex items-center gap-2 mb-4">
                        <Filter className="w-5 h-5 text-gray-600" />
                        <h3 className="text-lg font-bold text-gray-900 font-droid-arabic-kufi">
                            البحث والتصفية
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <Input
                            icon={Search}
                            type="text"
                            value={searchTerm}
                            onChange={handleSearchChange}
                            placeholder="ابحث برقم المريض، الاسم، أو رقم الهاتف..."
                        />

                        <Select
                            icon={Activity}
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            options={statusOptions}
                        />
                    </div>

                    {/* Sex Filter Buttons */}
                    <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-gray-600" />
                            <span className="text-gray-700 font-droid-arabic-kufi font-semibold">تصفية حسب الجنس:</span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setSexFilter('all')}
                                className={`px-4 py-2 rounded-lg font-droid-arabic-kufi transition-all flex items-center gap-2 ${
                                    sexFilter === 'all'
                                        ? 'bg-gray-700 text-white shadow-md'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                <Users className="w-4 h-4" />
                                الكل
                            </button>
                            <button
                                onClick={() => setSexFilter('male')}
                                className={`px-4 py-2 rounded-lg font-droid-arabic-kufi transition-all flex items-center gap-2 ${
                                    sexFilter === 'male'
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                                }`}
                            >
                                <User className="w-4 h-4" />
                                ذكور
                            </button>
                            <button
                                onClick={() => setSexFilter('female')}
                                className={`px-4 py-2 rounded-lg font-droid-arabic-kufi transition-all flex items-center gap-2 ${
                                    sexFilter === 'female'
                                        ? 'bg-pink-600 text-white shadow-md'
                                        : 'bg-pink-50 text-pink-700 hover:bg-pink-100 border border-pink-200'
                                }`}
                            >
                                <User className="w-4 h-4" />
                                إناث
                            </button>
                        </div>
                        {sexFilter !== 'all' && (
                            <span className="text-sm text-gray-500 font-droid-arabic-kufi">
                                ({displayedAppointments.length} نتيجة)
                            </span>
                        )}
                    </div>
                </div>

                {/* Appointments Table */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                    <div className="overflow-x-auto">
                        <table className="w-full text-center">
                            <thead className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white">
                                <tr>
                                    <th className="px-4 py-3 text-sm font-semibold font-droid-arabic-kufi">رقم المريض</th>
                                    <th className="px-4 py-3 text-sm font-semibold font-droid-arabic-kufi">الاسم الكامل</th>
                                    <th className="px-4 py-3 text-sm font-semibold font-droid-arabic-kufi">الحالة</th>
                                    <th className="px-4 py-3 text-sm font-semibold font-droid-arabic-kufi">الساعة</th>
                                    <th className="px-4 py-3 text-sm font-semibold font-droid-arabic-kufi">الترتيب</th>
                                    {(user.role_id === 1 || user.role_id === 6) && (
                                        <th className="px-4 py-3 text-sm font-semibold font-droid-arabic-kufi">الملاحظات</th>
                                    )}
                                    <th className="px-4 py-3 text-sm font-semibold font-droid-arabic-kufi">الإجراءات</th>
                                    <th className="px-4 py-3 text-sm font-semibold font-droid-arabic-kufi">التفاصيل</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {displayedAppointments.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="px-4 py-8 text-center">
                                            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                            <p className="text-gray-500 font-droid-arabic-kufi">
                                                {searchTerm || sexFilter !== 'all' ? 'لا توجد نتائج للبحث' : 'لا توجد مواعيد في قائمة الانتظار'}
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    displayedAppointments.map((appointment) => (
                                        <React.Fragment key={appointment.id}>
                                            <tr className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                                    #{appointment.patient_id}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-700 font-droid-arabic-kufi">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <span>{appointment.full_name}</span>
                                                        {renderGenderIcon(appointment)}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {getStatusBadge(appointment.status)}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-700 font-droid-arabic-kufi">
                                                    {appointment.is_special === 1 ? (
                                                        <span className="text-red-500 font-bold font-droid-arabic-kufi">
                                                            حالة خاصة
                                                        </span>
                                                    ) : (
                                                        formatTime(appointment.hour?.time)
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`font-bold ${
                                                        appointment.orderList === 0 ? 'text-red-500 text-lg' : ''
                                                    }`}>
                                                        {appointment.orderList}
                                                    </span>
                                                </td>

                                                {(user.role_id === 1 || user.role_id === 6) && (
                                                    <td className="px-4 py-3 text-sm max-w-xs truncate">
                                                        {appointment.comment || '-'}
                                                    </td>
                                                )}

                                                <td className="px-4 py-3">
                                                    <div className="flex flex-wrap gap-2 justify-center">
                                                        {(user.role_id === 1 || user.role_id === 4) && (
                                                            <>
                                                                {isEyeSpecialty && (
                                                                    <>
                                                                        {appointment.status === 'Dilatation' ? (
                                                                            <button
                                                                                onClick={(e) => handleFinishedDilatation(e, appointment.id)}
                                                                                className="text-blue-700 hover:text-white border font-droid-arabic-kufi border-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-xs px-2 py-1"
                                                                            >
                                                                                إنهاء التمدد
                                                                            </button>
                                                                        ) : (
                                                                            <button
                                                                                onClick={(e) => handleDilatation(e, appointment.id)}
                                                                                className="text-orange-700 hover:text-white border font-droid-arabic-kufi border-orange-700 hover:bg-orange-800 focus:ring-4 focus:outline-none focus:ring-orange-300 font-medium rounded-lg text-xs px-2 py-1"
                                                                            >
                                                                                تمدد
                                                                            </button>
                                                                        )}
                                                                    </>
                                                                )}

                                                                {appointment.status !== 'Commingsoon' && (
                                                                    <button
                                                                        onClick={(e) => handleCommingsoon(e, appointment.id, appointment.orderList + 10)}
                                                                        className="text-yellow-700 hover:text-white border font-droid-arabic-kufi border-yellow-700 hover:bg-yellow-800 focus:ring-4 focus:outline-none focus:ring-yellow-300 font-medium rounded-lg text-xs px-2 py-1"
                                                                    >
                                                                        إنزال
                                                                    </button>
                                                                )}

                                                                <button
                                                                    onClick={(e) => handleAlterSpeciality(e, appointment.id)}
                                                                    className="text-amber-700 hover:text-white border font-droid-arabic-kufi border-amber-700 hover:bg-amber-800 focus:ring-4 focus:outline-none focus:ring-amber-300 font-medium rounded-lg text-xs px-2 py-1"
                                                                >
                                                                    تبديل
                                                                </button>

                                                                {appointment.status === 'Commingsoon' && (
                                                                    <button
                                                                        onClick={(e) => handleAbsent(e, appointment.id)}
                                                                        className="text-red-700 hover:text-white border font-droid-arabic-kufi border-red-700 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-xs px-2 py-1"
                                                                    >
                                                                        غائب
                                                                    </button>
                                                                )}

                                                                <button
                                                                    onClick={(e) => handleComplete(e, appointment.id)}
                                                                    className="text-green-700 hover:text-white border font-droid-arabic-kufi border-green-700 hover:bg-green-800 focus:ring-4 focus:outline-none focus:ring-green-300 font-medium rounded-lg text-xs px-2 py-1"
                                                                >
                                                                    إجتاز
                                                                </button>
                                                            </>
                                                        )}

                                                        {(user.role_id === 1 || user.role_id === 6) && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    openCommentModal(appointment.id);
                                                                }}
                                                                type="button"
                                                                className="text-blue-700 hover:text-white border font-droid-arabic-kufi border-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-xs px-2 py-1"
                                                            >
                                                                ملاحظة
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>

                                                <td className="px-4 py-3">
                                                    <button
                                                        onClick={() => toggleRow(appointment.patient_id)}
                                                        className="text-gray-600 hover:text-gray-900 transition-colors"
                                                    >
                                                        {expandedRows[appointment.patient_id] ? (
                                                            <ChevronUp className="w-5 h-5" />
                                                        ) : (
                                                            <ChevronDown className="w-5 h-5" />
                                                        )}
                                                    </button>
                                                </td>
                                            </tr>

                                            {/* Expanded Details Row */}
                                            {expandedRows[appointment.patient_id] && (
                                                <tr className="bg-gray-50">
                                                    <td colSpan="8" className="px-6 py-4">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                            <div className="space-y-3">
                                                                <h4 className="text-sm font-bold text-gray-900 font-droid-arabic-kufi mb-3 flex items-center gap-2">
                                                                    <User className="w-4 h-4" />
                                                                    معلومات المريض
                                                                </h4>
                                                                
                                                                <div className="flex items-center gap-2">
                                                                    {renderGenderIcon(appointment)}
                                                                    <span className="text-sm text-gray-600 font-droid-arabic-kufi">
                                                                        الجنس:
                                                                    </span>
                                                                    <span className="text-sm font-medium text-gray-900 font-droid-arabic-kufi">
                                                                        {appointment.sex === '0' || appointment.sex === 0 ? 'ذكر' : 'أنثى'}
                                                                    </span>
                                                                </div>

                                                                {appointment.diseases && appointment.diseases !== 'nothing' && (
                                                                    <div className="flex items-start gap-2">
                                                                        <Heart className="w-4 h-4 text-gray-500 mt-1" />
                                                                        <div>
                                                                            <span className="text-sm text-gray-600 font-droid-arabic-kufi">
                                                                                الأمراض:
                                                                            </span>
                                                                            <p className="text-sm font-medium text-gray-900 font-droid-arabic-kufi">
                                                                                {appointment.diseases}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className="space-y-3">
                                                                <h4 className="text-sm font-bold text-gray-900 font-droid-arabic-kufi mb-3 flex items-center gap-2">
                                                                    <FileText className="w-4 h-4" />
                                                                    جميع مواعيد المريض في هذا الحدث
                                                                </h4>
                                                                
                                                                {loadingAppointments[appointment.patient_id] ? (
                                                                    <div className="flex items-center gap-2 text-gray-500">
                                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
                                                                        <span className="text-sm font-droid-arabic-kufi">جاري التحميل...</span>
                                                                    </div>
                                                                ) : patientAppointments[appointment.patient_id] && patientAppointments[appointment.patient_id].length > 0 ? (
                                                                    <div className="space-y-2 max-h-64 overflow-y-auto">
                                                                        {patientAppointments[appointment.patient_id].map((appt, index) => {
                                                                            const isCurrentAppointment = appt.id === appointment.id;
                                                                            
                                                                            return (
                                                                                <div 
                                                                                    key={index}
                                                                                    className={`border rounded-lg p-3 hover:shadow-sm transition-shadow ${
                                                                                        isCurrentAppointment 
                                                                                            ? 'bg-blue-50 border-blue-300' 
                                                                                            : 'bg-white border-gray-200'
                                                                                    }`}
                                                                                >
                                                                                    <div className="flex items-center justify-between gap-2 mb-2">
                                                                                        <div className="flex items-center gap-2">
                                                                                            <span className="text-sm font-medium text-gray-900 font-droid-arabic-kufi">
                                                                                                {appt.speciality_name}
                                                                                            </span>
                                                                                            {isCurrentAppointment && (
                                                                                                <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded font-droid-arabic-kufi">
                                                                                                    الحالي
                                                                                                </span>
                                                                                            )}
                                                                                        </div>
                                                                                        {getStatusBadge(appt.status)}
                                                                                    </div>
                                                                                    
                                                                                    <div className="flex items-center gap-4 text-xs text-gray-600 flex-wrap">
                                                                                        <div className="flex items-center gap-1">
                                                                                            <Clock className="w-3 h-3" />
                                                                                            <span className="font-droid-arabic-kufi">
                                                                                                {appt.is_special === 1 ? 'حالة خاصة' : (appt.hour || 'غير محدد')}
                                                                                            </span>
                                                                                        </div>
                                                                                        <div className="flex items-center gap-1">
                                                                                            <Activity className="w-3 h-3" />
                                                                                            <span className="font-droid-arabic-kufi">
                                                                                                الترتيب: {appt.orderList}
                                                                                            </span>
                                                                                        </div>
                                                                                    </div>

                                                                                    {appt.comment && (
                                                                                        <div className="mt-2 pt-2 border-t border-gray-200">
                                                                                            <div className="flex items-start gap-1">
                                                                                                <MessageSquare className="w-3 h-3 text-gray-400 mt-0.5" />
                                                                                                <p className="text-xs text-gray-600 font-droid-arabic-kufi">
                                                                                                    {appt.comment}
                                                                                                </p>
                                                                                            </div>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                ) : (
                                                                    <p className="text-sm text-gray-500 font-droid-arabic-kufi flex items-center gap-2">
                                                                        <AlertCircle className="w-4 h-4" />
                                                                        لا توجد مواعيد أخرى لهذا المريض في هذا الحدث
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Comment Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900 font-droid-arabic-kufi flex items-center gap-2">
                                <MessageSquare className="w-6 h-6 text-blue-600" />
                                أضف ملاحظة
                            </h2>
                            <button
                                onClick={closeCommentModal}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={addComment} className="p-6">
                            <Textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="اكتب ملاحظتك هنا..."
                                rows={6}
                                required
                            />

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={closeCommentModal}
                                    className="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg font-droid-arabic-kufi hover:bg-gray-300 transition-colors"
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 text-white bg-blue-600 font-droid-arabic-kufi rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    حفظ
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CheckPatient;