import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from "../../../Context/AppContext";

const WaitingList = () => {
    const [specialities, setSpecialities] = useState([]);
    const [waitingList, setWaitingList] = useState({});
    const { token,startDay,setStartDay,displayAuth,setDisplayAuth } = useContext(AppContext);

    async function getWaitingList() {
        const res = await fetch('/api/waitinglist/getwaitinglist', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const data = await res.json();
        setWaitingList(data);
    }

    async function getSpecialities() {
        const res = await fetch("/api/specialty", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        const data = await res.json();
        const filteredSpecialities = data['specialties'].filter(speciality => speciality.name !== 'NoSpeciality');
        setSpecialities(filteredSpecialities);    }

    async function getstartDay(){
        const res = await fetch('/api/getstartDay');
        const data = await res.json();
        setStartDay(data);
    }




    useEffect(()=>{
        if(startDay){
            getstartDay();
            getWaitingList();
        }
    })
    useEffect(() => {
        getSpecialities();
        getWaitingList();
    }, [token]);


    // Determine the maximum number of patients across all specialties
    const maxRows = Math.max(...Object.values(waitingList).map(arr => arr.length), 0);

    return (
        <div className='w-full min-h-screen'>
            <table className="table-auto my-7 text-center w-full">
                <thead>
                    <tr>
                        {specialities.map((speciality) => (
                            <th key={speciality.id} className='font-droid-arabic-kufi border-2 '>
                                <p className='mb-1 w-full '>
                                {speciality.name}
                                </p>
                                
                                <br />
                                <div className='flex flex-row w-full'>
                                    <p className='basis-1/2 '>ID</p>
                                    <p className='basis-1/2  '>الإسم</p>
                                </div>
                            </th>
                        ))}
                    </tr>
                    {/* <tr>
                        {specialities.map((speciality) => (
                            <React.Fragment key={speciality.id}>
                                <th className='font-droid-arabic-kufi'>Patient ID</th>
                                <th className='font-droid-arabic-kufi'>Name</th>
                            </React.Fragment>
                        ))}
                    </tr> */}
                </thead>
                <tbody>
                {Array.from({ length: maxRows }).map((_, rowIndex) => (
                        <tr key={rowIndex}>
                            {specialities.map((speciality) => {
                                const patients = waitingList[speciality.id] || [];
                                const patient = patients[rowIndex] || null;

                                return (
                                    <td key={speciality.id} className='border-4 p-2'>
                                        {patient ? (
                                            <div className='flex'>
                                                <div className='w-1/2  '>{patient.patient_id}</div>
                                                <div className='w-1/2  '>{patient.name}</div>
                                            </div>
                                        ) : (
                                            <div className='flex'>
                                                <div className='w-1/2  '></div>
                                                <div className='w-1/2  '></div>
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
