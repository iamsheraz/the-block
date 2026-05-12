import type { Bid, BidResult, Vehicle } from '../types';
import { MAX_BID, MIN_BID_INCREMENT } from './constants';
import { getAuctionStatus } from './timestamps';

export type ValidateBidInput = {
  vehicle: Vehicle;
  amount: number;
  now: number;
  bidderId: string;
};

export function validateBid(input: ValidateBidInput): BidResult {
  const { vehicle, amount, now, bidderId } = input;

  const status = getAuctionStatus(vehicle, now);
  if (status !== 'live') {
    return { ok: false, error: { type: 'auction_not_live', status } };
  }

  if (amount > MAX_BID) {
    return { ok: false, error: { type: 'amount_too_high', max: MAX_BID } };
  }

  const min =
    vehicle.current_bid === null ? vehicle.starting_bid : vehicle.current_bid + MIN_BID_INCREMENT;
  if (amount < min) {
    return { ok: false, error: { type: 'amount_too_low', min } };
  }

  const bid: Bid = {
    vehicleId: vehicle.id,
    bidderId,
    amount,
    placedAt: new Date(now).toISOString(),
  };
  return { ok: true, bid };
}
