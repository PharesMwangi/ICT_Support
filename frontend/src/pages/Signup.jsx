import { useState } from "react";
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from "../auth/AuthContext";
import { Alert, Field } from '../components/ui.jsx';
import { useMeta } from '../hooks/useMeta.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import AuthShell from './AuthShell.jsx';

export default function Signup(){
    useDocumentTitle('Create account');
    const { signup } = useAuth();
    const { meta, error: metaError } = useMeta();
    const navigate = useNavigate();
    const [values, setValues] = useState({ name: '', email: '', department: '', password: '' });
    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(false);
    const fe = error?.fieldErrors ?? {};
    const set = (k) => (e) => setValues((v) => ({ ...v, [k]: e.target.value }));

    async function onSubmit(e) {
        e.preventDefault();
        setBusy(true);
        setError(null);
        try {
            await signup(values);
            navigate('/', { replace: true });
        } catch (err) {
            setError(err);
            setBusy(false);
        }
    }

    return(
        <AuthShell>
            <h1>Create account</h1>
            <p className="page-head__sub" style={{ marginBottom: '1.5rem' }}>
                New accounts are staff accounts. .
            </p>
            <Alert error={metaError} />
            {/* Field errors are shown next to each input, so only show the general message here. */}
            {error && <Alert error={{ message: Object.keys(fe).length ? 'Fix the highlighted fields and try again.' : error.message }} />}
            <form onSubmit={onSubmit} noValidate>
                <Field label="Full name" error={fe.name}>
                    {(p) => <input {...p} autoComplete="name" value={values.name} onChange={set('name')} required />}
                </Field>
                <Field label="Email" error={fe.email}>
                    {(p) => <input {...p} type="email" autoComplete="email" value={values.email} onChange={set('email')} required />}
                </Field>
                <Field label="Department" error={fe.department}>
                    {(p) => (
                        <select {...p} value={values.department} onChange={set('department')} required>
                          <option value="">Choose your department</option>
                          {meta?.departments.map((d) => (
                             <option key={d} value={d}>
                               {d}
                             </option>
                          ))}
                        </select>
                    )}
                </Field>
                <Field label="Password" hint="At least 8 characters, with a letter and a number." error={fe.password}>
                    {(p) => <input {...p} type="password" autoComplete="new-password" value={values.password} onChange={set('password')} required />}
                </Field>
                <button className="btn btn--block" type="submit" disabled={busy}>
                    {busy ? 'Creating account…' : 'Create account'}
                </button>
            </form>
            <p className="auth__switch">
                Already have an account? <Link to="/login">Log in</Link>
            </p>
        </AuthShell>
    );
}