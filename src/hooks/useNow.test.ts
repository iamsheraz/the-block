import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { __clockInternals, useNow } from './useNow';

describe('useNow', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the current time on first render', () => {
    const t = Date.UTC(2030, 0, 15, 12, 0, 0);
    vi.setSystemTime(t);
    __clockInternals.setNow(t);

    const { result } = renderHook(() => useNow());
    expect(result.current).toBe(t);
  });

  it('re-renders subscribers when the clock advances', () => {
    const t0 = Date.UTC(2030, 0, 15, 12, 0, 0);
    vi.setSystemTime(t0);
    __clockInternals.setNow(t0);

    const { result } = renderHook(() => useNow());
    expect(result.current).toBe(t0);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current).toBe(t0 + 1000);
  });

  it('test seam updates subscribed consumers directly', () => {
    const t0 = Date.UTC(2030, 0, 15, 12, 0, 0);
    __clockInternals.setNow(t0);
    const { result } = renderHook(() => useNow());

    act(() => {
      __clockInternals.setNow(t0 + 60_000);
    });

    expect(result.current).toBe(t0 + 60_000);
  });
});
