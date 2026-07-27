import styles from './PlayerChip.module.css';

const AVATAR_COLORS = ['#ff8c42', '#3eeba8', '#ff4d8d', '#ffc94d', '#8c6fe8'];

function colorForPlayer(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) % AVATAR_COLORS.length;
  }
  return AVATAR_COLORS[hash];
}

export default function PlayerChip({ player, isHost = false }) {
  const initial = (player.displayName || '?').trim().charAt(0).toUpperCase();
  return (
    <div className={styles.chip}>
      <div className={styles.avatar} style={{ background: colorForPlayer(player.id) }}>
        {initial}
      </div>
      <span className={styles.name}>
        {player.displayName}
        {isHost && <span className={styles.hostBadge}> HÔTE</span>}
      </span>
    </div>
  );
}
