import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ConditionSummary } from './ConditionSummary';

describe('ConditionSummary', () => {
  it('renders the placeholder copy and a "Placeholder" badge when no summary is provided', () => {
    render(<ConditionSummary />);
    expect(screen.getByText(/AI condition summary lands in story 1\.6/i)).toBeInTheDocument();
    expect(screen.getByText(/placeholder/i)).toBeInTheDocument();
  });

  it('renders the placeholder when summary is only whitespace', () => {
    render(<ConditionSummary summary="   " />);
    expect(screen.getByText(/AI condition summary lands in story 1\.6/i)).toBeInTheDocument();
    expect(screen.getByText(/placeholder/i)).toBeInTheDocument();
  });

  it('renders the actual summary and hides the placeholder badge when summary is non-empty', () => {
    render(<ConditionSummary summary="Light wear, drives clean, no mechanical flags." />);
    expect(screen.getByText('Light wear, drives clean, no mechanical flags.')).toBeInTheDocument();
    expect(screen.queryByText(/placeholder/i)).not.toBeInTheDocument();
  });
});
