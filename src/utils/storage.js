// Tout le stockage client passe par sessionStorage (propre à chaque onglet) :
// c'est ce qui permet à plusieurs onglets du même navigateur d'être des
// joueurs distincts dans une room (voir décision d'architecture #2).
// localStorage n'est utilisé nulle part dans ce projet.
const SESSION_TOKEN_KEY = 'amimot:sessionToken';
const GAME_DATA_KEY_PREFIX = 'amimot:gameData:';

export function getSessionToken() {
  return sessionStorage.getItem(SESSION_TOKEN_KEY);
}

export function setSessionToken(token) {
  sessionStorage.setItem(SESSION_TOKEN_KEY, token);
}

export function clearSessionToken() {
  sessionStorage.removeItem(SESSION_TOKEN_KEY);
}

export function getGameData(gameId) {
  const raw = sessionStorage.getItem(GAME_DATA_KEY_PREFIX + gameId);
  return raw ? JSON.parse(raw) : null;
}

export function setGameData(gameId, data) {
  sessionStorage.setItem(GAME_DATA_KEY_PREFIX + gameId, JSON.stringify(data));
}

// Invalide/nettoie toute donnée de jeu qui ne correspond pas à la partie en
// cours renvoyée par le serveur (section 3.9) — évite l'accumulation et la
// contamination d'informations entre parties différentes.
export function pruneStaleGameData(currentGameId) {
  const toRemove = [];
  for (let i = 0; i < sessionStorage.length; i += 1) {
    const key = sessionStorage.key(i);
    if (key && key.startsWith(GAME_DATA_KEY_PREFIX) && key !== GAME_DATA_KEY_PREFIX + currentGameId) {
      toRemove.push(key);
    }
  }
  toRemove.forEach((key) => sessionStorage.removeItem(key));
}
