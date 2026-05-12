import { clsx } from 'clsx';
import { useEffect, useId, useRef } from 'react';
import { AUCTION_DURATION, MIN_BID_INCREMENT } from '../lib/constants';
import { classifyNote } from '../lib/damage';
import { formatCurrency, formatDuration } from '../lib/format';
import type { BidError, Vehicle } from '../types';

type ConfirmationView = { kind: 'confirm' } | { kind: 'error'; error: BidError };

type BidConfirmationModalProps = {
  vehicle: Vehicle;
  amount: number;
  now: number;
  view: ConfirmationView;
  submitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  onAdjust: (nextAmount: number) => void;
};

export function BidConfirmationModal(props: BidConfirmationModalProps) {
  const { vehicle, amount, now, view, submitting, onCancel, onConfirm, onAdjust } = props;
  const titleId = useId();
  const containerRef = useRef<HTMLDivElement>(null);

  // Move focus to the primary action on mount AND whenever the view transitions
  // (confirm ↔ error), since the primary action button is replaced. The
  // [data-autofocus] target moves between Confirm bid and Adjust bid; reading
  // view.kind makes the dependency explicit so the effect re-fires.
  useEffect(() => {
    void view.kind;
    const container = containerRef.current;
    if (!container) return;
    const focusables = container.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    const initial =
      container.querySelector<HTMLElement>('[data-autofocus]') ?? focusables[0] ?? null;
    initial?.focus();
  }, [view.kind]);

  // Trap Tab inside the modal until close. Lives in its own effect so the
  // listener isn't re-registered on every view change.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key !== 'Tab') return;
      const container = containerRef.current;
      if (!container) return;
      const list = Array.from(
        container.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (list.length === 0) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (!first || !last) return;
      const active = document.activeElement as HTMLElement | null;
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const auctionEnd = new Date(vehicle.auction_start).getTime() + AUCTION_DURATION;
  const msRemaining = auctionEnd - now;
  const auctionExpired = msRemaining <= 0;
  const hasCurrentBid = vehicle.current_bid !== null;
  const anchor: number = hasCurrentBid ? (vehicle.current_bid as number) : vehicle.starting_bid;
  const delta = amount - anchor;
  const reserveStatus = reserveLine(vehicle, amount);
  const worstNote = pickWorstNote(vehicle.damage_notes);
  const confirmDisabled = submitting || auctionExpired;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/55 px-4 py-12"
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        if (submitting) return;
        onCancel();
      }}
      onKeyDown={(event) => {
        if (event.key !== 'Escape') return;
        if (submitting) return;
        onCancel();
      }}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="w-full max-w-md rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/5"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 id={titleId} className="text-sm font-bold uppercase tracking-[0.16em] text-slate-900">
            {view.kind === 'error' ? 'Bid not placed' : 'Confirm your bid'}
          </h3>
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="grid h-8 w-8 place-items-center rounded-md text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>

        {view.kind === 'confirm' ? (
          <ConfirmBody
            vehicle={vehicle}
            amount={amount}
            anchor={anchor}
            anchorLabel={hasCurrentBid ? 'current bid' : 'starts at'}
            delta={delta}
            reserveStatus={reserveStatus}
            msRemaining={msRemaining}
            auctionExpired={auctionExpired}
            worstNote={worstNote}
          />
        ) : (
          <ErrorBody error={view.error} attemptedAmount={amount} />
        )}

        <div className="flex items-center justify-end gap-2 rounded-b-2xl border-t border-slate-100 bg-slate-50 px-6 py-4">
          {view.kind === 'confirm' ? (
            <>
              <button
                type="button"
                onClick={onCancel}
                disabled={submitting}
                className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={confirmDisabled}
                aria-disabled={confirmDisabled}
                aria-busy={submitting}
                data-autofocus
                className="inline-flex h-10 min-w-[8.5rem] items-center justify-center gap-2 rounded-md bg-slate-900 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500"
              >
                {submitting ? (
                  <>
                    <Spinner /> Placing bid…
                  </>
                ) : auctionExpired ? (
                  <>Auction ended</>
                ) : (
                  <>
                    <GavelIcon /> Confirm bid
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onCancel}
                className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                data-autofocus
                onClick={() => onAdjust(suggestedNextAmount(view.error, amount))}
                className="inline-flex h-10 items-center justify-center rounded-md bg-slate-900 px-5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
              >
                Adjust bid
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ConfirmBody(props: {
  vehicle: Vehicle;
  amount: number;
  anchor: number;
  anchorLabel: 'starts at' | 'current bid';
  delta: number;
  reserveStatus: ReserveStatus;
  msRemaining: number;
  auctionExpired: boolean;
  worstNote: string | null;
}) {
  const {
    vehicle,
    amount,
    anchor,
    anchorLabel,
    delta,
    reserveStatus,
    msRemaining,
    auctionExpired,
    worstNote,
  } = props;
  const trim = vehicle.trim ? ` ${vehicle.trim}` : '';
  const titleStatusLabel =
    vehicle.title_status === 'clean'
      ? 'Clean title'
      : vehicle.title_status === 'rebuilt'
        ? 'Rebuilt title'
        : 'Salvage title';

  return (
    <div className="px-6 py-5">
      <p className="text-sm font-semibold text-slate-900">
        {vehicle.year} {vehicle.make} {vehicle.model}
        {trim}
      </p>
      <p className="text-xs tabular-nums text-slate-500">
        Lot #{vehicle.lot} · {vehicle.odometer_km.toLocaleString('en-CA')} km · {titleStatusLabel}
      </p>

      <div className="my-5 h-px bg-slate-100" />

      <dl className="space-y-3 text-sm">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-slate-500">Your bid</dt>
          <dd className="text-xl font-bold tabular-nums text-slate-900">
            {formatCurrency(amount)}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-slate-500">
            vs. {anchorLabel}{' '}
            <span className="tabular-nums text-slate-700">{formatCurrency(anchor)}</span>
          </dt>
          <dd
            className={clsx(
              'inline-flex items-center gap-1 text-sm font-semibold tabular-nums',
              delta >= 0 ? 'text-emerald-700' : 'text-rose-700',
            )}
          >
            {delta >= 0 ? <ArrowUpIcon /> : <ArrowDownIcon />}
            {delta >= 0 ? '+' : '−'}
            {formatCurrency(Math.abs(delta))}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-slate-500">
            Reserve{' '}
            {vehicle.reserve_price !== null ? (
              <span className="tabular-nums text-slate-700">
                {formatCurrency(vehicle.reserve_price)}
              </span>
            ) : null}
          </dt>
          <dd className={clsx('text-sm font-medium', reserveStatus.tone)}>{reserveStatus.label}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-slate-500">Time remaining</dt>
          <dd
            className={clsx(
              'inline-flex items-center gap-1 text-sm font-medium tabular-nums',
              auctionExpired ? 'text-rose-700' : 'text-slate-700',
            )}
          >
            <ClockIcon />
            {formatDuration(msRemaining)}
          </dd>
        </div>
      </dl>

      {auctionExpired ? (
        <div
          role="status"
          aria-live="polite"
          className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-800"
        >
          This auction ended while you were deciding. Bidding is no longer available.
        </div>
      ) : null}

      {worstNote ? (
        <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3.5">
          <div className="flex items-start gap-2.5">
            <WarnIcon />
            <div className="text-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-900">
                Worst note on this vehicle
              </p>
              <p className="mt-1 font-medium text-slate-900">&ldquo;{worstNote}&rdquo;</p>
            </div>
          </div>
        </div>
      ) : null}

      <p className="mt-5 border-t border-slate-100 pt-4 text-xs text-slate-600">
        By placing this bid you commit to purchase if you win. Auction bids are binding — they
        cannot be retracted.
      </p>
    </div>
  );
}

function ErrorBody({ error, attemptedAmount }: { error: BidError; attemptedAmount: number }) {
  return (
    <div className="px-6 py-5">
      <div
        role="alert"
        aria-live="assertive"
        className="flex items-start gap-3 rounded-lg border border-red-100 bg-red-50 px-4 py-3.5"
      >
        <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full bg-red-600 text-white">
          <CloseIcon />
        </span>
        <div className="text-sm">
          <p className="font-bold text-red-900">{errorHeadline(error)}</p>
          <p className="mt-0.5 text-[13px] text-red-800">{errorDetail(error, attemptedAmount)}</p>
        </div>
      </div>
    </div>
  );
}

type ReserveStatus = { label: string; tone: string };

function reserveLine(vehicle: Vehicle, amount: number): ReserveStatus {
  if (vehicle.reserve_price === null) {
    return { label: 'No reserve', tone: 'text-slate-700' };
  }
  if (amount >= vehicle.reserve_price) {
    return { label: 'Above reserve', tone: 'text-emerald-700' };
  }
  const gap = vehicle.reserve_price - amount;
  return { label: `Below reserve by ${formatCurrency(gap)}`, tone: 'text-amber-700' };
}

function pickWorstNote(notes: string[]): string | null {
  if (notes.length === 0) return null;
  const mechanical = notes.find((note) => classifyNote(note) === 'mechanical');
  return mechanical ?? notes[0] ?? null;
}

function errorHeadline(error: BidError): string {
  switch (error.type) {
    case 'amount_too_low':
      return 'Someone bid first';
    case 'amount_too_high':
      return 'Bid exceeds maximum';
    case 'auction_not_live':
      return auctionStatusHeadline(error.status);
  }
}

function errorDetail(error: BidError, attemptedAmount: number): string {
  switch (error.type) {
    case 'amount_too_low': {
      const competing = error.min - MIN_BID_INCREMENT;
      return `Someone bid ${formatCurrency(competing)} first. Try ${formatCurrency(error.min)} or higher.`;
    }
    case 'amount_too_high':
      return `Bids cap at ${formatCurrency(error.max)}. Your bid of ${formatCurrency(attemptedAmount)} is over the limit.`;
    case 'auction_not_live':
      return auctionStatusDetail(error.status);
  }
}

function auctionStatusHeadline(status: 'upcoming' | 'ended'): string {
  switch (status) {
    case 'ended':
      return 'Auction has ended';
    case 'upcoming':
      return 'Auction has not started';
  }
}

function auctionStatusDetail(status: 'upcoming' | 'ended'): string {
  switch (status) {
    case 'ended':
      return 'This lot closed before your bid could be placed.';
    case 'upcoming':
      return 'This auction is not live yet.';
  }
}

function suggestedNextAmount(error: BidError, attemptedAmount: number): number {
  switch (error.type) {
    case 'amount_too_low':
      return error.min;
    case 'amount_too_high':
      return Math.min(attemptedAmount, error.max);
    case 'auction_not_live':
      return attemptedAmount;
  }
}

function CloseIcon() {
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
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function GavelIcon() {
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
      <path d="M14 2L20 8M9 7L13 11M5 11L9 15M3 21l4-4M14 2l8 8-4 4-8-8 4-4z" />
    </svg>
  );
}

function ArrowUpIcon() {
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
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  );
}

function ArrowDownIcon() {
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
      <line x1="12" y1="5" x2="12" y2="19" />
      <polyline points="19 12 12 19 5 12" />
    </svg>
  );
}

function ClockIcon() {
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
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15 14" />
    </svg>
  );
}

function WarnIcon() {
  return (
    <svg
      className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-700"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <circle cx="12" cy="17" r="0.6" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" opacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" strokeLinecap="round" />
    </svg>
  );
}
