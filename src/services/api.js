async function request(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const error = new Error((body && body.message) || `Erreur ${res.status}`);
    error.code = body && body.error;
    error.status = res.status;
    throw error;
  }
  return body;
}

export const api = {
  register: (email, password, pseudo) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, pseudo }) }),
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/account/me'),
  updateMe: (pseudo) => request('/account/me', { method: 'PATCH', body: JSON.stringify({ pseudo }) }),
  deleteMe: () => request('/account/me', { method: 'DELETE' }),
  exportMe: () => request('/account/me/export'),
  resolveInviteCode: (inviteCode) => request(`/rooms/${inviteCode}/resolve`),
  gameDefaults: () => request('/config/game-defaults'),
};
