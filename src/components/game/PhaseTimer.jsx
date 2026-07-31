import { usePhaseCountdown } from '../../hooks/usePhaseCountdown';
import styles from './PhaseTimer.module.css';

// Remplace l'ancien Timer.jsx (purement cosmétique/local) : ancré sur le
// timestamp absolu `phaseEndsAt` renvoyé par le serveur, synchronisé entre
// tous les joueurs sans ping temps réel constant.
const URGENT_THRESHOLD_SECONDS = 5;

export default function PhaseTimer({ phaseEndsAt }) {
  const { remainingSeconds } = usePhaseCountdown(phaseEndsAt);
  if (phaseEndsAt == null) return null;
  const urgent = remainingSeconds <= URGENT_THRESHOLD_SECONDS;
  // Pas d'aria-live ici : un chrono qui s'annoncerait à chaque seconde est un
  // anti-pattern ARIA (spam pour les lecteurs d'écran) et ferait concurrence
  // à la région live de ReadyCount, juste à côté. La couleur d'urgence reste
  // le signal pour les utilisateurs voyants.
  return (
    <div className={styles.timer}>
      <span className={`${styles.value} ${urgent ? styles.urgent : ''}`}>{remainingSeconds}</span>
      <span className={styles.unit}>s</span>
    </div>
  );
}
