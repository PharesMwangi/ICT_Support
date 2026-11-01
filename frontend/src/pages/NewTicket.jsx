import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/endpoints.js';
import { Alert, Field, PageHeader } from '../components/ui.jsx';
import { useMeta } from '../hooks/useMeta.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { ALLOWED_FILE_TYPES, MAX_FILES, MAX_FILE_BYTES } from '../lib/labels.js';
import { formatBytes } from '../lib/format.js';

// The server checks again (including the real file type), this just saves a round trip.
export function checkFiles(files) {
  if (files.length > MAX_FILES) return `You can attach up to ${MAX_FILES} files.`;
  for (const f of files) {
    if (!ALLOWED_FILE_TYPES.includes(f.type)) return `${f.name} is not allowed. Attach PNG, JPG or PDF files.`;
    if (f.size > MAX_FILE_BYTES) return `${f.name} is ${formatBytes(f.size)}. Each file must be 2 MB or smaller.`;
  }
  return null;
}

export default function NewTicket(){
    useDocumentTitle('New ticket');
    const { meta, error: metaError } = useMeta();
    const navigate = useNavigate();
    const [values, setValues] = useState({ category: '', summary: '', description: '' });
    const [files, setFiles] = useState([]);
    const [fileError, setFileError] = useState(null);
    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(false);
    const fe = error?.fieldErrors ?? {};
    const set = (k) => (e) => setValues((v) => ({ ...v, [k]: e.target.value }));

    function onFiles(e) {
        const chosen = Array.from(e.target.files ?? []);
        const problem = checkFiles(chosen);
        setFileError(problem);
        setFiles(problem ? [] : chosen);
        if (problem) e.target.value = '';
      }

    async function onSubmit(e) {
        e.preventDefault();
        setBusy(true);
        setError(null);
        const form = new FormData();
        form.append('category', values.category);
        form.append('summary', values.summary);
        form.append('description', values.description);
        for (const f of files) form.append('attachments', f);
        try {
          const { ticket } = await api.createTicket(form);
          navigate(`/tickets/${ticket.id}`, { replace: true, state: { created: true } });
        } catch (err) {
          setError(err);
          setBusy(false);
        }
    }

    return(
        <>
            <PageHeader title="New ticket" subtitle="Tell the ICT team what is wrong...">
                <Link className="btn btn--quiet" to="/kb">
                  Check the knowledge base first, to see if the same error had been resolved before.
                </Link>
              </PageHeader>
              <Alert error={metaError} />
              {error && <Alert error={{ message: Object.keys(fe).length ? 'Fix the highlighted fields and try again.' : error.message }} />}
              <form onSubmit={onSubmit} noValidate style={{ maxWidth: '40rem' }}>
                <Field label="Category" error={fe.category}>
                  {(p) => (
                    <select {...p} value={values.category} onChange={set('category')} required>
                      <option value="">Choose a category</option>
                      {meta?.categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  )}
                </Field>
                <Field label="Summary" hint="One line, for example: Teller printer  can-not print." error={fe.summary}>
                  {(p) => <input {...p} maxLength={150} value={values.summary} onChange={set('summary')} required />}
                </Field>
                <Field label="Details" hint="What happened, what you expected, and when it started." error={fe.description}>
                  {(p) => <textarea {...p} maxLength={5000} value={values.description} onChange={set('description')} required />}
                </Field>
                <Field label="Attachments (optional)" error={fileError ?? fe.attachments}>
                  {(p) => <input {...p} type="file" multiple accept=".png,.jpg,.jpeg,.pdf" onChange={onFiles} />}
                </Field>
                <p className="upload-note">Up to 3 files, 2 MB each. PNG, JPG or PDF.</p>
                {files.length > 0 && (
                  <ul className="file-list">
                    {files.map((f) => (
                      <li key={f.name}>
                        {f.name} ({formatBytes(f.size)})
                      </li>
                    ))}
                  </ul>
                )}
                <div className="form-actions">
                  <button className="btn" type="submit" disabled={busy || Boolean(fileError)}>
                    {busy ? 'Sending…' : 'Send ticket'}
                  </button>
                  <Link className="btn btn--quiet" to="/tickets">
                    Cancel
                  </Link>
                </div>
              </form>
        </>
    );
    
}