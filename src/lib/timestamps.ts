import type { AuctionStatus, Vehicle } from '../types';
import { AUCTION_DURATION } from './constants';

// Median-anchor: shift every auction_start so the median lands at `now`.
// The committed dataset's timestamps cluster in late-March / early-April 2026;
// without the shift every run reads as "ended". The JSON on disk is never
// mutated — we return a new array.
export function normalizeTimestamps(vehicles: Vehicle[], now: number): Vehicle[] {
  if (vehicles.length === 0) return vehicles;

  const sorted = vehicles.map((v) => new Date(v.auction_start).getTime()).sort((a, b) => a - b);

  const median = sorted[Math.floor(sorted.length / 2)];
  if (median === undefined) return vehicles;

  const offset = now - median;
  return vehicles.map((v) => ({
    ...v,
    auction_start: new Date(new Date(v.auction_start).getTime() + offset).toISOString(),
  }));
}

export function getAuctionStatus(vehicle: Vehicle, now: number): AuctionStatus {
  const start = new Date(vehicle.auction_start).getTime();
  const end = start + AUCTION_DURATION;
  if (now < start) return 'upcoming';
  if (now <= end) return 'live';
  return 'ended';
}
