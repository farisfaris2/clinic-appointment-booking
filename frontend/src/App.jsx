/* =====================================================================
   App.jsx — the map of every page (route) in CareBook.

   Structure:
   <AppLayout>                 header + footer around everything
     /login, /register         only when logged OUT
     /patient/...              only for role "patient"
     /doctor/...               only for role "doctor"
     /admin                    only for role "admin" (placeholder for now)
   ===================================================================== */
import { Route, Routes } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import { HomeRedirect, RedirectIfLoggedIn, RequireRole } from './components/routing/guards';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

import PatientHome from './pages/patient/PatientHome';
import DoctorsList from './pages/patient/DoctorsList';
import DoctorProfile from './pages/patient/DoctorProfile';
import BookVisit from './pages/patient/BookVisit';
import MyVisits from './pages/patient/MyVisits';

import DoctorHome from './pages/doctor/DoctorHome';
import DoctorCalendar from './pages/doctor/DoctorCalendar';
import DoctorAppointments from './pages/doctor/DoctorAppointments';
import DoctorAvailability from './pages/doctor/DoctorAvailability';

import AdminHome from './pages/AdminHome';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomeRedirect />} />

        {/* Public pages — logged-in users are sent to their home page */}
        <Route element={<RedirectIfLoggedIn />}>
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
        </Route>

        {/* Patient area */}
        <Route path="patient" element={<RequireRole roles={['patient']} />}>
          <Route index element={<PatientHome />} />
          <Route path="doctors" element={<DoctorsList />} />
          <Route path="doctors/:doctorId" element={<DoctorProfile />} />
          <Route path="book" element={<BookVisit />} />
          <Route path="visits" element={<MyVisits />} />
        </Route>

        {/* Doctor area */}
        <Route path="doctor" element={<RequireRole roles={['doctor']} />}>
          <Route index element={<DoctorHome />} />
          <Route path="calendar" element={<DoctorCalendar />} />
          <Route path="appointments" element={<DoctorAppointments />} />
          <Route path="availability" element={<DoctorAvailability />} />
        </Route>

        {/* Admin area (final submission) */}
        <Route path="admin" element={<RequireRole roles={['admin']} />}>
          <Route index element={<AdminHome />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
