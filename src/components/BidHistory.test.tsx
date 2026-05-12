import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Bid } from '../types';
import { BidHistory } from './BidHistory';

const useBidsForVehicleMock = vi.fn<(vehicleId: string) => Bid[]>();

vi.mock('../hooks/useBids', () => ({
  useBidsForVehicle: (vehicleId: string) => useBidsForVehicleMock(vehicleId),
}));

beforeEach(() => {
  useBidsForVehicleMock.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

const NOW = Date.UTC(2030, 0, 15, 12, 0, 0);

function bid(amount: number, minutesAgo: number): Bid {
  return {
    vehicleId: 'v-1',
    bidderId: 'b-1',
    amount,
    placedAt: new Date(NOW - minutesAgo * 60_000).toISOString(),
  };
}

describe('BidHistory', () => {
  it('renders the empty state when no bids exist', () => {
    useBidsForVehicleMock.mockReturnValue([]);
    render(<BidHistory vehicleId="v-1" now={NOW} />);
    expect(screen.getByText(/no bids placed yet/i)).toBeInTheDocument();
  });

  it('renders bids in reverse chronological order', () => {
    useBidsForVehicleMock.mockReturnValue([bid(15_000, 10), bid(15_200, 5), bid(14_500, 30)]);
    render(<BidHistory vehicleId="v-1" now={NOW} />);
    const items = screen.getAllByRole('listitem');
    expect(items[0]?.textContent).toContain('$15,200');
    expect(items[1]?.textContent).toContain('$15,000');
    expect(items[2]?.textContent).toContain('$14,500');
  });

  it('shows a relative timestamp per bid', () => {
    useBidsForVehicleMock.mockReturnValue([bid(15_200, 5), bid(14_500, 90)]);
    render(<BidHistory vehicleId="v-1" now={NOW} />);
    expect(screen.getByText(/5m ago/)).toBeInTheDocument();
    expect(screen.getByText(/1h ago/)).toBeInTheDocument();
  });
});
