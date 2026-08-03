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
  const [passwordError, setPasswordError] = useState(null);
  const [passwordNotice, setPasswordNotice] = useState(null);
  const [sendingLink, setSendingLink] = useState(false);
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

  async function handleRequestPasswordChange() {
    setPasswordError(null);
    setPasswordNotice(null);
    setSendingLink(true);
    try {
      const { email } = await api.requestPasswordChange();
      setPasswordNotice(
        `Lien envoyé à ${email}. Il expire dans une heure et ne fonctionne qu'une fois.`
      );
    } catch (err) {
      setPasswordError(err.message);
    } finally {
      setSendingLink(false);
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

        {/* Le changement passe obligatoirement par le mail. Un formulaire
            "mot de passe actuel + nouveau" tenait cette place : il prouvait
            une connaissance, pas un accès à la boîte, et cohabitait mal avec
            un lien "mot de passe oublié" qui redemandait l'adresse affichée
            juste au-dessus. */}
        {canChangePassword && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Mot de passe</h2>
            <p className={styles.text}>
              Pour changer ton mot de passe, nous t&apos;envoyons un lien à{' '}
              <strong>{localAccount.email}</strong>.
            </p>
            <p className={styles.text}>
              C&apos;est ce qui garantit que seule la personne qui relève cette adresse peut le
              changer.
            </p>
            {passwordError && <p className={styles.error}>{passwordError}</p>}
            {passwordNotice && <p className={styles.notice}>{passwordNotice}</p>}
            <Button onClick={handleRequestPasswordChange} disabled={sendingLink}>
              M&apos;envoyer le lien
            </Button>
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
            Nous t&apos;envoyons un rappel par email un mois avant : une simple connexion remet
            le compteur à zéro.
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
