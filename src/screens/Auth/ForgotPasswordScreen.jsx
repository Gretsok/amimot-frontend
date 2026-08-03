import { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';
import TextInput from '../../components/ui/TextInput';
import { api } from '../../services/api';
import styles from './AuthScreen.module.css';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await api.forgotPassword(email);
      setSent(true);
    } catch (err) {
      // Cet écran affichait « lien envoyé » quoi qu'il arrive, y compris sur
      // un 429 ou une panne d'envoi — de quoi chercher pendant des jours un
      // message qui n'est jamais parti. Ni l'un ni l'autre ne dépend de
      // l'existence du compte, donc les signaler ne révèle rien ; seul le cas
      // « adresse inconnue » doit rester indiscernable, et il le reste (204).
      if (err.status === 429) {
        setError('Trop de demandes. Réessaie dans quelques minutes.');
      } else {
        setError("L'envoi a échoué. Réessaie dans un instant.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.stage}>
      <div className={styles.sheet}>
        <Link to="/" className={styles.back}>
          ← Retour au jeu
        </Link>
        <h1 className={styles.title}>Mot de passe oublié</h1>

        {sent ? (
          // Message identique que l'adresse existe ou non : c'est la même
          // garantie que côté serveur, elle ne doit pas se perdre ici.
          <>
            <p className={styles.text}>
              Si un compte existe avec cette adresse, un lien de réinitialisation vient de lui être
              envoyé. Le lien expire dans une heure et ne fonctionne qu&apos;une fois.
            </p>
            <p className={styles.hint}>
              Pense à regarder dans les indésirables. Si tu t&apos;es inscrit avec Google, tu
              n&apos;as pas de mot de passe à réinitialiser : connecte-toi avec Google.
            </p>
          </>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            <p className={styles.text}>
              Indique l&apos;adresse de ton compte, nous t&apos;enverrons un lien pour choisir un
              nouveau mot de passe.
            </p>
            <TextInput
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {error && <p className={styles.error}>{error}</p>}
            <Button type="submit" disabled={busy || !email.trim()}>
              Envoyer le lien
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
