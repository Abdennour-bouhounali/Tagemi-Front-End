import React from 'react';
import { useLanguage } from '../../../../Context/LanguageContext';

const Donate = () => {
    const { language } = useLanguage();

    return (
        <div className='block bg-[#EEF7FF] p-5 '>
                        <h2 className='font-droid-arabic-kufi text-4xl font-bold mb-8 text-[#101E58] text-center'> 
                {language === 'en' ? 'Donate' : 'ساهم معنا'}
            </h2>   
        <div className="min-h-[300px] px-10 flex flex-col lg:flex-row items-center justify-center text-center lg:text-left">
           

            <div className="lg:w-1/2 mt-4 lg:mt-0 lg:ml-12 p-4 rounded-lg text-right ">
                <h3 className='font-droid-arabic-kufi text-2xl font-bold mb-8 text-[#101E58] text-center'> 
                {language === 'en' ? 'Using CCP' : 'عبر حساب CCP'}
                </h3>
                <p className="text-gray-700 leading-[3] text-[24px]  font-bold mb-4 font-droid-arabic-kufi text-center">
                {/* {language === 'en' ? 'TAGEMI Foundation is a humanitarian charity dedicated to contributing to human development in its social, economic, educational, and scientific aspects, aiming for a prosperous and leading Algeria.' : ' مؤسسة تــجــمــي ، خيرية إنسانية غايتنا المساهمة في تحقيق تنمية انسانية بجوانبها الإجتماعية، الإقتصادية، التربوية و العلمية لجزائر مزدهرة و رائدة.'} */}

                </p>
            </div>
            <div className="lg:w-1/2 mt-4 lg:mt-0 lg:ml-12 p-4 rounded-lg text-right ">
                <h2 className='font-droid-arabic-kufi text-2xl font-bold mb-8 text-[#101E58] text-center'> 
                {language === 'en' ? 'Using Bank Account' : 'عبر الحساب البنكي'}
                </h2>
                <p className="text-gray-700 leading-[3] text-[24px]  font-bold mb-4 font-droid-arabic-kufi text-center">
                {/* {language === 'en' ? 'TAGEMI Foundation is a humanitarian charity dedicated to contributing to human development in its social, economic, educational, and scientific aspects, aiming for a prosperous and leading Algeria.' : ' مؤسسة تــجــمــي ، خيرية إنسانية غايتنا المساهمة في تحقيق تنمية انسانية بجوانبها الإجتماعية، الإقتصادية، التربوية و العلمية لجزائر مزدهرة و رائدة.'} */}
                005 00185 4180708410 52 C. BDL N°
                </p>
            </div>
        </div>
        </div>

    );
};

export default Donate;
