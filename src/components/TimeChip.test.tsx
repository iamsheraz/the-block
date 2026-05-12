import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AUCTION_DURATION } from '../lib/constants';
import type { Vehicle } from '../types';
import { TimeChip } from './TimeChip';

const NOW = Date.UTC(2030, 0, 15, 12, 0, 0);

function vehicleFixture(overrides: Partial<Vehicle> = {}): Vehicle {
  return {
    id: 'v-1',
    vin: 'VIN0000000000001',
    year: 2024,
    make: 'Honda',
    model: 'Civic',
    trim: 'LX',
    body_style: 'Sedan',
    exterior_color: 'Black',
    interior_color: 'Grey',
    engine: '2.0L',
    transmission: 'automatic',
    drivetrain: 'FWD',
    odometer_km: 10_000,
    fuel_type: 'gasoline',
    condition_grade: 4,
    condition_report: '',
    damage_notes: [],
    title_status: 'clean',
    province: 'Ontario',
    city: 'Toronto',
    auction_start: new Date(NOW).toISOString(),
    starting_bid: 10_000,
    reserve_price: null,
    buy_now_price: null,
    images: [],
    selling_dealership: 'Dealer',
    lot: 'A-0001',
    current_bid: null,
    bid_count: 0,
    ...overrides,
  };
}

describe('TimeChip', () => {
  it('renders LIVE when the auction is live with more than an hour remaining', () => {
    const vehicle = vehicleFixture({
      auction_start: new Date(NOW - 30 * 60_000).toISOString(),
    });
    render(<TimeChip vehicle={vehicle} now={NOW} />);
    expect(screen.getByText('LIVE')).toBeInTheDocument();
  });

  it('renders an amber "Ends Xm" chip when the live auction has under an hour left', () => {
    // Started 3h 42m ago → 18m until end.
    const vehicle = vehicleFixture({
      auction_start: new Date(NOW - (AUCTION_DURATION - 18 * 60_000)).toISOString(),
    });
    render(<TimeChip vehicle={vehicle} now={NOW} />);
    expect(screen.getByText('Ends 18m')).toBeInTheDocument();
  });

  it('renders "Ends Xh Ym" for an upcoming auction within a day', () => {
    // Starts 2h from now, ends 6h from now.
    const vehicle = vehicleFixture({
      auction_start: new Date(NOW + 2 * 3_600_000).toISOString(),
    });
    render(<TimeChip vehicle={vehicle} now={NOW} />);
    expect(screen.getByText('Ends 6h 0m')).toBeInTheDocument();
  });

  it('renders Ended when the auction is over', () => {
    const vehicle = vehicleFixture({
      auction_start: new Date(NOW - AUCTION_DURATION - 60_000).toISOString(),
    });
    render(<TimeChip vehicle={vehicle} now={NOW} />);
    expect(screen.getByText('Ended')).toBeInTheDocument();
  });
});
