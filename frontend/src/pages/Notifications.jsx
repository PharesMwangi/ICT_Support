import { useState } from 'react';
import {Link} from 'react-router-dom';
import { api } from '../api/endpoints.js';
import { useAsync } from '../hooks/useAsync.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { useNotifications } from '../notifications/NotificationContext.jsx';
import { Alert, PageHeader, Spinner } from '../components/ui.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Pagination from '../components/Pagination.jsx';
import { formatDateTime } from '../lib/format.js';

const LIMIT = 20;

export default function Notifications(){
    useDocumentTitle('Notifications');
    const { refresh } = useNotifications();
    const [onlyUnread, setOnlyUnread] = useState(false);
    const [page, setPage] = useState(1);
    const { data, error, loading, reload } = useAsync(
        () => api.notifications({ unread: onlyUnread ? 'true' : '', page, limit: LIMIT }),
        [onlyUnread, page],
    );
    const [actionError, setActionError] = useState(null);

    // Clicking a notification opens the ticket and marks it read in the background.
    function open(n) {
        if (n.isRead) return;
        api
          .markRead(n.id)
          .then(refresh)
          .catch(() => {});
    }
    
    async function readAll() {
        setActionError(null);
        try {
          await api.markAllRead();
          await Promise.all([reload(), refresh()]);
        } catch (e) {
          setActionError(e);
        }
    }
    
    const unread = data?.unreadCount ?? 0;

    return (
        <>
          <PageHeader title="Notifications" subtitle="Updates on your tickets. They stay here for 60 days.">
            <button type="button" className="btn btn--quiet" onClick={readAll} disabled={unread === 0}>
              Mark all as read
            </button>
          </PageHeader>
    
          <div className="tabs" role="group" aria-label="Show">
            <button
              type="button"
              aria-pressed={!onlyUnread}
              className={!onlyUnread ? 'tabs__on' : undefined}
              onClick={() => {
                setOnlyUnread(false);
                setPage(1);
              }}
            >
              All
            </button>
            <button
              type="button"
              aria-pressed={onlyUnread}
              className={onlyUnread ? 'tabs__on' : undefined}
              onClick={() => {
                setOnlyUnread(true);
                setPage(1);
              }}
            >
              Unread{unread > 0 ? ` (${unread})` : ''}
            </button>
          </div>
    
          <Alert error={error ?? actionError} />
          {loading && !data ? (
            <Spinner />
          ) : data?.notifications.length ? (
            <>
              <ul className="notices">
                {data.notifications.map((n) => (
                  <li key={n.id} className={n.isRead ? 'notice' : 'notice notice--unread'}>
                    <Link to={n.ticketId ? `/tickets/${n.ticketId}` : '/users'} onClick={() => open(n)}>
                      {!n.isRead && <span className="sr-only">Unread: </span>}
                      <span className="notice__text">{n.message}</span>
                      <span className="notice__time">{formatDateTime(n.createdAt)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Pagination page={data.page} limit={data.limit} total={data.total} onPage={setPage} />
            </>
          ) : data ? (
            <EmptyState title={onlyUnread ? 'You are all caught up' : 'No notifications yet'}>
              <p>{onlyUnread ? 'There is nothing unread.' : 'When a ticket is assigned, updated or answered, you will see it here.'}</p>
            </EmptyState>
          ) : null}
        </>
      );
}