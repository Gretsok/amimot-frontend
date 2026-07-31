import styles from './ReadyCount.module.css';

// Sans ça, un joueur qui a validé n'a aucun moyen de savoir pourquoi la phase
// n'avance pas : le compte est dérivé de l'état public (readyPlayerIds), pas
// de l'état privé de chacun, donc visible par tout le monde dans la room.
export default function ReadyCount({ ready, total }) {
  if (total <= 0) return null;
  return (
    <p className={styles.count} aria-live="polite">
      {ready} / {total} validé·e·s
    </p>
  );
}
