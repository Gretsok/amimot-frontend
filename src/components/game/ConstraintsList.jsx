import { violatesConstraint, violatesRoundLetter } from '../../domain/constraintPreCheck';
import { constraintLabel } from '../../domain/constraintLabels';
import styles from './ConstraintsList.module.css';

// Liste live des contraintes actives, avec surbrillance de celles que le mot
// actuellement tapé viole — retour instantané côté client (constraintPreCheck,
// jamais autoritaire : le serveur revalide toujours à la soumission). Sans
// mot en cours de saisie (ex: récap des contraintes en résolution, avant
// tout mot), on affiche la liste neutre plutôt que de marquer chaque
// contrainte "violée" par une chaîne vide.
export default function ConstraintsList({
  constraints = [],
  letter,
  word = '',
  // Longueur minimale constante : elle bloquait la validation sans jamais
  // être affichée, laissant le joueur devant un bouton grisé inexplicable.
  // Non fournie depuis le récap de résolution (aucun mot en cours).
  constantMinWordLength,
  // Permet d'attribuer chaque contrainte à son auteur : savoir QUI vous
  // bloque fait partie du jeu.
  players = [],
}) {
  const isChecking = Boolean(word && word.trim());

  function ownerName(ownerId) {
    const owner = players.find((p) => p.id === ownerId);
    return owner ? owner.displayName : null;
  }

  const showMinLength = Number.isInteger(constantMinWordLength) && constantMinWordLength > 0;
  const minLengthViolated = isChecking && word.trim().length < constantMinWordLength;
  const isEmpty = !letter && constraints.length === 0 && !showMinLength;

  // Marqueur non chromatique : la couleur seule ne se lit pas comme une
  // erreur (le rose est aussi une couleur de marque) et exclut les daltoniens.
  const mark = <span aria-hidden="true">✕ </span>;

  return (
    <ul className={styles.list}>
      {showMinLength && (
        <li className={`${styles.item} ${minLengthViolated ? styles.violated : ''}`}>
          {minLengthViolated && mark}
          Au moins {constantMinWordLength} lettres
        </li>
      )}
      {letter && (
        <li className={`${styles.item} ${isChecking && violatesRoundLetter(word, letter) ? styles.violated : ''}`}>
          {isChecking && violatesRoundLetter(word, letter) && mark}
          Commence par « {letter} »
        </li>
      )}
      {constraints.map((constraint) => {
        const violated = isChecking && violatesConstraint(word, constraint);
        const author = ownerName(constraint.ownerId);
        return (
          <li key={constraint.id} className={`${styles.item} ${violated ? styles.violated : ''}`}>
            {violated && mark}
            {constraintLabel(constraint)}
            {author && <span className={styles.owner}> · {author}</span>}
          </li>
        );
      })}
      {isEmpty && <li className={styles.empty}>Aucune contrainte active</li>}
    </ul>
  );
}
