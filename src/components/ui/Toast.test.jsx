import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ToastStack from './Toast';

afterEach(() => {
  vi.useRealTimers();
});

describe('ToastStack', () => {
  it('renders nothing when there are no toasts', () => {
    const { container } = render(<ToastStack toasts={[]} duration={4000} onDismiss={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders each toast message in a polite live region', () => {
    render(
      <ToastStack
        toasts={[
          { id: 1, message: 'Première', shownAt: 0 },
          { id: 2, message: 'Deuxième', shownAt: 0 },
        ]}
        duration={4000}
        onDismiss={() => {}}
      />
    );
    expect(screen.getByText('Première')).toBeInTheDocument();
    expect(screen.getByText('Deuxième')).toBeInTheDocument();
    expect(document.querySelector('[aria-live="polite"]')).toBeInTheDocument();
  });

  it('dismisses on click', async () => {
    const onDismiss = vi.fn();
    render(<ToastStack toasts={[{ id: 7, message: 'Oups', shownAt: 0 }]} duration={4000} onDismiss={onDismiss} />);

    await userEvent.click(screen.getByText('Oups'));
    expect(onDismiss).toHaveBeenCalledWith(7);
  });

  it('auto-dismisses after the given duration', () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    render(<ToastStack toasts={[{ id: 3, message: 'Oups', shownAt: 0 }]} duration={4000} onDismiss={onDismiss} />);

    expect(onDismiss).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(4000));
    expect(onDismiss).toHaveBeenCalledWith(3);
  });
});
