import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import TextInput from '../../components/ui/TextInput';
import Modal from '../../components/ui/Modal';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';
import styles from './AccountScreen.module.css';

const PROVIDER_LABELS = { LOCAL: 'Email et mot de passe', GOOGLE: 'Google' };
const PASSWORD_MIN_LENGTH = 12;

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
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState(null);
  const [passwordNotice, setPasswordNotice] = useState(null);
  const [resending, setResending] = useState(false);

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

  async function handleChangePassword(e) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordNotice(null);
    try {
      await api.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setPasswordNotice(
        'Mot de passe modifié. Les autres sessions ouvertes sur ce compte ont été déconnectées.'
      );
    } catch (err) {
      setPasswordError(err.message);
    }
  }

  async function handleResendVerification() {
    setError(null);
    setNotice(null);
    setResending(true);
    try {
      const { alreadyVerified } = await api.resendVerification();
      if (alreadyVerified) {
        await refresh();
        setNotice('Ton adresse était déjà confirmée.');
      } else {
        setNotice('Email de confirmation renvoyé. Pense à regarder dans les indésirables.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  }

  async function handleLogout() {
    await logout();
    navigate('/', { replace: true });
  }

  const accounts = user.accounts || [];
  const localAccount = accounts.find((account) => account.provider === 'LOCAL');
  // Tant que la liste n'est pas chargée, on ne montre ni bannière ni section
  // mot de passe : les afficher puis les faire disparaître serait pire que
  // d'attendre une fraction de seconde.
  const needsVerification = Boolean(localAccount && !localAccount.emailVerifiedAt);
  const canChangePassword = Boolean(localAccount);
  const passwordTooShort = newPassword.length > 0 && newPassword.length < PASSWORD_MIN_LENGTH;

  return (
    <div className={styles.stage}>
      <div className={styles.sheet}>
        <Link to="/" className={styles.back}>
          ← Retour au jeu
        </Link>
        <h1 className={styles.title}>Mon compte</h1>

        {error && <p className={styles.error}>{error}</p>}
        {notice && <p className={styles.notice}>{notice}</p>}

        {needsVerification && (
          <div className={styles.verifyBanner}>
            <span>
              <strong>Ton adresse email n&apos;est pas encore confirmée.</strong> Ouvre le lien
              reçu à l&apos;inscription. Sans confirmation, nous ne pouvons pas garantir que tu
              recevras le lien de réinitialisation si tu oublies ton mot de passe.
            </span>
            <Button variant="ghost" onClick={handleResendVerification} disabled={resending}>
              Renvoyer l&apos;email de confirmation
            </Button>
          </div>
        )}

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
                <span className={styles.accountMain}>
                  <strong>{PROVIDER_LABELS[account.provider] || account.provider}</strong>
                  <span className={styles.accountEmail}>{account.email}</span>
                  <span className={account.emailVerifiedAt ? styles.verified : styles.unverified}>
                    {account.emailVerifiedAt ? 'Adresse confirmée' : 'Adresse non confirmée'}
                  </span>
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

        {/* Le mot de passe actuel est exigé : sans lui, un poste laissé ouvert
            suffirait à verrouiller le compte de son propriétaire. La
            réinitialisation par email reste la porte de sortie pour qui l'a
            oublié — d'où le lien vers celle-ci juste en dessous. */}
        {canChangePassword && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Mot de passe</h2>
            <form onSubmit={handleChangePassword} className={styles.dataForm}>
              <label className={styles.label} htmlFor="current-password">
                Mot de passe actuel
              </label>
              <TextInput
                id="current-password"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <label className={styles.label} htmlFor="new-password">
                Nouveau mot de passe
              </label>
              <TextInput
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <p className={passwordTooShort ? styles.hintViolated : styles.hint}>
                {PASSWORD_MIN_LENGTH} caractères minimum.
              </p>
              {passwordError && <p className={styles.error}>{passwordError}</p>}
              {passwordNotice && <p className={styles.notice}>{passwordNotice}</p>}
              <Button
                type="submit"
                disabled={!currentPassword || newPassword.length < PASSWORD_MIN_LENGTH}
              >
                Changer mon mot de passe
              </Button>
            </form>
            <p className={styles.text}>
              Tu l&apos;as oublié ? <Link to="/mot-de-passe-oublie">Reçois un lien par email</Link>.
            </p>
          </section>
        )}

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
            Nous n&apos;envoyons pas de rappel avant : une simple connexion remet le compteur à
            zéro.
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
