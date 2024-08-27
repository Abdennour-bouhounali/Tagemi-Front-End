import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import VideoBanner from "../HomePage/Components/VideoBanner";
import AboutActvity from "../Actvities/Components/AboutActvity";
import Footer from "../HomePage/Components/Footer";
import { useLanguage } from "../../../Context/LanguageContext";
const env = import.meta.env;
export const apiUrl = env.VITE_API_URL;
export default function FuturProjects() {
    // const { TypeId } = useParams();
    // const [type, setType] = useState({ image_url: '/tagemi_consept.jpg', description: '' });

    const [projects, setProjects] = useState([]);
    const [types, setTypes] = useState([]);
const {language} = useLanguage();
    async function getTypes() {
        const res = await fetch('/api/types');
        const data = await res.json();
        setTypes(data);

    }
    async function getProjects() {
        const res = await fetch('/api/projects');
        const data = await res.json();
        console.log(data);

        setProjects(data);

    }
    useEffect(() => {
        getProjects();
        getTypes();

    }, []);


    // async function getType() {
    //     try {
    //         const res = await fetch(`/api/types/${TypeId}`);
    //         if (res.ok) {
    //             const data = await res.json();
    //             setType(data);
    //             console.log('Type data:', data);
    //         } else {
    //             console.error('Failed to fetch type data');
    //         }
    //     } catch (error) {
    //         console.error('Error fetching type:', error);
    //     }
    // }

    // async function getAllActivities() {
    //     try {
    //         const res = await fetch(`/api/activities/showByActivitiesType/${TypeId}`);
    //         if (res.ok) {
    //             const data = await res.json();
    //             setActivities(data);
    //             console.log('Activities data:', data);
    //         } else {
    //             console.error('Failed to fetch activities data');
    //         }
    //     } catch (error) {
    //         console.error('Error fetching activities:', error);
    //     }
    // }

    // useEffect(() => {
    //     getType();
    //     getAllActivities();
    // }, [TypeId]);

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
            <VideoBanner bannerImage='/tagemi_consept.jpg' bannerText={''} />
            {/* <AboutActvity TypeDescription={type.description} ImageUrl={`http://127.0.0.1:8000/${project.image1}`} /> */}
            <section className="py-12 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-extrabold text-[#101E58] font-droid-arabic-kufi">
                        {language === 'en' ? 'Futur Projects': 'مشاريعنا المستقبلية ' }
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {( projects  && projects.length > 0 ) ?  projects.map((project) => (
                            <div key={project.id} className="bg-white rounded-lg shadow-lg overflow-hidden min-h-[560px]">
                                {project.project_images[0] && (
                                    <img
                                        src={`${apiUrl}/${project.project_images[0].imageUrl}`}
                                        alt={project.title}
                                        className="w-full h-78 object-cover pb-8"
                                    />
                                )}
                                <div className="p-6 block">
                                    <h3 className="text-center font-bold text-gray-900">{language === 'en' ? project.title_en : project.title_ar}</h3>
                                    {/* <p className="my-4 pb-4 h-7 text-gray-600">{activity.description}</p> */}
                                    <div
                                        className="my-4 pb-4 h-7 text-gray-600"
                                        dangerouslySetInnerHTML={{ __html: truncateHtml(language === 'en' ? project.description_en :project.description_ar , 100) }}
                                    />
                                    
                                    <Link to={`/future-prjects/${project.id}`} className="QC_primary-btn m-auto mt-4"> 
                                    
                                    {language === 'en' ? 'Read More' : 'إقرأ المزيد'}
                                    </Link>
                                </div>
                            </div>
                        )):(
                        <h1 className="text-2xl font-extrabold text-[#101E58] font-droid-arabic-kufi text-center mx-auto">
                        {language == 'en' ? 'No Projects For Now' : 'لا توجد مشاريع حاليا'}
                        
                        </h1>
                        )}
                    </div>
                </div>
            </section>
            <Footer types={types} />
        </>
    )

}