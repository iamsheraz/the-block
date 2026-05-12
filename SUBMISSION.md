# The Block — submission

A buyer-side vehicle auction prototype for OPENLANE's coding challenge.

**Live:** _set after first Vercel deploy_

## How to Run

```bash
npm install
npm run dev          # http://localhost:5173
npm run verify       # typecheck + lint + tests + build
npm run test:e2e     # Playwright smoke flows
```

A `Dockerfile` and `docker-compose.yml` ship in the repo for anyone who doesn't want to manage a local Node — `docker compose up` brings the dev server up on the same port. See [README → Run with Docker](README.md#run-with-docker-optional).

No backend, no auth, no `.env` required to browse and bid. The 200-vehicle dataset at `data/vehicles.json` is committed and enriched at build time.

## Time Spent

Roughly **14 hours over 5 days**, paced against an eight-story epic (`stories/1.0` through `stories/1.7`). Estimates and the daily cadence live in [STORIES.md](STORIES.md). Each story landed as its own commit with a "how to verify (UI)" checklist; no story shipped without a visible change in the running app.

I treated the brief's 4–8 hour suggestion as a floor and spent the extra budget on three places I thought would move the evaluator's read of the work: the vehicle detail page's trust triptych, the build-time AI enrichment pipeline with a compliance-safe prompt, and the documentation bundle (PRODUCT / ARCHITECTURE / UX / STORIES) that lets a reviewer follow the reasoning without my voice in the room.

## Assumptions and Scope

The full list is in [PRODUCT.md → Assumptions](PRODUCT.md#assumptions). Headline calls:

- **Frontend-only against the committed JSON dataset.** No backend, no auth, no real concurrency. Data access lives behind a `dataStore` interface so a server-backed implementation slots in without touching any consumer code.
- **Anonymous browser as bidder.** No accounts; each browser is one bidder, identified via a stable ID in localStorage.
- **Bids are device-local and permanent.** Two browsers don't see each other's bids. No retraction after placement (matches a legally binding wholesale context).
- **Auction timestamps normalized via median-anchor offset.** The dataset's `auction_start` values are all in late March / early April 2026; without normalization every auction reads as "ended." The JSON on disk is never mutated.
- **CAD currency rendered as `$`.** English only.
- **AI condition summary at build time, not runtime.** Compliance-safe prompt: no dollar amounts, no repair estimates, no resale predictions. CI gates on summary coverage.

Out-of-scope items and their reasons are spelled out in [PRODUCT.md → Out of Scope](PRODUCT.md#out-of-scope-with-reasoning) — seller workflows, payments, real-time bidding, watchlist, proxy/max-bid bidding, and i18n.

## Stack

- **Frontend:** React 19 · Vite · TypeScript (strict) · Tailwind 4 · React Router v7 · Fuse.js · `useSyncExternalStore` for external subscriptions.
- **AI enrichment:** Claude Haiku 4.5 via `@anthropic-ai/sdk`, called once per vehicle by `scripts/enrich.mjs` at build time.
- **Tests:** Vitest + React Testing Library (co-located unit tests) · Playwright (two smoke flows) · Biome (lint + format).
- **Hosting:** Vercel from `main`; GitHub Actions CI runs `verify` then `test:e2e`.
- **Backend:** _none_ — localStorage-backed `dataStore` is the swap-target for a real service.
- **Database:** _none_.

Rationale for each pick is in [ARCHITECTURE.md → Stack Decisions](ARCHITECTURE.md#stack-decisions).

## What I Built

The user is a wholesale dealer scanning inventory after-hours with under sixty seconds per vehicle. Three screens drive the buyer journey:

1. **Inventory grid** — URL-synced filters (make, body, price range), fuzzy search, ending-soon strip above the grid for urgency, conditional price copy that handles the 56% empty-bid case as a sentence (`Starts at $14,500`) instead of an awkward placeholder.
2. **Vehicle detail page** — trust triptych above the fold: hero gallery, condition grade hero with SVG body-region damage diagram, then a bid panel with an AI condition synopsis and an outbound CarFax Canada link for independent value verification. Below the fold: full specs, damage in plain text, seller info, and the buyer's bid history on this lot.
3. **Bid confirmation modal** — pre-mortem framing. Bid restated against the floor (delta in dollars, not just the new number), reserve status spelled out in plain English, time remaining, and the worst damage note on the lot. The commitment line is legally meaningful and behaviorally important.

Eight stories shipped in sequence (`stories/1.0` through `stories/1.7`): scaffold and tooling, Docker setup (optional), data layer with first UI render, inventory grid, search/filters/sort, vehicle detail page, bid placement flow, AI enrichment, and this polish/E2E/docs pass.

## Notable Decisions

The longer write-ups are in [ARCHITECTURE.md → Stack Decisions](ARCHITECTURE.md#stack-decisions) and [PRODUCT.md → Key Trade-offs](PRODUCT.md#key-trade-offs). Five worth calling out:

- **No global state library.** Filters live in the URL (shareable, back-button-correct), bids live in localStorage, the rest is component state. There is no cross-cutting state that earns a Redux/Zustand/Jotai store at this scope.
- **All data access through `dataStore`.** A single module owns reads, writes, and subscriptions. Swap to a real backend = a second implementation of the same interface; no consumer code changes.
- **Build-time AI enrichment over runtime calls.** Keeps API keys out of the client bundle and matches how a real inventory pipeline would enrich during inspection. Prompt forbids dollar amounts, repair-cost estimates, market-value claims, and resale predictions — exactly the artifacts a regulated dealer's compliance team flags.
- **SVG body-region damage diagram with heuristic mapping.** ~60% of damage notes map cleanly via keyword heuristics; the remaining ~40% (transmission, electrical, frame) get their own labeled panel because mapping "transmission slips" onto a body silhouette is dishonest design. The diagram is a v1 trust artifact, not a precision tool.
- **Bid confirmation as a pre-mortem.** Last-chance surface for delta-vs-floor (`+$700 ↑`), reserve status, time remaining, and the worst note. Auctions are binding; the modal earns its keystroke.

## Testing

Three layers, scoped to what each is good for:

- **Unit tests, co-located, Vitest + RTL.** Every component has a `.test.tsx`. The `validateBid` pure function in `src/lib/bids.ts` is the only place I followed strict TDD — red-green-refactor on the validation rules, since that's the one place a bug becomes a binding mistake. Everything else gets tests after implementation.
- **Two Playwright E2E smoke flows.** `tests/e2e/browse-filter-bid.spec.ts` walks the full happy path: visit `/`, search "Toyota", click the first card, place a valid bid, confirm in the modal, verify the success state shows the new high bid and the history lists it. `tests/e2e/responsive.spec.ts` checks 375×667: grid stacks single-column, triptych stacks vertically on the detail page.
- **CI gates.** GitHub Actions runs `npm run verify` (typecheck + lint + tests + build) as a fast pass on every push, then `npm run test:e2e` as a slower job gated on `verify` success. The AI summary coverage script (`node scripts/enrich.mjs --check`) is its own step — a missing summary breaks the build.

Accessibility was a manual pass: semantic landmarks (`<main>`, `<nav>`, `<section>` with labeled headings), focus-visible rings on every interactive element, keyboard navigation end-to-end (tab through filters → card → detail → bid form → confirmation modal → confirm), modal focus trap with restore-on-close, `prefers-reduced-motion` honored via a global CSS rule, and meaningful `alt` text on every image. The honest claim is "semantic markup, keyboard accessible, motion-respectful" — not a full WCAG audit, and not a Lighthouse 100. Lighthouse Accessibility scores ≥ 90 locally.

## What I'd Do With More Time

The roadmap lives in [PRODUCT.md → What I'd Build Next](PRODUCT.md#what-id-build-next). The three I'd pick first:

1. **Proxy bidding with server-side locks.** Real auction infrastructure with max-bid mechanics, tie-break ordering, and buy-now ambush protection. Correct N-way concurrency needs a backend; that's an architectural shift, not a UI tweak.
2. **Watchlist + comparison view.** Let dealers stage three to five candidates side-by-side before committing capital. The JTBD includes "deciding among options"; the current UI handles each lot well in isolation but doesn't help with the comparison step.
3. **Multi-dimensional condition grading.** Real platforms grade body / mechanical / interior / electrical separately; the single-score `condition_grade` is a v1 simplification documented as such.

Smaller follow-ups I'd take from the known-compromises list in [ARCHITECTURE.md → Risks & Known Compromises](ARCHITECTURE.md#risks--known-compromises): cross-tab fanout for bids (a `storage` event listener, ~30 lines), `?page=N` URL state with windowing for inventory beyond ~2,000 rows, a benchmark-driven retune of the Fuse.js threshold, and a CI freshness gate on `scripts/enrich.mjs` so summaries can't drift from the dataset.
