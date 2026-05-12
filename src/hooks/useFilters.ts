import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useLocation, useSearchParams } from 'react-router';
import { DEFAULT_FILTERS } from '../lib/filters';
import type { FilterState, SortKey } from '../types';

const VALID_SORTS: readonly SortKey[] = [
  'ending-soon',
  'recently-added',
  'price-low-high',
  'price-high-low',
  'condition-best-worst',
];

const OWNED_KEYS = ['q', 'make', 'body', 'pmin', 'pmax', 'sort'] as const;

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

// Multi-select values are serialised in sorted order so {Honda, Ford} and
// {Ford, Honda} produce the same canonical URL — cache keys, shared links,
// and analytics don't fragment by click order.
function setListOrDelete(params: URLSearchParams, key: string, value: string[]): void {
  if (value.length === 0) params.delete(key);
  else params.set(key, [...value].sort().join(','));
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

type UpdateOptions = { replace?: boolean };

// The URL is the source of truth for inventory filter/search/sort state. All
// writes flow through this hook so no component reaches into useSearchParams
// directly — that keeps the URL schema in one place and the back/forward
// behaviour consistent across the page.
export function useFilters(): FilterBundle {
  const [params, setParams] = useSearchParams();
  const location = useLocation();

  // `params` is a fresh URLSearchParams instance every render even when the
  // query string is unchanged — memoise on the string so downstream consumers
  // see a stable `filters` identity when nothing actually moved.
  const search = params.toString();
  // biome-ignore lint/correctness/useExhaustiveDependencies: stable params identity is keyed on `search`
  const filters = useMemo(() => parseFilters(params), [search]);

  // React Router's setSearchParams doesn't compose functional updates across
  // synchronous calls — call N reads the same pre-render `prev` as call 1.
  // We keep a draft keyed on the live `location.search`; calls in the same
  // tick mutate the shared draft, and each write submits the cumulative
  // result so the last setParams call (which wins) carries every mutation.
  const draftRef = useRef<{ baseline: string; working: URLSearchParams } | null>(null);

  const update = useCallback(
    (mutator: (next: URLSearchParams) => void, opts?: UpdateOptions) => {
      if (draftRef.current === null || draftRef.current.baseline !== location.search) {
        draftRef.current = {
          baseline: location.search,
          working: new URLSearchParams(location.search),
        };
      }
      mutator(draftRef.current.working);
      setParams(new URLSearchParams(draftRef.current.working), opts);
    },
    [location.search, setParams],
  );

  // If a stale or unknown `?sort=` value arrives via a shared link or
  // bookmark, sanitise the URL once so it stops lingering forever.
  useEffect(() => {
    const raw = params.get('sort');
    if (raw !== null && !(VALID_SORTS as readonly string[]).includes(raw)) {
      update((next) => next.delete('sort'), { replace: true });
    }
  }, [params, update]);

  // Search writes replace the history entry so a 5-keystroke "Honda" doesn't
  // create 5 history entries and break Back. Filter/sort clicks still push.
  const setSearch = useCallback(
    (value: string) => update((next) => setOrDelete(next, 'q', value), { replace: true }),
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
  // Only delete the keys this hook owns — leaves room for future unrelated
  // query params (utm, ref, share tags) without surprising data loss.
  const clear = useCallback(
    () =>
      update((next) => {
        for (const k of OWNED_KEYS) next.delete(k);
      }),
    [update],
  );

  // Whitespace-only search trims to empty in applyFilters, so it shouldn't
  // light up the Clear-filters affordance either.
  const hasActiveFilters =
    filters.search.trim() !== DEFAULT_FILTERS.search ||
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
