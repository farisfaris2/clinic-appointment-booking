/* =====================================================================
   Building blocks shared by the Patient and Doctor home pages:
   - NavCard:   ice-blue card with an icon, thin blue line and caption
   - HomeIntro: big headline | blue divider | three lines of text
   ===================================================================== */
import { Link } from 'react-router-dom';

export function NavCard({ to, icon, label }) {
  return (
    <Link to={to} className="card card--interactive nav-card">
      <span className="card__icon">{icon}</span>
      <span className="nav-card__line" />
      <span className="nav-card__label">{label}</span>
    </Link>
  );
}

export function HomeIntro({ title, lines }) {
  return (
    <section className="home-intro">
      <h1 className="home-intro__title">{title}</h1>
      <span className="home-intro__divider" aria-hidden="true" />
      <div className="home-intro__copy">
        {lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </section>
  );
}
