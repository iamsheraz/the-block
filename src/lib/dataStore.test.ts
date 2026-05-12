import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDataStore } from './dataStore';
import { getAuctionStatus } from './timestamps';

// Fixed "now" chosen so the dataset's median-anchor normalization yields
// a non-empty live-auction window (verified at ~13 live vehicles).
const FIXED_NOW = Date.UTC(2030, 0, 15, 12, 0, 0);
const nowFn = () => FIXED_NOW;

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
});

describe('dataStore', () => {
  it('returns all 200 vehicles', () => {
    const store = createDataStore({ now: nowFn });
    expect(store.getVehicles()).toHaveLength(200);
  });

  it('normalizes timestamps so live auctions exist around "now"', () => {
    const store = createDataStore({ now: nowFn });
    const liveCount = store
      .getVehicles()
      .filter((v) => getAuctionStatus(v, FIXED_NOW) === 'live').length;
    expect(liveCount).toBeGreaterThan(0);
  });

  it('does not mutate the source JSON', async () => {
    const sourceBefore = (await import('../../data/vehicles.json')).default[0];
    createDataStore({ now: nowFn });
    const sourceAfter = (await import('../../data/vehicles.json')).default[0];
    expect(sourceAfter).toEqual(sourceBefore);
  });

  it('submitBid persists and replays across a fresh store instance', () => {
    const store1 = createDataStore({ now: nowFn });
    const live = store1.getVehicles().find((v) => getAuctionStatus(v, FIXED_NOW) === 'live');
    if (!live) throw new Error('test setup: no live vehicle');

    const minAmount = (live.current_bid ?? live.starting_bid) + 100;
    const result = store1.submitBid({ vehicleId: live.id, amount: minAmount });
    expect(result.ok).toBe(true);

    // Fresh instance reads from the same localStorage.
    const store2 = createDataStore({ now: nowFn });
    const replayed = store2.getVehicle(live.id);
    if (!replayed) throw new Error('vehicle missing after replay');

    expect(replayed.bid_count).toBe(live.bid_count + 1);
    expect(replayed.current_bid).toBe(minAmount);
  });

  it('fires subscribers on submitBid', () => {
    const store = createDataStore({ now: nowFn });
    const listener = vi.fn();
    store.subscribe(listener);

    const live = store.getVehicles().find((v) => getAuctionStatus(v, FIXED_NOW) === 'live');
    if (!live) throw new Error('test setup: no live vehicle');
    store.submitBid({
      vehicleId: live.id,
      amount: (live.current_bid ?? live.starting_bid) + 100,
    });

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('unsubscribe stops further notifications', () => {
    const store = createDataStore({ now: nowFn });
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    unsubscribe();

    const live = store.getVehicles().find((v) => getAuctionStatus(v, FIXED_NOW) === 'live');
    if (!live) throw new Error('test setup: no live vehicle');
    store.submitBid({
      vehicleId: live.id,
      amount: (live.current_bid ?? live.starting_bid) + 100,
    });

    expect(listener).not.toHaveBeenCalled();
  });

  it('returns the same bidder id across instances (read from storage)', () => {
    const store1 = createDataStore({ now: nowFn });
    const live = store1.getVehicles().find((v) => getAuctionStatus(v, FIXED_NOW) === 'live');
    if (!live) throw new Error('test setup: no live vehicle');
    const result = store1.submitBid({
      vehicleId: live.id,
      amount: (live.current_bid ?? live.starting_bid) + 100,
    });
    if (!result.ok) throw new Error('expected ok bid');
    const firstBidderId = result.bid.bidderId;

    const store2 = createDataStore({ now: nowFn });
    const result2 = store2.submitBid({
      vehicleId: live.id,
      amount: (live.current_bid ?? live.starting_bid) + 200,
    });
    if (!result2.ok) throw new Error('expected ok bid');
    expect(result2.bid.bidderId).toBe(firstBidderId);
  });
});
