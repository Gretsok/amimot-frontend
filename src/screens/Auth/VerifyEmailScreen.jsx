import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import styles from './AuthScreen.module.css';

// Le jeton se consomme à l'arrivée, sans clic supplémentaire : la personne a
// déjà cliqué, dans son message. Lui redemander de confirmer sa confirmation
// n'apporterait rien. C'est aussi pourquoi le serveur attend un POST : un GET
// serait déclenché par les antivirus et les aperçus de lien, avant elle.
export default function VerifyEmailScreen() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const { user, refresh } = useAuth();
  const [status, setStatus] = useState(token ? 'pending' : 'missing');
  const [error, setError] = useState(null);
  // En développement, StrictMode monte deux fois : sans ce garde, le second
  // appel consomme un jeton déjà consommé et affiche un échec à tort.
  const consumed = useRef(false);

  useEffect(() => {
    if (!token || consumed.current) return;
    consumed.current = true;

    api
      .verifyEmail(token)
      .then(() => {
        setStatus('done');
        // Si la personne est connectée dans cet onglet, son espace compte doit
        // refléter la confirmation immédiatement.
        refresh();
      })
      .catch((err) => {
        setError(err.message);
        setStatus('failed');
      });
  }, [token, refresh]);

  return (
    <div className={styles.stage}>
      <div className={styles.sheet}>
        <Link to="/" className={styles.back}>
          ← Retour au jeu
        </Link>
        <h1 className={styles.title}>Confirmation de ton adresse</h1>

        {status === 'missing' && (
          <p className={styles.error}>
            Ce lien est incomplet. Reprends-le depuis l&apos;email reçu, ou demande un nouvel envoi
            depuis <Link to="/compte">ton compte</Link>.
          </p>
        )}

        {status === 'pending' && <p className={styles.text}>Confirmation en cours…</p>}

        {status === 'done' && (
          <>
            <p className={styles.text}>
              Ton adresse est confirmée. Tu pourras réinitialiser ton mot de passe si tu l&apos;oublies.
            </p>
            <Link to={user ? '/compte' : '/'} className={styles.cta}>
              {user ? 'Aller à mon compte' : 'Retourner au jeu'}
            </Link>
          </>
        )}

        {status === 'failed' && (
          <>
            <p className={styles.error}>{error}</p>
            <p className={styles.text}>
              {user ? (
                <>
                  Tu peux demander un nouveau lien depuis <Link to="/compte">ton compte</Link>.
                </>
              ) : (
                <>
                  Connecte-toi, puis demande un nouveau lien depuis ton compte. Si ton adresse
                  était déjà confirmée, il n&apos;y a rien à faire.
                </>
              )}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
