import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../../../Context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { FaFacebook, FaYoutube, FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaHeart, FaChevronRight, FaChevronLeft } from 'react-icons/fa';

const Footer = ({ types }) => {
    const { language } = useLanguage();
    const { t } = useTranslation();
    const isRTL = language === 'ar';

    const quickLinks = [
        { to: '/', labelKey: 'footer.home' },
        { to: '/about', labelKey: 'footer.aboutUs' },
        { to: '/volunteer', labelKey: 'footer.volunteerWithUs' },
        { to: '/contact', labelKey: 'footer.contactUs' },
    ];

    return (
        <footer className="bg-[#1e293b] text-white relative overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
            {/* Subtle background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800/50 via-transparent to-slate-900/50 pointer-events-none"></div>

            <div className="relative z-10">
                {/* Main Footer Content */}
                <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-16">
                    <div className={`grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16 ${isRTL ? 'text-right' : 'text-left'}`}>

                        {/* Column 1: About Section - Right in Arabic, Left in English */}
                        <div className={`space-y-6 ${isRTL ? 'md:order-3' : 'md:order-1'}`}>
                            <div>
                                <h2 className="text-2xl md:text-3xl font-bold font-droid-arabic-kufi text-blue-400 mb-3">
                                    {t('footer.foundation')}
                                </h2>
                                <div className="w-16 h-1 bg-blue-500 rounded-full"></div>
                            </div>

                            <p className="text-gray-300 font-droid-arabic-kufi leading-relaxed text-base">
                                {t('footer.tagline')}
                            </p>

                            {/* Social Links */}
                            <div className="pt-2">
                                <h3 className="text-sm font-semibold font-droid-arabic-kufi text-gray-400 mb-4">
                                    {t('footer.followUs')}
                                </h3>
                                <div className="flex gap-4">
                                    <a
                                        href="https://www.facebook.com/p/%D8%AC%D9%85%D8%B9%D9%8A%D8%A9-%D8%AA%D8%AC%D9%85%D9%91%D9%8A-Association-TAGEMI-100070312232969/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label="Facebook"
                                        className="w-12 h-12 bg-slate-700/50 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-all duration-300 transform hover:scale-110 hover:shadow-lg hover:shadow-blue-600/30"
                                    >
                                        <FaFacebook className="text-xl" />
                                    </a>

                                    <a
                                        href="https://youtube.com/@tagemifondation?si=GW33IrHgq3_rE_Ws"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label="YouTube"
                                        className="w-12 h-12 bg-slate-700/50 rounded-lg flex items-center justify-center hover:bg-red-600 transition-all duration-300 transform hover:scale-110 hover:shadow-lg hover:shadow-red-600/30"
                                    >
                                        <FaYoutube className="text-xl" />
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Column 2: Quick Links - Center */}
                        <div className={`space-y-6 ${isRTL ? 'md:order-2' : 'md:order-2'}`}>
                            <div>
                                <h3 className="text-xl md:text-2xl font-bold font-droid-arabic-kufi text-white mb-3">
                                    {t('footer.quickLinks')}
                                </h3>
                                <div className="w-16 h-1 bg-blue-500 rounded-full"></div>
                            </div>

                            <ul className="space-y-4">
                                {quickLinks.map((link, index) => (
                                    <li key={index}>
                                        <Link
                                            to={link.to}
                                            className="group flex items-center gap-3 text-gray-300 hover:text-blue-400 font-droid-arabic-kufi transition-all duration-300 text-base"
                                        >
                                            {isRTL ? (
                                                <FaChevronLeft className="text-xs text-blue-500 transform transition-transform duration-300 group-hover:-translate-x-1" />
                                            ) : (
                                                <FaChevronRight className="text-xs text-blue-500 transform transition-transform duration-300 group-hover:translate-x-1" />
                                            )}
                                            <span>
                                                {t(link.labelKey)}
                                            </span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Column 3: Contact Section - Left in Arabic, Right in English */}
                        <div className={`space-y-6 ${isRTL ? 'md:order-1' : 'md:order-3'}`}>
                            <div>
                                <h3 className="text-xl md:text-2xl font-bold font-droid-arabic-kufi text-white mb-3">
                                    {t('footer.contactUs')}
                                </h3>
                                <div className="w-16 h-1 bg-blue-500 rounded-full"></div>
                            </div>

                            <div className="space-y-5">
                                {/* Phone */}
                                <a
                                    href="tel:+213549885459"
                                    className="group flex items-start gap-4 text-gray-300 hover:text-blue-400 transition-all duration-300"
                                >
                                    <div className="flex-shrink-0">
                                        <FaPhoneAlt className="text-blue-400 text-lg" />
                                    </div>
                                    <div className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                                        <p className="text-xs text-gray-500 font-droid-arabic-kufi mb-1">
                                            {t('footer.callUs')}
                                        </p>
                                        <p className="font-droid-arabic-kufi text-sm leading-relaxed" dir="ltr">
                                            029 254 300<br />
                                            05 49 88 54 59
                                        </p>
                                    </div>
                                </a>

                                {/* Email */}
                                <a
                                    href="mailto:tagem.ass@gmail.com"
                                    className="group flex items-start gap-4 text-gray-300 hover:text-blue-400 transition-all duration-300"
                                >
                                    <div className="flex-shrink-0">
                                        <FaEnvelope className="text-purple-400 text-lg" />
                                    </div>
                                    <div className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                                        <p className="text-xs text-gray-500 font-droid-arabic-kufi mb-1">
                                            {t('footer.emailUs')}
                                        </p>
                                        <p className="font-droid-arabic-kufi text-sm break-all" dir="ltr">
                                            tagem.ass@gmail.com
                                        </p>
                                    </div>
                                </a>

                                {/* Address */}
                                <div className="flex items-start gap-4 text-gray-300">
                                    <div className="flex-shrink-0">
                                        <FaMapMarkerAlt className="text-pink-400 text-lg" />
                                    </div>
                                    <div className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                                        <p className="text-xs text-gray-500 font-droid-arabic-kufi mb-1">
                                            {t('footer.visitUs')}
                                        </p>
                                        <p className="font-droid-arabic-kufi text-sm leading-relaxed">
                                            {t('footer.address')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-700"></div>

                {/* Footer Bottom */}
                <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
                        <p className="text-gray-400 font-droid-arabic-kufi flex items-center gap-2">
                            {t('footer.madeWith')}
                            <FaHeart className="text-red-500 animate-pulse" />
                            {t('footer.by')}
                        </p>
                        <p className="text-gray-400 font-droid-arabic-kufi">
                            © {new Date().getFullYear()} {t('footer.rights')}
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;