import React, { useState } from 'react';

const VideoBanner = ({ bannerImage, bannerText, homePage }) => {
    // const [bannerImage, setBannerImage] = useState("");

    return (<>
        {!homePage ? (
                      <img src={`${bannerImage}`} className="w-full h-auto" alt="" />

          ) : (
            <img src={`${bannerImage}`} className="w-full h-auto" alt="" />

            // <div className="relative w-full m-0 lg:h-[calc(100vh-111px)] h-[calc(100vh-569px)] bg-center bg-no-repeat bg-contain" style={{ backgroundImage: `url(${bannerImage})` }}>
            //     <div className="flex items-center justify-center text-center p-4 h-fit lg:h-[calc(100vh-11px)]">
            //         <div className="p-5 text-2xl text-white bg-opacity-50 rounded-xl">
            //             <h1 className="text-xl md:text-2xl font-bold text-black">
            //                 {bannerText}
            //             </h1>
            //         </div>
            //     </div>
            // </div>
            
            )}
    </>
    );
};

export default VideoBanner;
