import { useContext } from 'react';
import { GameContext } from '../contexts/GameContext';

export function useGameState() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGameState must be used within a GameProvider');
  const { gameState, myGameState, lastEndReason, stopGame, returnToLobby, player } = ctx;
  return { gameState, myGameState, lastEndReason, stopGame, returnToLobby, player };
}
