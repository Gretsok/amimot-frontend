import { useEffect, useState } from 'react';
import Button from '../../components/ui/Button';
import PreparationPhase from './PreparationPhase';
import PropositionPhase from './PropositionPhase';
import ResolutionPhase from './ResolutionPhase';
import RecapPhase from './RecapPhase';
import ShopPhase from './ShopPhase';
import EndGameRanking from './EndGameRanking';
import { useRoom } from '../../hooks/useRoom';
import { useGameState } from '../../hooks/useGameState';
import { useErrorPopup } from '../../components/ErrorPopup/ErrorPopupContext';
import { api } from '../../services/api';
import styles from './GameScreen.module.css';

const PHASE_COMPONENTS = {
  PREPARATION: PreparationPhase,
  PROPOSITION: PropositionPhase,
  RESOLUTION: ResolutionPhase,
  RECAP: RecapPhase,
  SHOP: ShopPhase,
};

export default function GameScreen() {
  const { room, player } = useRoom();
  const { gameState, stopGame } = useGameState();
  const { showError } = useErrorPopup();
  const [gameConfig, setGameConfig] = useState(null);

  useEffect(() => {
    api.gameDefaults().then(setGameConfig).catch(() => {});
  }, []);

  if (!room || !player || !gameState || !gameConfig) return null;

  const isHost = player.id === room.hostPlayerId;
  const isObserver = player.state === 'OBSERVER';
  const isEnded = gameState.phase === 'ENDED';
  const PhaseComponent = PHASE_COMPONENTS[gameState.phase];

  async function handleStop() {
    try {
      await stopGame();
    } catch (err) {
      showError(err.code || 'INTERNAL_ERROR', err.message);
    }
  }

  return (
    <div className={styles.stage}>
      {isEnded ? (
        <EndGameRanking />
      ) : (
        <>
          {isObserver && (
            <p className={styles.observerNote}>
              Tu observes cette partie déjà commencée — tu pourras jouer à la prochaine manche.
            </p>
          )}
          {PhaseComponent && <PhaseComponent gameConfig={gameConfig} />}
          {isHost && (
            <Button variant="ghost" onClick={handleStop} className={styles.stopButton}>
              Arrêter la partie
            </Button>
          )}
        </>
      )}
    </div>
  );
}
