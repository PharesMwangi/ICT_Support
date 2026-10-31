import { priolityLabel, statusLabel} from '../lib/labels.js';
import { slaText } from '../lib/format.js';

export function PriorityBadge({ priority }) {
    const cls = priority ? `badge--${priority.toLowerCase()}` : 'badge';
    return <span className={`badge ${cls}`}>{priorityLabel(priority)}</span>;
}

export function statusBadge({ status}){
    const done = status === 'RESOLVED' || status === 'CLOSED';
    return <span className={`badge ${done ? 'badge--done' : 'badge--status'}`}>{statusLabel(status)}</span>;
}


// `elapsedMs` is the time since the data was fetched, so the countdown keeps moving.
export function slaStatus({sla, elapsedMs = 0}) {
    if (!sla) return null;
    let live = sla;
    if (sla.remainingMs != null && ['ON_TRACK', 'AT_RISK', 'BREACHED'].includes(sla.status)) {
       const remainingMs = sla.remainingMs - elapsedMs;
       live = { status: remainingMs < 0 ? 'BREACHED' : sla.status, remainingMs };
    }
    return <span className={`sla sla--${live.status.toLowerCase()}`}>{slaText(live)}</span>;
}
