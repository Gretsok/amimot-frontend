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
});
