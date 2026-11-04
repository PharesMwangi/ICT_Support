import { prisma } from './prisma.js';
import { ticketCode } from './ticketFormat.js';

const STATUS_TEXT = {
  NEW: 'New',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In progress',
  PENDING: 'Pending',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
  REOPENED: 'Reopened',
};
const PRIORITY_TEXT = { HIGH: 'High', MEDIUM: 'Normal', LOW: 'Low' };

const short = (text, max = 80) => (text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text);

async function safely(label, fn) {
  try {
    await fn();
  } catch (err) {
    console.error(`Notification failed (${label}): ${err.message}`);
  }
}

async function activeAdminIds() {
  const admins = await prisma.user.findMany({ where: { role: 'ADMIN', isActive: true }, select: { id: true } });
  return admins.map((a) => a.id);
}

// items: [{ userId, type, message }]. One notification per person: the first item for a person wins.
async function save(ticketId, actorId, items) {
  const seen = new Set([actorId]);
  const data = [];
  for (const item of items) {
    if (!item.userId || seen.has(item.userId)) continue;
    seen.add(item.userId);
    data.push({ userId: item.userId, ticketId, type: item.type, message: item.message });
  }
  if (data.length > 0) await prisma.notification.createMany({ data });
}

// password reset
export function notifyPasswordResetRequested({ user }) {
  return safely('password reset requested', async () => {
    const adminIds = await activeAdminIds();
    const message = `${user.name} (${user.department}) forgot their password. Open Users to give them a reset code.`;
    await save(null, user.id, adminIds.map((userId) => ({ userId, type: 'PASSWORD_RESET_REQUEST', message })));
  });
}

// ticket
export function notifyTicketCreated({ ticket, actor }) {
  return safely('ticket created', async () => {
    const adminIds = await activeAdminIds();
    const message = `New ticket ${ticketCode(ticket.number)} from ${ticket.requester.name} (${ticket.requester.department}): ${short(ticket.summary)}`;
    await save(ticket.id, actor.id, adminIds.map((userId) => ({ userId, type: 'TICKET_CREATED', message })));
  });
}

// ticket events
export function notifyTicketUpdated({ ticket, events, actor, newAssigneeId }) {
  if (!events || events.length === 0) return Promise.resolve();
  return safely('ticket updated', async () => {
    const code = ticketCode(ticket.number);
    const items = [];

    if (newAssigneeId) {
      items.push({ userId: newAssigneeId, type: 'ASSIGNED_TO_YOU', message: `${code} was assigned to you: ${short(ticket.summary)}` });
    }

    // The requester gets one message that lists everything that changed.
    const parts = [];
    for (const e of events) {
      if (e.type === 'ASSIGNED') parts.push(`assigned to ${e.newValue}`);
      else if (e.type === 'PRIORITY_CHANGED') parts.push(`priority set to ${PRIORITY_TEXT[e.newValue] ?? e.newValue}`);
      else if (e.type === 'STATUS_CHANGED') {
        if (e.newValue === 'RESOLVED') parts.push('marked as resolved');
        else if (e.newValue === 'CLOSED') parts.push('closed');
        else if (e.newValue === 'REOPENED') parts.push('reopened');
        else if (!(e.newValue === 'ASSIGNED' && events.some((x) => x.type === 'ASSIGNED'))) {
          parts.push(`status changed to ${STATUS_TEXT[e.newValue] ?? e.newValue}`);
        }
      }
    }
    if (parts.length > 0) {
      items.push({ userId: ticket.requester.id, type: 'TICKET_UPDATED', message: `${code} ${short(ticket.summary, 50)}: ${parts.join(', ')}.` });
    }

    // The requester reopened it: tell the ICT side.
    const reopened = events.some((e) => e.type === 'STATUS_CHANGED' && e.newValue === 'REOPENED');
    if (reopened && actor.id === ticket.requester.id) {
      const message = `${ticket.requester.name} reopened ${code}: ${short(ticket.summary)}`;
      const targets = ticket.assignee?.id ? [ticket.assignee.id] : await activeAdminIds();
      for (const userId of targets) items.push({ userId, type: 'TICKET_REOPENED', message });
    }

    await save(ticket.id, actor.id, items);
  });
}

// ticket: { id, number, summary, requesterId, assigneeId }
export function notifyComment({ ticket, comment, actor }) {
  return safely('comment', async () => {
    const code = ticketCode(ticket.number);
    const items = [];

    if (comment.isInternal) {
      items.push({ userId: ticket.assigneeId, type: 'NOTE', message: `${actor.name} added an internal note on ${code}` });
    } else if (actor.role === 'ADMIN') {
      const message = `${actor.name} (ICT) replied on ${code}: ${short(ticket.summary)}`;
      items.push({ userId: ticket.requesterId, type: 'COMMENT', message });
      items.push({ userId: ticket.assigneeId, type: 'COMMENT', message });
    } else {
      const message = `${actor.name} commented on ${code}: ${short(ticket.summary)}`;
      const targets = ticket.assigneeId ? [ticket.assigneeId] : await activeAdminIds();
      for (const userId of targets) items.push({ userId, type: 'COMMENT', message });
    }

    await save(ticket.id, actor.id, items);
  });
}
