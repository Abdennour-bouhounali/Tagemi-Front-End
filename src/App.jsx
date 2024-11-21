import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AdminLayout from './Pages/AdminLayout';
import GuestLayout from './Pages/GuestLayout';
import Home from './Pages/GuestUser/HomePage/Home';
import Login from './Pages/AuthUser/Auth/Login';
import Register from './Pages/AuthUser/Auth/Register';
import AllUsers from './Pages/AuthUser/SuperAdmin/AllUsers'
import { useContext, useEffect, useState } from 'react';
import { AppContext } from './Context/AppContext';
import ManageSpeciality from './Pages/AuthUser/SuperAdmin/ManageSpeciality';
import RegisterVisit from './Pages/AuthUser/Visits/RegisterVisit';
import CheckPresence from './Pages/AuthUser/RecipientAdmin/CheckPresence';
import CheckPaitent from './Pages/AuthUser/CheckAdmin/CheckPaitent';
import Settings from './Pages/AuthUser/SuperAdmin/Settings';
import './i18n'; // Import i18n configuration
import SpecialCase from './Pages/AuthUser/SpecialCaseAdmin/SpecialCase';
import VisitsStatistics from './Pages/AuthUser/SuperAdmin/VisitsStatistics';
import About from './Pages/GuestUser/About';
import Contact from './Pages/GuestUser/Contact';
import Events from './Pages/GuestUser/Events';
import ManageRules from './Pages/AuthUser/SuperAdmin/ManageRules';
import Activities from './Pages/GuestUser/Actvities/Activities';
import TypesPage from './Pages/ManageContents/TypesPage';
import ActivitiesPage from './Pages/ManageContents/ActivitiesPage';
import SponsorsPage from './Pages/ManageContents/SponsorsPage';
import FutureProjectsPage from './Pages/ManageContents/FutureProjectsPage';
import BlogsPage from './Pages/ManageContents/BlogsPage';
import ActivityDetails from './Pages/GuestUser/Actvities/ActivityDetails';
import Messages from './Pages/AuthUser/SuperAdmin/Messages';
import VolunteerForm from './Pages/GuestUser/VolunteerForm';
import FuturProjects from './Pages/GuestUser/FuturProjects/FuturProjects';
import ProjectDetails from './Pages/GuestUser/FuturProjects/ProjectDetails';
import SuperAdminVolunteers from './Pages/AuthUser/SuperAdmin/SuperAdminVolunteers';
import WaitingList from './Pages/AuthUser/WaitingList/WaitingList';

import { LanguageProvider, useLanguage } from './Context/LanguageContext';
import RedirectToAppointment from './RedirectToAppointment';

export default function App() {


  const [specialities, setSpecialities] = useState([]);
  const { user } = useContext(AppContext);
  var Superadmin = false;
  var CheckAdmin = false;
  var RecipientAdmin = false;
  var SpecialAdmin = false;
  var a = true;
  // console.log(user.role_id);
  if (user) {
    Superadmin = user.role_id == 1 ? true : false;
  } else {
    Superadmin = false;
  }

  if (user) {
    CheckAdmin = (user.role_id == 1 || user.role_id == 4) ? true : false;
  } else {
    CheckAdmin = false;
  }

  if (user) {
    RecipientAdmin = (user.role_id == 1 || user.role_id == 5) ? true : false;
  } else {
    RecipientAdmin = false;
  }

  if (user) {
    SpecialAdmin = (user.role_id == 1 || user.role_id == 3) ? true : false;
  } else {
    SpecialAdmin = false;
  }




  return <LanguageProvider>
    <BrowserRouter>


      <Routes>
        <Route path="/" element={<AdminLayout />}>

          <Route path="/users" element={Superadmin ? <AllUsers /> : <Home />} />
          <Route path="/speciality" element={Superadmin ? <ManageSpeciality /> : <Home />} />
          <Route path="/AllAppointments" element={RecipientAdmin || Superadmin || SpecialAdmin ? <CheckPresence /> : <Home />} />
          <Route path="/settings" element={Superadmin ? <Settings /> : <Home />} />
          <Route path="/WaitingList/:specialityId" element={CheckAdmin ? <CheckPaitent /> : <Home />} />
          <Route path="/SpecialCase" element={SpecialAdmin ? <CheckPresence /> : <Home />} />
          <Route path="/Statitistics" element={Superadmin ? <VisitsStatistics /> : <Home />} />
          <Route path="/rules" element={Superadmin ? <ManageRules /> : <Home />} />

          <Route path="/GeneralWaitingList" element={ user ? <WaitingList /> : <Home />} />

          <Route path="/types" element={Superadmin || SpecialAdmin ? <TypesPage /> : <Home />} />
          <Route path="/activities" element={Superadmin ? <ActivitiesPage /> : <Home />} />
          <Route path="/contacts" element={Superadmin ? <Messages /> : <Home />} />
          <Route path="/sponsors" element={Superadmin ? <SponsorsPage /> : <Home />} />
          <Route path="/future-projects" element={Superadmin ? <FutureProjectsPage /> : <Home />} />
          <Route path="/blogs" element={Superadmin ? <BlogsPage /> : <Home />} />

          <Route path="/voulenteers" element={Superadmin ? <SuperAdminVolunteers /> : <Home />} />


        </Route>

        <Route path='/' element={<GuestLayout />}>
          <Route index element={<RedirectToAppointment><Home /></RedirectToAppointment>} />
          <Route path="/appointment" element={<RegisterVisit specialities={specialities} setSpecialities={setSpecialities} />} />

          <Route path="/about" element={<RedirectToAppointment><About /></RedirectToAppointment>} />
          <Route path="/contact" element={<RedirectToAppointment><Contact /></RedirectToAppointment>} />
          <Route path="/volunteer" element={<RedirectToAppointment><VolunteerForm /></RedirectToAppointment>} />
          <Route path='/activities/activity1' element={<RedirectToAppointment><Activities /></RedirectToAppointment>} />
          <Route path="/activities/showByActivitiesType/:TypeId" element={<RedirectToAppointment><Activities /></RedirectToAppointment>} />
          <Route path="/login" element={user ? <Home /> : <RedirectToAppointment><Login /></RedirectToAppointment>} />
          <Route path="/register" element={user ? <Home /> : <RedirectToAppointment><Register /></RedirectToAppointment>} />
          <Route path='/actvities/:Actvityid' element={<RedirectToAppointment><ActivityDetails /></RedirectToAppointment>} />
          <Route path="/futureProjects" element={<RedirectToAppointment><FuturProjects /></RedirectToAppointment>} />
          <Route path="/future-prjects/:Projectid" element={<RedirectToAppointment><ProjectDetails /></RedirectToAppointment>} />
        </Route>






      </Routes>

    </BrowserRouter>
  </LanguageProvider>
}

