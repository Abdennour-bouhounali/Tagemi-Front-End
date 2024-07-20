import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../../Context/AppContext';
import logo from './tagemi_logo.png';
import { useTranslation } from 'react-i18next';
// import backgroundImage from './tagemi_consept.png'; // Import your background image

const RegisterVisit = ({ setSpecialities, specialities }) => {
  const { token } = useContext(AppContext);
  const { t } = useTranslation();
  const [message, setMessage] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [minTime, setMinTime] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    specialties: [{ specialty_id: '' }],
  });

  async function getSpecialites() {
    const res = await fetch("/api/specialty", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const data = await res.json();
    setSpecialities(data['specialties']);
  }

  useEffect(() => {
    getSpecialites();
  }, []);

  const handleAddSpecialty = () => {
    // Limit to maximum two specialties
    if (formData.specialties.length < 2) {
      setFormData({
        ...formData,
        specialties: [...formData.specialties, { specialty_id: '' }],
      });
    }
  };

  const handleChange = (index, event) => {
    const updatedSpecialties = formData.specialties.map((specialty, i) =>
      index === i ? { ...specialty, [event.target.name]: event.target.value } : specialty
    );
    setFormData({ ...formData, specialties: updatedSpecialties });
  };

  const handleChangeName = (event) => {
    setFormData({ ...formData, name: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    console.log(formData);
    const res = await fetch('/api/appointment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(formData),
    });
    const data = await res.json();
    console.log(data);

    if (res.ok) {
      console.log(data);
      setAppointments(data['appointments']);
      setMinTime(data['minTime']);
      console.log(minTime);
      setFormData({
        name: '',
        specialties: [{ specialty_id: '' }],
      });

      setMessage(data['message']);
    }
    setTimeout(() => {
      setMessage(null);
    }, 5000);
  };

  const isFormValid = formData.name && formData.specialties.every(specialty => specialty.specialty_id);

  return (
    <div className="w-full ml-0 mt-18 " id="RegisterVisit">

    <div className=" max-w-fit mx-auto bg-opacity-95 bg-[#EEEDEB] px-8 py-10 mt-36" >
      {/* Picture and Title */}
      <div className="flex items-center justify-center mb-8">
        <div className="text-center">
          <img src={logo} alt="Appointment Form" className="h-44 w-auto mb-4 mx-auto" />
          <h1 className="text-2xl font-bold text-[#2F3645]">Book a Medical Appointment</h1>
        </div>
      </div>

      {/* Success Message */}
      {message && (
        <div className="flex items-center p-4 mb-4 text-sm text-[#2F3645] border border-green-300 rounded-lg bg-[#EEEDEB]" role="alert">
          <svg className="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
          </svg>
          <span className="sr-only">Info</span>
          <div>
            <span className="font-medium">{message}, Come at <span className='font-bold'> {minTime}</span></span>
          </div>
        </div>
      )}

      {/* Appointment Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-gray-700">Name</label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={handleChangeName}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            placeholder="Enter your name"
            required
          />
        </div>
        {formData.specialties.map((specialty, index) => (
          <div key={index} className="flex space-x-4 items-end">
            <div>
              <label htmlFor={`specialty_id_${index}`} className="block text-gray-700">Specialty Name</label>
              <div className="relative">
                <select
                  id={`specialty_id_${index}`}
                  required
                  name="specialty_id"
                  value={specialty.specialty_id}
                  onChange={(event) => handleChange(index, event)}
                  className="block appearance-none w-full bg-[#EEEDEB] border border-[#2F3645] hover:border-[#131842] px-4 py-2 pr-8 rounded-md shadow-sm focus:outline-none focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                >
                  <option value="">Select a specialty</option>
                  {specialities
                    .filter(specialitie => specialitie.id !== 6)
                    .map((specialitie) => (
                      <option key={specialitie.id} value={specialitie.id} className="text-[#2F3645]">
                        {specialitie.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>
            {/* Conditionally render Add Specialty button */}
            {index === formData.specialties.length - 1 && formData.specialties.length < 2 && (
              <button
                type="button"
                onClick={handleAddSpecialty}
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              >
                Add Specialty
              </button>
            )}
          </div>
        ))}
        <div className="flex justify-center min-w-max">
          <button
            type="submit"
            className={`bg-blue-500 w-full hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ${!isFormValid ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={!isFormValid}
          >
            {t('Book')}
          </button>
        </div>
      </form>
    </div>
    </div>

  );
};

export default RegisterVisit;
