import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/endpoints.js';
import { Alert, Field } from '../components/ui.jsx';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import AuthShell from './AuthShell.jsx';

export default function ForgotPassword() {
    useDocumentTitle('Forgot password');
    const [email, setEmail] = useState('');
    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(false);
    const [sent, setSent] = useState(false);
    const fe = error?.fieldErrors ?? {};

    async function onSubmit(e) {
        e.preventDefault();
        setBusy(true);
        setError(null);
        try {
          await api.forgotPassword(email);
          setSent(true);
        } catch (err) {
          setError(err);
        } finally {
          setBusy(false);
        }
    }
    if (sent) {
        return (
            <AuthShell>
              <h1>Ask the ICT team</h1>
              <p className="page-head__sub" style={{ marginBottom: '1.25rem' }}>
                  If {email} has an active account, the ICT team has been told.
              </p>
              <ol className="steps">
                  <li>Contact the ICT team.</li>
                  <li>They give you a reset code.</li>
                  <li>Enter the code and choose a new password.</li>
              </ol>
            <Link className="btn btn--block" to={`/reset-password?email=${encodeURIComponent(email)}`}>
                  I have a code
            </Link>
            <p className="auth__switch">
                <Link to="/login">Back to log in</Link>
            </p>
            </AuthShell>
        );
    }
    return (
        <AuthShell>
          <h1>Forgot your password?</h1>
          <p className="page-head__sub" style={{ marginBottom: '1.5rem' }}>
            Enter your work email. The ICT team will send you a code to set a new password.
          </p>
          {error && !fe.email && <Alert error={error} />}
          <form onSubmit={onSubmit} noValidate>
            <Field label="Email" error={fe.email}>
              {(p) => <input {...p} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />}
            </Field>
            <button className="btn btn--block" type="submit" disabled={busy}>
              {busy ? 'Sending…' : 'Ask for a reset code'}
            </button>
          </form>
          <p className="auth__switch">
            <Link to="/login">Back to log in</Link>
          </p>
        </AuthShell>
    );
}