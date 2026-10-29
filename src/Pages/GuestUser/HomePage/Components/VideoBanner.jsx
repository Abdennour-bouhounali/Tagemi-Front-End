import React, { useRef, useEffect } from 'react';
import { useLanguage } from '../../../../Context/LanguageContext';
import { motion } from 'framer-motion';

const VideoBanner = ({ bannerImage, bannerText, homePage }) => {
    const { language } = useLanguage();
    const parallaxRef = useRef(null);

    // Parallax moves the layer directly (no React re-render per scroll event)
    useEffect(() => {
        if (!homePage) return;
        let frame = 0;
        const handleScroll = () => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => {
                if (parallaxRef.current) parallaxRef.current.style.transform = `translateY(${window.scrollY * 0.3}px)`;
            });
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener('scroll', handleScroll);
        };
    }, [homePage]);

    return (
        <>
            {!homePage ? (
                <div className="relative w-full h-[40vh] md:h-[50vh] overflow-hidden pt-20 md:pt-24">
                    <img 
                        src={bannerImage} 
                        decoding="async"
                        className="w-full h-full  object-cover object-left md:object-center" 
                        alt="Banner" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/60"></div>
                    {bannerText && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <h1 className="text-4xl md:text-6xl font-bold text-white text-center px-4 font-droid-arabic-kufi">
                                {bannerText}
                            </h1>
                        </div>
                    )}
                </div>
            ) : (
                <div className="relative w-full min-h-[70vh] md:min-h-[85vh] overflow-hidden bg-gradient-to-br from-[#101E58] via-[#1a2d78] to-[#101E58] pt-16 md:pt-28">
                    {/* Background Image with Parallax Effect */}
                    <div 
                        ref={parallaxRef}
                        className="absolute inset-0 opacity-60 will-change-transform"
                    >
                        <img 
                            src={bannerImage} 
                            fetchpriority="high"
                            decoding="async"
                            width="1600"
                            height="841"
                            className="w-full h-full object-cover  object-left md:object-center" 
                            alt="Hero Background" 
                        />
                    </div>
                    
                    {/* Overlay Pattern */}
                    <div className="absolute inset-0 bg-gradient-to-b -translate-x-3 from-transparent via-[#101E58]/5 to-[#101E58]/30"></div>
                    
                    {/* Content */}
                    <div className="relative z-10 mb-10 container mx-auto px-4 h-full min-h-[70vh] md:min-h-[85vh] flex items-center">
                        <div className="w-full max-w-4xl mx-auto text-center space-y-8 py-20">
                            {/* Animated Logo/Icon */}
                            {/* <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.6, ease: "easeOut" }}
                                className="mb-8"
                            >
                                <div className="inline-block p-6 rounded-full bg-white/10 backdrop-blur-sm border-2 border-white/20">
                                    <svg className="w-16 h-16 md:w-20 md:h-20 text-white" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                    </svg>
                                </div>
                            </motion.div> */}
                            
                            {/* Main Heading */}
                            <motion.h1
                                initial={{ y: 50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className="text-xl md:text-3xl lg:text-4xl font-bold text-white font-droid-arabic-kufi leading-tight drop-shadow-lg"
                            >
                                {language === 'en'
                                    ? "Let's Working together for human development and eternal life"
                                    : 'لنعمل سويا من أجل حياة أبدية'}
                            </motion.h1>
                            
                            {/* CTA Buttons */}
                            <motion.div
                                initial={{ y: 30, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ duration: 0.8, delay: 0.6 }}
                                className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8"
                            >
                                
                              <a      href="#donate"
                                    className="group relative px-8 py-4 bg-[#E03A6F] text-white rounded-full font-bold text-lg font-droid-arabic-kufi overflow-hidden transition-all duration-300 hover:bg-[#c8102e] hover:shadow-2xl hover:scale-105 w-full sm:w-auto"
                                >
                                    <span className="relative z-10 flex items-center justify-center gap-2">
                                        {language === 'en' ? 'Donate Now' : 'تبرع الآن'}
                                        <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-[#c8102e] to-[#E03A6F] transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                                </a>
                                
                                
                                <a    href="/volunteer"
                                    className="group px-8 py-4 bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 rounded-full font-bold text-lg font-droid-arabic-kufi transition-all duration-300 hover:bg-white hover:text-[#101E58] hover:shadow-2xl hover:scale-105 w-full sm:w-auto"
                                >
                                    <span className="flex items-center justify-center gap-2">
                                        {language === 'en' ? 'Volunteer' : 'تطوع معنا'}
                                        <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    </span>
                                </a>
                            </motion.div>
                            
                            {/* Trust Indicators */}
                            <motion.div
                                initial={{ y: 30, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ duration: 0.8, delay: 0.8 }}
                                className="grid grid-cols-3 gap-6 pt-12 max-w-2xl mx-auto"
                            >
                                <div className="text-center">
                                    <div className="text-3xl md:text-4xl font-bold text-white mb-2">500+</div>
                                    <div className="text-sm md:text-base text-gray-300 font-droid-arabic-kufi">
                                        {language === 'en' ? 'Volunteers' : 'متطوع'}
                                    </div>
                                </div>
                                <div className="text-center border-x border-white/20">
                                    <div className="text-3xl md:text-4xl font-bold text-white mb-2">50+</div>
                                    <div className="text-sm md:text-base text-gray-300 font-droid-arabic-kufi">
                                        {language === 'en' ? 'Programs' : 'برنامج'}
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl md:text-4xl font-bold text-white mb-2">15K+</div>
                                    <div className="text-sm md:text-base text-gray-300 font-droid-arabic-kufi">
                                        {language === 'en' ? 'Beneficiaries' : 'مستفيد'}
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                    
                    {/* Scroll Indicator */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1, delay: 1.2 }}
                        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10"
                    >
                        <div className="flex flex-col items-center gap-2">
                            <span className="text-white/60 text-sm mt-10 font-droid-arabic-kufi">
                                {language === 'en' ? 'Scroll Down' : 'للأسفل'}
                            </span>
                            <motion.div
                                animate={{ y: [0, 10, 0] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                className="w-6 h-10 border-2 border-white/40 rounded-full p-1"
                            >
                                <div className="w-1.5 h-1.5 bg-white rounded-full mx-auto"></div>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            )}
        </>
    );
};

export default VideoBanner;