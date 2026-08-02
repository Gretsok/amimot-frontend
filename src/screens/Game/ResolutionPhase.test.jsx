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

  // Les deux rythmes doivent se lire comme UN choix qui lance la révélation :
  // avant, "Défilement automatique" et "Mot suivant" cohabitaient sans qu'on
  // comprenne qu'ils étaient alternatifs.
  it('offers manual and automatic pacing as one either/or choice before the reveal starts', async () => {
    const ctx = baseCtx({
      player: { id: 'host-1', state: 'IN_GAME' },
      gameState: {
        round: 1,
        letter: 'C',
        constraints: [],
        resolution: {
          pacingMode: 'manual',
          revealedWordIndex: -1,
          words: [{ word: 'chat', submitterIds: ['p2'], isTrap: false, trapSetterIds: [], victimIds: [] }],
        },
      },
    });
    mockUseGamePhase.mockReturnValue(ctx);
    render(<ResolutionPhase gameConfig={gameConfig} />);

    expect(screen.getByText(/Lancer la révélation/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Mot suivant' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Défilement automatique' }));
    expect(ctx.advanceResolution).toHaveBeenCalledWith('startAuto');

    await userEvent.click(screen.getByRole('button', { name: 'Défilement manuel' }));
    expect(ctx.advanceResolution).toHaveBeenCalledWith('startManual');
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

  // Le bouton était désactivé sur le dernier mot ; en réalité c'est ce clic
  // qui termine la phase, et sans lui le dernier mot n'était jamais montré.
  it('turns the last word\'s button into the action that ends the phase, still enabled', async () => {
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

    const button = screen.getByRole('button', { name: 'Voir les points' });
    expect(button).not.toBeDisabled();
    await userEvent.click(button);
    expect(ctx.advanceResolution).toHaveBeenCalledWith('next');
  });

  it('shows only "Reprendre la main" while pacing is auto', async () => {
    const ctx = baseCtx({
      player: { id: 'host-1', state: 'IN_GAME' },
      gameState: {
        round: 1,
        letter: 'C',
        constraints: [],
        resolution: {
          pacingMode: 'auto',
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

    expect(screen.queryByRole('button', { name: 'Mot suivant' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(1);

    await userEvent.click(screen.getByRole('button', { name: 'Reprendre la main' }));
    expect(ctx.advanceResolution).toHaveBeenCalledWith('startManual');
  });

  // Régression : l'index peut valoir words.length le temps d'un aller-retour
  // serveur (ce cran termine la phase) — l'écran ne doit pas se vider.
  it('keeps showing the last word if the index has already gone one past the end', () => {
    mockUseGamePhase.mockReturnValue(
      baseCtx({
        gameState: {
          round: 1,
          letter: 'C',
          constraints: [],
          resolution: {
            pacingMode: 'manual',
            revealedWordIndex: 1,
            words: [{ word: 'chat', submitterIds: ['p2'], isTrap: false, trapSetterIds: [], victimIds: [] }],
          },
        },
      })
    );
    render(<ResolutionPhase gameConfig={gameConfig} />);
    expect(screen.getByText('chat')).toBeInTheDocument();
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
  // Rien n'indiquait où on en était dans la révélation.
  it('shows how far along the reveal is', () => {
    mockUseGamePhase.mockReturnValue(
      baseCtx({
        gameState: {
          round: 1,
          letter: 'C',
          constraints: [],
          resolution: {
            pacingMode: 'manual',
            revealedWordIndex: 0,
            words: [
              { word: 'chat', submitterIds: ['host-1'], isTrap: false, trapSetterIds: [], victimIds: [] },
              { word: 'chien', submitterIds: ['p2'], isTrap: false, trapSetterIds: [], victimIds: [] },
            ],
          },
        },
      })
    );
    render(<ResolutionPhase gameConfig={gameConfig} />);
    expect(screen.getByText('Mot 1 sur 2')).toBeInTheDocument();
  });

  // Un non-hôte restait devant un écran figé, sans contrôle ni explication
  // (cette phase n'a pas de chrono serveur).
  it('tells a non-host who is driving the reveal', () => {
    mockUseGamePhase.mockReturnValue(
      baseCtx({
        player: { id: 'p2', state: 'IN_GAME' },
        gameState: {
          round: 1,
          letter: 'C',
          constraints: [],
          resolution: {
            pacingMode: 'manual',
            revealedWordIndex: 0,
            words: [{ word: 'chat', submitterIds: ['host-1'], isTrap: false, trapSetterIds: [], victimIds: [] }],
          },
        },
      })
    );
    render(<ResolutionPhase gameConfig={gameConfig} />);
    expect(screen.getByText(/hôte qui fait défiler/)).toBeInTheDocument();
  });

  it('tells a non-host that the host has not started the reveal yet', () => {
    mockUseGamePhase.mockReturnValue(
      baseCtx({
        player: { id: 'p2', state: 'IN_GAME' },
        gameState: {
          round: 1,
          letter: 'C',
          constraints: [],
          resolution: {
            pacingMode: 'manual',
            revealedWordIndex: -1,
            words: [{ word: 'chat', submitterIds: ['host-1'], isTrap: false, trapSetterIds: [], victimIds: [] }],
          },
        },
      })
    );
    render(<ResolutionPhase gameConfig={gameConfig} />);
    expect(screen.getByText(/hôte qui lance la révélation/)).toBeInTheDocument();
  });

  it('tells a non-host when the words are scrolling on their own', () => {
    mockUseGamePhase.mockReturnValue(
      baseCtx({
        player: { id: 'p2', state: 'IN_GAME' },
        gameState: {
          round: 1,
          letter: 'C',
          constraints: [],
          resolution: {
            pacingMode: 'auto',
            revealedWordIndex: 0,
            words: [{ word: 'chat', submitterIds: ['host-1'], isTrap: false, trapSetterIds: [], victimIds: [] }],
          },
        },
      })
    );
    render(<ResolutionPhase gameConfig={gameConfig} />);
    expect(screen.getByText(/défilent automatiquement/)).toBeInTheDocument();
  });
});
