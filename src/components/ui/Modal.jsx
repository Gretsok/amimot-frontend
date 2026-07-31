import { useEffect, useRef } from 'react';
import styles from './Modal.module.css';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function getFocusable(container) {
  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR));
}

export default function Modal({ open, onClose, children }) {
  const panelRef = useRef(null);
  const previouslyFocusedRef = useRef(null);
  // Toujours la dernière `onClose` reçue, sans faire partie des deps de
  // l'effet ci-dessous : la plupart des appelants passent un callback inline
  // (nouvelle référence à chaque rendu), ce qui ferait sinon retomber le
  // piège à focus à chaque frappe dans un champ du modal (ex: ConstraintCard,
  // ProfileOverlay) et volerait le focus hors du champ en cours d'édition.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Piège à focus minimal + fermeture Échap : sans ça, Tab fait fuir le focus
  // hors du panneau (derrière l'overlay) et rien ne permet de fermer au clavier.
  useEffect(() => {
    if (!open) return undefined;

    previouslyFocusedRef.current = document.activeElement;
    panelRef.current?.focus();

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const focusable = getFocusable(panelRef.current);
      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocusedRef.current?.focus?.();
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
