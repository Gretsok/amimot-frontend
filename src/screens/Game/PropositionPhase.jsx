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
import { precheckWord, precheckConstraintCard } from '../../domain/constraintPreCheck';
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

  const constantMinWordLength = gameConfig.constraints?.constantMinWordLength ?? 2;

  const precheck = precheckWord(draft, {
    letter: gameState.letter,
    constraints,
    constantMinWordLength,
  });

  // Le mot-piège reste celui posé en préparation : poser une carte pendant la
  // proposition peut encore l'invalider, exactement comme côté serveur.
  function validateCardPlay(type, value) {
    return precheckConstraintCard({
      type,
      value,
      activeConstraints: constraints,
      ownerId: player.id,
      trapWord: myGameState?.trapWord,
      letter: gameState.letter,
      constantMinWordLength,
    });
  }

  async function handleChange(e) {
    const value = e.target.value;
    setDraft(value);
    try {
      await submitProposition(value);
    } catch {
      // Idem PreparationPhase : synchro de brouillon en cours de frappe, non
      // actionnable par le joueur — la vraie validation se fait au clic sur
      // "Valider".
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

      {/* Doublon du bandeau observateur de GameScreen : supprimé. */}
      {isObserver ? null : (
        <>
          <p className={styles.instructions}>
            Propose un mot en respectant les contraintes, sans tomber dans un mot-piège.
          </p>
          <ConstraintsList
            constraints={constraints}
            letter={gameState.letter}
            word={draft}
            constantMinWordLength={constantMinWordLength}
            players={room.players}
          />
          <TextInput
            value={draft}
            onChange={handleChange}
            placeholder="Ta proposition"
            disabled={myGameState?.proposalValidated}
          />
          {myGameState?.proposalValidated ? (
            <>
              <p className={styles.validatedStatus}>✓ Proposition validée</p>
              <Button variant="ghost" onClick={handleUnvalidate}>
                Modifier
              </Button>
            </>
          ) : (
            <Button onClick={handleValidate} disabled={!precheck.valid || !draft}>
              Valider
            </Button>
          )}

          {hand.length > 0 && (
            <div className={styles.hand}>
              {hand.map((card) => (
                <ConstraintCard
                  key={card.instanceId}
                  card={card}
                  activeConstraints={constraints}
                  onPlay={handlePlayCard}
                  validatePlay={validateCardPlay}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
