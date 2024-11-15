import logo from './tagemi_logo.png';

function Card({ data }) {
    return (
        <div id={`card-${data[0].patient_id}`} className="bg-white shadow-lg rounded-lg p-3 max-w-sm mx-auto text-gray-800">
            {/* Logo */}
            <img src={logo} alt="profile" className="w-8 mx-auto -mt-2" />

            {/* Title */}
            <h4 className="text-center text-[7px] font-semibold leading-[7px]   font-droid-arabic-kufi  text-gray-600 mb-1">
                الفحوصات الطبية 29 نوفمبر 2024 بمركب العاليا الشيخ طفيش الجزائر العاصمة
            </h4>

            {/* Content */}
            <div className="space-y-1 text-right">
                {/* Patient Info */}
                <div className="flex items-center justify-between  text-[6px] ">
                    <span className=" text-gray-700    font-droid-arabic-kufi ">ID:</span>
                    <span className='ml-20    font-droid-arabic-kufi '>{data[0].patient_id}</span>
                </div>
                <div className="flex items-center justify-between -mt-2 text-[6px] ">
                    <span className=" text-gray-700  -mt-4">الإسم:</span>
                    <span className='ml-20  -mt-4'>{data[0].name}</span>
                </div>
                <div className="flex items-center justify-between -mt-2 text-[6px] ">
                    <span className=" text-gray-700  font-droid-arabic-kufi  -mt-4">اللقب:</span>
                    <span className='ml-20 -mt-4  font-droid-arabic-kufi '>{data[0].lastName}</span>
                </div>
                <div className="flex items-center  font-droid-arabic-kufi  justify-between -mt-2 text-[6px] ">
                    <span className=" text-gray-700 font-droid-arabic-kufi -mt-4">الوقت المقرر للمجيء:</span>
                    <span className='ml-16  -mt-4'>{data[0].time}</span>
                </div>
                {data[0].diseases !== 'nothing' &&(

                    <div className="flex items-center justify-between text-[6px]">
                    <span className=" text-gray-700  font-droid-arabic-kufi   -mt-4">الأمراض المزمنة:</span>
                    <span className='ml-20 -mt-4  font-droid-arabic-kufi '>{data[0].diseases}</span>
                </div>
                    )}

                {/* Specialties */}
                <div className="text-[6px] flex flex-col justify-between -mt-2 ">
                    <span className="font-medium text-gray-700 mb-5 -mt-4  font-droid-arabic-kufi">التخصصات المسجلة:</span>
                    <ul className="-mt-5 text-gray-600">
                        {data.map((item, index) => (
                            <li key={index} className="flex items-center  font-droid-arabic-kufi justify-between gap-2">
                                <span className=' font-droid-arabic-kufi'>{item.specialty.name}</span>
                                <input type="checkbox" className="w-2 ml-20 mt-2 h-2" />

                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default Card;
