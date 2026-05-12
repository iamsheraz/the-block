import { describe, expect, it } from 'vitest';
import { formatCurrency, formatMileage, formatTimeRemaining } from './format';

describe('formatCurrency', () => {
  it('renders whole dollars with a thousands separator and leading $', () => {
    expect(formatCurrency(14500)).toBe('$14,500');
    expect(formatCurrency(9800)).toBe('$9,800');
    expect(formatCurrency(1_250_000)).toBe('$1,250,000');
  });

  it('rounds fractional input to the nearest whole dollar', () => {
    expect(formatCurrency(14_499.6)).toBe('$14,500');
    expect(formatCurrency(14_500.4)).toBe('$14,500');
  });

  it('renders zero as $0', () => {
    expect(formatCurrency(0)).toBe('$0');
  });
});

describe('formatMileage', () => {
  it('adds a thousands separator and the km unit', () => {
    expect(formatMileage(84_210)).toBe('84,210 km');
    expect(formatMileage(142_500)).toBe('142,500 km');
    expect(formatMileage(0)).toBe('0 km');
  });

  it('rounds fractional kilometres', () => {
    expect(formatMileage(84_210.4)).toBe('84,210 km');
    expect(formatMileage(84_210.7)).toBe('84,211 km');
  });
});

describe('formatTimeRemaining', () => {
  it('returns LIVE for the live state', () => {
    expect(formatTimeRemaining({ kind: 'live' })).toBe('LIVE');
  });

  it('returns Ended for the ended state', () => {
    expect(formatTimeRemaining({ kind: 'ended' })).toBe('Ended');
  });

  it('returns Ended when remaining ms has elapsed', () => {
    expect(formatTimeRemaining({ kind: 'remaining', ms: 0 })).toBe('Ended');
    expect(formatTimeRemaining({ kind: 'remaining', ms: -1 })).toBe('Ended');
  });

  it('formats sub-hour remainders in minutes', () => {
    expect(formatTimeRemaining({ kind: 'remaining', ms: 18 * 60_000 })).toBe('Ends 18m');
    expect(formatTimeRemaining({ kind: 'remaining', ms: 45 * 60_000 })).toBe('Ends 45m');
  });

  it('shows <1m for sub-minute remainders', () => {
    expect(formatTimeRemaining({ kind: 'remaining', ms: 30_000 })).toBe('Ends <1m');
  });

  it('formats 1-24h remainders as hours and minutes', () => {
    expect(formatTimeRemaining({ kind: 'remaining', ms: 2 * 3_600_000 + 14 * 60_000 })).toBe(
      'Ends 2h 14m',
    );
    expect(formatTimeRemaining({ kind: 'remaining', ms: 12 * 3_600_000 + 4 * 60_000 })).toBe(
      'Ends 12h 4m',
    );
  });

  it('formats 1-7d remainders as days and hours', () => {
    expect(formatTimeRemaining({ kind: 'remaining', ms: 86_400_000 + 6 * 3_600_000 })).toBe(
      'Ends 1d 6h',
    );
    expect(formatTimeRemaining({ kind: 'remaining', ms: 3 * 86_400_000 + 12 * 3_600_000 })).toBe(
      'Ends 3d 12h',
    );
  });

  it('formats >=7d remainders in days', () => {
    expect(formatTimeRemaining({ kind: 'remaining', ms: 9 * 86_400_000 })).toBe('Ends 9d');
  });
});
