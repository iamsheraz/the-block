import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { Header } from './Header';

describe('Header', () => {
  it('renders the brand mark and wordmark linking to the inventory', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    expect(screen.getByText(/the block/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /the block.*inventory/i })).toHaveAttribute('href', '/');
  });

  it('renders no auxiliary navigation links beyond the brand', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    expect(screen.getAllByRole('link')).toHaveLength(1);
  });

  it('shows a live-lot status on the inventory route', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Header />
      </MemoryRouter>,
    );

    expect(screen.getByText(/live/i)).toBeInTheDocument();
  });

  it('hides the status on the vehicle detail route', () => {
    render(
      <MemoryRouter initialEntries={['/vehicle/A4821']}>
        <Header />
      </MemoryRouter>,
    );

    expect(screen.queryByText(/live/i)).not.toBeInTheDocument();
  });
});
