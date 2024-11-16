import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Footer from '../HomePage/Components/Footer';
import { useLanguage } from '../../../Context/LanguageContext';
const apiUrl = import.meta.env.VITE_API_URL;
const ActivityDetails = () => {
    const { Actvityid } = useParams();
    const [activity, setActivity] = useState({});
    const [types, setTypes] = useState([]);
    const { language } = useLanguage();

    async function getTypes() {
        const res = await fetch(`${apiUrl}/api/types`);
        const data = await res.json();
        setTypes(data);

    }

    useEffect(() => {
        getTypes()
    }, []);

    async function getActivity() {
        const res = await fetch(`${apiUrl}/api/activities/${Actvityid}`);
        const data = await res.json();
        setActivity(data);
    }

    useEffect(() => {
        getActivity();
    }, [Actvityid]);

    return (
        <>
            <div className="min-h-[500px] px-10 flex flex-col lg:flex-row bg-[#EEF7FF] items-center justify-center text-center lg:text-left">
                <div className="lg:w-1/2 mt-4 lg:mt-0 lg:ml-12 p-4 rounded-lg text-right">
                    <h2 className="font-droid-arabic-kufi text-2xl sm:text-3xl md:text-4xl font-bold text-[#101E58] text-center mb-5">
                        {language === 'en' ? activity.title_en : activity.title_ar}
                    </h2>
                    <p className="text-gray-700 leading-relaxed my-4 font-droid-arabic-kufi text-base sm:text-lg md:text-xl">
                        <div
                            className="my-4 pb-4"
                            dangerouslySetInnerHTML={{
                                __html: language === 'en' ? activity.description_en : activity.description_ar,
                            }}
                        />
                    </p>
                </div>

                <div className="lg:w-1/2 py-14 flex justify-center lg:justify-start sm:w-full">
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
                                    src={`${apiUrl}/${activity.media[0].url}`}
                                    className="w-full h-48 object-cover"
                                ></video>
                            )}
                        </>
                    )}
                </div>
            </div>

            {activity.media && activity.media.length > 1 && (
                <div className="min-h-[500px] px-10 flex flex-col lg:flex-row bg-gray-100 items-center justify-center text-center lg:text-left">
                    <div className="py-14 flex flex-wrap justify-center lg:justify-start">
                        {activity.media.slice(1).map((mediaItem, index) => (
                            <div key={index} className="p-4">
                                {mediaItem.type === 'image' && (
                                    <img
                                        src={`${apiUrl}/${mediaItem.url}`}
                                        alt={`${activity.title} ${index}`}
                                        className="w-full h-64 object-cover"
                                    />
                                )}
                                {mediaItem.type === 'video' && (
                                    <video
                                        controls
                                        src={`${apiUrl}/${mediaItem.url}`}
                                        className="w-full h-48 object-cover"
                                    ></video>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            <Footer types={types} />
        </>
    );
};

export default ActivityDetails;