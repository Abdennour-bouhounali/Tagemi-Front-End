import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../../../Context/LanguageContext';
import { FaFacebook, FaYoutube, FaPhoneAlt, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';

const Footer = ({ types }) => {
    const { language } = useLanguage();
    const [isDropdownOpen, setDropdownOpen] = useState(false);

    const toggleDropdown = () => {
        setDropdownOpen((prev) => !prev);
    };

    return (
        <footer className="bg-gray-900 text-white py-8">
            <div className="max-w-screen-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col space-y-8 lg:space-y-0 lg:flex-row lg:justify-between">
                    {/* Left Section */}
                    <div className="text-center lg:text-left">
                        <h2 className="text-2xl font-bold font-droid-arabic-kufi">
                            {language === 'en'
                                ? 'Tagemi Foundation For Human Development'
                                : 'مؤسسة تجمي للتنمية الإنسانية'}
                        </h2>
                        <p className="mt-2 text-gray-400 font-droid-arabic-kufi">
                            {language === 'en'
                                ? 'Working Together For Eternal Life'
                                : 'لنعمل سويا من أجل حياة أبدية'}
                        </p>
                    </div>

                    {/* Middle Section */}
                    <div className="flex flex-col lg:flex-row lg:space-x-16">
                        {/* Activity Links */}
                        <ul
                            className={`space-y-4 mb-8 lg:mb-0 lg:space-y-0 lg:space-x-6 lg:flex ${
                                language === 'en' ? 'text-left' : 'text-right'
                            }`}
                        >
                            {types.map((type) => (
                                <li key={type.id}>
                                    <Link
                                        to={`/activities/showByActivitiesType/${type.id}`}
                                        className="text-white hover:underline font-droid-arabic-kufi"
                                    >
                                        {language === 'en' ? type.name_en : type.name_ar}
                                    </Link>
                                </li>
                            ))}
                        </ul>

                        {/* General Links */}
                        <ul
                            className={`space-y-4 lg:space-y-0 lg:space-x-6 lg:flex ${
                                language === 'en' ? 'text-left' : 'text-right'
                            }`}
                        >
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

                    {/* Right Section */}
                    <div className="flex flex-col items-center lg:items-end space-y-4">
                        {/* Social Links */}
                        <div className="flex space-x-4">
                            <a
                                href="https://www.facebook.com/p/%D8%AC%D9%85%D8%B9%D9%8A%D8%A9-%D8%AA%D8%AC%D9%85%D9%91%D9%8A-Association-TAGEMI-100070312232969/"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Facebook"
                            >
                                <FaFacebook className="text-2xl hover:text-blue-600" />
                            </a>
                            <a
                                href="https://youtube.com/@tagemifondation?si=GW33IrHgq3_rE_Ws"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="YouTube"
                            >
                                <FaYoutube className="text-2xl hover:text-red-600" />
                            </a>
                        </div>

                        {/* Contact Information */}
                        <div className="flex items-center space-x-2">
                            <FaPhoneAlt />
                            <span className="font-droid-arabic-kufi">+213550645465</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <FaEnvelope />
                            <span className="font-droid-arabic-kufi">tagem.ass@gmail.com</span>
                        </div>
                        <div className="flex items-center space-x-2 text-center">
                            <FaMapMarkerAlt />
                            <span className="font-droid-arabic-kufi">
                                {language === 'en'
                                    ? 'El Atteuf, Ghardaia, Algeria'
                                    : 'الجزائر, ساحة السوق بلدبة العطف، ولاية غرداية'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Footer Bottom */}
                <div className="text-center text-gray-400 mt-8">
                    <p>&copy; {new Date().getFullYear()} All rights reserved</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
