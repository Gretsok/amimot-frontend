import { useEffect, useState } from 'react';
import RoundIndicator from '../../components/game/RoundIndicator';
import PhaseTimer from '../../components/game/PhaseTimer';
import ConstraintCard from '../../components/game/ConstraintCard';
import ConstraintsList from '../../components/game/ConstraintsList';
import TextInput from '../../components/ui/TextInput';
import Button from '../../components/ui/Button';
import { useGamePhase } from '../../hooks/useGamePhase';
import { useErrorPopup } from '../../components/ErrorPopup/ErrorPopupContext';
import { precheckWord } from '../../domain/constraintPreCheck';
import styles from './PreparationPhase.module.css';

export default function PreparationPhase({ gameConfig }) {
  const { player, gameState, myGameState, submitTrapWord, validateTrapWord, playConstraintCard } = useGamePhase();
  const { showError } = useErrorPopup();
  const [draft, setDraft] = useState(myGameState?.trapWord || '');

  useEffect(() => {
    setDraft(myGameState?.trapWord || '');
  }, [myGameState?.trapWord]);

  if (!gameState || !player) return null;
  const isObserver = player.state === 'OBSERVER';
  const hand = myGameState?.hand || [];
  const ownConstraints = (gameState.constraints || []).filter((c) => c.ownerId === player.id);

  const precheck = precheckWord(draft, {
    letter: gameState.letter,
    constraints: ownConstraints,
    constantMinWordLength: gameConfig.constraints?.constantMinWordLength ?? 2,
  });

  async function handleChange(e) {
    const value = e.target.value;
    setDraft(value);
    try {
      await submitTrapWord(value);
    } catch (err) {
      showError(err.code || 'INTERNAL_ERROR', err.message);
    }
  }

  async function handleValidate() {
    try {
      await validateTrapWord();
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
      <h2 className={styles.letter}>Lettre : {gameState.letter}</h2>

      {isObserver ? (
        <p className={styles.observerNote}>Tu observes cette manche.</p>
      ) : (
        <>
          <p className={styles.instructions}>Propose un mot-piège pour attirer les autres joueurs.</p>
          <ConstraintsList constraints={ownConstraints} letter={gameState.letter} word={draft} />
          <TextInput
            value={draft}
            onChange={handleChange}
            placeholder="Ton mot-piège"
            disabled={myGameState?.trapWordValid}
          />
          <Button onClick={handleValidate} disabled={!precheck.valid || !draft || myGameState?.trapWordValid}>
            {myGameState?.trapWordValid ? 'Validé' : 'Valider'}
          </Button>

          {hand.length > 0 && (
            <div className={styles.hand}>
              {hand.map((card) => (
                <ConstraintCard
                  key={card.instanceId}
                  card={card}
                  activeConstraints={gameState.constraints || []}
                  onPlay={handlePlayCard}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
