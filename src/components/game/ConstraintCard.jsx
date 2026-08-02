import { useState } from 'react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import TextInput from '../ui/TextInput';
import { constraintLabel, CARD_TITLES, CARD_DESCRIPTIONS } from '../../domain/constraintLabels';
import styles from './ConstraintCard.module.css';

const NEEDS_LETTER = ['IMPOSE_LETTER', 'FORBID_LETTER'];
const NEEDS_NUMBER = ['MAX_LENGTH', 'MIN_LENGTH'];

// Représente une carte-contrainte de la main du joueur, avec son pop-up de
// paramétrage (lettre / nombre de lettres / contrainte cible à détruire)
// pour les cartes qui en ont besoin.
export default function ConstraintCard({
  card,
  activeConstraints = [],
  onPlay,
  disabled = false,
  // Pré-vérification optionnelle fournie par l'écran de phase (qui seul a le
  // mot-piège du joueur et la lettre de la manche) : permet d'expliquer un
  // refus AVANT le clic plutôt que de le découvrir via une erreur serveur.
  validatePlay = () => ({ valid: true }),
}) {
  const [open, setOpen] = useState(false);
  const [letterValue, setLetterValue] = useState('');
  const [numberValue, setNumberValue] = useState('');
  const [targetId, setTargetId] = useState('');

  const needsLetter = NEEDS_LETTER.includes(card.type);
  const needsNumber = NEEDS_NUMBER.includes(card.type);
  const needsTarget = card.type === 'DESTROY_CONSTRAINT';

  // Valeur telle qu'elle serait envoyée au serveur, pour pré-vérifier la pose.
  let pendingValue = null;
  if (needsLetter) pendingValue = letterValue.trim().toUpperCase().charAt(0) || null;
  else if (needsNumber) pendingValue = Number.isInteger(Number(numberValue)) && Number(numberValue) > 0 ? Number(numberValue) : null;
  else if (needsTarget) pendingValue = targetId || null;

  const precheck = pendingValue !== null || (!needsLetter && !needsNumber && !needsTarget)
    ? validatePlay(card.type, pendingValue)
    : { valid: true };

  function reset() {
    setLetterValue('');
    setNumberValue('');
    setTargetId('');
  }

  function confirm() {
    if (needsLetter) {
      const letter = letterValue.trim().toUpperCase().charAt(0);
      if (!letter) return;
      onPlay(card.instanceId, card.type, letter);
    } else if (needsNumber) {
      const n = Number(numberValue);
      if (!Number.isInteger(n) || n <= 0) return;
      onPlay(card.instanceId, card.type, n);
    } else if (needsTarget) {
      if (!targetId) return;
      onPlay(card.instanceId, card.type, targetId);
    } else {
      onPlay(card.instanceId, card.type, null);
    }
    setOpen(false);
    reset();
  }

  return (
    <div className={styles.card}>
      <p className={styles.title}>{CARD_TITLES[card.type] || card.type}</p>
      <Button
        variant="secondary"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className={styles.playButton}
      >
        Jouer
      </Button>

      <Modal open={open} onClose={() => setOpen(false)}>
        <h3 className={styles.modalTitle}>{CARD_TITLES[card.type] || card.type}</h3>
        {CARD_DESCRIPTIONS[card.type] && (
          <p className={styles.description}>{CARD_DESCRIPTIONS[card.type]}</p>
        )}

        {needsLetter && (
          <TextInput
            aria-label="Lettre"
            maxLength={1}
            value={letterValue}
            onChange={(e) => setLetterValue(e.target.value.toUpperCase())}
            placeholder="Lettre"
          />
        )}

        {needsNumber && (
          <TextInput
            aria-label="Nombre de lettres"
            type="number"
            min={1}
            value={numberValue}
            onChange={(e) => setNumberValue(e.target.value)}
            placeholder="Nombre de lettres"
          />
        )}

        {needsTarget && (
          <fieldset className={styles.targetFieldset}>
            <legend className={styles.targetLegend}>Contrainte à détruire</legend>
            <ul className={styles.targetList}>
              {activeConstraints.length === 0 && <li>Aucune contrainte active à détruire.</li>}
              {activeConstraints.map((constraint) => (
                <li key={constraint.id}>
                  <label>
                    <input
                      type="radio"
                      name="target-constraint"
                      checked={targetId === constraint.id}
                      onChange={() => setTargetId(constraint.id)}
                    />
                    {constraintLabel(constraint)}
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>
        )}

        {!precheck.valid && (
          <p className={styles.precheckWarning}>Cette carte invaliderait ton propre mot-piège.</p>
        )}

        <Button onClick={confirm} disabled={(needsTarget && !targetId) || !precheck.valid}>
          Confirmer
        </Button>
      </Modal>
    </div>
  );
}
