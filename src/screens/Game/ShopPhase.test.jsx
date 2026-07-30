import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ShopPhase from './ShopPhase';

const mockUseGamePhase = vi.fn();
vi.mock('../../hooks/useGamePhase', () => ({
  useGamePhase: () => mockUseGamePhase(),
}));
vi.mock('../../components/ErrorPopup/ErrorPopupContext', () => ({
  useErrorPopup: () => ({ showError: vi.fn() }),
}));

const gameConfig = {
  rounds: [{ cardPriceMultiplier: 1 }, { cardPriceMultiplier: 2 }],
  hand: { maxSize: 10 },
  cards: {
    catalog: [
      { id: 'IMPOSE_LETTER', basePrice: 3, needsParam: true },
      { id: 'MAX_LENGTH', basePrice: 2, needsParam: true },
    ],
  },
};

function baseCtx(overrides = {}) {
  return {
    player: { id: 'p1', state: 'IN_GAME' },
    gameState: { round: 1, coins: { p1: 10 }, phaseEndsAt: Date.now() + 20000 },
    myGameState: { hand: [] },
    buyCard: vi.fn().mockResolvedValue({}),
    ...overrides,
  };
}

describe('ShopPhase', () => {
  beforeEach(() => {
    mockUseGamePhase.mockReset();
  });

  it('shows the current coin balance and card prices for the current round', () => {
    mockUseGamePhase.mockReturnValue(baseCtx());
    render(<ShopPhase gameConfig={gameConfig} />);
    expect(screen.getByText('10 pièces')).toBeInTheDocument();
    expect(screen.getByText('3 pièces')).toBeInTheDocument(); // IMPOSE_LETTER at round-1 multiplier (1)
  });

  it('applies the round card-price multiplier', () => {
    mockUseGamePhase.mockReturnValue(baseCtx({ gameState: { round: 2, coins: { p1: 10 } } }));
    render(<ShopPhase gameConfig={gameConfig} />);
    expect(screen.getByText('6 pièces')).toBeInTheDocument(); // 3 * 2
  });

  it('calls buyCard when a card is bought', async () => {
    const ctx = baseCtx();
    mockUseGamePhase.mockReturnValue(ctx);
    render(<ShopPhase gameConfig={gameConfig} />);
    const buttons = screen.getAllByRole('button', { name: 'Acheter' });
    await userEvent.click(buttons[0]);
    expect(ctx.buyCard).toHaveBeenCalledWith('IMPOSE_LETTER');
  });

  it('disables purchase and shows an explicit message once the hand is at the 10-card cap', () => {
    const fullHand = Array.from({ length: 10 }, (_, i) => ({ instanceId: `c${i}`, type: 'MAX_LENGTH' }));
    mockUseGamePhase.mockReturnValue(baseCtx({ myGameState: { hand: fullHand } }));
    render(<ShopPhase gameConfig={gameConfig} />);

    expect(screen.getByText(/Main pleine/)).toBeInTheDocument();
    screen.getAllByRole('button', { name: 'Acheter' }).forEach((btn) => expect(btn).toBeDisabled());
  });

  it('disables purchase of a card the player cannot afford', () => {
    mockUseGamePhase.mockReturnValue(baseCtx({ gameState: { round: 1, coins: { p1: 1 } } }));
    render(<ShopPhase gameConfig={gameConfig} />);
    screen.getAllByRole('button', { name: 'Acheter' }).forEach((btn) => expect(btn).toBeDisabled());
  });
});
