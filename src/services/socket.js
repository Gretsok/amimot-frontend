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

export function emitAsync(event, payload) {
  return new Promise((resolve, reject) => {
    getSocket().emit(event, payload, (response) => {
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
