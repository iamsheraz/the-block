import { Link, useParams } from 'react-router';
import { BidHistory } from '../components/BidHistory';
import { BidPanel } from '../components/BidPanel';
import { ConditionHero } from '../components/ConditionHero';
import { DamageDiagram } from '../components/DamageDiagram';
import { DamageNotesList } from '../components/DamageNotesList';
import { ImageGallery } from '../components/ImageGallery';
import { MechanicalConcerns } from '../components/MechanicalConcerns';
import { SellerBlock } from '../components/SellerBlock';
import { SpecsGrid } from '../components/SpecsGrid';
import { useNow } from '../hooks/useNow';
import { useVehicles } from '../hooks/useVehicles';
import { formatMileage } from '../lib/format';
import type { Vehicle } from '../types';

export function VehicleDetailPage() {
  const { id } = useParams();
  const vehicles = useVehicles();
  const now = useNow();
  const vehicle = vehicles.find((v) => v.id === id);

  if (!vehicle) {
    return <NotFoundState />;
  }

  // Key on vehicle.id so navigating /vehicle/a → /vehicle/b resets internal
  // state in children (ImageGallery activeIndex/erroredIndices, BidPanel draft).
  return <DetailView key={vehicle.id} vehicle={vehicle} now={now} />;
}

function DetailView({ vehicle, now }: { vehicle: Vehicle; now: number }) {
  const title = `${vehicle.year} ${vehicle.make} ${vehicle.model}${
    vehicle.trim ? ` ${vehicle.trim}` : ''
  }`;

  return (
    <main className="mx-auto max-w-7xl px-6 py-6">
      <header className="mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900"
        >
          <BackArrow />
          Back to inventory
        </Link>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
          <span className="text-sm tabular-nums text-slate-500">Lot #{vehicle.lot}</span>
        </div>
        <p className="mt-1 text-sm text-slate-600">
          <span className="tabular-nums">{formatMileage(vehicle.odometer_km)}</span> ·{' '}
          {vehicle.province} · <TitleStatusInline status={vehicle.title_status} />
        </p>
      </header>

      {/* Above the fold: trust triptych */}
      <section aria-label="Above the fold" className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <ImageGallery images={vehicle.images} title={title} />
        </div>

        <div className="lg:col-span-2">
          <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-5">
            <ConditionHero grade={vehicle.condition_grade} />
            <DamageDiagram notes={vehicle.damage_notes} />
            <MechanicalConcerns notes={vehicle.damage_notes} />
          </div>
        </div>
      </section>

      <div className="mt-5">
        <BidPanel vehicle={vehicle} now={now} />
      </div>

      <FoldMarker />

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <SpecsGrid vehicle={vehicle} />
        <DamageNotesList notes={vehicle.damage_notes} />
      </section>

      <section className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <SellerBlock
          dealership={vehicle.selling_dealership}
          city={vehicle.city}
          province={vehicle.province}
        />
        <BidHistory vehicleId={vehicle.id} now={now} />
      </section>
    </main>
  );
}

function NotFoundState() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-24 text-center">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        Lot not found
      </p>
      <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
        That vehicle isn't on this block.
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        The lot id in the URL doesn't match anything in the current inventory. It may have been
        pulled, or the link may be wrong.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
      >
        <BackArrow /> Back to inventory
      </Link>
    </main>
  );
}

function TitleStatusInline({ status }: { status: Vehicle['title_status'] }) {
  switch (status) {
    case 'clean':
      return (
        <span className="inline-flex items-center gap-1 text-emerald-700">
          <CheckIcon /> Clean title
        </span>
      );
    case 'rebuilt':
      return <span className="font-semibold text-amber-700">Rebuilt title</span>;
    case 'salvage':
      return <span className="font-semibold text-red-700">Salvage title</span>;
    default: {
      const _exhaustive: never = status;
      void _exhaustive;
      return <span className="font-semibold text-slate-600">Title status unknown</span>;
    }
  }
}

function BackArrow() {
  return (
    <svg
      className="h-3.5 w-3.5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      className="h-3.5 w-3.5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 12l2 2 4-4" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}

function FoldMarker() {
  return (
    <div className="my-10 flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-slate-400">
      <span className="h-px flex-1 bg-slate-200" />
      <span>Below the fold</span>
      <span className="h-px flex-1 bg-slate-200" />
    </div>
  );
}
