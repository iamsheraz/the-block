// Display formatters for currency, mileage, and time remaining. Pure functions —
// no clock reads, no locale plumbing. CAD currency renders as `$` only (no code).

const NUMBER_FORMAT = new Intl.NumberFormat('en-CA', { maximumFractionDigits: 0 });

export function formatCurrency(amount: number): string {
  return `$${NUMBER_FORMAT.format(Math.round(amount))}`;
}

export function formatMileage(km: number): string {
  return `${NUMBER_FORMAT.format(Math.round(km))} km`;
}

export type TimeRemainingInput =
  | { kind: 'live' }
  | { kind: 'ended' }
  | { kind: 'remaining'; ms: number };

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

export function formatTimeRemaining(input: TimeRemainingInput): string {
  if (input.kind === 'live') return 'LIVE';
  if (input.kind === 'ended') return 'Ended';

  const { ms } = input;
  if (ms <= 0) return 'Ended';
  if (ms < MINUTE) return 'Ends <1m';
  if (ms < HOUR) return `Ends ${Math.floor(ms / MINUTE)}m`;
  if (ms < DAY) {
    const hours = Math.floor(ms / HOUR);
    const minutes = Math.floor((ms % HOUR) / MINUTE);
    return `Ends ${hours}h ${minutes}m`;
  }
  if (ms < WEEK) {
    const days = Math.floor(ms / DAY);
    const hours = Math.floor((ms % DAY) / HOUR);
    return `Ends ${days}d ${hours}h`;
  }
  return `Ends ${Math.floor(ms / DAY)}d`;
}
