import { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import TextInput from '../ui/TextInput';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';
import styles from './ProfileOverlay.module.css';

export default function ProfileOverlay({ open, onClose }) {
  const { user, logout, refresh } = useAuth();
  const [pseudo, setPseudo] = useState(user?.pseudo || '');
  const [error, setError] = useState(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  if (!user) return null;

  function handleClose() {
    setConfirmingDelete(false);
    onClose();
  }

  async function handleSave() {
    setError(null);
    try {
      await api.updateMe(pseudo);
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleConfirmDelete() {
    await api.deleteMe();
    // Le serveur invalide déjà le cookie de session à la suppression ; sans
    // ce refresh, `user` resterait peuplé côté client et HomeScreen
    // continuerait d'afficher "Mon profil" pour un compte qui n'existe plus.
    await refresh();
    setConfirmingDelete(false);
    onClose();
  }

  async function handleExport() {
    const data = await api.exportMe();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'amimot-donnees.json';
    link.click();
    URL.revokeObjectURL(url);
  }

  if (confirmingDelete) {
    return (
      <Modal open={open} onClose={handleClose}>
        <h2 className={styles.title}>Supprimer ton compte ?</h2>
        <p className={styles.confirmText}>
          Cette action est définitive et supprimera toutes tes données. Impossible de revenir en arrière.
        </p>
        <div className={styles.actions}>
          <Button variant="ghost" onClick={() => setConfirmingDelete(false)}>
            Annuler
          </Button>
          <Button variant="secondary" onClick={handleConfirmDelete}>
            Supprimer définitivement
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={handleClose}>
      <h2 className={styles.title}>Mon profil</h2>
      <div className={styles.stats}>
        <span>XP : {user.xp}</span>
        <span>Parties jouées : {user.gamesPlayed}</span>
      </div>
      <TextInput value={pseudo} maxLength={15} onChange={(e) => setPseudo(e.target.value)} />
      {error && <p className={styles.error}>{error}</p>}
      <div className={styles.actions}>
        <Button onClick={handleSave}>Enregistrer</Button>
        <Button variant="ghost" onClick={handleExport}>
          Exporter mes données (RGPD)
        </Button>
        <Button variant="ghost" onClick={logout}>
          Se déconnecter
        </Button>
        <Button variant="secondary" onClick={() => setConfirmingDelete(true)}>
          Supprimer mon compte
        </Button>
      </div>
    </Modal>
  );
}
