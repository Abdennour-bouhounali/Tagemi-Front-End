import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../Context/LanguageContext';
import { useTranslation } from 'react-i18next';
import Footer from './HomePage/Components/Footer';
import { API_BASE_URL } from '../../config/environment';
import {
    Target,
    Award,
    Users,
    Heart,
    TrendingUp,
    Sparkles,
    Play,
    ArrowRight,
    CheckCircle,
    Globe
} from 'lucide-react';

const About = () => {
    const { language } = useLanguage();
    const { t } = useTranslation();
    const [types, setTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [videoPlaying, setVideoPlaying] = useState(false);
    const apiUrl = API_BASE_URL;

    async function getTypes() {
        try {
            setLoading(true);
            const res = await fetch(`${apiUrl}/api/types`);
            const data = await res.json();
            setTypes(data);
        } catch (error) {
            console.error('Error fetching types:', error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        getTypes();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    const goals = [
        {
            icon: Heart,
            text: t('about.goal1'),
            color: 'from-pink-500 to-rose-500'
        },
        {
            icon: Users,
            text: t('about.goal2'),
            color: 'from-blue-500 to-cyan-500'
        },
        {
            icon: Award,
            text: t('about.goal3'),
            color: 'from-purple-500 to-indigo-500'
        }
    ];

    const objectives = [
        {
            icon: Heart,
            text: t('about.objective1')
        },
        {
            icon: TrendingUp,
            text: t('about.objective2')
        },
        {
            icon: Globe,
            text: t('about.objective3')
        },
        {
            icon: Sparkles,
            text: t('about.objective4')
        }
    ];

    // Skeleton loader component
    const SkeletonCard = () => (
        <div className="aspect-square rounded-2xl bg-gray-200 animate-pulse"></div>
    );

    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section */}
            <section className="relative py-20 md:py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#101E58] via-[#1a2d78] to-[#E03A6F] overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{
                        backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                        backgroundSize: '40px 40px'
                    }}></div>
                </div>

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="text-center animate-fade-in">
                        <div className="inline-block bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full mb-6">
                            <span className="text-white font-semibold font-droid-arabic-kufi">
                                {t('about.foundation')}
                            </span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-white font-droid-arabic-kufi drop-shadow-2xl">
                            {t('about.title')}
                        </h1>
                        <div className="w-20 h-1 bg-white mx-auto mb-8"></div>
                        <p className="text-lg sm:text-xl md:text-2xl leading-relaxed text-white/90 font-droid-arabic-kufi max-w-4xl mx-auto">
                            {t('about.subtitle')}
                        </p>
                    </div>
                </div>
            </section>

            {/* Mission Statement */}
            <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-8 md:p-12 lg:p-16 shadow-xl border border-blue-100">
                        <div className="flex items-start gap-6 mb-8">
                            <div className="flex-shrink-0 bg-gradient-to-br from-[#E03A6F] to-[#c8102e] p-4 rounded-2xl shadow-lg">
                                <Target className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 font-droid-arabic-kufi text-gray-900">
                                    {t('about.mission')}
                                </h2>
                                <div className="w-16 h-1 bg-[#E03A6F]"></div>
                            </div>
                        </div>
                        <p className="text-lg sm:text-xl md:text-2xl leading-relaxed text-gray-700 font-droid-arabic-kufi">
                            {t('about.missionText')}
                        </p>
                    </div>
                </div>
            </section>

            {/* Goals Section with Video */}
            <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-gray-50">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                        {/* Goals Cards */}
                        <div className="order-2 lg:order-1 space-y-8">
                            <div className="text-center lg:text-left">
                                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 font-droid-arabic-kufi text-gray-900">
                                    {t('about.goals')}
                                </h2>
                                <div className="w-20 h-1 bg-[#E03A6F] mx-auto lg:mx-0 mb-8"></div>
                            </div>

                            {goals.map((goal, index) => (
                                <div
                                    key={index}
                                    className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 animate-fade-in"
                                    style={{ animationDelay: `${index * 150}ms` }}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`flex-shrink-0 w-14 h-14 bg-gradient-to-br ${goal.color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                            <goal.icon className="w-7 h-7 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-base sm:text-lg md:text-xl text-gray-700 font-droid-arabic-kufi leading-relaxed">
                                                {goal.text}
                                            </p>
                                        </div>
                                        <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Video */}
                        <div className="order-1 lg:order-2">
                            <div className="relative w-full aspect-video rounded-3xl overflow-hidden shadow-2xl bg-gray-900 group">
                                <iframe
                                    src="https://www.youtube.com/embed/Bc9DI4uzg2Q?si=m0cfxB4yaRS_w2Y6"
                                    title="YouTube video player"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    referrerPolicy="strict-origin-when-cross-origin"
                                    allowFullScreen
                                    className="absolute inset-0 w-full h-full"
                                    onLoad={() => setVideoPlaying(true)}
                                ></iframe>

                                {/* Video Overlay */}
                                {!videoPlaying && (
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-center justify-center">
                                        <div className="bg-white/90 backdrop-blur-sm rounded-full p-6 shadow-2xl transform group-hover:scale-110 transition-transform duration-300">
                                            <Play className="w-12 h-12 text-[#E03A6F]" fill="currentColor" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Objectives Section */}
            <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12 md:mb-16">
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-droid-arabic-kufi text-gray-900 mb-4">
                            {t('about.objectives')}
                        </h2>
                        <div className="w-20 h-1 bg-[#E03A6F] mx-auto mb-6"></div>
                        <p className="text-lg md:text-xl text-gray-600 font-droid-arabic-kufi max-w-3xl mx-auto">
                            {t('about.objectivesSubtitle')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-6xl mx-auto">
                        {objectives.map((objective, index) => (
                            <div
                                key={index}
                                className="group relative bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 overflow-hidden animate-fade-in"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                {/* Background decoration */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#E03A6F]/5 to-transparent rounded-bl-full transform translate-x-16 -translate-y-16 group-hover:scale-150 transition-transform duration-500"></div>

                                <div className="relative flex items-start gap-4">
                                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#E03A6F] to-[#c8102e] rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                        <objective.icon className="w-6 h-6 text-white" />
                                    </div>
                                    <p className="text-base sm:text-lg md:text-xl text-gray-700 font-droid-arabic-kufi leading-relaxed flex-1">
                                        {objective.text}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Activities Section */}
            <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white hidden">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12 md:mb-16">
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-droid-arabic-kufi text-gray-900 mb-4">
                            {t('about.activities')}
                        </h2>
                        <div className="w-20 h-1 bg-[#E03A6F] mx-auto mb-6"></div>
                        <p className="text-lg md:text-xl text-gray-600 font-droid-arabic-kufi max-w-3xl mx-auto">
                            {t('about.activitiesSubtitle')}
                        </p>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
                            {[...Array(8)].map((_, i) => (
                                <SkeletonCard key={i} />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
                            {types.map((type, index) => (
                                <Link
                                    key={type.id}
                                    to={`/activities/showByActivitiesType/${type.id}`}
                                    className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 animate-fade-in"
                                    style={{ animationDelay: `${index * 100}ms` }}
                                >
                                    <div className="aspect-square relative">
                                        {/* Image */}
                                        <img
                                            src={`${apiUrl}/${type.image_url}`}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            alt={language === 'en' ? type.name_en : type.name_ar}
                                            onError={(e) => {
                                                e.target.src = '/tagemi_consept.png';
                                            }}
                                        />

                                        {/* Gradient Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>

                                        {/* Content */}
                                        <div className="absolute inset-0 flex flex-col items-center justify-end p-6">
                                            <h3 className="text-xl md:text-2xl font-bold font-droid-arabic-kufi text-white text-center mb-3 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                                                {language === 'en' ? type.name_en : type.name_ar}
                                            </h3>

                                            {/* Arrow Button */}
                                            <div className="flex items-center justify-center gap-2 text-white opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                                                <span className="font-semibold font-droid-arabic-kufi">
                                                    {t('about.explore')}
                                                </span>
                                                <ArrowRight className={`w-5 h-5 ${language === 'ar' ? 'rotate-180' : ''}`} />
                                            </div>
                                        </div>

                                        {/* Corner Badge */}
                                        <div className="absolute top-4 right-4 bg-[#E03A6F] text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            {t('about.view')}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#101E58] to-[#1a2d78]">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {[
                            { number: '19+', label: t('about.yearsOfService') },
                            { number: '100+', label: t('about.projects') },
                            { number: '50K+', label: t('about.livesImpacted') },
                            { number: '500+', label: t('about.volunteers') }
                        ].map((stat, index) => (
                            <div
                                key={index}
                                className="text-center animate-fade-in"
                                style={{ animationDelay: `${index * 150}ms` }}
                            >
                                <div className="text-4xl md:text-5xl font-bold text-white mb-2 font-droid-arabic-kufi">
                                    {stat.number}
                                </div>
                                <div className="text-white/80 font-droid-arabic-kufi text-sm md:text-base">
                                    {stat.label}
                                </div>
                            </div>
                        ))}
                    </div>
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
};

export default About;