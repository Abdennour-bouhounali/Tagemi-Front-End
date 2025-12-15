
import { useContext, useEffect, useState } from 'react';
import { API_BASE_URL } from '../../../../config/environment';
import { AppContext } from '../../../../Context/AppContext';
import { useLanguage } from '../../../../Context/LanguageContext';
import { useTranslation } from 'react-i18next';
const apiUrl = API_BASE_URL;


const Sponsors = () => {
    const { token } = useContext(AppContext);
    const { language } = useLanguage();
    const { t } = useTranslation();
    const [sponsors, setSponsors] = useState([]);

    async function getSponsors() {
        const res = await fetch(`${apiUrl}api/sponsors`);
        const data = await res.json();
        setSponsors(data);
        // console.log(data);
    }

    useEffect(() => {
        getSponsors();
    }, []);

    return (
        <section className="py-12 bg-[#EEF7FF]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-extrabold text-[#101E58] font-droid-arabic-kufi">
                        {t('home.sponsors')}
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
