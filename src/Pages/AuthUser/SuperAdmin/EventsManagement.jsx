import { API_BASE_URL } from '../../../config/environment';
import { useCallback, useContext, useEffect, useState } from 'react';
import { AppContext } from '../../../Context/AppContext';
import { useToast } from '../../../Components/ui';
import Events from './Components/Events';
import AddEvent from './Components/AddEvent';
import EventDrafts from './Components/EventDrafts';

const apiUrl = API_BASE_URL;

// Super admin home (first tab "الأحداث"): the events list with the unfinished
// drafts, or the new-event form. The appointment distribution has its own
// route (/admin/appointment-distribution/:eventId).
export default function EventsManagement() {
  const { token } = useContext(AppContext);
  const toast = useToast();
  const [events, setEvents] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(null); // { draftId } while the form is open; null draftId = new

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

  const getDrafts = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/api/event-drafts`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setDrafts((await res.json()).drafts || []);
    } catch {
      // The events list matters more; drafts show on the next visit
    }
  }, [token]);

  const deleteDraft = async (id) => {
    try {
      const res = await fetch(`${apiUrl}/api/event-drafts/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok || res.status === 404) {
        setDrafts((prev) => prev.filter((d) => d.id !== id));
        toast('حُذفت المسودة');
      } else {
        toast('تعذر حذف المسودة، أعد المحاولة', 'error');
      }
    } catch {
      toast('تعذر الاتصال بالخادم، تحقق من الشبكة', 'error');
    }
  };

  useEffect(() => {
    getEvents();
    getDrafts();
  }, [getEvents, getDrafts]);

  if (adding) {
    return (
      <AddEvent
        key={adding.draftId ?? 'new'}
        draftId={adding.draftId}
        getEvents={getEvents}
        onClose={() => { setAdding(null); getDrafts(); window.scrollTo({ top: 0 }); }}
      />
    );
  }

  return (
    <Events
      events={events}
      getEvents={getEvents}
      loading={loading}
      onAdd={() => setAdding({ draftId: null })}
      drafts={<EventDrafts drafts={drafts} onResume={(id) => setAdding({ draftId: id })} onDelete={deleteDraft} />}
    />
  );
}
