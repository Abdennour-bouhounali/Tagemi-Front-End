import React from 'react';
import { useLanguage } from '../../../../Context/LanguageContext';

const Introduction = () => {
    const { language } = useLanguage();

    return (
        <section className="relative py-20 md:py-28 bg-gradient-to-br from-[#EEF7FF] via-white to-[#EEF7FF] overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 left-0 w-72 h-72 bg-[#101E58]/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#E03A6F]/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
            
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
                    {/* Video Section */}
                    <div className="w-full lg:w-1/2 order-2 lg:order-1" data-aos="fade-right">
                        <div className="relative group">
                            {/* Decorative Border */}
                            <div className="absolute -inset-4 bg-gradient-to-r from-[#101E58] to-[#E03A6F] rounded-2xl opacity-20 blur-xl group-hover:opacity-30 transition-opacity duration-300"></div>
                            
                            {/* Video Container */}
                            <div className="relative rounded-2xl overflow-hidden shadow-2xl transform group-hover:scale-[1.02] transition-transform duration-300">
                                <div className="aspect-video">
                                    <iframe
                                        width="100%"
                                        height="100%"
                                        src="https://www.youtube.com/embed/Bc9DI4uzg2Q?si=m0cfxB4yaRS_w2Y6"
                                        title="YouTube video player"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                        referrerPolicy="strict-origin-when-cross-origin"
                                        allowFullScreen
                                        className="w-full h-full"
                                    ></iframe>
                                </div>
                            </div>
                            
                            {/* Play Button Overlay (optional decorative element) */}
                            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-[#E03A6F] rounded-full flex items-center justify-center shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z"/>
                                </svg>
                            </div>
                        </div>
                    </div>
                    
                    {/* Content Section */}
                    <div className="w-full lg:w-1/2 order-1 lg:order-2 text-center lg:text-right" data-aos="fade-left">
                        {/* Section Label */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#101E58]/10 rounded-full mb-6">
                            <div className="w-2 h-2 bg-[#E03A6F] rounded-full animate-pulse"></div>
                            <span className="text-sm font-semibold text-[#101E58] font-droid-arabic-kufi">
                                {language === 'en' ? 'About Us' : 'عن المؤسسة'}
                            </span>
                        </div>
                        
                        {/* Main Heading */}
                        <h2 className='text-3xl sm:text-4xl md:text-5xl font-bold mb-6 text-[#101E58] font-droid-arabic-kufi leading-tight'>
                            {language === 'en' ? 'Who We Are' : 'من نحن'}
                        </h2>
                        
                        {/* Decorative Line */}
                        <div className="flex justify-center lg:justify-end mb-8">
                            <div className="w-20 h-1 bg-gradient-to-r from-[#101E58] to-[#E03A6F] rounded-full"></div>
                        </div>
                        
                        {/* Description */}
                        <p className="text-gray-700 leading-relaxed text-lg md:text-xl font-droid-arabic-kufi mb-8 max-w-2xl mx-auto lg:mx-0">
                            {language === 'en' 
                                ? 'TAGEMI Foundation is a humanitarian charity dedicated to contributing to human development in its social, economic, educational, and scientific aspects, aiming for a prosperous and leading Algeria.' 
                                : 'مؤسسة تــجــمــي، خيرية إنسانية غايتنا المساهمة في تحقيق تنمية انسانية بجوانبها الإجتماعية، الإقتصادية، التربوية و العلمية لجزائر مزدهرة و رائدة.'}
                        </p>
                        
                        {/* Key Features */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                            <div className="flex items-start gap-3 bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                                <div className="flex-shrink-0 w-10 h-10 bg-[#101E58]/10 rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6 text-[#101E58]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="text-right flex-1">
                                    <h4 className="font-bold text-[#101E58] mb-1 font-droid-arabic-kufi">
                                        {language === 'en' ? 'Since 2006' : 'منذ 2006'}
                                    </h4>
                                    <p className="text-sm text-gray-600 font-droid-arabic-kufi">
                                        {language === 'en' ? 'Years of Service' : '19 سنة من العطاء'}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-start gap-3 bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                                <div className="flex-shrink-0 w-10 h-10 bg-[#E03A6F]/10 rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6 text-[#E03A6F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                </div>
                                <div className="text-right flex-1">
                                    <h4 className="font-bold text-[#101E58] mb-1 font-droid-arabic-kufi">
                                        {language === 'en' ? 'Community Service' : 'خدمة إنسانية'}
                                    </h4>
                                    <p className="text-sm text-gray-600 font-droid-arabic-kufi">
                                        {language === 'en' ? 'Social Impact' : 'تأثير إجتماعي'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        {/* CTA Button */}
                        <div className="flex justify-center lg:justify-end">
                            <a
                                href="/about"
                                className="group inline-flex items-center gap-2 px-8 py-4 bg-[#101E58] text-white rounded-full font-bold text-lg font-droid-arabic-kufi transition-all duration-300 hover:bg-[#E03A6F] hover:shadow-xl hover:scale-105"
                            >
                                {language === 'en' ? 'Learn More' : 'اعرف المزيد'}
                                <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Introduction;
