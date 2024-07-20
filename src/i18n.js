import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

// Initialize i18next
i18n
  .use(HttpBackend) // Load translations using http (default public/assets/locales)
  .use(LanguageDetector) // Detect language from browser
  .use(initReactI18next) // Passes i18n instance to react-i18next
  .init({
    fallbackLng: 'en', // Default language
    debug: true,
    interpolation: {
      escapeValue: false, // React already does escaping
    },
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json', // Path to translation files
    },
    detection: {
      order: ['queryString', 'cookie'],
      cache: ['cookie'],
    },
  });

export default i18n;
