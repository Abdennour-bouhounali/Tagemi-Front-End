import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from './Context/LanguageContext';
import { ChevronDown, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const LanguageSelector = () => {
  const { language, handleLanguageChange } = useLanguage();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleSelect = (lang) => {
    handleLanguageChange({ target: { value: lang } });
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const languages = [
    {
      code: 'en',
      name: 'English',
      // Using Flag Icons CDN
      flag: 'https://cdn.jsdelivr.net/gh/lipis/flag-icons@7.2.3/flags/4x3/gb.svg',
      alt: 'United Kingdom'
    },
    {
      code: 'ar',
      name: 'العربية',
      flag: 'https://cdn.jsdelivr.net/gh/lipis/flag-icons@7.2.3/flags/4x3/dz.svg',
      alt: 'Algeria'
    }
  ];

  const currentLanguage = languages.find(lang => lang.code === language);

  if (!currentLanguage) {
    return null;
  }

  return (
    <>
      <style>
        {`
          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-slideDown {
            animation: slideDown 0.2s ease-out;
          }
        `}
      </style>

      <div className="relative" ref={dropdownRef}>
        {/* Main Button */}
        <button
          onClick={toggleDropdown}
          className="group flex items-center gap-2 px-3 py-2 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:bg-white transition-all duration-300 hover:scale-105 active:scale-95"
          aria-label="Select Language"
          aria-expanded={isOpen}
        >
          <Globe className="w-4 h-4 text-gray-600 group-hover:text-blue-600 transition-colors" />

          <div className="flex items-center gap-2">
            <img
              src={currentLanguage.flag}
              width="24"
              height="18"
              alt={currentLanguage.alt}
              className="rounded shadow-sm object-cover"
            />
            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors hidden sm:inline">
              {currentLanguage.name}
            </span>
          </div>

          <ChevronDown
            className={`w-4 h-4 text-gray-600 transition-transform duration-300 ${isOpen ? 'rotate-180 text-blue-600' : ''
              }`}
          />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10 md:hidden"
              onClick={() => setIsOpen(false)}
            ></div>

            <div className="absolute right-0 z-20 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden animate-slideDown">
              <div className="px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  {t('common.selectLanguage')}
                </p>
              </div>

              <div className="py-1">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleSelect(lang.code)}
                    className={`w-full flex items-center gap-3 px-4 py-3 cursor-pointer transition-all duration-200 ${language === lang.code
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    <img
                      src={lang.flag}
                      width="28"
                      height="21"
                      alt={lang.alt}
                      className="rounded shadow-sm object-cover"
                    />

                    <span className="flex-1 text-left text-sm">
                      {lang.name}
                    </span>

                    {language === lang.code && (
                      <svg
                        className="w-5 h-5 text-blue-600"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default LanguageSelector;