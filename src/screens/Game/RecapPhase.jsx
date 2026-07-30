import { useEffect, useState } from 'react';
import RoundIndicator from '../../components/game/RoundIndicator';
import PlayerChip from '../../components/ui/PlayerChip';
import { useGamePhase } from '../../hooks/useGamePhase';
import styles from './RecapPhase.module.css';

function formatDelta(value) {
  return value >= 0 ? `+${value}` : `${value}`;
}

export default function RecapPhase({ gameConfig }) {
  const { room, gameState } = useGamePhase();
  const [displayedScores, setDisplayedScores] = useState(gameState?.scoresBeforeLastRound || {});

  useEffect(() => {
    if (!gameState) return undefined;
    setDisplayedScores(gameState.scoresBeforeLastRound || {});
    const timeout = setTimeout(() => setDisplayedScores(gameState.scores || {}), 50);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.round]);

  if (!gameState || !room) return null;

  return (
    <div className={styles.phase}>
      <RoundIndicator round={gameState.round} totalRounds={gameConfig.rounds.length} />
      <h2 className={styles.title}>Récap des points</h2>
      <ul className={styles.list}>
        {room.players.map((p) => {
          const scoreDelta = gameState.lastRoundScoreDeltas?.[p.id] ?? 0;
          const coinDelta = gameState.lastRoundCoinDeltas?.[p.id] ?? 0;
          return (
            <li key={p.id} className={styles.row}>
              <PlayerChip player={p} isHost={p.id === room.hostPlayerId} />
              <span className={styles.score}>{displayedScores[p.id] ?? 0} pts</span>
              <span className={styles.delta}>
                {formatDelta(scoreDelta)} pts · {formatDelta(coinDelta)} pièces
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
