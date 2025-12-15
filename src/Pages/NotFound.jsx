// src/components/NotFound.js
import React from "react";
import { Home, AlertCircle, ArrowRight } from "lucide-react";
import { useTranslation } from 'react-i18next';

const NotFound = () => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#131842] via-[#1a2254] to-[#0f1230] text-white px-4">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Content Container */}
      <div className="relative z-10 text-center space-y-6 max-w-2xl">
        {/* Icon */}
        <div className="flex justify-center mb-6 animate-bounce">
          <div className="w-24 h-24 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border-4 border-white/20">
            <AlertCircle className="w-12 h-12 text-white" />
          </div>
        </div>

        {/* 404 Text */}
        <h1 className="text-9xl md:text-[12rem] font-extrabold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent animate-pulse">
          404
        </h1>

        {/* Error Message */}
        <div className="space-y-3">
          <h2 className="text-3xl md:text-4xl font-bold">
            {t('common.pageNotFound')}
          </h2>
          <p className="text-lg md:text-xl text-gray-300 max-w-md mx-auto font-droid-arabic-kufi">
            {t('common.pageNotFoundDesc')}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">

          <a href="/"
            className="group flex items-center gap-3 px-8 py-4 bg-white text-[#131842] rounded-xl shadow-xl font-semibold hover:shadow-2xl hover:scale-105 transition-all duration-300"
          >
            <Home className="w-5 h-5" />
            <span className="font-droid-arabic-kufi">{t('common.backToHome')}</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </a>

          <button
            onClick={() => window.history.back()}
            className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/20 transition-all duration-300 border border-white/20"
          >
            <span className="font-droid-arabic-kufi">{t('common.goBack')}</span>
          </button>
        </div>

        {/* Additional Info */}
        <div className="pt-12 text-gray-400 text-sm font-droid-arabic-kufi">
          <p>{t('common.contactSupport')}</p>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 text-gray-500 text-xs">
        Error Code: 404 | Page Not Found
      </div>
    </div>
  );
};

export default NotFound;