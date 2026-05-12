import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CarFaxLink } from './CarFaxLink';

describe('CarFaxLink', () => {
  it('renders an outbound link to carfax.ca with the encoded VIN', () => {
    render(<CarFaxLink vin="2HGFC2F5XKH123456" />);
    const link = screen.getByRole('link', { name: /carfax canada/i });
    expect(link).toHaveAttribute('href', 'https://www.carfax.ca/vehicle-history/2HGFC2F5XKH123456');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('encodes special characters in the VIN', () => {
    render(<CarFaxLink vin="A B/C" />);
    const link = screen.getByRole('link', { name: /carfax canada/i });
    expect(link).toHaveAttribute('href', 'https://www.carfax.ca/vehicle-history/A%20B%2FC');
  });

  it('renders an unavailable notice (no link) when VIN is empty or whitespace', () => {
    render(<CarFaxLink vin="   " />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText(/lookup unavailable/i)).toBeInTheDocument();
  });
});
