import { useEffect, useState } from 'react';
import styles from './Timer.module.css';

// Affichage cosmétique uniquement : la fin de partie réelle est toujours
// arbitrée par le serveur (game:ended), ce countdown ne fait qu'illustrer
// visuellement le temps restant approximatif.
export default function Timer({ durationSeconds }) {
  const [remaining, setRemaining] = useState(durationSeconds);

  useEffect(() => {
    setRemaining(durationSeconds);
    const interval = setInterval(() => {
      setRemaining((r) => Math.max(0, r - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [durationSeconds]);

  return (
    <div className={styles.timer}>
      <span className={styles.value}>{remaining}</span>
      <span className={styles.unit}>sec</span>
    </div>
  );
}
