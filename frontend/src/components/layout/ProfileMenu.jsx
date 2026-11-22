/* =====================================================================
   ProfileMenu — the round avatar in the header and its dropdown card:
   "Name • Role", Personal Information, Account Details, Log out.
   ===================================================================== */
import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useDismiss } from '../../hooks/useDismiss';
import { formatJoinDate } from '../../utils/datetime';
import { initialOf } from '../../utils/format';

export default function ProfileMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [openSection, setOpenSection] = useState(null); // 'personal' | 'account' | null
  const menuRef = useRef(null);

  const close = useCallback(() => setOpen(false), []);
  useDismiss(menuRef, open, close);

  const toggleSection = (key) => setOpenSection((current) => (current === key ? null : key));

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  // /api/auth/me doesn't return created_at yet — show it once it does.
  const joined = formatJoinDate(user.created_at);

  return (
    <div className="profile" ref={menuRef}>
      <button
        type="button"
        className="avatar"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`Account menu for ${user.full_name}`}
        onClick={() => setOpen((value) => !value)}
      >
        {initialOf(user.full_name)}
      </button>

      {open && (
        <div className="profile-menu">
          <p className="profile-menu__identity">
            {user.full_name} <span aria-hidden="true">•</span>
            <span className="profile-menu__role">{user.role}</span>
          </p>

          {/* Accordion 1 */}
          <button
            type="button"
            className="profile-menu__item"
            aria-expanded={openSection === 'personal'}
            onClick={() => toggleSection('personal')}
          >
            Personal Information
            <ChevronDown size={20} className={`chevron ${openSection === 'personal' ? 'chevron--open' : ''}`} />
          </button>
          {openSection === 'personal' && (
            <div className="profile-menu__details">
              <span>Name: {user.full_name}</span>
              <span>Email: {user.email}</span>
              <span>Role: {user.role}</span>
            </div>
          )}

          {/* Accordion 2 */}
          <button
            type="button"
            className="profile-menu__item"
            aria-expanded={openSection === 'account'}
            onClick={() => toggleSection('account')}
          >
            Account Details
            <ChevronDown size={20} className={`chevron ${openSection === 'account' ? 'chevron--open' : ''}`} />
          </button>
          {openSection === 'account' && (
            <div className="profile-menu__details">
              <span>Account ID: {user.id}</span>
              {joined && <span>Registered: {joined}</span>}
              {/*
                Figma also shows a red "Delete account" action here.
                The backend has no DELETE /api/auth/me route yet, so it is
                left out instead of showing a button that can't work.
              */}
            </div>
          )}

          <button type="button" className="profile-menu__item" onClick={handleLogout}>
            Log out
            <LogOut size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
