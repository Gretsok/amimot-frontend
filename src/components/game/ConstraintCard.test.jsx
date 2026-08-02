import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConstraintCard from './ConstraintCard';

describe('ConstraintCard', () => {
  it('plays an IMPOSE_LETTER card with the chosen letter', async () => {
    const onPlay = vi.fn();
    render(<ConstraintCard card={{ instanceId: 'c1', type: 'IMPOSE_LETTER' }} onPlay={onPlay} />);

    await userEvent.click(screen.getByRole('button', { name: 'Jouer' }));
    await userEvent.type(screen.getByPlaceholderText('Lettre'), 'b');
    await userEvent.click(screen.getByRole('button', { name: 'Confirmer' }));

    expect(onPlay).toHaveBeenCalledWith('c1', 'IMPOSE_LETTER', 'B');
  });

  it('plays a MAX_LENGTH card with the chosen number', async () => {
    const onPlay = vi.fn();
    render(<ConstraintCard card={{ instanceId: 'c2', type: 'MAX_LENGTH' }} onPlay={onPlay} />);

    await userEvent.click(screen.getByRole('button', { name: 'Jouer' }));
    await userEvent.type(screen.getByPlaceholderText('Nombre de lettres'), '5');
    await userEvent.click(screen.getByRole('button', { name: 'Confirmer' }));

    expect(onPlay).toHaveBeenCalledWith('c2', 'MAX_LENGTH', 5);
  });

  it('does not call onPlay if no letter was entered', async () => {
    const onPlay = vi.fn();
    render(<ConstraintCard card={{ instanceId: 'c1', type: 'IMPOSE_LETTER' }} onPlay={onPlay} />);

    await userEvent.click(screen.getByRole('button', { name: 'Jouer' }));
    await userEvent.click(screen.getByRole('button', { name: 'Confirmer' }));

    expect(onPlay).not.toHaveBeenCalled();
  });

  it('plays a DESTROY_CONSTRAINT card with the selected target', async () => {
    const onPlay = vi.fn();
    render(
      <ConstraintCard
        card={{ instanceId: 'c3', type: 'DESTROY_CONSTRAINT' }}
        activeConstraints={[{ id: 'target-1', type: 'MAX_LENGTH', value: 5 }]}
        onPlay={onPlay}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Jouer' }));
    await userEvent.click(screen.getByRole('radio'));
    await userEvent.click(screen.getByRole('button', { name: 'Confirmer' }));

    expect(onPlay).toHaveBeenCalledWith('c3', 'DESTROY_CONSTRAINT', 'target-1');
  });

  it('disables the "Jouer" button when disabled is true', () => {
    render(<ConstraintCard card={{ instanceId: 'c1', type: 'IMPOSE_LETTER' }} onPlay={() => {}} disabled />);
    expect(screen.getByRole('button', { name: 'Jouer' })).toBeDisabled();
  });

  it('disables "Confirmer" for a DESTROY_CONSTRAINT card until a target is selected', async () => {
    const onPlay = vi.fn();
    render(
      <ConstraintCard
        card={{ instanceId: 'c3', type: 'DESTROY_CONSTRAINT' }}
        activeConstraints={[{ id: 'target-1', type: 'MAX_LENGTH', value: 5 }]}
        onPlay={onPlay}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Jouer' }));
    expect(screen.getByRole('button', { name: 'Confirmer' })).toBeDisabled();

    await userEvent.click(screen.getByRole('radio'));
    expect(screen.getByRole('button', { name: 'Confirmer' })).not.toBeDisabled();
  });

  // Le refus est expliqué AVANT le clic plutôt que découvert via une erreur
  // serveur (qui, elle, éjectait le joueur de sa partie avant correction).
  it('disables "Confirmer" with an explanation when the play would self-invalidate', async () => {
    const onPlay = vi.fn();
    render(
      <ConstraintCard
        card={{ instanceId: 'c1', type: 'FORBID_LETTER' }}
        onPlay={onPlay}
        validatePlay={() => ({ valid: false, reason: 'SELF_INVALIDATING_CARD' })}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Jouer' }));
    await userEvent.type(screen.getByPlaceholderText('Lettre'), 'h');

    expect(screen.getByText('Cette carte invaliderait ton propre mot-piège.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirmer' })).toBeDisabled();
    expect(onPlay).not.toHaveBeenCalled();
  });

  it('stays playable when validatePlay accepts the value', async () => {
    const onPlay = vi.fn();
    render(
      <ConstraintCard
        card={{ instanceId: 'c1', type: 'FORBID_LETTER' }}
        onPlay={onPlay}
        validatePlay={() => ({ valid: true })}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Jouer' }));
    await userEvent.type(screen.getByPlaceholderText('Lettre'), 'z');
    await userEvent.click(screen.getByRole('button', { name: 'Confirmer' }));

    expect(onPlay).toHaveBeenCalledWith('c1', 'FORBID_LETTER', 'Z');
  });

  it('groups the target-constraint radios in a labeled fieldset', async () => {
    render(
      <ConstraintCard
        card={{ instanceId: 'c3', type: 'DESTROY_CONSTRAINT' }}
        activeConstraints={[{ id: 'target-1', type: 'MAX_LENGTH', value: 5 }]}
        onPlay={() => {}}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: 'Jouer' }));
    expect(screen.getByRole('group', { name: 'Contrainte à détruire' })).toBeInTheDocument();
  });
});
