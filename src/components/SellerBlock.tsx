type SellerBlockProps = {
  dealership: string;
  city: string;
  province: string;
};

export function SellerBlock({ dealership, city, province }: SellerBlockProps) {
  const initials = dealership
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        Seller
      </h3>
      <div className="mt-4 flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-lg bg-slate-900 text-sm font-bold text-white">
          {initials || '··'}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">{dealership}</p>
          <p className="text-xs text-slate-500">
            {city}, {province} · Wholesale dealer
          </p>
        </div>
      </div>
    </div>
  );
}
