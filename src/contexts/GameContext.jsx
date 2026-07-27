import { createContext, useCallback, useEffect, useRef, useState } from 'react';
import { useSocket } from '../hooks/useSocket';
import { emitAsync } from '../services/socket';
import { getSessionToken, setSessionToken, clearSessionToken } from '../utils/storage';

export const GameContext = createContext(null);

export function GameProvider({ children }) {
  const { socket } = useSocket();
  const [room, setRoom] = useState(null);
  const [player, setPlayer] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [lastEndReason, setLastEndReason] = useState(null);
  const reconnectAttempted = useRef(false);

  const reset = useCallback(() => {
    setRoom(null);
    setPlayer(null);
    setGameState(null);
    clearSessionToken();
  }, []);

  useEffect(() => {
    function onRoomUpdated(snapshot) {
      setRoom(snapshot);
    }
    function onRoomClosed() {
      reset();
    }
    function onGameStarted({ gameId, publicState }) {
      setGameState({ gameId, ...publicState });
    }
    function onPublicStateUpdated({ patch }) {
      setGameState((prev) => (prev ? { ...prev, ...patch } : prev));
    }
    function onGameEnded({ reason }) {
      setLastEndReason(reason);
      setGameState(null);
    }

    socket.on('room:updated', onRoomUpdated);
    socket.on('room:closed', onRoomClosed);
    socket.on('game:started', onGameStarted);
    socket.on('game:publicStateUpdated', onPublicStateUpdated);
    socket.on('game:ended', onGameEnded);

    return () => {
      socket.off('room:updated', onRoomUpdated);
      socket.off('room:closed', onRoomClosed);
      socket.off('game:started', onGameStarted);
      socket.off('game:publicStateUpdated', onPublicStateUpdated);
      socket.off('game:ended', onGameEnded);
    };
  }, [socket, reset]);

  // Tentative de reconnexion automatique si un sessionToken existe déjà dans
  // cet onglet (rechargement de page en pleine room). Attend une connexion
  // socket effective avant d'émettre, plutôt que de supposer qu'elle est déjà
  // établie au montage.
  useEffect(() => {
    const token = getSessionToken();
    if (!token || reconnectAttempted.current) return undefined;

    function attempt() {
      if (reconnectAttempted.current) return;
      reconnectAttempted.current = true;
      emitAsync('room:reconnect', { sessionToken: token })
        .then((res) => {
          setRoom(res.room);
          setPlayer(res.player);
          if (res.gameState) setGameState({ gameId: res.room.currentGameId, ...res.gameState });
        })
        .catch(() => clearSessionToken());
    }

    if (socket.connected) {
      attempt();
      return undefined;
    }
    socket.once('connect', attempt);
    return () => socket.off('connect', attempt);
  }, [socket]);

  const createRoom = useCallback(async (displayName, settingsOverrides) => {
    const res = await emitAsync('room:create', { displayName, settingsOverrides });
    setRoom(res.room);
    setPlayer(res.player);
    setSessionToken(res.sessionToken);
    return res;
  }, []);

  const joinRoom = useCallback(async (inviteCode, displayName) => {
    const res = await emitAsync('room:join', { inviteCode, displayName });
    setRoom(res.room);
    setPlayer(res.player);
    setSessionToken(res.sessionToken);
    return res;
  }, []);

  const leaveRoom = useCallback(async () => {
    await emitAsync('room:leave', {});
    reset();
  }, [reset]);

  const kickPlayer = useCallback((targetPlayerId) => emitAsync('room:kick', { targetPlayerId }), []);
  const updateSettings = useCallback((settings) => emitAsync('room:updateSettings', { settings }), []);
  const startGame = useCallback(() => emitAsync('room:start', {}), []);
  const stopGame = useCallback(() => emitAsync('room:stop', {}), []);
  const setDisplayName = useCallback((displayName) => emitAsync('player:setDisplayName', { displayName }), []);
  const clickButton = useCallback(() => emitAsync('game:click', {}), []);

  return (
    <GameContext.Provider
      value={{
        room,
        player,
        gameState,
        lastEndReason,
        createRoom,
        joinRoom,
        leaveRoom,
        kickPlayer,
        updateSettings,
        startGame,
        stopGame,
        setDisplayName,
        clickButton,
        resetLocalState: reset,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}
