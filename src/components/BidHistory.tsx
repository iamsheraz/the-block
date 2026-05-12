export function BidHistory() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        Your bid history · this vehicle
      </h3>
      <div className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
        <GavelIcon />
        <p className="mt-2 text-sm font-medium text-slate-700">No bids placed yet</p>
        <p className="mt-1 text-xs text-slate-500">Your bids on this lot will appear here.</p>
      </div>
    </div>
  );
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
