# The Block

**Live:** https://the-block-beta.vercel.app · ![CI](https://github.com/iamsheraz/the-block/actions/workflows/ci.yml/badge.svg)

A buyer-side vehicle auction prototype for OPENLANE's coding challenge — a frontend-only SPA against a committed 200-vehicle dataset, where the detail view is the product and the list is a funnel to it.

<p align="center">
  <img src="docs/the_block_repo.png" alt="The Block — buyer-side auction prototype" width="960" />
</p>

## How to Run

```bash
npm install
npm run dev          # http://localhost:5173
npm run verify       # typecheck + lint + tests + build
```

That's it. There is no backend, no auth, no environment file required to browse and bid locally.

<details>
<summary><strong>Run with Docker (optional)</strong></summary>

If you'd rather not manage a local Node version:

```bash
docker compose up    # http://localhost:5173
```

The first run builds the image (~2 min); subsequent runs reuse the cache. The repo is bind-mounted so edits on the host trigger Vite HMR. `Ctrl+C` to stop; `docker compose down` to clean up.

**Mac / Windows hosts:** if HMR doesn't fire on save, uncomment the `server.watch.usePolling` block in `vite.config.ts` and rebuild. The npm path remains the canonical run instruction; Docker is an alternate convenience.
</details>

## What I Built

A wholesale dealer evaluating inventory from a desk has under sixty seconds per vehicle to decide whether to bid. **The Block** is shaped around that job: an inventory grid that surfaces condition risk and ending-soon urgency at a glance, a vehicle detail page anchored by a trust triptych (gallery → condition grade + body-mapped damage diagram → bid panel with an AI-written condition synopsis), and a bid placement flow with a pre-mortem confirmation modal that restates the bid against the auction floor and surfaces the worst note on the lot before commit.

Behind the UI, all reads and writes go through a single `dataStore` interface — the file is a localStorage-backed implementation today, and a server-backed implementation drops in without touching any consumer. Auction timestamps are normalized at load via a median-anchor offset so the demo always shows a balanced spread of upcoming / live / ended lots. Condition summaries are enriched at build time by `scripts/enrich.mjs` calling Claude Haiku 4.5 once per vehicle — no API keys in the client bundle, and CI gates on summary coverage so a regression breaks the build, not the page.

## Documentation

The story-by-story narrative and design rationale live in dedicated docs:

- **[PRODUCT.md](PRODUCT.md)** — JTBD, in-scope vs out-of-scope, business rules, assumptions, and success criteria.
- **[ARCHITECTURE.md](ARCHITECTURE.md)** — stack decisions, data model, state model, folder structure, bid flow, and known compromises.
- **[UX.md](UX.md)** — wireframes for the three buyer-journey screens with rationale for every pixel decision.
- **[STORIES.md](STORIES.md)** — sprint plan, story index, and the eight stories (1.0 through 1.7) with acceptance criteria and tests.

## Notable Decisions

A summary lives in [ARCHITECTURE.md](ARCHITECTURE.md#stack-decisions); the headline trade-offs and their reasons are documented inline rather than duplicated here. Highlights worth clicking through:

- **No global state library** — filters in the URL, bids in localStorage, the rest in component state.
- **Build-time AI enrichment over runtime calls** — keeps API keys out of the client, gives the demo offline-capable summaries, and matches how a real inventory pipeline would enrich during inspection.
- **Damage diagram with heuristic region mapping** — body-region dot markers turn ~60% of damage notes into spatial information; the remaining mechanical notes get their own labeled panel because mapping "transmission slips" onto a body silhouette is dishonest design.
- **Bid confirmation as a pre-mortem** — last-chance surface for delta-vs-floor, reserve status, time remaining, and the worst note on the lot. Auctions are binding; the modal earns its keystroke.

## What I'd Build Next

The roadmap lives in [PRODUCT.md → What I'd Build Next](PRODUCT.md#what-id-build-next). Short version: proxy bidding with server-side locks, watchlist + comparison view, and multi-dimensional condition grading. None fit the timebox; each is a meaningful next move.

## Submission

The OPENLANE submission writeup is in **[SUBMISSION.md](SUBMISSION.md)** — time spent, scope decisions, stack, testing, and what I'd do with more time.
