import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from "../../../Context/AppContext";

const CheckPresence = () => {


    const [appointments, setAppointments] = useState([]);
    const [expandedRows, setExpandedRows] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [FormData, setFormData] = useState({
        'status': ''
    });
    const { token } = useContext(AppContext);
    async function getAppoitments() {
        const res = await fetch('/api/appointment', {
            headers: {

                Authorization: `Bearer ${token}`
            }
        })

        const data = await res.json();
        console.log(data);
        setAppointments(data['appoitments']);

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
        const res = await fetch(`/api/appointment/ConfirmPresence/${patientId}`, {
            method: 'post',
            headers: {
                Authorization: `Bearer ${token}`
            },
        })
        getAppoitments();
    }

    async function hanleOnDelay(e, patientId) {
        e.preventDefault();
        const res = await fetch(`/api/appointment/ConfirmPresenceDelay/${patientId}`, {
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

    const handleChange = (e) => {
        setSearchTerm(e.target.value);
    };

    // Determine the appointments to display based on search term
    const displayAppointments = searchTerm === '' ? appointments : filteredAppointments;


    return (
        <div >
            <input
                type="text"
                placeholder="Search by Patient Name..."
                value={searchTerm}
                onChange={handleChange}
                className="search-bar my-4"
            />
            <table className="table-auto my-7 text-center ">
                <thead>
                    <tr>
                        <th>Patient ID</th>
                        <th>Name</th>
                        <th>Specialty</th>
                        <th>Time</th>
                        <th>Status</th>
                        <th>Check Presence</th>
                    </tr>
                </thead>
                <tbody>
                    {Object.keys(displayAppointments).map((patientId) => (
                        <React.Fragment key={patientId}>
                            <tr onClick={() => toggleRow(patientId)} className='border-t-4 text-center'>
                                <td>{patientId}</td>
                                <td>
                                {displayAppointments[patientId][0].position == 0 ? (<span className='text-red-500'>{displayAppointments[patientId][0].name}</span>): displayAppointments[patientId][0].name}
                                </td>
                                <td>{displayAppointments[patientId][0].specialty.name}</td>
            
                                <td>
                                {displayAppointments[patientId][0].position == 0 ? (<span className='text-red-500'>When Ever He Came</span>): displayAppointments[patientId][0].time}

                                </td>
                                <td className='text-center'>
                                    <span className={displayAppointments[patientId][0].status === 'Present' ? 'text-green-800' : displayAppointments[patientId][0].status === 'Completed' ? 'text-yellow-400' : 'text-yellow-800'}>
                                        {displayAppointments[patientId][0].status}
                                    </span>
                                </td>
                                <td className=' text-center mx-auto'>
                                    {displayAppointments[patientId][0].status == 'Pending' ? (
                                        <div className='flex justify-center'>
                                         <form className='text-center max-w-fit' onSubmit={(e) => hanlePresence(e, patientId)}>
                                        <input
                                            value="Present"
                                            type="hidden" name="status" />
                                        <button
                                            type="submit"
                                            className="text-green-700 hover:text-white border border-green-700 hover:bg-green-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-4 py-2"
                                            disabled={displayAppointments[patientId][0].status !== 'Pending'}

                                        >
                                            Present
                                        </button>

                                    </form>
                                    <form className='ml-4 text-center  max-w-fit' onSubmit={(e) => hanleOnDelay(e, patientId)}>
                                        <input
                                            value="Present"
                                            type="hidden" name="status" />
                                        <button
                                            type="submit"
                                            disabled={displayAppointments[patientId][0].status !== 'Pending'}
                                            className="text-yellow-700 hover:text-white border border-yellow-700 hover:bg-yellow-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-4 py-2"
                                        >
                                            On Delay
                                        </button>

                                    </form>
                                        </div>
                                    ):
                                    <h2 className='text-center'>No Actions To Perform</h2>
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
