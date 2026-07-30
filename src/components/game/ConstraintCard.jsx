import { useState } from 'react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import TextInput from '../ui/TextInput';
import { constraintLabel, CARD_TITLES } from '../../domain/constraintLabels';
import styles from './ConstraintCard.module.css';

const NEEDS_LETTER = ['IMPOSE_LETTER', 'FORBID_LETTER'];
const NEEDS_NUMBER = ['MAX_LENGTH', 'MIN_LENGTH'];

// Représente une carte-contrainte de la main du joueur, avec son pop-up de
// paramétrage (lettre / nombre de lettres / contrainte cible à détruire)
// pour les cartes qui en ont besoin.
export default function ConstraintCard({ card, activeConstraints = [], onPlay, disabled = false }) {
  const [open, setOpen] = useState(false);
  const [letterValue, setLetterValue] = useState('');
  const [numberValue, setNumberValue] = useState('');
  const [targetId, setTargetId] = useState('');

  const needsLetter = NEEDS_LETTER.includes(card.type);
  const needsNumber = NEEDS_NUMBER.includes(card.type);
  const needsTarget = card.type === 'DESTROY_CONSTRAINT';

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
        )}

        <Button onClick={confirm}>Confirmer</Button>
      </Modal>
    </div>
  );
}
