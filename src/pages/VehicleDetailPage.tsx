import { Link, useParams } from 'react-router';

// Placeholder. Story 1.4 replaces this with the real detail view.
export function VehicleDetailPage() {
  const { id } = useParams();
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-slate-900">
      <Link to="/" className="text-sm text-slate-500 hover:text-slate-900">
        ← Back to inventory
      </Link>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight">Vehicle detail</h1>
      <p className="mt-2 text-sm text-slate-500 tabular-nums">Lot id: {id}</p>
      <p className="mt-6 text-sm text-slate-600">
        The detail page lands in story 1.4. For now, the route is wired so card clicks behave.
      </p>
    </main>
  );
}
