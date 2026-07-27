import { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import TextInput from '../ui/TextInput';
import GoogleOAuthButton from './GoogleOAuthButton';
import { useAuth } from '../../hooks/useAuth';
import styles from './AuthOverlay.module.css';

export default function AuthOverlay({ open, onClose }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pseudo, setPseudo] = useState('');
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password, pseudo);
      }
      onClose();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className={styles.title}>{mode === 'login' ? 'Connexion' : 'Créer un compte'}</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <TextInput
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        {mode === 'register' && (
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
        {error && <p className={styles.error}>{error}</p>}
        <Button type="submit">{mode === 'login' ? 'Se connecter' : "S'inscrire"}</Button>
        <GoogleOAuthButton />
        <button type="button" className={styles.switchMode} onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
          {mode === 'login' ? 'Pas encore de compte ? Inscris-toi' : 'Déjà un compte ? Connecte-toi'}
        </button>
      </form>
    </Modal>
  );
}
