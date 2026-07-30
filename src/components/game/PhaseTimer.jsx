import { usePhaseCountdown } from '../../hooks/usePhaseCountdown';
import styles from './PhaseTimer.module.css';

// Remplace l'ancien Timer.jsx (purement cosmétique/local) : ancré sur le
// timestamp absolu `phaseEndsAt` renvoyé par le serveur, synchronisé entre
// tous les joueurs sans ping temps réel constant.
export default function PhaseTimer({ phaseEndsAt }) {
  const { remainingSeconds } = usePhaseCountdown(phaseEndsAt);
  if (phaseEndsAt == null) return null;
  return (
    <div className={styles.timer}>
      <span className={styles.value}>{remainingSeconds}</span>
      <span className={styles.unit}>s</span>
    </div>
  );
}
