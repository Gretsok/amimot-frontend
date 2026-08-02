import Button from '../../components/ui/Button';
import PlayerChip from '../../components/ui/PlayerChip';
import { useGamePhase } from '../../hooks/useGamePhase';
import { useErrorPopup } from '../../components/ErrorPopup/ErrorPopupContext';
import { formatPoints } from '../../domain/formatScore';
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
          <li key={p.id} className={`${styles.row} ${p.id === player.id ? styles.self : ''}`}>
            <span className={styles.rank}>{p.rank}</span>
            <PlayerChip player={p} isHost={p.id === room.hostPlayerId} />
            <span className={styles.score}>{formatPoints(p.score)}</span>
          </li>
        ))}
      </ol>
      {isHost ? (
        <Button onClick={handleReturn} className={styles.returnButton}>
          Retour au lobby
        </Button>
      ) : (
        // Sans ça, le non-hôte reste devant un classement figé sans savoir
        // qu'il attend une action de l'hôte. Rendu en <p> : les tests
        // indexent les <li> du classement.
        <p className={styles.waitingNote}>En attente de l&apos;hôte pour revenir à la salle d&apos;attente…</p>
      )}
    </div>
  );
}
