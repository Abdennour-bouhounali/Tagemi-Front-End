import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoadingState } from './Components/ui';
import GuestLayout from './Pages/GuestLayout';
import { lazy, Suspense, useContext, useState } from 'react';
import { AppContext } from './Context/AppContext';
import './i18n';
import { LanguageProvider } from './Context/LanguageContext';

// Every page is its own chunk: visitors only download the screens they open
const StaffShell = lazy(() => import('./Pages/StaffShell'));
const StationsPicker = lazy(() => import('./Pages/AuthUser/CheckAdmin/StationsPicker'));
const NoEvent = lazy(() => import('./Pages/AuthUser/NoEvent'));
const Home = lazy(() => import('./Pages/GuestUser/HomePage/Home'));
const Login = lazy(() => import('./Pages/AuthUser/Auth/Login'));
const Register = lazy(() => import('./Pages/AuthUser/Auth/Register'));
const AllUsers = lazy(() => import('./Pages/AuthUser/SuperAdmin/AllUsers'));
const ManageSpeciality = lazy(() => import('./Pages/AuthUser/SuperAdmin/ManageSpeciality'));
const RegisterVisit = lazy(() => import('./Pages/AuthUser/Visits/RegisterVisit'));
const CheckPresence = lazy(() => import('./Pages/AuthUser/RecipientAdmin/CheckPresence'));
const CheckPaitent = lazy(() => import('./Pages/AuthUser/CheckAdmin/CheckPaitent'));
const DilatationRoom = lazy(() => import('./Pages/AuthUser/CheckAdmin/DilatationRoom'));
const VisitsStatistics = lazy(() => import('./Pages/AuthUser/SuperAdmin/VisitsStatistics'));
const About = lazy(() => import('./Pages/GuestUser/About'));
const Contact = lazy(() => import('./Pages/GuestUser/Contact'));
const ManageRules = lazy(() => import('./Pages/AuthUser/SuperAdmin/ManageRules'));
const ManageDoctors = lazy(() => import('./Pages/AuthUser/SuperAdmin/ManageDoctors'));
const Activities = lazy(() => import('./Pages/GuestUser/Actvities/Activities'));
const Messages = lazy(() => import('./Pages/AuthUser/SuperAdmin/Messages'));
const VolunteerForm = lazy(() => import('./Pages/GuestUser/VolunteerForm'));
const FuturProjects = lazy(() => import('./Pages/GuestUser/FuturProjects/FuturProjects'));
const ProjectDetails = lazy(() => import('./Pages/GuestUser/FuturProjects/ProjectDetails'));
const SuperAdminVolunteers = lazy(() => import('./Pages/AuthUser/SuperAdmin/SuperAdminVolunteers'));
const WaitingList = lazy(() => import('./Pages/AuthUser/WaitingList/WaitingList'));
const NotFound = lazy(() => import('./Pages/NotFound'));
const NotAuthenticated = lazy(() => import('./Pages/NotAuthenticated'));
const EventsManagement = lazy(() => import('./Pages/AuthUser/SuperAdmin/EventsManagement'));
const AddMultipleAppointments = lazy(() => import('./Pages/AuthUser/SuperAdmin/AddMultipleAppointments'));
const EventTracking = lazy(() => import('./Pages/AuthUser/SuperAdmin/EventTracking'));
const DoctorsToday = lazy(() => import('./Pages/AuthUser/SuperAdmin/DoctorsToday'));
const EventAppointmentDistribution = lazy(() => import('./Pages/AuthUser/SuperAdmin/Components/EventAppointmentDistribution'));
const SpecialtyStats = lazy(() => import('./Pages/AuthUser/SuperAdmin/ArchivedStats/SpecialtyStats'));
const StatusStats = lazy(() => import('./Pages/AuthUser/SuperAdmin/ArchivedStats/StatusStats'));
const DemographicStats = lazy(() => import('./Pages/AuthUser/SuperAdmin/ArchivedStats/DemographicStats'));
const GeographicStats = lazy(() => import('./Pages/AuthUser/SuperAdmin/ArchivedStats/GeographicStats'));
const PatientsList = lazy(() => import('./Pages/AuthUser/SuperAdmin/ArchivedStats/PatientsList'));
const ComprehensiveReport = lazy(() => import('./Pages/AuthUser/SuperAdmin/ArchivedStats/ComprehensiveReport'));
const EventReport = lazy(() => import('./Pages/AuthUser/SuperAdmin/Components/EventReport'));
const ActivityMore = lazy(() => import('./Pages/GuestUser/Actvities/Components/ActivityMore'));
const EvaluationForm = lazy(() => import('./Pages/Common/EvaluationForm'));
const EvaluationsAdmin = lazy(() => import('./Pages/AuthUser/SuperAdmin/EvaluationsAdmin'));
const EvaluationStatistics = lazy(() => import('./Pages/AuthUser/SuperAdmin/Components/EvaluationStatistics'));
const MyTurn = lazy(() => import('./Pages/GuestUser/MyTurn'));
const Privacy = lazy(() => import('./Pages/GuestUser/Privacy'));
const PatientJourney = lazy(() => import('./Pages/AuthUser/PatientJourney/PatientJourney'));

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
        <Suspense fallback={<LoadingState />}>
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
            <Route path="privacy" element={<Privacy />} />
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
              <Route path="stations/:eventId" element={guard([1, 4, 6, 8], <StationsPicker />)} />
              <Route path="no-event" element={<NoEvent />} />
              {/* Guide for every signed-in user */}
              <Route path="patient-journey" element={<PatientJourney />} />
              {/* Event Management Routes */}
              <Route path="event-tracking/:eventId" element={guard([1], <EventTracking />)} />
              <Route path="doctors-today/:eventId" element={guard([1], <DoctorsToday />)} />
              <Route path="check-presence/:eventId" element={guard([1, 3, 5], <CheckPresence />)} />
              <Route path="appointment-distribution/:eventId" element={guard([1], <EventAppointmentDistribution />)} />
              <Route path="event-statistics/:eventId" element={guard([1], <VisitsStatistics />)} />
              <Route path="event-waiting-lists/:eventId/:specialityId" element={guard([1, 4, 6, 8], <CheckPaitent />)} />
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
              <Route path="doctors" element={isSuperAdmin ? <ManageDoctors /> : <NotAuthenticated />} />
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
        </Suspense>
      </BrowserRouter>
    </LanguageProvider>
  );
}