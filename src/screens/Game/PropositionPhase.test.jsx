import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PropositionPhase from './PropositionPhase';

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
    player: { id: 'p1', state: 'IN_GAME' },
    gameState: {
      round: 1,
      phaseEndsAt: Date.now() + 45000,
      letter: 'C',
      constraints: [{ id: 'c1', ownerId: 'p2', type: 'FORBID_LETTER', value: 'H' }],
    },
    myGameState: { hand: [], proposalWord: '', proposalValidated: false },
    submitProposition: vi.fn().mockResolvedValue({}),
    validateProposition: vi.fn().mockResolvedValue({}),
    playConstraintCard: vi.fn().mockResolvedValue({}),
    ...overrides,
  };
}

describe('PropositionPhase', () => {
  beforeEach(() => {
    mockUseGamePhase.mockReset();
  });

  it('validates against a constraint owned by ANOTHER player (unlike the trap word)', () => {
    mockUseGamePhase.mockReturnValue(baseCtx({ myGameState: { hand: [], proposalWord: 'chat', proposalValidated: false } }));
    render(<PropositionPhase gameConfig={gameConfig} />);
    // "chat" contains "h", forbidden by p2's constraint -> Valider stays disabled
    expect(screen.getByRole('button', { name: 'Valider' })).toBeDisabled();
  });

  it('enables "Valider" for a word respecting all active constraints', () => {
    mockUseGamePhase.mockReturnValue(baseCtx({ myGameState: { hand: [], proposalWord: 'cola', proposalValidated: false } }));
    render(<PropositionPhase gameConfig={gameConfig} />);
    expect(screen.getByRole('button', { name: 'Valider' })).not.toBeDisabled();
  });

  it('calls validateProposition on click', async () => {
    const ctx = baseCtx({ myGameState: { hand: [], proposalWord: 'cola', proposalValidated: false } });
    mockUseGamePhase.mockReturnValue(ctx);
    render(<PropositionPhase gameConfig={gameConfig} />);
    await userEvent.click(screen.getByRole('button', { name: 'Valider' }));
    expect(ctx.validateProposition).toHaveBeenCalled();
  });

  it('locks the input and shows "Validé" once validated', () => {
    mockUseGamePhase.mockReturnValue(baseCtx({ myGameState: { hand: [], proposalWord: 'cola', proposalValidated: true } }));
    render(<PropositionPhase gameConfig={gameConfig} />);
    expect(screen.getByPlaceholderText('Ta proposition')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Validé' })).toBeDisabled();
  });
});
