import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LandingPage } from './LandingPage';

describe('LandingPage', () => {
  it('renders the heading', () => {
    render(<LandingPage />);
    expect(
      screen.getByRole('heading', { name: /the block — buyer auction prototype/i }),
    ).toBeDefined();
  });

  it('renders an unstyled list of 20 vehicles', () => {
    render(<LandingPage />);
    const list = screen.getByRole('list');
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(20);
  });

  it('each item shows year + make + model + a status label', () => {
    render(<LandingPage />);
    const items = screen.getAllByRole('listitem');
    for (const item of items) {
      const text = item.textContent ?? '';
      expect(text).toMatch(/\b\d{4}\b/); // year
      expect(text).toMatch(/—\s+(Upcoming|Live|Ended)$/); // status suffix
    }
  });
});
