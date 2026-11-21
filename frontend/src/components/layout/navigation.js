/* =====================================================================
   navigation.js — header links for each role (Figma header designs).
   Add or rename a page here and the header updates automatically.
   ===================================================================== */
export const NAV_BY_ROLE = {
  patient: [
    { to: '/patient/doctors', label: 'Doctors' },
    { to: '/patient/visits', label: 'My Visits' },
    { to: '/patient/book', label: 'Book Now' },
  ],
  doctor: [
    { to: '/doctor/calendar', label: 'Calendar' },
    { to: '/doctor/appointments', label: 'My Appointments' },
    { to: '/doctor/availability', label: 'Availability' },
  ],
  // Admin screens are planned for the final submission.
  admin: [],
};
