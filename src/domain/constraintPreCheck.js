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

// --- Pose d'une carte-contrainte ------------------------------------------
// Port fidèle de l'auto-annulation de `backend/src/domain/game/constraints.js`
// (conflictsWith / findOldestConflict / applyNewConstraint), nécessaire pour
// anticiper côté client le refus SELF_INVALIDATING_CARD. Toujours non
// autoritaire : le serveur revalide, mais on évite au joueur de découvrir le
// refus seulement après avoir cliqué.

const OPPOSITE_LETTER_TYPE = {
  IMPOSE_LETTER: 'FORBID_LETTER',
  FORBID_LETTER: 'IMPOSE_LETTER',
};

function conflictsWith(a, b) {
  if (OPPOSITE_LETTER_TYPE[a.type] === b.type && String(a.value).toUpperCase() === String(b.value).toUpperCase()) {
    return true;
  }
  if (a.type === 'MAX_LENGTH' && b.type === 'MIN_LENGTH') return a.value < b.value;
  if (a.type === 'MIN_LENGTH' && b.type === 'MAX_LENGTH') return b.value < a.value;
  return false;
}

function findOldestConflict(activeConstraints, newConstraint) {
  return activeConstraints
    .filter((c) => conflictsWith(newConstraint, c))
    .sort((a, b) => a.order - b.order)[0];
}

export function applyNewConstraint(activeConstraints, newConstraint) {
  const conflict = findOldestConflict(activeConstraints, newConstraint);
  if (!conflict) {
    return { activeConstraints: [...activeConstraints, newConstraint], destroyed: [] };
  }
  return {
    activeConstraints: activeConstraints.filter((c) => c.id !== conflict.id),
    destroyed: [conflict.id, newConstraint.id],
  };
}

// Reproduit la règle serveur (gamestate.store.js#playConstraintCard) : une
// carte est refusée si elle SURVIT à l'auto-annulation et rend invalide le
// mot-piège de son propre joueur. Une carte immédiatement annulée ne
// s'applique jamais : elle ne peut donc rien invalider.
// `id`/`order` de la nouvelle contrainte sont générés serveur et absents ici,
// mais inutiles : findOldestConflict ne trie que les contraintes existantes,
// et l'id ne sert qu'à une comparaison d'identité.
const PENDING_CONSTRAINT_ID = '__pending__';

export function precheckConstraintCard({
  type,
  value,
  activeConstraints = [],
  ownerId,
  trapWord,
  letter,
  constantMinWordLength = 2,
} = {}) {
  // Pas (encore) de mot-piège : rien à invalider, comme côté serveur.
  if (!trapWord || !trapWord.trim()) return { valid: true, reason: null };
  // DESTROY_CONSTRAINT ne devient jamais une contrainte persistante.
  if (!OPPOSITE_LETTER_TYPE[type] && type !== 'MAX_LENGTH' && type !== 'MIN_LENGTH') {
    return { valid: true, reason: null };
  }

  const pending = { id: PENDING_CONSTRAINT_ID, type, value, ownerId };
  const { activeConstraints: after, destroyed } = applyNewConstraint(activeConstraints, pending);
  if (destroyed.includes(PENDING_CONSTRAINT_ID)) return { valid: true, reason: null };

  const ownAfter = after.filter((c) => c.ownerId === ownerId);
  const { valid } = precheckWord(trapWord, { letter, constraints: ownAfter, constantMinWordLength });

  return valid ? { valid: true, reason: null } : { valid: false, reason: 'SELF_INVALIDATING_CARD' };
}
