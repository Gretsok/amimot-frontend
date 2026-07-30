import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import RecapPhase from './RecapPhase';

const mockUseGamePhase = vi.fn();
vi.mock('../../hooks/useGamePhase', () => ({
  useGamePhase: () => mockUseGamePhase(),
}));

const gameConfig = { rounds: [{}, {}, {}] };

function baseCtx() {
  return {
    room: {
      hostPlayerId: 'host-1',
      players: [
        { id: 'host-1', displayName: 'Léa' },
        { id: 'p2', displayName: 'Marc' },
      ],
    },
    gameState: {
      round: 2,
      scores: { 'host-1': 8, p2: 3 },
      scoresBeforeLastRound: { 'host-1': 5, p2: 3 },
      lastRoundScoreDeltas: { 'host-1': 3, p2: 0 },
      lastRoundCoinDeltas: { 'host-1': 3, p2: -2 },
    },
  };
}

describe('RecapPhase', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockUseGamePhase.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows the score BEFORE the round first', () => {
    mockUseGamePhase.mockReturnValue(baseCtx());
    render(<RecapPhase gameConfig={gameConfig} />);
    expect(screen.getByText('5 pts')).toBeInTheDocument();
  });

  it('animates to the score AFTER the round shortly after', () => {
    mockUseGamePhase.mockReturnValue(baseCtx());
    render(<RecapPhase gameConfig={gameConfig} />);
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(screen.getByText('8 pts')).toBeInTheDocument();
  });

  it('shows the round score and coin deltas', () => {
    mockUseGamePhase.mockReturnValue(baseCtx());
    render(<RecapPhase gameConfig={gameConfig} />);
    expect(screen.getByText('+3 pts · +3 pièces')).toBeInTheDocument();
    expect(screen.getByText('+0 pts · -2 pièces')).toBeInTheDocument();
  });
});
