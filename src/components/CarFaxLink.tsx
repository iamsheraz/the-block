type CarFaxLinkProps = {
  vin: string;
};

export function CarFaxLink({ vin }: CarFaxLinkProps) {
  const href = `https://www.carfax.ca/vehicle-history/${encodeURIComponent(vin)}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2.5 text-[13px] text-slate-700 transition hover:border-slate-300"
    >
      <span>
        View market value on <span className="font-semibold">CarFax Canada</span>
      </span>
      <ArrowUpRight />
    </a>
  );
}

function ArrowUpRight() {
  return (
    <svg
      className="h-3.5 w-3.5 text-slate-400"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 17L17 7M7 7h10v10" />
    </svg>
  );
}
