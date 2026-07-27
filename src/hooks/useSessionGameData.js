import { useCallback } from 'react';
import { getGameData, setGameData, pruneStaleGameData } from '../utils/storage';

export function useSessionGameData(currentGameId) {
  const read = useCallback(() => (currentGameId ? getGameData(currentGameId) : null), [currentGameId]);

  const write = useCallback(
    (data) => {
      if (!currentGameId) return;
      pruneStaleGameData(currentGameId);
      setGameData(currentGameId, data);
    },
    [currentGameId]
  );

  return { read, write };
}
