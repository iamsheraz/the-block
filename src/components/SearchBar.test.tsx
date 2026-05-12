import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SearchBar } from './SearchBar';

describe('SearchBar', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the current value', () => {
    render(<SearchBar value="Honda" onChange={() => {}} />);
    expect(screen.getByRole('searchbox', { name: /search/i })).toHaveValue('Honda');
  });

  it('updates the input visually on every keystroke', () => {
    render(<SearchBar value="" onChange={() => {}} />);
    const input = screen.getByRole('searchbox', { name: /search/i }) as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'a' } });
    fireEvent.change(input, { target: { value: 'ab' } });
    fireEvent.change(input, { target: { value: 'abc' } });

    expect(input.value).toBe('abc');
  });

  it('debounces onChange to 200ms (single call with the final value)', () => {
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} />);
    const input = screen.getByRole('searchbox', { name: /search/i });

    fireEvent.change(input, { target: { value: 'a' } });
    fireEvent.change(input, { target: { value: 'ab' } });
    fireEvent.change(input, { target: { value: 'abc' } });

    expect(onChange).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('abc');
  });

  it('syncs back to a new external value (e.g. browser back button)', () => {
    const { rerender } = render(<SearchBar value="Honda" onChange={() => {}} />);
    rerender(<SearchBar value="Ford" onChange={() => {}} />);
    expect(screen.getByRole('searchbox', { name: /search/i })).toHaveValue('Ford');
  });
});
