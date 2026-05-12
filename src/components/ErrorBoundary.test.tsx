import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary';

function Boom({ message = 'kaboom' }: { message?: string }): null {
  throw new Error(message);
}

function ChunkBoom(): null {
  throw new Error('Loading chunk 42 failed.');
}

describe('ErrorBoundary', () => {
  // React logs the caught error to the console via the dev-mode error reporter.
  // Silence it here so the test output stays readable; the assertions still
  // verify recovery UI.
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });
  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('renders children when no error is thrown', () => {
    render(
      <ErrorBoundary>
        <p>safe content</p>
      </ErrorBoundary>,
    );
    expect(screen.getByText('safe content')).toBeInTheDocument();
  });

  it('renders the generic recovery CTA when a non-chunk error is thrown', () => {
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('heading', { name: /hit an error rendering/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reload/i })).toBeInTheDocument();
  });

  it('renders the deploy-aware copy when a chunk load failure bubbles up', () => {
    render(
      <ErrorBoundary>
        <ChunkBoom />
      </ErrorBoundary>,
    );
    expect(
      screen.getByRole('heading', { name: /updated the block while you were here/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reload/i })).toBeInTheDocument();
  });
});
