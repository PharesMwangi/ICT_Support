import { HttpError } from "./HttpError.js";
import { computeSlaDueAt } from "./sla.js";

// Which status a ticket may move
export const TRANSITIONS = {
    NEW: ['ASSIGNED', 'IN_PROGRESS', 'CLOSED'],
    ASSIGNED: ['IN_PROGRESS', 'PENDING', 'RESOLVED', 'CLOSED'],
    IN_PROGRESS: ['ASSIGNED', 'PENDING', 'RESOLVED', 'CLOSED'],
    PENDING: ['IN_PROGRESS', 'RESOLVED', 'CLOSED'],
    RESOLVED: ['CLOSED', 'REOPENED'],
    CLOSED: ['REOPENED'],
    REOPENED: ['ASSIGNED', 'IN_PROGRESS', 'PENDING', 'RESOLVED', 'CLOSED'],
}

export const STATUSES = Object.keys(TRANSITIONS);

//ticket needs assignee first

const NEEDS_ASSIGNEE = new Set(['ASSIGNED', 'IN_PROGRESS', 'PENDING', 'RESOLVED']);

const label = (s) =>s.toLowercase().replace('_', ' ');

export function buildTicketUpdate(ticket, body, { assignee, slaMinutes, now }) {
    const data = {};
    const events = [];

    let priority = ticket.priority;
    let assigneeId = ticket.assigneeId;
    let status = ticket.status;

    //priority
    if(body.priority && body.priority !== ticket.priority){
        priority = body.priority;
        data.priority = priority;
        data.priorityAssignedAt = now;
        data.slaDueAt = computeSlaDueAt(priority, now, slaMinutes);
        events.push({ type: 'PRIORITY_CHANGED', oldValue: ticket.priority ?? 'Not triaged', newValue: priority });
    }

    //assignee
    if(body.assigneeId && body.assigneeId !== ticket.assigneeId){
        if(!assignee) throw new HttpError(400, 'The person you chose to assign this ticket to was not found');
        if( assignee.role !== 'ADMIN' || !assignee.isActive){
            throw new HttpError(400, 'Tickets can only be assigned to active ICT admins');
        }
        if(!priority) throw new HttpError(400, 'Set a priority before assigning the ticket');

        assigneeId = assignee.id;
        data.assigneeId = assignee.id;
        events.push({ type: 'ASSIGNED', oldValue: ticket.assignee?.name ?? 'Unassigned', newValue: assignee.name });

        if (status === 'NEW' && !body.status){
            status = 'ASSIGNED';
            data.status = 'ASSIGNED';
            events.push({ type: 'STATUS_CHANGED', oldValue: 'NEW', newValue: 'ASSIGNED' });
        }
    }

    //status
    if(body.status && body.status !== status){
        const from = status;
        const to = body.status;

        if(!TRANSITIONS[from].includes(to)){
            throw new HttpError(400, `A ticket that is ${label(from)} cannot be moved to ${label(to)}`);
        }
        if(NEEDS_ASSIGNEE.has(to) && !assigneeId){
            throw new HttpError(400, 'Assign the ticket to someone first');
        }

        status = to;
        data.status = to;

        if (to === 'RESOLVED') data.resolvedAt = now;
        if (to === 'CLOSED'){
            data.closedAt = now;
            if (!ticket.resolvedAt) data.resolvedAt = now;
        }
        if(to === 'REOPENED'){
            data.resolvedAt = null;
            data.closedAt = null;
            if(priority){
                data.priorityAssignedAt = now;
                data.slaDueAt = computeSlaDueAt(priority, now, slaMinutes);
            }
        }
        events.push({ type: 'STATUS_CHANGED', oldValue: from, newValue: to });
    }

    return { data, events };
}

