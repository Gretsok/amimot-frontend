import Button from '../../components/ui/Button';
import styles from './CollectiveButton.module.css';

export default function CollectiveButton({ clickedCount, totalCount, hasClicked, onClick }) {
  return (
    <div className={styles.wrapper}>
      <Button onClick={onClick} disabled={hasClicked} className={styles.button}>
        {hasClicked ? 'En attente des autres...' : "J'ai fini !"}
      </Button>
      <p className={styles.progress}>
        {clickedCount} / {totalCount} joueurs ont cliqué
      </p>
    </div>
  );
}
