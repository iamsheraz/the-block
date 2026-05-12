import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FilterBar } from './FilterBar';

function setup(overrides: Partial<React.ComponentProps<typeof FilterBar>> = {}) {
  const onMakesChange = vi.fn();
  const onBodyStylesChange = vi.fn();
  const onPriceMinChange = vi.fn();
  const onPriceMaxChange = vi.fn();

  render(
    <FilterBar
      makes={['Honda', 'Ford', 'Toyota']}
      bodyStyles={['Sedan', 'SUV', 'Truck']}
      selectedMakes={[]}
      selectedBodyStyles={[]}
      priceMin={null}
      priceMax={null}
      onMakesChange={onMakesChange}
      onBodyStylesChange={onBodyStylesChange}
      onPriceMinChange={onPriceMinChange}
      onPriceMaxChange={onPriceMaxChange}
      {...overrides}
    />,
  );

  return { onMakesChange, onBodyStylesChange, onPriceMinChange, onPriceMaxChange };
}

describe('FilterBar', () => {
  it('opens the make dropdown and reports a make selection', async () => {
    const { onMakesChange } = setup();
    await userEvent.click(screen.getByRole('button', { name: /^make/i }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Honda' }));
    expect(onMakesChange).toHaveBeenCalledWith(['Honda']);
  });

  it('toggles a selected make off', async () => {
    const { onMakesChange } = setup({ selectedMakes: ['Honda', 'Ford'] });
    await userEvent.click(screen.getByRole('button', { name: /make · 2/i }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Honda' }));
    expect(onMakesChange).toHaveBeenCalledWith(['Ford']);
  });

  it('shows body style chips with aria-pressed reflecting selection', () => {
    setup({ selectedBodyStyles: ['SUV'] });
    expect(screen.getByRole('button', { name: 'SUV', pressed: true })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sedan', pressed: false })).toBeInTheDocument();
  });

  it('toggles a body chip on click', async () => {
    const { onBodyStylesChange } = setup({ selectedBodyStyles: ['SUV'] });
    await userEvent.click(screen.getByRole('button', { name: 'Truck' }));
    expect(onBodyStylesChange).toHaveBeenCalledWith(['SUV', 'Truck']);
  });

  it('reports a price min change as a number', () => {
    const { onPriceMinChange } = setup();
    // fireEvent.change sets the input value directly, which avoids the
    // controlled-input snap-back issue userEvent.type runs into when the
    // parent doesn't echo the new value back into props.
    fireEvent.change(screen.getByLabelText(/minimum price/i), { target: { value: '10000' } });
    expect(onPriceMinChange).toHaveBeenLastCalledWith(10000);
  });

  it('reports null when the price input is cleared', async () => {
    const { onPriceMaxChange } = setup({ priceMax: 20000 });
    await userEvent.clear(screen.getByLabelText(/maximum price/i));
    expect(onPriceMaxChange).toHaveBeenLastCalledWith(null);
  });
});
