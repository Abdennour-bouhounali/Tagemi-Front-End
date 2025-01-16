import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from "../../../Context/AppContext";
const apiUrl = import.meta.env.VITE_API_URL;

const VisitsStatistics = () => {
    const [statistics, setStatistics] = useState([]);
    const { token } = useContext(AppContext);
    const [totals, setTotals] = useState({});
    const [residence_counts, setResidence_counts] = useState([]);

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
        setStatistics(data.statistics);
        setTotals(data.totals);
        setResidence_counts(data.residence_counts);
        console.log(data);
    }

    return (
        <div className='flex-grow container min-h-screen font-droid-arabic-kufi'>
            {/* Specialty Statistics Table */}
            <table className="table-auto my-7 text-center">
                <thead>
                    <tr>
                        <th>التخصصص</th>

                        <th>لم يأتوا بعد</th>
                        <th>عدد المتأخرين</th>
                        <th>حاضرون</th>
                        <th>أنهو الفحص</th>
                        <th>في الإحتياط</th>
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
                            <td className="border px-4 py-2">{stat.waiting_list}</td>
                        </tr>
                    ))}
                    <tr>
                        <td className="border px-4 py-2 font-bold">المجموع</td>
                        <td className="border px-4 py-2 font-bold">{totals.total_pending}</td>
                        <td className="border px-4 py-2 font-bold">{totals.total_delay}</td>
                        <td className="border px-4 py-2 font-bold">{totals.total_present}</td>
                        <td className="border px-4 py-2 font-bold">{totals.total_completed}</td>
                        <td className="border px-4 py-2 font-bold">{totals.totalWaiting_list}</td>
                    </tr>
                </tbody>
            </table>

            {/* Additional Statistics */}
            <div className="mt-5">
                <h2 className="text-xl font-bold mb-4">إحصائيات عامة</h2>
                <table className="table-auto w-full text-center">
                    <thead>
                        <tr>
                            <th className="border px-4 py-2">الفئة</th>
                            <th className="border px-4 py-2">المجموع</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="border px-4 py-2"> المسجلون</td>
                            <td className="border px-4 py-2">{totals.total_patients}</td>
                        </tr>
                        <tr>
                            <td className="border px-4 py-2">الذكور</td>
                            <td className="border px-4 py-2">{totals.total_males}</td>
                        </tr>
                        <tr>
                            <td className="border px-4 py-2">الإناث</td>
                            <td className="border px-4 py-2">{totals.total_females}</td>
                        </tr>
                        <tr>
                            <td className="border px-4 py-2">الأطفال</td>
                            <td className="border px-4 py-2">{totals.total_children_under_10}</td>
                        </tr>
                    </tbody>
                </table>
                <div className="mt-5">
                    <h2 className="text-xl font-bold mb-4">إحصائيات حسب القصر</h2>
                    <table className="table-auto w-full text-center">
                        <thead>
                            <tr>
                                <th className="border px-4 py-2">القصر</th>
                                <th className="border px-4 py-2">العدد</th>
                            </tr>
                        </thead>
                        <tbody>
                            {residence_counts.map((residence) => (
                                <tr key={residence.residence}>
                                    <td className="border px-4 py-2">
                                        {
                                            {
                                                tajnint: 'تجنينت',
                                                bonora: 'آت بونور',
                                                taghardait: 'تغردايت',
                                                yazgan: 'آت يزجن',
                                                mlichat: 'آت مليشت',
                                                karara: 'القرارة',
                                                berian: 'بريان',
                                                warjlan: 'وارجلان'
                                            }[residence.residence] || 'غير معروف' // Fallback for unknown values
                                        }
                                    </td>
                                    <td className="border px-4 py-2">{residence.count}</td>

                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
};

export default VisitsStatistics;
