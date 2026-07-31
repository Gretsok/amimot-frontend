import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ReadyCount from './ReadyCount';

describe('ReadyCount', () => {
  it('renders the ready/total count', () => {
    render(<ReadyCount ready={1} total={2} />);
    expect(screen.getByText('1 / 2 validé·e·s')).toBeInTheDocument();
  });

  it('renders nothing when there are no IN_GAME players to count (observer-only room)', () => {
    const { container } = render(<ReadyCount ready={0} total={0} />);
    expect(container).toBeEmptyDOMElement();
  });
});
