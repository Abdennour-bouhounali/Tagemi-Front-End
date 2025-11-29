import React, { useEffect, useState, useContext } from 'react';
import * as XLSX from 'xlsx';
const apiUrl = import.meta.env.VITE_API_URL;

import { Filter, Check, X, Trash2, ChevronDown, ChevronUp, Download, Phone, MapPin, MessageSquare, User, Calendar, MessageCircle, Star, Eye } from "lucide-react";
import { Select } from '../../Common/FormInputs';
import { AppContext } from "../../../Context/AppContext";

const EvaluationsAdmin = () => {
    const { token } = useContext(AppContext);
    const [evaluations, setEvaluations] = useState([]);
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState('');
    const [filteredEvaluations, setFilteredEvaluations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [expandedEvaluation, setExpandedEvaluation] = useState(null);
    const [processingId, setProcessingId] = useState(null);
    const [whatsappModal, setWhatsappModal] = useState(null);
    const [whatsappMessage, setWhatsappMessage] = useState('');
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedEvaluation, setSelectedEvaluation] = useState(null);

    useEffect(() => {
        fetchEvents();
        fetchEvaluations();
    }, []);

    useEffect(() => {
        filterEvaluations();
    }, [selectedEvent, evaluations]);

    const fetchEvents = () => {
        fetch(`${apiUrl}/api/events`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        })
            .then((response) => response.json())
            .then((data) => {
                setEvents(data.events || []);
            })
            .catch((error) => console.error('Error fetching events:', error));
    };

    const fetchEvaluations = () => {
        setLoading(true);
        fetch(`${apiUrl}/api/evaluations`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        })
            .then((response) => response.json())
            .then((data) => {
                // Ensure data is an array (handle pagination if needed)
                const evals = data.data || data;
                setEvaluations(evals);
                setFilteredEvaluations(evals);
            })
            .catch((error) => console.error('Error fetching evaluations:', error))
            .finally(() => setLoading(false));
    };

    const filterEvaluations = () => {
        let filtered = evaluations;

        if (selectedEvent) {
            filtered = filtered.filter((evaluation) =>
                evaluation.event_id == selectedEvent
            );
        }

        setFilteredEvaluations(filtered);
    };

    const handleEventChange = (e) => {
        setSelectedEvent(e.target.value);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('ar-DZ', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatPhoneForWhatsApp = (phone) => {
        if (!phone) return '';
        let cleaned = phone.toString().replace(/\D/g, '');
        if (cleaned.startsWith('213')) return cleaned;
        if (cleaned.startsWith('0') && cleaned.length === 10) return '213' + cleaned.substring(1);
        if (cleaned.length === 9) return '213' + cleaned;
        if (cleaned.startsWith('00213')) return cleaned.substring(2);
        if (cleaned.length >= 9 && cleaned.length <= 10) return '213' + cleaned.replace(/^0+/, '');
        return cleaned;
    };

    const openWhatsAppComposer = (evaluation) => {
        const defaultText = `السلام عليكم ${evaluation.contact_name || 'سيدي/سيدتي'}،\n\nشكراً لكم على تقييمكم وملاحظاتكم القيمة بخصوص الحملة الطبية.\n\nفريق مؤسسة تجمي للتنمية الإنسانية`;
        setWhatsappMessage(defaultText);
        setWhatsappModal(evaluation);
    };

    const sendWhatsAppMessage = () => {
        if (!whatsappModal) return;

        const phoneNumber = formatPhoneForWhatsApp(whatsappModal.contact_phone);

        if (!phoneNumber || phoneNumber.length < 10) {
            alert('رقم الهاتف غير صحيح أو غير متوفر.');
            return;
        }

        const encodedMessage = encodeURIComponent(whatsappMessage);
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

        window.open(whatsappUrl, '_blank');
        setWhatsappModal(null);
        setWhatsappMessage('');
    };

    const handleDownloadExcel = () => {
        const dataToExport = filteredEvaluations.map(ev => ({
            'الحدث': ev.event?.name,
            'التخصص': ev.specialty,
            'الفئة العمرية': ev.age_range,
            'الجنس': ev.gender,
            'التنظيم العام': ev.overall_organization,
            'الجودة الطبية': ev.medical_quality,
            'أداء الطاقم': ev.staff_performance,
            'سهولة التسجيل': ev.registration_ease,
            'المنصة': ev.platform_organization,
            'ينصح به': ev.would_recommend ? 'نعم' : 'لا',
            'نقاط إيجابية': ev.positive_points,
            'نقاط سلبية': ev.negative_points,
            'اقتراحات': ev.suggestions,
            'تخصصات مقترحة': ev.suggested_specialties,
            'الاسم': ev.contact_name,
            'الهاتف': ev.contact_phone,
            'تاريخ التقييم': new Date(ev.submitted_at).toLocaleDateString('ar-DZ')
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'evaluations');
        XLSX.writeFile(wb, 'evaluations.xlsx');
    };

    const handleMarkAsProcessed = (id) => {
        setProcessingId(id);
        fetch(`${apiUrl}/api/evaluations/${id}/process`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ admin_notes: 'تمت المراجعة' })
        })
            .then((response) => response.json())
            .then((data) => {
                const updatedEvaluations = evaluations.map((ev) =>
                    ev.id === id ? { ...ev, is_processed: true } : ev
                );
                setEvaluations(updatedEvaluations);
                setFilteredEvaluations(updatedEvaluations);
            })
            .catch((error) => console.error('Error processing evaluation:', error))
            .finally(() => setProcessingId(null));
    };

    const handleDelete = (id) => {
        fetch(`${apiUrl}/api/evaluations/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        })
            .then(() => {
                const updated = evaluations.filter((ev) => ev.id !== id);
                setEvaluations(updated);
                setFilteredEvaluations(updated);
                setDeleteConfirm(null);
            })
            .catch((error) => console.error('Error deleting evaluation:', error));
    };

    const renderStars = (rating) => {
        return (
            <div className="flex">
                {[...Array(5)].map((_, i) => (
                    <Star
                        key={i}
                        className={`w-3 h-3 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                    />
                ))}
            </div>
        );
    };

    const openDetails = (evaluation) => {
        setSelectedEvaluation(evaluation);
        setShowDetailsModal(true);
    };

    return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 via-blue-50 to-white">
      <div className="w-screen max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-10">

                {/* Header */}
                <div className="mb-6 sm:mb-8">
                    <h1 className="text-2xl sm:text-4xl font-droid-arabic-kufi text-gray-800 mb-2">التقييمات</h1>
                    <p className="text-sm sm:text-base text-gray-600 font-droid-arabic-kufi">إدارة وعرض تقييمات الحملات الطبية</p>
                </div>

                {/* Filters Card */}
                <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
                    <div className="flex flex-col sm:flex-row gap-4 items-end">
                        <div className="flex-1 w-full">
                            <label className="block text-xs sm:text-sm font-droid-arabic-kufi text-gray-700 mb-1 sm:mb-2">
                                تصفية حسب الحدث
                            </label>
                            <select
                                value={selectedEvent}
                                onChange={handleEventChange}
                                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors bg-white font-droid-arabic-kufi"
                            >
                                <option value="">جميع الأحداث</option>
                                {events.map(event => (
                                    <option key={event.id} value={event.id}>{event.name}</option>
                                ))}
                            </select>
                        </div>

                        <button
                            onClick={handleDownloadExcel}
                            className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-sm sm:text-base font-droid-arabic-kufi rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-green-500 shadow-md flex items-center justify-center gap-2"
                        >
                            <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                            تحميل Excel
                        </button>
                    </div>
                </div>

                {/* Evaluations List */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-gray-600">جاري تحميل التقييمات...</p>
                        </div>
                    ) : filteredEvaluations.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            لا توجد تقييمات لعرضها
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-3 text-right text-sm font-bold text-gray-700">الحدث</th>
                                        <th className="px-4 py-3 text-right text-sm font-bold text-gray-700">التخصص</th>
                                        <th className="px-4 py-3 text-right text-sm font-bold text-gray-700">التقييم العام</th>
                                        <th className="px-4 py-3 text-right text-sm font-bold text-gray-700">ينصح به</th>
                                        <th className="px-4 py-3 text-right text-sm font-bold text-gray-700">معلومات الاتصال</th>
                                        <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredEvaluations.map((evaluation) => (
                                        <tr key={evaluation.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 text-sm text-gray-800">
                                                {evaluation.event?.name}
                                                <div className="text-xs text-gray-500">{formatDate(evaluation.submitted_at)}</div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{evaluation.specialty}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-gray-500 w-20">التنظيم:</span>
                                                        {renderStars(evaluation.overall_organization)}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-gray-500 w-20">الجودة الطبية:</span>
                                                        {renderStars(evaluation.medical_quality)}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {evaluation.would_recommend ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                                                        <ThumbsUp className="w-3 h-3" /> نعم
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                                                        <ThumbsDown className="w-3 h-3" /> لا
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                {evaluation.contact_name ? (
                                                    <div>
                                                        <div className="font-bold text-gray-800">{evaluation.contact_name}</div>
                                                        <div className="text-gray-500 text-xs" dir="ltr">{evaluation.contact_phone}</div>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 text-xs">غير متوفر</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => openDetails(evaluation)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="عرض التفاصيل"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>

                                                    {evaluation.contact_phone && (
                                                        <button
                                                            onClick={() => openWhatsAppComposer(evaluation)}
                                                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                            title="مراسلة عبر واتساب"
                                                        >
                                                            <MessageCircle className="w-4 h-4" />
                                                        </button>
                                                    )}

                                                    <button
                                                        onClick={() => setDeleteConfirm(evaluation.id)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="حذف"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Details Modal */}
            {showDetailsModal && selectedEvaluation && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6 border-b pb-4">
                            <h3 className="text-xl font-bold text-gray-800">تفاصيل التقييم</h3>
                            <button onClick={() => setShowDetailsModal(false)} className="text-gray-500 hover:text-gray-700">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-gray-500 block mb-1">الحدث</label>
                                    <p className="font-medium">{selectedEvaluation.event?.name}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500 block mb-1">تاريخ التقييم</label>
                                    <p className="font-medium">{formatDate(selectedEvaluation.submitted_at)}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500 block mb-1">التخصص</label>
                                    <p className="font-medium">{selectedEvaluation.specialty}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500 block mb-1">الفئة العمرية / الجنس</label>
                                    <p className="font-medium">{selectedEvaluation.age_range} / {selectedEvaluation.gender}</p>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="font-bold mb-3 text-gray-700 border-b pb-2">التقييمات التفصيلية</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span>التنظيم العام</span>
                                        {renderStars(selectedEvaluation.overall_organization)}
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span>الجودة الطبية</span>
                                        {renderStars(selectedEvaluation.medical_quality)}
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span>أداء الطاقم</span>
                                        {renderStars(selectedEvaluation.staff_performance)}
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span>سهولة التسجيل</span>
                                        {renderStars(selectedEvaluation.registration_ease)}
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span>المنصة الرقمية</span>
                                        {renderStars(selectedEvaluation.platform_organization)}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {selectedEvaluation.positive_points && (
                                    <div>
                                        <label className="text-sm text-green-600 font-bold block mb-1">نقاط إيجابية</label>
                                        <p className="bg-green-50 p-3 rounded-lg text-sm">{selectedEvaluation.positive_points}</p>
                                    </div>
                                )}

                                {selectedEvaluation.negative_points && (
                                    <div>
                                        <label className="text-sm text-red-600 font-bold block mb-1">نقاط سلبية</label>
                                        <p className="bg-red-50 p-3 rounded-lg text-sm">{selectedEvaluation.negative_points}</p>
                                    </div>
                                )}

                                {selectedEvaluation.suggestions && (
                                    <div>
                                        <label className="text-sm text-blue-600 font-bold block mb-1">اقتراحات</label>
                                        <p className="bg-blue-50 p-3 rounded-lg text-sm">{selectedEvaluation.suggestions}</p>
                                    </div>
                                )}

                                {selectedEvaluation.suggested_specialties && (
                                    <div>
                                        <label className="text-sm text-gray-600 font-bold block mb-1">تخصصات مقترحة</label>
                                        <p className="bg-gray-50 p-3 rounded-lg text-sm">{selectedEvaluation.suggested_specialties}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* WhatsApp Modal */}
            {whatsappModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
                        <div className="flex items-center mb-4 pb-4 border-b">
                            <MessageCircle className="w-6 h-6 text-green-600 ml-2" />
                            <h3 className="text-lg font-bold">مراسلة عبر واتساب</h3>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">نص الرسالة</label>
                            <textarea
                                value={whatsappMessage}
                                onChange={(e) => setWhatsappMessage(e.target.value)}
                                rows={6}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setWhatsappModal(null)}
                                className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                            >
                                إلغاء
                            </button>
                            <button
                                onClick={sendWhatsAppMessage}
                                className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                                إرسال
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">تأكيد الحذف</h3>
                        <p className="text-gray-600 mb-6">هل أنت متأكد من رغبتك في حذف هذا التقييم؟</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                            >
                                إلغاء
                            </button>
                            <button
                                onClick={() => handleDelete(deleteConfirm)}
                                className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                                حذف
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Helper components for icons
const ThumbsUp = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
    </svg>
);

const ThumbsDown = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
    </svg>
);

export default EvaluationsAdmin;