import { useContext } from 'react';
import { GameContext } from '../contexts/GameContext';

export function useRoom() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useRoom must be used within a GameProvider');
  const { room, player, createRoom, joinRoom, leaveRoom, kickPlayer, updateSettings, startGame, setDisplayName } = ctx;
  return { room, player, createRoom, joinRoom, leaveRoom, kickPlayer, updateSettings, startGame, setDisplayName };
}
