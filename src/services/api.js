const REQUEST_TIMEOUT_MS = 10000;

async function request(path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res;
  try {
    res = await fetch(`/api${path}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
      signal: controller.signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      const error = new Error('La requête a pris trop de temps.');
      error.code = 'TIMEOUT';
      throw error;
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }

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
