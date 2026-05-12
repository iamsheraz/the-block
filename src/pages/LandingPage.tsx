import vehicles from '../../data/vehicles.json';

export function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-slate-900">
      <h1 className="text-center text-4xl font-semibold tracking-tight sm:text-5xl">
        The Block — Buyer auction prototype
      </h1>
      <p className="mt-4 text-lg text-slate-600">{vehicles.length} vehicles ready</p>
    </main>
  );
}
