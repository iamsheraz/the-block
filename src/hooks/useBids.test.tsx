import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { dataStore } from '../lib/dataStore';
import { getAuctionStatus } from '../lib/timestamps';
import type { Vehicle } from '../types';
import { useBids, useBidsForVehicle } from './useBids';

function aLiveVehicle(): Vehicle {
  const v = dataStore
    .getVehicles()
    .find((vehicle) => getAuctionStatus(vehicle, Date.now()) === 'live');
  if (!v) throw new Error('no live vehicle in fixture');
  return v;
}

beforeEach(() => {
  localStorage.removeItem('the-block:bids');
  dataStore.resetForTests();
});

afterEach(() => {
  localStorage.removeItem('the-block:bids');
  dataStore.resetForTests();
});

describe('useBids', () => {
  it('submitBid surfaces a typed BidError on rejection', () => {
    const live = aLiveVehicle();
    function Probe() {
      const { submitBid } = useBids();
      const result = submitBid({ vehicleId: live.id, amount: 1 });
      return <span>{result.ok ? 'ok' : result.error.type}</span>;
    }
    render(<Probe />);
    expect(screen.getByText('amount_too_low')).toBeInTheDocument();
  });

  it('submitBid success updates current_bid via the store', () => {
    const live = aLiveVehicle();
    const before = dataStore.getVehicle(live.id);
    if (!before) throw new Error('vehicle missing');
    const minAmount = (before.current_bid ?? before.starting_bid) + 100;

    function Probe({ amount }: { amount: number }) {
      const { submitBid } = useBids();
      submitBid({ vehicleId: live.id, amount });
      return null;
    }
    render(<Probe amount={minAmount} />);

    const after = dataStore.getVehicle(live.id);
    expect(after?.current_bid).toBe(Math.max(before.current_bid ?? 0, minAmount));
  });
});

describe('useBidsForVehicle', () => {
  it('renders bids for the vehicle and updates when a new bid is submitted', () => {
    const live = aLiveVehicle();
    const baseline = dataStore.getBidsForVehicle(live.id).length;

    function Probe() {
      const bids = useBidsForVehicle(live.id);
      return <span data-testid="count">{bids.length}</span>;
    }
    render(<Probe />);
    expect(screen.getByTestId('count').textContent).toBe(String(baseline));

    const current = dataStore.getVehicle(live.id);
    if (!current) throw new Error('vehicle missing');
    const amount = (current.current_bid ?? current.starting_bid) + 100;
    act(() => {
      dataStore.submitBid({ vehicleId: live.id, amount });
    });
    expect(screen.getByTestId('count').textContent).toBe(String(baseline + 1));
  });
});
