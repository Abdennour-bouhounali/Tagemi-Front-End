import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from "../../../Context/AppContext";
const apiUrl = import.meta.env.VITE_API_URL;
import { useLocation } from "react-router-dom";

const WaitingList = () => {
    const [specialities, setSpecialities] = useState([]);
    const [waitingList, setWaitingList] = useState({});
    const { token, startDay, setStartDay, displayAuth, setDisplayAuth } = useContext(AppContext);
    const location = useLocation();
    const loggedIn = location.state?.loggedIn; // Optional chaining to handle undefined state
    const [loggedIns, setIoggedIns] = useState(loggedIn);

    // Fetch the waiting list
    async function getWaitingList() {
        const res = await fetch(`${apiUrl}/api/waitinglist/getwaitinglist`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const data = await res.json();



        setWaitingList(data);

    }

    // Fetch specialities
    async function getSpecialities() {
        const res = await fetch(`${apiUrl}/api/specialty`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        const data = await res.json();
        const filteredSpecialities = data['specialties'].filter(speciality => speciality.name !== 'NoSpeciality');
        setSpecialities(filteredSpecialities);
    }

    // Fetch start day
    async function getStartDay() {
        const res = await fetch(`${apiUrl}/api/getstartDay`);
        const data = await res.json();
        setStartDay(data);
    }

    // useEffect(() => {
    //     if (startDay) {
    //         getStartDay();
    //         getWaitingList();
    //     }
    // });

    useEffect(() => {
        // Function to fetch data after a delay of 5 seconds
        const timeoutId = setInterval(() => {
            if (startDay) {
                getStartDay();
                getWaitingList();
            }
        }, 10000);  // 5000 milliseconds = 5 seconds

        // Cleanup timeout if the component unmounts or dependencies change
        return () => clearInterval(timeoutId);
    }, [startDay, token]);  // Add relevant dependencies if needed

    useEffect(() => {
        getSpecialities();
        getWaitingList();
    }, [token]);

    // Determine the maximum number of patients across all specialties
    const maxRows = Math.max(...Object.values(waitingList).map(arr => arr.length), 0);

    return (
        <div className='w-full min-h-screen mx-auto'>


            <table className="block lg:table overflow-x-auto whitespace-nowrap min-w-full w-full  text-lg my-7 text-center border-collapse border border-gray-300">
                <thead>
                    <tr>
                        {specialities.map((speciality) => (
                            <th key={speciality.id} className='font-droid-arabic-kufi border-2 min-w-50 max-w-100 bg-blue-300'>
                                <span className='mb-4  font-black text-orange-700 text-xl'>{speciality.name}</span>
                                <div className='flex flex-row  mt-4'>
                                    <p className='basis-1/3 '>ID</p>
                                    <p className='basis-2/3 '>الاسم الكامل</p>
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className='w-full'>
                    {Array.from({ length: maxRows }).map((_, rowIndex) => (
                        <tr key={rowIndex} className={`${rowIndex % 2 === 0 ? 'bg-gray-100' : 'bg-white'}`}>
                            {specialities.map((speciality) => {
                                const patients = waitingList[speciality.id] || [];
                                const patient = patients[rowIndex] || null;

                                return (
                                    <td key={speciality.id} className='border-2 p-2'>
                                        {patient ? (
                                            <div
                                                className={`flex`}
                                            >
                                                <div className='w-1/3'>{patient.patient_id}</div>
                                                <div className={patient.name.includes('خاصة') ? 'text-red-500 font-droid-arabic-kufi' : 'font-droid-arabic-kufi'}>

                                                    {patient.lastName}
                                                    <span>   </span>

                                                    {patient.name}
                                                    {/* <br /> */}


                                                </div>
                                            </div>
                                        ) : (
                                            <div className='flex font-droid-arabic-kufi'>
                                                <div className='w-1/2'></div>
                                                <div className='w-1/2'></div>
                                            </div>
                                        )}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default WaitingList;
