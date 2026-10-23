import { useEffect, useState } from "react";
import { fetchTypes } from "../../../utils/publicApi";
import ActivityCategories from "./Components/ActivityCategories";
import CallToAction from "./Components/CallToAction";
import Donate from "./Components/Donate";
import Footer from "./Components/Footer";
import Introduction from "./Components/Introduction";
import Statistics from "./Components/Statistics";
import VideoBanner from "./Components/VideoBanner";

export default function Home() {
    const [types, setTypes] = useState([]);

    // The page renders straight away; the categories fill in when they arrive
    useEffect(() => {
        fetchTypes().then(setTypes).catch((error) => console.error("Failed to fetch types:", error));
    }, []);

    return (
        <div className="overflow-hidden">
            <VideoBanner bannerImage={'/tagemi_consept.webp'} bannerText={''} homePage={true} />
            <Introduction />
            <ActivityCategories types={types} />
            <CallToAction />
            <Statistics />
            <Donate />
            <Footer types={types} />
        </div>
    );
}
