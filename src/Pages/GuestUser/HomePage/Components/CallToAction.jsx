import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../../../Context/LanguageContext';
import { useTranslation } from 'react-i18next';

const CallToAction = () => {
    const { language } = useLanguage();
    const { t } = useTranslation();

    return (
        <section className="relative py-20 bg-gradient-to-r from-[#101E58] via-[#1a2d78] to-[#E03A6F] overflow-hidden">
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-full h-full" style={{
                    backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                    backgroundSize: '40px 40px'
                }}></div>
            </div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="max-w-4xl mx-auto text-center">
                    {/* Icon */}
                    <div className="inline-block p-4 bg-white/20 rounded-full mb-6" data-aos="zoom-in">
                        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>

                    {/* Heading */}
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6 font-droid-arabic-kufi" data-aos="fade-up">
                        {t('home.joinMission')}
                    </h2>

                    {/* Description */}
                    <p className="text-xl text-gray-100 mb-10 font-droid-arabic-kufi leading-relaxed" data-aos="fade-up" data-aos-delay="100">
                        {t('home.joinMissionDesc')}
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center" data-aos="fade-up" data-aos-delay="200">
                        <Link
                            to="/volunteer"
                            className="group w-full sm:w-auto px-8 py-4 bg-white text-[#101E58] rounded-full font-bold text-lg font-droid-arabic-kufi hover:bg-gray-100 transition-all duration-300 hover:shadow-2xl transform hover:scale-105 flex items-center justify-center gap-2"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            {t('home.becomeVolunteer')}
                            <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </Link>

                        <a
                            href="#donate"
                            className="group w-full sm:w-auto px-8 py-4 bg-transparent border-2 border-white text-white rounded-full font-bold text-lg font-droid-arabic-kufi hover:bg-white hover:text-[#101E58] transition-all duration-300 hover:shadow-2xl transform hover:scale-105 flex items-center justify-center gap-2"
                        >
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z" />
                            </svg>
                            {t('home.makeDonation')}
                            <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </a>
                    </div>

                    {/* Stats Bar */}
                    {/* <div className="mt-16 pt-10 border-t border-white/20">
                        <div className="grid grid-cols-3 gap-8">
                            <div className="text-center" data-aos="fade-up" data-aos-delay="300">
                                <div className="text-3xl md:text-4xl font-bold text-white mb-2">100%</div>
                                <div className="text-sm text-gray-200 font-droid-arabic-kufi">
                                    {language === 'en' ? 'Transparent' : 'شفافية تامة'}
                                </div>
                            </div>
                            <div className="text-center border-x border-white/20" data-aos="fade-up" data-aos-delay="400">
                                <div className="text-3xl md:text-4xl font-bold text-white mb-2">24/7</div>
                                <div className="text-sm text-gray-200 font-droid-arabic-kufi">
                                    {language === 'en' ? 'Support' : 'دعم متواصل'}
                                </div>
                            </div>
                            <div className="text-center" data-aos="fade-up" data-aos-delay="500">
                                <div className="text-3xl md:text-4xl font-bold text-white mb-2">∞</div>
                                <div className="text-sm text-gray-200 font-droid-arabic-kufi">
                                    {language === 'en' ? 'Impact' : 'تأثير مستمر'}
                                </div>
                            </div>
                        </div>
                    </div> */}
                </div>
            </div>

            {/* Decorative Wave */}
            <div className="absolute bottom-0 left-0 right-0">
                <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
                    <path d="M0 0L60 10C120 20 240 40 360 46.7C480 53 600 47 720 43.3C840 40 960 40 1080 46.7C1200 53 1320 67 1380 73.3L1440 80V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V0Z" fill="white" />
                </svg>
            </div>
        </section>
    );
};

export default CallToAction;
