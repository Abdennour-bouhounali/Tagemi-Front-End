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
      <div className="min-h-screen px-10 block bg-gradient-to-b from-white to-[#DAE0F5] items-center text-center lg:text-left mt-24">
        <h1 className="text-4xl font-bold mb-4 text-center font-droid-arabic-kufi text-[#E03A6F]">
          {language === 'en' ? 'About Us' : 'من نحن'}
        </h1>
        <p className="leading-[3] text-[24px] mb-6 text-center font-droid-arabic-kufi w-2/3 mx-auto mt-20">
          {language === 'en' 
            ? 'TAGEMI Foundation is a humanitarian charity dedicated to contributing to human development in its social, economic, educational, and scientific aspects, aiming for a prosperous and leading Algeria. Established on 15/07/2018, it is an extension of the Tajmi Association, founded on May 29, 2006, which is a humanitarian and social association located in Saha Souk, Aïn Témouchent, Ghardaia.' 
            : 'مؤسسة تــجــمــي ، خيرية إنسانية غايتنا المساهمة في تحقيق تنمية انسانية بجوانبها الإجتماعية، الإقتصادية، التربوية و العلمية لجزائر مزدهرة و رائدة تأسست بتاريخ 15/07/2018 و هي امتداد لنشاط جمعية تجمي التي تأسست بتاريخ : 29 ماي 2006 و هي جمعية ذات طابع إنساني اجتماعي، الكائن مقرها بساحة السوق، بلدية العطف ولاية غرداية.'
          }
        </p>
      </div>

      <div className="lg:flex lg:flex-row mt-20 p-10">
        <div className="lg:basis-1/2 block">
          <h1 className="text-4xl font-bold mb-4 text-center font-droid-arabic-kufi text-[#E03A6F] mt-20">
            {language === 'en' ? 'Our Goals' : 'غايتنا'}
          </h1>
          <p className="text-lg leading-relaxed mb-6 text-center font-droid-arabic-kufi">
            <ul className="list-none ml-5 mt-9">
              <li className="mt-4 text-[24px]">{language === 'en' ? 'Promoting humane behavior in line with nature' : 'ترقية السلوك الإنساني بما يتماشى و الفطرة'}</li>
              <li className="mt-4 text-[24px]">{language === 'en' ? 'Maintaining public health for families and the community' : 'المحافظة على الصحة العامة للأسرة و المجتمع'}</li>
              <li className="mt-4 text-[24px]">{language === 'en' ? 'Promoting science as a cultural and human value' : 'ترقية العلم كقيمة حضارية و إنسانية'}</li>
            </ul>
          </p>
        </div>
        <div className="lg:basis-1/2 block">
          <img src="/child.jpg" alt="" />
        </div>
      </div>

      <div className="lg:flex lg:flex-row mt-20 p-10">
        <div className="lg:basis-1/2 block">
          <img src="/medical.JPG" alt="" />
        </div>
        <div className="lg:basis-1/2 block">
          <h1 className="text-4xl font-bold text-center font-droid-arabic-kufi text-[#E03A6F] my-5">
            {language === 'en' ? 'Our Objectives' : 'أهدافنا'}
          </h1>
          <p className="text-lg leading-relaxed mb-6 text-center font-droid-arabic-kufi">
            <ul className="list-none ml-5 text-center px-7">
              <li className="mt-3">{language === 'en' ? 'Enhancing humanitarian and solidarity work and providing relief' : 'تعزيز العمل الإنساني و التضامني و تقديم الإغاثة'}</li>
              <li className="mt-3">{language === 'en' ? 'Contributing to social, health, educational, and cultural development' : 'المساهمة في تحقيق تنمية و رعاية إجتماعية، صحية، تعليمية و حضارية'}</li>
              <li className="mt-3">{language === 'en' ? 'Working towards sustainable development' : 'العمل و المساهمة في تحقيق تنمية مستدامة'}</li>
              <li className="mt-3">{language === 'en' ? 'Preserving social, Islamic, and national values' : 'المحافظة على القيم الإجتماعية و الإسلامية و الوطنية'}</li>
              <li className="mt-3">{language === 'en' ? 'Achieving family development while maintaining value systems' : 'تحقيق تنمية أسرية بما يحافظ على منظومة القيم'}</li>
              <li className="mt-3">{language === 'en' ? 'Establishing charitable projects to ensure social solidarity' : 'إقامة المشاريع الخيرية بما يحقق تكافل إجتماعي'}</li>
              <li className="mt-3">{language === 'en' ? 'Preserving cultural heritage and material and immaterial heritage' : 'المحافظة على الموروث الثقافي و التراث المادي و اللآمادي'}</li>
              <li className="mt-3">{language === 'en' ? 'Coordinating efforts with local, national, and international institutions working in this field' : 'تنسيق العمل و الجهود مع المؤسسات المحلية، الوطنية و الدولية العاملة في هذا الإطار'}</li>
            </ul>
          </p>
        </div>
      </div>
<div className="w-full text-center ">
<h1 className="text-4xl font-bold text-center font-droid-arabic-kufi text-[#E03A6F] my-5">
          {language === 'en' ? 'Our Field' : 'مجالات الأنشطة'}
        </h1>
</div>
      <div className="cards bg-gradient-to-r p-10 gap-6 flex-wrap min-h-[500px] items-center justify-center">

        {types.map((type) => (
          <Link
            to={`/activities/showByActivitiesType/${type.id}`}
            className="relative group"
            key={type.id}
          >
            <img
              src={`${apiUrl}/${type.image_url}`}
              className="card__image w-full h-auto transition-transform duration-500 ease-in-out transform group-hover:scale-105"
              alt=""
            />
            <div className="absolute m-0 w-full inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50 opacity-0 transition-opacity duration-500 ease-in-out group-hover:opacity-100">
              <h2 className="text-3xl font-bold font-droid-arabic-kufi text-center text-white">
                { language ==='en' ? type.name_en : type.name_ar}
              </h2>
            </div>
          </Link>
        ))}
      </div>
      <Footer types={types}/>
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
