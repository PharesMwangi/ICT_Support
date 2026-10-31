import { useState } from "react";
import { Link, useNavigate, useLocation } from 'react-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { Alert, Field } from '../components/ui.jsx';
import { SessionEndedNotice } from '../components/Layout.jsx';
import AuthShell from './AuthShell.jsx';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';

export default function Login(){
    useDocumentTitle('Log in');
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(false);

    async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email, password);
      navigate(location.state?.from ?? '/', { replace: true });
    } catch (err) {
      setError(err);
      setBusy(false);
    }
  }

  return(
    <AuthShell>
        <h1>Log in</h1>
        <p className="page-head__sub" style={{ marginBottom: '1.5rem' }}>
            Use your work email address.
        </p>
        <SessionEndedNotice />
        <Alert error={error} />
        <form onSubmit={onSubmit} noValidate>
            <Field label="Email">
                {(p) => <input {...p} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />}
            </Field>
            <Field label="Password">
                {(p) => (
                    <input {...p} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                )}
            </Field>
            <button className="btn btn--block" type="submit" disabled={busy}>
                {busy ? 'Logging in…' : 'Log in'}
            </button>
        </form>
        <p className="auth__switch">
            New here? <Link to="/signup">Create an account</Link>
        </p>
    </AuthShell>
  );
}