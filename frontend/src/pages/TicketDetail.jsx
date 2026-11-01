import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { api } from '../api/endpoints.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { useNow } from '../hooks/useNow.js';
import { Alert, Field, Spinner } from '../components/ui.jsx';
import { PriorityBadge, SlaStatus, StatusBadge } from '../components/Badges.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { PRIORITY_OPTIONS, PRIORITY_LABELS, STATUS_LABELS, STATUS_TRANSITIONS, priorityLabel, statusLabel, ticketCode, ticketNumber } from '../lib/labels.js';
import { formatBytes, formatDateTime } from '../lib/format.js';

export default function TicketDetail(){
    const { id } = useParams();
    const location = useLocation();
    const { user, isAdmin } = useAuth();
    const { data, error, loading, reload } = useAsync(() => api.ticket(id), [id]);
    const ticket = data?.ticket;
    useDocumentTitle(ticket ? ticketCode(ticket) : 'Ticket');

    if (loading && !ticket) return <Spinner />;
    if (error) {
        return (
          <EmptyState title={error.status === 404 ? 'Ticket not found' : 'Could not load this ticket'}>
            <p>{error.status === 404 ? 'It may have been removed, or it belongs to someone else.' : error.message}</p>
            <Link className="btn" to="/tickets">
              Back to tickets
            </Link>
          </EmptyState>
        );
    }
    if (!ticket) return null;

    return <TicketView key={ticket.id} ticket={ticket} created={location.state?.created} user={user} isAdmin={isAdmin} reload={reload} />;
}

function TicketView({ ticket, created, user, isAdmin, reload }){
    const [fetchedAt] = useState(() => Date.now());
    const now = useNow();
    const elapsed = Math.max(0, now - fetchedAt);
    const isOwner = ticket.requester.id === user.id;
    const canReopen = (isOwner || isAdmin) && (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED');
    const [reopenError, setReopenError] = useState(null);
    const [reopening, setReopening] = useState(false);

    async function reopen() {
        setReopening(true);
        setReopenError(null);
        try {
          await api.reopenTicket(ticket.id);
          await reload();
        } catch (e) {
          setReopenError(e);
        } finally {
          setReopening(false);
        }
    }

    return (
        <>
          <p style={{ marginBottom: '1rem' }}>
            <Link to="/tickets">{isAdmin ? 'Ticket queue' : 'My tickets'}</Link>
          </p>
          {created && <Alert kind="success">Your ticket has been sent. The ICT team will look at it soon.</Alert>}
    
          <div className="chit">
            <div className="chit__stub">
              <span className="chit__label">Ticket</span>
              <span className="chit__number">{ticketNumber(ticket)}</span>
            </div>
            <div className="chit__body">
              <h1 className="chit__summary">{ticket.summary}</h1>
              <div className="chit__badges">
                <StatusBadge status={ticket.status} />
                <PriorityBadge priority={ticket.priority} />
                <SlaStatus sla={ticket.sla} elapsedMs={elapsed} />
              </div>
            </div>
          </div>
    
          <div className="cols section">
            <div className="stack">
              <section aria-labelledby="desc-h">
                <h2 id="desc-h" className="divider-title">
                  Details
                </h2>
                <p className="description">{ticket.description}</p>
              </section>
    
              {ticket.attachments.length > 0 && (
                <section aria-labelledby="att-h">
                  <h2 id="att-h" className="divider-title">
                    Attachments
                  </h2>
                  <ul className="attachments">
                    {ticket.attachments.map((a) => {
                      const url = api.attachmentUrl(ticket.id, a.id);
                      return (
                        <li key={a.id}>
                          {a.mimeType.startsWith('image/') && <img src={url} alt={`Attached image ${a.fileName}`} loading="lazy" />}
                          <a href={url} download={a.fileName}>
                            {a.fileName}
                          </a>
                          <span style={{ color: 'var(--muted)' }}>{formatBytes(a.sizeBytes)}</span>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}
    
              <Activity ticket={ticket} isAdmin={isAdmin} reload={reload} />
            </div>
    
            <aside className="stack" aria-label="Ticket information">
              {canReopen && (
                <div className="panel">
                  <h2>Not fixed?</h2>
                  <p>Reopen this ticket and the ICT team will pick it up again.</p>
                  <Alert error={reopenError} />
                  <button type="button" className="btn" onClick={reopen} disabled={reopening}>
                    {reopening ? 'Reopening…' : 'Reopen ticket'}
                  </button>
                </div>
              )}
              {isAdmin && <AdminPanel ticket={ticket} reload={reload} />}
              <div className="panel">
                <h2>Summary</h2>
                <dl className="facts">
                  <dt>Requester</dt>
                  <dd>
                    {ticket.requester.name}, {ticket.requester.department}
                    {ticket.requester.email && (
                      <>
                        <br />
                        <a href={`mailto:${ticket.requester.email}`}>{ticket.requester.email}</a>
                      </>
                    )}
                  </dd>
                  <dt>Category</dt>
                  <dd>{ticket.category}</dd>
                  <dt>Assigned to</dt>
                  <dd>{ticket.assignee?.name ?? 'Not assigned yet'}</dd>
                  <dt>Opened</dt>
                  <dd>{formatDateTime(ticket.createdAt)}</dd>
                  {ticket.slaDueAt && (
                    <>
                      <dt>Due</dt>
                      <dd>{formatDateTime(ticket.slaDueAt)}</dd>
                    </>
                  )}
                  {ticket.resolvedAt && (
                    <>
                      <dt>Resolved</dt>
                      <dd>{formatDateTime(ticket.resolvedAt)}</dd>
                    </>
                  )}
                </dl>
              </div>
            </aside>
          </div>
        </>
      );
    }
    
    function eventText(e) {
      const nice = (v, map) => map?.[v] ?? v;
      switch (e.type) {
        case 'CREATED':
          return 'opened this ticket';
        case 'STATUS_CHANGED':
          return `changed the status from ${nice(e.oldValue, STATUS_LABELS)} to ${nice(e.newValue, STATUS_LABELS)}`;
        case 'PRIORITY_CHANGED':
          return `changed the priority from ${nice(e.oldValue, PRIORITY_LABELS)} to ${nice(e.newValue, PRIORITY_LABELS)}`;
        case 'ASSIGNED':
          return `assigned this ticket to ${e.newValue}`;
        default:
          return 'updated this ticket';
      }
    }
    
    function Activity({ ticket, isAdmin, reload }) {
      const items = useMemo(
        () =>
          [
            ...ticket.events.map((e, i) => ({ kind: 'event', key: `e${i}`, at: e.createdAt, who: e.actor.name, event: e })),
            ...ticket.comments.map((c) => ({ kind: 'comment', key: c.id, at: c.createdAt, who: c.author.name, comment: c })),
          ].sort((a, b) => new Date(a.at) - new Date(b.at)),
        [ticket],
      );
      const [body, setBody] = useState('');
      const [internal, setInternal] = useState(false);
      const [error, setError] = useState(null);
      const [busy, setBusy] = useState(false);
    
      async function submit(e) {
        e.preventDefault();
        setBusy(true);
        setError(null);
        try {
          await api.addComment(ticket.id, body, isAdmin && internal);
          setBody('');
          setInternal(false);
          await reload();
        } catch (err) {
          setError(err);
        } finally {
          setBusy(false);
        }
      }
    
      return (
        <section aria-labelledby="act-h">
          <h2 id="act-h" className="divider-title">
            Activity
          </h2>
          <ol className="activity">
            {items.map((it) =>
              it.kind === 'event' ? (
                <li key={it.key} className="activity__item">
                  <div className="activity__head">
                    <strong>{it.who}</strong> {eventText(it.event)}
                  </div>
                  <div className="activity__head">{formatDateTime(it.at)}</div>
                </li>
              ) : (
                <li key={it.key} className={`activity__item activity__item--comment ${it.comment.isInternal ? 'activity__item--internal' : ''}`}>
                  <div className="activity__head">
                    <strong>{it.who}</strong> {it.comment.author.role === 'ADMIN' ? '(ICT) ' : ''}
                    {it.comment.isInternal ? 'wrote an internal note' : 'commented'}, {formatDateTime(it.at)}
                  </div>
                  <p className="activity__comment">{it.comment.body}</p>
                </li>
              ),
            )}
          </ol>
    
          <form onSubmit={submit} noValidate style={{ marginTop: '0.5rem', maxWidth: '40rem' }}>
            <Alert error={error} />
            <Field label={isAdmin ? 'Add a comment or note' : 'Add a comment'}>
              {(p) => <textarea {...p} style={{ minHeight: '5.5rem' }} maxLength={2000} value={body} onChange={(e) => setBody(e.target.value)} />}
            </Field>
            {isAdmin && (
              <label className="check">
                <input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} />
                <span>Internal note, only the ICT team can see it</span>
              </label>
            )}
            <button className="btn" type="submit" disabled={busy || !body.trim()}>
              {busy ? 'Sending…' : internal ? 'Add internal note' : 'Add comment'}
            </button>
          </form>
        </section>
    );
    
}

function AdminPanel({ ticket, reload }) {
    const { data: adminData } = useAsync(() => api.users({ role: 'ADMIN' }), []);
    const admins = (adminData?.users ?? []).filter((u) => u.isActive || u.id === ticket.assignee?.id);
    
    const [priority, setPriority] = useState(ticket.priority ?? '');
    const [assigneeId, setAssigneeId] = useState(ticket.assignee?.id ?? '');
    const [status, setStatus] = useState(ticket.status);
    const [error, setError] = useState(null);
    const [saved, setSaved] = useState(false);
    const [busy, setBusy] = useState(false);

    // After a save the server may have changed more than we sent (assigning moves New to Assigned).
    useEffect(() => {
        setPriority(ticket.priority ?? '');
        setAssigneeId(ticket.assignee?.id ?? '');
        setStatus(ticket.status);
    }, [ticket.priority, ticket.assignee?.id, ticket.status]);
    
    // Send only what changed, so the history stays clean.
      const changes = {};
      if (priority && priority !== (ticket.priority ?? '')) changes.priority = priority;
      if (assigneeId && assigneeId !== (ticket.assignee?.id ?? '')) changes.assigneeId = assigneeId;
      if (status !== ticket.status) changes.status = status;
      const dirty = Object.keys(changes).length > 0;
    
      const statusChoices = [ticket.status, ...(STATUS_TRANSITIONS[ticket.status] ?? [])];
      const needsPriority = !ticket.priority && !priority && Boolean(changes.assigneeId);
    
      async function save(e) {
        e.preventDefault();
        setBusy(true);
        setError(null);
        setSaved(false);
        try {
          await api.updateTicket(ticket.id, changes);
          await reload();
          setSaved(true);
        } catch (err) {
          setError(err);
        } finally {
          setBusy(false);
        }
    }

    return (
        <form className="panel" onSubmit={save} noValidate>
          <h2>Manage ticket</h2>
          <Alert error={error} />
          {saved && !dirty && <Alert kind="success">Changes saved.</Alert>}
          <Field
            label="Priority"
            hint={ticket.priority ? 'Changing it restarts the SLA timer.' : 'Setting the priority starts the SLA timer: High 3 hours, Normal 6 hours, Low 2 days.'}
          >
            {(p) => (
              <select {...p} value={priority} onChange={(e) => setPriority(e.target.value)}>
                {!ticket.priority && <option value="">Not triaged</option>}
                {PRIORITY_OPTIONS.map((v) => (
                  <option key={v} value={v}>
                    {priorityLabel(v)}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Assigned to" hint={needsPriority ? 'Set a priority before assigning.' : undefined} error={needsPriority ? 'Choose a priority first.' : undefined}>
            {(p) => (
              <select {...p} value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
                <option value="">{ticket.assignee ? 'Keep current assignee' : 'Not assigned'}</option>
                {admins.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Status">
            {(p) => (
              <select {...p} value={status} onChange={(e) => setStatus(e.target.value)}>
                {statusChoices.map((s) => (
                  <option key={s} value={s}>
                    {statusLabel(s)}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <button className="btn btn--block" type="submit" disabled={!dirty || busy || needsPriority}>
            {busy ? 'Saving…' : 'Save changes'}
          </button>
        </form>
    );
}