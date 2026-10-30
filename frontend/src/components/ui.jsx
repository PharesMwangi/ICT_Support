import {useId} from 'react';

export function spinner({label = 'Loading'}) {
    return (
    <div className="loading" role="status">
      <span className="spinner" aria-hidden="true" />
      <span>{label}…</span>
    </div>
  );
}

// Shows an ApiError. Field-level details become a short list.
export function Alert({ error, kind = 'error', children }) {
  if (!error && !children) return null;
  const details = error?.details?.filter((d) => d.message) ?? [];
  return (
    <div className={`alert alert--${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
      {error ? error.message : children}
      {details.length > 0 && (
        <ul>
          {details.map((d, i) => (
            <li key={i}>{d.message}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Label + control + hint + error, wired together for screen readers.
export function Field({ label, error, hint, children }) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errId = `${id}-err`;
  const describedBy = [hint && hintId, error && errId].filter(Boolean).join(' ') || undefined;
  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      {children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? 'true' : undefined })}
      {hint && (
        <p className="field__hint" id={hintId}>
          {hint}
        </p>
      )}
      {error && (
        <p className="field__error" id={errId}>
          {error}
        </p>
      )}
    </div>
  );
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="page-head__sub">{subtitle}</p>}
      </div>
      {children && <div className="page-head__actions">{children}</div>}
    </div>
  );
}
