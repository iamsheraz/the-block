import { describe, expect, it } from 'vitest';
import type { Vehicle } from '../types';
import { validateBid } from './bids';
import { AUCTION_DURATION, MAX_BID, MIN_BID_INCREMENT } from './constants';

// Fixture: a vehicle whose auction is live "now" (epoch 0 for determinism).
// Override fields as needed per test.
const NOW = 0;
const LIVE_START = -1000; // started 1s before NOW, still well inside AUCTION_DURATION

function vehicleFixture(overrides: Partial<Vehicle> = {}): Vehicle {
  const base: Vehicle = {
    id: 'v-1',
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
    odometer_km: 10_000,
    fuel_type: 'gasoline',
    condition_grade: 4,
    condition_report: '',
    damage_notes: [],
    title_status: 'clean',
    province: 'Ontario',
    city: 'Toronto',
    auction_start: new Date(LIVE_START).toISOString(),
    starting_bid: 10_000,
    reserve_price: null,
    buy_now_price: null,
    images: [],
    selling_dealership: 'Dealer',
    lot: 'A-0001',
    current_bid: 12_000,
    bid_count: 2,
  };
  return { ...base, ...overrides };
}

describe('validateBid', () => {
  it('rejects amount equal to current_bid', () => {
    const result = validateBid({
      vehicle: vehicleFixture({ current_bid: 12_000 }),
      amount: 12_000,
      now: NOW,
      bidderId: 'b-1',
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toEqual({
      type: 'amount_too_low',
      min: 12_000 + MIN_BID_INCREMENT,
    });
  });

  it('rejects amount below current_bid + MIN_BID_INCREMENT', () => {
    const result = validateBid({
      vehicle: vehicleFixture({ current_bid: 12_000 }),
      amount: 12_000 + MIN_BID_INCREMENT - 1,
      now: NOW,
      bidderId: 'b-1',
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.type).toBe('amount_too_low');
  });

  it('rejects amount above MAX_BID', () => {
    const result = validateBid({
      vehicle: vehicleFixture({ current_bid: 12_000 }),
      amount: MAX_BID + 1,
      now: NOW,
      bidderId: 'b-1',
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toEqual({ type: 'amount_too_high', max: MAX_BID });
  });

  it('rejects when auction status is upcoming', () => {
    const result = validateBid({
      vehicle: vehicleFixture({
        auction_start: new Date(NOW + 60_000).toISOString(),
      }),
      amount: 20_000,
      now: NOW,
      bidderId: 'b-1',
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toEqual({ type: 'auction_not_live', status: 'upcoming' });
  });

  it('rejects when auction status is ended', () => {
    const result = validateBid({
      vehicle: vehicleFixture({
        auction_start: new Date(NOW - AUCTION_DURATION - 60_000).toISOString(),
      }),
      amount: 20_000,
      now: NOW,
      bidderId: 'b-1',
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toEqual({ type: 'auction_not_live', status: 'ended' });
  });

  it('accepts amount equal to starting_bid when current_bid is null', () => {
    const result = validateBid({
      vehicle: vehicleFixture({ current_bid: null, starting_bid: 9_500 }),
      amount: 9_500,
      now: NOW,
      bidderId: 'b-1',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.bid).toEqual({
      vehicleId: 'v-1',
      bidderId: 'b-1',
      amount: 9_500,
      placedAt: new Date(NOW).toISOString(),
    });
  });

  it('accepts amount equal to current_bid + MIN_BID_INCREMENT', () => {
    const result = validateBid({
      vehicle: vehicleFixture({ current_bid: 12_000 }),
      amount: 12_000 + MIN_BID_INCREMENT,
      now: NOW,
      bidderId: 'b-1',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.bid.amount).toBe(12_000 + MIN_BID_INCREMENT);
  });
});
