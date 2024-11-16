import React, { useContext, useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faCalendarAlt, faPeopleArrows } from '@fortawesome/free-solid-svg-icons';
import { AppContext } from '../../../../Context/AppContext';
import { useLanguage } from '../../../../Context/LanguageContext';
import { Link } from "react-router-dom";
const apiUrl = import.meta.env.VITE_API_URL; 
const Statistics = () => {
    const { token } = useContext(AppContext);
    const { language } = useLanguage();
    const [stats, setStats] = useState([
        { label: language === 'en' ? 'Number of Volunteers' : 'عدد المتطوعين', value: 'Loading...', icon: faUsers },
        { label: language === 'en' ? 'Events Organized' : 'البرامج المنظمة', value: 'Loading...', icon: faCalendarAlt },
        { label: language === 'en' ? 'People Benefited' : 'عدد المستفيجين', value: 'Loading...', icon: faPeopleArrows }
    ]);
 
    const [moreStatisticsLink,setMoreStatisticsLink] = useState('');

    async function getStaticContent() {
        try {
            const res = await fetch(`${apiUrl}/api/static-contents`);
            if (!res.ok) {
                throw new Error(`Error fetching static content: ${res.statusText}`);
            }
            const data = await res.json();
            // console.log(data);

            // Assuming the first item in the response is the statistics data
            if (data.length > 0) {
                const statisticsData = JSON.parse(data[0].value);
                setMoreStatisticsLink(data[2].value)
                setStats([
                    { label: language === 'en' ? 'Number of Volunteers' : 'عدد المتطوعين', value: `${statisticsData['number_of_volunteers']}+`, icon: faUsers },
                    { label: language === 'en' ? 'Events Organized' : 'البرامج المنظمة', value: `${statisticsData['events_organized']}+`, icon: faCalendarAlt },
                    { label: language === 'en' ? 'People Benefited' : 'عدد المستفيجين', value: `${statisticsData['people_benefited']}+`, icon: faPeopleArrows }
                ]);
            }
        } catch (error) {
            console.error(error);
        }
    }

    useEffect(() => {
        getStaticContent();
    }, [token, language]); // Add language to dependency array if language change affects the content

    async function downloadStatistic(){

    }
    return (
        <section className="py-12 bg-gray-100 text-center">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-extrabold text-[#101E58] font-droid-arabic-kufi">
                        {language === 'en' ? 'Statistics' : 'إحصائيات'}
                    </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {stats.map((stat, index) => (
                        <div key={index} className="bg-white p-6 rounded-lg shadow-md text-center space-x-4 block">
                            <FontAwesomeIcon icon={stat.icon} className="text-[98px] text-[#101E58] my-4" />
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 my-4">{stat.value}</h3>
                                <p className="mt-2 text-gray-600 my-4">{stat.label}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <a 
    href={moreStatisticsLink}
    target='_blank'
    rel='noopener noreferrer'
    className='bg-[#9c004c] hover:bg-[#c8102e] text-white rounded py-3 px-4 my-15'
>
    {language === 'en' ? 'More Statistics' : 'المزيد من الإحصائيات'}
</a>

        </section>
    );
};

export default Statistics;
