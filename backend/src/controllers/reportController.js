import { prisma } from "../lib/prisma.js";
import { HttpError } from "../lib/HttpError.js";
import { toCsv } from "../lib/csv.js";
import { buildSummary } from "../lib/reportSummary.js";
import { getSlaStatus } from "../lib/sla.js";
import { ticketCode } from "../lib/ticketFormat.js";
import { reportQuery } from "../validators/reportSchemas.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_RANGE_DAYS = 366;
const MAX_CSV_ROWS = 5000;

// Dates are treated as UTC days. Default range: the last 30 days.
function parse(query){
    const q = reportQuery.parse(query);
    const now = new Date();

    const to = q.to ? new Date(`${q.to}T23:59:59.999Z`) : now;
    const from = q.from ? new Date(`${q.from}T00:00:00.000Z`) : new Date(to.getTime() - 30 * DAY_MS);

    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) throw new HttpError(400, 'Invalid date');
    if (from > to) throw new HttpError(400, '"from" must be before "to"');
    if (to.getTime() - from.getTime() > MAX_RANGE_DAYS * DAY_MS) {
        throw new HttpError(400, `Choose a range of ${MAX_RANGE_DAYS} days or less`);
    }
    
    return { q, from, to, now };
}

const reportSelect = {
   number: true,
   summary: true,
   category: true,
   status: true,
   priority: true,
   priorityAssignedAt: true,
   slaDueAt: true,
   resolvedAt: true,
   createdAt: true,
   requester: { select: { name: true, email: true, department: true } },
   assignee: { select: { name: true } },
};

function buildWhere(q, from, to) {
  const where = { createdAt: { gte: from, lte: to } };
  if (q.status) where.status = q.status;
  if (q.priority === 'NONE') where.priority = null;
  else if (q.priority) where.priority = q.priority;
  if (q.category) where.category = q.category;
  return where;
}

// GET /api/reports/summary?
export async function summary(req, res) {
  const { q, from, to, now } = parseRange(req.query);

  const tickets = await prisma.ticket.findMany({
    where: buildWhere(q, from, to),
    select: reportSelect,
  });

  res.json({ range: { from, to }, ...buildSummary(tickets, now) });
}

// GET /api/reports/tickets.csv?from=...&to=...&status=...   
export async function ticketsCsv(req, res) {
  const { q, from, to, now } = parseRange(req.query);

  const tickets = await prisma.ticket.findMany({
    where: buildWhere(q, from, to),
    select: reportSelect,
    orderBy: { createdAt: 'asc' },
    take: MAX_CSV_ROWS,
  });

  const rows = [
    ['Ticket', 'Summary', 'Category', 'Department', 'Requester', 'Requester email', 'Status', 'Priority', 'Assigned to', 'Created', 'Resolved', 'SLA'],
    ...tickets.map((t) => [
      ticketCode(t.number),
      t.summary,
      t.category,
      t.requester.department,
      t.requester.name,
      t.requester.email,
      t.status,
      t.priority ?? 'Not triaged',
      t.assignee?.name ?? 'Unassigned',
      t.createdAt,
      t.resolvedAt,
      getSlaStatus(t, now).status,
    ]),
  ];

  const day = (d) => d.toISOString().slice(0, 10);
  res.type('text/csv; charset=utf-8');
  res.attachment(`tickets_${day(from)}_to_${day(to)}.csv`);
  res.send(toCsv(rows));
}

