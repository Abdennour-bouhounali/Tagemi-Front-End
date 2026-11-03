import { Navigate, useParams } from 'react-router-dom';

// Old route /admin/appointment-distribution/:eventId: the distribution now lives
// in the "before the event" tab of the event statistics page.
const EventAppointmentDistribution = () => {
  const { eventId } = useParams();
  return <Navigate to={`/admin/event-statistics/${eventId}?phase=before`} replace />;
};

export default EventAppointmentDistribution;
