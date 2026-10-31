import { Link } from "react-router-dom";
import { priorityBadge, SlaStatus, StatusBadge } from "./Badges.jsx";
import {ticketNumber} from "../lib/labels.js";
import { formatDate } from "../lib/format.js";
import { useNow } from "../hooks/useNow.js";

// One row per ticket; the stripe on the left shows priority
export default function TicketQueue({tickets, showRequester, fetchedAt}){
    const now = useNow();
    const elapsed = fetchedAt ? Math.max(0, now - fetchedAt) : 0;
    return(
        <ul classname="queue">
            {tickets.map((t) =>(
                <li key={t.id} className={`queue__item queue__item--${t.priority ? t.priority.toLowerCase() : 'none'}`}>
                    <Link className="queue__link" to={`/tickets/${t.id}`}>
                        <span className="queue__num" aria-label={`Ticket ${ticketNumber(t)}`}>
                            {ticketNumber(t)}
                        </span>
                        <span>
                            <span className="queue__summary">{t.summary}</span>
                            <span className="queue__meta" style={{ display: 'block' }}>
                                {t.category}
                                {showRequester && t.requester ? `, from ${t.requester.name} (${t.requester.department})` : ''}
                                {`, opened ${formatDate(t.createdAt)}`}
                                {t.assignee ? `, assigned to ${t.assignee.name}` : showRequester ? ', unassigned' : ''}
                            </span>
                        </span>
                        <span className="queue__side">
                            <span className="queue__badges">
                                <PriorityBadge priority={t.priority} />
                                <StatusBadge status={t.status} />
                            </span>
                            <SlaStatus sla={t.sla} elapsedMs={elapsed} />
                        </span>
                    </Link>
                </li>
            ))}
        </ul>
    );
}