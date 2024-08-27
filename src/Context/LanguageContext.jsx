import React, { createContext, useContext, useEffect, useState } from 'react';

// Create a Context
const LanguageContext = createContext();

// Create a Provider component
export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en'); // Default language

  const handleLanguageChange = (event) => {
    setLanguage(event.target.value);
  };

  useEffect(() => {
    const htmlElement = document.documentElement;
    htmlElement.setAttribute('dir', language === 'ar' ? 'rtl' : 'ltr');
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, handleLanguageChange }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Create a custom hook to use the LanguageContext
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
