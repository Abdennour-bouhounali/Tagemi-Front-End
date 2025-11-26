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
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
  };

  const handleCloseDistribution = () => {
    setSelectedEventForDistribution(null);
    // Restore body scroll
    document.body.style.overflow = 'unset';
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
      {/* Header with Add Button - Mobile Responsive */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6 px-3 sm:px-4 pt-4 sm:pt-6">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 font-droid-arabic-kufi">
          إدارة الأحداث
        </h1>
        <button
          onClick={handleOpenAddEvent}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 
                     text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl 
                     hover:from-indigo-700 hover:to-purple-700 
                     transition-all duration-300 shadow-lg hover:shadow-xl 
                     transform hover:-translate-y-0.5 active:translate-y-0
                     font-droid-arabic-kufi text-sm sm:text-base"
        >
          <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
          <span>إضافة حدث جديد</span>
        </button>
      </div>

      <Events 
        events={events} 
        getEvents={getEvents}
        onViewDistribution={handleViewDistribution}
      />

      {/* Appointment Distribution Modal - Mobile Responsive */}
      {selectedEventForDistribution && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={handleCloseDistribution}
          />
          
          {/* Modal Container - Full screen on mobile, centered on desktop */}
          <div className="relative w-full h-full sm:h-auto sm:max-w-6xl sm:max-h-[90vh] 
                          bg-white sm:rounded-2xl shadow-2xl overflow-hidden
                          animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Modal Header - Sticky */}
            <div className="sticky top-0 z-10 bg-gradient-to-r from-indigo-600 to-purple-600 
                            px-3 sm:px-6 py-3 sm:py-4 flex justify-between items-center
                            shadow-lg">
              <h2 className="text-base sm:text-xl font-bold text-white font-droid-arabic-kufi">
                توزيع المواعيد
              </h2>
              <button
                onClick={handleCloseDistribution}
                className="text-white/80 hover:text-white hover:bg-white/20 
                           p-1.5 sm:p-2 rounded-lg transition-all duration-200
                           flex-shrink-0"
                title="إغلاق"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
            
            {/* Modal Content - Scrollable */}
            <div className="overflow-y-auto h-[calc(100vh-56px)] sm:h-auto sm:max-h-[calc(90vh-72px)]">
              <AppointmentDistribution
                eventId={selectedEventForDistribution.id}
                onClose={handleCloseDistribution}
              />
            </div>
          </div>
        </div>
      )}

      {/* Add Event Modal - Mobile Responsive */}
      {isAddEventOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={handleCloseAddEvent}
          />
          
          {/* Modal Container - Full screen on mobile, with margins on desktop */}
          <div className="relative w-full h-full sm:h-auto sm:max-w-5xl sm:max-h-[95vh] 
                          overflow-y-auto sm:mt-4 sm:mb-4 sm:mx-4 
                          bg-gray-50 sm:rounded-2xl shadow-2xl
                          animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Modal Header - Sticky */}
            <div className="sticky top-0 z-10 bg-gradient-to-r from-indigo-600 to-purple-600 
                            px-3 sm:px-6 py-3 sm:py-4 sm:rounded-t-2xl 
                            flex justify-between items-center shadow-lg">
              <h2 className="text-base sm:text-xl font-bold text-white font-droid-arabic-kufi 
                             flex items-center gap-2">
                <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
                إضافة حدث جديد
              </h2>
              <button
                onClick={handleCloseAddEvent}
                className="text-white/80 hover:text-white hover:bg-white/20 
                           p-1.5 sm:p-2 rounded-lg transition-all duration-200
                           flex-shrink-0"
                title="إغلاق"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="p-3 sm:p-6">
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