import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import vehiclesData from '../../data/vehicles.json';
import type { Vehicle } from '../types';
import { VehicleDetailPage } from './VehicleDetailPage';

const vehicles = vehiclesData as Vehicle[];
const FIRST_VEHICLE = vehicles[0];
if (!FIRST_VEHICLE) throw new Error('vehicles.json is empty — fixture invariant broken');

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/vehicle/:id" element={<VehicleDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('VehicleDetailPage', () => {
  it('renders the trust triptych for a known vehicle id', () => {
    renderAt(`/vehicle/${FIRST_VEHICLE.id}`);
    // Heading is built from year/make/model/trim — confirm all three structural parts appear.
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent(String(FIRST_VEHICLE.year));
    expect(heading).toHaveTextContent(FIRST_VEHICLE.make);
    expect(heading).toHaveTextContent(FIRST_VEHICLE.model);
    // Above-the-fold sections rendered.
    expect(screen.getByRole('region', { name: /above the fold/i })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /bid panel/i })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /image gallery/i })).toBeInTheDocument();
  });

  it('renders a not-found state with a back-to-inventory link for an unknown id', () => {
    renderAt('/vehicle/does-not-exist');
    expect(screen.getByText(/lot not found/i)).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /back to inventory/i });
    expect(link).toHaveAttribute('href', '/');
  });

  it('renders the back-to-inventory link in the header on a valid lot', () => {
    renderAt(`/vehicle/${FIRST_VEHICLE.id}`);
    const link = screen.getByRole('link', { name: /back to inventory/i });
    expect(link).toHaveAttribute('href', '/');
  });

  it('renders below-the-fold sections (specs, damage list, seller, bid history)', () => {
    renderAt(`/vehicle/${FIRST_VEHICLE.id}`);
    expect(screen.getByRole('heading', { name: /specs/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /damage notes/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /seller/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /bid history/i })).toBeInTheDocument();
  });
});
