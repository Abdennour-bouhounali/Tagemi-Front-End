import React from 'react';
import { useTranslation } from 'react-i18next';

const ImpactStory = () => {
    const { t } = useTranslation();

    const stories = [
        {
            id: 1,
            quote: t('home.story1Quote'),
            author: t('home.story1Author'),
            role: t('home.story1Role'),
            location: t('home.story1Location'),
            icon: 'medical'
        },
        {
            id: 2,
            quote: t('home.story2Quote'),
            author: t('home.story2Author'),
            role: t('home.story2Role'),
            location: t('home.story2Location'),
            icon: 'volunteer'
        },
        {
            id: 3,
            quote: t('home.story3Quote'),
            author: t('home.story3Author'),
            role: t('home.story3Role'),
            location: t('home.story3Location'),
            icon: 'education'
        }
    ];

    const getIcon = (iconType) => {
        switch (iconType) {
            case 'medical':
                return (
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 3H5c-1.1 0-1.99.9-1.99 2L3 19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z" />
                    </svg>
                );
            case 'volunteer':
                return (
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                );
            case 'education':
                return (
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z" />
                    </svg>
                );
            default:
                return null;
        }
    };

    return (
        <section className="py-20 md:py-28 bg-gray-50 relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#E03A6F] to-transparent"></div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Section Header */}
                <div className="text-center mb-16" data-aos="fade-up">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#101E58]/10 rounded-full mb-6">
                        <svg className="w-5 h-5 text-[#101E58]" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z" />
                        </svg>
                        <span className="text-sm font-semibold text-[#101E58] font-droid-arabic-kufi">
                            {t('home.testimonials')}
                        </span>
                    </div>

                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#101E58] font-droid-arabic-kufi mb-4">
                        {t('home.storiesOfImpact')}
                    </h2>

                    <div className="flex justify-center mb-6">
                        <div className="w-24 h-1 bg-gradient-to-r from-[#101E58] via-[#E03A6F] to-[#101E58] rounded-full"></div>
                    </div>

                    <p className="text-gray-600 text-lg md:text-xl max-w-2xl mx-auto font-droid-arabic-kufi">
                        {t('home.storiesDesc')}
                    </p>
                </div>

                {/* Stories Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {stories.map((story, index) => (
                        <div
                            key={story.id}
                            className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 p-8 relative overflow-hidden"
                            data-aos="fade-up"
                            data-aos-delay={index * 100}
                        >
                            {/* Decorative Quote Mark */}
                            <div className="absolute top-4 right-4 text-[#E03A6F]/10 group-hover:text-[#E03A6F]/20 transition-colors">
                                <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" />
                                </svg>
                            </div>

                            {/* Icon */}
                            <div className="mb-6 relative z-10">
                                <div className="w-14 h-14 bg-gradient-to-br from-[#101E58] to-[#1a2d78] rounded-full flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300">
                                    {getIcon(story.icon)}
                                </div>
                            </div>

                            {/* Quote */}
                            <p className="text-gray-700 mb-6 font-droid-arabic-kufi leading-relaxed text-base relative z-10 min-h-[120px]">
                                "{story.quote}"
                            </p>

                            {/* Author Info */}
                            <div className="border-t border-gray-200 pt-4 relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-[#E03A6F] to-[#c8102e] rounded-full flex items-center justify-center text-white font-bold text-lg">
                                        {story.author.charAt(0)}
                                    </div>
                                    <div className="text-right flex-1">
                                        <h4 className="font-bold text-[#101E58] font-droid-arabic-kufi">
                                            {story.author}
                                        </h4>
                                        <p className="text-sm text-gray-600 font-droid-arabic-kufi">
                                            {story.role} • {story.location}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Bottom Border Animation */}
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#101E58] via-[#E03A6F] to-[#101E58] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                        </div>
                    ))}
                </div>

                {/* CTA Section */}
                <div className="text-center mt-16" data-aos="fade-up">
                    <div className="inline-block bg-white rounded-2xl shadow-lg p-8 max-w-2xl">
                        <h3 className="text-2xl font-bold text-[#101E58] mb-3 font-droid-arabic-kufi">
                            {t('home.shareStory')}
                        </h3>
                        <p className="text-gray-600 mb-6 font-droid-arabic-kufi">
                            {t('home.shareStoryDesc')}
                        </p>
                        <a
                            href="/contact"
                            className="inline-flex items-center gap-2 px-8 py-4 bg-[#101E58] text-white rounded-full font-bold text-lg font-droid-arabic-kufi hover:bg-[#E03A6F] transition-colors duration-300 hover:shadow-xl"
                        >
                            {t('home.contactUs')}
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ImpactStory;
