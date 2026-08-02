import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { useContext } from 'react';
import { GameContext, GameProvider } from './GameContext';
import { SocketContext } from './SocketContext';

vi.mock('../services/socket', () => ({
  emitAsync: vi.fn(),
}));

// eslint-disable-next-line import/first
import { emitAsync } from '../services/socket';

function createFakeSocket() {
  const listeners = new Map();
  const socket = {
    connected: true,
    on(event, cb) {
      listeners.set(event, [...(listeners.get(event) || []), cb]);
    },
    off(event, cb) {
      listeners.set(event, (listeners.get(event) || []).filter((f) => f !== cb));
    },
    once(event, cb) {
      const wrapper = (...args) => {
        cb(...args);
        socket.off(event, wrapper);
      };
      socket.on(event, wrapper);
    },
    emit(event, payload) {
      (listeners.get(event) || []).forEach((cb) => cb(payload));
    },
  };
  return socket;
}

function Probe({ onValue }) {
  const ctx = useContext(GameContext);
  onValue(ctx);
  return null;
}

function renderWithProviders(socket, onValue) {
  return render(
    <SocketContext.Provider value={{ socket, connected: true }}>
      <GameProvider>
        <Probe onValue={onValue} />
      </GameProvider>
    </SocketContext.Provider>
  );
}

describe('GameContext', () => {
  let socket;
  let latestCtx;

  beforeEach(() => {
    sessionStorage.clear();
    socket = createFakeSocket();
    latestCtx = null;
    emitAsync.mockReset();
  });

  it('game:started sets the full public gameState', () => {
    renderWithProviders(socket, (ctx) => {
      latestCtx = ctx;
    });
    act(() => {
      socket.emit('game:started', { gameId: 'g1', publicState: { phase: 'PREPARATION', round: 1 } });
    });
    expect(latestCtx.gameState).toEqual({ gameId: 'g1', phase: 'PREPARATION', round: 1 });
  });

  it('game:publicStateUpdated REPLACES gameState entirely rather than shallow-merging', () => {
    renderWithProviders(socket, (ctx) => {
      latestCtx = ctx;
    });
    act(() => {
      socket.emit('game:started', {
        gameId: 'g1',
        publicState: { phase: 'PREPARATION', round: 1, constraints: [{ id: 'c1' }] },
      });
    });
    act(() => {
      socket.emit('game:publicStateUpdated', { publicState: { phase: 'PROPOSITION', round: 1 } });
    });
    expect(latestCtx.gameState).toEqual({ gameId: 'g1', phase: 'PROPOSITION', round: 1 });
    expect(latestCtx.gameState.constraints).toBeUndefined(); // aucun résidu de l'ancien état
  });

  it('game:privateStateUpdated sets myGameState', () => {
    renderWithProviders(socket, (ctx) => {
      latestCtx = ctx;
    });
    act(() => {
      socket.emit('game:privateStateUpdated', { privateState: { hand: [], trapWord: 'chat' } });
    });
    expect(latestCtx.myGameState).toEqual({ hand: [], trapWord: 'chat' });
  });

  it('game:ended clears both gameState and myGameState (abrupt end / return to lobby)', () => {
    renderWithProviders(socket, (ctx) => {
      latestCtx = ctx;
    });
    act(() => {
      socket.emit('game:started', { gameId: 'g1', publicState: { phase: 'PREPARATION' } });
      socket.emit('game:privateStateUpdated', { privateState: { hand: [] } });
    });
    act(() => {
      socket.emit('game:ended', { reason: 'host-stopped' });
    });
    expect(latestCtx.gameState).toBeNull();
    expect(latestCtx.myGameState).toBeNull();
    expect(latestCtx.lastEndReason).toBe('host-stopped');
  });

  it('returnToLobby emits room:returnToLobby', async () => {
    emitAsync.mockResolvedValue({});
    renderWithProviders(socket, (ctx) => {
      latestCtx = ctx;
    });
    await act(async () => {
      await latestCtx.returnToLobby();
    });
    expect(emitAsync).toHaveBeenCalledWith('room:returnToLobby', {});
  });

  it.each([
    ['submitTrapWord', ['chat'], 'game:submitTrapWord', { text: 'chat' }],
    ['validateTrapWord', [], 'game:validateTrapWord', {}],
    ['submitProposition', ['chien'], 'game:submitProposition', { text: 'chien' }],
    ['validateProposition', [], 'game:validateProposition', {}],
    ['buyCard', ['MAX_LENGTH'], 'game:buyCard', { cardId: 'MAX_LENGTH' }],
    ['advanceResolution', ['next'], 'game:advanceResolution', { action: 'next' }],
    ['advanceRecap', [], 'game:advanceRecap', {}],
  ])('%s emits %s with the right payload', async (fnName, args, event, payload) => {
    emitAsync.mockResolvedValue({});
    renderWithProviders(socket, (ctx) => {
      latestCtx = ctx;
    });
    await act(async () => {
      await latestCtx[fnName](...args);
    });
    expect(emitAsync).toHaveBeenCalledWith(event, payload);
  });

  it('playConstraintCard emits with cardInstanceId/type/value', async () => {
    emitAsync.mockResolvedValue({});
    renderWithProviders(socket, (ctx) => {
      latestCtx = ctx;
    });
    await act(async () => {
      await latestCtx.playConstraintCard('c1', 'MAX_LENGTH', 5);
    });
    expect(emitAsync).toHaveBeenCalledWith('game:playConstraintCard', {
      cardInstanceId: 'c1',
      type: 'MAX_LENGTH',
      value: 5,
    });
  });
});
