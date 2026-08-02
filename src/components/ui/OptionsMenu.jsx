import { useEffect, useRef, useState } from 'react';
import styles from './OptionsMenu.module.css';

// Sort les actions rares (arrêter la partie, et plus tard les réglages) du flux
// vertical des phases : elles concurrençaient visuellement le seul bouton qui
// compte pendant une phase de jeu.
export default function OptionsMenu({ label = 'Options de la partie', items }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  // L'effet ne dépend QUE de `open` : les appelants passent des callbacks
  // inline (nouvelle référence à chaque rendu), les inclure ferait se
  // réabonner les listeners en boucle — cf. le même piège dans Modal.jsx.
  useEffect(() => {
    if (!open) return undefined;

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    function handlePointerDown(e) {
      if (menuRef.current?.contains(e.target) || triggerRef.current?.contains(e.target)) return;
      setOpen(false);
    }

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [open]);

  function select(item) {
    setOpen(false);
    item.onSelect();
  }

  return (
    <div className={styles.wrapper}>
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span aria-hidden="true">⚙</span>
      </button>

      {open && (
        <div ref={menuRef} className={styles.menu} role="menu" aria-label={label}>
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              className={styles.item}
              onClick={() => select(item)}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
