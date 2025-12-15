import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../Context/LanguageContext';
import { useTranslation } from 'react-i18next';

const Events = () => {
  const { language } = useLanguage();
  const { t } = useTranslation();

  const events = [
    {
      id: 1,
      name: t('events.medicalCamp'),
      date: '2024-08-10',
      description: t('events.medicalCampDesc')
    },
    {
      id: 2,
      name: t('events.culturalFestival'),
      date: '2024-09-15',
      description: t('events.culturalFestivalDesc')
    },
  ];

  return (
    <div className="min-h-screen bg-white py-12 md:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-[#101E58] font-droid-arabic-kufi">
            {t('events.upcoming')}
          </h1>
          <div className="w-20 h-1 bg-[#E03A6F] mx-auto"></div>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {events.map(event => (
            <div
              key={event.id}
              className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl overflow-hidden transition-all duration-300 transform hover:-translate-y-2"
            >
              <div className="p-6 md:p-8">
                <h2 className="text-2xl md:text-3xl font-bold mb-3 text-gray-900 font-droid-arabic-kufi">
                  {event.name}
                </h2>

                <div className="flex items-center text-gray-600 mb-4">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="font-droid-arabic-kufi">{event.date}</span>
                </div>

                <p className="text-base md:text-lg text-gray-600 mb-6 font-droid-arabic-kufi">
                  {event.description}
                </p>

                <Link
                  to={`/events/${event.id}`}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform group-hover:scale-105 font-droid-arabic-kufi font-medium"
                >
                  {t('events.learnMore')}
                  <svg
                    className={`w-5 h-5 ${language === 'en' ? 'ml-2' : 'mr-2 rotate-180'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Events;