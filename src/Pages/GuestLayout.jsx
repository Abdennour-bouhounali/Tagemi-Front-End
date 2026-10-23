import { Suspense, useContext, useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { AppContext } from "../Context/AppContext";
import GuestNavBar from "./Headers/GuestNavBar";
import i18n from '../i18n';
import { useLanguage } from "../Context/LanguageContext";
import { fetchTypes } from "../utils/publicApi";

// Shown while a page chunk loads: the navbar stays put, only the content area is a skeleton
function PageSkeleton() {
    return (
        <div className="min-h-[60vh] animate-pulse" aria-hidden="true">
            <div className="h-56 sm:h-72 bg-[#101E58]/10"></div>
            <div className="max-w-7xl mx-auto px-4 py-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[0, 1, 2].map((i) => <div key={i} className="h-48 rounded-2xl bg-gray-100"></div>)}
            </div>
        </div>
    );
}

export default function GuestLayout() {
    const { user } = useContext(AppContext);
    const [types, setTypes] = useState([]);
    const { language } = useLanguage();

    // Pages render immediately; the activity menu fills in as soon as the categories arrive
    useEffect(() => {
        fetchTypes().then(setTypes).catch((error) => console.error('Error fetching types:', error));
    }, []);

    useEffect(() => {
        i18n.changeLanguage(language);
    }, [language]);

    return (
        <div className="min-h-screen flex flex-col bg-white">
            <GuestNavBar user={user} types={types} />

            <main className="flex-1">
                <Suspense fallback={<PageSkeleton />}>
                    <Outlet context={{ types }} />
                </Suspense>
            </main>

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