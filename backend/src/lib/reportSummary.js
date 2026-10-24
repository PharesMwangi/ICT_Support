import { getSlaStatus } from './sla.js';

const inc = (map, key) => {
  map[key] = (map[key] ?? 0) + 1;
};

// Turns a list of tickets into the numbers for the dashboard and reports.
export function buildSummary(tickets, now = new Date()) {
  const byStatus = {};
  const byPriority = { HIGH: 0, MEDIUM: 0, LOW: 0, UNTRIAGED: 0 };
  const byCategory = {};
  const byDepartment = {};
  const byAssignee = {};
  let open = 0;
  let untriagedOpen = 0;
  let breached = 0;
  let atRisk = 0;
  let met = 0;
  let missed = 0;
  let resolvedCount = 0;
  let resolutionMs = 0;

  for (const t of tickets) {
    inc(byStatus, t.status);
    inc(byPriority, t.priority ?? 'UNTRIAGED');
    inc(byCategory, t.category);
    inc(byDepartment, t.requester?.department ?? 'Unknown');
    inc(byAssignee, t.assignee?.name ?? 'Unassigned');

    const isOpen = t.status !== 'RESOLVED' && t.status !== 'CLOSED';
    const sla = getSlaStatus(t, now).status;

    if (isOpen) {
      open += 1;
      if (!t.priority) untriagedOpen += 1;
      if (sla === 'BREACHED') breached += 1;
      if (sla === 'AT_RISK') atRisk += 1;
    }
    if (sla === 'MET') met += 1;
    if (sla === 'MISSED') missed += 1;

    if (t.resolvedAt) {
      resolvedCount += 1;
      resolutionMs += t.resolvedAt.getTime() - t.createdAt.getTime();
    }
  }

  return {
    total: tickets.length,
    open,
    untriagedOpen,
    breached,
    atRisk,
    byStatus,
    byPriority,
    byCategory,
    byDepartment,
    byAssignee,
    sla: {
      met,
      missed,
      compliancePercent: met + missed > 0 ? Math.round((met / (met + missed)) * 1000) / 10 : null,
    },
    avgResolutionHours: resolvedCount > 0 ? Math.round((resolutionMs / resolvedCount / 3_600_000) * 10) / 10 : null,
  };
}
