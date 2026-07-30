import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePhaseCountdown } from './usePhaseCountdown';

describe('usePhaseCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('computes the remaining time from an absolute deadline', () => {
    const phaseEndsAt = Date.now() + 15000;
    const { result } = renderHook(() => usePhaseCountdown(phaseEndsAt));
    expect(result.current.remainingSeconds).toBe(15);
  });

  it('ticks down as time passes', () => {
    const phaseEndsAt = Date.now() + 10000;
    const { result } = renderHook(() => usePhaseCountdown(phaseEndsAt));

    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(result.current.remainingSeconds).toBe(6);
  });

  it('never goes below 0 once the deadline has passed', () => {
    const phaseEndsAt = Date.now() + 1000;
    const { result } = renderHook(() => usePhaseCountdown(phaseEndsAt));

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current.remainingMs).toBe(0);
    expect(result.current.remainingSeconds).toBe(0);
  });

  it('resyncs immediately when phaseEndsAt changes (new phase entered)', () => {
    const { result, rerender } = renderHook(({ endsAt }) => usePhaseCountdown(endsAt), {
      initialProps: { endsAt: Date.now() + 1000 },
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.remainingSeconds).toBe(0);

    rerender({ endsAt: Date.now() + 45000 });
    expect(result.current.remainingSeconds).toBe(45);
  });

  it('returns 0 remaining when phaseEndsAt is null (no active timer, e.g. RESOLUTION)', () => {
    const { result } = renderHook(() => usePhaseCountdown(null));
    expect(result.current.remainingMs).toBe(0);
  });
});
