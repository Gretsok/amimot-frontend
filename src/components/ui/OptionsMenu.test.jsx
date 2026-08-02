import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OptionsMenu from './OptionsMenu';

function renderMenu(onSelect = vi.fn()) {
  render(<OptionsMenu items={[{ label: 'Arrêter la partie', onSelect }]} />);
  return { onSelect, trigger: screen.getByRole('button', { name: 'Options de la partie' }) };
}

describe('OptionsMenu', () => {
  it('keeps its items hidden until the trigger is used', () => {
    renderMenu();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Arrêter la partie' })).not.toBeInTheDocument();
  });

  it('opens the menu and reflects the state on the trigger', async () => {
    const { trigger } = renderMenu();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('menuitem', { name: 'Arrêter la partie' })).toBeInTheDocument();
  });

  it('runs the item action and closes', async () => {
    const { onSelect, trigger } = renderMenu();
    await userEvent.click(trigger);
    await userEvent.click(screen.getByRole('menuitem', { name: 'Arrêter la partie' }));

    expect(onSelect).toHaveBeenCalled();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  // Un menu qu'on ne peut fermer qu'à la souris piège les utilisateurs clavier.
  it('closes on Escape and gives the focus back to the trigger', async () => {
    const { trigger } = renderMenu();
    await userEvent.click(trigger);
    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('closes when clicking outside', async () => {
    const { trigger } = renderMenu();
    await userEvent.click(trigger);
    await userEvent.click(document.body);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
