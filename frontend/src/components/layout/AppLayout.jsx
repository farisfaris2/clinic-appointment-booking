/* =====================================================================
   AppLayout — header + page content + footer.
   Every route renders inside <Outlet />, so pages only contain their
   own content and never repeat the header/footer.
   ===================================================================== */
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

export default function AppLayout() {
  return (
    <div className="app-shell">
      <Header />
      <main className="app-shell__main">
        <div className="container">
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  );
}
