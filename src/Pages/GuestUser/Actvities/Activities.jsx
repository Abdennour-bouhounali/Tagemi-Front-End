import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import VideoBanner from "../HomePage/Components/VideoBanner";
import AboutActvity from "./Components/AboutActvity";
import Footer from "../HomePage/Components/Footer";
import { useLanguage } from "../../../Context/LanguageContext";
const apiUrl = import.meta.env.VITE_API_URL;
export default function Activities() {
    const { TypeId } = useParams();
    const [type, setType] = useState({ image_url: '/tagemi_consept.png', description_en: '', description_ar: '' });
    const [activities, setActivities] = useState([]);
    const [types, setTypes] = useState([]);
    const { language } = useLanguage();

    async function getTypes() {
        const res = await fetch(`${apiUrl}/api/types`);
        const data = await res.json();
        setTypes(data);
    }

    useEffect(() => {
        getTypes();
    }, []);

    async function getType() {
        try {
            const res = await fetch(`${apiUrl}/api/types/${TypeId}`);
            if (res.ok) {
                const data = await res.json();
                setType(data);
                console.log('Type data:', data);
            } else {
                console.error('Failed to fetch type data');
            }
        } catch (error) {
            console.error('Error fetching type:', error);
        }
    }

    async function getAllActivities() {
        try {
            const res = await fetch(`${apiUrl}/api/activities/showByActivitiesType/${TypeId}`);
            if (res.ok) {
                const data = await res.json();
                setActivities(data);
                console.log('Activities data:', data);
            } else {
                console.error('Failed to fetch activities data');
            }
        } catch (error) {
            console.error('Error fetching activities:', error);
        }
    }

    useEffect(() => {
        getType();
        getAllActivities();
    }, [TypeId]);

    const truncateHtml = (html, maxLength) => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        let textContent = tempDiv.textContent || tempDiv.innerText || '';
        if (textContent.length > maxLength) {
            textContent = textContent.substring(0, maxLength) + '...';
        }
        tempDiv.innerHTML = textContent;
        return tempDiv.innerHTML;
    };

    return (
        <>
            <img src={`${apiUrl}/${type.image_url}`} className="w-full h-auto" alt="" />
            <AboutActvity TypeDescription={language === 'en' ? type.description_en : type.description_ar} ImageUrl={`${apiUrl}/${type.image_url}`} />
            <section className="py-12 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-extrabold text-[#101E58] font-droid-arabic-kufi">
                            {language === 'en' ? 'Field Activities' : 'أنشطة المجال'}
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {activities.map((activity) => (
                            <div key={activity.id} className="bg-white rounded-lg shadow-lg overflow-hidden min-h-[560px]">
                                {activity.media && activity.media.length > 0 && (
                                    <>
                                        {activity.media[0].type === 'image' && (
                                            <img
                                                src={`${apiUrl}/${activity.media[0].url}`}
                                                alt={language === 'en' ? activity.title_en : activity.title_ar}
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
                                        {language === 'en' ? activity.title_en : activity.title_ar}
                                    </h3>
                                    <div
                                        className="my-4 pb-4 h-7 text-gray-600"
                                        dangerouslySetInnerHTML={{ __html: truncateHtml(language === 'en' ? activity.description_en : activity.description_ar, 100) }}
                                    />
                                    <Link to={`/actvities/${activity.id}`} className="QC_primary-btn m-auto mt-4">
                                        {language === 'en' ? 'Read More' : 'إقرأ المزيد'}
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
            <Footer types={types} />
        </>
    );
}
