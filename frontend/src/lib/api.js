import { API_BASE } from '../config';

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// credentials: 'include' sends the visitor and session cookies to the API.
async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, body?.error || `Request failed (HTTP ${res.status})`);
  return body;
}

const post = (path, body) => request(path, { method: 'POST', body: JSON.stringify(body ?? {}) });
const patch = (path, body) => request(path, { method: 'PATCH', body: JSON.stringify(body) });
const enc = encodeURIComponent;

export const api = {
  // Accounts
  me: () => request('/api/auth/me'),
  register: (username, email, password) => post('/api/auth/register', { username, email, password }),
  // Sends the authenticator (or recovery) code too when the account has two-step sign-in on.
  login: (email, password, code) => post('/api/auth/login', code ? { email, password, code } : { email, password }),
  logout: () => post('/api/auth/logout'),
  verifyEmail: (token) => post('/api/auth/verify', { token }),
  resendVerification: () => post('/api/auth/resend-verification'),
  forgotPassword: (email) => post('/api/auth/forgot', { email }),
  resetPassword: (token, password) => post('/api/auth/reset', { token, password }),

  // Account settings
  updateProfile: (username, password) => patch('/api/account/profile', { username, password }),
  startTwoFactor: (password) => post('/api/account/2fa/start', { password }),
  enableTwoFactor: (code) => post('/api/account/2fa/enable', { code }),
  disableTwoFactor: (password, code) => post('/api/account/2fa/disable', { password, code }),
  changePassword: (current, next) => post('/api/account/password', { current, next }),
  changeEmail: (password, email) => post('/api/account/email', { password, email }),
  sessions: () => request('/api/account/sessions'),
  revokeSession: (id) => request(`/api/account/sessions/${enc(id)}`, { method: 'DELETE' }),
  revokeOtherSessions: () => post('/api/account/sessions/revoke-others'),
  deleteAccount: (username, password) => post('/api/account/delete', { username, password }),

  // Games
  games: () => request('/api/games'),
  setFavorite: (id, favorite) => post(`/api/games/${enc(id)}/favorite`, { favorite }),
  vote: (id, value) => post(`/api/games/${enc(id)}/vote`, { value }),
  rate: (id, stars) => post(`/api/games/${enc(id)}/rate`, { stars }),

  // Admin (requires an admin account)
  createGame: (game) => post('/api/games', game),
  updateGame: (id, game) => request(`/api/games/${enc(id)}`, { method: 'PUT', body: JSON.stringify(game) }),
  deleteGame: (id) => request(`/api/games/${enc(id)}`, { method: 'DELETE' }),
};
