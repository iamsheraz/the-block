import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router';
import { DetailPageErrorBoundary } from './components/DetailPageErrorBoundary';
import { InventoryPage } from './pages/InventoryPage';

// Code-split the detail page so the inventory grid doesn't pay for it on load.
// React.lazy expects a default export; this module ships a named one, so we
// re-shape the import to expose it under the `default` key.
const VehicleDetailPage = lazy(() =>
  import('./pages/VehicleDetailPage').then((m) => ({ default: m.VehicleDetailPage })),
);

export function App() {
  return (
    <Routes>
      <Route path="/" element={<InventoryPage />} />
      <Route
        path="/vehicle/:id"
        element={
          <DetailPageErrorBoundary>
            <Suspense fallback={<DetailPageFallback />}>
              <VehicleDetailPage />
            </Suspense>
          </DetailPageErrorBoundary>
        }
      />
    </Routes>
  );
}

function DetailPageFallback() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
      <div className="mt-4 h-7 w-72 animate-pulse rounded bg-slate-200" />
      <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-5">
        <div className="aspect-[4/3] animate-pulse rounded-xl bg-slate-200 lg:col-span-3" />
        <div className="h-96 animate-pulse rounded-xl bg-slate-200 lg:col-span-2" />
      </div>
    </main>
  );
}
