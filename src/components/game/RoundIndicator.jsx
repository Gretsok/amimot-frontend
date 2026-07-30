import styles from './RoundIndicator.module.css';

export default function RoundIndicator({ round, totalRounds }) {
  return (
    <div className={styles.indicator}>
      Manche {round}/{totalRounds}
    </div>
  );
}
