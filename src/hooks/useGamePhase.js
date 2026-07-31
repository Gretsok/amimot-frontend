import { useContext } from 'react';
import { GameContext } from '../contexts/GameContext';

// Regroupe l'état de jeu (public + privé) et toutes les actions de gameplay
// dont les composants de phase (Préparation/Proposition/Résolution/Achat)
// ont besoin, pour éviter à chacun de piocher dans le contexte brut.
export function useGamePhase() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGamePhase must be used within a GameProvider');
  const {
    room,
    player,
    gameState,
    myGameState,
    submitTrapWord,
    validateTrapWord,
    unvalidateTrapWord,
    playConstraintCard,
    submitProposition,
    validateProposition,
    unvalidateProposition,
    buyCard,
    advanceResolution,
    returnToLobby,
  } = ctx;
  return {
    room,
    player,
    gameState,
    myGameState,
    submitTrapWord,
    validateTrapWord,
    unvalidateTrapWord,
    playConstraintCard,
    submitProposition,
    validateProposition,
    unvalidateProposition,
    buyCard,
    advanceResolution,
    returnToLobby,
  };
}
