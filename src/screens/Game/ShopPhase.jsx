import RoundIndicator from '../../components/game/RoundIndicator';
import PhaseTimer from '../../components/game/PhaseTimer';
import Button from '../../components/ui/Button';
import { useGamePhase } from '../../hooks/useGamePhase';
import { useErrorPopup } from '../../components/ErrorPopup/ErrorPopupContext';
import { CARD_TITLES, CARD_DESCRIPTIONS } from '../../domain/constraintLabels';
import styles from './ShopPhase.module.css';

// Doit refléter exactement `cardPrice` côté serveur (domain/game/hand.js),
// arrondi compris : sans ça la boutique afficherait 4,5 pièces là où le
// serveur en débite 5.
function cardPrice(basePrice, multiplier) {
  return Math.round(basePrice * multiplier);
}

// Regroupe les doublons pour rester lisible à 10 cartes en main.
function groupHand(hand) {
  const counts = new Map();
  hand.forEach((card) => counts.set(card.type, (counts.get(card.type) || 0) + 1));
  return Array.from(counts, ([type, count]) => ({ type, count }));
}

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

      {/* Doublon du bandeau observateur de GameScreen : supprimé. */}
      {isObserver ? null : (
        <>
          <p className={styles.carryOver}>Les pièces non dépensées sont conservées pour les manches suivantes.</p>

          {/* Décider d'un achat sans voir ce qu'on possède déjà était
              impossible. */}
          <div className={styles.hand}>
            <p className={styles.handTitle}>
              Ta main ({hand.length}/{maxSize})
            </p>
            {hand.length === 0 ? (
              <p className={styles.handEmpty}>Aucune carte pour l&apos;instant.</p>
            ) : (
              <ul className={styles.handList}>
                {groupHand(hand).map(({ type, count }) => (
                  <li key={type} className={styles.handItem}>
                    {CARD_TITLES[type] || type}
                    {count > 1 && <span className={styles.handCount}> ×{count}</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {handFull && (
            <p className={styles.handFullNote}>
              Main pleine ({maxSize} cartes maximum) — impossible d&apos;acheter une carte de plus.
            </p>
          )}
          <div className={styles.catalog}>
            {gameConfig.cards.catalog.map((card) => {
              const price = cardPrice(card.basePrice, roundConfig.cardPriceMultiplier);
              const canAfford = coins >= price;
              return (
                <div key={card.id} className={styles.catalogItem}>
                  <p className={styles.cardTitle}>{CARD_TITLES[card.id] || card.id}</p>
                  {CARD_DESCRIPTIONS[card.id] && (
                    <p className={styles.cardDescription}>{CARD_DESCRIPTIONS[card.id]}</p>
                  )}
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
