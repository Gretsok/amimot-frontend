import RoundIndicator from '../../components/game/RoundIndicator';
import ConstraintsList from '../../components/game/ConstraintsList';
import Button from '../../components/ui/Button';
import PlayerChip from '../../components/ui/PlayerChip';
import { useGamePhase } from '../../hooks/useGamePhase';
import { useErrorPopup } from '../../components/ErrorPopup/ErrorPopupContext';
import { describeWordOutcome, reasonText } from '../../domain/describeResolutionWord';
import styles from './ResolutionPhase.module.css';

export default function ResolutionPhase({ gameConfig }) {
  const { room, player, gameState, advanceResolution } = useGamePhase();
  const { showError } = useErrorPopup();

  if (!gameState || !gameState.resolution || !room) return null;
  const isHost = player.id === room.hostPlayerId;
  const { revealedWordIndex, words, pacingMode } = gameState.resolution;

  const showingRecap = revealedWordIndex < 0;
  // L'index peut valoir words.length le temps d'un aller-retour serveur (ce
  // cran est ce qui termine la phase) : on reste sur le dernier mot plutôt que
  // de rendre un écran vide.
  const currentWord = !showingRecap ? words[Math.min(revealedWordIndex, words.length - 1)] : null;
  const outcome = currentWord ? describeWordOutcome(currentWord, gameConfig.scoring) : {};
  const isLastWord = revealedWordIndex >= words.length - 1;

  function playerName(id) {
    const p = room.players.find((pl) => pl.id === id);
    return p ? p.displayName : '?';
  }

  // Reprend le joueur complet (avec son statut de connexion) plutôt qu'un
  // objet ad hoc { id, displayName } : sans ça, PlayerChip afficherait
  // toujours "connecté" ici, quel que soit l'état réel du joueur.
  function findPlayer(id) {
    return room.players.find((pl) => pl.id === id) || { id, displayName: playerName(id) };
  }

  async function run(action) {
    try {
      await advanceResolution(action);
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

          {/* Les deux rythmes sont présentés comme UN choix (même bloc, même
              libellé d'intro) : séparés, on lisait "défilement automatique" et
              "mot suivant" comme deux actions sans rapport, sans comprendre que
              l'une ou l'autre lance la révélation. */}
          {isHost && words.length > 0 && (
            <div className={styles.startChoice}>
              <p className={styles.startLabel}>
                Lancer la révélation des {words.length} mot{words.length > 1 ? 's' : ''} :
              </p>
              <div className={styles.startOptions}>
                <Button onClick={() => run('startManual')}>Défilement manuel</Button>
                <Button variant="secondary" onClick={() => run('startAuto')}>
                  Défilement automatique
                </Button>
              </div>
              <p className={styles.startHint}>
                Manuel : tu passes au mot suivant toi-même. Automatique : les mots défilent seuls.
              </p>
            </div>
          )}
          {!isHost && words.length > 0 && (
            <p className={styles.waitingNote}>C&apos;est l&apos;hôte qui lance la révélation.</p>
          )}
        </>
      ) : (
        <div className={styles.reveal}>
          <p className={styles.progress}>
            Mot {revealedWordIndex + 1} sur {words.length}
          </p>
          <h2 className={styles.word}>{currentWord.word}</h2>
          <div className={styles.players}>
            {currentWord.submitterIds.map((id) => (
              <div key={id} className={styles.playerOutcome}>
                <PlayerChip player={findPlayer(id)} />
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
                <PlayerChip player={findPlayer(id)} />
                {(outcome[id] || []).map((reason, i) => (
                  <span key={i} className={styles.reason}>
                    {reasonText(reason)}
                  </span>
                ))}
              </div>
            ))}
        </div>
      )}

      {/* Un SEUL contrôle pendant la révélation : sur le dernier mot, "Mot
          suivant" devient l'action qui clôt la phase — il n'est jamais désactivé,
          c'est ce clic qui fait passer au récap des points. */}
      {!showingRecap && isHost && pacingMode === 'manual' && (
        <div className={styles.hostControls}>
          <Button onClick={() => run('next')}>{isLastWord ? 'Voir les points' : 'Mot suivant'}</Button>
        </div>
      )}
      {!showingRecap && isHost && pacingMode === 'auto' && (
        <div className={styles.hostControls}>
          <Button variant="ghost" onClick={() => run('startManual')}>
            Reprendre la main
          </Button>
        </div>
      )}

      {/* Sans ça, un non-hôte reste devant un écran figé sans savoir qui le
          fait avancer ni combien de temps ça dure (cette phase n'a pas de
          chrono serveur). */}
      {!showingRecap && !isHost && (
        <p className={styles.waitingNote}>
          {pacingMode === 'auto' ? 'Les mots défilent automatiquement.' : "C'est l'hôte qui fait défiler."}
        </p>
      )}
    </div>
  );
}
