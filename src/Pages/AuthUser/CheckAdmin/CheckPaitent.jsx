import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from "../../../Context/AppContext";
import { useParams } from 'react-router-dom';
import { apiUrl } from '../../../Context/AppContext';

const CheckPatient = () => {
    const { specialityId } = useParams();
    const [speciality, setSpeciality] = useState('');
    const [appointments, setAppointments] = useState([]);
    const [expandedRows, setExpandedRows] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [comment, setComment] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [message, setMessage] = useState('');  // Add this state to manage the message


    const { user, token } = useContext(AppContext);

    async function getWaitingListBySpeciality(specialityId) {
        try {
            const res = await fetch(`${apiUrl}/api/waitinglist/GetWaitingListBySpeciality/${specialityId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await res.json();
            setAppointments(data.appointments || []);
            setSpeciality(data.speciality || '');
        } catch (error) {
            console.error("Error fetching waiting list:", error);
        }
    }

    useEffect(() => {
        getWaitingListBySpeciality(specialityId);
    }, [specialityId]);

    const toggleRow = (patientId) => {
        setExpandedRows((prev) => ({
            ...prev,
            [patientId]: !prev[patientId],
        }));
    };

    const filteredAppointments = appointments.filter((appointment) =>
        appointment.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleChange = (e) => setSearchTerm(e.target.value);

    async function handleAbsent(e, appointmentId) {
        e.preventDefault();
        try {
            await fetch(`${apiUrl}/api/waitinglist/Absent/${appointmentId}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            getWaitingListBySpeciality(specialityId);
        } catch (error) {
            console.error("Error marking absent:", error);
        }
    }

    async function handleComplete(e, appointmentId) {
        e.preventDefault();
        try {
            await fetch(`${apiUrl}/api/waitinglist/Complete/${appointmentId}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            getWaitingListBySpeciality(specialityId);
        } catch (error) {
            console.error("Error marking complete:", error);
        }
    }

    const openCommentModal = (appointmentId) => {
        setSelectedAppointment(appointmentId);
        setIsModalOpen(true);
    };

    const closeCommentModal = () => {
        setIsModalOpen(false);
        setSelectedAppointment(null);
        setComment('');
    };

    async function addComment(e) {
        e.preventDefault();
        try {
            const res = await fetch(`${apiUrl}/api/appointment/addComment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    appointment_id: selectedAppointment,
                    comment,
                }),
            });

            const data = await res.json();

            if (res.ok && data.message === 'Comment added successfully') {
                setMessage('تمت إضافة الملاحظة بنجاح');
                closeCommentModal();
                getWaitingListBySpeciality(specialityId);

                // Hide the message after 3 seconds
                setTimeout(() => {
                    setMessage('');
                }, 3000);
            } else {
                setMessage('هناك خطأ في النظام ');

                // Hide the message after 3 seconds
                setTimeout(() => {
                    setMessage('');
                }, 3000);
            }
        } catch (error) {
            console.error("Error adding comment:", error);
            setMessage('An error occurred while adding the comment.');

            // Hide the message after 3 seconds
            setTimeout(() => {
                setMessage('');
            }, 3000);
        }
    }

    return (
        <div className="md:container md:mx-auto min-w-full min-h-screen mb-5 text-nowrap">

            <h1 className="font-droid-arabic-kufi my-4 mx-auto text-2xl font-black text-[#131842]">{speciality}</h1>
            {message && (
                <div className="flex items-center p-4 m-4 text-sm text-[#2F3645] border border-green-300 rounded-lg bg-[#EEEDEB]" role="alert">
                    <svg className="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
                    </svg>
                    <span className="sr-only">Info</span>
                    <div>
                        <span className="font-medium font-droid-arabic-kufi">{message}</span>
                    </div>
                </div>
            )}
            <input
                type="text"
                placeholder="إبحث بالإسم"
                value={searchTerm}
                onChange={handleChange}
                className="search-bar my-4 font-droid-arabic-kufi"
            />
            <table className="table-auto my-7 block lg:table overflow-x-auto whitespace-nowrap min-w-[800px] w-full text-center font-droid-arabic-kufi">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>الإسم</th>
                        <th>اللقب</th>
                        <th>تاريخ الميلاد</th>
                        <th>الترتيب</th>
                        {(user.role_id == 1 || user.role_id == 6) && (

                            <th>ملاحظات</th>
                        )}
                        <th>أمر</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredAppointments.map((appointment) => (
                        <React.Fragment key={appointment.id}>
                            <tr onClick={() => toggleRow(appointment.id)} className="border-t-4">
                                <td>{appointment.patient_id}</td>
                                <td>{appointment.name}</td>
                                <td>{appointment.lastName}</td>
                                <td>{appointment.birthday}</td>
                                <td>{appointment.orderList}</td>
                                {(user.role_id == 1 || user.role_id == 6) && (
                                    <td>{appointment.comment}</td>
                                )}

                                <td>
                                    {(user.role_id == 1 || user.role_id == 4) && (
                                        <>
                                            <button
                                                onClick={(e) => handleAbsent(e, appointment.id)}
                                                className="text-red-700 mx-3 hover:text-white border font-droid-arabic-kufi border-red-700 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-4 py-2"
                                            >
                                                غائب
                                            </button>
                                            <button
                                                onClick={(e) => handleComplete(e, appointment.id)}
                                                className="text-green-700 mx-3 hover:text-white border font-droid-arabic-kufi border-green-700 hover:bg-green-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-4 py-2"
                                            >
                                                إجتاز
                                            </button>
                                        </>
                                    )}

                                    {(user.role_id == 1 || user.role_id == 6) && (
                                        <button
                                            onClick={() => openCommentModal(appointment.id)}
                                            type="button"
                                            className="text-blue-700 mx-3 hover:text-white border font-droid-arabic-kufi border-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2"
                                        >
                                            أضف ملاحظة                                        </button>
                                    )}

                                </td>
                            </tr>
                        </React.Fragment>
                    ))}
                </tbody>
            </table>

            {isModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white rounded-lg shadow-lg p-6 w-[90%] max-w-full h-[90%] overflow-auto">
                        <h2 className="text-xl font-bold mb-4 font-droid-arabic-kufi">أضف ملاحظة</h2>
                        <form
                            onSubmit={async (e) => {
                                // e.preventDefault(); // Prevent default form submission
                                await addComment(e); // Call the function to handle adding a comment
                                setIsModalOpen(false); // Close the modal
                                setComment(''); // Reset the comment field
                            }}
                            className="bg-white rounded-lg  p-6 w-[90%] max-w-full h-[90%] overflow-auto"

                        >
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Enter your comment"
                                className="w-full h-[80%] p-2 border rounded-md focus:ring focus:ring-blue-500 focus:outline-none"
                                required
                            ></textarea>

                            <div className="flex justify-start mt-4">
                                <button
                                    type="submit"
                                    className="ml-2 px-4 mx-5 py-2 text-white bg-blue-600 font-droid-arabic-kufi rounded-md hover:bg-blue-700"
                                >
                                    حفظ
                                </button>
                                <button
                                    type="button"
                                    onClick={closeCommentModal}
                                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md font-droid-arabic-kufi hover:bg-gray-300"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

export default CheckPatient;
