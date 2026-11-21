/* =====================================================================
   AuthContext.js — the React "context" object that holds the logged-in
   user. It is filled in by <AuthProvider> and read with useAuth().
   (Kept in its own file so Vite's fast refresh works properly.)
   ===================================================================== */
import { createContext } from 'react';

export const AuthContext = createContext(null);
