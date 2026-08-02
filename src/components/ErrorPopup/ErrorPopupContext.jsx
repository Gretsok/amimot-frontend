import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useSocket } from '../../hooks/useSocket';

// Malgré son nom (conservé pour ne pas churner les 13 sites d'appel), ce
// contexte route désormais les erreurs selon leur gravité : seules les
// erreurs FATALES ouvrent le popup "Retour au menu", tout le reste part en
// toast éphémère. Une erreur de gameplay (carte refusée, contrainte violée,
// pièces insuffisantes...) ne doit JAMAIS sortir le joueur de sa partie.
const ErrorPopupContext = createContext(null);

const MESSAGES = {
  // --- Fatales (le joueur n'a plus de partie à rejoindre) ---
  ROOM_FULL: 'Cette room est complète.',
  ROOM_NOT_FOUND: "Cette room n'existe pas (ou plus).",
  DISCONNECTED: 'Vous avez été déconnecté.',
  SESSION_EXPIRED: 'Ta session a expiré. Rejoins une partie pour continuer.',
  // --- Récupérables (le joueur reste dans sa partie) ---
  PERMISSION_DENIED: "Tu ne peux pas faire ça maintenant.",
  SELF_INVALIDATING_CARD: 'Cette carte invaliderait ton propre mot-piège.',
  CONSTRAINT_VIOLATION: 'Ce mot ne respecte pas les contraintes.',
  HAND_FULL: 'Ta main est pleine.',
  INSUFFICIENT_COINS: "Tu n'as pas assez de pièces.",
  CONSTRAINT_NOT_FOUND: "Cette contrainte n'est plus active.",
  INVALID_PHASE: "Ce n'est plus le moment de faire ça.",
  RATE_LIMITED: 'Doucement ! Réessaie dans un instant.',
  TIMEOUT: 'La connexion est trop lente. Réessaie.',
  CLIPBOARD_ERROR: 'Impossible de copier automatiquement.',
  INTERNAL_ERROR: "Une erreur inattendue s'est produite.",
};

// Liste volontairement courte et explicite : tout code inconnu est traité
// comme récupérable. C'est le sens le plus sûr — être éjecté à tort de sa
// partie est bien pire qu'un toast affiché à tort pour une erreur qui était
// réellement fatale (l'action suivante la fera ressortir de toute façon).
const FATAL_CODES = new Set(['ROOM_NOT_FOUND', 'ROOM_FULL', 'DISCONNECTED', 'SESSION_EXPIRED']);

const TOAST_DURATION_MS = 4000;

export function ErrorPopupProvider({ children, onBackToMenu }) {
  const { socket } = useSocket();
  const [error, setError] = useState(null);
  const [toasts, setToasts] = useState([]);
  const nextToastId = useRef(0);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback((message) => {
    setToasts((prev) => {
      // Les erreurs de gameplay arrivent volontiers en rafale (frappe rapide,
      // clics répétés) : on rafraîchit le toast identique le plus récent au
      // lieu d'en empiler des copies.
      const last = prev[prev.length - 1];
      if (last && last.message === message) {
        return [...prev.slice(0, -1), { ...last, shownAt: Date.now() }];
      }
      nextToastId.current += 1;
      return [...prev, { id: nextToastId.current, message, shownAt: Date.now() }];
    });
  }, []);

  const report = useCallback(
    ({ code, message }) => {
      const text = MESSAGES[code] || message || MESSAGES.INTERNAL_ERROR;
      if (FATAL_CODES.has(code)) {
        setError({ code, message });
      } else {
        pushToast(text);
      }
    },
    [pushToast]
  );

  useEffect(() => {
    const onConnectionError = (payload) => report(payload);
    socket.on('connection:error', onConnectionError);
    return () => socket.off('connection:error', onConnectionError);
  }, [socket, report]);

  // Signature inchangée : les appelants n'ont pas à savoir si leur erreur est
  // fatale ou non, c'est décidé ici à partir du code.
  const showError = useCallback((code, message) => report({ code, message }), [report]);

  function clearError() {
    setError(null);
  }

  function backToMenu() {
    setError(null);
    onBackToMenu();
  }

  return (
    <ErrorPopupContext.Provider
      value={{ error, toasts, showError, clearError, dismissToast, backToMenu, MESSAGES, TOAST_DURATION_MS }}
    >
      {children}
    </ErrorPopupContext.Provider>
  );
}

export function useErrorPopup() {
  const ctx = useContext(ErrorPopupContext);
  if (!ctx) throw new Error('useErrorPopup must be used within an ErrorPopupProvider');
  return ctx;
}
