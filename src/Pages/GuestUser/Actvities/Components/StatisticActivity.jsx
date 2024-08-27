import React from 'react';

const StatisticActivity = ({TypeDescription,ImageUrl}) => {
    return (
        <div className="min-h-[500px] px-10 flex flex-col lg:flex-row bg-[#EEF7FF] items-center justify-center text-center lg:text-left">
            <div className="lg:w-1/2 py-14 flex justify-center lg:justify-start sm:w-full">
                <img src={ImageUrl} alt="" />
            </div>
            <div className="lg:w-1/2 mt-4 lg:mt-0 lg:ml-12 p-4 rounded-lg text-right ">
                <h2 className='font-droid-arabic-kufi text-4xl font-bold mb-8 text-[#101E58] text-center'>نبذة تعريفية</h2>
                <p className="text-gray-700 leading-relaxed lg:text-2xl sm:text-xl font-bold mb-4 font-droid-arabic-kufi text-center">
                    {TypeDescription}
                </p>
            </div>
        </div>
    );
};

export default StatisticActivity;
