import { describe, expect, it } from 'vitest';
import type { Vehicle } from '../types';
import { AUCTION_DURATION } from './constants';
import { getAuctionStatus, normalizeTimestamps } from './timestamps';

function v(auctionStart: string, id = 'v'): Vehicle {
  return {
    id,
    vin: 'VIN0000000000001',
    year: 2024,
    make: 'Make',
    model: 'Model',
    trim: 'Trim',
    body_style: 'Sedan',
    exterior_color: 'Black',
    interior_color: 'Grey',
    engine: '2.0L',
    transmission: 'automatic',
    drivetrain: 'AWD',
    odometer_km: 0,
    fuel_type: 'gasoline',
    condition_grade: 4,
    condition_report: '',
    damage_notes: [],
    title_status: 'clean',
    province: 'Ontario',
    city: 'Toronto',
    auction_start: auctionStart,
    starting_bid: 10_000,
    reserve_price: null,
    buy_now_price: null,
    images: [],
    selling_dealership: 'Dealer',
    lot: 'A-0001',
    current_bid: null,
    bid_count: 0,
  };
}

describe('normalizeTimestamps', () => {
  it('shifts the median to "now" for an arbitrary dataset', () => {
    const now = new Date('2030-01-15T12:00:00Z').getTime();
    const input = [
      v('2026-04-01T00:00:00Z', 'a'),
      v('2026-04-03T00:00:00Z', 'b'),
      v('2026-04-05T00:00:00Z', 'c'),
    ];

    const out = normalizeTimestamps(input, now);
    const [a, b, c] = out;
    if (!a || !b || !c) throw new Error('expected three vehicles');

    expect(new Date(b.auction_start).getTime()).toBe(now);

    // Spread is preserved: a is 2 days before, c is 2 days after the median.
    const days = 24 * 60 * 60 * 1000;
    expect(new Date(a.auction_start).getTime()).toBe(now - 2 * days);
    expect(new Date(c.auction_start).getTime()).toBe(now + 2 * days);
  });

  it('returns an empty array unchanged', () => {
    expect(normalizeTimestamps([], 0)).toEqual([]);
  });

  it('does not mutate the input array', () => {
    const input = [v('2026-04-01T00:00:00Z', 'a')];
    const [original] = input;
    if (!original) throw new Error('expected one vehicle');
    const before = original.auction_start;
    normalizeTimestamps(input, 0);
    expect(original.auction_start).toBe(before);
  });
});

describe('getAuctionStatus', () => {
  const start = new Date('2026-05-11T12:00:00Z').getTime();

  it('returns upcoming when now is before auction_start', () => {
    const vehicle = v(new Date(start).toISOString());
    expect(getAuctionStatus(vehicle, start - 1)).toBe('upcoming');
  });

  it('returns live at exactly auction_start (inclusive)', () => {
    const vehicle = v(new Date(start).toISOString());
    expect(getAuctionStatus(vehicle, start)).toBe('live');
  });

  it('returns live at exactly auction_start + AUCTION_DURATION (inclusive)', () => {
    const vehicle = v(new Date(start).toISOString());
    expect(getAuctionStatus(vehicle, start + AUCTION_DURATION)).toBe('live');
  });

  it('returns ended after auction_start + AUCTION_DURATION', () => {
    const vehicle = v(new Date(start).toISOString());
    expect(getAuctionStatus(vehicle, start + AUCTION_DURATION + 1)).toBe('ended');
  });
});
