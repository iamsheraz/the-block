import { useEffect, useState } from 'react';

type SearchBarProps = {
  value: string;
  onChange(next: string): void;
};

// The URL is the source of truth (see useFilters), but rendering a controlled
// input directly off the URL causes a flicker on fast typing under React's
// concurrent rendering — the input field appears to lag the cursor. We hold a
// local string for snappy keystrokes and propagate every change to the URL on
// the same render. The reverse-sync useEffect handles the rarer back/forward
// case where the URL changes from outside the input.
export function SearchBar({ value, onChange }: SearchBarProps) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  return (
    <div className="relative">
      <SearchIcon />
      <input
        type="search"
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          onChange(e.target.value);
        }}
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
