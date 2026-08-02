import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import TextInput from '../../components/ui/TextInput';
import Modal from '../../components/ui/Modal';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';
import styles from './AccountScreen.module.css';

const PROVIDER_LABELS = { LOCAL: 'Email et mot de passe', GOOGLE: 'Google' };

// Remplace l'ancienne modale de profil : les droits RGPD (accès, portabilité,
// effacement) doivent vivre dans un endroit stable, atteignable par URL et
// mettable en favori, pas dans une fenêtre qu'on ferme par mégarde.
export default function AccountScreen() {
  const { user, logout, refresh } = useAuth();
  const navigate = useNavigate();
  const [pseudo, setPseudo] = useState(user?.pseudo || '');
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // Les réponses de connexion/inscription ne portent que le profil public, sans
  // la liste des moyens de connexion : sans ce rafraîchissement, la section
  // "Connexions" restait vide juste après une inscription. C'est aussi la
  // garantie qu'on affiche l'état serveur et non un cache de session.
  useEffect(() => {
    refresh();
  }, [refresh]);

  if (!user) return null;

  async function handleSave() {
    setError(null);
    setNotice(null);
    try {
      await api.updateMe(pseudo);
      await refresh();
      setNotice('Pseudo enregistré.');
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleExport() {
    setError(null);
    try {
      const data = await api.exportMe();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'amimot-donnees.json';
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleConfirmDelete() {
    setConfirmingDelete(false);
    try {
      await api.deleteMe();
      await refresh();
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleUnlink(accountId) {
    setError(null);
    try {
      await api.unlinkAccount(accountId);
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleLogout() {
    await logout();
    navigate('/', { replace: true });
  }

  const accounts = user.accounts || [];

  return (
    <div className={styles.stage}>
      <div className={styles.sheet}>
        <Link to="/" className={styles.back}>
          ← Retour au jeu
        </Link>
        <h1 className={styles.title}>Mon compte</h1>

        {error && <p className={styles.error}>{error}</p>}
        {notice && <p className={styles.notice}>{notice}</p>}

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Profil</h2>
          <div className={styles.stats}>
            <span>XP : {user.xp}</span>
            <span>Parties jouées : {user.gamesPlayed}</span>
          </div>
          <label className={styles.label} htmlFor="pseudo">
            Pseudo
          </label>
          <TextInput id="pseudo" value={pseudo} maxLength={15} onChange={(e) => setPseudo(e.target.value)} />
          <Button onClick={handleSave} disabled={!pseudo.trim() || pseudo === user.pseudo}>
            Enregistrer
          </Button>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Connexions</h2>
          <ul className={styles.accounts}>
            {accounts.length === 0 && <li className={styles.text}>Chargement…</li>}
            {accounts.map((account) => (
              <li key={account.id} className={styles.account}>
                <span>
                  <strong>{PROVIDER_LABELS[account.provider] || account.provider}</strong>
                  <br />
                  <span className={styles.accountEmail}>{account.email}</span>
                </span>
                {/* Le serveur refuse de délier le dernier moyen de connexion ;
                    on masque le bouton plutôt que de proposer une action vouée
                    à échouer. */}
                {accounts.length > 1 && (
                  <Button variant="ghost" onClick={() => handleUnlink(account.id)}>
                    Délier
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Données et confidentialité</h2>
          <p className={styles.text}>
            Tes données se limitent à ton adresse email, ton pseudo, ta progression et tes dates de
            connexion. Les parties (mots, cartes, scores) ne sont jamais enregistrées : elles
            disparaissent à la fin de chaque partie.
          </p>
          <p className={styles.text}>
            <strong>
              Sans connexion pendant 760 jours, ton compte est supprimé automatiquement.
            </strong>{' '}
            Aucun email ne peut t&apos;en avertir à l&apos;avance.
          </p>
          <div className={styles.dataActions}>
            <Button variant="ghost" onClick={handleExport}>
              Télécharger mes données
            </Button>
            <Button variant="secondary" onClick={() => setConfirmingDelete(true)}>
              Supprimer mon compte
            </Button>
          </div>
          <p className={styles.text}>
            <Link to="/confidentialite">Politique de confidentialité</Link>
            {' · '}
            <Link to="/mentions-legales">Mentions légales</Link>
          </p>
        </section>

        <Button variant="ghost" onClick={handleLogout}>
          Se déconnecter
        </Button>
      </div>

      <Modal open={confirmingDelete} onClose={() => setConfirmingDelete(false)}>
        <h2 className={styles.confirmTitle}>Supprimer ton compte ?</h2>
        <p className={styles.confirmText}>
          Cette action est définitive et supprimera toutes tes données. Impossible de revenir en
          arrière.
        </p>
        <div className={styles.confirmActions}>
          <Button variant="ghost" onClick={() => setConfirmingDelete(false)}>
            Annuler
          </Button>
          <Button variant="secondary" onClick={handleConfirmDelete}>
            Supprimer définitivement
          </Button>
        </div>
      </Modal>
    </div>
  );
}
