import { useState } from 'react';
import { Link } from 'react-router-dom';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import TextInput from '../ui/TextInput';
import GoogleOAuthButton from './GoogleOAuthButton';
import { useAuth } from '../../hooks/useAuth';
import styles from './AuthOverlay.module.css';

// Doit rester une modale (et non une route) : se connecter depuis l'accueil ne
// doit pas faire perdre le code d'invitation déjà saisi derrière.
const PASSWORD_MIN_LENGTH = 12;

export default function AuthOverlay({ open, onClose }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pseudo, setPseudo] = useState('');
  const [acceptedPolicy, setAcceptedPolicy] = useState(false);
  const [error, setError] = useState(null);

  const isRegister = mode === 'register';
  const passwordTooShort = isRegister && password.length > 0 && password.length < PASSWORD_MIN_LENGTH;
  const canSubmit = isRegister ? acceptedPolicy && password.length >= PASSWORD_MIN_LENGTH : true;

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    try {
      if (isRegister) {
        await register(email, password, pseudo, acceptedPolicy);
      } else {
        await login(email, password);
      }
      onClose();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className={styles.title}>{isRegister ? 'Créer un compte' : 'Connexion'}</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <TextInput
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        {isRegister && (
          <TextInput
            type="text"
            placeholder="Pseudo (15 caractères max)"
            value={pseudo}
            maxLength={15}
            onChange={(e) => setPseudo(e.target.value)}
            required
          />
        )}
        <TextInput
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {/* La règle est annoncée AVANT la soumission : la découvrir via un
            message d'erreur après coup est une perte de temps évitable. */}
        {isRegister && (
          <p className={passwordTooShort ? styles.hintViolated : styles.hint}>
            {PASSWORD_MIN_LENGTH} caractères minimum.
          </p>
        )}

        {isRegister && (
          <>
            <label className={styles.consent}>
              <input
                type="checkbox"
                checked={acceptedPolicy}
                onChange={(e) => setAcceptedPolicy(e.target.checked)}
              />
              <span>
                J&apos;ai 15 ans ou plus et j&apos;ai lu la{' '}
                <Link to="/confidentialite" target="_blank" rel="noreferrer">
                  politique de confidentialité
                </Link>
                .
              </span>
            </label>
            {/* Annoncé à la collecte, faute de pouvoir prévenir par email au
                moment venu (le service n'envoie aucun message). */}
            <p className={styles.retention}>
              Sans connexion pendant 760 jours, ton compte et tes données sont supprimés
              automatiquement.
            </p>
          </>
        )}

        {!isRegister && (
          <Link to="/mot-de-passe-oublie" className={styles.forgot} onClick={onClose}>
            Mot de passe oublié ?
          </Link>
        )}

        {error && <p className={styles.error}>{error}</p>}
        <Button type="submit" disabled={!canSubmit}>
          {isRegister ? "S'inscrire" : 'Se connecter'}
        </Button>
        <GoogleOAuthButton />
        <Button
          type="button"
          variant="link"
          onClick={() => {
            setMode(isRegister ? 'login' : 'register');
            setError(null);
          }}
        >
          {isRegister ? 'Déjà un compte ? Connecte-toi' : 'Pas encore de compte ? Inscris-toi'}
        </Button>
      </form>
    </Modal>
  );
}
