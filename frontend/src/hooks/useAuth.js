/* =====================================================================
   useAuth() — read the logged-in user anywhere:
     const { user, login, logout } = useAuth();
   ===================================================================== */
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider> (see main.jsx).');
  }
  return context;
}

/** Where each role lands after logging in. */
export const HOME_BY_ROLE = {
  patient: '/patient',
  doctor: '/doctor',
  admin: '/admin',
};
