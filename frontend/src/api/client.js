const BASE = (import.meta.env?.VITE_API_BASE ?? '').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, { status = 0, details = [] } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
  // { fieldName: 'message' } for showing errors next to inputs
  get fieldErrors() {
    const out = {};
    for (const d of this.details) if (d.field && !out[d.field]) out[d.field] = d.message;
    return out;
  }
}

let onUnauthorized = null;
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

// 401 on these paths is an expected answer, not an expired session.
const QUIET_401 = ['/auth/login', '/auth/signup', '/auth/me'];

export function apiUrl(path) {
  return `${BASE}/api${path}`;
}

export async function request(path, { method = 'GET', body, query } = {}) {
  let url = apiUrl(path);
  if (query) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== '') params.set(k, v);
    }
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }

  const init = { method, credentials: 'include', headers: {} };
  if (body instanceof FormData) {
    init.body = body; // the browser sets the multipart boundary itself
  } else if (body !== undefined) {
    init.headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(url, init);
  } catch {
    throw new ApiError('Cannot reach the server. Check your connection and try again.');
  }

  if (res.status === 204) return null;

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* not JSON */
  }

  if (!res.ok) {
    if (res.status === 401 && onUnauthorized && !QUIET_401.includes(path)) onUnauthorized();
    const message = data?.error?.message ?? `Something went wrong (error ${res.status}).`;
    throw new ApiError(message, { status: res.status, details: data?.error?.details ?? [] });
  }
  return data;
}
