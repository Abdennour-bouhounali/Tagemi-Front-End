import React, { useContext, useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faCalendarAlt, faPeopleArrows, faChartLine, faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';
import { AppContext } from '../../../../Context/AppContext';
import { useLanguage } from '../../../../Context/LanguageContext';
import { Link } from "react-router-dom";

const apiUrl = import.meta.env.VITE_API_URL;

// Counter Animation Component
const AnimatedCounter = ({ end, duration = 2000, suffix = '+' }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTime;
        const endValue = parseInt(end);
        
        const animate = (currentTime) => {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);
            
            setCount(Math.floor(progress * endValue));
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }, [end, duration]);

    return <span>{count}{suffix}</span>;
};

const Statistics = () => {
    const { token } = useContext(AppContext);
    const { language } = useLanguage();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState([
        { 
            label: language === 'en' ? 'Number of Volunteers' : 'عدد المتطوعين', 
            value: '500', 
            icon: faUsers,
            color: 'from-blue-500 to-blue-600',
            bgColor: 'bg-blue-50',
            iconColor: 'text-blue-600'
        },
        { 
            label: language === 'en' ? 'Events Organized' : 'البرامج المنظمة', 
            value: '350', 
            icon: faCalendarAlt,
            color: 'from-purple-500 to-purple-600',
            bgColor: 'bg-purple-50',
            iconColor: 'text-purple-600'
        },
        { 
            label: language === 'en' ? 'People Benefited' : 'عدد المستفيدين', 
            value: '5000', 
            icon: faPeopleArrows,
            color: 'from-pink-500 to-pink-600',
            bgColor: 'bg-pink-50',
            iconColor: 'text-pink-600'
        }
    ]);

    const [moreStatisticsLink, setMoreStatisticsLink] = useState('');
    const [hasAnimated, setHasAnimated] = useState(false);

    async function getStaticContent() {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(`${apiUrl}/api/static-contents`);
            if (!res.ok) {
                throw new Error(`Error fetching static content: ${res.statusText}`);
            }
            const data = await res.json();

            if (data.length > 0) {
                const statisticsData = JSON.parse(data[0].value);
                setMoreStatisticsLink(data[2]?.value || '');
                
                setStats([
                    { 
                        label: language === 'en' ? 'Number of Volunteers' : 'عدد المتطوعين', 
                        value: statisticsData['number_of_volunteers'], 
                        icon: faUsers,
                        color: 'from-blue-500 to-blue-600',
                        bgColor: 'bg-blue-50',
                        iconColor: 'text-blue-600'
                    },
                    { 
                        label: language === 'en' ? 'Events Organized' : 'البرامج المنظمة', 
                        value: statisticsData['events_organized'], 
                        icon: faCalendarAlt,
                        color: 'from-purple-500 to-purple-600',
                        bgColor: 'bg-purple-50',
                        iconColor: 'text-purple-600'
                    },
                    { 
                        label: language === 'en' ? 'People Benefited' : 'عدد المستفيدين', 
                        value: statisticsData['people_benefited'], 
                        icon: faPeopleArrows,
                        color: 'from-pink-500 to-pink-600',
                        bgColor: 'bg-pink-50',
                        iconColor: 'text-pink-600'
                    }
                ]);
            }
        } catch (error) {
            console.error(error);
            setError(language === 'en' ? 'Failed to load statistics' : 'فشل في تحميل الإحصائيات');
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        getStaticContent();
    }, [token, language]);

    // Intersection Observer for animation trigger
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !hasAnimated) {
                    setHasAnimated(true);
                }
            },
            { threshold: 0.3 }
        );

        const section = document.getElementById('statistics-section');
        if (section) {
            observer.observe(section);
        }

        return () => {
            if (section) {
                observer.unobserve(section);
            }
        };
    }, [hasAnimated]);

    return (
        <section 
            id="statistics-section"
            className="relative py-20 md:py-28 bg-gradient-to-br from-gray-50 via-white to-blue-50 overflow-hidden"
        >
            {/* Decorative Background Elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Section Header */}
                <div className="text-center mb-16" data-aos="fade-up">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#101E58]/10 rounded-full mb-6">
                        <FontAwesomeIcon icon={faChartLine} className="text-[#101E58]" />
                        <span className="text-sm font-semibold text-[#101E58] font-droid-arabic-kufi">
                            {language === 'en' ? 'Our Impact' : 'تأثيرنا'}
                        </span>
                    </div>

                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#101E58] font-droid-arabic-kufi mb-6">
                        {language === 'en' ? 'Statistics & Achievements' : 'الإحصائيات والإنجازات'}
                    </h2>

                    <div className="flex justify-center mb-6">
                        <div className="w-24 h-1 bg-gradient-to-r from-[#101E58] via-[#E03A6F] to-[#101E58] rounded-full"></div>
                    </div>

                    <p className="text-gray-600 text-lg md:text-xl max-w-2xl mx-auto font-droid-arabic-kufi">
                        {language === 'en'
                            ? 'Numbers that reflect our continuous commitment to serving the community'
                            : 'أرقام تعكس التزامنا المستمر بخدمة المجتمع'}
                    </p>
                </div>

                {/* Statistics Cards */}
                {isLoading ? (
                    // Loading Skeleton
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white p-8 rounded-2xl shadow-lg animate-pulse">
                                <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-6"></div>
                                <div className="h-12 bg-gray-200 rounded mb-4"></div>
                                <div className="h-6 bg-gray-200 rounded mx-auto w-3/4"></div>
                            </div>
                        ))}
                    </div>
                ) : error ? (
                    // Error State
                    <div className="text-center py-12">
                        <div className="text-red-500 text-lg mb-4">{error}</div>
                        <button 
                            onClick={getStaticContent}
                            className="px-6 py-3 bg-[#101E58] text-white rounded-lg hover:bg-[#1a2d78] transition-colors"
                        >
                            {language === 'en' ? 'Try Again' : 'حاول مرة أخرى'}
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                        {stats.map((stat, index) => (
                            <div
                                key={index}
                                className="group relative bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:-translate-y-2"
                                data-aos="fade-up"
                                data-aos-delay={index * 100}
                            >
                                {/* Gradient Background on Hover */}
                                <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>

                                {/* Icon Container */}
                                <div className={`relative w-20 h-20 ${stat.bgColor} rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500`}>
                                    <FontAwesomeIcon 
                                        icon={stat.icon} 
                                        className={`text-4xl ${stat.iconColor}`}
                                    />
                                </div>

                                {/* Counter */}
                                <div className="relative">
                                    <h3 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 font-droid-arabic-kufi">
                                        {hasAnimated ? (
                                            <AnimatedCounter end={stat.value} />
                                        ) : (
                                            `${stat.value}+`
                                        )}
                                    </h3>
                                    <p className="text-gray-600 text-lg font-droid-arabic-kufi">
                                        {stat.label}
                                    </p>
                                </div>

                                {/* Decorative Element */}
                                <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-gray-100 to-transparent rounded-tl-full opacity-50"></div>
                            </div>
                        ))}
                    </div>
                )}

                {/* More Statistics Button */}
                <div className="text-center" data-aos="fade-up">
                    
                      <a  href="/pdfs/statistics-report.pdf"  // Direct path to public folder
                            target="_blank"
                            rel="noopener noreferrer"
                            download="Tagemi-Statistics-Report.pdf"  // Optional: suggest download filename
                            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#9c004c] to-[#c8102e] hover:from-[#c8102e] hover:to-[#9c004c] text-white rounded-xl font-droid-arabic-kufi font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                        >
                            <FontAwesomeIcon icon={faChartLine} className="text-xl" />
                            <span>
                                {language === 'en' ? 'View Detailed Statistics' : 'عرض الإحصائيات التفصيلية'}
                            </span>
                            <FontAwesomeIcon icon={faExternalLinkAlt} className="text-sm" />
                        </a>
                </div>
            </div>

            {/* Custom Animations */}
            <style jsx>{`
                @keyframes blob {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    25% { transform: translate(20px, -50px) scale(1.1); }
                    50% { transform: translate(-20px, 20px) scale(0.9); }
                    75% { transform: translate(50px, 50px) scale(1.05); }
                }
                .animate-blob {
                    animation: blob 15s infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                .animation-delay-4000 {
                    animation-delay: 4s;
                }
            `}</style>
        </section>
    );
};

export default Statistics;