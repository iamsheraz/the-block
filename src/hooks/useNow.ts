import { useSyncExternalStore } from 'react';

// One module-scoped clock for the whole app. Ticks once per second while
// at least one component is subscribed; idle when nothing's listening.
// Owning this in a module (instead of per-component) means a grid of 200
// auction cards shares one setInterval, not 200.

let currentNow = Date.now();
const listeners = new Set<() => void>();
let intervalId: ReturnType<typeof setInterval> | null = null;

function start(): void {
  if (intervalId !== null) return;
  intervalId = setInterval(() => {
    currentNow = Date.now();
    for (const listener of listeners) listener();
  }, 1000);
}

function stop(): void {
  if (intervalId === null) return;
  clearInterval(intervalId);
  intervalId = null;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  start();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) stop();
  };
}

function getSnapshot(): number {
  return currentNow;
}

export function useNow(): number {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

// Test seam: lets tests drive the clock without owning the interval.
export const __clockInternals = {
  setNow(value: number): void {
    currentNow = value;
    for (const listener of listeners) listener();
  },
};
