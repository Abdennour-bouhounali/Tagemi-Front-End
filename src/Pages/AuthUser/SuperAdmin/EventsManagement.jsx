import { useCallback, useContext, useEffect, useState } from 'react';
import { AppContext } from '../../../Context/AppContext';
import { useToast } from '../../../Components/ui';
import Events from './Components/Events';
import AddEvent from './Components/AddEvent';

const apiUrl = import.meta.env.VITE_API_URL;

// Super admin home (first tab "الأحداث"): the events list, or the new-event form.
// The appointment distribution has its own route (/admin/appointment-distribution/:eventId).
export default function EventsManagement() {
  const { token } = useContext(AppContext);
  const toast = useToast();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const getEvents = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/api/events`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setEvents(data.events || []);
      else toast(data.message || 'تعذر تحميل الأحداث', 'error');
    } catch {
      toast('تعذر الاتصال بالخادم، تحقق من الشبكة', 'error');
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

  useEffect(() => {
    getEvents();
  }, [getEvents]);

  if (adding) {
    return <AddEvent getEvents={getEvents} onClose={() => { setAdding(false); window.scrollTo({ top: 0 }); }} />;
  }

  return <Events events={events} getEvents={getEvents} loading={loading} onAdd={() => setAdding(true)} />;
}
