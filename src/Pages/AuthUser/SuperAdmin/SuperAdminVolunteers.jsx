import { API_BASE_URL } from '../../../config/environment';
import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { useTranslation } from 'react-i18next';

const apiUrl = API_BASE_URL;

const Volunteers = () => {
  const { t } = useTranslation();
  const [volunteers, setVolunteers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [filteredVolunteers, setFilteredVolunteers] = useState([]);
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);

  useEffect(() => {
    fetchVolunteers();
  }, []);

  const fetchVolunteers = () => {
    setLoading(true);
    fetch(`${apiUrl}/api/volunteers`)
      .then(response => response.json())
      .then(data => {
        setVolunteers(data);
        setFilteredVolunteers(data);
        const uniqueStates = [...new Set(data.map(v => v.state))];
        setStates(uniqueStates);
      })
      .catch(error => console.error('Error fetching volunteers:', error))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    filterVolunteers();
  }, [searchTerm, stateFilter, volunteers]);

  const filterVolunteers = () => {
    const filtered = volunteers.filter(volunteer =>
      volunteer.full_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (stateFilter === '' || volunteer.state === stateFilter)
    );
    setFilteredVolunteers(filtered);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleStateChange = (e) => {
    setStateFilter(e.target.value);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStateFilter('');
  };

  const handleDelete = (id) => {
    fetch(`${apiUrl}/api/volunteers/${id}`, {
      method: 'DELETE',
    })
      .then(() => {
        setVolunteers(volunteers.filter(volunteer => volunteer.id !== id));
        setFilteredVolunteers(filteredVolunteers.filter(volunteer => volunteer.id !== id));
        setDeleteConfirm(null);
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
    <div className="w-full max-w-7xl mx-auto py-8 px-4">
      <div className="w-full">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Volunteers Management</h1>
          <p className="text-gray-600">View and manage all registered volunteers</p>
        </div>

        {/* Filters Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Search by Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Enter volunteer name..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full px-4 py-3 pl-10 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                />
                <svg className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Filter by State
              </label>
              <select
                value={stateFilter}
                onChange={handleStateChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors bg-white"
              >
                <option value="">كل الولايات</option>
                {states.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              {(searchTerm || stateFilter) && (
                <button
                  onClick={clearFilters}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-all transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-gray-400 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Clear
                </button>
              )}

              <button
                onClick={handleDownloadExcel}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-lg transition-all transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 shadow-md flex items-center gap-2 whitespace-nowrap"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download Excel
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing <span className="font-semibold text-gray-900">{filteredVolunteers.length}</span> of <span className="font-semibold text-gray-900">{volunteers.length}</span> volunteers
            </div>
            {(searchTerm || stateFilter) && (
              <div className="text-sm text-blue-600 font-medium">
                Active filters applied
              </div>
            )}
          </div>
        </div>

        {/* Volunteers Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {loading ? (
            <div className="text-center py-20">
              <svg className="animate-spin h-10 w-10 mx-auto text-blue-500 mb-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-gray-500 text-lg">Loading volunteers...</p>
            </div>
          ) : filteredVolunteers.length === 0 ? (
            <div className="text-center py-20">
              <svg className="w-20 h-20 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-gray-500 text-lg mb-2">No volunteers found</p>
              <p className="text-gray-400">No volunteers match your search criteria</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-50 to-blue-100 border-b-2 border-blue-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Full Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Phone Number</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Email Address</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">City</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">State</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredVolunteers.map((volunteer, index) => (
                    <tr
                      key={volunteer.id}
                      className={`hover:bg-gray-50 transition-colors cursor-pointer ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                        }`}
                      onClick={() => setSelectedVolunteer(volunteer)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold mr-3">
                            {volunteer.full_name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-gray-800">{volunteer.full_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 font-mono">{volunteer.phone_number}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{volunteer.email_address}</td>
                      <td className="px-6 py-4 text-sm text-gray-800">{volunteer.city}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                          {volunteer.state}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setSelectedVolunteer(volunteer)}
                            className="inline-flex items-center gap-1 px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold rounded-lg transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(volunteer.id)}
                            className="inline-flex items-center gap-1 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-semibold rounded-lg transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Volunteer Details Modal */}
      {selectedVolunteer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setSelectedVolunteer(null)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto transform animate-scale-in" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-16 h-16 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-2xl font-bold mr-4">
                    {selectedVolunteer.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{selectedVolunteer.full_name}</h2>
                    <p className="text-blue-100">{selectedVolunteer.email_address}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedVolunteer(null)}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Basic Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">Phone Number</label>
                      <p className="text-gray-800 font-mono">{selectedVolunteer.phone_number}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">Date of Birth</label>
                      <p className="text-gray-800">{selectedVolunteer.date_of_birth}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">Gender</label>
                      <p className="text-gray-800">{selectedVolunteer.gender}</p>
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Location
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">City</label>
                      <p className="text-gray-800">{selectedVolunteer.city}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">State</label>
                      <p className="text-gray-800">{selectedVolunteer.state}</p>
                    </div>
                  </div>
                </div>

                {/* Skills & Experience */}
                <div className="bg-gray-50 rounded-lg p-4 md:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                    Skills & Experience
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">Relevant Skills</label>
                      <p className="text-gray-800">{selectedVolunteer.relevant_skills || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">Previous Volunteering Experience</label>
                      <p className="text-gray-800">{selectedVolunteer.previous_volunteering_experience || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">Professional Background</label>
                      <p className="text-gray-800">{selectedVolunteer.professional_background || 'Not specified'}</p>
                    </div>
                  </div>
                </div>

                {/* Interests & Preferences */}
                <div className="bg-gray-50 rounded-lg p-4 md:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    Interests & Preferences
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">Areas of Interest</label>
                      <p className="text-gray-800">{selectedVolunteer.areas_of_interest || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">Preferred Types of Activities</label>
                      <p className="text-gray-800">{selectedVolunteer.preferred_types_of_activities || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">Reasons for Volunteering</label>
                      <p className="text-gray-800">{selectedVolunteer.reasons_for_volunteering || 'Not specified'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 p-6 flex justify-end gap-3">
              <button
                onClick={() => setSelectedVolunteer(null)}
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 transform animate-scale-in">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Volunteer</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-gray-600 mb-6">Are you sure you want to permanently delete this volunteer?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Volunteers;