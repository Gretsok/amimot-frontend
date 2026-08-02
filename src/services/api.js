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
  // `acceptedPolicy` est refusé par le serveur s'il n'est pas explicitement
  // true : l'information (art. 12-13) et la déclaration d'âge conditionnent la
  // création du compte, elles ne sont pas une case cosmétique côté client.
  register: (email, password, pseudo, acceptedPolicy) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, pseudo, acceptedPolicy }),
    }),
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  // Répond 204 quoi qu'il arrive, y compris pour une adresse inconnue : côté
  // interface aussi, rien ne doit permettre de deviner qui a un compte.
  forgotPassword: (email) =>
    request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (token, password) =>
    request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) }),
  me: () => request('/account/me'),
  updateMe: (pseudo) => request('/account/me', { method: 'PATCH', body: JSON.stringify({ pseudo }) }),
  deleteMe: () => request('/account/me', { method: 'DELETE' }),
  exportMe: () => request('/account/me/export'),
  unlinkAccount: (accountId) => request(`/account/me/accounts/${accountId}`, { method: 'DELETE' }),
  resolveInviteCode: (inviteCode) => request(`/rooms/${inviteCode}/resolve`),
  gameDefaults: () => request('/config/game-defaults'),
};
