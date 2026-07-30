import { useContext } from 'react';
import { GameContext } from '../contexts/GameContext';

// Tranche d'état privé du joueur courant (main, mot-piège, proposition) —
// jamais partagée avec les autres joueurs, mise à jour via
// game:privateStateUpdated (voir GameContext).
export function useMyGameState() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useMyGameState must be used within a GameProvider');
  return ctx.myGameState;
}
