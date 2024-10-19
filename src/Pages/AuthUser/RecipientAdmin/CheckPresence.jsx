import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from "../../../Context/AppContext";
const apiUrl = import.meta.env.VITE_API_URL; 

const CheckPresence = () => {


    const [appointments, setAppointments] = useState([]);
    const [expandedRows, setExpandedRows] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const {user} = useContext(AppContext);
    const [FormData, setFormData] = useState({
        'status': ''
    });
    const { token,startDay,setStartDay,displayAuth,setDisplayAuth } = useContext(AppContext);
    async function getAppoitments() {
        const res = await fetch(`${apiUrl}/api/appointment`, {
            headers: {

                Authorization: `Bearer ${token}`
            }
        })

        const data = await res.json();
        // console.log(data);
        setAppointments(data['appoitments']);

    }
    async function getstartDay(){
        const res = await fetch(`${apiUrl}/api/getstartDay`);
        const data = await res.json();
        setStartDay(data);
    }


    useEffect(() => {
        getAppoitments();
    }, []);

    // Toggle the expanded state of a row
    const toggleRow = (patientId) => {
        setExpandedRows((prevState) => ({
            ...prevState,
            [patientId]: !prevState[patientId],
        }));
    };

    async function hanlePresence(e, patientId) {
        e.preventDefault();
        const res = await fetch(`${apiUrl}/api/appointment/ConfirmPresence/${patientId}`, {
            method: 'post',
            headers: {
                Authorization: `Bearer ${token}`
            },
        })
        getAppoitments();
    }

    async function hanleOnDelay(e, patientId) {
        e.preventDefault();
        const res = await fetch(`${apiUrl}/api/appointment/ConfirmPresenceDelay/${patientId}`, {
            method: 'post',
            headers: {
                Authorization: `Bearer ${token}`
            },
        })
        getAppoitments();
    }
    // Function to filter appointments based on search term
    const filteredAppointments = Object.keys(appointments).reduce(
        (filtered, patientId) => {
            const filteredPatientAppointments = appointments[patientId].filter(
                (appointment) =>
                    appointment.name.toLowerCase().includes(searchTerm.toLowerCase())
            );

            if (filteredPatientAppointments.length > 0) {
                filtered[patientId] = filteredPatientAppointments;
            }

            return filtered;
        },
        {}
    );

        // Function to filter appointments based on search term
        const filteredAppointmentsByStatus = Object.keys(appointments).reduce(
            (filtered, patientId) => {
                const filteredPatientAppointmentsByStatus = appointments[patientId].filter(
                    (appointment) =>
                        appointment.status.toLowerCase().includes(statusFilter.toLowerCase())
                );
    
                if (filteredPatientAppointmentsByStatus.length > 0) {
                    filtered[patientId] = filteredPatientAppointmentsByStatus;
                }
    
                return filtered;
            },
            {}
        );

    const handleChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleStatusChange = (e)=>{
        setStatusFilter(e.target.value);
    }

    useEffect(()=>{
        if(startDay){
            getstartDay();
            getAppoitments();
        }
    })
    // Determine the appointments to display based on search term
    // const displayAppointments = searchTerm === '' ? (statusFilter === "" ? appointments : filteredAppointmentsByStatus) : filteredAppointments;

    const displayAppointments = searchTerm === '' 
        ? (statusFilter === "" ? appointments : filteredAppointmentsByStatus) 
        : (statusFilter === "" 
            ? filteredAppointments 
            : Object.keys(filteredAppointmentsByStatus).reduce(
                (filtered, patientId) => {
                    const filteredPatientAppointments = filteredAppointmentsByStatus[patientId].filter(
                        (appointment) =>
                            appointment.name.toLowerCase().includes(searchTerm.toLowerCase())
                    );

                    if (filteredPatientAppointments.length > 0) {
                        filtered[patientId] = filteredPatientAppointments;
                    }

                    return filtered;
                },
                {}
            )
        );
        
    async function hanleSpecialCase(e, patientId) {
        e.preventDefault();
        const res = await fetch(`${apiUrl}/api/appointment/SpecialCase/${patientId}`, {
            method: 'post',
            headers: {
                Authorization: `Bearer ${token}`
            },
        })
        getAppoitments();
        const data = await res.json();
        // console.log(data);
        if (res.ok) {
          setMessage(data['message']);
        }
        setTimeout(() => {
          setMessage(null);
        }, 2000);
    }

    return (
        <div className='md:container md:mx-auto min-h-screen'>
            <div className="flex">
            <select 
            value={statusFilter} 
            onChange={handleStatusChange} 
            className="search-bar  m-4 px-2 bg-[#EEEDEB]">
                <option value="">All</option>
                <option value="Pending">Pending</option>
                <option value="Present">Present</option>
                <option value="Completed">Completed</option>
                <option value="Waiting List">Waiting List</option>
            </select>
            <input
                type="text"
                placeholder="Search by Patient Name..."
                value={searchTerm}
                onChange={handleChange}
                className="search-bar my-4"
            />
            </div>

            <table className="table-auto my-7 text-center ">
                <thead>
                    <tr>
                        <th  className='font-droid-arabic-kufi'>ID</th>
                        <th  className='font-droid-arabic-kufi'>الاسم</th>
                        <th  className='font-droid-arabic-kufi'>التحصص</th>
                        <th className='font-droid-arabic-kufi'>وقت المجيئ</th>
                        <th  className='font-droid-arabic-kufi'>الحالة</th>
                        <th  className='font-droid-arabic-kufi'>أمر</th>
                    </tr>
                </thead>
                <tbody>
                    {Object.keys(displayAppointments).map((patientId) => (
                        <React.Fragment key={patientId}>
                            <tr onClick={() => toggleRow(patientId)} className='border-t-4 text-center'>
                                <td>{patientId}</td>
                                <td>
                                {displayAppointments[patientId][0].position == 0 ? (<span className='text-red-500 font-droid-arabic-kufi'>{displayAppointments[patientId][0].name}</span>): displayAppointments[patientId][0].name}
                                </td>
                                <td>{displayAppointments[patientId][0].specialty.name}</td>
            
                                <td>
                                {displayAppointments[patientId][0].position == 0 ? (<span className='text-red-500 font-droid-arabic-kufi'>يجتاز متى ما جاء</span>): displayAppointments[patientId][0].time}

                                </td>
                                <td className='text-center'>
                                    <span className={displayAppointments[patientId][0].status === 'Present' ? 'text-green-800' : displayAppointments[patientId][0].status === 'Completed' ? 'text-yellow-400' : 'text-yellow-800'}>
                                        {displayAppointments[patientId][0].status}
                                    </span>
                                </td>
                                <td className=' text-center mx-auto'>
                                    {displayAppointments[patientId][0].status == 'Pending' ? (
                                        <div className='flex justify-center'>
                                        {(user.role_id == 1 || user.role_id == 5 ) && (
                                            <>
                                         <form className='text-center max-w-fit' onSubmit={(e) => hanlePresence(e, patientId)}>
                                        <input
                                            value="Present"
                                            type="hidden" name="status" />
                                        <button
                                            type="submit"
                                            className="text-green-700 hover:text-white border font-droid-arabic-kufi border-green-700 hover:bg-green-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-4 py-2"
                                            disabled={displayAppointments[patientId][0].status !== 'Pending'}

                                        >
                                            حاضر
                                        </button>

                                    </form>
                                    <form className='ml-4 text-center  max-w-fit' onSubmit={(e) => hanleOnDelay(e, patientId)}>
                                        <input
                                            value="Present"
                                            type="hidden" name="status" />
                                        <button
                                            type="submit"
                                            disabled={displayAppointments[patientId][0].status !== 'Pending'}
                                            className="text-yellow-700 font-droid-arabic-kufi hover:text-white border border-yellow-700 hover:bg-yellow-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-4 py-2"
                                        >
                                            جاء متأخرا
                                        </button>

                                    </form>
                                    </>
                                    )}
                                    {(user.role_id == 1 || user.role_id == 3 ) && (
                                          <form className='ml-4 ' onSubmit={(e) => hanleSpecialCase(e, patientId)}>
                                          <input
                                              value="Present"
                                              type="hidden" name="status" />
  
                                          <button
                                          type='submit'
                                              className="text-yellow-500 font-droid-arabic-kufi hover:text-white border border-yellow-500 hover:bg-yellow-500 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-4 py-2"
                                              >حالة خاصة </button>
                                      </form>
                                    )}
                                        </div>
                                    ): displayAppointments[patientId][0].status == 'Waiting List' && user.role_id == 1 ? 
                                    <div className='flex justify-center'>
                                    <form className='text-center max-w-fit' onSubmit={(e) => hanlePresence(e, patientId)}>
                                    <input
                                        value="Present"
                                        type="hidden" name="status" />
                                    <button
                                        type="submit"
                                        className="text-green-700  hover:text-white border border-green-700 hover:bg-green-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-4 py-2"
                                        disabled={displayAppointments[patientId][0].status !== 'Pending'}

                                    >
                                        يضاف لقائمة الاحتياط
                                    </button>

                                </form></div> :
                                    <h2 className='text-center '>لا يوجد خيارات</h2>
                                    }
                                   
                                </td>
                            </tr>
                            {expandedRows[patientId] &&
                                displayAppointments[patientId].slice(1).map((appointment) => (
                                    <tr key={appointment.id} className="bg-gray-100 expanded-row">
                                        <td></td>
                                        <td>{appointment.name}</td>
                                        <td>{appointment.specialty.name}</td>
                                        <td>{appointment.time}</td>
                                        <td className='text-center'>
                                            <span className={appointment.status === 'Present' ? 'text-green-800' : appointment.status === 'Completed' ? 'text-yellow-400' : 'text-yellow-800'}>
                                                {appointment.status}
                                            </span>

                                        </td>
                                        <td></td>
                                    </tr>
                                ))}
                        </React.Fragment>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
export default CheckPresence;
