import React from 'react';
import { useLanguage } from '../../../../Context/LanguageContext';

const Introduction = () => {
    const { language } = useLanguage();

    return (
        <div className="min-h-[500px] px-10 flex flex-col lg:flex-row bg-[#EEF7FF] items-center justify-center text-center lg:text-left">
            <div className="lg:w-1/2 py-14 flex justify-center lg:justify-start sm:w-full">
                <iframe
                    width="100%"
                    height="500px"
                    src="https://www.youtube.com/embed/Bc9DI4uzg2Q?si=m0cfxB4yaRS_w2Y6"
                    title="YouTube video player"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                    className="rounded-lg shadow-lg"
                ></iframe>
            </div>
            <div className="lg:w-1/2 mt-4 lg:mt-0 lg:ml-12 p-4 rounded-lg text-right ">
                <h2 className='font-droid-arabic-kufi text-4xl font-bold mb-8 text-[#101E58] text-center'> 
                {language === 'en' ? 'Who We Are' : 'من نحن'}
                </h2>
                <p className="text-gray-700 leading-[3] text-[24px]  font-bold mb-4 font-droid-arabic-kufi text-center">
                {language === 'en' ? 'TAGEMI Foundation is a humanitarian charity dedicated to contributing to human development in its social, economic, educational, and scientific aspects, aiming for a prosperous and leading Algeria.' : ' مؤسسة تــجــمــي ، خيرية إنسانية غايتنا المساهمة في تحقيق تنمية انسانية بجوانبها الإجتماعية، الإقتصادية، التربوية و العلمية لجزائر مزدهرة و رائدة.'}

                </p>
            </div>
        </div>
    );
};

export default Introduction;
