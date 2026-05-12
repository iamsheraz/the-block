import { classifyNote } from '../lib/damage';

type MechanicalConcernsProps = {
  notes: string[];
};

export function MechanicalConcerns({ notes }: MechanicalConcernsProps) {
  const seen = new Map<string, number>();
  const mechanical = notes
    .filter((n) => classifyNote(n) === 'mechanical')
    .map((note) => {
      const count = seen.get(note) ?? 0;
      seen.set(note, count + 1);
      return { note, key: `${note}#${count}` };
    });
  if (mechanical.length === 0) return null;

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-center gap-2">
        <WrenchIcon />
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-900">
          Mechanical concerns ({mechanical.length})
        </p>
      </div>
      <ul className="mt-2.5 space-y-1.5 text-[13px] text-slate-800">
        {mechanical.map((item) => (
          <li key={item.key} className="flex gap-2">
            <span className="mt-1.5 inline-block h-1 w-1 flex-shrink-0 rounded-full bg-amber-700" />
            <span>{item.note}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function WrenchIcon() {
  return (
    <svg
      className="h-4 w-4 text-amber-700"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-2.4 2.5-2.5z" />
    </svg>
  );
}
