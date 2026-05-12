import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DetailPageSkeleton, InventoryGridSkeleton } from './Skeleton';

describe('Skeleton', () => {
  it('renders an inventory grid skeleton announced as loading', () => {
    render(<InventoryGridSkeleton />);
    const region = screen.getByRole('main', { name: /loading inventory/i });
    expect(region).toBeInTheDocument();
    expect(region).toHaveAttribute('aria-busy', 'true');
  });

  it('renders a detail page skeleton with the triptych frame', () => {
    render(<DetailPageSkeleton />);
    const region = screen.getByRole('main', { name: /loading vehicle detail/i });
    expect(region).toBeInTheDocument();
    expect(region).toHaveAttribute('aria-busy', 'true');
  });
});
