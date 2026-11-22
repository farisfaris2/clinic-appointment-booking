/* =====================================================================
   Header — logo on the left, role-specific links in the middle,
   avatar menu on the right. When nobody is logged in (login/register
   pages) only the logo is shown, as in the Figma "Authorize" screen.
   ===================================================================== */
import { NavLink } from 'react-router-dom';
import { useAuth, HOME_BY_ROLE } from '../../hooks/useAuth';
import Brand from './Brand';
import ProfileMenu from './ProfileMenu';
import { NAV_BY_ROLE } from './navigation';

export default function Header() {
  const { user } = useAuth();
  const links = user ? NAV_BY_ROLE[user.role] ?? [] : [];

  return (
    <header className="header container">
      <Brand to={user ? HOME_BY_ROLE[user.role] : '/login'} />

      {user && (
        <>
          <nav className="nav" aria-label="Main">
            {links.map((link) => (
              // NavLink adds class "active" to the current page → underline
              <NavLink key={link.to} to={link.to} className="nav__link">
                {link.label}
              </NavLink>
            ))}
          </nav>
          <ProfileMenu />
        </>
      )}
    </header>
  );
}
