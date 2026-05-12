import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Vehicle } from '../types';
import { SpecsGrid } from './SpecsGrid';

function vehicleFixture(overrides: Partial<Vehicle> = {}): Vehicle {
  return {
    id: 'v-1',
    vin: '2HGFC2F5XKH123456',
    year: 2019,
    make: 'Honda',
    model: 'Civic',
    trim: 'LX',
    body_style: 'sedan',
    exterior_color: 'Black',
    interior_color: 'Grey',
    engine: '2.0L I4',
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
    auction_start: new Date(0).toISOString(),
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

describe('SpecsGrid', () => {
  it('renders the seven AC6 spec rows plus body style and fuel type', () => {
    render(<SpecsGrid vehicle={vehicleFixture()} />);
    expect(screen.getByText('Engine')).toBeInTheDocument();
    expect(screen.getByText('Transmission')).toBeInTheDocument();
    expect(screen.getByText('Drivetrain')).toBeInTheDocument();
    expect(screen.getByText('Exterior color')).toBeInTheDocument();
    expect(screen.getByText('Interior color')).toBeInTheDocument();
    expect(screen.getByText('VIN')).toBeInTheDocument();
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Body style')).toBeInTheDocument();
    expect(screen.getByText('Fuel type')).toBeInTheDocument();
  });

  it('does not render Odometer or Lot (those live in the page header)', () => {
    render(<SpecsGrid vehicle={vehicleFixture()} />);
    expect(screen.queryByText('Odometer')).not.toBeInTheDocument();
    expect(screen.queryByText('Lot')).not.toBeInTheDocument();
  });

  it('capitalizes lowercase enum values for display', () => {
    render(<SpecsGrid vehicle={vehicleFixture({ body_style: 'sedan', fuel_type: 'gasoline' })} />);
    expect(screen.getByText('Sedan')).toBeInTheDocument();
    expect(screen.getByText('Gasoline')).toBeInTheDocument();
  });

  it('tints the title row green when title_status is clean', () => {
    render(<SpecsGrid vehicle={vehicleFixture({ title_status: 'clean' })} />);
    const cell = screen.getByText('Clean');
    expect(cell.className).toMatch(/emerald/);
  });

  it('tints the title row amber when title_status is non-clean', () => {
    render(<SpecsGrid vehicle={vehicleFixture({ title_status: 'salvage' })} />);
    const cell = screen.getByText('Salvage');
    expect(cell.className).toMatch(/amber/);
  });
});
