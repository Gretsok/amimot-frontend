import { violatesConstraint, violatesRoundLetter } from '../../domain/constraintPreCheck';
import { constraintLabel } from '../../domain/constraintLabels';
import styles from './ConstraintsList.module.css';

// Liste live des contraintes actives, avec surbrillance de celles que le mot
// actuellement tapé viole — retour instantané côté client (constraintPreCheck,
// jamais autoritaire : le serveur revalide toujours à la soumission). Sans
// mot en cours de saisie (ex: récap des contraintes en résolution, avant
// tout mot), on affiche la liste neutre plutôt que de marquer chaque
// contrainte "violée" par une chaîne vide.
export default function ConstraintsList({ constraints = [], letter, word = '' }) {
  const isChecking = Boolean(word && word.trim());

  return (
    <ul className={styles.list}>
      {letter && (
        <li className={`${styles.item} ${isChecking && violatesRoundLetter(word, letter) ? styles.violated : ''}`}>
          Commence par « {letter} »
        </li>
      )}
      {constraints.map((constraint) => (
        <li
          key={constraint.id}
          className={`${styles.item} ${isChecking && violatesConstraint(word, constraint) ? styles.violated : ''}`}
        >
          {constraintLabel(constraint)}
        </li>
      ))}
      {!letter && constraints.length === 0 && <li className={styles.empty}>Aucune contrainte active</li>}
    </ul>
  );
}
