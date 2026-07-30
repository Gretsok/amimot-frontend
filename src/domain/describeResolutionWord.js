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
