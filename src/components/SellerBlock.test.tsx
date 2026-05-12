import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SellerBlock } from './SellerBlock';

describe('SellerBlock', () => {
  it('renders the dealership, city, and province', () => {
    render(<SellerBlock dealership="King City Auto" city="Toronto" province="Ontario" />);
    expect(screen.getByText('King City Auto')).toBeInTheDocument();
    expect(screen.getByText(/toronto, ontario/i)).toBeInTheDocument();
  });

  it('derives two-letter initials from the dealership name', () => {
    render(<SellerBlock dealership="King City Auto" city="Toronto" province="Ontario" />);
    expect(screen.getByText('KC')).toBeInTheDocument();
  });

  it('falls back to a placeholder glyph when the dealership is whitespace-only', () => {
    render(<SellerBlock dealership="   " city="Toronto" province="Ontario" />);
    expect(screen.getByText('··')).toBeInTheDocument();
  });
});
