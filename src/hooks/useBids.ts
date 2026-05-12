import { dataStore } from '../lib/dataStore';
import type { BidResult } from '../types';

export type UseBidsApi = {
  submitBid: (input: { vehicleId: string; amount: number }) => BidResult;
};

export function useBids(): UseBidsApi {
  return {
    submitBid: (input) => dataStore.submitBid(input),
  };
}
