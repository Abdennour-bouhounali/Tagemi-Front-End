import { useEffect, useState, useContext } from "react";
import { Link, useParams } from "react-router-dom";
import AboutActvity from "./Components/AboutActvity";
import Footer from "../HomePage/Components/Footer";
import ActivityModal from "./Components/ActivityModal";
import { useLanguage } from "../../../Context/LanguageContext";
import { AppContext } from "../../../Context/AppContext";
import { 
    Calendar, 
    MapPin, 
    ArrowRight, 
    Grid3x3, 
    List, 
    Search,
    Filter,
    Play,
    Eye,
    TrendingUp,
    Clock,
    Plus,
    Edit,
    Trash2,
    Shield,
    UserCheck  // Add this

} from 'lucide-react';

const apiUrl = import.meta.env.VITE_API_URL;

export default function Activities() {
    const { TypeId } = useParams();
    const { user, token } = useContext(AppContext);
    const [type, setType] = useState({ 
        image_url: '/tagemi_consept.png', 
        description_en: '', 
        description_ar: '' 
    });
    const [activities, setActivities] = useState([]);
    const [filteredActivities, setFilteredActivities] = useState([]);
    const [types, setTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    // 1. New State for Year Filter
    const [selectedYear, setSelectedYear] = useState('all'); 
    const { language } = useLanguage();
    
    // Admin state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [activityToDelete, setActivityToDelete] = useState(null);

    // Check if user is super admin
    const isSuperContentAdmin = user && (user.role_id === 1 || user.role_id === 7);

    // Helper function to get correct media URL
    const getMediaUrl = (url) => {
        if (!url) return '/tagemi_consept.png';
        url = url.replace(/^\/+/, '');
        if (url.startsWith('storage/')) {
            return `${apiUrl}/${url}`;
        }
        return `${apiUrl}/storage/${url}`;
    };

    // 2. Logic to extract unique years from loaded activities
    const availableYears = [...new Set(activities.map(a => {
        // We use event_date primarily, fallback to created_at
        const dateStr = a.event_date || a.created_at;
        return dateStr ? new Date(dateStr).getFullYear() : null;
    }))].filter(Boolean).sort((a, b) => b - a);

    async function getTypes() {
        try {
            const res = await fetch(`${apiUrl}/api/types`);
            const data = await res.json();
            setTypes(data);
        } catch (error) {
            console.error('Error fetching types:', error);
        }
    }

    async function getType() {
        try {
            const res = await fetch(`${apiUrl}/api/types/${TypeId}`);
            if (res.ok) {
                const data = await res.json();
                setType(data);
            }
        } catch (error) {
            console.error('Error fetching type:', error);
        }
    }

    async function getAllActivities() {
        try {
            setLoading(true);
            const res = await fetch(`${apiUrl}/api/activities/type/${TypeId}`);
            if (res.ok) {
                const data = await res.json();
                console.log('Activities data:', data);
                setActivities(data);
                setFilteredActivities(data);
            }
        } catch (error) {
            console.error('Error fetching activities:', error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        getTypes();
    }, []);

    useEffect(() => {
        getType();
        getAllActivities();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [TypeId]);

    // 3. Updated Filter Logic
    useEffect(() => {
        let filtered = [...activities];

        // Search Filter
        if (searchQuery) {
            filtered = filtered.filter(activity => {
                const title = language === 'en' ? activity.title_en : activity.title_ar;
                const description = language === 'en' ? activity.description_en : activity.description_ar;
                return title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       description.toLowerCase().includes(searchQuery.toLowerCase());
            });
        }

        // Year Filter
        if (selectedYear !== 'all') {
            filtered = filtered.filter(activity => {
                const dateStr = activity.event_date || activity.created_at;
                if (!dateStr) return false;
                const year = new Date(dateStr).getFullYear();
                return year.toString() === selectedYear.toString();
            });
        }

        // Sort Logic
        filtered.sort((a, b) => {
            if (sortBy === 'newest') {
                return new Date(b.created_at || 0) - new Date(a.created_at || 0);
            } else if (sortBy === 'oldest') {
                return new Date(a.created_at || 0) - new Date(b.created_at || 0);
            } else if (sortBy === 'title') {
                const titleA = language === 'en' ? a.title_en : a.title_ar;
                const titleB = language === 'en' ? b.title_en : b.title_ar;
                return titleA.localeCompare(titleB);
            }
            return 0;
        });

        setFilteredActivities(filtered);
    }, [searchQuery, sortBy, selectedYear, activities, language]);

    const truncateHtml = (html, maxLength) => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        let textContent = tempDiv.textContent || tempDiv.innerText || '';
        if (textContent.length > maxLength) {
            textContent = textContent.substring(0, maxLength) + '...';
        }
        return textContent;
    };

    // Admin Functions
    const handleAddActivity = () => {
        setSelectedActivity(null);
        setIsModalOpen(true);
    };

    const handleEditActivity = (activity, e) => {
        e.preventDefault();
        e.stopPropagation();
        setSelectedActivity(activity);
        setIsModalOpen(true);
    };

    const handleDeleteActivity = async (activityId, e) => {
        e.preventDefault();
        e.stopPropagation();
        setActivityToDelete(activityId);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        try {
            const response = await fetch(`${apiUrl}/api/activities/${activityToDelete}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                setActivities(activities.filter(a => a.id !== activityToDelete));
                setShowDeleteConfirm(false);
                setActivityToDelete(null);
            } else {
                alert('Failed to delete activity');
            }
        } catch (error) {
            console.error('Error deleting activity:', error);
            alert('Failed to delete activity');
        }
    };

    const handleModalSuccess = (savedActivity) => {
        if (selectedActivity) {
            // Update existing activity
            setActivities(activities.map(a => 
                a.id === savedActivity.id ? savedActivity : a
            ));
        } else {
            // Add new activity
            setActivities([savedActivity, ...activities]);
        }
        getAllActivities();
    };

    const SkeletonCard = () => (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse">
            <div className="h-56 bg-gray-300"></div>
            <div className="p-6 space-y-4">
                <div className="h-6 bg-gray-300 rounded w-3/4"></div>
                <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
                <div className="h-10 bg-gray-300 rounded-full w-32"></div>
            </div>
        </div>
    );

    const EmptyState = () => (
        <div className="text-center py-20 animate-fade-in">
            <div className="inline-block p-6 bg-gray-100 rounded-full mb-6">
                <Search className="w-16 h-16 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-700 mb-3 font-droid-arabic-kufi">
                {language === 'en' ? 'No Activities Found' : 'لا توجد أنشطة'}
            </h3>
            <p className="text-gray-500 mb-6 font-droid-arabic-kufi max-w-md mx-auto">
                {language === 'en' 
                    ? 'Try adjusting your search or filters to find what you\'re looking for.' 
                    : 'حاول ضبط البحث أو الفلاتر للعثور على ما تبحث عنه.'
                }
            </p>
            {(searchQuery || selectedYear !== 'all') && (
                <button
                    onClick={() => {
                        setSearchQuery('');
                        setSelectedYear('all');
                    }}
                    className="px-6 py-3 bg-[#E03A6F] text-white rounded-full hover:bg-[#c8102e] transition-all duration-300 font-droid-arabic-kufi"
                >
                    {language === 'en' ? 'Clear Filters' : 'مسح الفلاتر'}
                </button>
            )}
        </div>
    );
        // Format time ago
    const getTimeAgo = (dateString) => {
        if (!dateString) return '';
        const now = new Date();
        const updated = new Date(dateString);
        const diffInSeconds = Math.floor((now - updated) / 1000);
        
        if (diffInSeconds < 60) return language === 'en' ? 'Just now' : 'الآن';
        if (diffInSeconds < 3600) {
            const mins = Math.floor(diffInSeconds / 60);
            return language === 'en' ? `${mins}m ago` : `منذ ${mins} دقيقة`;
        }
        if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return language === 'en' ? `${hours}h ago` : `منذ ${hours} ساعة`;
        }
        const days = Math.floor(diffInSeconds / 86400);
        return language === 'en' ? `${days}d ago` : `منذ ${days} يوم`;
    };

    // Check if user is super admin (role_id === 1)
    const isSuperAdmin = user && user.role_id === 1;
    // Render Last Updated By Badge (Only for Super Admin)
const renderUpdaterBadge = (activity) => {
    if (!isSuperAdmin || !activity.updater) return null;

    return (
        <div className="my-3 pt-3 border-t border-gray-200">
            <div className="flex items-center gap-2 text-xs text-gray-600 font-droid-arabic-kufi">
                <UserCheck className="w-4 h-4 text-blue-600" />
                <span className="font-medium">
                    {language === 'en' ? 'Last updated by:' : 'آخر تحديث بواسطة:'}
                </span>
                <span className="font-semibold text-gray-900">
                    {activity.updater.name}
                </span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-500">
                    {getTimeAgo(activity.updated_at)}
                </span>
            </div>
        </div>
    );
};

    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section */}
            <div className="relative w-full bg-gradient-to-br from-[#101E58] via-[#1a2d78] to-[#2a3d88] overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-0 w-96 h-96 bg-[#E03A6F] rounded-full filter blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#E03A6F] rounded-full filter blur-3xl transform translate-x-1/2 translate-y-1/2"></div>
                </div>

                <div className="absolute inset-0" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}></div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
                    {/* Breadcrumb */}
                    <nav className="flex items-center gap-2 text-white/80 text-sm font-droid-arabic-kufi mb-8">
                        <Link to="/" className="hover:text-[#E03A6F] transition-colors flex items-center gap-2">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                            </svg>
                            {language === 'en' ? 'Home' : 'الرئيسية'}
                        </Link>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-white font-medium">
                            {language === 'en' ? type.name_en : type.name_ar}
                        </span>
                    </nav>

                    {/* Admin Badge */}
                    {isSuperContentAdmin && (
                        <div className="absolute top-6 right-4 sm:right-8">
                            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 shadow-lg">
                                <Shield className="w-4 h-4 text-white" />
                                <span className="text-white text-sm font-droid-arabic-kufi font-medium">
                                    {language === 'en' ? 'Admin Mode' : 'وضع المدير'}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Main Content */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div className={language === 'ar' ? 'lg:order-2' : ''}>
                            <div className="space-y-6">
                                <div className="inline-flex items-center gap-2 bg-[#E03A6F]/20 backdrop-blur-sm px-4 py-2 rounded-full border border-[#E03A6F]/30">
                                    <TrendingUp className="w-4 h-4 text-[#E03A6F]" />
                                    <span className="text-[#E03A6F] text-sm font-droid-arabic-kufi font-medium">
                                        {language === 'en' ? 'Activity Category' : 'فئة النشاط'}
                                    </span>
                                </div>

                                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white font-droid-arabic-kufi leading-tight">
                                    {language === 'en' ? type.name_en : type.name_ar}
                                </h1>

                                {(type.description_en || type.description_ar) && (
                                    <p className="text-lg text-white/80 font-droid-arabic-kufi leading-relaxed max-w-xl">
                                        {truncateHtml(
                                            language === 'en' ? type.description_en : type.description_ar,
                                            150
                                        )}
                                    </p>
                                )}

                                <div className="flex flex-wrap items-center gap-6 pt-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center">
                                            <TrendingUp className="w-6 h-6 text-[#E03A6F]" />
                                        </div>
                                        <div>
                                            <div className="text-3xl font-bold text-white">
                                                {activities.length}
                                            </div>
                                            <div className="text-sm text-white/70 font-droid-arabic-kufi">
                                                {language === 'en' ? 'Activities' : 'نشاط'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center">
                                            <Calendar className="w-6 h-6 text-[#E03A6F]" />
                                        </div>
                                        <div>
                                            <div className="text-3xl font-bold text-white">
                                                {new Date().getFullYear()}
                                            </div>
                                            <div className="text-sm text-white/70 font-droid-arabic-kufi">
                                                {language === 'en' ? 'Current Year' : 'السنة الحالية'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <button
                                        onClick={() => window.scrollTo({ top: document.getElementById('activities-section')?.offsetTop - 100, behavior: 'smooth' })}
                                        className="group inline-flex items-center gap-3 bg-[#E03A6F] hover:bg-[#c8102e] text-white px-8 py-4 rounded-full font-droid-arabic-kufi font-medium text-lg transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105"
                                    >
                                        {language === 'en' ? 'Explore Activities' : 'استكشف الأنشطة'}
                                        <ArrowRight className={`w-5 h-5 transition-transform group-hover:translate-x-1 ${language === 'ar' ? 'rotate-180' : ''}`} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className={`relative ${language === 'ar' ? 'lg:order-1' : ''}`}>
                            <div className="relative">
                                <div className="absolute -top-4 -left-4 w-72 h-72 bg-[#E03A6F] rounded-full opacity-20 blur-3xl"></div>
                                <div className="absolute -bottom-4 -right-4 w-72 h-72 bg-blue-500 rounded-full opacity-20 blur-3xl"></div>
                                
                                <div className="relative z-10 rounded-3xl overflow-hidden shadow-2xl border-4 border-white/10 backdrop-blur-sm transform hover:scale-105 transition-transform duration-500">
                                    <img 
                                        src={`${apiUrl}/${type.image_url}`} 
                                        className="w-full h-[400px] object-cover"
                                        alt={language === 'en' ? type.name_en : type.name_ar}
                                        onError={(e) => {
                                            e.target.src = '/tagemi_consept.png';
                                        }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#101E58]/50 to-transparent"></div>
                                    
                                    <div className="absolute bottom-6 left-6 right-6">
                                        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="text-sm text-gray-600 font-droid-arabic-kufi mb-1">
                                                        {language === 'en' ? 'Total Activities' : 'مجموع الأنشطة'}
                                                    </div>
                                                    <div className="text-2xl font-bold text-[#101E58]">
                                                        {activities.length}
                                                    </div>
                                                </div>
                                                <div className="w-12 h-12 bg-gradient-to-br from-[#E03A6F] to-[#c8102e] rounded-xl flex items-center justify-center">
                                                    <TrendingUp className="w-6 h-6 text-white" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <AboutActvity 
                TypeDescription={language === 'en' ? type.description_en : type.description_ar} 
                ImageUrl={`${apiUrl}/${type.image_url}`} 
            />

            {/* Search and Filter Section */}
            <section 
                id="activities-section"
                className="py-12 md:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-gray-50 to-white"
            >               
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
                        {/* Search Bar */}
                        <div className="relative flex-1 max-w-md">
                            <Search className={`absolute ${language === 'en' ? 'right-4' : 'left-4'} top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5`} />
                            <input
                                type="text"
                                placeholder={language === 'en' ? 'Search activities...' : 'البحث عن الأنشطة...'}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={`w-full ${language === 'en' ? 'pl-12 pr-4' : 'pr-12 pl-4'} py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E03A6F] focus:border-transparent transition-all font-droid-arabic-kufi`}
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className={`absolute ${language === 'en' ? 'right-4' : 'left-4'} top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600`}
                                >
                                    ×
                                </button>
                            )}
                        </div>

                        {/* Controls */}
                        <div className="flex gap-3 items-center flex-wrap">
                            {/* Add Button (Admin Only) */}
                            {isSuperContentAdmin && (
                                <button
                                    onClick={handleAddActivity}
                                    className="px-4 py-3 bg-[#E03A6F] text-white rounded-xl hover:bg-[#c8102e] transition-colors flex items-center gap-2 font-droid-arabic-kufi"
                                >
                                    <Plus className="w-5 h-5" />
                                    <span className="hidden sm:inline">{language === 'en' ? 'Add Activity' : 'إضافة نشاط'}</span>
                                </button>
                            )}

                            {/* 4. NEW: Year Dropdown */}
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(e.target.value)}
                                    className="pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E03A6F] appearance-none bg-white cursor-pointer font-droid-arabic-kufi"
                                >
                                    <option value="all">{language === 'en' ? 'All Years' : 'كل السنوات'}</option>
                                    {availableYears.map(year => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Sort Dropdown */}
                            <div className="relative">
                                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E03A6F] appearance-none bg-white cursor-pointer font-droid-arabic-kufi"
                                >
                                    <option value="newest">{language === 'en' ? 'Newest First' : 'الأحدث أولاً'}</option>
                                    <option value="oldest">{language === 'en' ? 'Oldest First' : 'الأقدم أولاً'}</option>
                                    <option value="title">{language === 'en' ? 'By Title' : 'حسب العنوان'}</option>
                                </select>
                            </div>

                            {/* View Toggle */}
                            <div className="flex bg-white border border-gray-300 rounded-xl overflow-hidden sm:flex">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-3 transition-colors ${viewMode === 'grid' ? 'bg-[#E03A6F] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                                    title={language === 'en' ? 'Grid View' : 'عرض الشبكة'}
                                >
                                    <Grid3x3 className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-3 transition-colors ${viewMode === 'list' ? 'bg-[#E03A6F] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                                    title={language === 'en' ? 'List View' : 'عرض القائمة'}
                                >
                                    <List className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Results count */}
                    {!loading && (
                        <div className="mt-4 text-sm text-gray-600 font-droid-arabic-kufi">
                            {language === 'en' 
                                ? `Showing ${filteredActivities.length} of ${activities.length} activities` 
                                : `عرض ${filteredActivities.length} من ${activities.length} نشاط`
                            }
                        </div>
                    )}
                </div>
            </section>

            {/* Activities Section */}
            <section className="py-12 md:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-gray-50 to-white">
                <div className="max-w-7xl mx-auto">
                    {loading ? (
                        <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-6 md:gap-8`}>
                            {[...Array(6)].map((_, i) => (
                                <SkeletonCard key={i} />
                            ))}
                        </div>
                    ) : filteredActivities.length === 0 ? (
                        <EmptyState />
                    ) : (
                        <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-6 md:gap-8`}>
                            {filteredActivities.map((activity, index) => (
                                viewMode === 'grid' ? (
                                    // Grid View Card
                                    <div 
                                        key={activity.id}
                                        className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl overflow-hidden transition-all duration-500 transform hover:-translate-y-2 flex flex-col animate-fade-in relative"
                                        style={{ animationDelay: `${index * 100}ms` }}
                                    >
                                        {/* Admin Controls */}
                                        {isSuperContentAdmin && (
                                            <div className="absolute top-4 left-4 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => handleEditActivity(activity, e)}
                                                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                                    title={language === 'en' ? 'Edit' : 'تعديل'}
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={(e) => handleDeleteActivity(activity.id, e)}
                                                    className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                                    title={language === 'en' ? 'Delete' : 'حذف'}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}

                                        {/* Media Section */}
                                        <div className="relative h-56 overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300">
                                            {activity.media && activity.media.length > 0 ? (
                                                <>
                                                    {activity.media[0].type === 'image' && (
                                                        <img
                                                            src={getMediaUrl(activity.media[0].url)}
                                                            alt={language === 'en' ? activity.title_en : activity.title_ar}
                                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                            onError={(e) => {
                                                                console.error('Image failed to load:', e.target.src);
                                                                e.target.src = '/tagemi_consept.png';
                                                            }}
                                                        />
                                                    )}
                                                    {activity.media[0].type === 'video' && (
                                                        <>
                                                            <video
                                                                src={getMediaUrl(activity.media[0].url)}
                                                                className="w-full h-full object-cover"
                                                                muted
                                                                loop
                                                                playsInline
                                                            ></video>
                                                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/20 transition-colors">
                                                                <div className="bg-white/90 rounded-full p-4 transform group-hover:scale-110 transition-transform">
                                                                    <Play className="w-8 h-8 text-[#E03A6F]" fill="currentColor" />
                                                                </div>
                                                            </div>
                                                        </>
                                                    )}
                                                </>
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Eye className="w-16 h-16 text-gray-400" />
                                                </div>
                                            )}
                                            
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                            
                                            <div className="absolute top-4 right-4">
                                                <span className="px-3 py-1 bg-[#E03A6F] text-white text-xs font-bold rounded-full shadow-lg font-droid-arabic-kufi">
                                                        {activity.status === 'upcoming' ? language === 'en' ? 'Upcoming' : 'قادم' : ''}
                                                        {activity.status === 'ongoing' ? language === 'en' ? 'Ongoing' : 'جاري': ''}
                                                        {activity.status === 'completed' ? language === 'en' ? 'Completed' : 'مكتمل': ''}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="p-6 flex-1 flex flex-col">
                                            <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-[#E03A6F] transition-colors font-droid-arabic-kufi leading-tight">
                                                {language === 'en' ? activity.title_en : activity.title_ar}
                                            </h3>
                                            
                                            <p className="text-gray-600 mb-4 line-clamp-3 flex-1 font-droid-arabic-kufi text-sm leading-relaxed">
                                                {truncateHtml(
                                                    language === 'en' ? activity.description_en : activity.description_ar, 
                                                    150
                                                )}
                                            </p>
<div className="flex items-center gap-2 mb-3 text-gray-700">
  <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-[#56e03a] flex-shrink-0" />
  <span className="font-droid-arabic-kufi text-xs sm:text-sm">
    {activity.event_end_date ? (
      <>
        <strong>{language === 'en' ? 'Duration:' : 'المدة:'} </strong>
        {new Date(activity.event_date).toLocaleDateString(
          language === 'en' ? 'en-US' : 'ar-DZ',
          { year: 'numeric', month: 'short', day: 'numeric' }
        )}
        {' '}<span className="text-gray-500">{language === 'en' ? '→' : '←'}</span>{' '}
        {new Date(activity.event_end_date).toLocaleDateString(
          language === 'en' ? 'en-US' : 'ar-DZ',
          { year: 'numeric', month: 'short', day: 'numeric' }
        )}
      </>
    ) : (
      <>
        <strong>{language === 'en' ? 'Date:' : 'التاريخ:'} </strong>
        {new Date(activity.event_date).toLocaleDateString(
          language === 'en' ? 'en-US' : 'ar-DZ',
          { year: 'numeric', month: 'long', day: 'numeric' }
        )}
      </>
    )}
  </span>
</div>



                                            {renderUpdaterBadge(activity)}

                                            <Link 
                                                to={`/activities/${activity.id}`} 
                                                className="group/btn inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-[#101E58] to-[#1a2d78] text-white rounded-full hover:from-[#E03A6F] hover:to-[#c8102e] transition-all duration-300 transform hover:scale-105 hover:shadow-lg font-droid-arabic-kufi font-medium text-sm"
                                            >
                                                {language === 'en' ? 'Read More' : 'إقرأ المزيد'}
                                                <ArrowRight className={`w-4 h-4 ${language === 'en' ? 'ml-2 group-hover/btn:translate-x-1' : 'mr-2 rotate-180 group-hover/btn:-translate-x-1'} transition-transform`} />
                                            </Link>
                                        </div>
                                    </div>
                                ) : (
                                    // List View Card
                                    <div 
                                        key={activity.id}
                                        className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl overflow-hidden transition-all duration-300 flex flex-col sm:flex-row animate-fade-in relative"
                                        style={{ animationDelay: `${index * 100}ms` }}
                                    >
                                        {isSuperContentAdmin && (
                                            <div className="absolute top-4 left-4 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => handleEditActivity(activity, e)}
                                                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={(e) => handleDeleteActivity(activity.id, e)}
                                                    className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}

                                        <div className="relative w-full sm:w-72 h-56 sm:h-auto overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 flex-shrink-0">
                                            {activity.media && activity.media.length > 0 ? (
                                                <>
                                                    {activity.media[0].type === 'image' && (
                                                        <img
                                                            src={getMediaUrl(activity.media[0].url)}
                                                            alt={language === 'en' ? activity.title_en : activity.title_ar}
                                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                            onError={(e) => {
                                                                console.error('Image failed to load:', e.target.src);
                                                                e.target.src = '/tagemi_consept.png';
                                                            }}
                                                        />
                                                    )}
                                                    {activity.media[0].type === 'video' && (
                                                        <>
                                                            <video
                                                                src={getMediaUrl(activity.media[0].url)}
                                                                className="w-full h-full object-cover"
                                                                muted
                                                                loop
                                                                playsInline
                                                            ></video>
                                                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                                                <div className="bg-white/90 rounded-full p-4">
                                                                    <Play className="w-8 h-8 text-[#E03A6F]" fill="currentColor" />
                                                                </div>
                                                            </div>
                                                        </>
                                                    )}
                                                </>
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Eye className="w-16 h-16 text-gray-400" />
                                                </div>
                                            )}
                                            
                                            <div className="absolute top-4 right-4">
                                                <span className="px-3 py-1 bg-[#E03A6F] text-white text-xs font-bold rounded-full shadow-lg font-droid-arabic-kufi">
                                                    {language === 'en' ? 'New' : 'جديد'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="p-6 flex-1 flex flex-col">
                                            <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-[#E03A6F] transition-colors font-droid-arabic-kufi">
                                                {language === 'en' ? activity.title_en : activity.title_ar}
                                            </h3>
                                            
                                            <p className="text-gray-600 mb-4 flex-1 font-droid-arabic-kufi leading-relaxed">
                                                {truncateHtml(
                                                    language === 'en' ? activity.description_en : activity.description_ar, 
                                                    300
                                                )}
                                            </p>

                                            <div className="flex items-center gap-4 text-sm text-gray-500 mb-4 font-droid-arabic-kufi">
                                                {activity.event_date && (
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-4 h-4" />
                                                        <span>{new Date(activity.event_date).toLocaleDateString(language === 'en' ? 'en-US' : 'ar-DZ')}</span>
                                                    </div>
                                                )}
                                            </div>
                                            {renderUpdaterBadge(activity)}

                                            <Link 
                                                to={`/activities/${activity.id}`} 
                                                className="group/btn inline-flex items-center justify-center px-8 py-3 bg-gradient-to-r from-[#101E58] to-[#1a2d78] text-white rounded-full hover:from-[#E03A6F] hover:to-[#c8102e] transition-all duration-300 transform hover:scale-105 hover:shadow-lg font-droid-arabic-kufi font-medium w-fit"
                                            >
                                                {language === 'en' ? 'Read More' : 'إقرأ المزيد'}
                                                <ArrowRight className={`w-5 h-5 ${language === 'en' ? 'ml-2 group-hover/btn:translate-x-1' : 'mr-2 rotate-180 group-hover/btn:-translate-x-1'} transition-transform`} />
                                            </Link>
                                        </div>
                                    </div>
                                )
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Activity Modal */}
            <ActivityModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedActivity(null);
                }}
                activity={selectedActivity}
                typeId={TypeId}
                onSuccess={handleModalSuccess}
                token={token}
            />

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4 font-droid-arabic-kufi">
                            {language === 'en' ? 'Confirm Delete' : 'تأكيد الحذف'}
                        </h3>
                        <p className="text-gray-600 mb-6 font-droid-arabic-kufi">
                            {language === 'en' 
                                ? 'Are you sure you want to delete this activity? This action cannot be undone.' 
                                : 'هل أنت متأكد من حذف هذا النشاط؟ لا يمكن التراجع عن هذا الإجراء.'
                            }
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => {
                                    setShowDeleteConfirm(false);
                                    setActivityToDelete(null);
                                }}
                                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-droid-arabic-kufi"
                            >
                                {language === 'en' ? 'Cancel' : 'إلغاء'}
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-droid-arabic-kufi"
                            >
                                {language === 'en' ? 'Delete' : 'حذف'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Footer types={types} />

            <style jsx>{`
                @keyframes fade-in {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .animate-fade-in {
                    animation: fade-in 0.6s ease-out forwards;
                }
            `}</style>
        </div>
    );
}