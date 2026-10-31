import { useState } from 'react';
import { api } from '../api/endpoints.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { useMeta } from '../hooks/useMeta.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { Alert, Field, PageHeader, Spinner } from '../components/ui.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { roleLabel } from '../lib/labels.js';

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