import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../../../Context/AppContext';
import { useLanguage } from '../../../../Context/LanguageContext';
const env = import.meta.env;
export const apiUrl = env.VITE_API_URL;
const AllActivities = ({TypeId}) => {
    const { token } = useContext(AppContext);
    const [activities, setActivities] = useState([]);
const {language}=useLanguage();
    async function getAllActivities() {
        const res = await fetch(`api/activities/showByActivitiesType/${TypeId}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        const data = await res.json();
        setActivities(data);
        console.log("activities  : ");
        console.log(activities);
    }

    useEffect(() => {
        getAllActivities();
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
    return (
        <section className="py-12 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-extrabold text-[#101E58] font-droid-arabic-kufi">
                    {language === 'en' ? 'Actvities' :  'أنشطة المجال  '}

                    </h2>
                   
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {activities}
                    {activities.map((activity, index) => (
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
                                <h3 className="text-center font-bold text-gray-900">{activity.title}</h3>
                                {/* <p className="my-4 pb-4 h-7 text-gray-600">{activity.description}</p> */}
                                <div
                                    className="my-4 pb-4 h-7 text-gray-600"
                                    dangerouslySetInnerHTML={{ __html:truncateHtml(activity.description, 100)}}
                                />
                                <a href="#" className="QC_primary-btn m-auto mt-4">
                                    Read More
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default AllActivities;
