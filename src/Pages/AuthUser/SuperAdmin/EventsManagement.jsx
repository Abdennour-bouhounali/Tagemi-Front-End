import { useContext, useEffect, useState } from "react"
import { AppContext } from "../../../Context/AppContext"
import Events from "./Components/Events"
import AddEvent from "./Components/AddEvent"
import AppointmentDistribution from "./Components/AppointmentDistribution"
import { Plus, X } from "lucide-react"

const apiUrl = import.meta.env.VITE_API_URL; 

export default function EventsManagement() {
  const [events, setEvents] = useState([]);
  const [selectedEventForDistribution, setSelectedEventForDistribution] = useState(null);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const { token } = useContext(AppContext);
  
  async function getEvents() {
    const res = await fetch(`${apiUrl}/api/events`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const data = await res.json();
    setEvents(data['events']);
    console.log(data['events']);
  }
  
  useEffect(() => {
    getEvents();
  }, []);

  const handleViewDistribution = (event) => {
    setSelectedEventForDistribution(event);
  };

  const handleCloseDistribution = () => {
    setSelectedEventForDistribution(null);
  };

  const handleOpenAddEvent = () => {
    setIsAddEventOpen(true);
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
  };

  const handleCloseAddEvent = () => {
    setIsAddEventOpen(false);
    // Restore body scroll
    document.body.style.overflow = 'unset';
  };

  // Handle successful event creation
  const handleEventCreated = async () => {
    await getEvents();
    // Don't close automatically - let user see credentials if any
  };

  return(
    <div className="flex-grow container min-h-screen">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center mb-6 px-4 pt-6">
        <h1 className="text-2xl font-bold text-gray-800 font-droid-arabic-kufi">
          إدارة الأحداث
        </h1>
        <button
          onClick={handleOpenAddEvent}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 
                     text-white px-6 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 
                     transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5
                     font-droid-arabic-kufi"
        >
          <Plus size={22} />
          <span>إضافة حدث جديد</span>
        </button>
      </div>

      <Events 
        events={events} 
        getEvents={getEvents}
        onViewDistribution={handleViewDistribution}
      />

      {/* Appointment Distribution Modal */}
      {selectedEventForDistribution && (
        <AppointmentDistribution
          eventId={selectedEventForDistribution.id}
          onClose={handleCloseDistribution}
        />
      )}

      {/* Add Event Modal */}
      {isAddEventOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={handleCloseAddEvent}
          />
          
          {/* Modal Container */}
          <div className="relative w-full max-w-5xl max-h-[95vh] overflow-y-auto 
                          mt-4 mb-4 mx-4 bg-gray-50 rounded-2xl shadow-2xl
                          animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 bg-gradient-to-r from-indigo-600 to-purple-600 
                            px-6 py-4 rounded-t-2xl flex justify-between items-center">
              <h2 className="text-xl font-bold text-white font-droid-arabic-kufi flex items-center gap-2">
                <Plus size={24} />
                إضافة حدث جديد
              </h2>
              <button
                onClick={handleCloseAddEvent}
                className="text-white/80 hover:text-white hover:bg-white/20 
                           p-2 rounded-lg transition-all duration-200"
                title="إغلاق"
              >
                <X size={24} />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="p-6">
              <AddEvent 
                getEvents={handleEventCreated}
                onClose={handleCloseAddEvent}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}