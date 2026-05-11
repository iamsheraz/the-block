# ARCHITECTURE.md

System design for **The Block** — the buyer-side vehicle auction prototype. This doc captures the shape of the system, the choices made, and the alternatives considered.

---

## Context & Constraints

- Frontend-only SPA running against a committed 200-vehicle JSON dataset.
- No backend, no auth, no real concurrency in this slice.
- Desktop browsers are the primary target; mobile scales down responsively.
- The data layer is shaped so a real backend (Postgres, Supabase, anything else) drops in without touching consumers.

## Stack Decisions

| Choice | Alternative considered | Why |
|---|---|---|
| **React 19 + Vite + TypeScript (strict)** | Next.js, Remix | No server requirements; Vite's local dev loop is the fastest path. Strict TS catches typos in `Vehicle` field names before they become runtime bugs. |
| **Tailwind CSS** | MUI, Chakra, shadcn | Tailwind expresses spacing, type, and density taste without adopting a UI vocabulary. Components are hand-rolled so the visual identity stays owned in-repo. |
| **React Router v7** | Next.js routing, TanStack Router | Two routes (listing + detail) need a loader for the vehicle page and a `lazy` boundary for code-splitting. v7 covers both with no filesystem-routing overhead. |
| **Fuse.js** | Custom substring matcher | Typo-tolerant fuzzy search on make / model / trim, ~6KB. Cheap premium feel at 200-record scale. |
| **No global state library** | Redux, Zustand, Jotai | Filters live in the URL; bids live in localStorage; the rest is component state. There is no cross-cutting state that earns a store. |
| **`useSyncExternalStore`** | Context providers, Redux | Native React 18+ primitive for subscribing components to an external mutable source. Used for the shared clock and the bid data store. |
| **Vitest + React Testing Library** | Jest + RTL | Same API, native Vite integration, no separate config. Co-located `.test.tsx` per component. |
| **Playwright (smoke flows only)** | Cypress, no E2E | Headless-friendly in CI; scoped to 2–3 critical user flows. |
| **Biome** | ESLint + Prettier | Single tool, single config, faster CI. |
| **Vercel** | Netlify, GitHub Pages | Auto-deploy from `main`, preview deploys per PR, zero-config for Vite. |

## Data Model

### Core types

```ts
type Vehicle = {
  id: string;
  vin: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  body_style: string;
  // ... full shape matches data/vehicles.json
  condition_grade: number;          // 0–5
  damage_notes: string[];            // free-text; split body / mechanical at render
  title_status: 'clean' | 'rebuilt' | 'salvage';
  auction_start: string;             // ISO; normalized via median-anchor at load
  starting_bid: number;
  reserve_price: number | null;
  buy_now_price: number | null;
  current_bid: number | null;
  bid_count: number;
};

type Bid = {
  vehicleId: string;
  bidderId: string;
  amount: number;
  placedAt: string;                  // ISO
};

type BidError =
  | { type: 'amount_too_low'; min: number }
  | { type: 'amount_too_high'; max: number }
  | { type: 'auction_not_live'; status: 'upcoming' | 'ended' };

type BidResult =
  | { ok: true; bid: Bid }
  | { ok: false; error: BidError };
```

### The `dataStore` interface

A single module owns reads, writes, and subscriptions to vehicle / bid state:

```ts
interface DataStore {
  getVehicles(): Vehicle[];
  getVehicle(id: string): Vehicle | undefined;
  submitBid(input: { vehicleId: string; amount: number }): BidResult;
  subscribe(listener: () => void): () => void;
}
```

The localStorage implementation:

- Loads `data/vehicles.json` at module init and applies median-anchor timestamp normalization (see below).
- Layers a `Map<vehicleId, BidOverride>` over the base list so `current_bid` and `bid_count` reflect the buyer's own bids.
- Persists bids to localStorage under a single key, replayed on cold start.
- Notifies subscribers on every write.

Swapping in a real backend means writing a second implementation of the same interface — no consumer code changes.

### Median-anchor timestamp normalization

The committed dataset's `auction_start` timestamps are all in late March–early April 2026; rendered absolutely, every auction reads as "ended."

At module init the store:

1. Computes the median `auction_start` across all 200 vehicles.
2. Computes `offset = now − median`.
3. Adds `offset` to every vehicle's `auction_start` on the in-memory copy (the JSON file is never mutated).

Result: each demo run shows a balanced mix of upcoming / live / ended auctions centered on the current moment, with the spread the source data was designed around.

### Build-time AI enrichment

A `scripts/enrich.mjs` script runs Claude Haiku 4.5 once per vehicle, writing a two-sentence condition synopsis back into the committed JSON. Runs at build time, not at request time:

- No API keys in the client bundle.
- No third-party dependency at runtime.
- Idempotent: skips vehicles that already carry a summary; exits non-zero if coverage is incomplete.

## State Model

Four buckets, picked deliberately per concern.

| Bucket | What lives here | Why |
|---|---|---|
| **URL search params** | Filter values, sort key, search query | Shareable links, back-button correct, refresh-survivable. The URL is the source of truth for inventory state. |
| **localStorage** | Bidder ID, all bids placed by this bidder | Persists across reloads without a server. Bidder ID is a stable UUID generated on first visit. |
| **Component state** | Form drafts, modal open/closed, hover/focus | Ephemeral; nothing else needs to see it. |
| **Derived (no storage)** | Auction status, bid minimum, reserve-met flag, filtered list, time-remaining | Computing beats storing — eliminates a class of sync bugs. |

### Subscription pattern

Two external sources are subscribed via `useSyncExternalStore`:

- **`useNow()`** — a single `setInterval` ticking once per second, shared across every time-dependent surface (countdowns, auction badges, ending-soon strip).
- **`useVehicles()` / `useBids()`** — read through the `dataStore` and re-render on its subscribe callback.

Every component dependent on time or bid state goes through one of these two hooks. No component owns its own setInterval; no component reads localStorage directly.

## Folder Structure

```
src/
├── App.tsx                # router setup
├── main.tsx               # mount + StrictMode
├── types.ts               # Vehicle, Bid, BidError, FilterState, BidResult
├── data/
│   └── vehicles.json      # committed dataset, enriched at build time
├── lib/                   # pure logic + boundary modules
│   ├── constants.ts       # MIN_BID_INCREMENT, MAX_BID, AUCTION_DURATION, ...
│   ├── dataStore.ts       # DataStore interface + localStorage implementation
│   ├── timestamps.ts      # median-anchor normalization, auction status derivation
│   ├── filters.ts         # filter + sort + Fuse.js composition
│   ├── bids.ts            # validateBid (pure)
│   ├── damage.ts          # keyword → body-region mapping for the SVG diagram
│   └── format.ts          # currency, mileage, time-remaining formatters
├── hooks/
│   ├── useNow.ts
│   ├── useVehicles.ts
│   ├── useBids.ts
│   └── useFilters.ts      # URL ↔ FilterState
├── components/            # reusable UI; each with co-located .test.tsx
│   ├── VehicleCard.tsx
│   ├── FilterBar.tsx
│   ├── BidPanel.tsx
│   ├── DamageDiagram.tsx
│   ├── ConditionPanel.tsx
│   ├── ConditionSummary.tsx
│   ├── ImageGallery.tsx
│   ├── EndingSoonStrip.tsx
│   ├── AuctionBadge.tsx
│   ├── SiteHeader.tsx
│   ├── SearchBar.tsx
│   ├── SortSelect.tsx
│   └── ...
└── pages/
    ├── InventoryPage.tsx
    └── VehicleDetailPage.tsx   # lazy-loaded via React Router v7 `lazy`
```

Flat by intent. No `features/`, no `containers/` vs `components/`, no design-system folder. A reader opens this tree once and knows where everything lives.

## Bid Placement Flow

1. User types an amount into `BidPanel`; the draft lives in component state.
2. On submit, `BidPanel` calls `useBids().submitBid({ vehicleId, amount })`.
3. `useBids` delegates to `dataStore.submitBid()`, which runs `validateBid()` in `lib/bids.ts`:
   - `amount >= (current_bid + MIN_BID_INCREMENT)` — or `amount >= starting_bid` for the first bid
   - `amount <= MAX_BID`
   - Auction status (derived from `useNow()` + the normalized `auction_start`) is `live`
4. Validation failure returns a `BidError` discriminated union; `BidPanel` pattern-matches on `error.type` and renders the matching message.
5. Validation success: `dataStore` appends the bid to localStorage, updates the in-memory `BidOverride` map, and fires subscribers.
6. Every component reading through `useVehicles()` or `useBids()` re-renders with the new `current_bid` and `bid_count`.

No remote-write rollback path because no remote write can fail. When the store moves to a real backend, this flow grows a fail → revert step inside `dataStore.submitBid()` without touching `BidPanel` or any hook consumer.

## Out of Scope

Deliberate omissions for this slice:

- **Server-side rendering.** SPA only. The router exposes loader patterns if SSR becomes a requirement.
- **Real backend, real-time updates, multi-user concurrency.** The `dataStore` interface is the seam where a server-backed implementation lands.
- **Authentication and authorization.** No user accounts; one anonymous bidder per browser.
- **Internationalization.** English copy, CAD currency rendered as `$` (see PRODUCT.md "Content & Localization").
- **Build-time image optimization.** Dataset ships themed placeholder URLs; real photography would warrant a separate pipeline.
- **Analytics, telemetry, error reporting.** No SDK shipped. A production version would add a thin event dispatcher behind the same module boundaries.

## Risks & Known Compromises

- **Bids are device-local.** Two browsers don't see each other's bids. Production needs server-side persistence and atomic compare-and-set on `current_bid`.
- **No cross-tab fanout.** A bid placed in tab A doesn't appear in tab B without a manual refresh. A `storage` event listener could cover the cross-tab case in <30 lines if it becomes important.
- **Fuse.js threshold tuned by feel.** Not benchmarked against a curated query set. Acceptable at 200 records; a real catalog needs search-quality measurement.
- **Damage-region keyword mapping is heuristic.** Strings like "minor rust on wheel wells" map cleanly; ambiguous strings ("paint touch-up on hood") may render in the wrong region. The diagram is a v1 trust artifact, not a precision tool.
- **All filtered cards render in the DOM.** 200 cards is fine; `content-visibility: auto` keeps paint costs tolerable but the full list is in the tree. At ~2,000 rows the right shape is `?page=N` URL state plus a windowing strategy.
- **AI summaries can drift from the dataset.** Re-running `scripts/enrich.mjs` is the refresh path. CI does not currently gate on summary freshness; that's a follow-up.
- **One global clock tick re-renders every consumer.** `useNow()` ticks once per second and any subscribed component re-renders. For inventory grids of 200 cards this is cheap; if per-card live countdowns get heavier, `React.memo` plus a selector pattern will keep it bounded.
- **Module-level JSON import.** `vehicles.json` is bundled into the JS payload (~150–300KB depending on summary lengths). Acceptable; would migrate to a lazy fetch above ~1,000 records.
