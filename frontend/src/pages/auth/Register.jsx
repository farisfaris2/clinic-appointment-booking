/* =====================================================================
   Register  (Figma: "Register - desktop")
   POST /api/auth/register always creates a PATIENT (doctors and admins
   come from seed data). After success we log in automatically.

   The checks below mirror the server's rules so users get instant
   feedback — but the server validates again, which is what counts.
   ===================================================================== */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, HOME_BY_ROLE } from '../../hooks/useAuth';
import PasswordInput from '../../components/ui/PasswordInput';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8; // same as server/routes/auth.js

/** Returns an error message, or '' when the form is valid. */
function validate({ name, surname, email, password, confirm }) {
  if (!name.trim() || !surname.trim()) return 'Please enter your name and surname.';
  if (!EMAIL_PATTERN.test(email.trim())) return 'Please enter a valid e-mail address.';
  if (password.length < MIN_PASSWORD_LENGTH)
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  if (password !== confirm) return 'Passwords do not match.';
  return '';
}

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  // One state object for the whole form; `update` changes one field.
  const [form, setForm] = useState({ name: '', surname: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (event) => setForm({ ...form, [field]: event.target.value });
  const allFilled = Object.values(form).every((value) => value !== '');

  async function handleSubmit(event) {
    event.preventDefault();
    const problem = validate(form);
    if (problem) {
      setError(problem);
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      const fullName = `${form.name.trim()} ${form.surname.trim()}`;
      const user = await register(fullName, form.email.trim(), form.password);
      navigate(HOME_BY_ROLE[user.role], { replace: true });
    } catch (err) {
      setError(err.message); // e.g. "An account with this email already exists."
      setSubmitting(false);
    }
  }

  return (
    <section className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit} noValidate>
        <h1 className="auth-card__title">Register</h1>

        <div className="auth-card__fields auth-card__fields--stacked">
          <label className="field">
            <span className="visually-hidden">Name</span>
            <input className="input" placeholder="Name" autoComplete="given-name"
              value={form.name} onChange={update('name')} />
          </label>
          <label className="field">
            <span className="visually-hidden">Surname</span>
            <input className="input" placeholder="Surname" autoComplete="family-name"
              value={form.surname} onChange={update('surname')} />
          </label>
          <label className="field field--full">
            <span className="visually-hidden">E-mail</span>
            <input type="email" className="input" placeholder="E-mail" autoComplete="email"
              value={form.email} onChange={update('email')} />
          </label>
          <label className="field field--full">
            <span className="visually-hidden">Password</span>
            <PasswordInput placeholder="Password (at least 8 characters)" autoComplete="new-password"
              value={form.password} onChange={update('password')} />
          </label>
          <label className="field field--full">
            <span className="visually-hidden">Confirm password</span>
            <PasswordInput placeholder="Confirm password" autoComplete="new-password"
              value={form.confirm} onChange={update('confirm')} />
          </label>
        </div>

        <div className="auth-card__footer">
          {error && (
            <p className="form-message form-message--error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="btn btn--primary" disabled={!allFilled || submitting}>
            {submitting ? 'Signing up…' : 'Sign Up'}
          </button>
        </div>
      </form>

      <div className="auth-switch">
        <p>
          Already have an account? <Link to="/login" className="link">Sign in</Link>
        </p>
      </div>
    </section>
  );
}
