import { Link } from 'react-router-dom';
import styles from './LegalPage.module.css';

// Mise en page commune aux pages légales : elles doivent rester lisibles et
// atteignables SANS compte (art. 12 : information « aisément accessible »),
// donc aucun contexte d'authentification ni de partie n'est requis ici.
export default function LegalPage({ title, updatedAt, children }) {
  return (
    <div className={styles.stage}>
      <article className={styles.sheet}>
        <Link to="/" className={styles.back}>
          ← Retour au jeu
        </Link>
        <h1 className={styles.title}>{title}</h1>
        {updatedAt && <p className={styles.updated}>Dernière mise à jour : {updatedAt}</p>}
        {children}
      </article>
    </div>
  );
}
