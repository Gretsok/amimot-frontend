import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import RecapPhase from './RecapPhase';

const mockUseGamePhase = vi.fn();
vi.mock('../../hooks/useGamePhase', () => ({
  useGamePhase: () => mockUseGamePhase(),
}));
vi.mock('../../components/ErrorPopup/ErrorPopupContext', () => ({
  useErrorPopup: () => ({ showError: vi.fn() }),
}));

const gameConfig = {
  rounds: [{ scoreMultiplier: 1 }, { scoreMultiplier: 1 }, { scoreMultiplier: 2 }],
  scoring: {
    pointsPerGroupMatch: 1,
    trapVictimPoints: 1,
    trapSetterPointsPerVictim: 2,
    selfTrapPenalty: -5,
  },
};

function baseCtx(overrides = {}) {
  return {
    room: {
      hostPlayerId: 'host-1',
      players: [
        { id: 'host-1', displayName: 'Léa', state: 'IN_GAME' },
        { id: 'p2', displayName: 'Marc', state: 'IN_GAME' },
      ],
    },
    player: { id: 'host-1', state: 'IN_GAME' },
    gameState: {
      round: 2,
      scores: { 'host-1': 8, p2: 3 },
      scoresBeforeLastRound: { 'host-1': 5, p2: 3 },
      lastRoundScoreDeltas: { 'host-1': 3, p2: 0 },
      lastRoundCoinDeltas: { 'host-1': 3, p2: -2 },
      ...overrides.gameState,
    },
    advanceRecap: vi.fn().mockResolvedValue({}),
    ...overrides,
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

  it('shows the score BEFORE the round first, labelled as the total', () => {
    mockUseGamePhase.mockReturnValue(baseCtx());
    render(<RecapPhase gameConfig={gameConfig} />);
    expect(screen.getByText('5 pts')).toBeInTheDocument();
    expect(screen.getAllByText('Total').length).toBeGreaterThan(0);
  });

  it('animates to the score AFTER the round shortly after', () => {
    mockUseGamePhase.mockReturnValue(baseCtx());
    render(<RecapPhase gameConfig={gameConfig} />);
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(screen.getByText('8 pts')).toBeInTheDocument();
  });

  it('labels the round deltas so they cannot be confused with the total', () => {
    mockUseGamePhase.mockReturnValue(baseCtx());
    render(<RecapPhase gameConfig={gameConfig} />);
    expect(screen.getByText('Cette manche : +3 pts · +3 pièces')).toBeInTheDocument();
    expect(screen.getByText('Cette manche : +0 pts · -2 pièces')).toBeInTheDocument();
  });

  // Le récap n'expliquait jamais POURQUOI un joueur gagnait ou perdait.
  it('explains each score with the same wording as the reveal', () => {
    mockUseGamePhase.mockReturnValue(
      baseCtx({
        gameState: {
          resolution: {
            words: [
              { word: 'chat', submitterIds: ['host-1', 'p2'], isTrap: false, trapSetterIds: [], victimIds: [] },
            ],
          },
        },
      })
    );
    render(<RecapPhase gameConfig={gameConfig} />);
    expect(screen.getAllByText('+2 (2 joueurs ont dit ce mot)')).toHaveLength(2);
  });

  it('says explicitly when a player proposed nothing', () => {
    mockUseGamePhase.mockReturnValue(baseCtx({ gameState: { resolution: { words: [] } } }));
    render(<RecapPhase gameConfig={gameConfig} />);
    expect(screen.getAllByText('Aucun mot proposé')).toHaveLength(2);
  });

  // Sans ça, la somme des raisons semblait fausse face au delta réel.
  it('surfaces the round score multiplier when it is not 1', () => {
    mockUseGamePhase.mockReturnValue(baseCtx({ gameState: { round: 3 } }));
    render(<RecapPhase gameConfig={gameConfig} />);
    expect(screen.getByText('Points de cette manche multipliés par 2')).toBeInTheDocument();
  });

  it('does not list observers among the scorers', () => {
    const ctx = baseCtx();
    ctx.room.players.push({ id: 'obs', displayName: 'Curieux', state: 'OBSERVER' });
    mockUseGamePhase.mockReturnValue(ctx);
    render(<RecapPhase gameConfig={gameConfig} />);
    expect(screen.queryByText('Curieux')).not.toBeInTheDocument();
  });

  // Le récap s'enchaînait tout seul au bout de quelques secondes : c'est le
  // seul écran qui explique les points, il attend désormais l'hôte.
  // fireEvent plutôt que userEvent : ce fichier tourne sous fake timers (pour
  // l'animation des scores) et userEvent attendrait de vrais délais.
  it('lets the host move on to the shop', () => {
    const ctx = baseCtx();
    mockUseGamePhase.mockReturnValue(ctx);
    render(<RecapPhase gameConfig={gameConfig} />);

    fireEvent.click(screen.getByRole('button', { name: 'Passer à la boutique' }));
    expect(ctx.advanceRecap).toHaveBeenCalled();
  });

  it('shows a waiting note instead of the button for a non-host', () => {
    mockUseGamePhase.mockReturnValue(baseCtx({ player: { id: 'p2', state: 'IN_GAME' } }));
    render(<RecapPhase gameConfig={gameConfig} />);
    expect(screen.queryByRole('button', { name: 'Passer à la boutique' })).not.toBeInTheDocument();
    expect(screen.getByText(/En attente de l'hôte/)).toBeInTheDocument();
  });
});
