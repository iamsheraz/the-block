import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TitleBadge } from './TitleBadge';

describe('TitleBadge', () => {
  it('renders SALVAGE for a salvage title', () => {
    render(<TitleBadge status="salvage" />);
    expect(screen.getByText(/salvage/i)).toBeInTheDocument();
  });

  it('renders REBUILT for a rebuilt title', () => {
    render(<TitleBadge status="rebuilt" />);
    expect(screen.getByText(/rebuilt/i)).toBeInTheDocument();
  });
});
