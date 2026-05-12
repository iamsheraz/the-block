import { useNow } from '../hooks/useNow';
import { useVehicles } from '../hooks/useVehicles';
import { getAuctionStatus } from '../lib/timestamps';
import type { AuctionStatus } from '../types';

const STATUS_LABEL: Record<AuctionStatus, string> = {
  upcoming: 'Upcoming',
  live: 'Live',
  ended: 'Ended',
};

export function LandingPage() {
  const now = useNow();
  const vehicles = useVehicles();
  const first20 = vehicles.slice(0, 20);

  return (
    <main className="flex min-h-screen flex-col items-center bg-slate-50 px-6 py-12 text-slate-900">
      <h1 className="text-center text-4xl font-semibold tracking-tight sm:text-5xl">
        The Block — Buyer auction prototype
      </h1>
      <p className="mt-4 text-lg text-slate-600">{vehicles.length} vehicles ready</p>

      <ul className="mt-10 w-full max-w-2xl list-disc space-y-1 pl-6 text-base">
        {first20.map((v) => (
          <li key={v.id}>
            {v.year} {v.make} {v.model} — {STATUS_LABEL[getAuctionStatus(v, now)]}
          </li>
        ))}
      </ul>
    </main>
  );
}
