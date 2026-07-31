import { useEffect, useState } from 'react';
import Button from '../../components/ui/Button';
import TextInput from '../../components/ui/TextInput';
import AuthOverlay from '../../components/Account/AuthOverlay';
import ProfileOverlay from '../../components/Account/ProfileOverlay';
import { useAuth } from '../../hooks/useAuth';
import { useRoom } from '../../hooks/useRoom';
import { useErrorPopup } from '../../components/ErrorPopup/ErrorPopupContext';
import styles from './HomeScreen.module.css';

function readInviteCodeFromUrl() {
  return new URLSearchParams(window.location.search).get('code') || '';
}

export default function HomeScreen() {
  const { user } = useAuth();
  const { createRoom, joinRoom } = useRoom();
  const { showError } = useErrorPopup();
  const [displayName, setDisplayName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [authOpen, setAuthOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setInviteCode(readInviteCodeFromUrl());
  }, []);

  useEffect(() => {
    if (user) setDisplayName((prev) => prev || user.pseudo);
  }, [user]);

  async function handleCreate() {
    if (!displayName.trim()) return;
    setBusy(true);
    try {
      await createRoom(displayName.trim());
    } catch (err) {
      showError(err.code || 'INTERNAL_ERROR', err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleJoin() {
    if (!displayName.trim() || !inviteCode.trim()) return;
    setBusy(true);
    try {
      await joinRoom(inviteCode.trim(), displayName.trim());
    } catch (err) {
      showError(err.code || 'INTERNAL_ERROR', err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.stage}>
      <div className={styles.blobPink} />
      <div className={styles.blobMint} />

      <div className={styles.card}>
        <h1 className={styles.title}>AMIMOT</h1>
        <p className={styles.tagline}>Un jeu qui se joue à toute vitesse, entre amis.</p>

        <TextInput
          placeholder="Ton nom (15 caractères max)"
          value={displayName}
          maxLength={15}
          onChange={(e) => setDisplayName(e.target.value)}
        />

        <Button onClick={handleCreate} disabled={busy || !displayName.trim()}>
          Créer une partie
        </Button>

        <div className={styles.divider} />

        <div className={styles.joinRow}>
          <TextInput
            placeholder="CODE"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
          />
          <Button variant="secondary" onClick={handleJoin} disabled={busy || !displayName.trim() || !inviteCode.trim()}>
            Rejoindre
          </Button>
        </div>

        <div className={styles.accountRow}>
          {user ? (
            <Button variant="link" onClick={() => setProfileOpen(true)}>
              Mon profil ({user.pseudo})
            </Button>
          ) : (
            <Button variant="link" onClick={() => setAuthOpen(true)}>
              Se connecter / créer un compte
            </Button>
          )}
        </div>
      </div>

      <AuthOverlay open={authOpen} onClose={() => setAuthOpen(false)} />
      <ProfileOverlay open={profileOpen} onClose={() => setProfileOpen(false)} />
    </div>
  );
}
