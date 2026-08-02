import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ConstraintsList from './ConstraintsList';
import styles from './ConstraintsList.module.css';

describe('ConstraintsList', () => {
  it('highlights the round-letter constraint as violated when the word does not start with it', () => {
    render(<ConstraintsList constraints={[]} letter="C" word="loup" />);
    expect(screen.getByText(/Commence par/)).toHaveClass(styles.violated);
  });

  it('does not highlight the round-letter constraint when satisfied', () => {
    render(<ConstraintsList constraints={[]} letter="C" word="chat" />);
    expect(screen.getByText(/Commence par/)).not.toHaveClass(styles.violated);
  });

  it('highlights a card constraint that the current word violates', () => {
    render(
      <ConstraintsList
        constraints={[{ id: 'c1', type: 'FORBID_LETTER', value: 'H' }]}
        letter="C"
        word="chat"
      />
    );
    expect(screen.getByText(/Sans la lettre/)).toHaveClass(styles.violated);
  });

  it('shows an empty-state message when there is no round letter and no constraints', () => {
    render(<ConstraintsList constraints={[]} word="" />);
    expect(screen.getByText(/Aucune contrainte/)).toBeInTheDocument();
  });

  it('does not mark anything as violated when no word is being typed (e.g. the resolution recap)', () => {
    render(
      <ConstraintsList
        constraints={[{ id: 'c1', type: 'FORBID_LETTER', value: 'H' }]}
        letter="C"
        word=""
      />
    );
    expect(screen.getByText(/Commence par/)).not.toHaveClass(styles.violated);
    expect(screen.getByText(/Sans la lettre/)).not.toHaveClass(styles.violated);
  });

  // Cette règle bloquait la validation sans jamais être affichée : le joueur
  // se retrouvait devant un bouton grisé sans explication.
  it('displays the constant minimum-length rule and flags it when unmet', () => {
    const { rerender } = render(<ConstraintsList constraints={[]} letter="C" word="c" constantMinWordLength={2} />);
    expect(screen.getByText(/Au moins 2 lettres/)).toHaveClass(styles.violated);

    rerender(<ConstraintsList constraints={[]} letter="C" word="chat" constantMinWordLength={2} />);
    expect(screen.getByText(/Au moins 2 lettres/)).not.toHaveClass(styles.violated);
  });

  it('omits the minimum-length chip where it does not apply (resolution recap)', () => {
    render(<ConstraintsList constraints={[]} letter="C" word="" />);
    expect(screen.queryByText(/Au moins/)).not.toBeInTheDocument();
  });

  it('attributes each constraint to the player who played it', () => {
    render(
      <ConstraintsList
        constraints={[{ id: 'c1', type: 'FORBID_LETTER', value: 'H', ownerId: 'p2' }]}
        letter="C"
        word=""
        players={[
          { id: 'p1', displayName: 'Léa' },
          { id: 'p2', displayName: 'Marc' },
        ]}
      />
    );
    expect(screen.getByText(/Marc/)).toBeInTheDocument();
  });

  // La couleur seule ne se lit pas comme une erreur (et exclut les daltoniens).
  it('marks a violated constraint with a non-colour indicator', () => {
    render(<ConstraintsList constraints={[]} letter="C" word="loup" />);
    expect(screen.getByText(/Commence par/).textContent).toContain('✕');
  });
});
