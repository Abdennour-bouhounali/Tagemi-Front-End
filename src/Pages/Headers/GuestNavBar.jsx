import { useContext, useEffect, useState, useRef } from "react";
import { API_BASE_URL } from '../../config/environment';
import { Link, useNavigate } from "react-router-dom";
import { AppContext } from "../../Context/AppContext";
import LanguageSelector from "../../LanguageSelector";
import { useLanguage } from "../../Context/LanguageContext";
import { 
    Menu, 
    X, 
    Calendar, 
    LogOut, 
    ChevronDown,
    User as UserIcon,
    Home as HomeIcon,
    Phone,
    Info,
    Heart,
    BookOpen
} from 'lucide-react';

const apiUrl = API_BASE_URL;

const GuestNavBar = ({ user, types }) => {
    const [isNavOpen, setIsNavOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isActivitiesDropdownOpen, setIsActivitiesDropdownOpen] = useState(false);
    const [isActivitiesDropdownOpen2, setIsActivitiesDropdownOpen2] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    const { token, setToken, setUser } = useContext(AppContext);
    const { language } = useLanguage();

    // Check if user is super admin
    const isSuperAdmin = user?.role_id === 1;

    const toggleNav = () => {
        setIsNavOpen(!isNavOpen);
    };

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    const toggleActivitiesDropdown = () => {
        setIsActivitiesDropdownOpen(!isActivitiesDropdownOpen);
    };
        const toggleActivitiesDropdown2 = () => {
        setIsActivitiesDropdownOpen2(!isActivitiesDropdownOpen2);
    };

    const closeNav = () => {
        setIsNavOpen(false);
        setIsDropdownOpen(false);
        setIsActivitiesDropdownOpen(false);
    };

    // Handle scroll effect
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);
    
    async function handleLogout(e) {
        e.preventDefault();
        try {
            const res = await fetch(`${apiUrl}/api/logout`, {
                method: "post",
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
            });

            if (res.ok) {
                setUser(null);
                setToken(null);
                localStorage.removeItem("token");
                navigate("/");
            }
        } catch (error) {
            console.error('Error logging out:', error);
        }
    }

    // Close nav when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (isNavOpen && !e.target.closest('nav')) {
                closeNav();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isNavOpen]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsActivitiesDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Prevent body scroll when mobile menu is open
    useEffect(() => {
        if (isNavOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isNavOpen]);

    return (
        <header className={`sticky top-0 z-50 bg-white transition-all duration-300 ${
            scrolled ? 'shadow-lg' : 'shadow-md'
        }`}>
            <nav className='max-w-screen-2xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8'>
                <div className='flex items-center justify-between h-14 sm:h-16 md:h-18 lg:h-20 gap-4'>
                    {/* Logo - Always on one side */}
                    <div className="flex-shrink-0">
                        <Link 
                            to={user ? "/home" : "/"} 
                            className="block transform transition-transform hover:scale-105 duration-200"
                        >
                            <img 
                                src="/tagemi_logo.png" 
                                className="h-8 sm:h-10 md:h-11 lg:h-12 w-auto" 
                                alt="TAGEMI Logo" 
                            />
                        </Link>
                    </div>

                    {/* Desktop Navigation Links - Center */}
                    <div className="hidden lg:flex lg:items-center lg:gap-1 xl:gap-2 flex-1 justify-center">
                        {/* Main Navigation Links */}
                        <NavLink to={user ? "/home" : "/"} language={language}>
                            <HomeIcon className="w-4 h-4" />
                            <span>{language === 'en' ? 'Home' : 'الرئيسية'}</span>
                        </NavLink>
                        <NavLink to="/about" language={language}>
                            <Info className="w-4 h-4" />
                            <span>{language === 'en' ? 'About' : 'من نحن'}</span>
                        </NavLink>

                        {/* Activity Types Dropdown */}
                        {types && types.length > 0 && (
                            <div ref={dropdownRef} className="relative">
                                <button
                                    onClick={toggleActivitiesDropdown}
                                    className="group flex items-center gap-2 px-3 py-2 text-sm xl:text-base text-gray-700 hover:text-[#E03A6F] font-droid-arabic-kufi transition-all duration-200 rounded-lg hover:bg-gray-50 whitespace-nowrap"
                                >
                                    <Calendar className="w-4 h-4" />
                                    <span>{language === 'en' ? 'Activities' : 'الأنشطة'}</span>
                                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isActivitiesDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isActivitiesDropdownOpen && (
                                    <div className={`absolute top-full ${language === 'ar' ? 'right-0' : 'left-0'} mt-2 w-72 max-h-[70vh] overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-xl z-50 p-1.5`}>
                                        {/* ... inside the mobile menu loop ... */}
                                            {types.map((type) => (
                                                <MobileNavLink
                                                    key={type.id}
                                                    // 👇 ADD THE SLASH AT THE BEGINNING HERE
                                                    to={`/activities/type/${type.id}`} 
                                                    onClick={closeNav}
                                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:text-[#E03A6F] hover:bg-gray-50 rounded-lg font-droid-arabic-kufi transition-all duration-200"
                                                >
                                                    <Calendar className="w-4 h-4" />
                                                    <span>{language === 'en' ? type.name_en : type.name_ar}</span>
                                                </MobileNavLink>
                                            ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <NavLink to="/contact" language={language}>
                            <Phone className="w-4 h-4" />
                            <span>{language === 'en' ? 'Contact' : 'اتصل'}</span>
                        </NavLink>
                        <NavLink to="/volunteer" language={language}>
                            <Heart className="w-4 h-4" />
                            <span>{language === 'en' ? 'Volunteer' : 'تطوع'}</span>
                        </NavLink>

                        {/* Manage Events Link - Only for Super Admin */}
                        {isSuperAdmin && (
                            <NavLink to="admin/manage-events" language={language}>
                                <Calendar className="w-4 h-4" />
                                <span>{language === 'en' ? 'Manage' : 'إدارة'}</span>
                            </NavLink>
                        )}
                    </div>

                    {/* Desktop Right Side - Language & Auth */}
                    <div className="hidden lg:flex lg:items-center lg:gap-2 xl:gap-3 flex-shrink-0">
                        {/* Language Selector */}
                        <LanguageSelector />

                        {/* Divider */}
                        <div className="h-8 w-px bg-gray-300"></div>

                        {/* User Actions */}
                        {user ? (
                            <UserMenu user={user} language={language} handleLogout={handleLogout} />
                        ) : (
                            <AuthLinks language={language} />
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <button
                        onClick={toggleNav}
                        type="button"
                        className="lg:hidden inline-flex items-center justify-center p-2 rounded-lg text-gray-700 hover:text-[#E03A6F] hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#E03A6F] transition-all duration-200"
                        aria-controls="mobile-menu"
                        aria-expanded={isNavOpen}
                        aria-label="Toggle navigation menu"
                    >
                        {isNavOpen ? (
                            <X className="h-6 w-6" strokeWidth={2.5} />
                        ) : (
                            <Menu className="h-6 w-6" strokeWidth={2.5} />
                        )}
                    </button>
                </div>

                {/* Mobile Navigation Overlay */}
                {isNavOpen && (
                    <div 
                        className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fade-in"
                        onClick={closeNav}
                    ></div>
                )}

                {/* Mobile Navigation Drawer */}
                <div className={`lg:hidden fixed top-0 ${language === 'ar' ? 'left-0' : 'right-0'} bottom-0 w-[85%] max-w-sm bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
                    isNavOpen ? 'translate-x-0' : (language === 'ar' ? '-translate-x-full' : 'translate-x-full')
                }`}>
                    <div className="flex flex-col h-full">
                        {/* Mobile Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-200">
                            <img 
                                src="/tagemi_logo.png" 
                                className="h-8 w-auto" 
                                alt="TAGEMI Logo" 
                            />
                            <button
                                onClick={closeNav}
                                className="p-2 rounded-lg text-gray-700 hover:text-[#E03A6F] hover:bg-gray-100 transition-colors"
                                aria-label="Close menu"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Mobile Navigation Content */}
                        <div className="flex-1 overflow-y-auto py-4 px-3">
                            <div className="space-y-2">
                                <MobileNavLink to={user ? "/home" : "/"} language={language} onClick={closeNav}>
                                    <HomeIcon className="w-5 h-5" />
                                    <span>{language === 'en' ? 'Home' : 'الرئيسية'}</span>
                                </MobileNavLink>
                                <MobileNavLink to="/about" language={language} onClick={closeNav}>
                                    <Info className="w-5 h-5" />
                                    <span>{language === 'en' ? 'About' : 'من نحن'}</span>
                                </MobileNavLink>
                                {types && types.length > 0 && (
                                    <div>
                                        <button
                                            onClick={toggleActivitiesDropdown2}
                                            className="w-full flex items-center justify-between gap-3 px-4 py-3 text-base font-medium text-gray-700 hover:text-[#E03A6F] hover:bg-gray-50 rounded-xl font-droid-arabic-kufi transition-all duration-200"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Calendar className="w-5 h-5" />
                                                <span>{language === 'en' ? 'Activities' : 'الأنشطة'}</span>
                                            </div>
                                            <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isActivitiesDropdownOpen2 ? 'rotate-180' : ''}`} />
                                        </button>
                                        
                                        {isActivitiesDropdownOpen2 && (
                                            <div className="mt-2 ml-4 space-y-1">
                                               {/* ... inside the mobile menu loop ... */}
    {types.map((type) => (
        <MobileNavLink
            key={type.id}
            // 👇 ADD THE SLASH AT THE BEGINNING HERE
            to={`/activities/type/${type.id}`} 
            onClick={closeNav}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:text-[#E03A6F] hover:bg-gray-50 rounded-lg font-droid-arabic-kufi transition-all duration-200"
        >
            <Calendar className="w-4 h-4" />
            <span>{language === 'en' ? type.name_en : type.name_ar}</span>
        </MobileNavLink>
    ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Mobile Activity Types Dropdown */}
                                

                                <MobileNavLink to="/contact" language={language} onClick={closeNav}>
                                    <Phone className="w-5 h-5" />
                                    <span>{language === 'en' ? 'Contact' : 'اتصل'}</span>
                                </MobileNavLink>
                                <MobileNavLink to="/volunteer" language={language} onClick={closeNav}>
                                    <Heart className="w-5 h-5" />
                                    <span>{language === 'en' ? 'Volunteer' : 'تطوع'}</span>
                                </MobileNavLink>
                                {/* Manage Events Link - Only for Super Admin */}
                                {isSuperAdmin && (
                                    <MobileNavLink to="/admin/manage-events" language={language} onClick={closeNav}>
                                        <Calendar className="w-5 h-5" />
                                        <span>{language === 'en' ? 'Manage Events' : 'إدارة الفعاليات'}</span>
                                    </MobileNavLink>
                                )}
                            </div>

                            {/* Language Selector in Mobile */}
                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 px-3 font-droid-arabic-kufi">
                                    {language === 'en' ? 'Language' : 'اللغة'}
                                </p>
                                <div className="px-3">
                                    <LanguageSelector />
                                </div>
                            </div>

                                { user && (user.role_id === 3 || user.role_id === 5) && 
                                        <MobileNavLink
                                            to={`/admin/check-presence/${user.event_id}`}
                                            className="group relative px-3 xl:px-4 py-2 text-xs xl:text-sm font-semibold text-white bg-gradient-to-r  from-[#101E58] to-[#1a2d78] rounded-full transition-all duration-300 hover:shadow-lg hover:scale-105 transform font-droid-arabic-kufi overflow-hidden"
                                        >
                                            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
                                            <span className="relative flex items-center gap-1.5 xl:gap-2">
                                                <Calendar className="w-3.5 h-3.5 xl:w-4 xl:h-4" />
                                                <span className="hidden xl:inline">{language === 'en' ? 'Appointments' : 'المواعيد'}</span>
                                                <span className="xl:hidden">{language === 'en' ? 'Appt' : 'مواعيد'}</span>
                                            </span>
                                        </MobileNavLink>
                                    }

                            {/* Mobile User Actions */}
                            <div className="mt-6 pt-6 border-t border-gray-200">
                                {user ? (
                                    <MobileUserMenu 
                                        user={user} 
                                        language={language} 
                                        handleLogout={handleLogout} 
                                        onClick={closeNav} 
                                    />
                                ) : (
                                    <MobileAuthLinks language={language} onClick={closeNav} />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in {
                    animation: fade-in 0.2s ease-out;
                }
            `}</style>
        </header>
    );
};

// Rest of the components remain the same...
// (NavLink, MobileNavLink, UserMenu, MobileUserMenu, AuthLinks, MobileAuthLinks)

// Desktop Nav Link Component
const NavLink = ({ to, children }) => (
    <Link
        to={to}
        className="group flex items-center gap-2 px-3 py-2 text-sm xl:text-base text-gray-700 hover:text-[#E03A6F] font-droid-arabic-kufi transition-all duration-200 rounded-lg hover:bg-gray-50 whitespace-nowrap"
    >
        {children}
    </Link>
);

// Mobile Nav Link Component
const MobileNavLink = ({ to, children, onClick }) => (
    <Link
        to={to}
        className="flex items-center gap-3 px-4 py-3 text-base font-medium text-gray-700 hover:text-[#E03A6F] hover:bg-gray-50 rounded-xl font-droid-arabic-kufi transition-all duration-200 group"
        onClick={onClick}
    >
        {children}
    </Link>
);

// Specialties of the officer's event that have a hidden dilatation room
const dilatationStations = (user) =>
    (user?.event?.event_specialties || []).filter((es) => es.has_dilatation);

// "dil:<event specialty id>" opens a dilatation room, a plain id a specialty queue
const specialtyRoute = (user, value) => value.startsWith('dil:')
    ? `/admin/dilatation/${user.event_id}/${value.slice(4)}`
    : `/admin/event-waiting-lists/${user.event_id}/${value}`;

// Desktop User Menu Component
const UserMenu = ({ user, language, handleLogout }) => {
    const navigate = useNavigate();
    const specialties = user?.specialties || [];

    const handleSpecialtyChange = (e) => {
        const specialtyId = e.target.value;
        if (specialtyId) {
            navigate(specialtyRoute(user, specialtyId));
        }
    };

    return (
        <div className="flex items-center gap-2">
            {/* All Appointments Button - Role 3 */}
            { (user.role_id === 3 || user.role_id === 5) && (
                <Link
                    to={`/admin/check-presence/${user.event_id}`}
                    className="group relative px-3 xl:px-4 py-2 text-xs xl:text-sm font-semibold text-white bg-gradient-to-r from-[#101E58] to-[#1a2d78] rounded-full transition-all duration-300 hover:shadow-lg hover:scale-105 transform font-droid-arabic-kufi overflow-hidden"
                >
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
                    <span className="relative flex items-center gap-1.5 xl:gap-2">
                        <Calendar className="w-3.5 h-3.5 xl:w-4 xl:h-4" />
                        <span className="hidden xl:inline">{language === 'en' ? 'Appointments' : 'المواعيد'}</span>
                        <span className="xl:hidden">{language === 'en' ? 'Appt' : 'مواعيد'}</span>
                    </span>
                </Link>
            )}

            {/* Waiting List Dropdown - Role 4 */}
            {[4, 8].includes(user.role_id) && specialties.length > 0 && (
                <div className="relative group">
                    <select
                        onChange={handleSpecialtyChange}
                        className="appearance-none px-3 xl:px-4 py-2 pr-8 xl:pr-10 text-xs xl:text-sm font-semibold text-white bg-gradient-to-r from-[#101E58] to-[#1a2d78] rounded-full transition-all duration-300 hover:shadow-lg hover:scale-105 transform font-droid-arabic-kufi cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#E03A6F] focus:ring-offset-2 border-none"
                        defaultValue=""
                    >
                        <option value="" disabled className="bg-white text-gray-900">
                            {language === 'en' ? '📋 List' : '📋 قائمة'}
                        </option>
                        {specialties
                            .filter((specialty) => specialty.id !== 6)
                            .map((specialty) => (
                                <option 
                                    key={specialty.id} 
                                    value={specialty.id}
                                    className="bg-white text-gray-900 py-2"
                                >
                                    {specialty.name}
                                </option>
                            ))}
                        {dilatationStations(user).map((es) => (
                            <option key={`dil-${es.id}`} value={`dil:${es.id}`} className="bg-white text-gray-900 py-2">
                                {`التمدد — ${es.specialty?.name || ''}`}
                            </option>
                        ))}
                    </select>
                    <div className="absolute right-2 xl:right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <ChevronDown className="w-3.5 h-3.5 xl:w-4 xl:h-4 text-white" />
                    </div>
                </div>
            )}

            {/* Patient journey guide - every signed-in user */}
            <Link
                to="/admin/patient-journey"
                className="px-3 xl:px-4 py-2 text-xs xl:text-sm font-semibold text-[#101E58] bg-white border border-[#101E58]/20 rounded-full transition-all duration-300 hover:shadow-lg hover:scale-105 transform font-droid-arabic-kufi"
            >
                <span className="flex items-center gap-1.5 xl:gap-2">
                    <BookOpen className="w-3.5 h-3.5 xl:w-4 xl:h-4" />
                    <span className="hidden xl:inline">{language === 'en' ? 'Patient journey' : 'دليل رحلة المريض'}</span>
                </span>
            </Link>

            {/* Logout Button */}
            <button
                onClick={handleLogout}
                className="group relative px-3 xl:px-4 py-2 text-xs xl:text-sm font-semibold text-white bg-gradient-to-r from-[#E03A6F] to-[#c8102e] rounded-full transition-all duration-300 hover:shadow-lg hover:scale-105 transform font-droid-arabic-kufi overflow-hidden"
            >
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
                <span className="relative flex items-center gap-1.5 xl:gap-2">
                    <LogOut className="w-3.5 h-3.5 xl:w-4 xl:h-4" />
                    <span className="hidden xl:inline">{language === 'en' ? 'Logout' : 'خروج'}</span>
                </span>
            </button>
        </div>
    );
};

// Mobile User Menu Component
const MobileUserMenu = ({ user, language, handleLogout, onClick }) => {
    const navigate = useNavigate();
    const specialties = user?.specialties || [];

    const handleSpecialtyChange = (e) => {
        const specialtyId = e.target.value;
        if (specialtyId) {
            navigate(specialtyRoute(user, specialtyId));
            onClick();
        }
    };

    return (
        <div className="space-y-3 px-3">
            {/* All Appointments Button - Role 3 */}
            {user.role_id === 3 && user.event_id && (
                <Link
                    to={`/admin/big-list-waiting/${user.event_id}`}
                    className="group relative flex items-center justify-center gap-2 px-4 py-3.5 text-base font-semibold text-white bg-gradient-to-r from-[#101E58] to-[#1a2d78] rounded-xl transition-all duration-300 hover:shadow-lg active:scale-95 transform font-droid-arabic-kufi overflow-hidden"
                    onClick={onClick}
                >
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-active:translate-x-full transition-transform duration-500"></span>
                    <Calendar className="w-5 h-5 relative" />
                    <span className="relative">{language === 'en' ? 'All Appointments' : 'جميع المواعيد'}</span>
                </Link>
            )}

            {/* Waiting List Dropdown - Role 4 */}
            {[4, 8].includes(user.role_id) && specialties.length > 0 && (
                <div className="relative">
                    <select
                        onChange={handleSpecialtyChange}
                        className="appearance-none w-full px-4 py-3.5 pr-10 text-base font-semibold text-white bg-gradient-to-r from-[#101E58] to-[#1a2d78] rounded-xl font-droid-arabic-kufi cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#E03A6F] focus:ring-offset-2 border-none transition-all duration-200"
                        defaultValue=""
                    >
                        <option value="" disabled className="bg-white text-gray-900">
                            {language === 'en' ? '📋 Waiting List' : '📋 قائمة الانتظار'}
                        </option>
                        {specialties
                            .filter((specialty) => specialty.id !== 6)
                            .map((specialty) => (
                                <option 
                                    key={specialty.id} 
                                    value={specialty.id}
                                    className="bg-white text-gray-900 py-2"
                                >
                                    {specialty.name}
                                </option>
                            ))}
                        {dilatationStations(user).map((es) => (
                            <option key={`dil-${es.id}`} value={`dil:${es.id}`} className="bg-white text-gray-900 py-2">
                                {`التمدد — ${es.specialty?.name || ''}`}
                            </option>
                        ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <ChevronDown className="w-5 h-5 text-white" />
                    </div>
                </div>
            )}

            {/* Patient journey guide - every signed-in user */}
            <Link
                to="/admin/patient-journey"
                onClick={onClick}
                className="w-full flex items-center justify-center gap-2 px-4 py-3.5 text-base font-semibold text-[#101E58] bg-white border border-[#101E58]/20 rounded-xl font-droid-arabic-kufi"
            >
                <BookOpen className="w-5 h-5" />
                <span>{language === 'en' ? 'Patient journey' : 'دليل رحلة المريض'}</span>
            </Link>

            {/* Logout Button */}
            <button
                onClick={(e) => {
                    handleLogout(e);
                    onClick();
                }}
                className="group relative w-full flex items-center justify-center gap-2 px-4 py-3.5 text-base font-semibold text-white bg-gradient-to-r from-[#E03A6F] to-[#c8102e] rounded-xl transition-all duration-300 hover:shadow-lg active:scale-95 transform font-droid-arabic-kufi overflow-hidden"
            >
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-active:translate-x-full transition-transform duration-500"></span>
                <LogOut className="w-5 h-5 relative" />
                <span className="relative">{language === 'en' ? 'Log Out' : 'خروج'}</span>
            </button>
        </div>
    );
};

// Desktop Auth Links Component
const AuthLinks = ({ language }) => (
    <div className="flex items-center gap-2">
        <Link
            to="/login"
            className="px-4 xl:px-5 py-2 text-sm xl:text-base font-semibold text-white bg-gradient-to-r from-[#E03A6F] to-[#c8102e] hover:shadow-lg rounded-full transition-all duration-300 font-droid-arabic-kufi hover:scale-105 transform"
        >
            {language === 'en' ? 'Login' : 'دخول'}
        </Link>
    </div>
);

// Mobile Auth Links Component
const MobileAuthLinks = ({ language, onClick }) => (
    <div className="space-y-3 px-3">
        <Link
            to="/login"
            className="flex items-center justify-center gap-2 px-4 py-3.5 text-base font-semibold text-white bg-gradient-to-r from-[#E03A6F] to-[#c8102e] rounded-xl font-droid-arabic-kufi transition-all duration-200 hover:shadow-lg active:scale-95 transform"
            onClick={onClick}
        >
            <UserIcon className="w-5 h-5" />
            <span>{language === 'en' ? 'Log In' : 'دخول'}</span>
        </Link>
    </div>
);

export default GuestNavBar;