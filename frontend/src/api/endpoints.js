import { request, apiUrl } from './client.js';

export const api = {
  meta: () => request('/meta'),

  me: () => request('/auth/me'),
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
  signup: (data) => request('/auth/signup', { method: 'POST', body: data }),
  forgotPassword: (email) => request('/auth/forgot-password', { method: 'POST', body: { email } }),
    resetPassword: (values) => request('/auth/reset-password', { method: 'POST', body: values }),
  logout: () => request('/auth/logout', { method: 'POST' }),

  passwordResets: () => request('/password-resets'),
  issueResetCode: (id) => request(`/password-resets/${id}/issue-code`, { method: 'POST' }),
  dismissReset: (id) => request(`/password-resets/${id}/dismiss`, { method: 'POST' }),
  startUserReset: (userId) => request(`/users/${userId}/password-reset`, { method: 'POST' }),

  users: (query) => request('/users', { query }),
  setRole: (id, role) => request(`/users/${id}/role`, { method: 'PATCH', body: { role } }),
  setActive: (id, isActive) => request(`/users/${id}/active`, { method: 'PATCH', body: { isActive } }),

  tickets: (query) => request('/tickets', { query }),
  ticket: (id) => request(`/tickets/${id}`),
  createTicket: (formData) => request('/tickets', { method: 'POST', body: formData }),
  updateTicket: (id, changes) => request(`/tickets/${id}`, { method: 'PATCH', body: changes }),
  reopenTicket: (id) => request(`/tickets/${id}/reopen`, { method: 'POST' }),
  addComment: (id, body, isInternal = false) =>
    request(`/tickets/${id}/comments`, { method: 'POST', body: { body, isInternal } }),
  attachmentUrl: (ticketId, attachmentId) => apiUrl(`/tickets/${ticketId}/attachments/${attachmentId}`),

  articles: (q) => request('/kb', { query: { q } }),
  article: (id) => request(`/kb/${id}`),
  createArticle: (data) => request('/kb', { method: 'POST', body: data }),
  updateArticle: (id, data) => request(`/kb/${id}`, { method: 'PATCH', body: data }),
  deleteArticle: (id) => request(`/kb/${id}`, { method: 'DELETE' }),

  notifications: (query) => request('/notifications', { query}),
  unreadCount: () => request('/notifications/unread-count'),
  markRead: (id) => request(`/notifications/${id}/read`, {method: 'POST'}),
  markAllRead: () => request('/notifications/read-all', {method: 'POST'}),

  summary: (query) => request('/reports/summary', { query }),
  csvUrl: (query) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(query ?? {})) if (v) params.set(k, v);
    const qs = params.toString();
    return apiUrl(`/reports/tickets.csv${qs ? `?${qs}` : ''}`);
  },
};
