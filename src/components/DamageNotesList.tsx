import { classifyNote } from '../lib/damage';

type DamageNotesListProps = {
  notes: string[];
};

export function DamageNotesList({ notes }: DamageNotesListProps) {
  const body = notes.filter((n) => classifyNote(n) === 'body');
  const mechanical = notes.filter((n) => classifyNote(n) === 'mechanical');

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        Damage notes
      </h3>

      {notes.length === 0 ? (
        <p className="mt-4 text-sm text-slate-600">No damage notes on file for this lot.</p>
      ) : (
        <>
          {body.length > 0 ? (
            <Group title="Body-mapped" notes={body} dotClass="bg-amber-500" />
          ) : null}
          {mechanical.length > 0 ? (
            <Group title="Mechanical" notes={mechanical} dotClass="bg-amber-700" />
          ) : null}
        </>
      )}
    </div>
  );
}

function Group({
  title,
  notes,
  dotClass,
}: {
  title: string;
  notes: string[];
  dotClass: string;
}) {
  const seen = new Map<string, number>();
  const keyed = notes.map((note) => {
    const count = seen.get(note) ?? 0;
    seen.set(note, count + 1);
    return { note, key: `${note}#${count}` };
  });
  return (
    <div className="mt-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600">
        {title}
      </p>
      <ul className="mt-2 space-y-2 text-sm">
        {keyed.map((item) => (
          <li key={item.key} className="flex gap-2.5">
            <span
              className={`mt-1.5 inline-block h-2 w-2 flex-shrink-0 rounded-full ${dotClass}`}
            />
            <span className="text-slate-800">{item.note}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
