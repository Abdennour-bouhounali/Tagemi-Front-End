import { useContext, useEffect, useState } from "react"
import { AppContext } from "../../../Context/AppContext"
import Events from "./Components/Events"
import AddEvent from "./Components/AddEvent"
import AppointmentDistribution from "./Components/AppointmentDistribution"

const apiUrl = import.meta.env.VITE_API_URL; 

export default function EventsManagement() {
  const [events, setEvents] = useState([]);
  const [selectedEventForDistribution, setSelectedEventForDistribution] = useState(null);
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

  return(
    <div className="flex-grow container min-h-screen">
      <AddEvent getEvents={getEvents} />
      
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
    </div>
  )
}