import { lazy, Suspense, useEffect, useState, useContext } from "react";
import { API_BASE_URL } from '../../../../config/environment';
import { Link, useParams, useNavigate } from "react-router-dom";
import { useLanguage } from "../../../../Context/LanguageContext";
import { AppContext } from "../../../../Context/AppContext";

import ActivityCard from "./ActivityCard";
import { fetchTypes, mediaUrl } from "../../../../utils/publicApi";

const ActivityModal = lazy(() => import("./ActivityModal"));
import {
    Calendar,
    MapPin,
    ArrowLeft,
    Users,
    Heart,
    Clock,
    Tag,
    Edit,
    Trash2,
    Shield,
    ChevronLeft,
    ChevronRight,
    X,
    Play,
    Share2
} from 'lucide-react';
import Footer from "../../HomePage/Components/Footer";
import { sanitizeHtml } from '../../../../utils/safeHtml';

const apiUrl = API_BASE_URL;

export default function ActivityMore() {
    const { Actvityid } = useParams();
    const navigate = useNavigate();
    const { user, token } = useContext(AppContext);
    const { language } = useLanguage();
    
    const [activity, setActivity] = useState(null);
    const [types, setTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Gallery state
    const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
    const [showGallery, setShowGallery] = useState(false);
    
    // Admin state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    
    const isSuperAdmin = user && (user.role_id === 1 || user.role_id === 7);

    const getMediaUrl = mediaUrl;

    async function getTypes() {
        try {
            setTypes(await fetchTypes());
        } catch (error) {
            console.error('Error fetching types:', error);
        }
    }

    async function getActivity() {
        try {
            setLoading(true);
            setError(null);
            const res = await fetch(`${apiUrl}/api/activities/${Actvityid}`, {
                headers: { Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            });
            
            if (!res.ok) {
                throw new Error('Activity not found');
            }
            
            const data = await res.json();
            setActivity(data);
        } catch (error) {
            console.error('Error fetching activity:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        getTypes();
    }, []);

    const [related, setRelated] = useState([]);
    useEffect(() => {
        if (!activity?.type_id) return;
        const controller = new AbortController();
        fetch(`${apiUrl}/api/activities/type/${activity.type_id}`, { signal: controller.signal, headers: { Accept: 'application/json' } })
            .then((r) => (r.ok ? r.json() : []))
            .then((list) => setRelated(list.filter((a) => a.id !== activity.id).slice(0, 3)))
            .catch(() => {});
        return () => controller.abort();
    }, [activity?.id, activity?.type_id]);

    useEffect(() => {
        getActivity();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [Actvityid]);

    const handleEdit = () => {
        setIsModalOpen(true);
    };

    const handleDelete = async () => {
        try {
            const response = await fetch(`${apiUrl}/api/activities/${Actvityid}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                // Navigate back to activities list
                navigate(`/activities/type/${activity.type_id}`);
            } else {
                alert('Failed to delete activity');
            }
        } catch (error) {
            console.error('Error deleting activity:', error);
            alert('Failed to delete activity');
        }
    };

    const handleModalSuccess = (updatedActivity) => {
        setActivity(updatedActivity);
        getActivity(); // Refresh the activity
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'upcoming': return 'bg-blue-100 text-blue-800';
            case 'ongoing': return 'bg-green-100 text-green-800';
            case 'completed': return 'bg-gray-100 text-gray-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusText = (status) => {
        const statusMap = {
            upcoming: { en: 'Upcoming', ar: 'قادم' },
            ongoing: { en: 'Ongoing', ar: 'جاري' },
            completed: { en: 'Completed', ar: 'مكتمل' },
            cancelled: { en: 'Cancelled', ar: 'ملغى' }
        };
        return language === 'en' ? statusMap[status]?.en : statusMap[status]?.ar;
    };

    const nextMedia = () => {
        if (activity?.media) {
            setSelectedMediaIndex((prev) => (prev + 1) % activity.media.length);
        }
    };

    const prevMedia = () => {
        if (activity?.media) {
            setSelectedMediaIndex((prev) => (prev - 1 + activity.media.length) % activity.media.length);
        }
    };

    // Loading State
    if (loading) {
        return (
            <div className="min-h-screen bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                    <div className="animate-pulse space-y-6 sm:space-y-8">
                        <div className="h-64 sm:h-96 bg-gray-300 rounded-2xl"></div>
                        <div className="space-y-4">
                            <div className="h-6 sm:h-8 bg-gray-300 rounded w-3/4"></div>
                            <div className="h-4 bg-gray-200 rounded"></div>
                            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Error State
    if (error || !activity) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center px-4">
                <div className="text-center py-12 sm:py-20">
                    <div className="inline-block p-4 sm:p-6 bg-red-100 rounded-full mb-4 sm:mb-6">
                        <X className="w-12 h-12 sm:w-16 sm:h-16 text-red-600" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 font-droid-arabic-kufi">
                        {language === 'en' ? 'Activity Not Found' : 'النشاط غير موجود'}
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 mb-6 font-droid-arabic-kufi px-4">
                        {language === 'en' 
                            ? 'The activity you are looking for does not exist or has been removed.' 
                            : 'النشاط الذي تبحث عنه غير موجود أو تم حذفه.'
                        }
                    </p>
                    <Link
                        to="/"
                        className="inline-flex items-center px-6 py-3 bg-[#E03A6F] text-white rounded-full hover:bg-[#c8102e] transition-colors font-droid-arabic-kufi"
                    >
                        <ArrowLeft className={`w-5 h-5 ${language === 'en' ? 'mr-2' : 'ml-2 rotate-180'}`} />
                        {language === 'en' ? 'Back to Home' : 'العودة للرئيسية'}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Breadcrumb & Admin Controls */}
            <div className="bg-gray-50 border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        {/* Breadcrumb */}
                        <nav className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-droid-arabic-kufi text-gray-600 overflow-x-auto w-full sm:w-auto">
                            <Link to="/" className="hover:text-[#E03A6F] transition-colors whitespace-nowrap flex-shrink-0">
                                {language === 'en' ? 'Home' : 'الرئيسية'}
                            </Link>
                            <span className="flex-shrink-0">/</span>
                            <Link 
                                to={`/activities/type/${activity.type_id}`} 
                                className="hover:text-[#E03A6F] transition-colors whitespace-nowrap flex-shrink-0 hidden xs:inline"
                            >
                                {activity.type ? (language === 'en' ? activity.type.name_en : activity.type.name_ar) : (language === 'en' ? 'Activities' : 'الأنشطة')}
                            </Link>
                            <span className="flex-shrink-0 hidden xs:inline">/</span>
                            <span className="text-gray-900 font-medium truncate">
                                {language === 'en' ? activity.title_en : activity.title_ar}
                            </span>
                        </nav>

                        {/* Admin Controls */}
                        {isSuperAdmin && (
                            <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-auto">
                                <div className="hidden md:flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-gray-200">
                                    <Shield className="w-4 h-4 text-[#E03A6F]" />
                                    <span className="text-sm font-droid-arabic-kufi text-gray-700">
                                        {language === 'en' ? 'Admin' : 'مدير'}
                                    </span>
                                </div>
                                <button
                                    onClick={handleEdit}
                                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex-shrink-0"
                                    title={language === 'en' ? 'Edit Activity' : 'تعديل النشاط'}
                                >
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex-shrink-0"
                                    title={language === 'en' ? 'Delete Activity' : 'حذف النشاط'}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Hero Section with Media Gallery */}
            <section className="relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                        {/* Media Gallery */}
                        <div className="space-y-3 sm:space-y-4">
                            {activity.media && activity.media.length > 0 ? (
                                <>
                                    {/* Main Media Display */}
                                    <div 
                                        className="relative h-64 sm:h-80 lg:h-96 rounded-xl sm:rounded-2xl overflow-hidden bg-gray-200 cursor-pointer group"
                                        onClick={() => setShowGallery(true)}
                                    >
                                        {activity.media[selectedMediaIndex].type === 'image' ? (
                                            <img
                                                src={getMediaUrl(activity.media[selectedMediaIndex].url)}
                                                alt={language === 'en' ? activity.title_en : activity.title_ar}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                fetchPriority="high"
                                                decoding="async"
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = '/tagemi_consept-800.webp';
                                                }}
                                            />
                                        ) : (
                                            <video
                                                src={getMediaUrl(activity.media[selectedMediaIndex].url)}
                                                className="w-full h-full object-cover"
                                                controls
                                                playsInline
                                            />
                                        )}
                                        
                                        {/* Navigation Arrows */}
                                        {activity.media.length > 1 && (
                                            <>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        prevMedia();
                                                    }}
                                                    className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 sm:p-3 rounded-full shadow-lg transition-all"
                                                >
                                                    <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-900" />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        nextMedia();
                                                    }}
                                                    className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 sm:p-3 rounded-full shadow-lg transition-all"
                                                >
                                                    <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-gray-900" />
                                                </button>
                                            </>
                                        )}

                                        {/* Media Counter */}
                                        {activity.media.length > 1 && (
                                            <div dir="ltr" className="absolute bottom-3 sm:bottom-4 right-3 sm:right-4 bg-black/70 text-white px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs sm:text-sm font-droid-arabic-kufi">
                                                {selectedMediaIndex + 1} / {activity.media.length}
                                            </div>
                                        )}
                                    </div>

                                    {/* Thumbnail Strip */}
                                    {activity.media.length > 1 && (
                                        <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                                            {activity.media.map((media, index) => (
                                                <div
                                                    key={index}
                                                    onClick={() => setSelectedMediaIndex(index)}
                                                    className={`relative flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-lg overflow-hidden cursor-pointer transition-all ${
                                                        index === selectedMediaIndex 
                                                            ? 'ring-2 sm:ring-4 ring-[#E03A6F] scale-105' 
                                                            : 'ring-1 sm:ring-2 ring-gray-300 hover:ring-[#E03A6F] opacity-70 hover:opacity-100'
                                                    }`}
                                                >
                                                    {media.type === 'image' ? (
                                                        <img
                                                            src={getMediaUrl(media.url)}
                                                            alt={`Media ${index + 1}`}
                                                            className="w-full h-full object-cover"
                                                            loading="lazy"
                                                            decoding="async"
                                                            width="96"
                                                            height="96"
                                                            onError={(e) => {
                                                                e.target.onerror = null;
                                                                e.target.src = '/tagemi_consept-800.webp';
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                                                            <Play className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" fill="white" />
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="h-64 sm:h-80 lg:h-96 rounded-xl sm:rounded-2xl bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                                    <div className="text-center text-gray-400">
                                        <Calendar className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3" />
                                        <p className="font-droid-arabic-kufi text-sm sm:text-base">
                                            {language === 'en' ? 'No media available' : 'لا توجد وسائط'}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Activity Info */}
                        <div className="space-y-4 sm:space-y-6">
                            {/* Status Badge */}
                            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                                <span className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-bold font-droid-arabic-kufi ${getStatusColor(activity.status)}`}>
                                    {getStatusText(activity.status)}
                                </span>
                                {activity.featured && (
                                    <span className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-bold bg-yellow-100 text-yellow-800 font-droid-arabic-kufi flex items-center gap-1.5 sm:gap-2">
                                        <Tag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                        {language === 'en' ? 'Featured' : 'مميز'}
                                    </span>
                                )}
                            </div>

                            {/* Title */}
                            <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-[#101E58] font-droid-arabic-kufi leading-snug break-words">
                                {language === 'en' ? activity.title_en : activity.title_ar}
                            </h1>

                            {/* Meta Information */}
                            <div className="space-y-2.5 sm:space-y-3">
                                {activity.location && (
                                    <div className="flex items-start gap-2.5 sm:gap-3 text-gray-700">
                                        <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-[#E03A6F] flex-shrink-0 mt-1" />
                                        <span className="font-droid-arabic-kufi text-sm sm:text-base">{activity.location}</span>
                                    </div>
                                )}
                                
                                {activity.event_date && (
                                    <div className="flex items-center gap-2.5 sm:gap-3 text-gray-700">
                                        <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-[#56e03a] flex-shrink-0" />
                                        <span className="font-droid-arabic-kufi text-sm sm:text-base">
                                            <strong>{language === 'en' ? 'Start:' : 'البداية:'} </strong>
                                            {new Date(activity.event_date).toLocaleDateString(
                                                language === 'en' ? 'en-US' : 'ar-DZ',
                                                { year: 'numeric', month: 'long', day: 'numeric' }
                                            )}
                                        </span>

                                        {activity.event_end_date && (
                                            <div className="flex items-center gap-2.5 sm:gap-3 text-gray-700">
                                                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-[#e91054] flex-shrink-0" />
                                                <span className="font-droid-arabic-kufi text-sm sm:text-base">
                                                    <strong>{language === 'en' ? 'End:' : 'النهاية:'} </strong>
                                                    {new Date(activity.event_end_date).toLocaleDateString(
                                                        language === 'en' ? 'en-US' : 'ar-DZ',
                                                        { year: 'numeric', month: 'long', day: 'numeric' }
                                                    )}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                

                                {activity.created_at && (
                                    <div className="flex items-center gap-2.5 sm:gap-3 text-gray-600 text-xs sm:text-sm">
                                        <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                                        <span className="font-droid-arabic-kufi">
                                            {language === 'en' ? 'Published: ' : 'نشر في: '}
                                            {new Date(activity.created_at).toLocaleDateString(
                                                language === 'en' ? 'en-US' : 'ar-DZ'
                                            )}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Stats */}
                            {(activity.participants_count > 0 || activity.beneficiaries_count > 0) && (
                                <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-4">
                                    {activity.participants_count > 0 && (
                                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 sm:p-4">
                                            <div className="flex items-center gap-2 sm:gap-3">
                                                <div className="bg-blue-600 p-2 sm:p-3 rounded-lg flex-shrink-0">
                                                    <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                                </div>
                                                <div>
                                                    <div className="text-xl sm:text-2xl font-bold text-blue-900">
                                                        {activity.participants_count}
                                                    </div>
                                                    <div className="text-xs sm:text-sm text-blue-700 font-droid-arabic-kufi">
                                                        {language === 'en' ? 'Participants' : 'مشارك'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {activity.beneficiaries_count > 0 && (
                                        <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-3 sm:p-4">
                                            <div className="flex items-center gap-2 sm:gap-3">
                                                <div className="bg-[#E03A6F] p-2 sm:p-3 rounded-lg flex-shrink-0">
                                                    <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                                </div>
                                                <div>
                                                    <div className="text-xl sm:text-2xl font-bold text-pink-900">
                                                        {activity.beneficiaries_count}
                                                    </div>
                                                    <div className="text-xs sm:text-sm text-pink-700 font-droid-arabic-kufi">
                                                        {language === 'en' ? 'Beneficiaries' : 'مستفيد'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Share Button */}
                            <button 
                                onClick={() => {
                                    if (navigator.share) {
                                        navigator.share({
                                            title: language === 'en' ? activity.title_en : activity.title_ar,
                                            url: window.location.href
                                        });
                                    }
                                }}
                                className="w-full sm:w-auto px-5 py-2.5 sm:px-6 sm:py-3 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors font-droid-arabic-kufi flex items-center justify-center gap-2 text-sm sm:text-base"
                            >
                                <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                                {language === 'en' ? 'Share Activity' : 'مشاركة النشاط'}
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Description Section */}
            <section className="bg-gray-50 py-8 sm:py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-6 sm:p-8 md:p-12">
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-4 sm:mb-6 font-droid-arabic-kufi border-b-4 border-[#E03A6F] pb-2 sm:pb-3 inline-block">
                            {language === 'en' ? 'About This Activity' : 'عن هذا النشاط'}
                        </h2>
                        
                        <div 
                            className="rich-content max-w-3xl mx-auto"
                            style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}
                            dangerouslySetInnerHTML={{ 
                                __html: sanitizeHtml(language === 'en' ? activity.description_en : activity.description_ar) 
                            }}
                        />
                    </div>
                </div>
            </section>

            {/* More from the same category */}
            {related.length > 0 && (
                <section className="py-10 sm:py-14 bg-[#F2F4F9]">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <h2 className="text-xl sm:text-2xl font-bold text-[#101E58] mb-6 font-droid-arabic-kufi">
                            {language === 'en' ? 'More activities' : 'أنشطة أخرى'}
                        </h2>
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {related.map((a) => (
                                <ActivityCard key={a.id} activity={a} lang={language === 'en' ? 'en' : 'ar'} />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Back Button */}
            <section className="py-6 sm:py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Link
                        to={`/activities/type/${activity.type_id}`}
                        className="inline-flex items-center px-5 py-2.5 sm:px-6 sm:py-3 bg-gradient-to-r from-[#101E58] to-[#1a2d78] text-white rounded-full hover:from-[#E03A6F] hover:to-[#c8102e] transition-all duration-300 transform hover:scale-105 hover:shadow-lg font-droid-arabic-kufi font-medium text-sm sm:text-base"
                    >
                        <ArrowLeft className={`w-4 h-4 sm:w-5 sm:h-5 ${language === 'en' ? 'mr-2' : 'ml-2 rotate-180'}`} />
                        {language === 'en' ? 'Back to Activities' : 'العودة للأنشطة'}
                    </Link>
                </div>
            </section>

            {/* Fullscreen Gallery Modal */}
            {showGallery && activity.media && activity.media.length > 0 && (
                <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
                    <button
                        onClick={() => setShowGallery(false)}
                        className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-white/10 hover:bg-white/20 text-white p-2 sm:p-3 rounded-full transition-colors z-10"
                    >
                        <X className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>

                    {/* Navigation */}
                    {activity.media.length > 1 && (
                        <>
                            <button
                                onClick={prevMedia}
                                className="absolute left-2 sm:left-4 bg-white/10 hover:bg-white/20 text-white p-3 sm:p-4 rounded-full transition-colors z-10"
                            >
                                <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
                            </button>
                            <button
                                onClick={nextMedia}
                                className="absolute right-2 sm:right-4 bg-white/10 hover:bg-white/20 text-white p-3 sm:p-4 rounded-full transition-colors z-10"
                            >
                                <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
                            </button>
                        </>
                    )}

                    {/* Media Display */}
                    <div className="relative w-full h-full flex items-center justify-center p-4 sm:p-8">
                        {activity.media[selectedMediaIndex].type === 'image' ? (
                            <img
                                src={getMediaUrl(activity.media[selectedMediaIndex].url)}
                                alt={language === 'en' ? activity.title_en : activity.title_ar}
                                className="max-w-full max-h-full object-contain"
                                onError={(e) => {
                                    console.error('Gallery image failed to load:', e.target.src);
                                    e.target.src = '/tagemi_consept-800.webp';
                                }}
                            />
                        ) : (
                            <video
                                src={getMediaUrl(activity.media[selectedMediaIndex].url)}
                                className="max-w-full max-h-full"
                                controls
                                autoPlay
                            />
                        )}
                    </div>

                    {/* Counter */}
                    <div dir="ltr" className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 sm:px-6 sm:py-3 rounded-full font-droid-arabic-kufi text-sm sm:text-base">
                        {selectedMediaIndex + 1} / {activity.media.length}
                    </div>
                </div>
            )}

            {/* Activity Modal */}
            {isModalOpen && (
                <Suspense fallback={null}>
                    <ActivityModal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        activity={activity}
                        typeId={activity.type_id}
                        onSuccess={handleModalSuccess}
                        token={token}
                    />
                </Suspense>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl sm:rounded-2xl max-w-md w-full p-5 sm:p-6">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 font-droid-arabic-kufi">
                            {language === 'en' ? 'Confirm Delete' : 'تأكيد الحذف'}
                        </h3>
                        <p className="text-sm sm:text-base text-gray-600 mb-5 sm:mb-6 font-droid-arabic-kufi">
                            {language === 'en' 
                                ? 'Are you sure you want to delete this activity? This action cannot be undone.' 
                                : 'هل أنت متأكد من حذف هذا النشاط؟ لا يمكن التراجع عن هذا الإجراء.'
                            }
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="px-5 py-2 sm:px-6 sm:py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-droid-arabic-kufi text-sm sm:text-base"
                            >
                                {language === 'en' ? 'Cancel' : 'إلغاء'}
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-5 py-2 sm:px-6 sm:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-droid-arabic-kufi text-sm sm:text-base"
                            >
                                {language === 'en' ? 'Delete' : 'حذف'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Footer types={types} />
        </div>
    );
}