import { createContext, useContext, useEffect, useState } from 'react';
import { useSocket } from '../../hooks/useSocket';

const ErrorPopupContext = createContext(null);

const MESSAGES = {
  ROOM_FULL: 'Cette room est complète.',
  ROOM_NOT_FOUND: "Cette room n'existe pas (ou plus).",
  PERMISSION_DENIED: "Vous n'avez pas la permission de faire ça.",
  DISCONNECTED: 'Vous avez été déconnecté.',
  TIMEOUT: 'La connexion est trop lente. Réessaie.',
  CLIPBOARD_ERROR: 'Impossible de copier automatiquement.',
  INTERNAL_ERROR: "Une erreur inattendue s'est produite.",
};

export function ErrorPopupProvider({ children, onBackToMenu }) {
  const { socket } = useSocket();
  const [error, setError] = useState(null);

  useEffect(() => {
    const onConnectionError = (payload) => setError(payload);
    socket.on('connection:error', onConnectionError);
    return () => socket.off('connection:error', onConnectionError);
  }, [socket]);

  function showError(code, message) {
    setError({ code, message });
  }

  function clearError() {
    setError(null);
  }

  function backToMenu() {
    clearError();
    onBackToMenu();
  }

  return (
    <ErrorPopupContext.Provider value={{ error, showError, clearError, backToMenu, MESSAGES }}>
      {children}
    </ErrorPopupContext.Provider>
  );
}

export function useErrorPopup() {
  const ctx = useContext(ErrorPopupContext);
  if (!ctx) throw new Error('useErrorPopup must be used within an ErrorPopupProvider');
  return ctx;
}
