import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AboutActvity from "./Components/AboutActvity";
import Footer from "../HomePage/Components/Footer";
import { useLanguage } from "../../../Context/LanguageContext";
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
    Clock
} from 'lucide-react';

const apiUrl = import.meta.env.VITE_API_URL;

export default function Activities() {
    const { TypeId } = useParams();
    const [type, setType] = useState({ 
        image_url: '/tagemi_consept.png', 
        description_en: '', 
        description_ar: '' 
    });
    const [activities, setActivities] = useState([]);
    const [filteredActivities, setFilteredActivities] = useState([]);
    const [types, setTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'title'
    const { language } = useLanguage();

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
            const res = await fetch(`${apiUrl}/api/activities/showByActivitiesType/${TypeId}`);
            if (res.ok) {
                const data = await res.json();
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

    // Filter and sort activities
    useEffect(() => {
        let filtered = [...activities];

        // Search filter
        if (searchQuery) {
            filtered = filtered.filter(activity => {
                const title = language === 'en' ? activity.title_en : activity.title_ar;
                const description = language === 'en' ? activity.description_en : activity.description_ar;
                return title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       description.toLowerCase().includes(searchQuery.toLowerCase());
            });
        }

        // Sort
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
    }, [searchQuery, sortBy, activities, language]);

    const truncateHtml = (html, maxLength) => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        let textContent = tempDiv.textContent || tempDiv.innerText || '';
        if (textContent.length > maxLength) {
            textContent = textContent.substring(0, maxLength) + '...';
        }
        return textContent;
    };

    // Skeleton loader component
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

    // Empty state component
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
            {searchQuery && (
                <button
                    onClick={() => setSearchQuery('')}
                    className="px-6 py-3 bg-[#E03A6F] text-white rounded-full hover:bg-[#c8102e] transition-all duration-300 font-droid-arabic-kufi"
                >
                    {language === 'en' ? 'Clear Search' : 'مسح البحث'}
                </button>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-white">
            {/* Enhanced Hero Section */}
            <div className="relative w-full h-64 md:h-80 lg:h-96 overflow-hidden">
                <img 
                    src={`${apiUrl}/${type.image_url}`} 
                    className="w-full h-full object-cover"
                    alt={language === 'en' ? type.name_en : type.name_ar}
                    onError={(e) => {
                        e.target.src = '/tagemi_consept.png';
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent"></div>
                
                {/* Breadcrumb */}
                <div className="absolute top-6 left-4 sm:left-8 flex items-center gap-2 text-white text-sm font-droid-arabic-kufi">
                    <Link to="/" className="hover:text-[#E03A6F] transition-colors">
                        {language === 'en' ? 'Home' : 'الرئيسية'}
                    </Link>
                    <span>/</span>
                    <span className="text-white/80">
                        {language === 'en' ? type.name_en : type.name_ar}
                    </span>
                </div>

                {/* Hero Title */}
                <div className="absolute bottom-8 left-4 sm:left-8 right-4">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3 font-droid-arabic-kufi drop-shadow-2xl">
                        {language === 'en' ? type.name_en : type.name_ar}
                    </h1>
                    <div className="flex items-center gap-4 text-white/90">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5" />
                            <span className="font-droid-arabic-kufi">
                                {activities.length} {language === 'en' ? 'Activities' : 'نشاط'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* About Activity Section */}
            <AboutActvity 
                TypeDescription={language === 'en' ? type.description_en : type.description_ar} 
                ImageUrl={`${apiUrl}/${type.image_url}`} 
            />

            {/* Search and Filter Section */}
            <section className="py-8 px-4 sm:px-6 lg:px-8 bg-gray-50 border-b border-gray-200">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
                        {/* Search Bar */}
                        <div className="relative flex-1 max-w-md">
                            <Search className={`absolute ${language === 'en' ? 'left-4' : 'right-4'} top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5`} />
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
                        <div className="flex gap-3 items-center">
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
                            <div className="flex bg-white border border-gray-300 rounded-xl overflow-hidden">
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
                                        className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl overflow-hidden transition-all duration-500 transform hover:-translate-y-2 flex flex-col animate-fade-in"
                                        style={{ animationDelay: `${index * 100}ms` }}
                                    >
                                        {/* Media Section */}
                                        <div className="relative h-56 overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300">
                                            {activity.media && activity.media.length > 0 ? (
                                                <>
                                                    {activity.media[0].type === 'image' && (
                                                        <img
                                                            src={`${apiUrl}/${activity.media[0].url}`}
                                                            alt={language === 'en' ? activity.title_en : activity.title_ar}
                                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                            onError={(e) => {
                                                                e.target.src = '/tagemi_consept.png';
                                                            }}
                                                        />
                                                    )}
                                                    {activity.media[0].type === 'video' && (
                                                        <>
                                                            <video
                                                                src={`${apiUrl}/${activity.media[0].url}`}
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
                                            
                                            {/* Gradient Overlay */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                            
                                            {/* Badge */}
                                            <div className="absolute top-4 right-4">
                                                <span className="px-3 py-1 bg-[#E03A6F] text-white text-xs font-bold rounded-full shadow-lg font-droid-arabic-kufi">
                                                    {language === 'en' ? 'New' : 'جديد'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Content Section */}
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

                                            {/* Metadata */}
                                            <div className="flex items-center gap-4 text-xs text-gray-500 mb-4 font-droid-arabic-kufi">
                                                {activity.created_at && (
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="w-4 h-4" />
                                                        <span>{new Date(activity.created_at).toLocaleDateString(language === 'en' ? 'en-US' : 'ar-DZ')}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <Link 
                                                to={`/actvities/${activity.id}`} 
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
                                        className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl overflow-hidden transition-all duration-300 flex flex-col sm:flex-row animate-fade-in"
                                        style={{ animationDelay: `${index * 100}ms` }}
                                    >
                                        {/* Media Section */}
                                        <div className="relative w-full sm:w-72 h-56 sm:h-auto overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 flex-shrink-0">
                                            {activity.media && activity.media.length > 0 ? (
                                                <>
                                                    {activity.media[0].type === 'image' && (
                                                        <img
                                                            src={`${apiUrl}/${activity.media[0].url}`}
                                                            alt={language === 'en' ? activity.title_en : activity.title_ar}
                                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                            onError={(e) => {
                                                                e.target.src = '/tagemi_consept.png';
                                                            }}
                                                        />
                                                    )}
                                                    {activity.media[0].type === 'video' && (
                                                        <>
                                                            <video
                                                                src={`${apiUrl}/${activity.media[0].url}`}
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

                                        {/* Content Section */}
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

                                            {/* Metadata */}
                                            <div className="flex items-center gap-4 text-sm text-gray-500 mb-4 font-droid-arabic-kufi">
                                                {activity.created_at && (
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-4 h-4" />
                                                        <span>{new Date(activity.created_at).toLocaleDateString(language === 'en' ? 'en-US' : 'ar-DZ')}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <Link 
                                                to={`/actvities/${activity.id}`} 
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