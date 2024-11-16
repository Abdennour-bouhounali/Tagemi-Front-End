import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../../../Context/AppContext';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../../../Context/LanguageContext';
const apiUrl = import.meta.env.VITE_API_URL; 

const FeaturedActivities = () => {
    const { token } = useContext(AppContext);
    const [activities, setActivities] = useState([]);
    const { language } = useLanguage();


    async function getActivities() {
        const res = await fetch(`${apiUrl}/api/activities`);
        const data = await res.json();
        setActivities(data);
        // console.log(data);
    }

    useEffect(() => {
        getActivities();
    }, []);

    const truncateHtml = (html, maxLength) => {
        // Create a temporary element to parse the HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;

        // Get text content and truncate
        let textContent = tempDiv.textContent || tempDiv.innerText || '';
        if (textContent.length > maxLength) {
            textContent = textContent.substring(0, maxLength) + '...';
        }

        // Set truncated text back to the element
        tempDiv.innerHTML = textContent;
        return tempDiv.innerHTML;
    };

    return (<>
        {activities.filter(activity => activity.featured == true).length > 0 && (
               <section className="py-12 bg-white">
               <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                   <div className="text-center mb-12">
                       <h2 className="text-3xl font-extrabold text-[#101E58] font-droid-arabic-kufi">
                       {language === 'en' ? 'Speacial Works' : 'أعمال مميزة'}
   
                       </h2>
                      
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                       {activities
                       .filter(activity => activity.featured == true)
                       .map((activity, index) => (
                           <div key={index} className="bg-white rounded-lg shadow-lg overflow-hidden min-h-[560px]">
                               {activity.media && activity.media.length > 0 && (
                                   <>
                                       {activity.media[0].type === 'image' && (
                                           <img
                                               src={`${apiUrl}/${activity.media[0].url}`}
                                               alt={activity.title}
                                               className="w-full h-78 object-cover pb-8"
                                           />
                                       )}
                                       {activity.media[0].type === 'video' && (
                                           <video
                                               controls
                                               src={activity.media[0].url}
                                               className="w-full h-48 object-cover"
                                           ></video>
                                       )}
                                   </>
                               )}
                               <div className="p-6 block">
                                   <h3 className="text-center font-bold text-gray-900">
                                       {language === 'en' ?activity.title_en : activity.title_ar}
                                       
                                       </h3>
                                   {/* <p className="my-4 pb-4 h-7 text-gray-600">{activity.description}</p> */}
                                   {/* <div
                                       className="my-4 pb-4 h-7 text-gray-600"
                                       dangerouslySetInnerHTML={{ __html:truncateHtml(language === 'en' ? activity.description_en : activity.description_ar, 100)}}
                                   /> */}
                                   <Link to={`actvities/${activity.id}`} className="QC_primary-btn m-auto mt-4"> 
                                   {language === 'en' ? 'Read More': 'إقرأ المزيد'}
                                   </Link>
   
                               </div>
                           </div>
                       ))}
                   </div>
               </div>
           </section>
        )}
     
        </>);
};

export default FeaturedActivities;
