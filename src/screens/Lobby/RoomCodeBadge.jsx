import { useState } from 'react';
import Button from '../../components/ui/Button';
import { useErrorPopup } from '../../components/ErrorPopup/ErrorPopupContext';
import styles from './RoomCodeBadge.module.css';

export default function RoomCodeBadge({ inviteCode }) {
  const [revealed, setRevealed] = useState(false);
  const [copiedWhat, setCopiedWhat] = useState(null); // 'code' | 'link' | null
  const { showError } = useErrorPopup();

  async function copyText(text, what) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedWhat(what);
      setTimeout(() => setCopiedWhat(null), 1500);
    } catch (err) {
      showError('CLIPBOARD_ERROR', err.message);
    }
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
        <Button variant="ghost" onClick={() => setRevealed((v) => !v)}>
          {revealed ? 'Masquer' : 'Afficher'}
        </Button>
        <Button variant="ghost" onClick={handleCopyCode}>
          {copiedWhat === 'code' ? 'Copié !' : 'Copier le code'}
        </Button>
        <Button variant="ghost" onClick={handleCopyLink}>
          {copiedWhat === 'link' ? 'Copié !' : 'Copier le lien'}
        </Button>
      </div>
    </div>
  );
}
