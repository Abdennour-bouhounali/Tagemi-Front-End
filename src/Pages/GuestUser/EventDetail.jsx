import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../../Context/LanguageContext';
import { useTranslation } from 'react-i18next';

const EventDetail = () => {
  const { id } = useParams();
  const { language } = useLanguage();
  const { t } = useTranslation();

  // Mock event data - replace with actual API call
  const event = {
    id: 1,
    name: t('events.medicalCamp'),
    date: '2024-08-10',
    description: t('events.medicalCampFullDesc'),
    location: t('events.defaultLocation'),
    time: '09:00 - 17:00',
    organizer: t('about.foundation'),
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex mb-6 text-sm" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3 font-droid-arabic-kufi">
              <li className="inline-flex items-center">
                <Link to="/" className="text-blue-100 hover:text-white transition-colors">
                  {t('nav.home')}
                </Link>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-blue-200 mx-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <Link to="/events" className="text-blue-100 hover:text-white transition-colors">
                    {t('events.title')}
                  </Link>
                </div>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-blue-200 mx-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-white font-medium">
                    {event.name}
                  </span>
                </div>
              </li>
            </ol>
          </nav>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white font-droid-arabic-kufi">
            {event.name}
          </h1>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="prose prose-lg max-w-none">
              <p className="text-lg md:text-xl leading-relaxed text-gray-700 font-droid-arabic-kufi mb-8">
                {event.description}
              </p>

              {/* Additional Details */}
              <div className="bg-gray-50 rounded-2xl p-6 md:p-8 mt-8">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 font-droid-arabic-kufi">
                  {t('events.eventDetails')}
                </h2>

                <div className="space-y-4">
                  <DetailItem
                    icon={
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    }
                    label={t('events.date')}
                    value={event.date}
                  />

                  <DetailItem
                    icon={
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    }
                    label={t('events.time')}
                    value={event.time}
                  />

                  <DetailItem
                    icon={
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    }
                    label={t('events.location')}
                    value={event.location}
                  />

                  <DetailItem
                    icon={
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    }
                    label={t('events.organizer')}
                    value={event.organizer}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              {/* Register Card */}
              <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 md:p-8 text-white shadow-2xl">
                <h3 className="text-2xl font-bold mb-4 font-droid-arabic-kufi">
                  {t('events.interested')}
                </h3>
                <p className="mb-6 font-droid-arabic-kufi">
                  {t('events.registerInfo')}
                </p>
                <Link
                  to={`/appointment/${event.id}`}
                  className="block w-full px-6 py-4 bg-white text-blue-600 text-center font-bold rounded-full hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 font-droid-arabic-kufi"
                >
                  {t('events.registerNow')}
                </Link>
              </div>

              {/* Share Card */}
              <div className="mt-6 bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <h3 className="text-xl font-bold mb-4 text-gray-900 font-droid-arabic-kufi">
                  {t('events.shareEvent')}
                </h3>
                <div className="flex space-x-3">
                  <ShareButton
                    icon={
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    }
                    color="bg-blue-600 hover:bg-blue-700"
                  />
                  <ShareButton
                    icon={
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                      </svg>
                    }
                    color="bg-sky-500 hover:bg-sky-600"
                  />
                  <ShareButton
                    icon={
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                      </svg>
                    }
                    color="bg-green-500 hover:bg-green-600"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Components
const DetailItem = ({ icon, label, value }) => (
  <div className="flex items-start space-x-3">
    <div className="flex-shrink-0 text-blue-600">
      {icon}
    </div>
    <div>
      <p className="text-sm font-medium text-gray-600 font-droid-arabic-kufi">{label}</p>
      <p className="text-base font-semibold text-gray-900 font-droid-arabic-kufi">{value}</p>
    </div>
  </div>
);

const ShareButton = ({ icon, color }) => (
  <button
    className={`${color} text-white p-3 rounded-full transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2`}
  >
    {icon}
  </button>
);

export default EventDetail;