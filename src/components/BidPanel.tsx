import { useEffect, useRef, useState } from 'react';
import { useBids } from '../hooks/useBids';
import { MAX_BID, MIN_BID_INCREMENT } from '../lib/constants';
import { formatCurrency } from '../lib/format';
import { getAuctionStatus } from '../lib/timestamps';
import type { BidError, Vehicle } from '../types';
import { BidConfirmationModal } from './BidConfirmationModal';
import { CarFaxLink } from './CarFaxLink';
import { ConditionSummary } from './ConditionSummary';
import { TimeChip } from './TimeChip';

type BidPanelProps = {
  vehicle: Vehicle;
  now: number;
};

type FlowState =
  | { kind: 'idle' }
  | { kind: 'confirming'; amount: number }
  | { kind: 'submitting'; amount: number }
  | { kind: 'submitError'; amount: number; error: BidError }
  | { kind: 'success'; amount: number };

export function BidPanel({ vehicle, now }: BidPanelProps) {
  const [draft, setDraft] = useState('');
  const [flow, setFlow] = useState<FlowState>({ kind: 'idle' });
  const placeBidRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const successDismissRef = useRef<HTMLButtonElement>(null);
  // Guards against double-fire of submitBid before the React state flip to
  // `submitting` propagates to the disabled prop on the Confirm button.
  const submittingRef = useRef(false);
  const { submitBid } = useBids();

  const hasBid = vehicle.current_bid !== null;
  const minBid = hasBid ? (vehicle.current_bid ?? 0) + MIN_BID_INCREMENT : vehicle.starting_bid;
  const auctionStatus = getAuctionStatus(vehicle, now);
  const auctionLive = auctionStatus === 'live';

  const parsedAmount = parseAmount(draft);
  const inlineError = deriveInlineError({
    draft,
    parsed: parsedAmount,
    minBid,
    auctionStatus,
  });
  const canSubmit = parsedAmount !== null && inlineError === null && auctionLive;

  // When the modal closes, restore focus. On `idle` close we go back to the
  // Place Bid trigger that opened the modal. On `success` the form is unmounted
  // and replaced by SuccessPanel — focus its "Place another bid" button instead
  // so keyboard / screen-reader users land somewhere meaningful.
  const previousFlow = useRef<FlowState['kind']>(flow.kind);
  useEffect(() => {
    const prev = previousFlow.current;
    const isOpen =
      flow.kind === 'confirming' || flow.kind === 'submitting' || flow.kind === 'submitError';
    const wasOpen = prev === 'confirming' || prev === 'submitting' || prev === 'submitError';
    if (wasOpen && !isOpen) {
      if (flow.kind === 'success') {
        // SuccessPanel is mounted on the next paint; defer the focus call.
        queueMicrotask(() => successDismissRef.current?.focus());
      } else {
        placeBidRef.current?.focus();
      }
    }
    previousFlow.current = flow.kind;
  }, [flow.kind]);

  function openConfirmation(): void {
    if (parsedAmount === null) return;
    // Fresh flow — clear the double-submit latch.
    submittingRef.current = false;
    setFlow({ kind: 'confirming', amount: parsedAmount });
  }

  function handleConfirm(): void {
    if (flow.kind !== 'confirming') return;
    // Synchronous double-click guard. React's setFlow disable on the Confirm
    // button doesn't take effect within the same event-loop tick, so a rapid
    // second click can re-enter this handler with flow.kind still 'confirming'.
    // The latch stays held until the flow returns to 'idle' / 'confirming'.
    if (submittingRef.current) return;
    submittingRef.current = true;
    const amount = flow.amount;
    setFlow({ kind: 'submitting', amount });
    const result = submitBid({ vehicleId: vehicle.id, amount });
    if (result.ok) {
      setDraft('');
      setFlow({ kind: 'success', amount: result.bid.amount });
    } else {
      setFlow({ kind: 'submitError', amount, error: result.error });
    }
  }

  function handleCancel(): void {
    submittingRef.current = false;
    setFlow({ kind: 'idle' });
  }

  function handleAdjust(nextAmount: number): void {
    submittingRef.current = false;
    setDraft(String(nextAmount));
    setFlow({ kind: 'idle' });
    // Defer focus so the input is back in the layout when we call it.
    queueMicrotask(() => inputRef.current?.focus());
  }

  function dismissSuccess(): void {
    submittingRef.current = false;
    setFlow({ kind: 'idle' });
  }

  const modalOpen =
    flow.kind === 'confirming' || flow.kind === 'submitting' || flow.kind === 'submitError';

  return (
    <section
      aria-label="Bid panel"
      className="overflow-hidden rounded-xl border border-slate-200 bg-white"
    >
      <div className="grid grid-cols-1 lg:grid-cols-5">
        <div className="p-6 lg:col-span-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Bid panel
            </p>
            <TimeChip vehicle={vehicle} now={now} />
          </div>

          <div className="mt-4 grid grid-cols-3 gap-4 border-b border-slate-100 pb-5">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-slate-500">Starts at</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-slate-900">
                {formatCurrency(vehicle.starting_bid)}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-slate-500">Current bid</p>
              {hasBid ? (
                <>
                  <p className="mt-1 text-xl font-bold tabular-nums text-slate-900">
                    {formatCurrency(vehicle.current_bid ?? 0)}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {vehicle.bid_count} {vehicle.bid_count === 1 ? 'bid' : 'bids'}
                  </p>
                </>
              ) : (
                <>
                  <p className="mt-1 text-xl font-bold tabular-nums text-slate-400">—</p>
                  <p className="text-[11px] text-slate-500">No bids yet</p>
                </>
              )}
            </div>
            {vehicle.reserve_price !== null ? (
              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-500">Reserve</p>
                <p className="mt-1 text-xl font-bold tabular-nums text-slate-900">
                  {formatCurrency(vehicle.reserve_price)}
                </p>
                {hasBid && (vehicle.current_bid ?? 0) < vehicle.reserve_price ? (
                  <p className="text-[11px] font-medium text-amber-700">Not met</p>
                ) : hasBid && (vehicle.current_bid ?? 0) >= vehicle.reserve_price ? (
                  <p className="text-[11px] font-medium text-emerald-700">Reserve met</p>
                ) : null}
              </div>
            ) : (
              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-500">Reserve</p>
                <p className="mt-1 text-xl font-bold tabular-nums text-slate-400">None</p>
              </div>
            )}
          </div>

          <div className="mt-5">
            <ConditionSummary />
          </div>
        </div>

        <div className="border-t border-slate-200 bg-slate-50 p-6 lg:col-span-2 lg:border-l lg:border-t-0">
          {flow.kind === 'success' ? (
            <SuccessPanel
              vehicle={vehicle}
              amount={flow.amount}
              onDismiss={dismissSuccess}
              dismissRef={successDismissRef}
            />
          ) : (
            <BidForm
              draft={draft}
              setDraft={setDraft}
              minBid={minBid}
              inlineError={inlineError}
              canSubmit={canSubmit}
              auctionLive={auctionLive}
              onPlace={openConfirmation}
              inputRef={inputRef}
              placeBidRef={placeBidRef}
            />
          )}

          <div className="mt-4">
            <CarFaxLink vin={vehicle.vin} />
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
            Independent value verification. Opens in a new tab — never leaves the auction context.
          </p>
        </div>
      </div>

      {modalOpen ? (
        <BidConfirmationModal
          vehicle={vehicle}
          amount={flow.amount}
          now={now}
          view={
            flow.kind === 'submitError' ? { kind: 'error', error: flow.error } : { kind: 'confirm' }
          }
          submitting={flow.kind === 'submitting'}
          onCancel={handleCancel}
          onConfirm={handleConfirm}
          onAdjust={handleAdjust}
        />
      ) : null}
    </section>
  );
}

type BidFormProps = {
  draft: string;
  setDraft: (value: string) => void;
  minBid: number;
  inlineError: string | null;
  canSubmit: boolean;
  auctionLive: boolean;
  onPlace: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  placeBidRef: React.RefObject<HTMLButtonElement | null>;
};

function BidForm(props: BidFormProps) {
  const {
    draft,
    setDraft,
    minBid,
    inlineError,
    canSubmit,
    auctionLive,
    onPlace,
    inputRef,
    placeBidRef,
  } = props;
  return (
    <>
      <label
        htmlFor="bid-input"
        className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-700"
      >
        Your bid
      </label>
      <div className="mt-2 flex">
        <span className="inline-flex items-center rounded-l-md border border-r-0 border-slate-300 bg-white px-3 text-sm font-medium text-slate-500">
          $
        </span>
        <input
          id="bid-input"
          ref={inputRef}
          type="text"
          inputMode="numeric"
          placeholder={minBid.toLocaleString('en-CA')}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          aria-invalid={inlineError !== null}
          aria-describedby={inlineError ? 'bid-input-error' : 'bid-input-hint'}
          className="h-11 w-full rounded-r-md border border-slate-300 bg-white px-3 text-base font-semibold tabular-nums text-slate-900 placeholder:font-normal placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 aria-[invalid=true]:border-rose-400"
        />
      </div>
      {inlineError ? (
        <p id="bid-input-error" className="mt-1.5 text-[11px] font-medium text-rose-700">
          {inlineError}
        </p>
      ) : (
        <p id="bid-input-hint" className="mt-1.5 text-[11px] text-slate-500 tabular-nums">
          Minimum bid {formatCurrency(minBid)} · increments {formatCurrency(MIN_BID_INCREMENT)}
        </p>
      )}

      <button
        type="button"
        ref={placeBidRef}
        onClick={onPlace}
        disabled={!canSubmit}
        aria-disabled={!canSubmit}
        className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        <GavelIcon />
        Place bid
      </button>
      {!auctionLive ? (
        <p className="mt-1.5 text-[11px] text-slate-500">
          Bidding is only available while the auction is live.
        </p>
      ) : null}
    </>
  );
}

function SuccessPanel({
  vehicle,
  amount,
  onDismiss,
  dismissRef,
}: {
  vehicle: Vehicle;
  amount: number;
  onDismiss: () => void;
  dismissRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const reserveLine = (() => {
    if (vehicle.reserve_price === null) return 'No reserve.';
    if (amount >= vehicle.reserve_price) return 'Above reserve — winning bid pending close.';
    const gap = vehicle.reserve_price - amount;
    return `Below reserve by ${formatCurrency(gap)} — marker placed.`;
  })();

  return (
    <output
      aria-live="polite"
      className="block overflow-hidden rounded-lg border border-emerald-200 bg-white"
    >
      <div className="flex items-start gap-3 border-b border-emerald-100 bg-emerald-50 px-4 py-3">
        <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-full bg-emerald-600 text-white">
          <CheckIcon />
        </span>
        <div>
          <p className="text-sm font-bold text-emerald-900">
            Bid placed: <span className="tabular-nums">{formatCurrency(amount)}</span>
          </p>
          <p className="mt-0.5 text-[12px] text-emerald-800">You&apos;re the high bidder.</p>
        </div>
      </div>
      <div className="px-4 py-3 text-sm text-slate-700">
        <p>{reserveLine}</p>
        <button
          ref={dismissRef}
          type="button"
          onClick={onDismiss}
          className="mt-3 inline-flex h-9 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100"
        >
          Place another bid
        </button>
      </div>
    </output>
  );
}

function parseAmount(draft: string): number | null {
  const cleaned = draft.replace(/[\s,$]/g, '');
  if (cleaned === '') return null;
  if (!/^\d+$/.test(cleaned)) return null;
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

type InlineErrorInput = {
  draft: string;
  parsed: number | null;
  minBid: number;
  auctionStatus: ReturnType<typeof getAuctionStatus>;
};

function deriveInlineError(input: InlineErrorInput): string | null {
  if (input.draft.trim() === '') return null;
  if (input.auctionStatus === 'ended') return 'This auction has ended.';
  if (input.auctionStatus === 'upcoming') return 'This auction has not started yet.';
  if (input.parsed === null) return 'Enter a whole-dollar amount.';
  if (input.parsed < input.minBid) {
    return `Minimum bid is ${formatCurrency(input.minBid)}.`;
  }
  if (input.parsed > MAX_BID) {
    return `Bids cap at ${formatCurrency(MAX_BID)}.`;
  }
  return null;
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

function CheckIcon() {
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
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
