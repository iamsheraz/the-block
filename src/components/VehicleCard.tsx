import { clsx } from 'clsx';
import { useState } from 'react';
import { Link } from 'react-router';
import { formatCurrency, formatMileage } from '../lib/format';
import type { Vehicle } from '../types';
import { ConditionBadge } from './ConditionBadge';
import { TimeChip } from './TimeChip';
import { TitleBadge } from './TitleBadge';

type VehicleCardProps = {
  vehicle: Vehicle;
  now: number;
};

export function VehicleCard({ vehicle, now }: VehicleCardProps) {
  const title = `${vehicle.year} ${vehicle.make} ${vehicle.model}${
    vehicle.trim ? ` ${vehicle.trim}` : ''
  }`;
  const currentBid = vehicle.current_bid;
  const hasBid = currentBid !== null;
  const priceAmount = hasBid ? currentBid : vehicle.starting_bid;
  const reserveNotMet =
    currentBid !== null && vehicle.reserve_price !== null && currentBid < vehicle.reserve_price;

  return (
    <Link
      to={`/vehicle/${vehicle.id}`}
      className="group block overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
      aria-label={title}
    >
      <div className="relative aspect-[4/3] bg-slate-800">
        <CardImage vehicle={vehicle} title={title} />
        <div className="absolute right-3 top-3">
          {vehicle.title_status === 'clean' ? (
            <ConditionBadge grade={vehicle.condition_grade} />
          ) : (
            <TitleBadge status={vehicle.title_status} />
          )}
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-[15px] font-semibold leading-tight text-slate-900">{title}</h3>
        <p className="mt-0.5 text-[13px] text-slate-500 tabular-nums">
          {formatMileage(vehicle.odometer_km)} · {provinceCode(vehicle.province)}
        </p>
        <div className="mt-3 border-t border-slate-100 pt-3">
          <p className="text-[12px] text-slate-500">{hasBid ? 'Current bid' : 'Starts at'}</p>
          <p className="mt-0.5 text-[18px] font-bold text-slate-900 tabular-nums">
            {formatCurrency(priceAmount)}
          </p>
          {reserveNotMet ? (
            <p className="mt-1 text-[12px] font-medium text-amber-700">Reserve not met</p>
          ) : null}
        </div>
        <div className="mt-3">
          <TimeChip vehicle={vehicle} now={now} />
        </div>
      </div>
    </Link>
  );
}

function CardImage({ vehicle, title }: { vehicle: Vehicle; title: string }) {
  const src = vehicle.images[0];
  const [errored, setErrored] = useState(false);

  if (!src || errored) {
    return (
      <div
        className={clsx(
          'flex h-full w-full items-end p-3',
          'bg-gradient-to-br from-slate-700 via-slate-800 to-slate-950',
        )}
        role="img"
        aria-label={`Image unavailable for ${title}`}
      >
        <span className="text-[11px] font-medium text-slate-300">{title}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={title}
      loading="lazy"
      className="h-full w-full object-cover"
      onError={() => setErrored(true)}
    />
  );
}

// Province strings in the dataset are full names ("Ontario"); cards display the
// two-letter code to keep the muted meta line short.
const PROVINCE_CODE: Record<string, string> = {
  Ontario: 'ON',
  Quebec: 'QC',
  'British Columbia': 'BC',
  Alberta: 'AB',
  Manitoba: 'MB',
  Saskatchewan: 'SK',
  'Nova Scotia': 'NS',
  'New Brunswick': 'NB',
  'Newfoundland and Labrador': 'NL',
  'Prince Edward Island': 'PE',
  'Northwest Territories': 'NT',
  Nunavut: 'NU',
  Yukon: 'YT',
};

function provinceCode(province: string): string {
  return PROVINCE_CODE[province] ?? province;
}
