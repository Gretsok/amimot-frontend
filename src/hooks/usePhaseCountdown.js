import { useEffect, useState } from 'react';

function computeRemainingMs(phaseEndsAt) {
  if (phaseEndsAt == null) return 0;
  return Math.max(0, phaseEndsAt - Date.now());
}

// Affichage cosmétique du temps restant, ancré sur un timestamp ABSOLU
// fourni par le serveur (`phaseEndsAt`, ms epoch) plutôt que de faire
// tourner un décompte purement local — la fin réelle de la phase est
// toujours arbitrée par le serveur (game:publicStateUpdated), ce hook ne
// fait qu'illustrer visuellement le temps restant. Se resynchronise tout
// seul dès que `phaseEndsAt` change (nouvelle phase = nouveau deadline déjà
// correct) ; pour rattraper une dérive après une mise en veille d'onglet,
// l'appelant doit re-émettre game:requestState et laisser le nouveau
// phaseEndsAt redescendre ici.
export function usePhaseCountdown(phaseEndsAt) {
  const [remainingMs, setRemainingMs] = useState(() => computeRemainingMs(phaseEndsAt));

  useEffect(() => {
    setRemainingMs(computeRemainingMs(phaseEndsAt));
    if (phaseEndsAt == null) return undefined;

    const interval = setInterval(() => {
      setRemainingMs(computeRemainingMs(phaseEndsAt));
    }, 250);
    return () => clearInterval(interval);
  }, [phaseEndsAt]);

  return { remainingMs, remainingSeconds: Math.ceil(remainingMs / 1000) };
}
