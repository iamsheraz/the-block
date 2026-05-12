import { clsx } from 'clsx';
import { AUCTION_DURATION, ENDING_SOON_THRESHOLD } from '../lib/constants';
import { type TimeRemainingInput, formatTimeRemaining } from '../lib/format';
import { getAuctionStatus } from '../lib/timestamps';
import type { Vehicle } from '../types';

type TimeChipProps = {
  vehicle: Vehicle;
  now: number;
};

type Tone = 'live' | 'ending-soon' | 'normal' | 'ended';

function deriveInput(vehicle: Vehicle, now: number): { input: TimeRemainingInput; tone: Tone } {
  const status = getAuctionStatus(vehicle, now);
  if (status === 'ended') return { input: { kind: 'ended' }, tone: 'ended' };

  const start = new Date(vehicle.auction_start).getTime();
  const end = start + AUCTION_DURATION;
  const msUntilEnd = end - now;

  if (status === 'live') {
    if (msUntilEnd <= ENDING_SOON_THRESHOLD) {
      return { input: { kind: 'remaining', ms: msUntilEnd }, tone: 'ending-soon' };
    }
    return { input: { kind: 'live' }, tone: 'live' };
  }

  // upcoming
  return { input: { kind: 'remaining', ms: msUntilEnd }, tone: 'normal' };
}

const TONE_CLASS: Record<Tone, string> = {
  live: 'bg-emerald-50 text-emerald-700 font-bold uppercase tracking-wider',
  'ending-soon': 'bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200 font-semibold',
  normal: 'bg-slate-100 text-slate-700 font-medium',
  ended: 'bg-slate-100 text-slate-400 font-medium',
};

export function TimeChip({ vehicle, now }: TimeChipProps) {
  const { input, tone } = deriveInput(vehicle, now);
  const label = formatTimeRemaining(input);

  return (
    <div
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px]',
        TONE_CLASS[tone],
      )}
    >
      {tone === 'live' ? (
        <span className="relative inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
      ) : (
        <ClockIcon />
      )}
      <span className="tabular-nums">{label}</span>
    </div>
  );
}

function ClockIcon() {
  return (
    <svg
      className="h-3.5 w-3.5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15 14" />
    </svg>
  );
}
