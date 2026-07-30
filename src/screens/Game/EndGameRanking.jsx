import Button from '../../components/ui/Button';
import PlayerChip from '../../components/ui/PlayerChip';
import { useGamePhase } from '../../hooks/useGamePhase';
import { useErrorPopup } from '../../components/ErrorPopup/ErrorPopupContext';
import styles from './EndGameRanking.module.css';

// Classement "à la sportive" : les égalités partagent le même rang (ex: deux
// joueurs à 8 points sont tous les deux 1ers, le suivant est 3e) — affichage
// simple, aucun critère de départage artificiel (cahier des charges).
function rankPlayers(players, scores) {
  const sorted = [...players]
    .map((p) => ({ ...p, score: scores?.[p.id] ?? 0 }))
    .sort((a, b) => b.score - a.score);

  let rank = 0;
  let previousScore = null;
  return sorted.map((p, index) => {
    if (p.score !== previousScore) rank = index + 1;
    previousScore = p.score;
    return { ...p, rank };
  });
}

export default function EndGameRanking() {
  const { room, player, gameState, returnToLobby } = useGamePhase();
  const { showError } = useErrorPopup();

  if (!room || !gameState || !player) return null;
  const isHost = player.id === room.hostPlayerId;
  const ranking = rankPlayers(room.players, gameState.scores);

  async function handleReturn() {
    try {
      await returnToLobby();
    } catch (err) {
      showError(err.code || 'INTERNAL_ERROR', err.message);
    }
  }

  return (
    <div className={styles.stage}>
      <h1 className={styles.title}>Classement final</h1>
      <ol className={styles.list}>
        {ranking.map((p) => (
          <li key={p.id} className={styles.row}>
            <span className={styles.rank}>{p.rank}</span>
            <PlayerChip player={p} isHost={p.id === room.hostPlayerId} />
            <span className={styles.score}>{p.score} pts</span>
          </li>
        ))}
      </ol>
      {isHost && (
        <Button onClick={handleReturn} className={styles.returnButton}>
          Retour au lobby
        </Button>
      )}
    </div>
  );
}
