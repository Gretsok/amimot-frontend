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
import styles from './PreparationPhase.module.css';

export default function PreparationPhase({ gameConfig }) {
  const {
    room,
    player,
    gameState,
    myGameState,
    submitTrapWord,
    validateTrapWord,
    unvalidateTrapWord,
    playConstraintCard,
  } = useGamePhase();
  const { showError } = useErrorPopup();
  const [draft, setDraft] = useState(myGameState?.trapWord || '');

  useEffect(() => {
    setDraft(myGameState?.trapWord || '');
  }, [myGameState?.trapWord]);

  if (!gameState || !player) return null;
  const isObserver = player.state === 'OBSERVER';
  const hand = myGameState?.hand || [];
  const ownConstraints = (gameState.constraints || []).filter((c) => c.ownerId === player.id);

  const constantMinWordLength = gameConfig.constraints?.constantMinWordLength ?? 2;

  const precheck = precheckWord(draft, {
    letter: gameState.letter,
    constraints: ownConstraints,
    constantMinWordLength,
  });

  function validateCardPlay(type, value) {
    return precheckConstraintCard({
      type,
      value,
      activeConstraints: gameState.constraints || [],
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
      await submitTrapWord(value);
    } catch {
      // Synchro d'un brouillon en cours de frappe : un échec ici n'est pas
      // actionnable par le joueur (ConstraintsList montre déjà les
      // contraintes violées en direct, et la vraie validation se fait au
      // clic sur "Valider"). Le signaler à chaque touche ne ferait que
      // spammer — notamment sur RATE_LIMITED en cas de frappe rapide.
    }
  }

  async function handleValidate() {
    try {
      await validateTrapWord();
    } catch (err) {
      showError(err.code || 'INTERNAL_ERROR', err.message);
    }
  }

  async function handleUnvalidate() {
    try {
      await unvalidateTrapWord();
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
      <h2 className={styles.letter}>Lettre : {gameState.letter}</h2>

      {/* Le bandeau "tu observes cette partie" est déjà affiché une fois par
          GameScreen : pas de doublon ici. */}
      {isObserver ? null : (
        <>
          <p className={styles.instructions}>Propose un mot-piège pour attirer les autres joueurs.</p>
          <ConstraintsList
            constraints={ownConstraints}
            letter={gameState.letter}
            word={draft}
            constantMinWordLength={constantMinWordLength}
            players={room.players}
          />
          <TextInput
            value={draft}
            onChange={handleChange}
            placeholder="Ton mot-piège"
            disabled={myGameState?.trapWordValid}
          />
          {/* Une fois validé, "Validé" devient un STATUT (et non un bouton
              désactivé qui laissait "Modifier" comme CTA le plus voyant). */}
          {myGameState?.trapWordValid ? (
            <>
              <p className={styles.validatedStatus}>✓ Mot-piège validé</p>
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
                  activeConstraints={gameState.constraints || []}
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
