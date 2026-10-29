import { API_BASE_URL } from '../../../config/environment';
import { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppContext } from '../../../Context/AppContext';
import { LoadingState, useToast } from '../../../Components/ui';
import QueueOpening from './Components/QueueOpening';

const apiUrl = API_BASE_URL;

/** «أدوات اليوم» › الأطباء والطوابير: doctors' arrival/departure for one event. */
export default function DoctorsToday() {
  const { eventId } = useParams();
  const { token } = useContext(AppContext);
  const toast = useToast();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);

  useEffect(() => {
    fetch(`${apiUrl}/api/events/${eventId}`, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } })
      .then((res) => res.json().then((json) => {
        if (res.ok) setEvent(json.event || json);
        else toast(json.message || 'تعذر تحميل الحدث', 'error');
      }))
      .catch(() => toast('تعذر الاتصال بالخادم', 'error'));
  }, [eventId, token, toast]);

  if (!event) return <LoadingState />;

  return (
    <QueueOpening
      event={event}
      backLabel="متابعة الحدث"
      onClose={() => navigate(`/admin/event-tracking/${eventId}`)}
    />
  );
}
