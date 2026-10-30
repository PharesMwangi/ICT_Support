const dateTime = new Intl.DateTimeFormat('en-KE',{
    day: 'numeric',
    month: 'short',
    year:'numeric',
    hour: '2-digit',
    minute: '2-digit',
});
const dateOnly = new Intl.DateTimeFormat('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });

export const formatDateTime = (iso) => (iso ? dateTime.format(new Date(iso)) : '');
export const formatDate = (iso) => (iso ? dateOnly.format(new Date(iso)) : '');

export function formatDuration(ms) {
    const totalMinutes = Math.max(0, Math.floor(Math.abs(ms) / 60000));
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;
    if (days > 0) return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
    if (hours > 0) return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    return `${minutes}m`;
}

// SLA text for a ticket's
export function slaText(sla) {
  if (!sla) return '';
  switch (sla.status) {
    case 'UNTRIAGED':
      return 'No SLA until triaged';
    case 'MET':
      return 'SLA met';
    case 'MISSED':
      return 'SLA missed';
    case 'BREACHED':
      return `Overdue ${formatDuration(sla.remainingMs ?? 0)}`;
    case 'AT_RISK':
    case 'ON_TRACK':
      return `${formatDuration(sla.remainingMs ?? 0)} left`;
    default:
      return '';
  }
}

export function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export const toDateInput = (d) => d.toISOString().slice(0, 10);