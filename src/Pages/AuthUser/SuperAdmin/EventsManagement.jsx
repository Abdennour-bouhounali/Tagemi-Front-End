import { useContext, useEffect, useState } from "react";
import { AppContext } from "../../../Context/AppContext";
import Events from "./Components/Events";
import AddEvent from "./Components/AddEvent";
import AppointmentDistribution from "./Components/AppointmentDistribution";
import { Plus, X, FileText } from "lucide-react";
import { API_BASE_URL } from '../../../config/environment';
import { Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';

const apiUrl = API_BASE_URL;

export default function EventsManagement() {
  const [events, setEvents] = useState([]);
  const [selectedEventForDistribution, setSelectedEventForDistribution] = useState(null);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const { token } = useContext(AppContext);
  const { t } = useTranslation();

  async function getEvents() {
    const res = await fetch(`${apiUrl}/api/events`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    setEvents(data["events"]);
  }

  useEffect(() => {
    getEvents();
  }, []);

  const handleViewDistribution = (event) => {
    setSelectedEventForDistribution(event);
    document.body.style.overflow = "hidden";
  };

  const handleCloseDistribution = () => {
    setSelectedEventForDistribution(null);
    document.body.style.overflow = "unset";
  };

  const handleOpenAddEvent = () => {
    setIsAddEventOpen(true);
    document.body.style.overflow = "hidden";
  };

  const handleCloseAddEvent = () => {
    setIsAddEventOpen(false);
    document.body.style.overflow = "unset";
  };

  const handleEventCreated = async () => {
    await getEvents();
  };

  return (
    <div className="flex-grow container mx-auto min-h-screen px-4 py-6 font-droid-arabic-kufi">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            {t('admin.eventsManagement')}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {t('admin.viewManageEvents')}
          </p>
        </div>

        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <Link
            to={`/admin/evaluations`}
            className="flex-1 md:flex-none justify-center items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 rounded-lg text-sm font-medium transition-all shadow-sm"
          >
            <FileText className="w-4 h-4" />
            <span>{t('admin.eventEvaluation')}</span>
          </Link>

          <button
            onClick={handleOpenAddEvent}
            className="flex-1 md:flex-none justify-center items-center gap-2 px-5 py-2.5 bg-gray-900 text-white hover:bg-gray-800 rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{t('admin.addNewEvent')}</span>
          </button>
        </div>
      </div>

      <Events
        events={events}
        getEvents={getEvents}
        onViewDistribution={handleViewDistribution}
      />

      {/* Appointment Distribution Modal */}
      {selectedEventForDistribution && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={handleCloseDistribution}
          />
          <div className="relative w-full h-full sm:h-auto sm:max-w-6xl sm:max-h-[90vh] bg-white sm:rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
              <h2 className="text-lg font-bold text-gray-800">
                {t('admin.appointmentDistribution')}
              </h2>
              <button
                onClick={handleCloseDistribution}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-0 sm:p-0">
              <AppointmentDistribution
                eventId={selectedEventForDistribution.id}
                onClose={handleCloseDistribution}
              />
            </div>
          </div>
        </div>
      )}

      {/* Add Event Modal */}
      {isAddEventOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={handleCloseAddEvent}
          />
          <div className="relative w-full h-full sm:h-auto sm:max-w-5xl sm:max-h-[90vh] bg-white sm:rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Plus className="w-5 h-5 text-gray-700" />
                </div>
                <h2 className="text-lg font-bold text-gray-800">
                  {t('admin.addNewEvent')}
                </h2>
              </div>
              <button
                onClick={handleCloseAddEvent}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto bg-gray-50/50 p-4 sm:p-6">
              <AddEvent
                getEvents={handleEventCreated}
                onClose={handleCloseAddEvent}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}