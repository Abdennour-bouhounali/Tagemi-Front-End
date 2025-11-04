import React, { useContext, useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { AppContext } from "../Context/AppContext";
import GuestNavBar from "./Headers/GuestNavBar";
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import { useLanguage } from "../Context/LanguageContext";

const apiUrl = import.meta.env.VITE_API_URL;

export default function GuestLayout() {
    const { setUser, token, setToken, user } = useContext(AppContext);
    const navigate = useNavigate();
    const [specialities, setSpecialities] = useState([]);
    const [types, setTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const { language } = useLanguage();
    const { t } = useTranslation();

    async function getTypes() {
        try {
            const headers = new Headers();
            headers.append('Content-Type', 'application/json');
            headers.append('Accept', 'application/json');
            headers.append('Access-Control-Allow-Origin', apiUrl);
            headers.append('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');

            const res = await fetch(`${apiUrl}/api/types`, { headers });
            const data = await res.json();
            setTypes(data);
        } catch (error) {
            console.error('Error fetching types:', error);
        }
    }

    async function getSpecialities() {
        try {
            const headers = new Headers();
            headers.append('Content-Type', 'application/json');
            headers.append('Accept', 'application/json');
            headers.append('Access-Control-Allow-Origin', apiUrl);
            headers.append('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');

            const res = await fetch(`${apiUrl}/api/specialty`, { headers });
            const data = await res.json();
            setSpecialities(data["specialties"] || []);
        } catch (error) {
            console.error('Error fetching specialities:', error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        const fetchData = async () => {
            await Promise.all([getTypes(), getSpecialities()]);
        };
        fetchData();
    }, []);

    useEffect(() => {
        i18n.changeLanguage(language);
    }, [language]);

    return (
        <div className="min-h-screen flex flex-col bg-white">
            {/* Navigation */}
            <GuestNavBar user={user} types={types} />

            {/* Main Content */}
            <main className="flex-1">
                {loading ? (
                    <div className="flex items-center justify-center min-h-[60vh]">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#E03A6F] mx-auto"></div>
                            <p className="mt-4 text-gray-600 font-droid-arabic-kufi">
                                {language === 'en' ? 'Loading...' : 'جاري التحميل...'}
                            </p>
                        </div>
                    </div>
                ) : (
                    <Outlet context={{ specialities, types }} />
                )}
            </main>

            {/* Scroll to Top Button */}
            <ScrollToTopButton />
        </div>
    );
}

// Scroll to Top Button Component
const ScrollToTopButton = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const toggleVisibility = () => {
            if (window.pageYOffset > 300) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', toggleVisibility);
        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    return (
        <>
            {isVisible && (
                <button
                    onClick={scrollToTop}
                    className="fixed bottom-8 right-8 z-50 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    aria-label="Scroll to top"
                >
                    <svg 
                        className="w-6 h-6" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                    >
                        <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth="2" 
                            d="M5 10l7-7m0 0l7 7m-7-7v18" 
                        />
                    </svg>
                </button>
            )}
        </>
    );
};