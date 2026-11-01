import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api/endpoints.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { Alert, PageHeader, Spinner } from '../components/ui.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { formatDate } from '../lib/format.js';

export default function KbList(){
    useDocumentTitle('Knowledge base');
    const { isAdmin } = useAuth();
    const [params, setParams] = useSearchParams();
    const q = params.get('q') ?? '';
    const [search, setSearch] = useState(q);
    useEffect(() => setSearch(q), [q]);
    const { data, error, loading } = useAsync(() => api.articles(q), [q]);
    
    return (
        <>
          <PageHeader title="Knowledge base" subtitle="Answers and how-to guides written by the ICT team.">
            {isAdmin && (
              <Link className="btn" to="/kb/new">
                Write an article
              </Link>
            )}
          </PageHeader>
          <form
            className="filters"
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              setParams(search.trim() ? { q: search.trim() } : {});
            }}
          >
            <div className="field field--grow">
              <label className="field__label" htmlFor="kb-q">
                Search articles
              </label>
              <input id="kb-q" type="search" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <button className="btn btn--quiet" type="submit">
              Search
            </button>
          </form>
          <Alert error={error} />
          {loading && !data ? (
            <Spinner />
          ) : data?.articles.length ? (
            <ul className="kb-list">
              {data.articles.map((a) => (
                <li key={a.id}>
                  <Link to={`/kb/${a.id}`}>
                    <h2>{a.title}</h2>
                    <p>{a.excerpt}</p>
                    <small>Updated {formatDate(a.updatedAt)}</small>
                  </Link>
                </li>
              ))}
            </ul>
          ) : data ? (
            <EmptyState title={q ? `No articles match "${q}"` : 'No articles yet'}>
              {q ? (
                <p>Try different words, or create a ticket and the ICT team will help.</p>
              ) : isAdmin ? (
                <Link className="btn" to="/kb/new">
                  Write the first article
                </Link>
              ) : (
                <p>The ICT team has not published anything yet.</p>
              )}
            </EmptyState>
          ) : null}
        </>
    );
}