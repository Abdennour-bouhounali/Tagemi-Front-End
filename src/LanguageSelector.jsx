import React, { useState } from 'react';
import { useLanguage } from './Context/LanguageContext';

const LanguageSelector = () => {
  const { language, handleLanguageChange } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleSelect = (lang) => {
    handleLanguageChange({ target: { value: lang } });
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="border-none rounded p-1 flex items-center space-x-2"
      >
        {language === 'en' ? <img
          src="https://flagcdn.com/36x27/gb.png"
          srcset="https://flagcdn.com/72x54/gb.png 2x,
    https://flagcdn.com/108x81/gb.png 3x"
          width="36"
          height="27"
          alt="United Kingdom" />
          :
          <img
            src="https://flagcdn.com/36x27/dz.png"
            srcset="https://flagcdn.com/72x54/dz.png 2x,
    https://flagcdn.com/108x81/dz.png 3x"
            width="36"
            height="27"
            alt="Algeria" />}

      </button>
      {isOpen && (
        <div className="absolute z-10 mt-2 w-full bg-white border rounded shadow-lg">
          <div
            onClick={() => handleSelect('en')}
            className="flex items-center p-2 cursor-pointer hover:bg-gray-200"
          >
            <img
              src="https://flagcdn.com/36x27/gb.png"
              srcset="https://flagcdn.com/72x54/gb.png 2x,
    https://flagcdn.com/108x81/gb.png 3x"
              width="36"
              height="27"
              alt="United Kingdom" />

          </div>
          <div
            onClick={() => handleSelect('ar')}
            className="flex items-center p-2 cursor-pointer hover:bg-gray-200"
          >
            <img
              src="https://flagcdn.com/36x27/dz.png"
              srcset="https://flagcdn.com/72x54/dz.png 2x,
    https://flagcdn.com/108x81/dz.png 3x"
              width="36"
              height="27"
              alt="Algeria" />

          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
