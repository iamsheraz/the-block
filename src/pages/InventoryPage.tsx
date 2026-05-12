import { VehicleCard } from '../components/VehicleCard';
import { useNow } from '../hooks/useNow';
import { useVehicles } from '../hooks/useVehicles';

export function InventoryPage() {
  const vehicles = useVehicles();
  const now = useNow();

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Inventory</h1>
        <p className="mt-1 text-sm text-slate-500 tabular-nums">
          Showing <span className="font-semibold text-slate-900">{vehicles.length}</span> vehicles
        </p>
      </header>
      <section
        aria-label="Vehicle listings"
        className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
      >
        {vehicles.map((vehicle) => (
          <VehicleCard key={vehicle.id} vehicle={vehicle} now={now} />
        ))}
      </section>
    </main>
  );
}
