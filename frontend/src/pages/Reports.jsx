import { useState } from 'react';
import { api } from '../api/endpoints.js';
import { useAsync } from '../hooks/useAsync.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { Alert, Field, PageHeader, Spinner } from '../components/ui.jsx';
import { PRIORITY_LABELS, STATUS_LABELS } from '../lib/labels.js';
import { formatDate, toDateInput } from '../lib/format.js';

function Bars({ title, rows, kind }){
    const max = Math.max(1, ...rows.map((r) => r.count));
    return (
      <section className="panel" aria-label={title}>
        <h2>{title}</h2>
        {rows.every((r) => r.count === 0) ? (
            <p style={{ color: 'var(--muted)', margin: 0 }}>No tickets in this period.</p>
        ) : (
            <ul className="bars">
            {rows.map((r) => (
                <li key={r.label}>
                <span>{r.label}</span>
                <span className="bars__track" aria-hidden="true">
                    <span className={`bars__fill ${r.tone ? `bars__fill--${r.tone}` : ''}`} style={{ display: 'block', width: `${(r.count / max) * 100}%` }} />
                </span>
                <span className="bars__count">{r.count}</span>
                </li>
            ))}
            </ul>
        )}
      </section>
  );
}

// Turns { KEY: n } into rows, in a fixed order when one is given.
function rowsFrom(obj = {}, order, labels = {}, tones = {}) {
  const keys = order ?? Object.keys(obj).sort((a, b) => obj[b] - obj[a]);
  return keys.map((k) => ({ label: labels[k] ?? k, count: obj[k] ?? 0, tone: tones[k] }));
}

export default function Reports(){
    useDocumentTitle('Reports');
    const today = new Date();
    const [from, setFrom] = useState(toDateInput(new Date(today.getTime() - 29 * 86400000)));
    const [to, setTo] = useState(toDateInput(today));
    const invalid = from && to && from > to;
    const { data: s, error, loading } = useAsync(() => (invalid ? Promise.resolve(null) : api.summary({ from, to })), [from, to, invalid]);

    return (
        <>
          <PageHeader title="Reports" subtitle={s ? `Tickets opened from ${formatDate(s.range.from)} to ${formatDate(s.range.to)}.` : 'Tickets opened in a period.'}>
            <a className="btn btn--quiet" href={api.csvUrl({ from, to })} download>
              Download CSV
            </a>
          </PageHeader>
          <div className="filters">
            <Field label="From">{(p) => <input {...p} type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} />}</Field>
            <Field label="To">{(p) => <input {...p} type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} />}</Field>
          </div>
          {invalid && <Alert error={{ message: 'The start date must be before the end date.' }} />}
          <Alert error={error} />
          {loading && !s ? (
            <Spinner />
          ) : s ? (
            <div className="stack">
              <div className="board">
                <div className="board__item">
                  <span className="board__num">{s.total}</span>
                  <span className="board__label">Tickets</span>
                </div>
                <div className="board__item">
                  <span className="board__num">{s.open}</span>
                  <span className="board__label">Still open</span>
                </div>
                <div className={`board__item ${s.breached ? 'board__item--alert' : ''}`}>
                  <span className="board__num">{s.breached}</span>
                  <span className="board__label">Overdue now</span>
                </div>
                <div className="board__item">
                  <span className="board__num">{s.sla.compliancePercent == null ? '-' : `${Math.round(s.sla.compliancePercent)}%`}</span>
                  <span className="board__label">SLA met ({s.sla.met} met, {s.sla.missed} missed)</span>
                </div>
                <div className="board__item">
                  <span className="board__num">{s.avgResolutionHours == null ? '-' : `${Math.round(s.avgResolutionHours * 10) / 10}h`}</span>
                  <span className="board__label">Average time to resolve</span>
                </div>
              </div>
              <div className="cols" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(20rem, 1fr))' }}>
                <Bars title="By status" rows={rowsFrom(s.byStatus, Object.keys(STATUS_LABELS), STATUS_LABELS)} />
                <Bars
                  title="By priority"
                  rows={rowsFrom(s.byPriority, ['HIGH', 'MEDIUM', 'LOW', 'UNTRIAGED'], { ...PRIORITY_LABELS, UNTRIAGED: 'Not triaged' }, { HIGH: 'high', MEDIUM: 'medium', LOW: 'low' })}
                />
                <Bars title="By category" rows={rowsFrom(s.byCategory)} />
                <Bars title="By department" rows={rowsFrom(s.byDepartment)} />
                <Bars title="By assignee" rows={rowsFrom(s.byAssignee)} />
              </div>
            </div>
          ) : null}
        </>
    );
}