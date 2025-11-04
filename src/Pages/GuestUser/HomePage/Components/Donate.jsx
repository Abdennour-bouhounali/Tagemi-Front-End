import React, { useState } from 'react';
import { useLanguage } from '../../../../Context/LanguageContext';

const Donate = () => {
    const { language } = useLanguage();
    const [copiedCCP, setCopiedCCP] = useState(false);
    const [copiedBank, setCopiedBank] = useState(false);

    const ccpAccount = "00200028028130007330";
    const bankAccount = "005 00185 4180708410 52";

    const copyToClipboard = (text, type) => {
        navigator.clipboard.writeText(text);
        if (type === 'ccp') {
            setCopiedCCP(true);
            setTimeout(() => setCopiedCCP(false), 2000);
        } else {
            setCopiedBank(true);
            setTimeout(() => setCopiedBank(false), 2000);
        }
    };

    return (
        <section id="donate" className="relative py-20 md:py-28 bg-gradient-to-br from-[#EEF7FF] via-white to-[#EEF7FF] overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#E03A6F]/5 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#101E58]/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Section Header */}
                <div className="text-center mb-16" data-aos="fade-up">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#E03A6F]/10 rounded-full mb-6">
                        <svg className="w-5 h-5 text-[#E03A6F]" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"/>
                        </svg>
                        <span className="text-sm font-semibold text-[#E03A6F] font-droid-arabic-kufi">
                            {language === 'en' ? 'Support Us' : 'ادعمنا'}
                        </span>
                    </div>

                    <h2 className='text-3xl sm:text-4xl md:text-5xl font-bold mb-6 text-[#101E58] font-droid-arabic-kufi'>
                        {language === 'en' ? 'Make a Donation' : 'ساهم معنا'}
                    </h2>

                    <div className="flex justify-center mb-6">
                        <div className="w-24 h-1 bg-gradient-to-r from-[#101E58] via-[#E03A6F] to-[#101E58] rounded-full"></div>
                    </div>

                    <p className="text-gray-600 text-lg md:text-xl max-w-2xl mx-auto font-droid-arabic-kufi">
                        {language === 'en'
                            ? 'Your contribution helps us continue our humanitarian mission'
                            : 'مساهمتك تساعدنا على الاستمرار في مهمتنا الإنسانية'}
                    </p>
                </div>

                {/* Donation Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
                    {/* CCP Option */}
                    <div 
                        className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border-2 border-transparent hover:border-[#101E58]/20 transform hover:-translate-y-1"
                        data-aos="fade-right"
                    >
                        <div className="bg-gradient-to-br from-[#101E58] to-[#1a2d78] p-6 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12"></div>
                            
                            <div className="relative flex items-center gap-4 mb-2">
                                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                    <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
                                    </svg>
                                </div>
                                <div>
                                    <h3 className='text-2xl font-bold font-droid-arabic-kufi'>
                                        {language === 'en' ? 'Tagemi Foundation : Bank Account' : 'مؤسسة تجمي : الحساب البنكي '}
                                    </h3>
                                    <p className="text-lg text-gray-200 font-droid-arabic-kufi">
                                        {language === 'en' ? 'Algeria Exterior Bank, Ghardaia Agenci' : 'بنك الجزائر الخارجي , وكالة غرداية'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-8">
                            {/* Account Number Display */}
                            <div className="bg-gradient-to-br from-gray-50 to-blue-50/50 rounded-xl p-6 mb-6 border-2 border-dashed border-gray-300 group-hover:border-[#101E58]/40 transition-all duration-300">
                                <p className="text-sm text-gray-600 mb-3 font-droid-arabic-kufi text-center font-medium">
                                    {language === 'en' ? 'Account Number' : 'رقم الحساب'}
                                </p>
                                <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
                                    <p className="text-xl sm:text-2xl md:text-3xl font-bold text-[#101E58] text-center font-mono tracking-wide whitespace-nowrap overflow-x-auto" dir="ltr">
                                        {ccpAccount}
                                    </p>
                                </div>
                                  <p className="text-xs text-gray-500 text-center font-droid-arabic-kufi mb-4 font-medium">
                                    BEA - {language === 'en' ? 'Local Development Bank' : 'بنك الجزائر الخارجي'}
                                </p>
                                <button
                                    onClick={() => copyToClipboard(ccpAccount, 'ccp')}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#101E58] text-white rounded-lg hover:bg-[#1a2d78] transition-all duration-300 font-droid-arabic-kufi transform hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg"
                                >
                                    {copiedCCP ? (
                                        <>
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                                            </svg>
                                            <span className="font-semibold">{language === 'en' ? 'Copied!' : 'تم النسخ!'}</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                            </svg>
                                            <span className="font-semibold">{language === 'en' ? 'Copy Number' : 'نسخ الرقم'}</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Info */}
                            <div className="flex items-start gap-3 text-gray-600 bg-blue-50/50 p-4 rounded-lg">
                                <svg className="w-5 h-5 text-[#101E58] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                                </svg>
                                <p className="text-sm font-droid-arabic-kufi leading-relaxed">
                                     {language === 'en'
                                        ? 'You can transfer directly to our BDL bank account'
                                        : 'يمكنك التحويل مباشرة إلى حسابنا البنكي في بنك الجزائر الخارجي'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Bank Account Option */}
                    <div 
                        className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border-2 border-transparent hover:border-[#E03A6F]/20 transform hover:-translate-y-1"
                        data-aos="fade-left"
                    >
                        <div className="bg-gradient-to-br from-[#E03A6F] to-[#c8102e] p-6 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12"></div>
                            
                            <div className="relative flex items-center gap-4 mb-2">
                                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                    <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M4 10v7h3v-7H4zm6 0v7h3v-7h-3zM2 22h19v-3H2v3zm14-12v7h3v-7h-3zm-4.5-9L2 6v2h19V6l-9.5-5z"/>
                                    </svg>
                                </div>
                                <div>
                                    <h3 className='text-2xl font-bold font-droid-arabic-kufi'>
                                        {language === 'en' ? 'Tagemi Association : Bank Account' : 'جمعية تجمي : الحساب البنكي '}

                                    </h3>
                                    <p className="text-lg text-gray-200 font-droid-arabic-kufi">
                                        {language === 'en' ? 'BDL Bank, Ghardaia Agenci' : 'بنك التنمية المحلية , وكالة غرداية'}

                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-8">
                            {/* Account Number Display - FIXED VERSION */}
                            <div className="bg-gradient-to-br from-gray-50 to-pink-50/50 rounded-xl p-6 mb-6 border-2 border-dashed border-gray-300 group-hover:border-[#E03A6F]/40 transition-all duration-300">
                                <p className="text-sm text-gray-600 mb-3 font-droid-arabic-kufi text-center font-medium">
                                    {language === 'en' ? 'Account Number' : 'رقم الحساب'}
                                </p>
                                <div className="bg-white rounded-lg p-4 mb-2 shadow-sm">
                                    {/* Fixed: Better display for bank account number */}
                                    <p 
                                        className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-[#E03A6F] text-center font-mono break-all leading-relaxed px-2" 
                                        dir="ltr"
                                        style={{ 
                                            wordSpacing: '0.15em',
                                            letterSpacing: '0.05em'
                                        }}
                                    >
                                        {bankAccount}
                                    </p>
                                </div>
                                <p className="text-xs text-gray-500 text-center font-droid-arabic-kufi mb-4 font-medium">
                                    BDL - {language === 'en' ? 'Local Development Bank' : 'بنك التنمية المحلية'}
                                </p>
                                <button
                                    onClick={() => copyToClipboard(bankAccount, 'bank')}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#E03A6F] text-white rounded-lg hover:bg-[#c8102e] transition-all duration-300 font-droid-arabic-kufi transform hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg"
                                >
                                    {copiedBank ? (
                                        <>
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                                            </svg>
                                            <span className="font-semibold">{language === 'en' ? 'Copied!' : 'تم النسخ!'}</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                            </svg>
                                            <span className="font-semibold">{language === 'en' ? 'Copy Number' : 'نسخ الرقم'}</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Info */}
                            <div className="flex items-start gap-3 text-gray-600 bg-pink-50/50 p-4 rounded-lg">
                                <svg className="w-5 h-5 text-[#E03A6F] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                                </svg>
                                <p className="text-sm font-droid-arabic-kufi leading-relaxed">
                                    {language === 'en'
                                        ? 'You can transfer directly to our BDL bank account'
                                        : 'يمكنك التحويل مباشرة إلى حسابنا البنكي في بنك التنمية المحلية'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom CTA */}
                <div className="text-center mt-16" data-aos="fade-up">
                    <div className="inline-block bg-white rounded-2xl shadow-xl p-8 max-w-2xl border border-gray-100">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[#E03A6F] to-[#c8102e] rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                            </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-[#101E58] mb-3 font-droid-arabic-kufi">
                            {language === 'en' ? 'Every Contribution Matters' : 'كل مساهمة مهمة'}
                        </h3>
                        <p className="text-gray-600 font-droid-arabic-kufi text-lg leading-relaxed">
                            {language === 'en'
                                ? 'Thank you for your generosity and support in our mission'
                                : 'شكراً لكرمك ودعمك في مهمتنا'}
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Donate;