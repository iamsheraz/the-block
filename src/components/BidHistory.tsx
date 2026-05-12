import { useBidsForVehicle } from '../hooks/useBids';
import { formatCurrency } from '../lib/format';

type BidHistoryProps = {
  vehicleId: string;
  now: number;
};

export function BidHistory({ vehicleId, now }: BidHistoryProps) {
  const bids = useBidsForVehicle(vehicleId);
  const sorted = [...bids].sort(
    (a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime(),
  );

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        Your bid history · this vehicle
      </h3>
      {sorted.length === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
          <GavelIcon />
          <p className="mt-2 text-sm font-medium text-slate-700">No bids placed yet</p>
          <p className="mt-1 text-xs text-slate-500">Your bids on this lot will appear here.</p>
        </div>
      ) : (
        <ol className="mt-4 divide-y divide-slate-100">
          {sorted.map((bid) => (
            <li
              key={`${bid.placedAt}-${bid.bidderId}-${bid.amount}`}
              className="flex items-baseline justify-between gap-4 py-2.5"
            >
              <span className="text-sm font-semibold tabular-nums text-slate-900">
                {formatCurrency(bid.amount)}
              </span>
              <span className="text-xs tabular-nums text-slate-500">
                {formatRelativeTime(new Date(bid.placedAt).getTime(), now)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function formatRelativeTime(placedAt: number, now: number): string {
  const diff = Math.max(0, now - placedAt);
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'Just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

function GavelIcon() {
  return (
    <svg
      className="mx-auto h-5 w-5 text-slate-400"
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
