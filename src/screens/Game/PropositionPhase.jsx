import { useEffect, useState } from 'react';
import RoundIndicator from '../../components/game/RoundIndicator';
import PhaseTimer from '../../components/game/PhaseTimer';
import ReadyCount from '../../components/game/ReadyCount';
import ConstraintCard from '../../components/game/ConstraintCard';
import ConstraintsList from '../../components/game/ConstraintsList';
import TextInput from '../../components/ui/TextInput';
import Button from '../../components/ui/Button';
import { useGamePhase } from '../../hooks/useGamePhase';
import { useErrorPopup } from '../../components/ErrorPopup/ErrorPopupContext';
import { precheckWord } from '../../domain/constraintPreCheck';
import styles from './PropositionPhase.module.css';

export default function PropositionPhase({ gameConfig }) {
  const {
    room,
    player,
    gameState,
    myGameState,
    submitProposition,
    validateProposition,
    unvalidateProposition,
    playConstraintCard,
  } = useGamePhase();
  const { showError } = useErrorPopup();
  const [draft, setDraft] = useState(myGameState?.proposalWord || '');

  useEffect(() => {
    setDraft(myGameState?.proposalWord || '');
  }, [myGameState?.proposalWord]);

  if (!gameState || !player) return null;
  const isObserver = player.state === 'OBSERVER';
  const hand = myGameState?.hand || [];
  const constraints = gameState.constraints || [];

  const precheck = precheckWord(draft, {
    letter: gameState.letter,
    constraints,
    constantMinWordLength: gameConfig.constraints?.constantMinWordLength ?? 2,
  });

  async function handleChange(e) {
    const value = e.target.value;
    setDraft(value);
    try {
      await submitProposition(value);
    } catch (err) {
      showError(err.code || 'INTERNAL_ERROR', err.message);
    }
  }

  async function handleValidate() {
    try {
      await validateProposition();
    } catch (err) {
      showError(err.code || 'INTERNAL_ERROR', err.message);
    }
  }

  async function handleUnvalidate() {
    try {
      await unvalidateProposition();
    } catch (err) {
      showError(err.code || 'INTERNAL_ERROR', err.message);
    }
  }

  async function handlePlayCard(instanceId, type, value) {
    try {
      await playConstraintCard(instanceId, type, value);
    } catch (err) {
      showError(err.code || 'INTERNAL_ERROR', err.message);
    }
  }

  return (
    <div className={styles.phase}>
      <RoundIndicator round={gameState.round} totalRounds={gameConfig.rounds.length} />
      <PhaseTimer phaseEndsAt={gameState.phaseEndsAt} />
      <ReadyCount
        ready={gameState.readyPlayerIds?.length ?? 0}
        total={room.players.filter((p) => p.state === 'IN_GAME').length}
      />

      {isObserver ? (
        <p className={styles.observerNote}>Tu observes cette manche.</p>
      ) : (
        <>
          <p className={styles.instructions}>
            Propose un mot en respectant les contraintes, sans tomber dans un mot-piège.
          </p>
          <ConstraintsList constraints={constraints} letter={gameState.letter} word={draft} />
          <TextInput
            value={draft}
            onChange={handleChange}
            placeholder="Ta proposition"
            disabled={myGameState?.proposalValidated}
          />
          <Button onClick={handleValidate} disabled={!precheck.valid || !draft || myGameState?.proposalValidated}>
            {myGameState?.proposalValidated ? 'Validé' : 'Valider'}
          </Button>
          {myGameState?.proposalValidated && <Button onClick={handleUnvalidate}>Modifier</Button>}

          {hand.length > 0 && (
            <div className={styles.hand}>
              {hand.map((card) => (
                <ConstraintCard key={card.instanceId} card={card} activeConstraints={constraints} onPlay={handlePlayCard} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
