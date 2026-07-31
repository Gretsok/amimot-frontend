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
  // `connected` est absent pour les objets joueur ad hoc construits localement
  // (ex: résolution) plutôt que reçus tels quels du serveur — absent doit se
  // comporter comme "connecté", pas comme "déconnecté".
  const disconnected = player.connected === false;
  return (
    <div className={`${styles.chip} ${disconnected ? styles.disconnected : ''}`}>
      <div className={styles.avatar} style={{ background: colorForPlayer(player.id) }}>
        {initial}
      </div>
      <span className={styles.name}>
        {player.displayName}
        {isHost && <span className={styles.hostBadge}> HÔTE</span>}
        {disconnected && <span className={styles.offlineBadge}> Déconnecté</span>}
      </span>
    </div>
  );
}
