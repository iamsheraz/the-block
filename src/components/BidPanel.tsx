import { useState } from 'react';
import { MIN_BID_INCREMENT } from '../lib/constants';
import { formatCurrency } from '../lib/format';
import type { Vehicle } from '../types';
import { CarFaxLink } from './CarFaxLink';
import { ConditionSummary } from './ConditionSummary';
import { TimeChip } from './TimeChip';

type BidPanelProps = {
  vehicle: Vehicle;
  now: number;
};

export function BidPanel({ vehicle, now }: BidPanelProps) {
  const [draft, setDraft] = useState('');
  const hasBid = vehicle.current_bid !== null;
  const minBid = hasBid ? (vehicle.current_bid ?? 0) + MIN_BID_INCREMENT : vehicle.starting_bid;

  return (
    <section
      aria-label="Bid panel"
      className="overflow-hidden rounded-xl border border-slate-200 bg-white"
    >
      <div className="grid grid-cols-1 lg:grid-cols-5">
        {/* Left: numbers + AI summary */}
        <div className="p-6 lg:col-span-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Bid panel
            </p>
            <TimeChip vehicle={vehicle} now={now} />
          </div>

          <div className="mt-4 grid grid-cols-3 gap-4 border-b border-slate-100 pb-5">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-slate-500">Starts at</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-slate-900">
                {formatCurrency(vehicle.starting_bid)}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-slate-500">Current bid</p>
              {hasBid ? (
                <>
                  <p className="mt-1 text-xl font-bold tabular-nums text-slate-900">
                    {formatCurrency(vehicle.current_bid ?? 0)}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {vehicle.bid_count} {vehicle.bid_count === 1 ? 'bid' : 'bids'}
                  </p>
                </>
              ) : (
                <>
                  <p className="mt-1 text-xl font-bold tabular-nums text-slate-400">—</p>
                  <p className="text-[11px] text-slate-500">No bids yet</p>
                </>
              )}
            </div>
            {vehicle.reserve_price !== null ? (
              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-500">Reserve</p>
                <p className="mt-1 text-xl font-bold tabular-nums text-slate-900">
                  {formatCurrency(vehicle.reserve_price)}
                </p>
                {hasBid && (vehicle.current_bid ?? 0) < vehicle.reserve_price ? (
                  <p className="text-[11px] font-medium text-amber-700">Not met</p>
                ) : null}
              </div>
            ) : (
              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-500">Reserve</p>
                <p className="mt-1 text-xl font-bold tabular-nums text-slate-400">None</p>
              </div>
            )}
          </div>

          <div className="mt-5">
            <ConditionSummary />
          </div>
        </div>

        {/* Right: bid action */}
        <div className="border-t border-slate-200 bg-slate-50 p-6 lg:col-span-2 lg:border-l lg:border-t-0">
          <label
            htmlFor="bid-input"
            className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-700"
          >
            Your bid
          </label>
          <div className="mt-2 flex">
            <span className="inline-flex items-center rounded-l-md border border-r-0 border-slate-300 bg-white px-3 text-sm font-medium text-slate-500">
              $
            </span>
            <input
              id="bid-input"
              type="text"
              inputMode="numeric"
              placeholder={minBid.toLocaleString('en-CA')}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="h-11 w-full rounded-r-md border border-slate-300 bg-white px-3 text-base font-semibold tabular-nums text-slate-900 placeholder:font-normal placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            />
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500 tabular-nums">
            Minimum bid {formatCurrency(minBid)} · increments {formatCurrency(MIN_BID_INCREMENT)}
          </p>

          <button
            type="button"
            disabled
            aria-disabled="true"
            className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            <GavelIcon />
            Place bid
          </button>
          <p className="mt-1.5 text-[11px] text-slate-400">Bid placement ships in story 1.5.</p>

          <div className="mt-4">
            <CarFaxLink vin={vehicle.vin} />
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
            Independent value verification. Opens in a new tab — never leaves the auction context.
          </p>
        </div>
      </div>
    </section>
  );
}

function GavelIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14 2L20 8M9 7L13 11M5 11L9 15M3 21l4-4M14 2l8 8-4 4-8-8 4-4z" />
    </svg>
  );
}
