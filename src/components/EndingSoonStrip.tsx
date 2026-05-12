import { Link } from 'react-router';
import { AUCTION_DURATION, ENDING_SOON_THRESHOLD } from '../lib/constants';
import { getAuctionStatus } from '../lib/timestamps';
import type { Vehicle } from '../types';

type EndingSoonStripProps = {
  vehicles: Vehicle[];
  now: number;
};

const MAX = 5;

function timeRemaining(vehicle: Vehicle, now: number): number {
  return new Date(vehicle.auction_start).getTime() + AUCTION_DURATION - now;
}

function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Picks live auctions in the last hour, sorted soonest first, capped at five.
// Independent of the page's active filter — the strip is a global urgency
// surface, not a filtered slice. The threshold is strict (< not <=) per AC6.
function selectEndingSoon(vehicles: Vehicle[], now: number): Vehicle[] {
  return vehicles
    .filter((v) => getAuctionStatus(v, now) === 'live')
    .map((v) => ({ v, remaining: timeRemaining(v, now) }))
    .filter(({ remaining }) => remaining > 0 && remaining < ENDING_SOON_THRESHOLD)
    .sort((a, b) => a.remaining - b.remaining)
    .slice(0, MAX)
    .map(({ v }) => v);
}

export function EndingSoonStrip({ vehicles, now }: EndingSoonStripProps) {
  const items = selectEndingSoon(vehicles, now);
  if (items.length === 0) return null;

  return (
    <section className="mb-8" aria-label="Ending soon">
      <div className="mb-3 flex items-center gap-2">
        <AlarmIcon />
        <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-700">
          Ending soon
        </h2>
        <span className="text-xs text-slate-400">· next hour</span>
      </div>
      <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
        {items.map((vehicle) => (
          <EndingSoonCard key={vehicle.id} vehicle={vehicle} now={now} />
        ))}
      </div>
    </section>
  );
}

function EndingSoonCard({ vehicle, now }: { vehicle: Vehicle; now: number }) {
  const remaining = timeRemaining(vehicle, now);
  const title = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  return (
    <Link
      to={`/vehicle/${vehicle.id}`}
      aria-label={`${title}, ends in ${formatCountdown(remaining)}`}
      className="group block min-w-[140px] flex-shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white transition hover:border-slate-300 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
    >
      <div className="relative flex aspect-[4/3] items-end bg-gradient-to-br from-slate-700 via-slate-800 to-slate-950 p-2 text-white">
        <span className="text-[10px] font-medium text-slate-300">{title}</span>
      </div>
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-[11px] text-slate-500">Ends</span>
        <span className="text-sm font-semibold tabular-nums text-amber-700">
          {formatCountdown(remaining)}
        </span>
      </div>
    </Link>
  );
}

function AlarmIcon() {
  return (
    <svg
      className="h-4 w-4 text-amber-600"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l2 2" />
      <path d="M5 3 2 6" />
      <path d="m22 6-3-3" />
    </svg>
  );
}
