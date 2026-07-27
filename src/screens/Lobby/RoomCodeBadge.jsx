import { useState } from 'react';
import styles from './RoomCodeBadge.module.css';

export default function RoomCodeBadge({ inviteCode }) {
  const [revealed, setRevealed] = useState(false);
  const [copiedWhat, setCopiedWhat] = useState(null); // 'code' | 'link' | null

  async function copyText(text, what) {
    await navigator.clipboard.writeText(text);
    setCopiedWhat(what);
    setTimeout(() => setCopiedWhat(null), 1500);
  }

  function handleCopyCode() {
    copyText(inviteCode, 'code');
  }

  function handleCopyLink() {
    const url = `${window.location.origin}${window.location.pathname}?code=${inviteCode}`;
    copyText(url, 'link');
  }

  return (
    <div className={styles.badge}>
      <div className={styles.label}>Code</div>
      {/* Le code n'est plus cliquable pour éviter un toggle accidentel :
          seul le bouton Afficher/Masquer contrôle la visibilité. */}
      <div className={styles.code}>{revealed ? inviteCode : '••••••'}</div>
      <div className={styles.actions}>
        <button className={styles.actionButton} onClick={() => setRevealed((v) => !v)}>
          {revealed ? 'Masquer' : 'Afficher'}
        </button>
        <button className={styles.actionButton} onClick={handleCopyCode}>
          {copiedWhat === 'code' ? 'Copié !' : 'Copier le code'}
        </button>
        <button className={styles.actionButton} onClick={handleCopyLink}>
          {copiedWhat === 'link' ? 'Copié !' : 'Copier le lien'}
        </button>
      </div>
    </div>
  );
}
