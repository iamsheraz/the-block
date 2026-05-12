import { useEffect, useRef, useState } from 'react';

type SearchBarProps = {
  value: string;
  onChange(next: string): void;
};

const DEBOUNCE_MS = 200;

// The URL is the source of truth (see useFilters), but we hold a local string
// for snappy keystrokes and emit a debounced change so each character doesn't
// rewrite the URL on its own. setSearch in useFilters uses replace history
// semantics for the same reason — Back skips the typing burst entirely.
export function SearchBar({ value, onChange }: SearchBarProps) {
  const [draft, setDraft] = useState(value);
  const lastEmittedRef = useRef(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // If the URL changes from outside the input (Clear filters, back/forward,
  // shared link), pull the new value into the draft without an effect.
  if (value !== lastEmittedRef.current && value !== draft) {
    setDraft(value);
    lastEmittedRef.current = value;
  }

  useEffect(
    () => () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    },
    [],
  );

  function handleChange(next: string) {
    setDraft(next);
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      lastEmittedRef.current = next;
      onChange(next);
    }, DEBOUNCE_MS);
  }

  return (
    <div className="relative">
      <SearchIcon />
      <input
        type="search"
        value={draft}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Search make, model, VIN, lot #"
        aria-label="Search vehicles"
        className="h-12 w-full rounded-lg border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
      />
    </div>
  );
}

function SearchIcon() {
  return (
    <svg
      className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}
