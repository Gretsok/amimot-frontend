import { io } from 'socket.io-client';

let socket = null;

// Connexion unique, paresseuse : ouverte seulement quand un écran en a besoin
// (host/join), pas au chargement de l'app.
export function getSocket() {
  if (!socket) {
    socket = io({ autoConnect: false });
  }
  return socket;
}

const EMIT_TIMEOUT_MS = 10000;

export function emitAsync(event, payload) {
  return new Promise((resolve, reject) => {
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      const error = new Error('Le serveur ne répond pas.');
      error.code = 'TIMEOUT';
      reject(error);
    }, EMIT_TIMEOUT_MS);

    getSocket().emit(event, payload, (response) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (response && response.ok === false) {
        const error = new Error(response.message || response.error);
        error.code = response.error;
        reject(error);
      } else {
        resolve(response);
      }
    });
  });
}
