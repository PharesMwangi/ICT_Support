import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/endpoints.js';
import { useAsync } from '../hooks/useAsync.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { Alert, Field, PageHeader, Spinner } from '../components/ui.jsx';
import Markdown from '../components/Markdown.jsx';

// Used for both "new" (/kb/new) and "edit" (/kb/:id/edit).
export default function KbEditor(){
    const { id } = useParams();
    const editing = Boolean(id);
    useDocumentTitle(editing ? 'Edit article' : 'New article');
    const navigate = useNavigate();
    const { data, error: loadError, loading } = useAsync(() => (editing ? api.article(id) : Promise.resolve(null)), [id]);
    
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [tab, setTab] = useState('write');
    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(false);
    const fe = error?.fieldErrors ?? {};

    useEffect(() => {
        if (data?.article) {
          setTitle(data.article.title);
          setDescription(data.article.description);
        }
    }, [data]);

    async function onSubmit(e) {
        e.preventDefault();
        setBusy(true);
        setError(null);
        try {
          const res = editing ? await api.updateArticle(id, { title, description }) : await api.createArticle({ title, description });
          navigate(`/kb/${res.article.id}`);
        } catch (err) {
          setError(err);
          setBusy(false);
        }
    }

    if (editing && loading) return <Spinner />;
    if (editing && loadError) return <Alert error={loadError} />;

    return (
        <>
          <PageHeader
            title={editing ? 'Edit article' : 'Write an article'}
            subtitle="Staff will read this. Use short steps and plain words."
          />
          {error && <Alert error={{ message: Object.keys(fe).length ? 'Fix the highlighted fields and try again.' : error.message }} />}
          <form onSubmit={onSubmit} noValidate style={{ maxWidth: '48rem' }}>
            <Field label="Title" error={fe.title}>
              {(p) => <input {...p} maxLength={150} value={title} onChange={(e) => setTitle(e.target.value)} required />}
            </Field>
    
            <div className="field">
              <span className="field__label" id="desc-label">
                Article text
              </span>
              <div className="tabs" role="tablist" aria-label="Editor view">
                <button type="button" role="tab" aria-selected={tab === 'write'} onClick={() => setTab('write')}>
                  Write
                </button>
                <button type="button" role="tab" aria-selected={tab === 'preview'} onClick={() => setTab('preview')}>
                  Preview
                </button>
              </div>
              {tab === 'write' ? (
                <textarea
                  aria-labelledby="desc-label"
                  aria-describedby="desc-hint"
                  aria-invalid={fe.description ? 'true' : undefined}
                  style={{ minHeight: '18rem' }}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              ) : (
                <div className="preview-box">{description.trim() ? <Markdown>{description}</Markdown> : <p style={{ color: 'var(--muted)' }}>Nothing to preview yet.</p>}</div>
              )}
              <p className="field__hint" id="desc-hint">
                You can use simple formatting: <code>## Heading</code>, <code>1. numbered steps</code>, <code>- bullet points</code> and <code>**bold**</code>.
              </p>
              {fe.description && <p className="field__error">{fe.description}</p>}
            </div>
    
            <div className="form-actions">
              <button className="btn" type="submit" disabled={busy}>
                {busy ? 'Saving…' : editing ? 'Save changes' : 'Publish article'}
              </button>
              <Link className="btn btn--quiet" to={editing ? `/kb/${id}` : '/kb'}>
                Cancel
              </Link>
            </div>
          </form>
        </>
    );
}