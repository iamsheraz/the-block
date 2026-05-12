import type { SortKey } from '../types';

type SortSelectProps = {
  value: SortKey;
  onChange(next: SortKey): void;
};

const OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'ending-soon', label: 'Ending soon' },
  { value: 'recently-added', label: 'Recently added' },
  { value: 'price-low-high', label: 'Price: low to high' },
  { value: 'price-high-low', label: 'Price: high to low' },
  { value: 'condition-best-worst', label: 'Condition: best first' },
];

export function SortSelect({ value, onChange }: SortSelectProps) {
  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <span className="text-slate-500">Sort</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortKey)}
        aria-label="Sort vehicles"
        className="rounded-md border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700 hover:border-slate-300 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
      >
        {OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
