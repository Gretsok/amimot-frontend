import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PreparationPhase from './PreparationPhase';

const mockUseGamePhase = vi.fn();
vi.mock('../../hooks/useGamePhase', () => ({
  useGamePhase: () => mockUseGamePhase(),
}));
vi.mock('../../components/ErrorPopup/ErrorPopupContext', () => ({
  useErrorPopup: () => ({ showError: vi.fn() }),
}));

const gameConfig = { rounds: [{}, {}, {}], constraints: { constantMinWordLength: 2 } };

function baseCtx(overrides = {}) {
  return {
    room: { players: [{ id: 'p1', state: 'IN_GAME' }, { id: 'p2', state: 'IN_GAME' }] },
    player: { id: 'p1', state: 'IN_GAME' },
    gameState: { round: 1, phaseEndsAt: Date.now() + 15000, letter: 'C', constraints: [], readyPlayerIds: [] },
    myGameState: { hand: [], trapWord: '', trapWordValid: false },
    submitTrapWord: vi.fn().mockResolvedValue({}),
    validateTrapWord: vi.fn().mockResolvedValue({}),
    unvalidateTrapWord: vi.fn().mockResolvedValue({}),
    playConstraintCard: vi.fn().mockResolvedValue({}),
    ...overrides,
  };
}

describe('PreparationPhase', () => {
  beforeEach(() => {
    mockUseGamePhase.mockReset();
  });

  it('shows the round letter and disables "Valider" until the draft satisfies the round letter', () => {
    mockUseGamePhase.mockReturnValue(baseCtx());
    render(<PreparationPhase gameConfig={gameConfig} />);
    expect(screen.getByText(/Lettre : C/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Valider' })).toBeDisabled();
  });

  it('enables "Valider" once the typed word starts with the round letter and is long enough', async () => {
    const ctx = baseCtx({ myGameState: { hand: [], trapWord: 'chat', trapWordValid: false } });
    mockUseGamePhase.mockReturnValue(ctx);
    render(<PreparationPhase gameConfig={gameConfig} />);
    expect(screen.getByRole('button', { name: 'Valider' })).not.toBeDisabled();
  });

  it('calls validateTrapWord when "Valider" is clicked', async () => {
    const ctx = baseCtx({ myGameState: { hand: [], trapWord: 'chat', trapWordValid: false } });
    mockUseGamePhase.mockReturnValue(ctx);
    render(<PreparationPhase gameConfig={gameConfig} />);
    await userEvent.click(screen.getByRole('button', { name: 'Valider' }));
    expect(ctx.validateTrapWord).toHaveBeenCalled();
  });

  // "Validé" est désormais un statut, pas un bouton désactivé : "Modifier"
  // cessait sinon d'être secondaire visuellement.
  it('shows a validated status (not a disabled button) and locks the input', () => {
    const ctx = baseCtx({ myGameState: { hand: [], trapWord: 'chat', trapWordValid: true } });
    mockUseGamePhase.mockReturnValue(ctx);
    render(<PreparationPhase gameConfig={gameConfig} />);
    expect(screen.getByText('✓ Mot-piège validé')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Valider' })).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText('Ton mot-piège')).toBeDisabled();
  });

  it('does not show a "Modifier" button before validation', () => {
    const ctx = baseCtx({ myGameState: { hand: [], trapWord: 'chat', trapWordValid: false } });
    mockUseGamePhase.mockReturnValue(ctx);
    render(<PreparationPhase gameConfig={gameConfig} />);
    expect(screen.queryByRole('button', { name: 'Modifier' })).not.toBeInTheDocument();
  });

  it('shows a "Modifier" button once validated, which calls unvalidateTrapWord to allow changing the word', async () => {
    const ctx = baseCtx({ myGameState: { hand: [], trapWord: 'chat', trapWordValid: true } });
    mockUseGamePhase.mockReturnValue(ctx);
    render(<PreparationPhase gameConfig={gameConfig} />);
    await userEvent.click(screen.getByRole('button', { name: 'Modifier' }));
    expect(ctx.unvalidateTrapWord).toHaveBeenCalled();
  });

  // Le bandeau observateur est rendu une seule fois, par GameScreen : la
  // phase n'affiche plus son propre message redondant.
  it('hides the input for an observer without duplicating the observer note', () => {
    mockUseGamePhase.mockReturnValue(baseCtx({ player: { id: 'p1', state: 'OBSERVER' } }));
    render(<PreparationPhase gameConfig={gameConfig} />);
    expect(screen.queryByText(/observes cette manche/)).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Ton mot-piège')).not.toBeInTheDocument();
  });

  it('shows how many in-game players have validated so far', () => {
    mockUseGamePhase.mockReturnValue(baseCtx({ gameState: { round: 1, phaseEndsAt: Date.now() + 15000, letter: 'C', constraints: [], readyPlayerIds: ['p1'] } }));
    render(<PreparationPhase gameConfig={gameConfig} />);
    expect(screen.getByText('1 / 2 validé·e·s')).toBeInTheDocument();
  });

  it('renders hand cards and lets the player play one', async () => {
    const ctx = baseCtx({ myGameState: { hand: [{ instanceId: 'c1', type: 'MAX_LENGTH' }], trapWord: '', trapWordValid: false } });
    mockUseGamePhase.mockReturnValue(ctx);
    render(<PreparationPhase gameConfig={gameConfig} />);

    await userEvent.click(screen.getByRole('button', { name: 'Jouer' }));
    await userEvent.type(screen.getByPlaceholderText('Nombre de lettres'), '5');
    await userEvent.click(screen.getByRole('button', { name: 'Confirmer' }));

    expect(ctx.playConstraintCard).toHaveBeenCalledWith('c1', 'MAX_LENGTH', 5);
  });
});
