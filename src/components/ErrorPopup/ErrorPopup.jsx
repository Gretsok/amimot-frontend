import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { useErrorPopup } from './ErrorPopupContext';
import styles from './ErrorPopup.module.css';

export default function ErrorPopup() {
  const { error, backToMenu, MESSAGES } = useErrorPopup();
  const message = error ? MESSAGES[error.code] || error.message || MESSAGES.INTERNAL_ERROR : null;

  return (
    <Modal open={Boolean(error)} onClose={backToMenu}>
      <h2 className={styles.title}>Oups !</h2>
      <p className={styles.message}>{message}</p>
      <Button variant="primary" onClick={backToMenu} className={styles.action}>
        Retour au menu
      </Button>
    </Modal>
  );
}
