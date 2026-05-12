import { useSyncExternalStore } from 'react';
import { dataStore } from '../lib/dataStore';
import type { Vehicle } from '../types';

// The dataStore returns a fresh array on each getVehicles() call. With
// useSyncExternalStore, that breaks reference equality and triggers
// "getSnapshot should be cached" warnings under StrictMode. We cache by
// the bid-bump signal: a fresh snapshot is only minted when the store
// notifies a subscriber.

let cachedSnapshot: Vehicle[] = dataStore.getVehicles();
let dirty = false;

dataStore.subscribe(() => {
  dirty = true;
});

function getSnapshot(): Vehicle[] {
  if (dirty) {
    cachedSnapshot = dataStore.getVehicles();
    dirty = false;
  }
  return cachedSnapshot;
}

function subscribe(listener: () => void): () => void {
  return dataStore.subscribe(listener);
}

export function useVehicles(): Vehicle[] {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
