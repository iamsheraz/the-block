import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SearchBar } from './SearchBar';

describe('SearchBar', () => {
  it('renders the current value', () => {
    render(<SearchBar value="Honda" onChange={() => {}} />);
    expect(screen.getByRole('searchbox', { name: /search/i })).toHaveValue('Honda');
  });

  it('fires onChange for every keystroke (no debounce at the URL boundary)', async () => {
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} />);

    const input = screen.getByRole('searchbox', { name: /search/i });
    await userEvent.type(input, 'abc');

    expect(onChange).toHaveBeenCalledTimes(3);
    expect(onChange).toHaveBeenNthCalledWith(1, 'a');
    expect(onChange).toHaveBeenNthCalledWith(2, 'ab');
    expect(onChange).toHaveBeenNthCalledWith(3, 'abc');
  });

  it('syncs back to a new external value (e.g. browser back button)', () => {
    const { rerender } = render(<SearchBar value="Honda" onChange={() => {}} />);
    rerender(<SearchBar value="Ford" onChange={() => {}} />);
    expect(screen.getByRole('searchbox', { name: /search/i })).toHaveValue('Ford');
  });
});
