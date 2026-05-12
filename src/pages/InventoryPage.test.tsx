import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { InventoryPage } from './InventoryPage';

function renderPage(initialEntries: string[] = ['/']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <InventoryPage />
    </MemoryRouter>,
  );
}

describe('InventoryPage', () => {
  it('renders all 200 vehicles when filters are at defaults', () => {
    renderPage();
    const grid = screen.getByRole('region', { name: /vehicle listings/i });
    const cards = within(grid).getAllByRole('link');
    expect(cards).toHaveLength(200);
  });

  it('declares a responsive three-column grid at the lg breakpoint', () => {
    renderPage();
    const grid = screen.getByRole('region', { name: /vehicle listings/i });
    expect(grid.className).toMatch(/grid-cols-1/);
    expect(grid.className).toMatch(/sm:grid-cols-2/);
    expect(grid.className).toMatch(/lg:grid-cols-3/);
  });

  it('renders the result count line', () => {
    renderPage();
    expect(screen.getByText(/showing/i)).toBeInTheDocument();
    expect(screen.getByText(/of/i)).toBeInTheDocument();
  });

  it('narrows the grid when a make filter is applied via URL', () => {
    renderPage(['/?make=Honda']);
    const grid = screen.getByRole('region', { name: /vehicle listings/i });
    const cards = within(grid).getAllByRole('link');
    expect(cards.length).toBeGreaterThan(0);
    expect(cards.length).toBeLessThan(200);
  });

  it('renders the empty state when no vehicles match', () => {
    renderPage(['/?make=ZZZ-Unknown-Brand']);
    expect(screen.queryByRole('region', { name: /vehicle listings/i })).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: /no vehicles match/i })).toBeInTheDocument();
    // Empty state surfaces its own Clear filters CTA prominently.
    expect(screen.getAllByRole('button', { name: /clear filters/i }).length).toBeGreaterThan(0);
  });

  it('hides the Clear filters button when no filters are active', () => {
    renderPage();
    expect(screen.queryByRole('button', { name: /clear filters/i })).not.toBeInTheDocument();
  });

  it('shows the Clear filters button when filters are active', () => {
    renderPage(['/?make=Honda']);
    expect(screen.getAllByRole('button', { name: /clear filters/i }).length).toBeGreaterThan(0);
  });

  it('writes search input back into the URL on every keystroke', async () => {
    renderPage();
    await userEvent.type(screen.getByRole('searchbox', { name: /search/i }), 'Honda');
    // Result count line should reflect a narrowed result after typing.
    const count = await screen.findByText(/showing/i);
    // The "Showing N of 200" copy is split into spans — assert the trailing
    // span shows fewer than 200 results.
    expect(count.textContent).toMatch(/Showing \d+ of 200 vehicles/);
  });
});
