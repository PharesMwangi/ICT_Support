import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/endpoints.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { Alert, PageHeader, Spinner } from '../components/ui.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Markdown from '../components/Markdown.jsx';
import { formatDate } from '../lib/format.js';

export default function KbArticle(){
    const { id } = useParams();
    const { isAdmin } = useAuth();
    const navigate = useNavigate();
    const { data, error, loading } = useAsync(() => api.article(id), [id]);
    const article = data?.article;
    useDocumentTitle(article?.title ?? 'Article');
    const [deleteError, setDeleteError] = useState(null);

    async function remove() {
        if (!window.confirm('Delete this article? This cannot be undone.')) return;
        try {
          await api.deleteArticle(id);
          navigate('/kb', { replace: true });
        } catch (e) {
          setDeleteError(e);
        }
    }

    if (loading && !article) return <Spinner />;
      if (error) {
        return (
          <EmptyState title={error.status === 404 ? 'Article not found' : 'Could not load this article'}>
            <p>{error.status === 404 ? 'It may have been deleted.' : error.message}</p>
            <Link className="btn" to="/kb">
              Back to the knowledge base
            </Link>
          </EmptyState>
        );
    }
    if (!article) return null;

    return (
        <>
          <p style={{ marginBottom: '1rem' }}>
            <Link to="/kb">Knowledge base</Link>
          </p>
          <PageHeader title={article.title} subtitle={`By ${article.author.name}. Updated ${formatDate(article.updatedAt)}.`}>
            {isAdmin && (
              <>
                <Link className="btn btn--quiet" to={`/kb/${article.id}/edit`}>
                  Edit
                </Link>
                <button type="button" className="btn btn--danger" onClick={remove}>
                  Delete
                </button>
              </>
            )}
          </PageHeader>
          <Alert error={deleteError} />
          <Markdown>{article.description}</Markdown>
          <p style={{ marginTop: '2.5rem', color: 'var(--muted)' }}>
            Did this not solve it? <Link to="/tickets/new">Create a ticket</Link>.
          </p>
        </>
    );
}