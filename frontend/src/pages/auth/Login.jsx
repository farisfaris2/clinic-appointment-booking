/* =====================================================================
   Login  (Figma: "Authorize - desktop")
   POST /api/auth/login → the server sets an HttpOnly cookie and returns
   the user. We then send them to their role's home page (or back to the
   page they originally tried to open).
   ===================================================================== */
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth, HOME_BY_ROLE } from '../../hooks/useAuth';
import PasswordInput from '../../components/ui/PasswordInput';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showResetNote, setShowResetNote] = useState(false);

  const canSubmit = email.trim() !== '' && password !== '' && !submitting;

  async function handleSubmit(event) {
    event.preventDefault();
    if (!canSubmit) return;

    setError('');
    setSubmitting(true);
    try {
      const user = await login(email.trim(), password);
      // Return to the page they were redirected from, if it suits their role.
      const from = location.state?.from;
      const home = HOME_BY_ROLE[user.role];
      navigate(from?.startsWith(home) ? from : home, { replace: true });
    } catch (err) {
      setError(err.message); // e.g. "Invalid email or password."
      setSubmitting(false);
    }
  }

  return (
    <section className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit} noValidate>
        <h1 className="auth-card__title">Authorize</h1>

        <div className="auth-card__fields">
          <label className="field">
            <span className="visually-hidden">E-mail</span>
            <input
              type="email"
              className="input"
              placeholder="E-mail"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={Boolean(error)}
            />
          </label>
          <label className="field">
            <span className="visually-hidden">Password</span>
            <PasswordInput
              placeholder="Password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={Boolean(error)}
            />
          </label>
        </div>

        <div className="auth-card__footer">
          {error && (
            <p className="form-message form-message--error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="btn btn--primary" disabled={!canSubmit}>
            {submitting ? 'Signing in…' : 'Sign In'}
          </button>
        </div>
      </form>

      <div className="auth-switch">
        <p>
          Not yet registered? <Link to="/register" className="link">Sign up</Link>
        </p>
        <button type="button" className="btn btn--ghost" onClick={() => setShowResetNote(true)}>
          Forgot password?
        </button>
        {/* There is no password-reset endpoint yet, so we explain instead. */}
        {showResetNote && (
          <p className="page-hint">
            Password reset isn’t available online yet. Please contact info@carebook.ge.
          </p>
        )}
      </div>
    </section>
  );
}
