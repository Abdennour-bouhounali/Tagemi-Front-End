import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from "../../../Context/AppContext";
const apiUrl = import.meta.env.VITE_API_URL; 

const VisitsStatistics = () => {
    const [statistics, setStatistics] = useState([]);
    const { token } = useContext(AppContext);
    const [totals, setTotals] = useState({});

    useEffect(() => {
        getStatistics();
    }, []);

    async function getStatistics() {
        const res = await fetch(`${apiUrl}/api/getStatistics`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        const data = await res.json();
        console.log(data);
        setStatistics(data.statistics);
        setTotals(data.totals);

    }

    return (
        <div className='flex-grow container min-h-screen'>
            <table className="table-auto my-7 text-center">
                <thead>
                    <tr>
                        <th>Specialty</th>
                        <th>Pending</th>
                        <th>Delay</th>
                        <th>Present & Waiting</th>
                        <th>Completed</th>
                    </tr>
                </thead>
                <tbody>
                    {statistics.map((stat) => (
                        <tr key={stat.specialty_id}>
                            <td className="border px-4 py-2">{stat.specialty.name}</td>
                            <td className="border px-4 py-2">{stat.pending_count}</td>
                            <td className="border px-4 py-2">{stat.delay_count}</td>
                            <td className="border px-4 py-2">{stat.present_count}</td>
                            <td className="border px-4 py-2">{stat.completed_count}</td>
                        </tr>
                    ))}
                      <tr>
                        <td className="border px-4 py-2 font-bold">Totals</td>
                        <td className="border px-4 py-2 font-bold">{totals.total_pending}</td>
                        <td className="border px-4 py-2 font-bold">{totals.total_delay}</td>
                        <td className="border px-4 py-2 font-bold">{totals.total_present}</td>
                        <td className="border px-4 py-2 font-bold">{totals.total_completed}</td>
                    </tr>
                </tbody>
            </table>
            <br/>
            <table>
                <thead>
                    <th>
                        Number Of Patients
                    </th>
                </thead>
                <tbody>
                    <tr>
                        <td>
                            
                        {totals.totalPatients}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

export default VisitsStatistics;
