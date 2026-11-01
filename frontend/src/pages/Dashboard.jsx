import { Link } from 'react-router-dom';
import { api } from '../api/endpoints.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { Alert, PageHeader, Spinner } from '../components/ui.jsx';
import TicketQueue from '../components/TicketQueue.jsx';
import EmptyState from '../components/EmptyState.jsx';

export default function Dashboard() {
  useDocumentTitle('Dashboard');
  const { user, isAdmin } = useAuth();
  return isAdmin ? <AdminDashboard name={user.name} /> : <StaffDashboard name={user.name} />;
}

const firstName = (n) => n.split(' ')[0];

function StaffDashboard({ name }) {
  const { data, error, loading } = useAsync(() => api.tickets({ limit: 5 }), []);
  const { data: openData } = useAsync(() => api.tickets({ status: 'OPEN', limit: 1 }), []);
  return (
    <>
      <PageHeader title={`Hello, ${firstName(name)}`} subtitle="Report a problem and follow it here.">
        <Link className="btn" to="/tickets/new">
          New ticket
        </Link>
      </PageHeader>
      <Alert error={error} />
      {loading ? (
        <Spinner />
      ) : (
        <>
          <div className="board">
            <div className="board__item">
              <span className="board__num">{openData?.total ?? 0}</span>
              <span className="board__label">Open tickets</span>
            </div>
            <div className="board__item">
              <span className="board__num">{data?.total ?? 0}</span>
              <span className="board__label">All tickets</span>
            </div>
          </div>
          <section className="section">
            <h2 className="section__title">Your latest tickets</h2>
            {data?.tickets.length ? (
              <>
                <TicketQueue tickets={data.tickets} fetchedAt={Date.now()} />
                <p style={{ marginTop: '1rem' }}>
                  <Link to="/tickets">See all your tickets</Link>
                </p>
              </>
            ) : (
              <EmptyState title="You have no tickets yet">
                <p>When something is not working, tell the ICT team here. Check the knowledge base first, it may already have the answer.</p>
                <Link className="btn" to="/tickets/new">
                  Create your first ticket
                </Link>
              </EmptyState>
            )}
          </section>
        </>
      )}
    </>
  );
}

function AdminDashboard({ name }) {
  const summary = useAsync(() => api.summary({}), []);
  const next = useAsync(() => api.tickets({ status: 'OPEN', limit: 8 }), []);
  const s = summary.data;
  return (
    <>
      <PageHeader title={`Queue, ${firstName(name)}`} subtitle="What needs the ICT team right now.">
        <Link className="btn btn--quiet" to="/tickets?status=OPEN&assignee=me">
          Assigned to me
        </Link>
        <Link className="btn" to="/tickets">
          Open the queue
        </Link>
      </PageHeader>
      <Alert error={summary.error ?? next.error} />
      {summary.loading || next.loading ? (
        <Spinner />
      ) : (
        <>
          {s && (
            <div className="board">
              <Link className="board__item" to="/tickets?status=OPEN&priority=NONE">
                <span className="board__num">{s.untriagedOpen}</span>
                <span className="board__label">Not triaged</span>
              </Link>
              <div className={`board__item ${s.breached ? 'board__item--alert' : ''}`}>
                <span className="board__num">{s.breached}</span>
                <span className="board__label">Overdue</span>
              </div>
              <div className={`board__item ${s.atRisk ? 'board__item--warn' : ''}`}>
                <span className="board__num">{s.atRisk}</span>
                <span className="board__label">At risk</span>
              </div>
              <Link className="board__item" to="/tickets?status=OPEN">
                <span className="board__num">{s.open}</span>
                <span className="board__label">Open</span>
              </Link>
            </div>
          )}
          <section className="section">
            <h2 className="section__title">Next in the queue</h2>
            <p className="page-head__sub" style={{ margin: '0 0 0.75rem' }}>
              Not triaged first, then High, Normal and Low. Oldest first in each group.
            </p>
            {next.data?.tickets.length ? (
              <>
                <TicketQueue tickets={next.data.tickets} showRequester fetchedAt={Date.now()} />
                {next.data.total > next.data.tickets.length && (
                  <p style={{ marginTop: '1rem' }}>
                    <Link to="/tickets?status=OPEN">See all {next.data.total} open tickets</Link>
                  </p>
                )}
              </>
            ) : (
              <EmptyState title="The queue is empty">
                <p>There are no open tickets right now.</p>
              </EmptyState>
            )}
          </section>
          {s?.sla && (
            <section className="section">
              <h2 className="section__title">SLA compliance</h2>
              <div className="panel">
                <p style={{ marginBottom: 0 }}>
                  {s.sla.compliancePercent == null ? (
                    'No resolved tickets with an SLA yet.'
                  ) : (
                    <>
                      <strong>{Math.round(s.sla.compliancePercent)}%</strong> of resolved tickets met their SLA ({s.sla.met} met, {s.sla.missed} missed).
                    </>
                  )}
                </p>
              </div>
            </section>
          )}
        </>
      )}
    </>
  );
}
