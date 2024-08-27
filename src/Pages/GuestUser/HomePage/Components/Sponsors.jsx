
import React, { useContext, useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faCalendarAlt, faPeopleArrows } from '@fortawesome/free-solid-svg-icons';
import { AppContext } from '../../../../Context/AppContext';
import { useLanguage } from '../../../../Context/LanguageContext';
const env = import.meta.env;
export const apiUrl = env.VITE_API_URL;

const Sponsors = () => {
    const { token } = useContext(AppContext);
    const {language} = useLanguage();
    const [sponsors, setSponsors] = useState([]);

    async function getSponsors() {
        const res = await fetch('api/sponsors', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        const data = await res.json();
        setSponsors(data);
        console.log(data);
    }

    useEffect(() => {
        getSponsors();
    }, []);

    return (
        <section className="py-12 bg-[#EEF7FF]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-extrabold text-[#101E58] font-droid-arabic-kufi">
                    {language === 'en' ? 'Sponsors':'الداعمون'}
                    </h2>
                   
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {sponsors.map((sponsor, index) => (
                        <div key={index} className="p-6 text-center space-x-4 block m-auto">
                            <img
                                            src={`${apiUrl}/${sponsor.logo_url}`}
                                            alt={sponsor.name}
                                            className="h-68 pb-8"
                                        />
                            {/* <div>
                                <a href="website">{sponsor.name}</a>
                            </div> */}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Sponsors;
