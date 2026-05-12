import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, useLocation } from 'react-router';
import { describe, expect, it } from 'vitest';
import { DEFAULT_FILTERS } from '../lib/filters';
import { useFilters } from './useFilters';

function wrapper(initial: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <MemoryRouter initialEntries={[initial]}>{children}</MemoryRouter>;
  };
}

function harness() {
  const bundle = useFilters();
  const location = useLocation();
  return { bundle, location };
}

describe('useFilters', () => {
  it('reads defaults from an empty URL', () => {
    const { result } = renderHook(() => useFilters(), { wrapper: wrapper('/') });
    expect(result.current.filters).toEqual(DEFAULT_FILTERS);
  });

  it('parses search, makes, body styles, price range, and sort from URL', () => {
    const { result } = renderHook(() => useFilters(), {
      wrapper: wrapper(
        '/?q=civic&make=Honda%2CFord&body=SUV&pmin=5000&pmax=20000&sort=price-low-high',
      ),
    });
    expect(result.current.filters).toEqual({
      search: 'civic',
      makes: ['Honda', 'Ford'],
      bodyStyles: ['SUV'],
      priceMin: 5000,
      priceMax: 20000,
      sort: 'price-low-high',
    });
  });

  it('writes search into URL on setSearch', () => {
    const { result } = renderHook(harness, { wrapper: wrapper('/') });

    act(() => {
      result.current.bundle.setSearch('Honda');
    });

    expect(result.current.location.search).toBe('?q=Honda');
    expect(result.current.bundle.filters.search).toBe('Honda');
  });

  it('writes a multi-select make list into URL', () => {
    const { result } = renderHook(harness, { wrapper: wrapper('/') });

    act(() => {
      result.current.bundle.setMakes(['Honda', 'Ford']);
    });
    expect(result.current.location.search).toBe('?make=Honda%2CFord');
  });

  it('drops empty arrays and nulls from the URL', () => {
    const { result } = renderHook(harness, {
      wrapper: wrapper('/?make=Honda&pmin=1000'),
    });

    // React Router's setSearchParams collapses multiple calls in the same tick
    // — split the updates across separate acts so each lands on the latest URL.
    act(() => {
      result.current.bundle.setMakes([]);
    });
    act(() => {
      result.current.bundle.setPriceMin(null);
    });
    expect(result.current.location.search).toBe('');
  });

  it('clears every filter param via clear()', () => {
    const { result } = renderHook(harness, {
      wrapper: wrapper('/?q=foo&make=Honda&body=Sedan&pmin=1000&pmax=2000&sort=price-low-high'),
    });

    act(() => {
      result.current.bundle.clear();
    });
    expect(result.current.location.search).toBe('');
    expect(result.current.bundle.filters).toEqual(DEFAULT_FILTERS);
  });

  it('exposes hasActiveFilters when any field departs from defaults', () => {
    const { result: empty } = renderHook(() => useFilters(), { wrapper: wrapper('/') });
    expect(empty.current.hasActiveFilters).toBe(false);

    const { result: active } = renderHook(() => useFilters(), {
      wrapper: wrapper('/?make=Honda'),
    });
    expect(active.current.hasActiveFilters).toBe(true);
  });

  it('treats a non-default sort as an active filter', () => {
    const { result } = renderHook(() => useFilters(), {
      wrapper: wrapper('/?sort=price-low-high'),
    });
    expect(result.current.hasActiveFilters).toBe(true);
  });

  it('falls back to the default sort for an unknown sort value', () => {
    const { result } = renderHook(() => useFilters(), {
      wrapper: wrapper('/?sort=banana'),
    });
    expect(result.current.filters.sort).toBe('ending-soon');
  });
});
