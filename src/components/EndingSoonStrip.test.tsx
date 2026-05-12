import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { AUCTION_DURATION, ENDING_SOON_THRESHOLD } from '../lib/constants';
import type { Vehicle } from '../types';
import { EndingSoonStrip } from './EndingSoonStrip';

const NOW = Date.UTC(2030, 0, 15, 12, 0, 0);

function vehicleFixture(overrides: Partial<Vehicle> = {}): Vehicle {
  return {
    id: 'v-1',
    vin: 'VIN0000000000001',
    year: 2019,
    make: 'Honda',
    model: 'Civic',
    trim: 'LX',
    body_style: 'Sedan',
    exterior_color: 'Black',
    interior_color: 'Grey',
    engine: '2.0L',
    transmission: 'automatic',
    drivetrain: 'FWD',
    odometer_km: 84_210,
    fuel_type: 'gasoline',
    condition_grade: 4.2,
    condition_report: '',
    damage_notes: [],
    title_status: 'clean',
    province: 'Ontario',
    city: 'Toronto',
    auction_start: new Date(NOW).toISOString(),
    starting_bid: 14_500,
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

// Build a vehicle whose auction ends `msFromNow` later. Live status requires
// start <= now <= start + duration, so we set start = now - (duration - msFromNow).
function endsIn(id: string, msFromNow: number): Vehicle {
  const start = NOW - (AUCTION_DURATION - msFromNow);
  return vehicleFixture({ id, auction_start: new Date(start).toISOString() });
}

function renderStrip(vehicles: Vehicle[]) {
  return render(
    <MemoryRouter>
      <EndingSoonStrip vehicles={vehicles} now={NOW} />
    </MemoryRouter>,
  );
}

describe('EndingSoonStrip', () => {
  it('renders nothing when no vehicles are within the ending-soon window', () => {
    const { container } = renderStrip([
      vehicleFixture({
        id: 'far',
        auction_start: new Date(NOW + 6 * 60 * 60_000).toISOString(),
      }),
      vehicleFixture({
        id: 'ended',
        auction_start: new Date(NOW - AUCTION_DURATION - 60_000).toISOString(),
      }),
    ]);
    expect(container.firstChild).toBeNull();
  });

  it('renders vehicles whose auction ends within the threshold', () => {
    renderStrip([endsIn('soon', 10 * 60_000)]);
    expect(screen.getByRole('region', { name: /ending soon/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /2019 Honda Civic/i })).toBeInTheDocument();
  });

  it('orders cards by soonest to latest', () => {
    renderStrip([
      endsIn('mid', 30 * 60_000),
      endsIn('soonest', 2 * 60_000),
      endsIn('later', 50 * 60_000),
    ]);
    const region = screen.getByRole('region', { name: /ending soon/i });
    const links = within(region).getAllByRole('link');
    const ids = links.map((l) => l.getAttribute('href'));
    expect(ids).toEqual(['/vehicle/soonest', '/vehicle/mid', '/vehicle/later']);
  });

  it('caps the strip at five vehicles', () => {
    const vehicles = [1, 2, 3, 4, 5, 6, 7].map((i) => endsIn(`v-${i}`, i * 5 * 60_000));
    renderStrip(vehicles);
    const region = screen.getByRole('region', { name: /ending soon/i });
    expect(within(region).getAllByRole('link')).toHaveLength(5);
  });

  it('excludes auctions that have already ended', () => {
    renderStrip([
      endsIn('alive', 5 * 60_000),
      vehicleFixture({
        id: 'dead',
        auction_start: new Date(NOW - AUCTION_DURATION - 1).toISOString(),
      }),
    ]);
    const region = screen.getByRole('region', { name: /ending soon/i });
    const links = within(region).getAllByRole('link');
    expect(links.map((l) => l.getAttribute('href'))).toEqual(['/vehicle/alive']);
  });

  it('excludes upcoming auctions even if they will end within the hour from now', () => {
    // start is in the future → not live yet
    const start = NOW + 5 * 60_000;
    const { container } = renderStrip([
      vehicleFixture({
        id: 'upcoming',
        auction_start: new Date(start).toISOString(),
      }),
    ]);
    expect(container.firstChild).toBeNull();
    expect(screen.queryByRole('region', { name: /ending soon/i })).toBeNull();
  });

  it('renders an MM:SS countdown for sub-hour windows', () => {
    renderStrip([endsIn('soon', 12 * 60_000 + 43 * 1000)]);
    expect(screen.getByText('12:43')).toBeInTheDocument();
  });

  it('threshold boundary: exactly at the threshold is excluded (strict <)', () => {
    renderStrip([endsIn('edge', ENDING_SOON_THRESHOLD)]);
    expect(screen.queryByRole('region', { name: /ending soon/i })).toBeNull();
  });

  it('threshold boundary: one ms inside the threshold is included', () => {
    renderStrip([endsIn('just-under', ENDING_SOON_THRESHOLD - 1)]);
    expect(screen.getByRole('region', { name: /ending soon/i })).toBeInTheDocument();
  });
});
