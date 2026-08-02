export function constraintLabel({ type, value }) {
  switch (type) {
    case 'IMPOSE_LETTER':
      return `Contient la lettre "${value}"`;
    case 'FORBID_LETTER':
      return `Sans la lettre "${value}"`;
    case 'MAX_LENGTH':
      return `Maximum ${value} lettres`;
    case 'MIN_LENGTH':
      return `Minimum ${value} lettres`;
    default:
      return type;
  }
}

export const CARD_TITLES = {
  IMPOSE_LETTER: 'Imposer une lettre',
  FORBID_LETTER: 'Interdire une lettre',
  MAX_LENGTH: 'Longueur maximale',
  MIN_LENGTH: 'Longueur minimale',
  DESTROY_CONSTRAINT: 'Détruire une contrainte',
};

// Sans ça, une carte n'affichait que son nom et son prix : impossible de
// savoir ce qu'elle fait, sur qui elle porte, ni combien de temps elle dure.
export const CARD_DESCRIPTIONS = {
  IMPOSE_LETTER: 'Les propositions de tous les joueurs devront contenir la lettre choisie, jusqu’à la fin de la manche.',
  FORBID_LETTER: 'Les propositions de tous les joueurs ne pourront plus contenir la lettre choisie, jusqu’à la fin de la manche.',
  MAX_LENGTH: 'Les propositions de tous les joueurs ne pourront pas dépasser ce nombre de lettres.',
  MIN_LENGTH: 'Les propositions de tous les joueurs devront faire au moins ce nombre de lettres.',
  DESTROY_CONSTRAINT: 'Retire immédiatement une contrainte déjà en jeu, sans en ajouter de nouvelle.',
};
