import { useEffect, useState } from 'react';
import RoundIndicator from '../../components/game/RoundIndicator';
import PlayerChip from '../../components/ui/PlayerChip';
import Button from '../../components/ui/Button';
import { useGamePhase } from '../../hooks/useGamePhase';
import { useErrorPopup } from '../../components/ErrorPopup/ErrorPopupContext';
import { describeRoundOutcome, reasonText } from '../../domain/describeResolutionWord';
import { formatPoints } from '../../domain/formatScore';
import styles from './RecapPhase.module.css';

function formatDelta(value) {
  return value >= 0 ? `+${value}` : `${value}`;
}

export default function RecapPhase({ gameConfig }) {
  const { room, player, gameState, advanceRecap } = useGamePhase();
  const { showError } = useErrorPopup();
  const [displayedScores, setDisplayedScores] = useState(gameState?.scoresBeforeLastRound || {});

  useEffect(() => {
    if (!gameState) return undefined;
    setDisplayedScores(gameState.scoresBeforeLastRound || {});
    const timeout = setTimeout(() => setDisplayedScores(gameState.scores || {}), 50);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.round]);

  if (!gameState || !room) return null;

  // `resolution` survit jusqu'à cette phase (l'état public est fusionné, pas
  // remplacé) : on peut donc reconstituer POURQUOI chaque joueur a marqué,
  // au lieu de n'afficher qu'un total inexpliqué.
  const reasonsByPlayer = describeRoundOutcome(gameState.resolution?.words || [], gameConfig.scoring);
  const roundConfig = gameConfig.rounds[(gameState.round || 1) - 1];
  const scoreMultiplier = roundConfig?.scoreMultiplier ?? 1;

  // Les observateurs n'ont pas joué la manche : les lister avec 0 pt laissait
  // croire qu'ils participaient.
  const players = room.players.filter((p) => p.state === 'IN_GAME');
  const isHost = player?.id === room.hostPlayerId;

  // Plus de chrono ici : cet écran est le seul endroit où on explique le score,
  // il ne doit pas s'escamoter tout seul. C'est l'hôte qui enchaîne.
  async function handleNext() {
    try {
      await advanceRecap();
    } catch (err) {
      showError(err.code || 'INTERNAL_ERROR', err.message);
    }
  }

  return (
    <div className={styles.phase}>
      <RoundIndicator round={gameState.round} totalRounds={gameConfig.rounds.length} />
      <h2 className={styles.title}>Récap des points</h2>
      {scoreMultiplier !== 1 && (
        <p className={styles.multiplier}>Points de cette manche multipliés par {scoreMultiplier}</p>
      )}
      <ul className={styles.list}>
        {players.map((p) => {
          const scoreDelta = gameState.lastRoundScoreDeltas?.[p.id] ?? 0;
          const coinDelta = gameState.lastRoundCoinDeltas?.[p.id] ?? 0;
          const reasons = reasonsByPlayer[p.id] || [];
          return (
            <li key={p.id} className={`${styles.row} ${p.id === player?.id ? styles.self : ''}`}>
              <div className={styles.head}>
                <PlayerChip player={p} isHost={p.id === room.hostPlayerId} />
                <span className={styles.totals}>
                  <span className={styles.totalLabel}>Total</span>
                  <span className={styles.score}>{formatPoints(displayedScores[p.id] ?? 0)}</span>
                </span>
              </div>
              <ul className={styles.reasons}>
                {reasons.length === 0 ? (
                  <li className={styles.reason}>Aucun mot proposé</li>
                ) : (
                  reasons.map((reason, i) => (
                    <li key={i} className={styles.reason}>
                      {reasonText(reason)}
                    </li>
                  ))
                )}
              </ul>
              <span className={styles.delta}>
                Cette manche : {formatDelta(scoreDelta)} pts · {formatDelta(coinDelta)} pièces
              </span>
            </li>
          );
        })}
      </ul>

      {isHost ? (
        <Button onClick={handleNext}>Passer à la boutique</Button>
      ) : (
        <p className={styles.waitingNote}>En attente de l&apos;hôte…</p>
      )}
    </div>
  );
}
