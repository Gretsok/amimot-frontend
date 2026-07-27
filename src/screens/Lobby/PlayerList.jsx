import PlayerChip from '../../components/ui/PlayerChip';
import styles from './PlayerList.module.css';

export default function PlayerList({ players, maxPlayers, isHost, ownPlayerId, onKick }) {
  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h2 className={styles.title}>Joueurs</h2>
        <span className={styles.count}>
          {players.length} / {maxPlayers}
        </span>
      </div>
      <div className={styles.list}>
        {players.map((p) => (
          <div key={p.id} className={styles.row}>
            <PlayerChip player={p} isHost={p.isHost} />
            {isHost && p.id !== ownPlayerId && (
              <button className={styles.kickButton} onClick={() => onKick(p.id)} aria-label={`Exclure ${p.displayName}`}>
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
