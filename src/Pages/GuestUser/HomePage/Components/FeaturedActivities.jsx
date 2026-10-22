import { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../../../Context/AppContext';
import { API_BASE_URL } from '../../../../config/environment';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../../../Context/LanguageContext';

const apiUrl = API_BASE_URL; 

const FeaturedActivities = () => {
    const { token } = useContext(AppContext);
    const [activities, setActivities] = useState([]);
    const { language } = useLanguage();
    const [loading, setLoading] = useState(true);

    async function getActivities() {
        try {
            const res = await fetch(`${apiUrl}/api/activities`);
            const data = await res.json();
            setActivities(data);
        } catch (error) {
            console.error("Failed to fetch activities:", error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        getActivities();
    }, []);

    const truncateHtml = (html, maxLength) => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        let textContent = tempDiv.textContent || tempDiv.innerText || '';
        if (textContent.length > maxLength) {
            textContent = textContent.substring(0, maxLength) + '...';
        }
        return textContent;
    };

    const featuredActivities = activities.filter(activity => activity.featured === true);

    if (featuredActivities.length === 0) return null;

    return (
        <section className="py-20 md:py-28 bg-white relative overflow-hidden">
            {/* Decorative Background */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#101E58]/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#E03A6F]/5 rounded-full blur-3xl"></div>
            
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Section Header */}
                <div className="text-center mb-16" data-aos="fade-up">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#E03A6F]/10 rounded-full mb-6">
                        <svg className="w-5 h-5 text-[#E03A6F]" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                        </svg>
                        <span className="text-sm font-semibold text-[#E03A6F] font-droid-arabic-kufi">
                            {language === 'en' ? 'Our Work' : 'أعمالنا'}
                        </span>
                    </div>
                    
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#101E58] font-droid-arabic-kufi mb-4">
                        {language === 'en' ? 'Featured Activities' : 'أعمال مميزة'}
                    </h2>
                    
                    <div className="flex justify-center mb-6">
                        <div className="w-24 h-1 bg-gradient-to-r from-[#101E58] via-[#E03A6F] to-[#101E58] rounded-full"></div>
                    </div>
                    
                    <p className="text-gray-600 text-lg md:text-xl max-w-2xl mx-auto font-droid-arabic-kufi">
                        {language === 'en' 
                            ? 'Discover our impactful programs making a difference in communities'
                            : 'اكتشف برامجنا المؤثرة التي تحدث فرقاً في المجتمعات'}
                    </p>
                </div>

                {/* Activities Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="animate-pulse">
                                <div className="bg-gray-200 h-64 rounded-t-2xl"></div>
                                <div className="bg-gray-100 p-6 rounded-b-2xl">
                                    <div className="h-6 bg-gray-200 rounded mb-4"></div>
                                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {featuredActivities.map((activity, index) => (
                            <div 
                                key={activity.id} 
                                className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 flex flex-col"
                                data-aos="fade-up"
                                data-aos-delay={index * 100}
                            >
                                {/* Image Container */}
                                <div className="relative h-64 overflow-hidden">
                                    {activity.media && activity.media.length > 0 && (
                                        <>
                                            {activity.media[0].type === 'image' && (
                                                <img
                                                    src={`${apiUrl}/${activity.media[0].url}`}
                                                    alt={language === 'en' ? activity.title_en : activity.title_ar}
                                                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                                                />
                                            )}
                                            {activity.media[0].type === 'video' && (
                                                <video
                                                    controls
                                                    src={activity.media[0].url}
                                                    className="w-full h-full object-cover"
                                                />
                                            )}
                                        </>
                                    )}
                                    
                                    {/* Overlay Gradient */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                    
                                    {/* Featured Badge */}
                                    <div className="absolute top-4 right-4 px-3 py-1 bg-[#E03A6F] text-white text-xs font-bold rounded-full shadow-lg font-droid-arabic-kufi">
                                        {language === 'en' ? 'Featured' : 'مميز'}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6 flex-1 flex flex-col">
                                    {/* Title */}
                                    <h3 className="text-xl font-bold text-[#101E58] mb-3 font-droid-arabic-kufi group-hover:text-[#E03A6F] transition-colors duration-300 line-clamp-2">
                                        {language === 'en' ? activity.title_en : activity.title_ar}
                                    </h3>
                                    
                                    {/* Description Preview */}
                                    <p className="text-gray-600 mb-4 flex-1 font-droid-arabic-kufi line-clamp-3">
                                        {truncateHtml(
                                            language === 'en' ? activity.description_en : activity.description_ar, 
                                            120
                                        )}
                                    </p>
                                    
                                    {/* Read More Link */}
                                    <Link 
                                        to={`actvities/${activity.id}`} 
                                        className="inline-flex items-center gap-2 text-[#101E58] font-bold font-droid-arabic-kufi group-hover:text-[#E03A6F] transition-colors duration-300 mt-auto"
                                    >
                                        {language === 'en' ? 'Read More' : 'إقرأ المزيد'}
                                        <svg 
                                            className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" 
                                            fill="none" 
                                            stroke="currentColor" 
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </Link>
                                </div>

                                {/* Bottom Border Animation */}
                                <div className="h-1 bg-gradient-to-r from-[#101E58] via-[#E03A6F] to-[#101E58] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
                            </div>
                        ))}
                    </div>
                )}

                {/* View All Button */}
                {featuredActivities.length > 0 && (
                    <div className="text-center mt-12" data-aos="fade-up">
                        <Link
                            to="/activities/activity1"
                            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#101E58] to-[#1a2d78] text-white rounded-full font-bold text-lg font-droid-arabic-kufi hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                        >
                            {language === 'en' ? 'View All Activities' : 'عرض جميع الأنشطة'}
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </Link>
                    </div>
                )}
            </div>
        </section>
    );
};

export default FeaturedActivities;
