import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

const DEMO = [
  ['Customer', 'customer@demo.io'],
  ['Agent', 'agent@demo.io'],
  ['Billing agent', 'billing.agent@demo.io'],
  ['Admin', 'admin@demo.io'],
];

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      toast.success('Welcome back!');
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <h1>Log in</h1>
        <p className="muted">Access your support tickets.</p>

        <form onSubmit={submit} className="form">
          <label>
            Email
            <input
              type="email"
              value={email}
              autoComplete="username"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              autoComplete="current-password"
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          {error && <div className="alert alert--error">{error}</div>}

          <button className="btn btn--primary" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Log in'}
          </button>
        </form>

        <p className="muted">
          No account? <Link to="/register">Register as a customer</Link>
        </p>

        <div className="demo-box">
          <strong>Demo accounts</strong> <span className="muted">(password: Passw0rd!)</span>
          <div className="demo-grid">
            {DEMO.map(([label, addr]) => (
              <button
                key={addr}
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => {
                  setEmail(addr);
                  setPassword('Passw0rd!');
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
