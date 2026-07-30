import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResolutionPhase from './ResolutionPhase';

const mockUseGamePhase = vi.fn();
vi.mock('../../hooks/useGamePhase', () => ({
  useGamePhase: () => mockUseGamePhase(),
}));
vi.mock('../../components/ErrorPopup/ErrorPopupContext', () => ({
  useErrorPopup: () => ({ showError: vi.fn() }),
}));

const gameConfig = {
  rounds: [{}, {}, {}],
  scoring: { pointsPerGroupMatch: 1, trapVictimPoints: 1, trapSetterPointsPerVictim: 2, selfTrapPenalty: -5 },
};

function baseCtx(overrides = {}) {
  return {
    room: {
      hostPlayerId: 'host-1',
      players: [
        { id: 'host-1', displayName: 'Léa' },
        { id: 'p2', displayName: 'Marc' },
      ],
    },
    player: { id: 'p2', state: 'IN_GAME' },
    gameState: {
      round: 1,
      letter: 'C',
      constraints: [],
      resolution: { pacingMode: 'manual', revealedWordIndex: -1, words: [] },
    },
    advanceResolution: vi.fn().mockResolvedValue({}),
    ...overrides,
  };
}

describe('ResolutionPhase', () => {
  beforeEach(() => {
    mockUseGamePhase.mockReset();
  });

  it('shows the constraints recap before any word is revealed', () => {
    mockUseGamePhase.mockReturnValue(baseCtx());
    render(<ResolutionPhase gameConfig={gameConfig} />);
    expect(screen.getByText('Récap des contraintes')).toBeInTheDocument();
  });

  it('reveals the current word with submitters and per-player reasons', () => {
    const ctx = baseCtx({
      gameState: {
        round: 1,
        letter: 'C',
        constraints: [],
        resolution: {
          pacingMode: 'manual',
          revealedWordIndex: 0,
          words: [{ word: 'chat', submitterIds: ['host-1', 'p2'], isTrap: false, trapSetterIds: [], victimIds: [] }],
        },
      },
    });
    mockUseGamePhase.mockReturnValue(ctx);
    render(<ResolutionPhase gameConfig={gameConfig} />);
    expect(screen.getByText('chat')).toBeInTheDocument();
    expect(screen.getByText('Léa')).toBeInTheDocument();
    expect(screen.getByText('Marc')).toBeInTheDocument();
    expect(screen.getAllByText(/2 joueurs ont dit ce mot/)).toHaveLength(2);
  });

  it('hides host controls entirely for a non-host player', () => {
    const ctx = baseCtx({
      gameState: {
        round: 1,
        letter: 'C',
        constraints: [],
        resolution: {
          pacingMode: 'manual',
          revealedWordIndex: 0,
          words: [{ word: 'chat', submitterIds: ['p2'], isTrap: false, trapSetterIds: [], victimIds: [] }],
        },
      },
    });
    mockUseGamePhase.mockReturnValue(ctx);
    render(<ResolutionPhase gameConfig={gameConfig} />);
    expect(screen.queryByRole('button', { name: 'Mot suivant' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /manuel|automatique/ })).not.toBeInTheDocument();
  });

  it('shows host controls for the host and calls advanceResolution("next") on click', async () => {
    const ctx = baseCtx({
      player: { id: 'host-1', state: 'IN_GAME' },
      gameState: {
        round: 1,
        letter: 'C',
        constraints: [],
        resolution: {
          pacingMode: 'manual',
          revealedWordIndex: 0,
          words: [
            { word: 'chat', submitterIds: ['p2'], isTrap: false, trapSetterIds: [], victimIds: [] },
            { word: 'chien', submitterIds: ['host-1'], isTrap: false, trapSetterIds: [], victimIds: [] },
          ],
        },
      },
    });
    mockUseGamePhase.mockReturnValue(ctx);
    render(<ResolutionPhase gameConfig={gameConfig} />);

    const nextButton = screen.getByRole('button', { name: 'Mot suivant' });
    expect(nextButton).not.toBeDisabled();
    await userEvent.click(nextButton);
    expect(ctx.advanceResolution).toHaveBeenCalledWith('next');
  });

  it('disables "Mot suivant" once the last word is being shown', () => {
    const ctx = baseCtx({
      player: { id: 'host-1', state: 'IN_GAME' },
      gameState: {
        round: 1,
        letter: 'C',
        constraints: [],
        resolution: {
          pacingMode: 'manual',
          revealedWordIndex: 0,
          words: [{ word: 'chat', submitterIds: ['p2'], isTrap: false, trapSetterIds: [], victimIds: [] }],
        },
      },
    });
    mockUseGamePhase.mockReturnValue(ctx);
    render(<ResolutionPhase gameConfig={gameConfig} />);
    expect(screen.getByRole('button', { name: 'Mot suivant' })).toBeDisabled();
  });

  it('hides "Mot suivant" while pacing is auto, but still shows the pacing toggle', () => {
    const ctx = baseCtx({
      player: { id: 'host-1', state: 'IN_GAME' },
      gameState: {
        round: 1,
        letter: 'C',
        constraints: [],
        resolution: {
          pacingMode: 'auto',
          revealedWordIndex: 0,
          words: [{ word: 'chat', submitterIds: ['p2'], isTrap: false, trapSetterIds: [], victimIds: [] }],
        },
      },
    });
    mockUseGamePhase.mockReturnValue(ctx);
    render(<ResolutionPhase gameConfig={gameConfig} />);
    expect(screen.queryByRole('button', { name: 'Mot suivant' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Passer en manuel' })).toBeInTheDocument();
  });

  it('shows the trap-setter name and their reasons even if they did not submit the trap word themselves', () => {
    const ctx = baseCtx({
      gameState: {
        round: 1,
        letter: 'L',
        constraints: [],
        resolution: {
          pacingMode: 'manual',
          revealedWordIndex: 0,
          words: [{ word: 'loup', submitterIds: ['p2'], isTrap: true, trapSetterIds: ['host-1'], victimIds: ['p2'] }],
        },
      },
    });
    mockUseGamePhase.mockReturnValue(ctx);
    render(<ResolutionPhase gameConfig={gameConfig} />);
    expect(screen.getByText(/Mot-piège de Léa/)).toBeInTheDocument();
    expect(screen.getAllByText('Léa')).toHaveLength(1); // affiché une fois, dans la section poseur de piège
    expect(screen.getByText(/tombé dans le piège/)).toBeInTheDocument();
  });
});
