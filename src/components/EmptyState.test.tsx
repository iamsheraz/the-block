import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(<EmptyState title="No vehicles match" description="Try widening the filters." />);
    expect(screen.getByRole('heading', { name: /no vehicles match/i })).toBeInTheDocument();
    expect(screen.getByText(/try widening/i)).toBeInTheDocument();
  });

  it('renders an action when provided', () => {
    render(
      <EmptyState title="No bids placed yet" action={<button type="button">Place a bid</button>} />,
    );
    expect(screen.getByRole('button', { name: /place a bid/i })).toBeInTheDocument();
  });

  it('uses the title as default aria-label on the landmark', () => {
    render(<EmptyState title="No reported damage" />);
    expect(screen.getByRole('region', { name: /no reported damage/i })).toBeInTheDocument();
  });

  it('honors an explicit aria-label override', () => {
    render(<EmptyState title="Lot not found" ariaLabel="Vehicle not found" />);
    expect(screen.getByRole('region', { name: /vehicle not found/i })).toBeInTheDocument();
  });
});
