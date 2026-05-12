// Error boundaries are the one React primitive that still requires a class
// component through React 19. Documented exception to CLAUDE.md's
// "function components only" rule.
import { Component, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { hasError: boolean; isChunkError: boolean };

// Stale chunks after a deploy throw with these signatures across engines.
// Matching loosely so we render the chunk-friendly "Reload" CTA only when the
// failure looks like a missing/expired bundle, not for any thrown error.
function isChunkLoadError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  if (error.name === 'ChunkLoadError') return true;
  return (
    message.includes('loading chunk') ||
    message.includes('failed to fetch dynamically imported module') ||
    message.includes('importing a module script failed') ||
    message.includes('dynamically imported module')
  );
}

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false, isChunkError: false };

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, isChunkError: isChunkLoadError(error) };
  }

  reload = (): void => {
    // Hard reload pulls the new HTML and the fresh chunk graph. The chunk
    // error path always wants this; the generic error path uses the same
    // recovery to avoid a fancier branch we can't actually verify here.
    window.location.reload();
  };

  override render() {
    if (!this.state.hasError) return this.props.children;
    const { isChunkError } = this.state;
    return (
      <main className="mx-auto flex max-w-3xl flex-col items-center px-6 py-24 text-center">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-slate-900 text-white">
          <ReloadIcon />
        </span>
        <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          {isChunkError ? 'A newer version is available' : 'Something went wrong'}
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
          {isChunkError
            ? 'We updated The Block while you were here.'
            : 'We hit an error rendering this page.'}
        </h1>
        <p className="mt-2 max-w-md text-sm text-slate-600">
          {isChunkError
            ? 'Your tab is on an older bundle. Reload to pull the latest auction inventory and continue.'
            : 'Reloading usually clears it. Your bids are saved locally and will reappear after refresh.'}
        </p>
        <button
          type="button"
          onClick={this.reload}
          className="mt-6 inline-flex items-center gap-2 rounded-md bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
        >
          <ReloadIcon />
          Reload
        </button>
      </main>
    );
  }
}

function ReloadIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12a9 9 0 1 1-3-6.7" />
      <polyline points="21 4 21 10 15 10" />
    </svg>
  );
}
