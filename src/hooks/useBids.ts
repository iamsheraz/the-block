import { useSyncExternalStore } from 'react';
import { dataStore } from '../lib/dataStore';
import type { Bid, BidResult } from '../types';

export type UseBidsApi = {
  submitBid: (input: { vehicleId: string; amount: number }) => BidResult;
};

export function useBids(): UseBidsApi {
  return {
    submitBid: (input) => dataStore.submitBid(input),
  };
}

// Per-vehicle reactive bid history. Returns a stable array reference between
// store writes so useSyncExternalStore can compare snapshots without firing
// extra renders. Mirrors the caching pattern in useVehicles. The single
// subscription survives the page lifetime; `dataStore.resetForTests()` re-fires
// notify() which flips `dirty` so cached snapshots are dropped between tests.
const snapshotCache = new Map<string, Bid[]>();
let dirty = false;

dataStore.subscribe(() => {
  dirty = true;
});

function getSnapshotFor(vehicleId: string): Bid[] {
  if (dirty) {
    snapshotCache.clear();
    dirty = false;
  }
  const cached = snapshotCache.get(vehicleId);
  if (cached) return cached;
  const fresh = dataStore.getBidsForVehicle(vehicleId);
  snapshotCache.set(vehicleId, fresh);
  return fresh;
}

export function useBidsForVehicle(vehicleId: string): Bid[] {
  return useSyncExternalStore(
    (listener) => dataStore.subscribe(listener),
    () => getSnapshotFor(vehicleId),
    () => getSnapshotFor(vehicleId),
  );
}
