import { clsx } from 'clsx';
import type { Vehicle } from '../types';

type SpecsGridProps = {
  vehicle: Vehicle;
};

export function SpecsGrid({ vehicle }: SpecsGridProps) {
  const rows: { label: string; value: string; mono?: boolean; tone?: 'clean' | 'flag' }[] = [
    { label: 'Engine', value: vehicle.engine },
    { label: 'Transmission', value: capitalize(vehicle.transmission) },
    { label: 'Drivetrain', value: vehicle.drivetrain },
    { label: 'Exterior color', value: vehicle.exterior_color },
    { label: 'Interior color', value: vehicle.interior_color },
    { label: 'Body style', value: capitalize(vehicle.body_style) },
    { label: 'Fuel type', value: capitalize(vehicle.fuel_type) },
    { label: 'VIN', value: vehicle.vin, mono: true },
    {
      label: 'Title',
      value: capitalize(vehicle.title_status),
      tone: vehicle.title_status === 'clean' ? 'clean' : 'flag',
    },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        Specs
      </h3>
      <dl className="mt-4 grid grid-cols-[140px_1fr] gap-y-2.5 text-sm">
        {rows.map((row) => (
          <Row key={row.label} {...row} />
        ))}
      </dl>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
  tone,
}: {
  label: string;
  value: string;
  mono?: boolean;
  tone?: 'clean' | 'flag';
}) {
  return (
    <>
      <dt className="text-slate-500">{label}</dt>
      <dd
        className={clsx(
          mono && 'font-mono tabular-nums',
          tone === 'clean' && 'text-emerald-700',
          tone === 'flag' && 'text-amber-700',
          !tone && 'text-slate-900',
        )}
      >
        {value}
      </dd>
    </>
  );
}

function capitalize(value: string): string {
  const first = value[0];
  if (!first) return value;
  return first.toUpperCase() + value.slice(1);
}
