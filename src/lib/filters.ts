import Fuse, { type IFuseOptions } from 'fuse.js';
import type { FilterState, SortKey, Vehicle } from '../types';
import { AUCTION_DURATION } from './constants';

export const DEFAULT_FILTERS: FilterState = {
  search: '',
  makes: [],
  bodyStyles: [],
  priceMin: null,
  priceMax: null,
  sort: 'ending-soon',
};

const FUSE_OPTIONS: IFuseOptions<Vehicle> = {
  keys: ['make', 'model', 'trim', 'vin', 'lot'],
  threshold: 0.35,
  ignoreLocation: true,
  minMatchCharLength: 2,
};

// Price comparison uses current_bid when a bid exists (that's the price a buyer
// would now pay) and falls back to starting_bid for the empty-bid majority case.
function priceFor(vehicle: Vehicle): number {
  return vehicle.current_bid ?? vehicle.starting_bid;
}

function matchesStructured(vehicle: Vehicle, state: FilterState): boolean {
  if (state.makes.length > 0 && !state.makes.includes(vehicle.make)) return false;
  if (state.bodyStyles.length > 0 && !state.bodyStyles.includes(vehicle.body_style)) return false;
  const price = priceFor(vehicle);
  if (state.priceMin !== null && price < state.priceMin) return false;
  if (state.priceMax !== null && price > state.priceMax) return false;
  return true;
}

// Time remaining is `start + duration - now`. Ended auctions get +Infinity so
// they fall to the bottom of the "ending soon" sort while still appearing in
// results (so a buyer can see the lot they were watching as ended, not
// silently disappeared).
function timeRemaining(vehicle: Vehicle, now: number): number {
  const end = new Date(vehicle.auction_start).getTime() + AUCTION_DURATION;
  const remaining = end - now;
  return remaining <= 0 ? Number.POSITIVE_INFINITY : remaining;
}

function compareSort(a: Vehicle, b: Vehicle, sort: SortKey, now: number): number {
  switch (sort) {
    case 'ending-soon':
      return timeRemaining(a, now) - timeRemaining(b, now);
    case 'price-low-high':
      return priceFor(a) - priceFor(b);
    case 'price-high-low':
      return priceFor(b) - priceFor(a);
    case 'condition-best-worst':
      return b.condition_grade - a.condition_grade;
    case 'recently-added':
      // No `added_at` on the dataset; lot is sequential (A-0001, A-0002 ...) so
      // descending lot is the best proxy for "most recently listed first".
      return b.lot.localeCompare(a.lot);
  }
}

export function applyFilters(vehicles: Vehicle[], state: FilterState, now: number): Vehicle[] {
  const query = state.search.trim();
  let pool: Vehicle[];

  if (query.length === 0) {
    pool = vehicles;
  } else {
    const fuse = new Fuse(vehicles, FUSE_OPTIONS);
    pool = fuse.search(query).map((r) => r.item);
  }

  const matched = pool.filter((v) => matchesStructured(v, state));
  // Slice before sort to avoid mutating either input.
  return matched.slice().sort((a, b) => compareSort(a, b, state.sort, now));
}

// Exposed so the InventoryPage can render the canonical option lists in the
// filter UI without having to re-derive them in two places.
export function uniqueMakes(vehicles: Vehicle[]): string[] {
  return Array.from(new Set(vehicles.map((v) => v.make))).sort();
}

export function uniqueBodyStyles(vehicles: Vehicle[]): string[] {
  return Array.from(new Set(vehicles.map((v) => v.body_style))).sort();
}
