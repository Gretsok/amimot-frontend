import { useEffect, useState } from 'react';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import OptionsMenu from '../../components/ui/OptionsMenu';
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
  const [confirmingStop, setConfirmingStop] = useState(false);

  useEffect(() => {
    api.gameDefaults().then(setGameConfig).catch(() => {});
  }, []);

  if (!room || !player || !gameState || !gameConfig) return null;

  const isHost = player.id === room.hostPlayerId;
  const isObserver = player.state === 'OBSERVER';
  const isEnded = gameState.phase === 'ENDED';
  const PhaseComponent = PHASE_COMPONENTS[gameState.phase];

  async function handleStop() {
    setConfirmingStop(false);
    try {
      await stopGame();
    } catch (err) {
      showError(err.code || 'INTERNAL_ERROR', err.message);
    }
  }

  return (
    <div className={styles.stage}>
      {isEnded ? (
        <div className={styles.content}>
          <EndGameRanking />
        </div>
      ) : (
        <>
          {/* Hors du flux vertical : chaque phase a UN bouton qui compte, et
              "Arrêter la partie" ne doit pas lui faire concurrence. */}
          {isHost && (
            <div className={styles.options}>
              <OptionsMenu items={[{ label: 'Arrêter la partie', onSelect: () => setConfirmingStop(true) }]} />
            </div>
          )}
          {isObserver && (
            <p className={styles.observerNote}>
              Tu observes cette partie déjà commencée — tu pourras jouer à la prochaine manche.
            </p>
          )}
          {PhaseComponent && (
            <div className={styles.content}>
              <PhaseComponent gameConfig={gameConfig} />
            </div>
          )}
        </>
      )}

      {/* L'arrêt coupe la partie de TOUS les joueurs : on confirme, comme
          pour la suppression de compte. */}
      <Modal open={confirmingStop} onClose={() => setConfirmingStop(false)}>
        <h2 className={styles.confirmTitle}>Arrêter la partie ?</h2>
        <p className={styles.confirmText}>
          La partie prendra fin pour tout le monde et vous reviendrez à la salle d&apos;attente.
        </p>
        <div className={styles.confirmActions}>
          <Button variant="ghost" onClick={() => setConfirmingStop(false)}>
            Continuer à jouer
          </Button>
          <Button variant="secondary" onClick={handleStop}>
            Arrêter la partie
          </Button>
        </div>
      </Modal>
    </div>
  );
}
