import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { InventoryPage } from './InventoryPage';

describe('InventoryPage', () => {
  it('renders all 200 vehicles as links', () => {
    render(
      <MemoryRouter>
        <InventoryPage />
      </MemoryRouter>,
    );
    const grid = screen.getByRole('region', { name: /vehicle listings/i });
    const cards = within(grid).getAllByRole('link');
    expect(cards).toHaveLength(200);
  });

  it('declares a responsive three-column grid at the lg breakpoint', () => {
    render(
      <MemoryRouter>
        <InventoryPage />
      </MemoryRouter>,
    );
    const grid = screen.getByRole('region', { name: /vehicle listings/i });
    // Tailwind utility classes encode the responsive breakpoints. Asserting on
    // the class string is fragile but it's the cheapest signal that the
    // mobile-first grid is wired correctly without spinning up a real viewport.
    expect(grid.className).toMatch(/grid-cols-1/);
    expect(grid.className).toMatch(/sm:grid-cols-2/);
    expect(grid.className).toMatch(/lg:grid-cols-3/);
  });
});
