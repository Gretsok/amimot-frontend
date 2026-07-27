import { useContext } from 'react';
import { GameContext } from '../contexts/GameContext';

export function useGameState() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGameState must be used within a GameProvider');
  const { gameState, lastEndReason, clickButton, stopGame, player } = ctx;
  return { gameState, lastEndReason, clickButton, stopGame, player };
}
