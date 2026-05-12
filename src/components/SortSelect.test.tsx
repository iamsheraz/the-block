import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SortSelect } from './SortSelect';

describe('SortSelect', () => {
  it('renders the current value as selected', () => {
    render(<SortSelect value="price-low-high" onChange={() => {}} />);
    expect(screen.getByRole('combobox', { name: /sort/i })).toHaveValue('price-low-high');
  });

  it('lists every sort option in the dropdown', () => {
    render(<SortSelect value="ending-soon" onChange={() => {}} />);
    const labels = [
      'Ending soon',
      'Recently added',
      'Price: low to high',
      'Price: high to low',
      'Condition: best first',
    ];
    for (const label of labels) {
      expect(screen.getByRole('option', { name: label })).toBeInTheDocument();
    }
  });

  it('fires onChange with the selected SortKey', async () => {
    const onChange = vi.fn();
    render(<SortSelect value="ending-soon" onChange={onChange} />);

    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: /sort/i }),
      'condition-best-worst',
    );

    expect(onChange).toHaveBeenCalledWith('condition-best-worst');
  });
});
