import React from 'react';
import { useLanguage } from '../../../../Context/LanguageContext';

const env = import.meta.env;
export const apiUrl = env.VITE_API_URL;

const AboutActvity = ({ TypeDescription, ImageUrl }) => {
    const { language } = useLanguage();
    
    return (
        <section className="py-12 md:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-gray-50">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    {/* Text Content */}
                    <div className={`order-2 lg:order-1 ${language === 'en' ? 'lg:pr-8' : 'lg:pl-8'}`}>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 text-center lg:text-left font-droid-arabic-kufi text-[#101E58]">
                            {language === 'en' ? 'About Activity' : 'نبذة تعريفية'}
                        </h2>
                        <div className="w-20 h-1 bg-[#E03A6F] mb-6 mx-auto lg:mx-0"></div>
                        
                        <div
                            className={`prose prose-lg max-w-none text-gray-700 leading-relaxed font-droid-arabic-kufi ${
                                language === 'en' ? 'text-left' : 'text-right'
                            }`}
                            dangerouslySetInnerHTML={{ __html: TypeDescription }}
                        />
                    </div>
                    
                    {/* Image */}
                    <div className="order-1 lg:order-2">
                        <div className="relative rounded-2xl overflow-hidden shadow-2xl transform hover:scale-[1.02] transition-transform duration-300">
                            <img 
                                src={ImageUrl} 
                                alt={language === 'en' ? 'Activity Image' : 'صورة النشاط'}
                                className="w-full h-auto object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AboutActvity;