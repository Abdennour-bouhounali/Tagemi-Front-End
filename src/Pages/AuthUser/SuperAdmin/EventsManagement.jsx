import { useContext, useEffect, useState } from "react";
import { AppContext } from "../../../Context/AppContext";
import Events from "./Components/Events";
import AddEvent from "./Components/AddEvent";

const apiUrl = import.meta.env.VITE_API_URL;

export default function EventsManagement() {
  const [events, setEvents] = useState([]);
  const { token } = useContext(AppContext);

  async function getEvents() {
    const res = await fetch(`${apiUrl}/api/events`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setEvents(data["events"]);
  }

  useEffect(() => {
    getEvents();
  }, []);

  async function getEvents() {
    const res = await fetch(`${apiUrl}/api/events`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setEvents(data["events"]);
  }

  useEffect(() => {
    getEvents();
  }, []);

  return (
    <div className="flex-grow container min-h-screen text-nowrap">
      <h4 className="mb-6 text-xl font-bold text-black font-droid-arabic-kufi mt-4">
        إضافة حدث
      </h4>
      <AddEvent events={events} getEvents={getEvents} />

      <h4 className="mb-6 text-xl font-bold text-black font-droid-arabic-kufi mt-4">
        كل الأحداث
      </h4>
      <Events events={events} getEvents={getEvents} />
    </div>
  );
}
