import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../Context/LanguageContext';
import Footer from './HomePage/Components/Footer';
const env = import.meta.env;
export const apiUrl = env.VITE_API_URL;
const About = () => {
  const { language } = useLanguage();
  const [types, setTypes] = useState([]);

  async function getTypes() {
    const res = await fetch(`${apiUrl}/api/types`);
    const data = await res.json();
    setTypes(data);
  }

  useEffect(() => {
    getTypes();
  }, []);

  return (
    <>
      {/* About Section */}
      <div className=" px-4 sm:px-6 md:px-10 bg-gradient-to-b from-white to-[#DAE0F5] flex flex-col items-center text-center mt-24">
        <h1 className="text-3xl sm:text-4xl font-bold mb-4 font-droid-arabic-kufi text-[#E03A6F]">
          {language === 'en' ? 'About Us' : 'من نحن'}
        </h1>
        <p className="text-base sm:text-lg md:text-[24px] leading-relaxed mb-6 font-droid-arabic-kufi w-full sm:w-3/4 md:w-2/3 mx-auto mt-10">
          {language === 'en'
            ? 'TAGEMI Foundation is a humanitarian charity dedicated to contributing to human development in its social, economic, educational, and scientific aspects, aiming for a prosperous and leading Algeria. Established on 15/07/2018, it is an extension of the Tajmi Association, founded on May 29, 2006, which is a humanitarian and social association located in Saha Souk, Aïn Témouchent, Ghardaia.'
            : 'مؤسسة تــجــمــي ، خيرية إنسانية غايتنا المساهمة في تحقيق تنمية انسانية بجوانبها الإجتماعية، الإقتصادية، التربوية و العلمية لجزائر مزدهرة و رائدة تأسست بتاريخ 15/07/2018 و هي امتداد لنشاط جمعية تجمي التي تأسست بتاريخ : 29 ماي 2006 و هي جمعية ذات طابع إنساني اجتماعي، الكائن مقرها بساحة السوق، بلدية العطف ولاية غرداية.'}
        </p>
      </div>
  
      {/* Our Goals Section */}
      <div className="flex flex-col lg:flex-row mt-10 lg:mt-20 px-4 sm:px-6 lg:px-10 gap-10">
        <div className="lg:basis-1/2">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-center lg:text-left font-droid-arabic-kufi text-[#E03A6F]">
            {language === 'en' ? 'Our Goals' : 'غايتنا'}
          </h1>
          <ul className="list-none text-base sm:text-lg md:text-[24px] leading-relaxed mt-6 space-y-4 text-center lg:text-left font-droid-arabic-kufi">
            <li>{language === 'en' ? 'Promoting humane behavior in line with nature' : 'ترقية السلوك الإنساني بما يتماشى و الفطرة'}</li>
            <li>{language === 'en' ? 'Maintaining public health for families and the community' : 'المحافظة على الصحة العامة للأسرة و المجتمع'}</li>
            <li>{language === 'en' ? 'Promoting science as a cultural and human value' : 'ترقية العلم كقيمة حضارية و إنسانية'}</li>
          </ul>
        </div>
        <div className="lg:basis-1/2 flex justify-center">
          <img src="/child.jpg" alt="Child" className="w-full sm:w-3/4 lg:w-full h-auto" />
        </div>
      </div>
  
      {/* Our Objectives Section */}
      <div className="flex flex-col lg:flex-row mt-10 lg:mt-20 px-4 sm:px-6 lg:px-10 gap-10">
        <div className="lg:basis-1/2 flex justify-center">
          <img src="/medical.JPG" alt="Medical" className="w-full sm:w-3/4 lg:w-full h-auto" />
        </div>
        <div className="lg:basis-1/2">
          <h1 className="text-3xl sm:text-4xl font-bold text-center lg:text-left font-droid-arabic-kufi text-[#E03A6F] my-5">
            {language === 'en' ? 'Our Objectives' : 'أهدافنا'}
          </h1>
          <ul className="list-none text-base sm:text-lg md:text-[24px] leading-relaxed mt-6 space-y-3 text-center lg:text-left font-droid-arabic-kufi">
            <li>{language === 'en' ? 'Enhancing humanitarian and solidarity work and providing relief' : 'تعزيز العمل الإنساني و التضامني و تقديم الإغاثة'}</li>
            <li>{language === 'en' ? 'Contributing to social, health, educational, and cultural development' : 'المساهمة في تحقيق تنمية و رعاية إجتماعية، صحية، تعليمية و حضارية'}</li>
            <li>{language === 'en' ? 'Working towards sustainable development' : 'العمل و المساهمة في تحقيق تنمية مستدامة'}</li>
            <li>{language === 'en' ? 'Preserving social, Islamic, and national values' : 'المحافظة على القيم الإجتماعية و الإسلامية و الوطنية'}</li>
          </ul>
        </div>
      </div>
  
      {/* Activities Section */}
      <div className="text-center mt-10 lg:mt-20">
        <h1 className="text-3xl sm:text-4xl font-bold font-droid-arabic-kufi text-[#E03A6F] my-5">
          {language === 'en' ? 'Our Field' : 'مجالات الأنشطة'}
        </h1>
      </div>
      <div className="cards bg-gradient-to-r p-6 gap-6 flex flex-wrap justify-center">
        {types.map((type) => (
          <Link
            to={`/activities/showByActivitiesType/${type.id}`}
            className="relative group w-full sm:w-1/2 lg:w-1/4 p-4"
            key={type.id}
          >
            <img
              src={`${apiUrl}/${type.image_url}`}
              className="card__image w-full h-auto transition-transform duration-500 ease-in-out transform group-hover:scale-105"
              alt=""
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
              <h2 className="text-lg sm:text-xl font-bold font-droid-arabic-kufi text-white">
                {language === 'en' ? type.name_en : type.name_ar}
              </h2>
            </div>
          </Link>
        ))}
      </div>
  
      <Footer types={types} />
    </>
  );
  
};

export default About;



  // {types.map((type) => (
  //   <Link
  //     to={`/activities/showByActivitiesType/${type.id}`}
  //     className=" relative group"
  //     key={type.id}
  //   >
  //     <img
  //       src={'http://127.0.0.1:8000/' + type.image_url}
  //       className="card__image w-full h-auto transition-transform duration-500 ease-in-out transform group-hover:scale-105"
  //       alt=""
  //     />
  //     <div className="absolute m-0 w-full inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50 opacity-0 transition-opacity duration-500 ease-in-out group-hover:opacity-100">
  //     <h2 className="text-3xl font-bold font-droid-arabic-kufi text-center text-white ">{type.name}</h2>

  //     </div>
  //       {/* <h3 className="font-droid-arabic-kufi text-[#E03A6F] text-2xl text-center mt-5">تعرف على الأنشطة</h3> */}
  //   </Link>
  // ))}
