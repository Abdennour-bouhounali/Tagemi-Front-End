import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './Pages/AdminLayout';
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
import Settings from './Pages/AuthUser/SuperAdmin/Settings';
import './i18n';
import SpecialCase from './Pages/AuthUser/SpecialCaseAdmin/SpecialCase';
import VisitsStatistics from './Pages/AuthUser/SuperAdmin/VisitsStatistics';
import About from './Pages/GuestUser/About';
import Contact from './Pages/GuestUser/Contact';
import Events from './Pages/GuestUser/Events';
import ManageRules from './Pages/AuthUser/SuperAdmin/ManageRules';
import Activities from './Pages/GuestUser/Actvities/Activities';
import ActivityDetails from './Pages/GuestUser/Actvities/ActivityDetails';
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
import EventTracking from './Pages/AuthUser/EventTracking';
import EventAppointmentDistribution from './Pages/AuthUser/SuperAdmin/Components/EventAppointmentDistribution';
import SpecialtyStats from './Pages/AuthUser/SuperAdmin/ArchivedStats/SpecialtyStats';
import StatusStats from './Pages/AuthUser/SuperAdmin/ArchivedStats/StatusStats';
import DemographicStats from './Pages/AuthUser/SuperAdmin/ArchivedStats/DemographicStats';
import GeographicStats from './Pages/AuthUser/SuperAdmin/ArchivedStats/GeographicStats';
import PatientsList from './Pages/AuthUser/SuperAdmin/ArchivedStats/PatientsList';
import ComprehensiveReport from './Pages/AuthUser/SuperAdmin/ArchivedStats/ComprehensiveReport';

export default function App() {
  const [specialities, setSpecialities] = useState([]);
  const { user } = useContext(AppContext);

  // Role checks
  const isSuperAdmin = user?.role_id === 1;
  const isCheckAdmin = user && [1, 4, 6].includes(user.role_id);
  const isRecipientAdmin = user && [1, 5].includes(user.role_id);
  const isSpecialAdmin = user && [1, 3].includes(user.role_id);

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
            <Route path="activities/showByActivitiesType/:TypeId" element={<Activities />} />
            <Route path="actvities/:Actvityid" element={<ActivityDetails />} />
            <Route path="futureProjects" element={<FuturProjects />} />
            <Route path="future-prjects/:Projectid" element={<ProjectDetails />} />


            
              
            {/* Public Appointment Booking */}
            <Route
              path="appointment/:eventID"
              element={<RegisterVisit specialities={specialities} setSpecialities={setSpecialities} />}
            />
            
            {/* Authentication */}
            <Route path="login" element={user ? <Navigate to="/home" replace /> : <Login />} />
            <Route path="register" element={user ? <Navigate to="/home" replace /> : <Register />} />
          </Route>

          {/* -------- Admin / Authenticated Routes (AdminLayout) -------- */}
          {user && (
            <Route path="/admin" element={<AdminLayout />}>
              {/* Event Management Routes */}
              <Route path="event-tracking/:eventId" element={<EventTracking />} />
              <Route path="check-presence/:eventId" element={<CheckPresence />} />
              <Route path="appointment-distribution/:eventId" element={<EventAppointmentDistribution />} />
              <Route path="event-statistics/:eventId" element={<VisitsStatistics />} />
              <Route path="event-waiting-lists/:eventId/:specialityId" element={<CheckPaitent />} />
              <Route path="big-list-waiting/:eventId" element={<WaitingList />} />
                           {/* Archived Event Statistics Routes */}
            <Route path="/admin/archived/specialty-stats/:eventId" element={<SpecialtyStats />} />
            <Route path="/admin/archived/status-stats/:eventId" element={<StatusStats />} />
            <Route path="/admin/archived/demographic-stats/:eventId" element={<DemographicStats />} />
            <Route path="/admin/archived/geographic-stats/:eventId" element={<GeographicStats />} />
            <Route path="/admin/archived/patients-list/:eventId" element={<PatientsList />} />
            <Route path="/admin/archived/comprehensive-report/:eventId" element={<ComprehensiveReport />} />
              
              {/* Super Admin Only Routes */}
              <Route path="users" element={isSuperAdmin ? <AllUsers /> : <NotAuthenticated />} />
              <Route path="speciality" element={isSuperAdmin ? <ManageSpeciality /> : <NotAuthenticated />} />
              <Route path="settings" element={isSuperAdmin ? <Settings /> : <NotAuthenticated />} />
              <Route path="statistics" element={isSuperAdmin ? <VisitsStatistics /> : <NotAuthenticated />} />
              <Route path="rules" element={isSuperAdmin ? <ManageRules /> : <NotAuthenticated />} />
              <Route path="manage-events" element={isSuperAdmin ? <EventsManagement /> : <NotAuthenticated />} />
              <Route path="contacts" element={isSuperAdmin ? <Messages /> : <NotAuthenticated />} />
              <Route path="volunteers" element={isSuperAdmin ? <SuperAdminVolunteers /> : <NotAuthenticated />} />
              
              {/* Special Admin Routes */}
              <Route path="special-case" element={isSpecialAdmin ? <SpecialCase /> : <NotAuthenticated />} />
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