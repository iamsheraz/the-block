import vehiclesData from '../../data/vehicles.json';
import type { Bid, BidResult, Vehicle } from '../types';
import { validateBid } from './bids';
import { normalizeTimestamps } from './timestamps';

const BIDS_KEY = 'the-block:bids';
const BIDDER_ID_KEY = 'the-block:bidder-id';

export interface DataStore {
  getVehicles(): Vehicle[];
  getVehicle(id: string): Vehicle | undefined;
  getBidsForVehicle(vehicleId: string): Bid[];
  getBidderId(): string;
  submitBid(input: { vehicleId: string; amount: number }): BidResult;
  subscribe(listener: () => void): () => void;
}

type CreateDataStoreOptions = {
  now?: () => number;
  storage?: Storage;
  bidderId?: string;
};

function readOrCreateBidderId(storage: Storage): string {
  const existing = storage.getItem(BIDDER_ID_KEY);
  if (existing) return existing;
  const id = crypto.randomUUID();
  storage.setItem(BIDDER_ID_KEY, id);
  return id;
}

function readBids(storage: Storage): Bid[] {
  const raw = storage.getItem(BIDS_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Bid[]) : [];
  } catch {
    return [];
  }
}

export function createDataStore(options: CreateDataStoreOptions = {}): DataStore {
  const nowFn = options.now ?? (() => Date.now());
  const storage = options.storage ?? globalThis.localStorage;
  const bidderId = options.bidderId ?? readOrCreateBidderId(storage);

  // Timestamps are normalized once at construction. Status is derived per
  // render against the live clock, so a "stale" normalization here is fine —
  // the JSON on disk is never mutated.
  const baseVehicles: Vehicle[] = normalizeTimestamps(vehiclesData as Vehicle[], nowFn());

  // Replay persisted bids into an in-memory per-vehicle map.
  const bidsByVehicle = new Map<string, Bid[]>();
  for (const bid of readBids(storage)) {
    const list = bidsByVehicle.get(bid.vehicleId) ?? [];
    list.push(bid);
    bidsByVehicle.set(bid.vehicleId, list);
  }

  const listeners = new Set<() => void>();
  function notify(): void {
    for (const listener of listeners) listener();
  }

  function mergeOverrides(vehicle: Vehicle): Vehicle {
    const userBids = bidsByVehicle.get(vehicle.id);
    if (!userBids || userBids.length === 0) return vehicle;
    const maxUserBid = Math.max(...userBids.map((b) => b.amount));
    return {
      ...vehicle,
      current_bid: Math.max(vehicle.current_bid ?? 0, maxUserBid),
      bid_count: vehicle.bid_count + userBids.length,
    };
  }

  function persist(): void {
    const all: Bid[] = [];
    for (const list of bidsByVehicle.values()) all.push(...list);
    storage.setItem(BIDS_KEY, JSON.stringify(all));
  }

  return {
    getVehicles() {
      return baseVehicles.map(mergeOverrides);
    },
    getVehicle(id) {
      const base = baseVehicles.find((v) => v.id === id);
      return base ? mergeOverrides(base) : undefined;
    },
    getBidsForVehicle(vehicleId) {
      return bidsByVehicle.get(vehicleId)?.slice() ?? [];
    },
    getBidderId() {
      return bidderId;
    },
    submitBid({ vehicleId, amount }) {
      const base = baseVehicles.find((v) => v.id === vehicleId);
      if (!base) {
        throw new Error(`Unknown vehicleId: ${vehicleId}`);
      }
      const vehicle = mergeOverrides(base);
      const result = validateBid({ vehicle, amount, now: nowFn(), bidderId });
      if (!result.ok) return result;

      const list = bidsByVehicle.get(vehicleId) ?? [];
      list.push(result.bid);
      bidsByVehicle.set(vehicleId, list);
      persist();
      notify();
      return result;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export const dataStore = createDataStore();
