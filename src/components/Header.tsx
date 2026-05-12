import { Link, useLocation } from 'react-router';
import { useNow } from '../hooks/useNow';
import { useVehicles } from '../hooks/useVehicles';
import { AUCTION_DURATION, ENDING_SOON_THRESHOLD } from '../lib/constants';
import { getAuctionStatus } from '../lib/timestamps';
import type { Vehicle } from '../types';

export function Header() {
  const { pathname } = useLocation();
  const showStatus = pathname === '/';

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        <Link
          to="/"
          aria-label="The Block — go to inventory"
          className="flex items-center gap-2.5 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
        >
          <span
            aria-hidden="true"
            className="grid h-7 w-7 place-items-center rounded bg-slate-900 text-[11px] font-bold text-white"
          >
            B
          </span>
          <span className="text-sm font-bold uppercase tracking-[0.18em] text-slate-900">
            The Block
          </span>
        </Link>

        {showStatus ? <BlockStatus /> : null}
      </div>
    </header>
  );
}

function BlockStatus() {
  const vehicles = useVehicles();
  const now = useNow();
  const { live, endingSoon } = countLots(vehicles, now);

  // Hide on narrow viewports so the bar stays a clean brand strip on mobile.
  return (
    <div
      aria-live="polite"
      className="hidden items-center gap-2 text-xs tabular-nums text-slate-500 sm:flex"
    >
      <span className="inline-flex items-center gap-1.5">
        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        <span>
          <span className="font-semibold text-slate-900">{live}</span> live
        </span>
      </span>
      {endingSoon > 0 ? (
        <>
          <span aria-hidden="true" className="text-slate-300">
            ·
          </span>
          <span className="font-semibold text-amber-700">{endingSoon} ending soon</span>
        </>
      ) : null}
    </div>
  );
}

function countLots(vehicles: Vehicle[], now: number): { live: number; endingSoon: number } {
  let live = 0;
  let endingSoon = 0;
  for (const v of vehicles) {
    if (getAuctionStatus(v, now) !== 'live') continue;
    live += 1;
    const remaining = new Date(v.auction_start).getTime() + AUCTION_DURATION - now;
    if (remaining > 0 && remaining < ENDING_SOON_THRESHOLD) endingSoon += 1;
  }
  return { live, endingSoon };
}
