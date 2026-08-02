import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorPopupProvider, useErrorPopup } from './ErrorPopupContext';
import ErrorPopup from './ErrorPopup';
import ErrorToasts from './ErrorToasts';

const mockSocket = { on: vi.fn(), off: vi.fn(), emit: vi.fn() };
vi.mock('../../hooks/useSocket', () => ({
  useSocket: () => ({ socket: mockSocket, connected: true }),
}));

function Trigger({ code, message }) {
  const { showError } = useErrorPopup();
  return (
    <button type="button" onClick={() => showError(code, message)}>
      déclencher
    </button>
  );
}

function setup({ code, message, onBackToMenu = vi.fn() }) {
  render(
    <ErrorPopupProvider onBackToMenu={onBackToMenu}>
      <Trigger code={code} message={message} />
      <ErrorPopup />
      <ErrorToasts />
    </ErrorPopupProvider>
  );
  return { onBackToMenu };
}

describe('ErrorPopupContext severity routing', () => {
  beforeEach(() => {
    mockSocket.on.mockReset();
    mockSocket.off.mockReset();
  });

  // Régression : une carte refusée éjectait le joueur de sa partie.
  it('shows a gameplay error as a dismissible toast, never the fatal popup', async () => {
    const { onBackToMenu } = setup({ code: 'SELF_INVALIDATING_CARD' });

    await userEvent.click(screen.getByRole('button', { name: 'déclencher' }));

    expect(screen.getByText('Cette carte invaliderait ton propre mot-piège.')).toBeInTheDocument();
    expect(screen.queryByText('Oups !')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Retour au menu' })).not.toBeInTheDocument();
    expect(onBackToMenu).not.toHaveBeenCalled();
  });

  it.each(['CONSTRAINT_VIOLATION', 'HAND_FULL', 'INSUFFICIENT_COINS', 'RATE_LIMITED', 'PERMISSION_DENIED'])(
    'treats %s as recoverable',
    async (code) => {
      const { onBackToMenu } = setup({ code });
      await userEvent.click(screen.getByRole('button', { name: 'déclencher' }));
      expect(screen.queryByText('Oups !')).not.toBeInTheDocument();
      expect(onBackToMenu).not.toHaveBeenCalled();
    }
  );

  it.each(['ROOM_NOT_FOUND', 'ROOM_FULL', 'DISCONNECTED', 'SESSION_EXPIRED'])(
    'still shows %s in the fatal popup with a way back to the menu',
    async (code) => {
      const { onBackToMenu } = setup({ code });
      await userEvent.click(screen.getByRole('button', { name: 'déclencher' }));

      expect(screen.getByText('Oups !')).toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: 'Retour au menu' }));
      expect(onBackToMenu).toHaveBeenCalled();
    }
  );

  it('defaults an unknown code to recoverable rather than ejecting the player', async () => {
    const { onBackToMenu } = setup({ code: 'SOME_NEW_CODE', message: 'boom' });
    await userEvent.click(screen.getByRole('button', { name: 'déclencher' }));

    expect(screen.getByText('boom')).toBeInTheDocument();
    expect(onBackToMenu).not.toHaveBeenCalled();
  });

  it('routes a pushed connection:error through the same severity rules', async () => {
    const onBackToMenu = vi.fn();
    render(
      <ErrorPopupProvider onBackToMenu={onBackToMenu}>
        <ErrorPopup />
        <ErrorToasts />
      </ErrorPopupProvider>
    );

    const handler = mockSocket.on.mock.calls.find(([event]) => event === 'connection:error')[1];
    act(() => handler({ code: 'HAND_FULL', message: 'main pleine' }));

    expect(screen.getByText('Ta main est pleine.')).toBeInTheDocument();
    expect(onBackToMenu).not.toHaveBeenCalled();
  });
});
