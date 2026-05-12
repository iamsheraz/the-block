import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import type { Vehicle } from '../types';
import { VehicleCard } from './VehicleCard';

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
    auction_start: new Date(NOW - 30 * 60_000).toISOString(),
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

function renderCard(vehicle: Vehicle, now: number = NOW) {
  return render(
    <MemoryRouter>
      <VehicleCard vehicle={vehicle} now={now} />
    </MemoryRouter>,
  );
}

describe('VehicleCard', () => {
  it('renders condition badge when title_status is clean', () => {
    renderCard(vehicleFixture());
    expect(screen.getByText('4.2')).toBeInTheDocument();
    expect(screen.queryByText(/salvage|rebuilt/i)).not.toBeInTheDocument();
  });

  it('substitutes title badge when title_status is salvage', () => {
    renderCard(vehicleFixture({ title_status: 'salvage', condition_grade: 4.2 }));
    expect(screen.getByText(/salvage/i)).toBeInTheDocument();
    // condition grade still appears in aria-label of an absent badge — assert via text query
    expect(screen.queryByText('4.2')).not.toBeInTheDocument();
  });

  it('shows "Starts at" copy when current_bid is null', () => {
    renderCard(vehicleFixture({ current_bid: null, starting_bid: 14_500 }));
    expect(screen.getByText(/starts at/i)).toBeInTheDocument();
    expect(screen.getByText('$14,500')).toBeInTheDocument();
    expect(screen.queryByText(/current bid/i)).not.toBeInTheDocument();
  });

  it('shows "Current bid" copy when current_bid exists', () => {
    renderCard(vehicleFixture({ current_bid: 19_200, starting_bid: 14_500 }));
    expect(screen.getByText(/current bid/i)).toBeInTheDocument();
    expect(screen.getByText('$19,200')).toBeInTheDocument();
    expect(screen.queryByText(/starts at/i)).not.toBeInTheDocument();
  });

  it('hides reserve indicator when reserve_price is null', () => {
    renderCard(vehicleFixture({ current_bid: 19_200, reserve_price: null }));
    expect(screen.queryByText(/reserve/i)).not.toBeInTheDocument();
  });

  it('hides reserve indicator when current_bid meets the reserve', () => {
    renderCard(vehicleFixture({ current_bid: 20_000, reserve_price: 18_000 }));
    expect(screen.queryByText(/reserve not met/i)).not.toBeInTheDocument();
  });

  it('shows reserve indicator when current_bid is below the reserve', () => {
    renderCard(vehicleFixture({ current_bid: 19_200, reserve_price: 25_000 }));
    expect(screen.getByText(/reserve not met/i)).toBeInTheDocument();
  });

  it('hides reserve indicator when there is a reserve but no bids', () => {
    renderCard(vehicleFixture({ current_bid: null, reserve_price: 25_000 }));
    expect(screen.queryByText(/reserve not met/i)).not.toBeInTheDocument();
  });

  it('links to the vehicle detail page', () => {
    renderCard(vehicleFixture({ id: 'abc-123' }));
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/vehicle/abc-123');
  });

  it('renders the year/make/model/trim on one heading line', () => {
    renderCard(vehicleFixture());
    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toHaveTextContent('2019 Honda Civic LX');
  });

  it('renders mileage and province code in the meta line', () => {
    renderCard(vehicleFixture({ odometer_km: 84_210, province: 'Ontario' }));
    expect(screen.getByText(/84,210 km · ON/i)).toBeInTheDocument();
  });

  it('falls back to a placeholder when the image fails to load', () => {
    renderCard(
      vehicleFixture({
        images: ['https://example.invalid/missing.jpg'],
      }),
    );
    const img = screen.getByRole('img', { name: /2019 Honda Civic LX/i });
    fireEvent.error(img);
    const link = screen.getByRole('link');
    expect(within(link).getByLabelText(/image unavailable/i)).toBeInTheDocument();
  });

  it('renders the placeholder directly when no image url is provided', () => {
    renderCard(vehicleFixture({ images: [] }));
    expect(screen.getByLabelText(/image unavailable/i)).toBeInTheDocument();
  });
});
