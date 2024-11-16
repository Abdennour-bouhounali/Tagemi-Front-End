import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../../../Context/LanguageContext';
import { FaFacebook, FaYoutube, FaPhoneAlt, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';

const Footer = ({ types }) => {
    const { language } = useLanguage();
    const [isDropdownOpen, setDropdownOpen] = useState(false);

    const toggleDropdown = () => {
        setDropdownOpen(prev => !prev);
    };

    return (
        <footer className="bg-gray-900 text-white py-8">
            <div className="max-w-screen-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="block">
                    {/* Left section */}
                    <div className="mb-8 text-center">
                        <h2 className="text-2xl font-bold font-droid-arabic-kufi">
                            {language === 'en' ? 'Tagemi Foundation For Human Development' : 'مؤسسة تجمي للتنمية الإنسانية '}
                        </h2>
                        <p className="mt-2 text-gray-400 font-droid-arabic-kufi">
                            {language === 'en' ? 'Working Together For Eternal Life' : 'لنعمل سويا من أجل حياة أبدية '}
                        </p>
                    </div>

                    {/* Middle section */}
                    <div className="lg:flex lg:space-x-16">
                        {/* <div className="mb-8 lg:mb-0 lg:basis-2/5 text-center">

                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3365.8941480175445!2d3.744051975146243!3d32.47552289933361!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x126682a97ad9395b%3A0xbea8842c509b9432!2zQXNzb2NpYXRpb24gVGFnZW1pINis2YXYudmK2Kkg2KrYrNmF2Yo!5e0!3m2!1sen!2sfr!4v1724165259058!5m2!1sen!2sfr"
                                width="600"
                                height="400"
                                style={{ border: 0 }}
                                allowFullScreen=""
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                title="Google Map"
                                className='rounded'
                            ></iframe>
                        </div> */}

                        <div className="lg:basis-2/3 flex">
                            <ul className={`space-y-4 basis-1/2 px-8 ${language === 'en' ? 'text-left' : 'text-right'} `}>



                                {types.map((type) => (
                                                <li key={type.id} className='mt-2'>
                                                    <Link to={`/activities/showByActivitiesType/${type.id}`} className="text-white hover:underline  font-droid-arabic-kufi">
                                                        {language === 'en' ? type.name_en : type.name_ar}
                                                    </Link>
                                                </li>
                                            ))}
                                            </ul>
                                            <ul className={`space-y-4 basis-1/2 px-8 ${language === 'en' ? 'text-left' : 'text-right'}`}>
                                            <li>
                                    <Link to="/" className="text-white hover:underline font-droid-arabic-kufi">
                                        {language === 'en' ? 'Home' : 'الصفحة الرئيسية'}
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/futureProjects" className="text-white hover:underline font-droid-arabic-kufi">
                                        {language === 'en' ? 'Future Projects' : 'مشاريع مستقبلية'}
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/volunteer" className="text-white hover:underline font-droid-arabic-kufi">
                                        {language === 'en' ? 'Volunteer With Us' : 'تطوع معنا'}
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/about" className="text-white hover:underline font-droid-arabic-kufi">
                                        {language === 'en' ? 'About' : 'من نحن'}
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/contact" className="text-white hover:underline font-droid-arabic-kufi">
                                        {language === 'en' ? 'Contact Us' : 'تواصل معنا'}
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        <div className="lg:basis-1/3 space-y-4 text-center ">
                            <div className="flex justify-center  space-x-4">
                                <a href="https://www.facebook.com/p/%D8%AC%D9%85%D8%B9%D9%8A%D8%A9-%D8%AA%D8%AC%D9%85%D9%91%D9%8A-Association-TAGEMI-100070312232969/" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                                    <FaFacebook className="text-white text-2xl mx-5 hover:text-blue-600" />
                                </a>
                                <a href="https://youtube.com/@tagemifondation?si=GW33IrHgq3_rE_Ws" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                                    <FaYoutube className="text-white text-2xl hover:text-red-600" />
                                </a>
                            </div>
                    
                            <div className="flex items-center justify-center  space-x-2">
                                <FaPhoneAlt className="text-white mx-2" />
                                <span className="font-droid-arabic-kufi">+213550645465</span>
                            </div>
                            <div className="flex items-center justify-center  space-x-2">
                                <FaEnvelope className="text-white mx-2" />
                                <span className="font-droid-arabic-kufi">tagem.ass@gmail.com</span>
                            </div>
                            <div className="flex items-center justify-center space-x-2 mx-auto mb-5">
                                <FaMapMarkerAlt className="text-white mx-2" />
                                <span className="font-droid-arabic-kufi">{language === 'en' ? 'El Atteuf, Ghardaia, Algeria' : 'الجزائر,ساحة السوق بلدبة العطف، ولاية غرداية'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="text-center text-gray-400 mt-8">
    <p>&copy; {new Date().getFullYear()} All rights reserved</p>
</div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
