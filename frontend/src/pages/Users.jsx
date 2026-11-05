import { useState } from 'react';
import { api } from '../api/endpoints.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { useMeta } from '../hooks/useMeta.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { Alert, Field, PageHeader, Spinner } from '../components/ui.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { roleLabel } from '../lib/labels.js';
import { formatDateTime } from '../lib/format.js';

const ADMIN_DEPARTMENT = 'ICT';

export default function Users(){
    useDocumentTitle('Users');
    const { user: me } = useAuth();
    const { meta } = useMeta();
    const [department, setDepartment] = useState('');
    const [role, setRole] = useState('');
    const { data, error, loading, reload } = useAsync(() => api.users({ department, role }), [department, role]);
    const [actionError, setActionError] = useState(null);
    const [notice, setNotice] = useState(null);
    const [busyId, setBusyId] = useState(null);
    const resets = useAsync(() => api.passwordResets(), []);
    const [issued, setIssued] = useState(null); 

    async function run(u, label, confirmText, fn) {
        if (!window.confirm(confirmText)) return;
        setBusyId(u.id);
        setActionError(null);
        setNotice(null);
        try {
            await fn();
            setNotice(`${label}: ${u.name}.`);
            await reload();
        } catch (e) {
            setActionError(e);
        } finally {
            setBusyId(null);
        }
    }

    // Gives the person a one-time code.
    async function giveCode(key, call) {
      setBusyId(key);
      setActionError(null);
      setNotice(null);
      try {
        setIssued(await call());
        await resets.reload();
      } catch (e) { 
        setActionError(e);
      } finally {
        setBusyId(null);
      }
    }
    const codeFromRequest = (r) => giveCode(r.id, () => api.issueResetCode(r.id));
    const codeForUser = (u) => {
      if (!window.confirm(`Do you want to create a password reset code for ${u.name}? Only do this after you are sure it is really them.`)) return;
      giveCode(u.id, () => api.startUserReset(u.id));
    };
    async function dismiss(r) {
      setBusyId(r.id);
      setActionError(null);
      try {
        await api.dismissReset(r.id);
        await resets.reload();
        } catch (e) {
          setActionError(e);
        } finally {
          setBusyId(null);
        }
    }

    const makeAdmin = (u) =>
      run(u, 'Made ICT admin', `Make ${u.name} an ICT admin? They will be able to manage all tickets, write articles, see reports and manage users.`, () => api.setRole(u.id, 'ADMIN'));
    const makeStaff = (u) => run(u, 'Changed to staff', `Remove admin access from ${u.name}?`, () => api.setRole(u.id, 'STAFF'));
    const deactivate = (u) => run(u, 'Deactivated', `Deactivate ${u.name}? They will not be able to log in.`, () => api.setActive(u.id, false));
    const activate = (u) => run(u, 'Reactivated', `Reactivate ${u.name}?`, () => api.setActive(u.id, true));
    
    return(
        <>
            <PageHeader title="Users" subtitle={`Only active ${ADMIN_DEPARTMENT} department staff can be made admins.`} />
            <div className="filters">
                <Field label="Department">
                  {(p) => (
                    <select {...p} value={department} onChange={(e) => setDepartment(e.target.value)}>
                      <option value="">All departments</option>
                        {meta?.departments.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                    </select>
                  )}
                </Field>
                <Field label="Role">
                  {(p) => (
                    <select {...p} value={role} onChange={(e) => setRole(e.target.value)}>
                        <option value="">All roles</option>
                        <option value="ADMIN">ICT admin</option>
                        <option value="STAFF">Staff</option>
                    </select>
                  )}
                </Field>
            </div>
            <Alert error={error ?? actionError} />
            {issued && (
              <div className="code-box" role="status">
                <strong>Reset code for {issued.user.name}</strong>
                <span className="code-box__code">{issued.code}</span>
                <p>
                  Provide {issued.user.name} with this code. It expires at {formatDateTime(issued.expiresAt)}.
                  
                </p>
                <button type="button" className="btn btn--quiet btn--small" onClick={() => setIssued(null)}>
                  Done, hide the code
                </button>
              </div>
          )}
            {resets.data?.resets.length > 0 && (
              <section aria-labelledby="reset-h" style={{ marginBottom: '1.5rem' }}>
                <h2 id="reset-h" className="section__title">
                    Password reset requests
                </h2>
                <ul className="requests">
                  {resets.data.resets.map((r) => (
                    <li key={r.id}>
                      <span>
                        <strong>{r.user.name}</strong> ({r.user.department})
                        <span className="requests__meta" style={{ display: 'block' }}>
                          {r.status === 'PENDING' ? `Asked ${formatDateTime(r.createdAt)}` : `Code given, expires ${formatDateTime(r.expiresAt)}`}
                        </span>
                      </span>
                      <span className="table__actions">
                        <button type="button" className="btn btn--small" disabled={busyId === r.id} onClick={() => codeFromRequest(r)}>
                          {r.status === 'PENDING' ? 'Create code' : 'Create a new code'}
                        </button>
                        <button type="button" className="btn btn--quiet btn--small" disabled={busyId === r.id} onClick={() => dismiss(r)}>
                          Dismiss
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {notice && <Alert kind="success">{notice}</Alert>}
            {loading && !data ? (
                <Spinner />
            ) : data?.users.length ? (
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th scope="col">Name</th>
                        <th scope="col">Department</th>
                        <th scope="col">Role</th>
                        <th scope="col">Status</th>
                        <th scope="col">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.users.map((u) => {
                        const self = u.id === me.id;
                        const busy = busyId === u.id;
                        return (
                          <tr key={u.id}>
                            <td>
                              <strong>{u.name}</strong>
                              {self && ' (you)'}
                              <br />
                                <span style={{ color: 'var(--muted)' }}>{u.email}</span>
                            </td>
                            <td>{u.department}</td>
                            <td>{roleLabel(u.role)}</td>
                            <td>{u.isActive ? 'Active' : 'Deactivated'}</td>
                            <td>
                              {self ? (
                                <span style={{ color: 'var(--muted)' }}>No actions on your own account</span>
                              ) : (
                                    <div className="table__actions">
                                      {u.role === 'STAFF' ? (
                                        <button
                                          type="button"
                                          className="btn btn--small"
                                          disabled={busy || !u.isActive || u.department !== ADMIN_DEPARTMENT}
                                          title={u.department !== ADMIN_DEPARTMENT ? `Only ${ADMIN_DEPARTMENT} staff can be admins` : undefined}
                                          onClick={() => makeAdmin(u)}
                                        >
                                          Make admin
                                        </button>
                                      ) : (
                                        <button type="button" className="btn btn--quiet btn--small" disabled={busy} onClick={() => makeStaff(u)}>
                                          Make staff
                                        </button>
                                      )}
                                      {u.isActive && (
                                        <button type="button" className="btn btn--quiet btn--small" disabled={busy || busyId === u.id} onClick={() => codeForUser(u)}>
                                          Reset password
                                        </button>
                                      )}
                                      {u.isActive ? (
                                        <button type="button" className="btn btn--danger btn--small" disabled={busy} onClick={() => deactivate(u)}>
                                          Deactivate
                                        </button>
                                      ) : (
                                        <button type="button" className="btn btn--quiet btn--small" disabled={busy} onClick={() => activate(u)}>
                                          Reactivate
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <EmptyState title="No users match these filters" />
                )}
        </>
    );
}