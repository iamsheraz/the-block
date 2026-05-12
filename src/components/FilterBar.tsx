import { clsx } from 'clsx';
import { useEffect, useRef, useState } from 'react';

type FilterBarProps = {
  makes: string[];
  bodyStyles: string[];
  selectedMakes: string[];
  selectedBodyStyles: string[];
  priceMin: number | null;
  priceMax: number | null;
  onMakesChange(next: string[]): void;
  onBodyStylesChange(next: string[]): void;
  onPriceMinChange(next: number | null): void;
  onPriceMaxChange(next: number | null): void;
};

export function FilterBar(props: FilterBarProps) {
  return (
    <>
      <MakeDropdown
        options={props.makes}
        selected={props.selectedMakes}
        onChange={props.onMakesChange}
      />
      <BodyChips
        options={props.bodyStyles}
        selected={props.selectedBodyStyles}
        onChange={props.onBodyStylesChange}
      />
      <PriceRange
        min={props.priceMin}
        max={props.priceMax}
        onMinChange={props.onPriceMinChange}
        onMaxChange={props.onPriceMaxChange}
      />
    </>
  );
}

type MakeDropdownProps = {
  options: string[];
  selected: string[];
  onChange(next: string[]): void;
};

function MakeDropdown({ options, selected, onChange }: MakeDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  // Click-outside to dismiss; Escape closes and restores focus to the trigger
  // so keyboard users have a symmetric way out.
  useEffect(() => {
    if (!open) return;
    function handleMouse(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener('mousedown', handleMouse);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleMouse);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  function toggle(option: string) {
    if (selected.includes(option)) onChange(selected.filter((m) => m !== option));
    else onChange([...selected, option]);
  }

  const label = selected.length === 0 ? 'Make' : `Make · ${selected.length}`;

  return (
    <div className="relative" ref={ref}>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={clsx(
          'inline-flex items-center gap-1.5 rounded-md border bg-white px-3 py-1.5 text-sm font-medium hover:border-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2',
          selected.length > 0
            ? 'border-slate-900 text-slate-900'
            : 'border-slate-200 text-slate-700',
        )}
      >
        {label}
        <Chevron />
      </button>
      {open ? (
        <div
          aria-label="Filter by make"
          className="absolute z-20 mt-1 max-h-72 w-56 overflow-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg"
        >
          {options.map((option) => {
            const checked = selected.includes(option);
            return (
              <label
                key={option}
                className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(option)}
                  className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                {option}
              </label>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

type BodyChipsProps = {
  options: string[];
  selected: string[];
  onChange(next: string[]): void;
};

function BodyChips({ options, selected, onChange }: BodyChipsProps) {
  function toggle(option: string) {
    if (selected.includes(option)) onChange(selected.filter((b) => b !== option));
    else onChange([...selected, option]);
  }
  return (
    <div className="inline-flex flex-wrap items-center gap-1.5" aria-label="Filter by body style">
      {options.map((option) => {
        const active = selected.includes(option);
        return (
          <button
            key={option}
            type="button"
            aria-pressed={active}
            onClick={() => toggle(option)}
            className={clsx(
              'inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2',
              active
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300',
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

type PriceRangeProps = {
  min: number | null;
  max: number | null;
  onMinChange(next: number | null): void;
  onMaxChange(next: number | null): void;
};

function PriceRange({ min, max, onMinChange, onMaxChange }: PriceRangeProps) {
  function parse(raw: string): number | null {
    if (raw.trim() === '') return null;
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 ? n : null;
  }
  return (
    <div className="inline-flex items-center gap-1.5 text-sm text-slate-700">
      <span className="text-slate-500">Price</span>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        step={100}
        value={min ?? ''}
        onChange={(e) => onMinChange(parse(e.target.value))}
        placeholder="min"
        aria-label="Minimum price"
        className="w-24 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm tabular-nums focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
      />
      <span className="text-slate-400">–</span>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        step={100}
        value={max ?? ''}
        onChange={(e) => onMaxChange(parse(e.target.value))}
        placeholder="max"
        aria-label="Maximum price"
        className="w-24 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm tabular-nums focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
      />
    </div>
  );
}

function Chevron() {
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
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
