import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Button from '../../components/ui/Button';
import TextInput from '../../components/ui/TextInput';
import { api } from '../../services/api';
import styles from './AuthScreen.module.css';

const PASSWORD_MIN_LENGTH = 12;

export default function ResetPasswordScreen() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const tooShort = password.length > 0 && password.length < PASSWORD_MIN_LENGTH;

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await api.resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(err.message);
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
        <h1 className={styles.title}>Nouveau mot de passe</h1>

        {!token && (
          <p className={styles.error}>
            Ce lien est incomplet. Reprends depuis l&apos;email reçu, ou{' '}
            <Link to="/mot-de-passe-oublie">demande un nouveau lien</Link>.
          </p>
        )}

        {done ? (
          <>
            <p className={styles.text}>
              Mot de passe modifié. Toutes les sessions ouvertes sur ce compte ont été déconnectées.
            </p>
            <Link to="/" className={styles.cta}>
              Retourner au jeu et me connecter
            </Link>
          </>
        ) : (
          token && (
            <form onSubmit={handleSubmit} className={styles.form}>
              <TextInput
                type="password"
                placeholder="Nouveau mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <p className={tooShort ? styles.hintViolated : styles.hint}>
                {PASSWORD_MIN_LENGTH} caractères minimum.
              </p>
              {error && <p className={styles.error}>{error}</p>}
              <Button type="submit" disabled={busy || password.length < PASSWORD_MIN_LENGTH}>
                Changer mon mot de passe
              </Button>
            </form>
          )
        )}
      </div>
    </div>
  );
}
