/* =====================================================================
   AuthProvider.jsx — keeps track of who is logged in.

   How it works:
   1. When the app opens, it asks GET /api/auth/me. If the browser still
      has a valid login cookie, the server returns the user → logged in.
   2. login(), register() and logout() call the API and update `user`.
   3. Any component can read { user, login, logout, … } with useAuth().

   The token itself is an HttpOnly cookie, so JavaScript never sees it —
   we only keep the user's public info (id, name, email, role).
   ===================================================================== */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/endpoints';
import { AuthContext } from './AuthContext';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // true until we know whether a session already exists
  const [checkingSession, setCheckingSession] = useState(true);

  // 1. Restore the session on first load.
  useEffect(() => {
    authApi
      .me()
      .then((data) => setUser(data.user))
      .catch(() => setUser(null)) // 401 = not logged in, which is fine
      .finally(() => setCheckingSession(false));
  }, []);

  // 2. Log in and remember the returned user.
  const login = useCallback(async (email, password) => {
    const data = await authApi.login(email, password);
    setUser(data.user);
    return data.user;
  }, []);

  // Register creates a patient, then logs straight in for a smoother flow.
  const register = useCallback(
    async (fullName, email, password) => {
      await authApi.register(fullName, email, password);
      return login(email, password);
    },
    [login],
  );

  // 3. Log out. Even if the request fails we forget the user locally.
  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
    }
  }, []);

  // useMemo stops every consumer re-rendering when nothing changed.
  const value = useMemo(
    () => ({ user, checkingSession, login, register, logout }),
    [user, checkingSession, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
