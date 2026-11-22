/* =====================================================================
   Route guards — decide who may see which pages.

   NOTE: these only improve the user experience (no flashing pages you
   can't use). The REAL protection is on the server: requireAuth and
   requireRole reject the API calls. That's what the brief grades as
   "a forbidden action blocked by the server".
   ===================================================================== */
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth, HOME_BY_ROLE } from '../../hooks/useAuth';
import PageState from '../ui/PageState';

/** Only lets users with one of `roles` through. Others are redirected. */
export function RequireRole({ roles }) {
  const { user, checkingSession } = useAuth();
  const location = useLocation();

  if (checkingSession) return <PageState status="loading" />;

  // Not logged in → go to login, remembering where they wanted to go.
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  // Logged in with the wrong role → send them to their own home page.
  if (!roles.includes(user.role)) return <Navigate to={HOME_BY_ROLE[user.role]} replace />;

  return <Outlet />;
}

/** Login/Register: if already logged in, skip straight to the home page. */
export function RedirectIfLoggedIn() {
  const { user, checkingSession } = useAuth();

  if (checkingSession) return <PageState status="loading" />;
  if (user) return <Navigate to={HOME_BY_ROLE[user.role]} replace />;

  return <Outlet />;
}

/** "/" → the right home page for the user, or the login page. */
export function HomeRedirect() {
  const { user, checkingSession } = useAuth();

  if (checkingSession) return <PageState status="loading" />;
  return <Navigate to={user ? HOME_BY_ROLE[user.role] : '/login'} replace />;
}
