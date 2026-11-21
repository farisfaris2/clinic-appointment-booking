/* =====================================================================
   Footer — full-width blue banner shown on every page.
   ===================================================================== */
import { useAuth, HOME_BY_ROLE } from '../../hooks/useAuth';
import { PhonePlusIcon } from '../icons/BrandIcons';
import Brand from './Brand';

export default function Footer() {
  const { user } = useAuth();

  return (
    <footer className="footer">
      <div className="footer__inner container">
        <div className="footer__top">
          <Brand to={user ? HOME_BY_ROLE[user.role] : '/login'} logoSize={38} />

          <div className="footer__contact">
            <address className="footer__contact-list">
              <span>Contact</span>
              <a href="tel:+995320122211">032 0 12 22 11</a>
              <a href="mailto:info@carebook.ge">info@carebook.ge</a>
            </address>
            <PhonePlusIcon />
          </div>
        </div>

        <div className="footer__legal">
          <span>© CareBook. All rights reserved</span>
          {/* Policy pages are not written yet — plain text for now. */}
          <span>Privacy Policy</span>
          <span>Cookie Policy</span>
        </div>
      </div>
    </footer>
  );
}
