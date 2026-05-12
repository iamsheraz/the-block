import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { DEFAULT_FILTERS } from '../lib/filters';
import type { FilterState, SortKey } from '../types';

const VALID_SORTS: readonly SortKey[] = [
  'ending-soon',
  'recently-added',
  'price-low-high',
  'price-high-low',
  'condition-best-worst',
];

function parseList(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function parsePrice(value: string | null): number | null {
  if (value === null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function parseSort(value: string | null): SortKey {
  if (value && (VALID_SORTS as readonly string[]).includes(value)) return value as SortKey;
  return DEFAULT_FILTERS.sort;
}

function parseFilters(params: URLSearchParams): FilterState {
  return {
    search: params.get('q') ?? '',
    makes: parseList(params.get('make')),
    bodyStyles: parseList(params.get('body')),
    priceMin: parsePrice(params.get('pmin')),
    priceMax: parsePrice(params.get('pmax')),
    sort: parseSort(params.get('sort')),
  };
}

function setOrDelete(params: URLSearchParams, key: string, value: string | null): void {
  if (value === null || value === '') params.delete(key);
  else params.set(key, value);
}

function setListOrDelete(params: URLSearchParams, key: string, value: string[]): void {
  if (value.length === 0) params.delete(key);
  else params.set(key, value.join(','));
}

function setPriceOrDelete(params: URLSearchParams, key: string, value: number | null): void {
  if (value === null) params.delete(key);
  else params.set(key, String(value));
}

function setSortOrDelete(params: URLSearchParams, value: SortKey): void {
  if (value === DEFAULT_FILTERS.sort) params.delete('sort');
  else params.set('sort', value);
}

export type FilterBundle = {
  filters: FilterState;
  hasActiveFilters: boolean;
  setSearch(value: string): void;
  setMakes(value: string[]): void;
  setBodyStyles(value: string[]): void;
  setPriceMin(value: number | null): void;
  setPriceMax(value: number | null): void;
  setSort(value: SortKey): void;
  clear(): void;
};

// The URL is the source of truth for inventory filter/search/sort state. All
// writes flow through this hook so no component reaches into useSearchParams
// directly — that keeps the URL schema in one place and the back/forward
// behaviour consistent across the page.
export function useFilters(): FilterBundle {
  const [params, setParams] = useSearchParams();

  const filters = useMemo(() => parseFilters(params), [params]);

  const update = useCallback(
    (mutator: (next: URLSearchParams) => void) => {
      setParams((prev) => {
        const next = new URLSearchParams(prev);
        mutator(next);
        return next;
      });
    },
    [setParams],
  );

  const setSearch = useCallback(
    (value: string) => update((next) => setOrDelete(next, 'q', value)),
    [update],
  );
  const setMakes = useCallback(
    (value: string[]) => update((next) => setListOrDelete(next, 'make', value)),
    [update],
  );
  const setBodyStyles = useCallback(
    (value: string[]) => update((next) => setListOrDelete(next, 'body', value)),
    [update],
  );
  const setPriceMin = useCallback(
    (value: number | null) => update((next) => setPriceOrDelete(next, 'pmin', value)),
    [update],
  );
  const setPriceMax = useCallback(
    (value: number | null) => update((next) => setPriceOrDelete(next, 'pmax', value)),
    [update],
  );
  const setSort = useCallback(
    (value: SortKey) => update((next) => setSortOrDelete(next, value)),
    [update],
  );
  const clear = useCallback(() => setParams(new URLSearchParams()), [setParams]);

  const hasActiveFilters =
    filters.search !== DEFAULT_FILTERS.search ||
    filters.makes.length > 0 ||
    filters.bodyStyles.length > 0 ||
    filters.priceMin !== null ||
    filters.priceMax !== null ||
    filters.sort !== DEFAULT_FILTERS.sort;

  return {
    filters,
    hasActiveFilters,
    setSearch,
    setMakes,
    setBodyStyles,
    setPriceMin,
    setPriceMax,
    setSort,
    clear,
  };
}
