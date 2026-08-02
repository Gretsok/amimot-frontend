import { useEffect } from 'react';
import styles from './Toast.module.css';

// Notification éphémère et non bloquante, pour tout ce qui ne doit PAS
// interrompre la partie (carte refusée, contrainte violée, pièces
// insuffisantes...) — par opposition au popup fatal, qui ramène au menu.
function Toast({ toast, duration, onDismiss }) {
  useEffect(() => {
    // `shownAt` change quand un toast identique est "rafraîchi" plutôt que
    // dupliqué : le compte à rebours repart alors de zéro.
    const timer = setTimeout(() => onDismiss(toast.id), duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.shownAt, duration, onDismiss]);

  return (
    <button type="button" className={styles.toast} onClick={() => onDismiss(toast.id)}>
      {toast.message}
    </button>
  );
}

export default function ToastStack({ toasts, duration, onDismiss }) {
  if (toasts.length === 0) return null;
  return (
    <div className={styles.stack} aria-live="polite">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} duration={duration} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
