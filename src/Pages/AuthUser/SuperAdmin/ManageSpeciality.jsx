import { useContext, useEffect, useState } from "react"
import { AppContext } from "../../../Context/AppContext"
import SpecialityTable from "./Components/SpecialityTable"
import AddSpeciality from "./Components/AddSpeciality";
import AssignSpecialities from "./Components/AssignSpecialities";
const apiUrl = import.meta.env.VITE_API_URL; 

export default function ManageSpeciality() {

  const [specialities, setSpecialities] = useState([]);


  const { token } = useContext(AppContext);
  async function getSpecialites() {
    const res = await fetch(`${apiUrl}/api/specialty`, {
      headers: {

        Authorization: `Bearer ${token}`
      }
    });
    const data = await res.json();
    setSpecialities(data['specialties']);

    // console.log(data['specialties']);
  }
  useEffect(() => {
    getSpecialites();
  }, []);
  return(
    <div className="flex-grow container min-h-screen">


      <h4 className="my-6 text-xl font-bold text-black">
        Add Speciality
      </h4>
      <AddSpeciality getSpecialites={getSpecialites} />
      <hr />
      <h4 className="my-6 text-xl font-bold text-black">
        All Specialities
      </h4>
      <SpecialityTable specialities={specialities} getSpecialites={getSpecialites} />

      <hr />
      <h4 className="my-6 text-xl font-bold text-black">
        Assign Specialities
      </h4>
      <AssignSpecialities specialities={specialities} getSpecialites={getSpecialites} />

    </div>
  )
}