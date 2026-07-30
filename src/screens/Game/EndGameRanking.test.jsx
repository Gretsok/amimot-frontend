import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EndGameRanking from './EndGameRanking';

const mockUseGamePhase = vi.fn();
vi.mock('../../hooks/useGamePhase', () => ({
  useGamePhase: () => mockUseGamePhase(),
}));
vi.mock('../../components/ErrorPopup/ErrorPopupContext', () => ({
  useErrorPopup: () => ({ showError: vi.fn() }),
}));

function baseCtx(overrides = {}) {
  return {
    room: {
      hostPlayerId: 'host-1',
      players: [
        { id: 'host-1', displayName: 'Léa' },
        { id: 'p2', displayName: 'Marc' },
        { id: 'p3', displayName: 'Nino' },
      ],
    },
    player: { id: 'p2', state: 'IN_GAME' },
    gameState: { scores: { 'host-1': 8, p2: 8, p3: 3 } },
    returnToLobby: vi.fn().mockResolvedValue({}),
    ...overrides,
  };
}

describe('EndGameRanking', () => {
  beforeEach(() => {
    mockUseGamePhase.mockReset();
  });

  it('sorts players by score descending', () => {
    mockUseGamePhase.mockReturnValue(baseCtx());
    render(<EndGameRanking />);
    const rows = screen.getAllByRole('listitem');
    expect(within(rows[0]).getByText(/Léa|Marc/)).toBeInTheDocument();
    expect(within(rows[2]).getByText('Nino')).toBeInTheDocument();
  });

  it('gives tied players the same rank, and the next rank skips ahead (no artificial tiebreak)', () => {
    mockUseGamePhase.mockReturnValue(baseCtx());
    render(<EndGameRanking />);
    const rows = screen.getAllByRole('listitem');
    expect(within(rows[0]).getByText('1')).toBeInTheDocument();
    expect(within(rows[1]).getByText('1')).toBeInTheDocument();
    expect(within(rows[2]).getByText('3')).toBeInTheDocument();
  });

  it('shows the "Retour au lobby" button only for the host', () => {
    mockUseGamePhase.mockReturnValue(baseCtx({ player: { id: 'p2', state: 'IN_GAME' } }));
    render(<EndGameRanking />);
    expect(screen.queryByRole('button', { name: 'Retour au lobby' })).not.toBeInTheDocument();
  });

  it('shows the "Retour au lobby" button for the host and calls returnToLobby', async () => {
    const ctx = baseCtx({ player: { id: 'host-1', state: 'IN_GAME' } });
    mockUseGamePhase.mockReturnValue(ctx);
    render(<EndGameRanking />);
    await userEvent.click(screen.getByRole('button', { name: 'Retour au lobby' }));
    expect(ctx.returnToLobby).toHaveBeenCalled();
  });
});
