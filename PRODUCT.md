# PRODUCT.md

The product brief for **The Block** — a buyer-side vehicle auction prototype built for OPENLANE's coding challenge.

---

## The User & The Job

The buyer is a **wholesale used-car dealer evaluating inventory after-hours from a desk**. Their lot needs three more SUVs by Friday. They're scanning 200 vehicles across multi-tab Chrome windows, comparing condition reports to bids, deciding where to commit real money on cars they can't physically inspect.

**Job-to-be-done:** *Help me decide, in under 60 seconds per vehicle, whether this car is worth bidding on — and let me act before someone else does.*

This is risk assessment at speed. Every screen serves confidence under uncertainty.

## The Core Bet

**The detail view is the product. The list is a funnel to it.**

A dealer doesn't buy from a grid — they buy from the condition report, damage notes, odometer, and photos. ~60% of design and engineering budget goes to the Vehicle Detail Page. Everything upstream filters; everything downstream confirms.

## In Scope

- Browse inventory with search and faceted filters (URL-synced, shareable, back-button-correct)
- Vehicle Detail Page anchored by a **trust triptych** above the fold: image gallery → condition grade hero with **SVG damage body diagram** → bid panel with AI condition summary and outbound value-verification link
- Place bids with min-increment validation, optimistic UI, and localStorage persistence
- Live auction status (upcoming / live / ended) computed from median-anchor-normalized timestamps
- Empty, loading, and error states across every surface
- Desktop-first responsive design; mobile scales down rather than competing for hero

## Business Rules

Codified as constants in `src/lib/constants.ts` so they live in one place and are easy to tune.

- **`MIN_BID_INCREMENT = $100`** — every bid must exceed the current bid by at least $100. A single increment is easier to reason about than per-vehicle thresholds at prototype scale.
- **`MAX_BID = $10,000,000`** — upper bound prevents integer overflow and absurd inputs; comfortably above any realistic wholesale vehicle price.
- **`AUCTION_DURATION = 4 hours`** — every auction runs four hours from `auction_start`. The synthetic dataset doesn't carry durations, so I normalized to a single window. Per-vehicle durations are a `Vehicle` type addition.
- **`ENDING_SOON_THRESHOLD = 1 hour`** — vehicles with under an hour remaining surface in the "Ending Soon" strip on the inventory page; the urgency surface above the grid.
- **`AWAY_THRESHOLD = 30 seconds`** — if a `live → ended` transition spans a jump larger than 30s between clock ticks, it indicates browser sleep, not natural countdown. UI shows an inline "ended while you were away" message instead of a silent state change.

## Assumptions

Choices made because the brief, the dataset, or the timebox didn't decide for me.

### Auction Mechanics

- **First bid can equal `starting_bid`.** Subsequent bids must exceed the current bid by `MIN_BID_INCREMENT`.
- **Buy Now sets the winning price but does not terminate the auction window.** The auction keeps running until `auction_start + AUCTION_DURATION`. A production flow would end immediately and lock the sale — a two-line change in the bid validation function.
- **Reserve status is informational, not gating.** The "Reserve Met / Not Met" badge reports state; the auction does not auto-cancel a sale below reserve. Production adds a seller-accept-or-decline flow on close.
- **Bids are permanent.** No retraction or editing after placement. Matches a legally-binding wholesale context.
- **One auction per vehicle.** No relist flow for vehicles that end below reserve.

### Content & Localization

- **Currency: CAD, rendered as `$` without the explicit code.** Dataset is Canadian provinces; the `formatCurrency` helper centralizes locale so adding a "CAD" suffix or a USD toggle is one function.
- **English only.** OPENLANE has a significant Quebec user base; i18n is out of timebox.
- **Date/time in browser-local time.** Production would surface timezone explicitly per listing.
- **Themed placeholder images.** Dataset ships dark-themed `placehold.co` URLs. Real vehicle photography is out of scope; every image has a styled `onError` fallback so broken links don't degrade the UI.

### Data Model

- **200 vehicles, fixed dataset.** Full filtered list renders — no pagination or virtualization at this scale. Production would adopt `?page=N` URL state at ~2,000+ rows.
- **Auction timestamps normalized via median-anchor offset at load time** so the demo always shows a balanced mix of upcoming / live / ended auctions regardless of when the dataset was generated. The committed dataset's timestamps are all in late March–early April 2026; without normalization every auction reads as "ended."
- **Single-dimension `condition_grade` (0–5 float).** Real platforms grade body / mechanical / interior / electrical separately; the single-score presentation trades nuance for scannability.
- **`damage_notes` are free-text strings split into two surfaces.** ~60% map to body regions via keyword heuristics (rendered on the SVG damage diagram); the remaining ~40% (transmission, electrical, frame, flood) surface in a separate **"Mechanical Concerns"** callout. Production taxonomy would structure each note as `{location, type, severity}`.
- **Bid history is local-only.** Source data exposes `current_bid` and `bid_count` aggregates but no historical records. Only the current user's own bids appear in any history surface, persisted to localStorage.

### Buyer Identity

- **Anonymous browser as bidder.** No accounts; each browser is one bidder, identified via a stable ID in `localStorage` alongside their bids — clearing storage equals "new bidder," but closing a tab does not. Production auth swaps the local bidder ID for `auth.uid()` without touching consumer code.

## Out of Scope, With Reasoning

- **Authentication and per-user accounts** — brief scopes auth as optional; anonymous session keeps the prototype honest about what's being evaluated.
- **Seller workflows, checkout, payments** — explicitly excluded by the brief.
- **Real backend, real-time bidding, atomic concurrency** — data access lives behind a `dataStore` interface so a real backend slots in cleanly. A 5-day prototype shouldn't pay the ceremony cost.
- **AI-generated price estimates** — OPENLANE operates in a regulated dealer context; a hallucinated price is the exact artifact compliance teams flag. Kept the AI surface that adds unambiguous buyer value (condition synthesis) and linked to an external source for value verification.
- **Watchlist, comparison view, currency toggle** — feature breadth. Prioritized depth on the core flow over surface area.
- **Proxy (max-bid) bidding** — correct N-way implementation needs server-side locks; deserves its own scope.

## Success Criteria

If this shipped, I'd measure:

- **Time-to-decision** — median seconds from VDP open to bid-or-skip action
- **Bid attempt rate per session** — does the trust UI convert browsing into bidding?
- **Damage-diagram engagement** — hover/tap rate vs. text-only damage list (validates the hero bet)
- **Filter-to-bid funnel** — do URL-shareable filtered sessions convert higher than ad-hoc browsing?

## Key Trade-offs

- **localStorage over a real backend** — buys hours back for product polish. Costs multi-device sync and real concurrency. The `dataStore` interface keeps the upgrade path one-file-deep.
- **Build-time AI enrichment over runtime calls** — buys reliability and offline-capable demo, keeps API keys out of the client bundle. Mirrors how real inventory pipelines enrich during inspection.
- **Damage diagram with heuristic region mapping over precise coordinates** — buys a memorable trust artifact in ~90 minutes. Costs strict accuracy on damage placement; documented as a v1 simplification.
- **Three filters, not seven** — buys budget for the damage diagram and trust UI. Costs feature breadth a power-buyer might want; defensible if filters cover make / body type / price range cleanly.

## What I'd Build Next

1. **Proxy bidding with server-side locks** — real auction infrastructure with max-bid mechanics, tie-break ordering, buy-now ambush protection.
2. **Watchlist + comparison view** — let buyers stage 3-5 candidates side-by-side before committing capital.
3. **Multi-dimensional condition grading** — real platforms grade body / mechanical / interior / electrical separately; single-score is a v1 simplification.
