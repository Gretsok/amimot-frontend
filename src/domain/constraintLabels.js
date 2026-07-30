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
