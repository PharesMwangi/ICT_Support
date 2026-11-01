import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api/endpoints.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { useMeta } from '../hooks/useMeta.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { Alert, Field, PageHeader, Spinner } from '../components/ui.jsx';
import TicketQueue from '../components/TicketQueue.jsx';
import Pagination from '../components/Pagination.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { STATUS_LABELS } from '../lib/labels.js';

const LIMIT = 25;

export default function Tickets(){
    const { isAdmin } = useAuth();
    useDocumentTitle(isAdmin ? 'Ticket queue' : 'My tickets');
    const { meta } = useMeta();
    const [params, setParams] = useSearchParams();

    // The admin queue starts on open tickets. Filters live in the address, so a filtered view can be shared or bookmarked.
    const status = params.get('status') ?? (isAdmin ? 'OPEN' : '');
    const priority = params.get('priority') ?? '';
    const category = params.get('category') ?? '';
    const assignee = params.get('assignee') ?? '';
    const q = params.get('q') ?? '';
    const page = Number(params.get('page') ?? 1) || 1;

    const [search, setSearch] = useState(q);
    useEffect(() => setSearch(q), [q]);

    function update(changes) {
        const next = new URLSearchParams(params);
        if (!('page' in changes)) next.delete('page');
        for (const [k, v] of Object.entries(changes)) {
        if (v === '' || v == null) next.delete(k);
        else next.set(k, v);
        }
        // An empty status means "all" for admins, so keep it explicit in the address.
        if (isAdmin && 'status' in changes && changes.status === '') next.set('status', 'ALL');
        setParams(next);
    }

    const apiStatus = status === 'ALL' ? '' : status;
    const query = { status: apiStatus, priority, category, assignee: isAdmin ? assignee : '', q, page, limit: LIMIT };
    const { data, error, loading } = useAsync(() => api.tickets(query), [apiStatus, priority, category, assignee, q, page, isAdmin]);
    const fetchedAt = Date.now();

    const filtered = Boolean(q || priority || category || assignee || (apiStatus && !(isAdmin && apiStatus === 'OPEN')));

    return (
        <>
          <PageHeader title={isAdmin ? 'Ticket queue' : 'My tickets'}>
            {!isAdmin && (
              <Link className="btn" to="/tickets/new">
                New ticket
              </Link>
            )}
          </PageHeader>
    
          <form
            className="filters"
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              update({ q: search.trim() });
            }}
          >
            <div className="field field--grow">
              <label className="field__label" htmlFor="f-q">
                Search
              </label>
              <input id="f-q" type="search" placeholder="Summary, details or ticket number" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Field label="Status">
              {(p) => (
                <select {...p} value={status} onChange={(e) => update({ status: e.target.value })}>
                  {!isAdmin && <option value="">All</option>}
                  {isAdmin && <option value="ALL">All</option>}
                  <option value="OPEN">Open</option>
                  {Object.entries(STATUS_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              )}
            </Field>
            <Field label="Priority">
              {(p) => (
                <select {...p} value={priority} onChange={(e) => update({ priority: e.target.value })}>
                  <option value="">Any</option>
                  <option value="NONE">Not triaged</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Normal</option>
                  <option value="LOW">Low</option>
                </select>
              )}
            </Field>
            <Field label="Category">
              {(p) => (
                <select {...p} value={category} onChange={(e) => update({ category: e.target.value })}>
                  <option value="">Any</option>
                  {meta?.categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              )}
            </Field>
            {isAdmin && (
              <Field label="Assigned to">
                {(p) => (
                  <select {...p} value={assignee} onChange={(e) => update({ assignee: e.target.value })}>
                    <option value="">Anyone</option>
                    <option value="me">Me</option>
                  </select>
                )}
              </Field>
            )}
            <button className="btn btn--quiet" type="submit">
              Search
            </button>
          </form>
    
          <Alert error={error} />
          {loading && !data ? (
            <Spinner />
          ) : data && data.tickets.length > 0 ? (
            <>
              <TicketQueue tickets={data.tickets} showRequester={isAdmin} fetchedAt={fetchedAt} />
              <Pagination page={data.page} limit={data.limit} total={data.total} onPage={(p) => update({ page: p })} />
            </>
          ) : data ? (
            <EmptyState title={filtered ? 'No tickets match these filters' : isAdmin ? 'The queue is empty' : 'You have no tickets yet'}>
              {filtered ? (
                <button className="btn btn--quiet" type="button" onClick={() => setParams(isAdmin ? new URLSearchParams({ status: 'ALL' }) : {})}>
                  Clear filters
                </button>
              ) : isAdmin ? (
                <p>There are no tickets yet.</p>
              ) : (
                <Link className="btn" to="/tickets/new">
                  Create a ticket
                </Link>
              )}
            </EmptyState>
          ) : null}
        </>
    );
}