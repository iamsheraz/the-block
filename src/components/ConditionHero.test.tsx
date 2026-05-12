import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ConditionHero, interpretGrade } from './ConditionHero';

describe('interpretGrade', () => {
  it('returns "Excellent" for 4.5 and above', () => {
    expect(interpretGrade(4.5)).toBe('Excellent');
    expect(interpretGrade(5)).toBe('Excellent');
  });

  it('returns "Above Average" for 3.5 to under 4.5', () => {
    expect(interpretGrade(4.2)).toBe('Above Average');
    expect(interpretGrade(3.5)).toBe('Above Average');
  });

  it('returns "Average" for 2.5 to under 3.5', () => {
    expect(interpretGrade(3)).toBe('Average');
    expect(interpretGrade(2.5)).toBe('Average');
  });

  it('returns "Below Average" for 1.5 to under 2.5', () => {
    expect(interpretGrade(2)).toBe('Below Average');
    expect(interpretGrade(1.5)).toBe('Below Average');
  });

  it('returns "Poor" for grades under 1.5', () => {
    expect(interpretGrade(1.4)).toBe('Poor');
    expect(interpretGrade(0)).toBe('Poor');
  });
});

describe('ConditionHero', () => {
  it('maps grade 4.2 to "Above Average"', () => {
    render(<ConditionHero grade={4.2} />);
    expect(screen.getByText('Above Average')).toBeInTheDocument();
    expect(screen.getByText('4.2')).toBeInTheDocument();
  });

  it('renders an integer grade with one decimal place', () => {
    render(<ConditionHero grade={4} />);
    expect(screen.getByText('4.0')).toBeInTheDocument();
  });

  it('exposes an accessible label for the grade', () => {
    render(<ConditionHero grade={3.8} />);
    expect(screen.getByLabelText(/condition grade 3\.8 out of 5/i)).toBeInTheDocument();
  });
});
