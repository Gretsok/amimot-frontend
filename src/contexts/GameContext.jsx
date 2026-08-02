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
  const [myGameState, setMyGameState] = useState(null);
  const [lastEndReason, setLastEndReason] = useState(null);
  const reconnectAttempted = useRef(false);

  const reset = useCallback(() => {
    setRoom(null);
    setPlayer(null);
    setGameState(null);
    setMyGameState(null);
    clearSessionToken();
  }, []);

  useEffect(() => {
    // `player` (l'objet du joueur courant) n'est renvoyé qu'au join/create/
    // reconnect — sans ça, son `state` resterait figé sur sa valeur initiale
    // (ex: "OBSERVER" pour toujours) alors que le serveur le fait évoluer
    // (WAITING -> IN_GAME au lancement, OBSERVER/IN_GAME -> WAITING en fin de
    // partie). On le resynchronise donc à chaque snapshot de room.
    function onRoomUpdated(snapshot) {
      setRoom(snapshot);
      setPlayer((prev) => {
        if (!prev) return prev;
        const updated = snapshot.players.find((p) => p.id === prev.id);
        return updated ? { ...prev, displayName: updated.displayName, state: updated.state } : prev;
      });
    }
    function onRoomClosed() {
      reset();
    }
    function onGameStarted({ gameId, publicState }) {
      setGameState({ gameId, ...publicState });
    }
    // Renvoie systématiquement l'état public COMPLET (jamais un patch
    // partiel) : les tableaux imbriqués (contraintes, ordre de révélation)
    // ne peuvent pas être "patchés" proprement par un merge superficiel —
    // remplacer entièrement est plus simple et plus sûr, le payload restant
    // de toute façon petit (décision de plan §0.4).
    function onPublicStateUpdated({ publicState }) {
      setGameState((prev) => (prev ? { gameId: prev.gameId, ...publicState } : prev));
    }
    // État privé (main, mot-piège, proposition) : ciblé à ce seul joueur,
    // jamais mélangé au broadcast public — même logique de remplacement
    // complet que l'état public.
    function onPrivateStateUpdated({ privateState }) {
      setMyGameState(privateState);
    }
    // Ne se déclenche que sur un abandon prématuré (room:stop) ou un retour
    // au lobby explicite après l'écran de classement (room:returnToLobby) —
    // jamais sur la transition naturelle vers la phase ENDED, qui arrive via
    // un onPublicStateUpdated ordinaire et doit garder gameState peuplé pour
    // afficher le classement final.
    function onGameEnded({ reason }) {
      setLastEndReason(reason);
      setGameState(null);
      setMyGameState(null);
    }

    socket.on('room:updated', onRoomUpdated);
    socket.on('room:closed', onRoomClosed);
    socket.on('game:started', onGameStarted);
    socket.on('game:publicStateUpdated', onPublicStateUpdated);
    socket.on('game:privateStateUpdated', onPrivateStateUpdated);
    socket.on('game:ended', onGameEnded);

    return () => {
      socket.off('room:updated', onRoomUpdated);
      socket.off('room:closed', onRoomClosed);
      socket.off('game:started', onGameStarted);
      socket.off('game:publicStateUpdated', onPublicStateUpdated);
      socket.off('game:privateStateUpdated', onPrivateStateUpdated);
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
          if (res.privateState) setMyGameState(res.privateState);
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
    // Room déjà en partie (le joueur rejoint en tant qu'observateur) : sans
    // ça, gameState resterait null et l'écran resterait bloqué sur le Lobby.
    if (res.gameState) setGameState({ gameId: res.room.currentGameId, ...res.gameState });
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
  const returnToLobby = useCallback(() => emitAsync('room:returnToLobby', {}), []);
  const setDisplayName = useCallback((displayName) => emitAsync('player:setDisplayName', { displayName }), []);

  // --- Actions de gameplay -------------------------------------------------
  const submitTrapWord = useCallback((text) => emitAsync('game:submitTrapWord', { text }), []);
  const validateTrapWord = useCallback(() => emitAsync('game:validateTrapWord', {}), []);
  const unvalidateTrapWord = useCallback(() => emitAsync('game:unvalidateTrapWord', {}), []);
  const playConstraintCard = useCallback(
    (cardInstanceId, type, value) => emitAsync('game:playConstraintCard', { cardInstanceId, type, value }),
    []
  );
  const submitProposition = useCallback((text) => emitAsync('game:submitProposition', { text }), []);
  const validateProposition = useCallback(() => emitAsync('game:validateProposition', {}), []);
  const unvalidateProposition = useCallback(() => emitAsync('game:unvalidateProposition', {}), []);
  const buyCard = useCallback((cardId) => emitAsync('game:buyCard', { cardId }), []);
  const advanceResolution = useCallback((action) => emitAsync('game:advanceResolution', { action }), []);
  const advanceRecap = useCallback(() => emitAsync('game:advanceRecap', {}), []);

  return (
    <GameContext.Provider
      value={{
        room,
        player,
        gameState,
        myGameState,
        lastEndReason,
        createRoom,
        joinRoom,
        leaveRoom,
        kickPlayer,
        updateSettings,
        startGame,
        stopGame,
        returnToLobby,
        setDisplayName,
        submitTrapWord,
        validateTrapWord,
        unvalidateTrapWord,
        playConstraintCard,
        submitProposition,
        validateProposition,
        unvalidateProposition,
        buyCard,
        advanceResolution,
        advanceRecap,
        resetLocalState: reset,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}
