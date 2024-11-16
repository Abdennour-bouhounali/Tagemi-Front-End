import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
const apiUrl = import.meta.env.VITE_API_URL; 

const Volunteers = () => {
  const [volunteers, setVolunteers] = useState([]);
  const [expandedRows, setExpandedRows] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [filteredVolunteers, setFilteredVolunteers] = useState([]);
  const [states, setStates] = useState([]);

  useEffect(() => {
    fetch(`${apiUrl}/api/volunteers`)
      .then(response => response.json())
      .then(data => {
        setVolunteers(data);
        setFilteredVolunteers(data);
        // Extract unique states for filtering
        const uniqueStates = [...new Set(data.map(v => v.state))];
        setStates(uniqueStates);
      })
      .catch(error => console.error('Error fetching volunteers:', error));
  }, []);

  useEffect(() => {
    filterVolunteers();
  }, [searchTerm, stateFilter]);

  const filterVolunteers = () => {
    const filtered = volunteers.filter(volunteer =>
      volunteer.full_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (stateFilter === '' || volunteer.state === stateFilter)
    );
    setFilteredVolunteers(filtered);
  };

  const toggleRow = (volunteerId) => {
    setExpandedRows(prevState => ({
      ...prevState,
      [volunteerId]: !prevState[volunteerId],
    }));
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleStateChange = (e) => {
    setStateFilter(e.target.value);
  };

  const handleDelete = (id) => {
    fetch(`${apiUrl}/api/volunteers/${id}`, {
      method: 'DELETE',
    })
    .then(() => {
      setVolunteers(volunteers.filter(volunteer => volunteer.id !== id));
      setFilteredVolunteers(filteredVolunteers.filter(volunteer => volunteer.id !== id));
    })
    .catch(error => console.error('Error deleting volunteer:', error));
  };

  const handleDownloadExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredVolunteers);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Volunteers');
    XLSX.writeFile(wb, 'volunteers.xlsx');
  };

  return (
    <div className="container min-h-screen">
      <div className="flex my-4">
        <input
          type="text"
          placeholder="Search by full name..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="search-bar mr-4"
        />
        <select
          value={stateFilter}
          onChange={handleStateChange}
          className="search-bar mx-6 px-3"
        >
          <option value="">كل الولايات</option>
          {states.map(state => (
            <option key={state} value={state}>{state}</option>
          ))}
        </select>
        <button onClick={handleDownloadExcel} className="mx-4 px-4 py-2 bg-blue-500 text-sm text-nowrap text-white rounded">Download Excel</button>
      </div>

      <table className="table-auto my-7 text-center">
        <thead>
          <tr>
            <th>Full Name</th>
            <th>Phone Number</th>
            <th>Email Address</th>
            <th>City</th>
            <th>State</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredVolunteers.map(volunteer => (
            <React.Fragment key={volunteer.id}>
              <tr onClick={() => toggleRow(volunteer.id)} className="cursor-pointer">
                <td>{volunteer.full_name}</td>
                <td>{volunteer.phone_number}</td>
                <td>{volunteer.email_address}</td>
                <td>{volunteer.city}</td>
                <td>{volunteer.state}</td>
                <td>
                  <button
                    onClick={() => handleDelete(volunteer.id)}
                    className="px-2 py-1 bg-red-500 text-white rounded"
                  >
                    Delete
                  </button>
                </td>
              </tr>
              {expandedRows[volunteer.id] && (
                <tr className="bg-gray-100">
                  <td colSpan="6">
                    <div>
                      <p><strong>Date of Birth:</strong> {volunteer.date_of_birth}</p>
                      <p><strong>Gender:</strong> {volunteer.gender}</p>
                      <p><strong>Relevant Skills:</strong> {volunteer.relevant_skills}</p>
                      <p><strong>Previous Volunteering Experience:</strong> {volunteer.previous_volunteering_experience}</p>
                      <p><strong>Professional Background:</strong> {volunteer.professional_background}</p>
                      <p><strong>Areas of Interest:</strong> {volunteer.areas_of_interest}</p>
                      <p><strong>Preferred Types of Activities:</strong> {volunteer.preferred_types_of_activities}</p>
                      <p><strong>Reasons for Volunteering:</strong> {volunteer.reasons_for_volunteering}</p>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Volunteers;
