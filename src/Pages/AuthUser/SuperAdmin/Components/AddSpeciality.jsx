import { useContext, useEffect, useState } from "react";
import { AppContext } from '../../../../Context/AppContext';
import { useNavigate } from "react-router-dom";


export default function AddSpeciality({getSpecialites}){

    const navigate = useNavigate();
    const {token} = useContext(AppContext);
    const [FormData,setFormData] = useState({
        'name' : '',
        'duration' : 10,
        'Total_Duration' : '',
        'Addition_Capacitif':''
    });
    const [errors,setErrors] = useState({})

async function handleAddSpeciality(e){
    e.preventDefault();

    const res = await fetch('/api/specialty',{
        method : 'post',
        body: JSON.stringify(FormData),
        headers : {
            Authorization : `Bearer ${token}`
        }
    })

    const data = await res.json();
    if(res.ok){
        getSpecialites();
    }

    // console.log(data);
}
    return <>
    
    <form onSubmit={handleAddSpeciality} className="max-w-md mx-auto my-4 p-4 bg-white shadow-md rounded-lg">
    <input
        value={FormData.name}
        onChange={(e) => setFormData({...FormData, name: e.target.value})}
        type="text"
        name="name"
        placeholder="Speciality Name"
        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500 mt-2"
    />
    {errors.name && <p className="text-red-500 text-xs italic">{errors.name[0]}</p>}
    
    <input
        value={FormData.duration}
        onChange={(e) => setFormData({...FormData, duration: e.target.value})}
        type="number"
        name="duration"
        placeholder="Visit Duration"
        min="1"
        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500 mt-2"
    />
    {errors.duration && <p className="text-red-500 text-xs italic">{errors.duration[0]}</p>}
<h2>Total Duration</h2>
    <input
        value={FormData.Total_Duration}
        onChange={(e) => setFormData({...FormData, Total_Duration: e.target.value})}
        type="text"
        placeholder="Ex : 08:00:00" required pattern="\d{2}:\d{2}:\d{2}"
        name="Total_Duration"
        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500 mt-2"
    />
    <input
        value={FormData.Addition_Capacitif}
        onChange={(e) => setFormData({...FormData, Addition_Capacitif: e.target.value})}
        type="number"
        placeholder="Addition Capacitif" required
        name="Addition_Capacitif"
        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500 mt-2"
        min="0"
    />
    <button
        type="submit"
        className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg mt-4 focus:outline-none focus:shadow-outline"
    >
        Add Speciality
    </button>
</form>

    
    </>
}