import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import StaffShell from './Pages/StaffShell';
import StationsPicker from './Pages/AuthUser/CheckAdmin/StationsPicker';
import NoEvent from './Pages/AuthUser/NoEvent';
import { LoadingState } from './Components/ui';
import GuestLayout from './Pages/GuestLayout';
import Home from './Pages/GuestUser/HomePage/Home';
import Login from './Pages/AuthUser/Auth/Login';
import Register from './Pages/AuthUser/Auth/Register';
import AllUsers from './Pages/AuthUser/SuperAdmin/AllUsers';
import { useContext, useEffect, useState } from 'react';
import { AppContext } from './Context/AppContext';
import ManageSpeciality from './Pages/AuthUser/SuperAdmin/ManageSpeciality';
import RegisterVisit from './Pages/AuthUser/Visits/RegisterVisit';
import CheckPresence from './Pages/AuthUser/RecipientAdmin/CheckPresence';
import CheckPaitent from './Pages/AuthUser/CheckAdmin/CheckPaitent';
import DilatationRoom from './Pages/AuthUser/CheckAdmin/DilatationRoom';
import './i18n';
import VisitsStatistics from './Pages/AuthUser/SuperAdmin/VisitsStatistics';
import About from './Pages/GuestUser/About';
import Contact from './Pages/GuestUser/Contact';
import ManageRules from './Pages/AuthUser/SuperAdmin/ManageRules';
import Activities from './Pages/GuestUser/Actvities/Activities';
import Messages from './Pages/AuthUser/SuperAdmin/Messages';
import VolunteerForm from './Pages/GuestUser/VolunteerForm';
import FuturProjects from './Pages/GuestUser/FuturProjects/FuturProjects';
import ProjectDetails from './Pages/GuestUser/FuturProjects/ProjectDetails';
import SuperAdminVolunteers from './Pages/AuthUser/SuperAdmin/SuperAdminVolunteers';
import WaitingList from './Pages/AuthUser/WaitingList/WaitingList';
import { LanguageProvider } from './Context/LanguageContext';
import RedirectToAppointment from './RedirectToAppointment';
import NotFound from './Pages/NotFound';
import NotAuthenticated from './Pages/NotAuthenticated';
import EventsManagement from './Pages/AuthUser/SuperAdmin/EventsManagement';
import AddMultipleAppointments from './Pages/AuthUser/SuperAdmin/AddMultipleAppointments';
import EventTracking from './Pages/AuthUser/SuperAdmin/EventTracking';
import EventAppointmentDistribution from './Pages/AuthUser/SuperAdmin/Components/EventAppointmentDistribution';
import SpecialtyStats from './Pages/AuthUser/SuperAdmin/ArchivedStats/SpecialtyStats';
import StatusStats from './Pages/AuthUser/SuperAdmin/ArchivedStats/StatusStats';
import DemographicStats from './Pages/AuthUser/SuperAdmin/ArchivedStats/DemographicStats';
import GeographicStats from './Pages/AuthUser/SuperAdmin/ArchivedStats/GeographicStats';
import PatientsList from './Pages/AuthUser/SuperAdmin/ArchivedStats/PatientsList';
import ComprehensiveReport from './Pages/AuthUser/SuperAdmin/ArchivedStats/ComprehensiveReport';
import EventReport from './Pages/AuthUser/SuperAdmin/Components/EventReport';
import ActivityMore from './Pages/GuestUser/Actvities/Components/ActivityMore';
import EvaluationForm from './Pages/Common/EvaluationForm';
import EvaluationsAdmin from './Pages/AuthUser/SuperAdmin/EvaluationsAdmin';
import EvaluationStatistics from './Pages/AuthUser/SuperAdmin/Components/EvaluationStatistics';
import MyTurn from './Pages/GuestUser/MyTurn';

export default function App() {
  const [specialities, setSpecialities] = useState([]);
  const { user, token } = useContext(AppContext);

  // Role checks (UI only — the API enforces the same rules server-side)
  const isSuperAdmin = user?.role_id === 1;
  const isSpecialAdmin = user && [1, 3].includes(user.role_id);
  const guard = (roles, element) =>
    user && roles.includes(user.role_id) ? element : <NotAuthenticated />;

  return (
    <LanguageProvider>
      <BrowserRouter>
        <Routes>
          {/* -------- Guest / Public Routes (GuestLayout) -------- */}
          <Route path="/" element={<GuestLayout />}>
            {/* Home Routes */}
            <Route index element={<Home />} />
            <Route path="home" element={<Home />} />

            {/* Public Pages */}
            <Route path="about" element={<About />} />
            <Route path="contact" element={<Contact />} />
            <Route path="volunteer" element={<VolunteerForm />} />

            {/* Activities & Projects */}
            <Route path="activities/type/:TypeId" element={<Activities />} />
            <Route path="activities/:Actvityid" element={<ActivityMore />} />
            <Route path="futureProjects" element={<FuturProjects />} />
            <Route path="future-prjects/:Projectid" element={<ProjectDetails />} />
            <Route path="waiting-list/:eventId" element={<WaitingList />} />
            <Route path="my-turn/:eventId" element={<MyTurn />} />
            {/* // Add these routes in the GuestLayout section: */}
            <Route path="evaluation/:eventId/:appointmentId" element={<EvaluationForm />} />
            <Route path="evaluation/:eventId" element={<EvaluationForm />} />

            {/* Public Appointment Booking */}
            <Route
              path="appointment/:eventID"
              element={<RegisterVisit specialities={specialities} setSpecialities={setSpecialities} />}
            />

            {/* Authentication */}
            <Route path="login" element={user ? <Navigate to="/home" replace /> : <Login />} />
            <Route path="register" element={user ? <Navigate to="/home" replace /> : <Register />} />
          </Route>

          {/* -------- Staff app (StaffShell) -------- */}
          {/* Signed in but the profile is still loading: don't flash a 404 */}
          {!user && token && <Route path="/admin/*" element={<LoadingState />} />}
          {/* Hall waiting screen shown to patients on a laptop/TV: original full-screen
              design, outside the staff shell (no tabs). Keep its UI as is. */}
          {user && <Route path="/admin/big-list-waiting/:eventId" element={guard([1, 3], <WaitingList />)} />}
          {user && (
            <Route path="/admin" element={<StaffShell />}>
              <Route path="stations/:eventId" element={guard([1, 4, 6], <StationsPicker />)} />
              <Route path="no-event" element={<NoEvent />} />
              {/* Event Management Routes */}
              <Route path="event-tracking/:eventId" element={guard([1], <EventTracking />)} />
              <Route path="check-presence/:eventId" element={guard([1, 3, 5], <CheckPresence />)} />
              <Route path="appointment-distribution/:eventId" element={guard([1], <EventAppointmentDistribution />)} />
              <Route path="event-statistics/:eventId" element={guard([1], <VisitsStatistics />)} />
              <Route path="event-waiting-lists/:eventId/:specialityId" element={guard([1, 4, 6], <CheckPaitent />)} />
              <Route path="dilatation/:eventId/:eventSpecialtyId" element={guard([1, 4], <DilatationRoom />)} />
              {/* Archived Event Statistics Routes */}
              <Route path="/admin/archived/specialty-stats/:eventId" element={guard([1], <SpecialtyStats />)} />
              <Route path="/admin/archived/status-stats/:eventId" element={guard([1], <StatusStats />)} />
              <Route path="/admin/archived/demographic-stats/:eventId" element={guard([1], <DemographicStats />)} />
              <Route path="/admin/archived/geographic-stats/:eventId" element={guard([1], <GeographicStats />)} />
              <Route path="/admin/archived/patients-list/:eventId" element={guard([1], <PatientsList />)} />
              <Route path="/admin/archived/comprehensive-report/:eventId" element={guard([1], <ComprehensiveReport />)} />


              {/* Super Admin Only Routes */}
              <Route path="users" element={isSuperAdmin ? <AllUsers /> : <NotAuthenticated />} />
              <Route path="speciality" element={isSuperAdmin ? <ManageSpeciality /> : <NotAuthenticated />} />
              <Route path="statistics" element={isSuperAdmin ? <VisitsStatistics /> : <NotAuthenticated />} />
              <Route path="rules" element={isSuperAdmin ? <ManageRules /> : <NotAuthenticated />} />
              <Route path="manage-events" element={isSuperAdmin ? <EventsManagement /> : <NotAuthenticated />} />
              <Route path="contacts" element={isSuperAdmin ? <Messages /> : <NotAuthenticated />} />
              <Route path="volunteers" element={isSuperAdmin ? <SuperAdminVolunteers /> : <NotAuthenticated />} />
              <Route path="evaluations" element={isSuperAdmin ? <EvaluationsAdmin /> : <NotAuthenticated />} />
              <Route path="evaluation_stats/:eventId" element={isSuperAdmin ? <EvaluationStatistics /> : <NotAuthenticated />} />
              <Route path="/admin/event-report/:eventId" element={guard([1], <EventReport />)} />

              {/* Special Admin Routes */}
              <Route path="add-multiple-appointments" element={isSpecialAdmin ? <AddMultipleAppointments /> : <NotAuthenticated />} />
            </Route>
          )}

          {/* Fallback - 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  );
}