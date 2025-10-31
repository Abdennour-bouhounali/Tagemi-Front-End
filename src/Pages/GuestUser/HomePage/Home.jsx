import { useTranslation } from "react-i18next";
import VideoBanner from "./Components/VideoBanner";
import Introduction from "./Components/Introduction";
import FeaturedActivities from "./Components/FeaturedActivities";
import Statistics from "./Components/Statistics";
import Sponsors from "./Components/Sponsors";
import Footer from "./Components/Footer";
import { useEffect, useState } from "react";
import Donate from "./Components/Donate";
import CallToAction from "./Components/CallToAction";
import ImpactStory from "./Components/ImpactStory";

const apiUrl = import.meta.env.VITE_API_URL; 

export default function Home() {
    const [types, setTypes] = useState([]);
    const [loading, setLoading] = useState(true);



    async function getTypes() {
        try {
            const res = await fetch(`${apiUrl}/api/types`);
            if (!res.ok) {
                throw new Error(`HTTP error! Status: ${res.status}`);
            }
            const data = await res.json();
            setTypes(data);
        } catch (error) {
            console.error("Failed to fetch types:", error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        getTypes();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#EEF7FF] to-white">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#101E58]"></div>
                    <p className="mt-4 text-[#101E58] font-droid-arabic-kufi text-xl">جاري التحميل...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="overflow-hidden">
            {/* Hero Section with enhanced banner */}
            <VideoBanner 
                bannerImage={'/tagemi_consept.jpg'} 
                bannerText={''} 
                homePage={true}
            />
            
            {/* Introduction Section with better spacing */}
            <Introduction />
            
            {/* Call to Action - New Section */}
            <CallToAction />
            
            {/* Featured Activities with enhanced cards */}
            {/* <FeaturedActivities /> */}
            
            {/* Impact Story - New Section */}
            {/* <ImpactStory /> */}
            
            {/* Statistics with animated counters */}
            {<Statistics />}
            
            {/* Donation Section with enhanced design */}
            <Donate />
            
            {/* Sponsors Section */}
            
            {/* Footer with improved layout */}
            <Footer types={types} />
        </div>
    );
}
