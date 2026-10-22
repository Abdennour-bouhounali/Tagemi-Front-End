import { useParams, useNavigate } from 'react-router-dom';
import AppointmentDistribution from './AppointmentDistribution';

// Route wrapper: /admin/appointment-distribution/:eventId
const EventAppointmentDistribution = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();

  return (
    <AppointmentDistribution
      eventId={eventId}
      onClose={() => navigate(`/admin/event-tracking/${eventId}`)}
    />
  );
};

export default EventAppointmentDistribution;
