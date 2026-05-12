import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Vehicle } from '../types';
import { BidPanel } from './BidPanel';

const NOW = Date.UTC(2030, 0, 15, 12, 0, 0);

function vehicleFixture(overrides: Partial<Vehicle> = {}): Vehicle {
  return {
    id: 'v-1',
    vin: '2HGFC2F5XKH123456',
    year: 2019,
    make: 'Honda',
    model: 'Civic',
    trim: 'LX',
    body_style: 'Sedan',
    exterior_color: 'Black',
    interior_color: 'Grey',
    engine: '2.0L I4',
    transmission: 'CVT',
    drivetrain: 'FWD',
    odometer_km: 84_210,
    fuel_type: 'gasoline',
    condition_grade: 4.2,
    condition_report: '',
    damage_notes: [],
    title_status: 'clean',
    province: 'Ontario',
    city: 'Toronto',
    auction_start: new Date(NOW - 30 * 60_000).toISOString(),
    starting_bid: 14_500,
    reserve_price: null,
    buy_now_price: null,
    images: [],
    selling_dealership: 'King City Auto',
    lot: 'A-0001',
    current_bid: null,
    bid_count: 0,
    ...overrides,
  };
}

describe('BidPanel', () => {
  it('shows "Starts at" when current_bid is null', () => {
    render(<BidPanel vehicle={vehicleFixture({ current_bid: null })} now={NOW} />);
    expect(screen.getByText(/starts at/i)).toBeInTheDocument();
    expect(screen.getByText('$14,500')).toBeInTheDocument();
    expect(screen.getByText(/no bids yet/i)).toBeInTheDocument();
  });

  it('hides reserve dollar amount when reserve_price is null', () => {
    render(<BidPanel vehicle={vehicleFixture({ reserve_price: null })} now={NOW} />);
    // Reserve column shows "None" placeholder; no dollar amount and no "not met" flag.
    expect(screen.getByText('None')).toBeInTheDocument();
    expect(screen.queryByText(/not met/i)).not.toBeInTheDocument();
  });

  it('shows the reserve price when set', () => {
    render(
      <BidPanel
        vehicle={vehicleFixture({ reserve_price: 16_000, current_bid: 15_000, bid_count: 3 })}
        now={NOW}
      />,
    );
    expect(screen.getByText('$16,000')).toBeInTheDocument();
    expect(screen.getByText(/not met/i)).toBeInTheDocument();
  });

  it('shows current bid amount and count when present', () => {
    render(<BidPanel vehicle={vehicleFixture({ current_bid: 19_200, bid_count: 5 })} now={NOW} />);
    expect(screen.getByText('$19,200')).toBeInTheDocument();
    expect(screen.getByText(/5 bids/i)).toBeInTheDocument();
  });

  it('renders the CarFax link pointing at carfax.ca with the vin in the path', () => {
    render(<BidPanel vehicle={vehicleFixture({ vin: 'ABC123' })} now={NOW} />);
    const link = screen.getByRole('link', { name: /carfax canada/i });
    expect(link).toHaveAttribute('href', expect.stringContaining('carfax.ca'));
    expect(link).toHaveAttribute('href', expect.stringContaining('ABC123'));
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('renders a disabled Place bid button (handler ships in story 1.5)', () => {
    render(<BidPanel vehicle={vehicleFixture()} now={NOW} />);
    const button = screen.getByRole('button', { name: /place bid/i });
    expect(button).toBeDisabled();
  });

  it('exposes a labeled bid input', () => {
    render(<BidPanel vehicle={vehicleFixture()} now={NOW} />);
    expect(screen.getByLabelText(/your bid/i)).toBeInTheDocument();
  });

  it('renders an AI summary panel (placeholder copy in this story)', () => {
    render(<BidPanel vehicle={vehicleFixture()} now={NOW} />);
    const section = screen.getByRole('region', { name: /bid panel/i });
    expect(within(section).getByText(/ai summary/i)).toBeInTheDocument();
  });
});
