import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Footer from '../HomePage/Components/Footer';
import Contact from '../Contact';
import { useLanguage } from '../../../Context/LanguageContext';
const env = import.meta.env;
export const apiUrl = env.VITE_API_URL;
const ProjectDetails = () => {
    const { Projectid } = useParams();
    const [project, setProject] = useState({});
    const [types, setTypes] = useState([]);
    const {language} = useLanguage();

    async function getTypes() {
        const res = await fetch(`${apiUrl}/api/types`);
        const data = await res.json();
        setTypes(data);

    }

    useEffect(() => {
        getTypes()
    }, []);

    async function getProject() {
        const res = await fetch(`${apiUrl}/api/projects/${Projectid}`);
        const data = await res.json();
        console.log(data);
        setProject(data);
    }

    useEffect(() => {
        getProject();
    }, [Projectid]);

    return (
        <>
            <div className="min-h-[500px] px-10 flex flex-col lg:flex-row bg-[#EEF7FF] items-center justify-center text-center lg:text-left">
                <div className="lg:w-1/2 mt-4 lg:mt-0 lg:ml-12 p-4 rounded-lg text-right">
                    <h2 className="font-droid-arabic-kufi text-2xl font-bold text-[#101E58] text-center mb-5">
                    {language === 'en' ? project.title_en : project.title_ar}
                    </h2>
                    <p className="text-gray-700 leading-relaxed my-4 font-droid-arabic-kufi">
                        <div
                            className="my-4 pb-4"
                            dangerouslySetInnerHTML={{
                                __html: language === 'en' ? project.description_en :project.description_ar,
                            }}
                        />
                    </p>
                </div>

                <div className="lg:w-1/2 py-14 flex justify-center lg:justify-start sm:w-full">
                    {project.project_images &&  project.project_images.length >0 &&(
                                            <img
                                            src={`${apiUrl}/${project.project_images[0].imageUrl}`}
                                            alt={project.title}
                                            className="w-full h-78 object-cover pb-8"
                                        />
                    )}
                {/* {project && project.project_images[0] && (
                    <img
                        src={`http://127.0.0.1:8000/${project.project_images[0].imageUrl}`}
                        alt={project.title}
                        className="w-full h-78 object-cover pb-8"
                    />
                )} */}
                </div>
            </div>

            {project.project_images && project.project_images.length > 1 && (
            <div className="min-h-[500px] px-10 flex flex-col lg:flex-row bg-gray-100 items-center justify-center text-center lg:text-left">
                <div className="py-14 flex flex-wrap justify-center lg:justify-start">
                    {project.project_images && project.project_images.length > 1 && (
                        project.project_images.slice(1).map((mediaItem, index) => (
                            <div key={index} className="p-4">
                                    <img
                                        src={`${apiUrl}/${mediaItem.imageUrl}`}
                                        alt={`${project.title_ar} ${index}`}
                                        className="w-full h-64 object-cover"
                                    />
                               
                            </div>
                        ))
                    )}
                </div>
            </div>)}
            <Contact project={true} projectName={project.title_ar}/>
           
        </>
    );
};

export default ProjectDetails;
