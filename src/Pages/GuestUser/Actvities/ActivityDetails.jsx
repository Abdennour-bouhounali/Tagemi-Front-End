import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../../../config/environment';
import { useParams, Link } from 'react-router-dom';
import Footer from '../HomePage/Components/Footer';
import { useLanguage } from '../../../Context/LanguageContext';
import { sanitizeHtml } from '../../../utils/safeHtml';

const apiUrl = API_BASE_URL;

const ActivityDetails = () => {
    const { Actvityid } = useParams();
    const [activity, setActivity] = useState(null);
    const [types, setTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
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

    async function getActivity() {
        try {
            setLoading(true);
            const res = await fetch(`${apiUrl}/api/activities/${Actvityid}`);
            const data = await res.json();
            setActivity(data);
        } catch (error) {
            console.error('Error fetching activity:', error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        getTypes();
    }, []);

    useEffect(() => {
        getActivity();
        window.scrollTo(0, 0);
    }, [Actvityid]);

    const nextMedia = () => {
        if (activity?.media && activity.media.length > 1) {
            setCurrentMediaIndex((prev) => 
                prev === activity.media.length - 1 ? 0 : prev + 1
            );
        }
    };

    const prevMedia = () => {
        if (activity?.media && activity.media.length > 1) {
            setCurrentMediaIndex((prev) => 
                prev === 0 ? activity.media.length - 1 : prev - 1
            );
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#E03A6F] mx-auto"></div>
                    <p className="mt-4 text-gray-600 font-droid-arabic-kufi">
                        {language === 'en' ? 'Loading...' : 'جاري التحميل...'}
                    </p>
                </div>
            </div>
        );
    }

    if (!activity) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="text-center">
                    <p className="text-xl text-gray-600 font-droid-arabic-kufi">
                        {language === 'en' ? 'Activity not found' : 'النشاط غير موجود'}
                    </p>
                    <Link 
                        to="/" 
                        className="mt-4 inline-block px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors font-droid-arabic-kufi"
                    >
                        {language === 'en' ? 'Go Home' : 'العودة للرئيسية'}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section */}
            <section className="relative bg-gradient-to-b from-gray-50 to-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16">
                    {/* Breadcrumb */}
                    <nav className="flex mb-6 text-sm" aria-label="Breadcrumb">
                        <ol className="inline-flex items-center space-x-1 md:space-x-3 font-droid-arabic-kufi">
                            <li className="inline-flex items-center">
                                <Link to="/" className="text-gray-600 hover:text-blue-600 transition-colors">
                                    {language === 'en' ? 'Home' : 'الرئيسية'}
                                </Link>
                            </li>
                            <li>
                                <div className="flex items-center">
                                    <svg className="w-4 h-4 text-gray-400 mx-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-gray-500">
                                        {language === 'en' ? 'Activities' : 'الأنشطة'}
                                    </span>
                                </div>
                            </li>
                            <li>
                                <div className="flex items-center">
                                    <svg className="w-4 h-4 text-gray-400 mx-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-gray-700 font-medium truncate max-w-xs">
                                        {language === 'en' ? activity.title_en : activity.title_ar}
                                    </span>
                                </div>
                            </li>
                        </ol>
                    </nav>

                    {/* Title */}
                    <div className="text-center mb-8 md:mb-12">
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#101E58] font-droid-arabic-kufi mb-4">
                            {language === 'en' ? activity.title_en : activity.title_ar}
                        </h1>
                        <div className="w-20 h-1 bg-[#E03A6F] mx-auto"></div>
                    </div>

                    {/* Main Content */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
                        {/* Media Gallery */}
                        <div className="order-1">
                            {activity.media && activity.media.length > 0 && (
                                <div className="relative">
                                    {/* Main Media Display */}
                                    <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl bg-gray-200">
                                        {activity.media[currentMediaIndex].type === 'image' && (
                                            <img
                                                src={`${apiUrl}/${activity.media[currentMediaIndex].url}`}
                                                alt={`${language === 'en' ? activity.title_en : activity.title_ar} - ${currentMediaIndex + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                        )}
                                        {activity.media[currentMediaIndex].type === 'video' && (
                                            <video
                                                controls
                                                src={`${apiUrl}/${activity.media[currentMediaIndex].url}`}
                                                className="w-full h-full object-cover"
                                            ></video>
                                        )}

                                        {/* Navigation Arrows */}
                                        {activity.media.length > 1 && (
                                            <>
                                                <button
                                                    onClick={prevMedia}
                                                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all"
                                                    aria-label="Previous media"
                                                >
                                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={nextMedia}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all"
                                                    aria-label="Next media"
                                                >
                                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </button>
                                            </>
                                        )}

                                        {/* Media Counter */}
                                        {activity.media.length > 1 && (
                                            <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-droid-arabic-kufi">
                                                {currentMediaIndex + 1} / {activity.media.length}
                                            </div>
                                        )}
                                    </div>

                                    {/* Thumbnail Gallery */}
                                    {activity.media.length > 1 && (
                                        <div className="mt-4 grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                                            {activity.media.map((mediaItem, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => setCurrentMediaIndex(index)}
                                                    className={`relative aspect-video rounded-lg overflow-hidden transition-all ${
                                                        currentMediaIndex === index
                                                            ? 'ring-4 ring-blue-600 scale-105'
                                                            : 'hover:scale-105 opacity-70 hover:opacity-100'
                                                    }`}
                                                >
                                                    {mediaItem.type === 'image' ? (
                                                        <img
                                                            src={`${apiUrl}/${mediaItem.url}`}
                                                            alt={`Thumbnail ${index + 1}`}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                                                            <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                                                                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Description */}
                        <div className="order-2">
                            <div className="prose prose-lg max-w-none">
                                <div
                                    className={`text-gray-700 leading-relaxed text-base sm:text-lg font-droid-arabic-kufi ${
                                        language === 'en' ? 'text-left' : 'text-right'
                                    }`}
                                    dangerouslySetInnerHTML={{
                                        __html: sanitizeHtml(language === 'en' ? activity.description_en : activity.description_ar),
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <Footer types={types} />
        </div>
    );
};

export default ActivityDetails;