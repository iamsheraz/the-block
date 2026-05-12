import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { DetailPageSkeleton, InventoryGridSkeleton } from './components/Skeleton';

// Both pages are code-split. The detail page is the heavy route (image
// gallery, damage diagram, condition panel, bid flow); splitting inventory
// too lets the route-level ErrorBoundary catch chunk-load failures on either
// path after a deploy.
const InventoryPage = lazy(() =>
  import('./pages/InventoryPage').then((m) => ({ default: m.InventoryPage })),
);
const VehicleDetailPage = lazy(() =>
  import('./pages/VehicleDetailPage').then((m) => ({ default: m.VehicleDetailPage })),
);

export function App() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <div className="flex-1">
        <Routes>
          <Route
            path="/"
            element={
              <ErrorBoundary>
                <Suspense fallback={<InventoryGridSkeleton />}>
                  <InventoryPage />
                </Suspense>
              </ErrorBoundary>
            }
          />
          <Route
            path="/vehicle/:id"
            element={
              <ErrorBoundary>
                <Suspense fallback={<DetailPageSkeleton />}>
                  <VehicleDetailPage />
                </Suspense>
              </ErrorBoundary>
            }
          />
        </Routes>
      </div>
      <Footer />
    </div>
  );
}
