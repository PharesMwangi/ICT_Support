// Plain-language names for the values the API returns.
export const STATUS_LABELS = {
  NEW: 'New',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In progress',
  PENDING: 'Pending',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
  REOPENED: 'Reopened',
};

// Mirrors the backend rules so the admin only sees moves the server will accept.
export const STATUS_TRANSITIONS = {
  NEW: ['ASSIGNED', 'IN_PROGRESS', 'CLOSED'],
  ASSIGNED: ['IN_PROGRESS', 'PENDING', 'RESOLVED', 'CLOSED'],
  IN_PROGRESS: ['ASSIGNED', 'PENDING', 'RESOLVED', 'CLOSED'],
  PENDING: ['IN_PROGRESS', 'RESOLVED', 'CLOSED'],
  RESOLVED: ['CLOSED', 'REOPENED'],
  CLOSED: ['REOPENED'],
  REOPENED: ['ASSIGNED', 'IN_PROGRESS', 'PENDING', 'RESOLVED', 'CLOSED'],
};

export const PRIORITY_LABELS = { HIGH: 'High', MEDIUM: 'Normal', LOW: 'Low' };
export const PRIORITY_OPTIONS = ['HIGH', 'MEDIUM', 'LOW'];

export const ROLE_LABELS = { STAFF: 'Staff', ADMIN: 'ICT admin' };

export const statusLabel = (s) => STATUS_LABELS[s] ?? s;
export const priorityLabel = (p) => (p ? (PRIORITY_LABELS[p] ?? p) : 'Not triaged');
export const roleLabel = (r) => ROLE_LABELS[r] ?? r;

export const ticketCode = (t) => t.code ?? `TKT-${String(t.number ?? 0).padStart(4, '0')}`;
export const ticketNumber = (t) => ticketCode(t).replace(/^TKT-/, '');

export const MAX_FILES = 3;
export const MAX_FILE_BYTES = 2 * 1024 * 1024;
export const ALLOWED_FILE_TYPES = ['image/png', 'image/jpeg', 'application/pdf'];