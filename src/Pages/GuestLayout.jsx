import React, { useContext, useRef, useEffect, useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { AppContext } from "../Context/AppContext";
import SuperAdminNav from "./Headers/SuperAdminNav";
import AuthNavBar from "./Headers/AuthNavBar";
import GuestNavBar from "./Headers/GuestNavBar";
import Footer from "./GuestUser/HomePage/Components/Footer";
import { useTranslation } from 'react-i18next';
import i18n from '../i18n'; // Ensure this path matches your i18n configuration file
import { useLanguage } from "../Context/LanguageContext";

export default function GuestLayout() {
    const { setUser, token, setToken } = useContext(AppContext);
    const navigate = useNavigate();
    const [specialities, setSpecialities] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const dropdownRef = useRef(null);
    const [types, setTypes] = useState([]);
    const { language } = useLanguage();

    // const [language, setLanguage] = useState(localStorage.getItem('language') || 'en');
    const { t } = useTranslation();

    // const handleLanguageChange = (event) => {
    //     const selectedLanguage = event.target.value;
    //     setLanguage(selectedLanguage);
    //     localStorage.setItem('language', selectedLanguage);
    //     i18n.changeLanguage(selectedLanguage); // Change language in i18n
    // };
      
    async function getTypes() {
        const res = await fetch('/api/types');
        const data = await res.json();
        setTypes(data);

    }

    useEffect(() => {
        getTypes()
    }, []);

    useEffect(() => {
        i18n.changeLanguage(language); // Change language in i18n
        getTypes();
    }, [language]);

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        // Bind the event listener
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            // Unbind the event listener on cleanup
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    async function getSpecialites() {
        const res = await fetch("/api/specialty", {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        const data = await res.json();
        setSpecialities(data["specialties"]);
    }

    useEffect(() => {
        getSpecialites();
    }, []);

    async function handlelogout(e) {
        e.preventDefault();

        const res = await fetch("/api/logout", {
            method: "post",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (res.ok) {
            setUser(null);
            setToken(null);
            localStorage.removeItem("token");
            navigate("/");
        }
    }

    const { user } = useContext(AppContext);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    return (
        <main className='max-w-[1833px] m-0 p-0'>
            <GuestNavBar user={user} types={types}/>

            <section className="z-99"> {/* Adjust margin to match the header height */}
                <Outlet />
                
            </section>
        </main>
    );
}
