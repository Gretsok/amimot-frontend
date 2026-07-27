import { useEffect, useState } from 'react';
import Timer from './Timer';
import CollectiveButton from './CollectiveButton';
import Button from '../../components/ui/Button';
import { useRoom } from '../../hooks/useRoom';
import { useGameState } from '../../hooks/useGameState';
import { useErrorPopup } from '../../components/ErrorPopup/ErrorPopupContext';
import { api } from '../../services/api';
import styles from './GameScreen.module.css';

export default function GameScreen() {
  const { room, player } = useRoom();
  const { gameState, clickButton, stopGame } = useGameState();
  const { showError } = useErrorPopup();
  const [defaultTimerSeconds, setDefaultTimerSeconds] = useState(60);

  useEffect(() => {
    api.gameDefaults().then((defaults) => setDefaultTimerSeconds(defaults.defaultTimerSeconds));
  }, []);

  if (!room || !player || !gameState) return null;

  const isHost = player.id === room.hostPlayerId;
  const isObserver = player.state === 'OBSERVER';
  const activePlayers = room.players.filter((p) => p.state === 'IN_GAME');
  const hasClicked = gameState.clickedPlayerIds.includes(player.id);

  async function handleClick() {
    try {
      await clickButton();
    } catch (err) {
      showError(err.code || 'INTERNAL_ERROR', err.message);
    }
  }

  async function handleStop() {
    try {
      await stopGame();
    } catch (err) {
      showError(err.code || 'INTERNAL_ERROR', err.message);
    }
  }

  return (
    <div className={styles.stage}>
      <Timer key={gameState.gameId} durationSeconds={defaultTimerSeconds} />

      {isObserver ? (
        <p className={styles.observerNote}>
          Tu observes cette partie déjà commencée — tu pourras jouer à la prochaine manche.
        </p>
      ) : (
        <CollectiveButton
          clickedCount={gameState.clickedPlayerIds.length}
          totalCount={activePlayers.length}
          hasClicked={hasClicked}
          onClick={handleClick}
        />
      )}

      {isHost && (
        <Button variant="ghost" onClick={handleStop} className={styles.stopButton}>
          Arrêter la partie
        </Button>
      )}
    </div>
  );
}
