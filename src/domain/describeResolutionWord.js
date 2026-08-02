// Dérive, pour UN mot révélé, la narration "qui marque quoi et pourquoi"
// affichée pendant la phase de résolution — purement pour l'affichage.
// Le serveur ne renvoie PAS les points par mot (seulement le score agrégé,
// appliqué une fois la révélation terminée) : cette fonction reconstruit la
// même logique que `backend/src/domain/game/scoring.js` mais restreinte à UN
// SEUL mot, à partir des identifiants publics du mot (submitterIds,
// trapSetterIds, victimIds) + des multiplicateurs publics de config. Jamais
// autoritaire — juste une prévisualisation cohérente avec les règles réelles.
export function describeWordOutcome(wordEntry, scoringConfig) {
  const { submitterIds = [], isTrap, trapSetterIds = [], victimIds = [] } = wordEntry;
  const perPlayer = {};
  const ensure = (id) => {
    if (!perPlayer[id]) perPlayer[id] = [];
    return perPlayer[id];
  };

  if (!isTrap) {
    const points = submitterIds.length * scoringConfig.pointsPerGroupMatch;
    submitterIds.forEach((id) => ensure(id).push({ type: 'GROUP_MATCH', points, groupSize: submitterIds.length }));
    return perPlayer;
  }

  victimIds.forEach((id) => ensure(id).push({ type: 'TRAP_VICTIM', points: scoringConfig.trapVictimPoints }));

  trapSetterIds.forEach((id) => {
    if (submitterIds.includes(id)) {
      ensure(id).push({ type: 'SELF_TRAP', points: scoringConfig.selfTrapPenalty });
    }
    if (victimIds.length > 0) {
      ensure(id).push({
        type: 'TRAP_SETTER',
        points: scoringConfig.trapSetterPointsPerVictim * victimIds.length,
        victimCount: victimIds.length,
      });
    }
  });

  return perPlayer;
}

// Formulation partagée entre la révélation (résolution) et le récap des
// points : une seule source pour que le joueur retrouve exactement le même
// vocabulaire aux deux endroits.
export function reasonText(reason) {
  switch (reason.type) {
    case 'GROUP_MATCH':
      return `+${reason.points} (${reason.groupSize} joueurs ont dit ce mot)`;
    case 'TRAP_VICTIM':
      return `+${reason.points} (tombé dans le piège)`;
    case 'TRAP_SETTER':
      return `+${reason.points} (${reason.victimCount} joueur${reason.victimCount > 1 ? 's' : ''} piégé${
        reason.victimCount > 1 ? 's' : ''
      })`;
    case 'SELF_TRAP':
      return `${reason.points} (son propre piège !)`;
    default:
      return '';
  }
}

// Agrège les raisons de TOUS les mots révélés d'une manche, par joueur —
// c'est ce qui manquait au récap, qui n'affichait qu'un total sans jamais
// dire pourquoi. Un joueur absent de tous les mots n'a rien proposé.
export function describeRoundOutcome(words = [], scoringConfig) {
  const perPlayer = {};
  words.forEach((word) => {
    const outcome = describeWordOutcome(word, scoringConfig);
    Object.entries(outcome).forEach(([playerId, reasons]) => {
      if (!perPlayer[playerId]) perPlayer[playerId] = [];
      perPlayer[playerId].push(...reasons);
    });
  });
  return perPlayer;
}
