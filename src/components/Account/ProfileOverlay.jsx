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

  if (!user) return null;

  async function handleSave() {
    setError(null);
    try {
      await api.updateMe(pseudo);
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete() {
    if (!window.confirm('Supprimer définitivement ton compte ?')) return;
    await api.deleteMe();
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

  return (
    <Modal open={open} onClose={onClose}>
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
        <Button variant="secondary" onClick={handleDelete}>
          Supprimer mon compte
        </Button>
      </div>
    </Modal>
  );
}
