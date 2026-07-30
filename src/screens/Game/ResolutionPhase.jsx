import RoundIndicator from '../../components/game/RoundIndicator';
import ConstraintsList from '../../components/game/ConstraintsList';
import Button from '../../components/ui/Button';
import PlayerChip from '../../components/ui/PlayerChip';
import { useGamePhase } from '../../hooks/useGamePhase';
import { useErrorPopup } from '../../components/ErrorPopup/ErrorPopupContext';
import { describeWordOutcome } from '../../domain/describeResolutionWord';
import styles from './ResolutionPhase.module.css';

function reasonText(reason) {
  switch (reason.type) {
    case 'GROUP_MATCH':
      return `+${reason.points} (${reason.groupSize} joueurs ont dit ce mot)`;
    case 'TRAP_VICTIM':
      return `+${reason.points} (tombé dans le piège)`;
    case 'TRAP_SETTER':
      return `+${reason.points} (${reason.victimCount} joueur${reason.victimCount > 1 ? 's' : ''} piégé${reason.victimCount > 1 ? 's' : ''})`;
    case 'SELF_TRAP':
      return `${reason.points} (son propre piège !)`;
    default:
      return '';
  }
}

export default function ResolutionPhase({ gameConfig }) {
  const { room, player, gameState, advanceResolution } = useGamePhase();
  const { showError } = useErrorPopup();

  if (!gameState || !gameState.resolution || !room) return null;
  const isHost = player.id === room.hostPlayerId;
  const { revealedWordIndex, words, pacingMode } = gameState.resolution;

  const showingRecap = revealedWordIndex < 0;
  const currentWord = !showingRecap ? words[revealedWordIndex] : null;
  const outcome = currentWord ? describeWordOutcome(currentWord, gameConfig.scoring) : {};

  function playerName(id) {
    const p = room.players.find((pl) => pl.id === id);
    return p ? p.displayName : '?';
  }

  async function handleNext() {
    try {
      await advanceResolution('next');
    } catch (err) {
      showError(err.code || 'INTERNAL_ERROR', err.message);
    }
  }

  async function handleTogglePacing() {
    try {
      await advanceResolution('toggleAutoPacing');
    } catch (err) {
      showError(err.code || 'INTERNAL_ERROR', err.message);
    }
  }

  return (
    <div className={styles.phase}>
      <RoundIndicator round={gameState.round} totalRounds={gameConfig.rounds.length} />

      {showingRecap ? (
        <>
          <h2 className={styles.title}>Récap des contraintes</h2>
          <ConstraintsList constraints={gameState.constraints || []} letter={gameState.letter} word="" />
          {words.length === 0 && <p className={styles.note}>Personne n&apos;a proposé de mot cette manche.</p>}
        </>
      ) : (
        <div className={styles.reveal}>
          <h2 className={styles.word}>{currentWord.word}</h2>
          <div className={styles.players}>
            {currentWord.submitterIds.map((id) => (
              <div key={id} className={styles.playerOutcome}>
                <PlayerChip player={{ id, displayName: playerName(id) }} />
                {(outcome[id] || []).map((reason, i) => (
                  <span key={i} className={styles.reason}>
                    {reasonText(reason)}
                  </span>
                ))}
              </div>
            ))}
          </div>
          {currentWord.isTrap ? (
            <p className={styles.trapNote}>
              Mot-piège de {currentWord.trapSetterIds.map(playerName).join(', ')} !
            </p>
          ) : (
            <p className={styles.note}>Pas un mot-piège.</p>
          )}
          {currentWord.trapSetterIds
            .filter((id) => !currentWord.submitterIds.includes(id))
            .map((id) => (
              <div key={id} className={styles.playerOutcome}>
                <PlayerChip player={{ id, displayName: playerName(id) }} />
                {(outcome[id] || []).map((reason, i) => (
                  <span key={i} className={styles.reason}>
                    {reasonText(reason)}
                  </span>
                ))}
              </div>
            ))}
        </div>
      )}

      {isHost && words.length > 0 && (
        <div className={styles.hostControls}>
          <Button onClick={handleTogglePacing} variant="ghost">
            {pacingMode === 'auto' ? 'Passer en manuel' : 'Défilement automatique'}
          </Button>
          {pacingMode === 'manual' && (
            <Button onClick={handleNext} disabled={revealedWordIndex >= words.length - 1}>
              Mot suivant
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
