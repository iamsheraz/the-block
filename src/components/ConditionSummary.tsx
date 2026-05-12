type ConditionSummaryProps = {
  summary?: string | null;
};

const PLACEHOLDER =
  'AI condition summary lands in story 1.6. Two sentences synthesizing grade, damage notes, and reconditioning expectations — no dollar figures, no value claims.';

export function ConditionSummary({ summary }: ConditionSummaryProps) {
  const text = summary?.trim() ? summary : PLACEHOLDER;
  const isPlaceholder = !summary?.trim();

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-slate-900 text-white">
          <SparklesIcon />
        </span>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-700">
          AI summary
        </p>
        {isPlaceholder ? (
          <span className="ml-1 rounded bg-slate-200 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-slate-600">
            Placeholder
          </span>
        ) : null}
      </div>
      <p className="mt-2.5 text-[14px] leading-relaxed text-slate-700">{text}</p>
    </div>
  );
}

function SparklesIcon() {
  return (
    <svg
      className="h-3 w-3"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3v3M12 18v3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M3 12h3M18 12h3M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
    </svg>
  );
}
