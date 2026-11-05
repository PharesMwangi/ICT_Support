import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api/endpoints.js';
import { Alert, Field } from '../components/ui.jsx';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import AuthShell from './AuthShell.jsx';

export default function ResetPassword() {
  useDocumentTitle('Set a new password');
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState(params.get('email') ?? '');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const fe = error?.fieldErrors ?? {};
  const mismatch = confirm.length > 0 && confirm !== password;

  async function onSubmit(e) {
    e.preventDefault();
    if (password !== confirm) return;
    setBusy(true);
    setError(null);
    try {
      await api.resetPassword({ email, code, newPassword: password });
      navigate('/login', { replace: true, state: { passwordChanged: true } });
    } catch (err) {
      setError(err);
      setBusy(false);
    }
  }

  const hasFieldErrors = Object.keys(fe).length > 0;

  return (
    <AuthShell>
      <h1>Set a new password</h1>
      <p className="page-head__sub" style={{ marginBottom: '1.5rem' }}>
        Use the code the reset you received from theICT team gave you. 
      </p>
      {error && <Alert error={{ message: hasFieldErrors ? 'Fix the highlighted fields and try again.' : error.message }} />}
      <form onSubmit={onSubmit} noValidate>
        <Field label="Email" error={fe.email}>
          {(p) => <input {...p} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />}
        </Field>
        <Field label="Reset code" hint="Looks like ABCD-EFGH. Capital letters do not matter." error={fe.code}>
          {(p) => <input {...p} autoComplete="off" autoCapitalize="characters" spellCheck="false" value={code} onChange={(e) => setCode(e.target.value)} required />}
        </Field>
        <Field label="New password" hint="At least 8 characters, with a letter and a number." error={fe.newPassword}>
          {(p) => <input {...p} type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required />}
        </Field>
        <Field label="Type the new password again" error={mismatch ? 'The two passwords do not match.' : undefined}>
          {(p) => <input {...p} type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />}
        </Field>
        <button className="btn btn--block" type="submit" disabled={busy || mismatch}>
          {busy ? 'Saving…' : 'Change password'}
        </button>
      </form>
      <p className="auth__switch">
        No code yet? <Link to="/forgot-password">Ask the ICT team</Link>
      </p>
    </AuthShell>
  );
}
