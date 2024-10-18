import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from "../../../Context/AppContext";
const apiUrl = import.meta.env.VITE_API_URL; 

const SpecialCase = () => {


    const [appointments, setAppointments] = useState([]);
    const [expandedRows, setExpandedRows] = useState({});
    const [searchTerm, setSearchTerm] = useState('');

    const [message, setMessage] = useState(null);

    const [FormData, setFormData] = useState({
        'status': ''
    });
    const { token } = useContext(AppContext);
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
        console.log(data);
        if (res.ok) {
          setMessage(data['message']);
        }
        setTimeout(() => {
          setMessage(null);
        }, 2000);
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
        <div className='flex-grow container min-h-screen'>
             {message && (
        <div className="flex items-center p-4 mb-4 text-sm text-[#2F3645] border border-green-300 rounded-lg bg-[#EEEDEB]" role="alert">
          <svg className="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
          </svg>
          <span className="sr-only">Info</span>
          <div>
            <span className="font-medium">{message}</span>
          </div>
        </div>
      )}

            <input
                type="text"
                placeholder="Search by Patient Name..."
                value={searchTerm}
                onChange={handleChange}
                className="search-bar my-4"
            />
            <table className="table-auto my-7 ">
                <thead>
                    <tr>
                        <th>Patient ID</th>
                        <th>Name</th>
                        <th>Specialty</th>
                        <th>Time</th>
                        <th>Status</th>
                        <th>Check Special Case</th>
                    </tr>
                </thead>
                <tbody>
                    {Object.keys(displayAppointments).map((patientId) => (
                        <React.Fragment key={patientId}>
                            <tr onClick={() => toggleRow(patientId)} className='border-t-4'>
                                <td>{patientId}</td>
                                <td>{displayAppointments[patientId][0].name}</td>
                                <td>{displayAppointments[patientId][0].specialty.name}</td>
                                <td>{displayAppointments[patientId][0].time}</td>
                                <td className='text-center'>
                                    <span className={displayAppointments[patientId][0].status === 'Present' ? 'text-green-800' : displayAppointments[patientId][0].status === 'Completed' ? 'text-yellow-400' : 'text-yellow-800'}>
                                        {displayAppointments[patientId][0].status}
                                    </span>



                                </td>
                                <td>
                                    <form onSubmit={(e) => hanleSpecialCase(e, patientId)}>
                                        <input
                                            value="Present"
                                            type="hidden" name="status" />

                                        <button
                                        type='submit'
                                            className="text-green-700 hover:text-white border border-green-700 hover:bg-green-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-4 py-2"
                                            >Special Case</button>
                                    </form>
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
                                            <span className={appointment.status === 'Present' ? 'text-green-800' :  appointment.status === 'Completed' ?  'text-yellow-400' :'text-yellow-800'}>
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
export default SpecialCase;
