import { prisma } from "../lib/prisma.js";
import { HttpError } from "../lib/HttpError.js";
import { loadSlaMinutes } from "../lib/sla.js";
import { detectFileType, safeFileName } from "../lib/fileType.js";
import { buildTicketUpdate } from "../lib/ticketRules.js";
import { withSla } from "../lib/ticketFormat.js";
import { listTicketsQuery } from "../validators/ticketSchemas.js";

const isAdminUser = (user) => user.role === 'ADMIN';

// ---- what we read from the database ----

// Used in the queue. Never includes attachment contents.
const listSelect = {
  id: true,
  number: true,
  summary: true,
  category: true,
  status: true,
  priority: true,
  priorityAssignedAt: true,
  slaDueAt: true,
  resolvedAt: true,
  createdAt: true,
  updatedAt: true,
  requester: { select: { id: true, name: true, department: true } },
  assignee: { select: { id: true, name: true } },
};

// Used on the ticket page. Staff do not get internal comments.
const detailSelect = (isAdmin) => ({
  ...listSelect,
  description: true,
  closedAt: true,
  requester: { select: { id: true, name: true, email: true, department: true } },
  attachments: {
    select: { id: true, fileName: true, mimeType: true, sizeBytes: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  },
  comments: {
    where: isAdmin ? undefined : { isInternal: false },
    select: {
      id: true,
      body: true,
      isInternal: true,
      createdAt: true,
      author: { select: { name: true, role: true } },
    },
    orderBy: { createdAt: 'asc' },
  },
  events: {
    select: { type: true, oldValue: true, newValue: true, createdAt: true, actor: { select: { name: true } } },
    orderBy: { createdAt: 'asc' },
  },
});

// Only what the rules need to decide an update.
const ruleSelect = {
  id: true,
  status: true,
  priority: true,
  assigneeId: true,
  requesterId: true,
  resolvedAt: true,
  assignee: { select: { name: true } },
};

// ---- POST /api/tickets  by any logged-in user ----
export async function createTicket(req, res) {
  const { summary, description, category } = req.body;
  const files = req.files ?? [];

  const attachments = files.map((file) => {
    const mimeType = detectFileType(file.buffer);
    if (!mimeType) {
      throw new HttpError(400, `"${safeFileName(file.originalname)}" is not allowed. Attach PNG, JPG or PDF files only`);
    }
    return {
      fileName: safeFileName(file.originalname),
      mimeType,
      sizeBytes: file.size,
      data: file.buffer,
      uploadedById: req.user.id,
    };
  });

  const ticket = await prisma.ticket.create({
    data: {
      summary,
      description,
      category,
      requesterId: req.user.id, // from the login
      attachments: { create: attachments },
      events: { create: [{ type: 'CREATED', actorId: req.user.id }] },
    },
    select: detailSelect(isAdminUser(req.user)),
  });

  res.status(201).json({ ticket: withSla(ticket) });
}

// ---- GET /api/tickets ----
// Staff to see their own tickets. Admins to see everyone's.
export async function listTickets(req, res) {
  const q = listTicketsQuery.parse(req.query);
  const admin = isAdminUser(req.user);

  const where = admin ? {} : { requesterId: req.user.id };

  if (q.status === 'OPEN') where.status = { notIn: ['RESOLVED', 'CLOSED'] };
  else if (q.status) where.status = q.status;

  if (q.priority === 'NONE') where.priority = null;
  else if (q.priority) where.priority = q.priority;

  if (q.category) where.category = q.category;

  if (admin && q.assignee) where.assigneeId = q.assignee === 'me' ? req.user.id : q.assignee;

  if (q.q) {
    const numberMatch = /^(?:tkt-?)?(\d{1,9})$/i.exec(q.q);
    where.OR = [
      { summary: { contains: q.q, mode: 'insensitive' } },
      { description: { contains: q.q, mode: 'insensitive' } },
      ...(numberMatch ? [{ number: Number(numberMatch[1]) }] : []),
    ];
  }

  // Admin queue: not-yet-triaged first, then High, Normal, Low; oldest first within each.
  const orderBy = admin
    ? [{ priority: { sort: 'asc', nulls: 'first' } }, { createdAt: 'asc' }]
    : [{ createdAt: 'desc' }];

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      select: listSelect,
      orderBy,
      skip: (q.page - 1) * q.limit,
      take: q.limit,
    }),
    prisma.ticket.count({ where }),
  ]);

  const now = new Date();
  res.json({ tickets: tickets.map((t) => withSla(t, now)), page: q.page, limit: q.limit, total });
}

// ---- GET /api/tickets/:id ----
export async function getTicket(req, res) {
  const admin = isAdminUser(req.user);
  const ticket = await prisma.ticket.findUnique({
    where: { id: req.params.id },
    select: detailSelect(admin),
  });

  // Staff asking for someone else's ticket get "not found", so they cannot tell it exists.
  if (!ticket || (!admin && ticket.requester.id !== req.user.id)) {
    throw new HttpError(404, 'Ticket not found');
  }
  res.json({ ticket: withSla(ticket) });
}

// Shared by PATCH (admin) and reopen (owner or admin).
async function runUpdate(id, body, user) {
  const admin = isAdminUser(user);

  return prisma.$transaction(async (tx) => {
    const ticket = await tx.ticket.findUnique({ where: { id }, select: ruleSelect });
    if (!ticket || (!admin && ticket.requesterId !== user.id)) throw new HttpError(404, 'Ticket not found');

    const assignee = body.assigneeId
      ? await tx.user.findUnique({
          where: { id: body.assigneeId },
          select: { id: true, name: true, role: true, isActive: true },
        })
      : null;

    const slaMinutes = await loadSlaMinutes(tx);
    const { data, events } = buildTicketUpdate(ticket, body, { assignee, slaMinutes, now: new Date() });

    if (events.length === 0) {
      return tx.ticket.findUnique({ where: { id }, select: detailSelect(admin) });
    }

    return tx.ticket.update({
      where: { id },
      data: { ...data, events: { create: events.map((e) => ({ ...e, actorId: user.id })) } },
      select: detailSelect(admin),
    });
  });
}

// ---- PATCH /api/tickets/:id  admins only ----
// body: { priority?, assigneeId?, status? }
export async function updateTicket(req, res) {
  const ticket = await runUpdate(req.params.id, req.body, req.user);
  res.json({ ticket: withSla(ticket) });
}

// ---- POST /api/tickets/:id/reopen  - the requester, or an admin----
export async function reopenTicket(req, res) {
  const ticket = await runUpdate(req.params.id, { status: 'REOPENED' }, req.user);
  res.json({ ticket: withSla(ticket) });
}

// ---- POST /api/tickets/:id/comments - the requester, or an admin ----
// Only admins can write internal comments .
export async function addComment(req, res) {
  const admin = isAdminUser(req.user);

  const ticket = await prisma.ticket.findUnique({
    where: { id: req.params.id },
    select: { id: true, requesterId: true },
  });
  if (!ticket || (!admin && ticket.requesterId !== req.user.id)) throw new HttpError(404, 'Ticket not found');

  const comment = await prisma.comment.create({
    data: {
      ticketId: ticket.id,
      authorId: req.user.id,
      body: req.body.body,
      isInternal: admin ? Boolean(req.body.isInternal) : false,
    },
    select: {
      id: true,
      body: true,
      isInternal: true,
      createdAt: true,
      author: { select: { name: true, role: true } },
    },
  });

  res.status(201).json({ comment });
}

// ---- GET /api/tickets/:id/attachments/:attachmentId - the requester, or an admin ----
export async function downloadAttachment(req, res) {
  const admin = isAdminUser(req.user);

  const attachment = await prisma.attachment.findUnique({
    where: { id: req.params.attachmentId },
    select: {
      ticketId: true,
      fileName: true,
      mimeType: true,
      data: true,
      ticket: { select: { requesterId: true } },
    },
  });

  if (
    !attachment ||
    attachment.ticketId !== req.params.id ||
    (!admin && attachment.ticket.requesterId !== req.user.id)
  ) {
    throw new HttpError(404, 'Attachment not found');
  }

  res.type(attachment.mimeType);
  res.attachment(attachment.fileName); // always a download, never shown as a page
  // Prisma 6 gives bytes as a Uint8Array; res.send would turn that into JSON, so convert it.
  res.end(Buffer.from(attachment.data));
}
