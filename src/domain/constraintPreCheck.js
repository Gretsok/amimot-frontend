// Mini-moteur de contraintes côté client : reproduit la logique de
// `backend/src/domain/game/constraints.js` pour un retour instantané pendant
// la saisie, SANS aller-retour serveur. Jamais autoritaire : le serveur
// revalide systématiquement (submitTrapWord/submitProposition), donc rester
// simple ici est acceptable — au pire un léger désaccord d'affichage,
// jamais un contournement des règles réelles.

function trimmed(word) {
  return String(word ?? '').trim();
}

export function violatesConstraint(word, constraint) {
  const text = trimmed(word);
  const upper = text.toUpperCase();
  switch (constraint.type) {
    case 'IMPOSE_LETTER':
      return !upper.includes(String(constraint.value).toUpperCase());
    case 'FORBID_LETTER':
      return upper.includes(String(constraint.value).toUpperCase());
    case 'MAX_LENGTH':
      return text.length > constraint.value;
    case 'MIN_LENGTH':
      return text.length < constraint.value;
    default:
      return false;
  }
}

export function violatesRoundLetter(word, letter) {
  if (!letter) return false;
  return !trimmed(word).toUpperCase().startsWith(String(letter).toUpperCase());
}

// `constraints` : liste de contraintes actives à vérifier (le mot-piège ne
// doit recevoir que celles possédées par le joueur lui-même ; une
// proposition reçoit la liste complète — c'est à l'appelant de filtrer).
export function precheckWord(word, { letter, constraints = [], constantMinWordLength = 2 } = {}) {
  const text = trimmed(word);
  const violated = [];

  if (text.length < constantMinWordLength) violated.push('CONSTANT_MIN_LENGTH');
  if (violatesRoundLetter(word, letter)) violated.push('ROUND_LETTER');
  constraints.forEach((constraint) => {
    if (violatesConstraint(word, constraint)) violated.push(constraint.id);
  });

  return { valid: violated.length === 0, violated };
}
