// Error boundaries are the one React primitive that still requires a class
// component (no hook equivalent through React 19). Documented framework
// exception to the "function components only" rule in CLAUDE.md.
import { Component, type ReactNode } from 'react';
import { Link } from 'react-router';

type Props = { children: ReactNode };
type State = { hasError: boolean };

export class DetailPageErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  override render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <main className="mx-auto max-w-3xl px-6 py-24 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Couldn&apos;t load this lot
        </p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
          Something went wrong loading the detail view.
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          The page module failed to load. This usually clears with a refresh.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Back to inventory
        </Link>
      </main>
    );
  }
}
