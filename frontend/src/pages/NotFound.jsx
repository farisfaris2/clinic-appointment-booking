/* =====================================================================
   404 — shown for any URL that doesn't match a route in App.jsx.
   ===================================================================== */
import { Link } from 'react-router-dom';
import PageState from '../components/ui/PageState';

export default function NotFound() {
  return (
    <PageState status="empty" title="Page not found" message="The page you’re looking for doesn’t exist.">
      <Link to="/" className="link">Go to the home page</Link>
    </PageState>
  );
}
