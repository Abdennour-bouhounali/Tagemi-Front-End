import { BrowserRouter,Routes,Route } from 'react-router-dom';
import './App.css'
import AdminLayout from './Pages/AdminLayout'
import Home from './Pages/GuestUser/Home'
import Login from './Pages/AuthUser/Auth/Login';
import Register from './Pages/AuthUser/Auth/Register';
import AllUsers from './Pages/AuthUser/SuperAdmin/AllUsers'
import { useContext, useState } from 'react';
import { AppContext } from './Context/AppContext';
import ManageSpeciality from './Pages/AuthUser/SuperAdmin/ManageSpeciality';
import RegisterVisit from './Pages/AuthUser/Visits/RegisterVisit';
import CheckPresence from './Pages/AuthUser/RecipientAdmin/CheckPresence';
import CheckPaitent from './Pages/AuthUser/CheckAdmin/CheckPaitent';
import Settings from './Pages/AuthUser/SuperAdmin/Settings';
import './i18n'; // Import i18n configuration
import SpecialCase from './Pages/AuthUser/SpecialCaseAdmin/SpecialCase';
import VisitsStatistics from './Pages/AuthUser/SuperAdmin/VisitsStatistics';

export default function App() {
  const [specialities,setSpecialities] = useState([]);
  const {user}  = useContext(AppContext);
  var Superadmin = false; 
  // console.log(user.role_id);
  if(user){
    Superadmin = user.role_id == 1 ? true : false; 
  }else{
     Superadmin = false;
  }
  return <BrowserRouter> 
  <Routes>
    <Route path="/" element={<AdminLayout/>}>
      <Route index element={<Home />}/>
      <Route path="/login" element={user ? <Home/> : <Login />}/>
      <Route path="/register" element={user ? <Home/> : <Register />}/>
      <Route path="/users" element={Superadmin ?  <AllUsers /> : <Home/> }/>
      <Route path="/speciality" element={Superadmin ?  <ManageSpeciality /> : <Home/> }/>
      <Route path="/appointment" element={user ? <RegisterVisit specialities={specialities} setSpecialities={setSpecialities} /> : <Home/> }/>
      <Route path="/AllAppointments" element={Superadmin ? <CheckPresence /> : <Home />} />
      <Route path="/settings" element={Superadmin ? <Settings /> : <Home />} />      
      <Route path="/WaitingList/:specialityId" element={Superadmin ? <CheckPaitent /> : <Home />} />
      <Route path="/SpecialCase" element={Superadmin ? <SpecialCase /> : <Home />} />
      
      <Route path="/Statitistics" element={Superadmin ? <VisitsStatistics /> : <Home />} />

    </Route>





  </Routes>
  </BrowserRouter>
}

