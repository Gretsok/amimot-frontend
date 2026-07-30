import RoundIndicator from '../../components/game/RoundIndicator';
import PhaseTimer from '../../components/game/PhaseTimer';
import Button from '../../components/ui/Button';
import { useGamePhase } from '../../hooks/useGamePhase';
import { useErrorPopup } from '../../components/ErrorPopup/ErrorPopupContext';
import { CARD_TITLES } from '../../domain/constraintLabels';
import styles from './ShopPhase.module.css';

export default function ShopPhase({ gameConfig }) {
  const { player, gameState, myGameState, buyCard } = useGamePhase();
  const { showError } = useErrorPopup();

  if (!gameState || !player) return null;
  const isObserver = player.state === 'OBSERVER';
  const hand = myGameState?.hand || [];
  const coins = gameState.coins?.[player.id] ?? 0;
  const maxSize = gameConfig.hand.maxSize;
  const handFull = hand.length >= maxSize;
  const round = gameState.round || 1;
  const roundConfig = gameConfig.rounds[round - 1] || gameConfig.rounds[gameConfig.rounds.length - 1];

  async function handleBuy(cardId) {
    try {
      await buyCard(cardId);
    } catch (err) {
      showError(err.code || 'INTERNAL_ERROR', err.message);
    }
  }

  return (
    <div className={styles.phase}>
      <RoundIndicator round={gameState.round} totalRounds={gameConfig.rounds.length} />
      <PhaseTimer phaseEndsAt={gameState.phaseEndsAt} />
      <h2 className={styles.title}>Boutique</h2>
      <p className={styles.coins}>{coins} pièces</p>

      {isObserver ? (
        <p className={styles.observerNote}>Tu observes cette manche.</p>
      ) : (
        <>
          {handFull && (
            <p className={styles.handFullNote}>
              Main pleine ({maxSize} cartes maximum) — impossible d&apos;acheter une carte de plus.
            </p>
          )}
          <div className={styles.catalog}>
            {gameConfig.cards.catalog.map((card) => {
              const price = card.basePrice * roundConfig.cardPriceMultiplier;
              const canAfford = coins >= price;
              return (
                <div key={card.id} className={styles.catalogItem}>
                  <p className={styles.cardTitle}>{CARD_TITLES[card.id] || card.id}</p>
                  <p className={styles.price}>{price} pièces</p>
                  <Button disabled={handFull || !canAfford} onClick={() => handleBuy(card.id)}>
                    Acheter
                  </Button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
