import React, { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const Login = () => {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to={user.role === 'admin' ? '/' : '/employee'} replace />;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const account = await signIn({ username, password });
      const defaultPath = account.role === 'admin' ? '/' : '/employee';
      navigate(location.state?.from || defaultPath, { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to sign in. Check the API and database connection.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-brand">StaffSync</div>
        <p className="auth-eyebrow">SECURE EMPLOYEE PORTAL</p>
        <h1>Sign in to your account</h1>
        <p className="auth-intro">Use the account credentials provided by your administrator.</p>
        {error && <div className="alert-banner-box alert-danger" role="alert">{error}</div>}
        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="username">Email / username</label>
          <input id="username" name="username" autoComplete="username" value={username}
            onChange={(event) => setUsername(event.target.value)} required maxLength={150} />
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" autoComplete="current-password"
            value={password} onChange={(event) => setPassword(event.target.value)} required />
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </section>
    </main>
  );
};

export default Login;
