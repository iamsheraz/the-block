import { describe, expect, it } from 'vitest';
import type { FilterState, Vehicle } from '../types';
import { AUCTION_DURATION } from './constants';
import { DEFAULT_FILTERS, applyFilters } from './filters';

const NOW = Date.UTC(2030, 0, 15, 12, 0, 0);

function vehicleFixture(overrides: Partial<Vehicle> = {}): Vehicle {
  return {
    id: 'v-1',
    vin: 'VIN0000000000001',
    year: 2019,
    make: 'Honda',
    model: 'Civic',
    trim: 'LX',
    body_style: 'Sedan',
    exterior_color: 'Black',
    interior_color: 'Grey',
    engine: '2.0L',
    transmission: 'automatic',
    drivetrain: 'FWD',
    odometer_km: 84_210,
    fuel_type: 'gasoline',
    condition_grade: 4.2,
    condition_report: '',
    damage_notes: [],
    title_status: 'clean',
    province: 'Ontario',
    city: 'Toronto',
    auction_start: new Date(NOW - 30 * 60_000).toISOString(),
    starting_bid: 14_500,
    reserve_price: null,
    buy_now_price: null,
    images: [],
    selling_dealership: 'Dealer',
    lot: 'A-0001',
    current_bid: null,
    bid_count: 0,
    ...overrides,
  };
}

function filters(overrides: Partial<FilterState> = {}): FilterState {
  return { ...DEFAULT_FILTERS, ...overrides };
}

// A small mixed fleet exercised across most tests. The sort cases override
// per-vehicle fields as needed.
const FLEET: Vehicle[] = [
  vehicleFixture({
    id: 'a',
    make: 'Honda',
    model: 'Civic',
    body_style: 'Sedan',
    starting_bid: 14_500,
    condition_grade: 4.2,
    lot: 'A-0001',
  }),
  vehicleFixture({
    id: 'b',
    make: 'Ford',
    model: 'F-150',
    body_style: 'Truck',
    starting_bid: 19_200,
    current_bid: 19_200,
    condition_grade: 3.1,
    lot: 'A-0002',
  }),
  vehicleFixture({
    id: 'c',
    make: 'Toyota',
    model: 'RAV4',
    body_style: 'SUV',
    starting_bid: 24_000,
    condition_grade: 3.8,
    lot: 'A-0003',
  }),
  vehicleFixture({
    id: 'd',
    make: 'Honda',
    model: 'CR-V',
    body_style: 'SUV',
    starting_bid: 21_000,
    current_bid: 22_500,
    condition_grade: 4.5,
    lot: 'A-0004',
  }),
];

describe('applyFilters', () => {
  it('returns every vehicle when filters are at defaults', () => {
    const result = applyFilters(FLEET, DEFAULT_FILTERS, NOW);
    expect(result).toHaveLength(FLEET.length);
  });

  it('narrows by make', () => {
    const result = applyFilters(FLEET, filters({ makes: ['Honda'] }), NOW);
    expect(result.map((v) => v.id).sort()).toEqual(['a', 'd']);
  });

  it('treats makes as an OR set', () => {
    const result = applyFilters(FLEET, filters({ makes: ['Honda', 'Ford'] }), NOW);
    expect(result.map((v) => v.id).sort()).toEqual(['a', 'b', 'd']);
  });

  it('composes make AND body AND price', () => {
    const result = applyFilters(
      FLEET,
      filters({ makes: ['Honda'], bodyStyles: ['SUV'], priceMin: 20_000, priceMax: 25_000 }),
      NOW,
    );
    expect(result.map((v) => v.id)).toEqual(['d']);
  });

  it('compares price against current_bid when present, otherwise starting_bid', () => {
    // Vehicle b: current_bid 19,200 (vs starting_bid 19,200) — at threshold.
    // Vehicle d: current_bid 22,500 (vs starting_bid 21,000) — above threshold.
    const result = applyFilters(FLEET, filters({ priceMin: 22_000 }), NOW);
    expect(result.map((v) => v.id).sort()).toEqual(['c', 'd']);
  });

  it('returns empty array when no vehicles match', () => {
    const result = applyFilters(FLEET, filters({ makes: ['Tesla'] }), NOW);
    expect(result).toEqual([]);
  });

  it('matches the exact model token', () => {
    const result = applyFilters(FLEET, filters({ search: 'Civic' }), NOW);
    expect(result.map((v) => v.id)).toContain('a');
  });

  it('tolerates a one-character typo on the model (Fuse fuzzy)', () => {
    const result = applyFilters(FLEET, filters({ search: 'Civc' }), NOW);
    expect(result.map((v) => v.id)).toContain('a');
  });

  it('matches a partial VIN substring', () => {
    const result = applyFilters(
      [...FLEET, vehicleFixture({ id: 'e', vin: '1HGFC2F5XKL000999' })],
      filters({ search: 'FC2F5' }),
      NOW,
    );
    expect(result.map((v) => v.id)).toContain('e');
  });

  it('matches by lot number', () => {
    const result = applyFilters(FLEET, filters({ search: 'A-0003' }), NOW);
    expect(result.map((v) => v.id)).toContain('c');
  });
});

describe('applyFilters sort', () => {
  it('sorts by ending-soon: live and upcoming by time-remaining asc, ended last', () => {
    const fleet: Vehicle[] = [
      vehicleFixture({
        id: 'ended',
        auction_start: new Date(NOW - AUCTION_DURATION - 60_000).toISOString(),
      }),
      vehicleFixture({
        id: 'far',
        auction_start: new Date(NOW + 6 * 60 * 60_000).toISOString(),
      }),
      vehicleFixture({
        id: 'soon',
        auction_start: new Date(NOW - AUCTION_DURATION + 5 * 60_000).toISOString(),
      }),
      vehicleFixture({
        id: 'mid',
        auction_start: new Date(NOW - AUCTION_DURATION + 30 * 60_000).toISOString(),
      }),
    ];
    const result = applyFilters(fleet, filters({ sort: 'ending-soon' }), NOW);
    expect(result.map((v) => v.id)).toEqual(['soon', 'mid', 'far', 'ended']);
  });

  it('sorts by price low→high using bid-aware price', () => {
    const result = applyFilters(FLEET, filters({ sort: 'price-low-high' }), NOW);
    expect(result.map((v) => v.id)).toEqual(['a', 'b', 'd', 'c']);
  });

  it('sorts by price high→low using bid-aware price', () => {
    const result = applyFilters(FLEET, filters({ sort: 'price-high-low' }), NOW);
    expect(result.map((v) => v.id)).toEqual(['c', 'd', 'b', 'a']);
  });

  it('sorts by condition best→worst', () => {
    const result = applyFilters(FLEET, filters({ sort: 'condition-best-worst' }), NOW);
    expect(result.map((v) => v.id)).toEqual(['d', 'a', 'c', 'b']);
  });

  it('sorts by recently-added using lot descending', () => {
    const result = applyFilters(FLEET, filters({ sort: 'recently-added' }), NOW);
    expect(result.map((v) => v.id)).toEqual(['d', 'c', 'b', 'a']);
  });
});
