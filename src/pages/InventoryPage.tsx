import { useDeferredValue, useMemo } from 'react';
import { EndingSoonStrip } from '../components/EndingSoonStrip';
import { FilterBar } from '../components/FilterBar';
import { SearchBar } from '../components/SearchBar';
import { SortSelect } from '../components/SortSelect';
import { VehicleCard } from '../components/VehicleCard';
import { useFilters } from '../hooks/useFilters';
import { useNow } from '../hooks/useNow';
import { useVehicles } from '../hooks/useVehicles';
import { applyFilters, uniqueBodyStyles, uniqueMakes } from '../lib/filters';

export function InventoryPage() {
  const vehicles = useVehicles();
  const now = useNow();
  const {
    filters,
    hasActiveFilters,
    setSearch,
    setMakes,
    setBodyStyles,
    setPriceMin,
    setPriceMax,
    setSort,
    clear,
  } = useFilters();

  // SearchBar debounces its own URL write (replace history); filter/sort
  // clicks push immediately. useDeferredValue keeps the page interactive if
  // Fuse re-runs after a filter toggle while typing.
  const deferredFilters = useDeferredValue(filters);

  const makesOptions = useMemo(() => uniqueMakes(vehicles), [vehicles]);
  const bodyOptions = useMemo(() => uniqueBodyStyles(vehicles), [vehicles]);

  const filtered = useMemo(
    () => applyFilters(vehicles, deferredFilters, now),
    [vehicles, deferredFilters, now],
  );

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <section className="mb-6">
        <SearchBar value={filters.search} onChange={setSearch} />

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <FilterBar
            makes={makesOptions}
            bodyStyles={bodyOptions}
            selectedMakes={filters.makes}
            selectedBodyStyles={filters.bodyStyles}
            priceMin={filters.priceMin}
            priceMax={filters.priceMax}
            onMakesChange={setMakes}
            onBodyStylesChange={setBodyStyles}
            onPriceMinChange={setPriceMin}
            onPriceMaxChange={setPriceMax}
          />
          <div className="ml-auto">
            <SortSelect value={filters.sort} onChange={setSort} />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-b border-slate-200 pb-3 text-sm">
          <p className="text-slate-600">
            Showing{' '}
            <span className="font-semibold tabular-nums text-slate-900">{filtered.length}</span> of{' '}
            <span className="font-semibold tabular-nums text-slate-900">{vehicles.length}</span>{' '}
            vehicles
          </p>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={clear}
              className="text-slate-500 underline-offset-4 hover:text-slate-900 hover:underline"
            >
              Clear filters
            </button>
          ) : null}
        </div>
      </section>

      <EndingSoonStrip vehicles={vehicles} now={now} />

      {filtered.length === 0 ? (
        <EmptyState onClear={clear} />
      ) : (
        <section
          aria-label="Vehicle listings"
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {filtered.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} now={now} />
          ))}
        </section>
      )}
    </main>
  );
}

function EmptyState({ onClear }: { onClear(): void }) {
  return (
    <section
      aria-label="No vehicles match the active filters"
      className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center"
    >
      <h2 className="text-base font-semibold text-slate-900">No vehicles match these filters</h2>
      <p className="mt-1 text-sm text-slate-500">
        Try widening the price range or removing a make to see more lots.
      </p>
      <button
        type="button"
        onClick={onClear}
        className="mt-5 inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
      >
        Clear filters
      </button>
    </section>
  );
}
