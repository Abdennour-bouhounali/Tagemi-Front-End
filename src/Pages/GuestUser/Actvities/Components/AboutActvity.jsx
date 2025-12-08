import React from 'react';
import { useLanguage } from '../../../../Context/LanguageContext';
import { CheckCircle2, Sparkles } from 'lucide-react';

const env = import.meta.env;
export const apiUrl = env.VITE_API_URL;

const AboutActvity = ({ TypeDescription }) => {
    const { language } = useLanguage();
    
    // Don't render if no description
    if (!TypeDescription || TypeDescription.trim() === '') {
        return null;
    }
    
    return (
        <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-white relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-[#E03A6F]/5 rounded-full filter blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#101E58]/5 rounded-full filter blur-3xl"></div>
            
            <div className="max-w-4xl mx-auto relative">
                {/* Section Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 bg-[#E03A6F]/10 px-6 py-2 rounded-full mb-6">
                        <Sparkles className="w-5 h-5 text-[#E03A6F]" />
                        <span className="text-[#E03A6F] font-droid-arabic-kufi font-medium">
                            {language === 'en' ? 'About This Category' : 'عن هذه الفئة'}
                        </span>
                    </div>
                    
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-droid-arabic-kufi text-[#101E58] mb-4">
                        {language === 'en' ? 'Overview' : 'نظرة عامة'}
                    </h2>
                    
                    <div className="w-24 h-1.5 bg-gradient-to-r from-[#E03A6F] to-[#c8102e] mx-auto rounded-full"></div>
                </div>
                
                {/* Content Card */}
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-12 relative overflow-hidden">
                    {/* Corner Decoration */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#E03A6F]/10 to-transparent rounded-bl-full"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-[#101E58]/10 to-transparent rounded-tr-full"></div>
                    
                    {/* Description Content */}
                    <div
                        className='prose prose-lg max-w-none relative z-10 text-center'
                        style={{
                            direction: language === 'ar' ? 'rtl' : 'ltr'
                        }}
                    >
                        <div 
                            className="text-gray-700 leading-relaxed font-droid-arabic-kufi space-y-4"
                            dangerouslySetInnerHTML={{ __html: TypeDescription }}
                        />
                    </div>
                </div>

                {/* Bottom Decoration */}
                <div className="mt-12 flex justify-center">
                    <div className="flex items-center gap-2 text-sm text-gray-500 font-droid-arabic-kufi">
                        <CheckCircle2 className="w-5 h-5 text-[#E03A6F]" />
                        <span>
                            {language === 'en' 
                                ? 'Scroll down to explore all activities' 
                                : 'قم بالتمرير لأسفل لاستكشاف جميع الأنشطة'
                            }
                        </span>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AboutActvity;