import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ConditionBadge } from './ConditionBadge';

describe('ConditionBadge', () => {
  it('renders the grade to one decimal place', () => {
    render(<ConditionBadge grade={4.2} />);
    expect(screen.getByText('4.2')).toBeInTheDocument();
  });

  it('pads an integer grade with a trailing decimal', () => {
    render(<ConditionBadge grade={4} />);
    expect(screen.getByText('4.0')).toBeInTheDocument();
  });

  it('exposes an accessible label for the grade', () => {
    render(<ConditionBadge grade={3.8} />);
    expect(screen.getByLabelText(/condition grade 3\.8 out of 5/i)).toBeInTheDocument();
  });
});
