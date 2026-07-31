import Button from '../../components/ui/Button';
import RoomCodeBadge from './RoomCodeBadge';
import PlayerList from './PlayerList';
import GameSettingsPanel from './GameSettingsPanel';
import { useRoom } from '../../hooks/useRoom';
import { useErrorPopup } from '../../components/ErrorPopup/ErrorPopupContext';
import styles from './LobbyScreen.module.css';

export default function LobbyScreen() {
  const { room, player, leaveRoom, kickPlayer, updateSettings, startGame } = useRoom();
  const { showError } = useErrorPopup();

  if (!room || !player) return null;
  const isHost = player.id === room.hostPlayerId;

  async function safeguard(action) {
    try {
      await action();
    } catch (err) {
      showError(err.code || 'INTERNAL_ERROR', err.message);
    }
  }

  return (
    <div className={styles.stage}>
      <div className={styles.blob} />

      <div className={styles.content}>
        <div className={styles.topRow}>
          <h1 className={styles.title}>Salle d'attente</h1>
          <RoomCodeBadge inviteCode={room.inviteCode} />
        </div>

        <PlayerList
          players={room.players}
          maxPlayers={room.settings.maxPlayers}
          isHost={isHost}
          ownPlayerId={player.id}
          onKick={(targetId) => safeguard(() => kickPlayer(targetId))}
        />

        <div className={styles.settingsRow}>
          <GameSettingsPanel
            settings={room.settings}
            isHost={isHost}
            onUpdateSettings={(settings) => safeguard(() => updateSettings(settings))}
          />
        </div>

        <div className={styles.footer}>
          <Button variant="ghost" onClick={() => safeguard(leaveRoom)}>
            Quitter
          </Button>
          {isHost && (
            <Button onClick={() => safeguard(startGame)} className={styles.startButton}>
              C'est parti !
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
