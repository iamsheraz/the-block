# UX.md

Wireframes and design rationale for **The Block**. Three screens drive the buyer journey: inventory scan, vehicle detail decision, bid commitment. Each wireframe is followed by the reasoning behind the layout choices.

---

## Design through-line

Every screen earns the buyer's next click by making the most consequential signal the most visually loud thing on the page — condition risk on the detail page, scannable status on the list, decision context at the moment of commitment.

---

## Screen 1: Inventory Page

```
┌──────────────────────────────────────────────────────────────────────────┐
│  THE BLOCK                                                          [≡]  │
├──────────────────────────────────────────────────────────────────────────┤
│  [🔍 Search make, model, VIN, lot #_______________]                       │
│                                                                          │
│  Make ▾    Body ▾    Price ▾                          Sort: Ending Soon ▾│
├──────────────────────────────────────────────────────────────────────────┤
│  Showing 47 of 200 vehicles                          [Clear filters]     │
├──────────────────────────────────────────────────────────────────────────┤
│  ⏰ ENDING SOON ─────────────────────────────────────────────────────────│
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                  │
│  │ [img]  │ │ [img]  │ │ [img]  │ │ [img]  │ │ [img]  │   →             │
│  │ 12:43  │ │ 18:02  │ │ 22:11  │ │ 31:50  │ │ 44:09  │                  │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘                  │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐           │
│  │ [vehicle image] │  │ [vehicle image] │  │ [vehicle image] │           │
│  │           [4.2] │  │      [SALVAGE]  │  │           [3.8] │           │
│  ├─────────────────┤  ├─────────────────┤  ├─────────────────┤           │
│  │ 2019 Civic LX   │  │ 2017 F-150 XLT  │  │ 2020 RAV4 XLE   │           │
│  │ 84,210 km · ON  │  │ 142,500 km · AB │  │ 61,300 km · BC  │           │
│  │                 │  │                 │  │                 │           │
│  │ Starts at       │  │ Current bid     │  │ Starts at       │           │
│  │ $14,500         │  │ $19,200         │  │ $24,000         │           │
│  │                 │  │ Reserve not met │  │                 │           │
│  │ ⏰ Ends 2h 14m   │  │ ⏰ LIVE          │  │ ⏰ Ends 1d 6h    │           │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘           │
│                                                                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐           │
│  │       ...       │  │       ...       │  │       ...       │           │
└──────────────────────────────────────────────────────────────────────────┘
```

**Card anatomy** (top → bottom, in priority order):

1. Image + condition grade badge (top-right overlay) **OR** title badge if non-clean
2. Year / Make / Model / Trim — one line, bold
3. Mileage · Province — muted, one line
4. Price line — `Starts at $X` (56% case) **OR** `Current bid $X` (44% case)
5. Reserve status — only rendered if `reserve_price` exists AND not met
6. Time chip — `LIVE` / `Ends in` / `Ended` (color-coded)

### Rationale

The card is doing one job: in three seconds, can the buyer tell whether this vehicle deserves a click? Grade badge floats on the image because condition is the first filter in a wholesale buyer's head — before price, before mileage. A non-clean title supersedes the grade badge entirely; `SALVAGE` is louder than `4.2` because a salvage title kills the deal for most dealers regardless of grade.

The price line is conditional copy, not conditional fields — `Starts at $14,500` reads as a normal sentence for the 56% empty-bid case instead of an awkward `—` or `$0`. Reserve status only renders when there's reserve data and it matters; absent reserve never shows a "no reserve" pill because that adds noise to 70% of cards. The ending-soon strip exists because the JTBD is partly *"act before someone else does"* — it's a permanent urgency surface that doesn't require sort gymnastics. Three filters, URL-synced, search alongside: enough to slice 200 cars, not enough to look like an enterprise tool.

---

## Screen 2: Vehicle Detail Page

```
┌──────────────────────────────────────────────────────────────────────────┐
│  THE BLOCK                                                          [≡]  │
├──────────────────────────────────────────────────────────────────────────┤
│  ← Back to inventory          2019 Honda Civic LX · Lot #A4821           │
│                               84,210 km · Ontario · Clean title          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────┐  ┌──────────────────────────────────┐    │
│  │                            │  │  CONDITION GRADE                 │    │
│  │                            │  │  ┌──────┐                        │    │
│  │      [HERO IMAGE]          │  │  │ 4.2  │  Above Average          │    │
│  │                            │  │  └──────┘                        │    │
│  │                            │  │                                  │    │
│  │                            │  │      ╱──────────╲                 │    │
│  │                            │  │     │ ●        ● │ ← rust WW     │    │
│  │  [thumb][thumb][thumb][+5] │  │     │            │                │    │
│  └────────────────────────────┘  │      ╲────●─────╱  ← scratch LG  │    │
│                                  │   (top-down body diagram)        │    │
│                                  │                                  │    │
│                                  │  ⚙ MECHANICAL CONCERNS (2)       │    │
│                                  │  • Transmission slips in 3rd     │    │
│                                  │  • AC compressor noisy           │    │
│                                  └──────────────────────────────────┘    │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │  BID PANEL                                          ⏰ Ends 2h 14m│    │
│  │  Starts at $14,500    ·    No current bid    ·    Reserve: $16k  │    │
│  │                                                                  │    │
│  │  💬 AI summary: "Clean-title Civic with minor cosmetic rust and  │    │
│  │  two mechanical flags worth diagnosis. Grade 4.2 is consistent   │    │
│  │  with a well-maintained commuter; the transmission and AC notes  │    │
│  │  point to pre-sale reconditioning before retail."                │    │
│  │                                                                  │    │
│  │  [$ Enter bid amount    ]   [  Place Bid  ]                      │    │
│  │  ↳ View market value on CarFax Canada  ↗                         │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│  ═══════════════════════════════ fold ════════════════════════════════   │
│                                                                          │
│  SPECS                              DAMAGE NOTES (DETAIL)                │
│  Engine     2.0L I4                 Body-mapped:                         │
│  Trans      CVT                     · Rust, driver-rear wheel well       │
│  Drive      FWD                     · Rust, passenger-rear wheel well    │
│  Ext color  Crystal Black           · Scratch, liftgate (8cm)            │
│  Int color  Black cloth             Mechanical:                          │
│  VIN        2HGFC2F5...             · Transmission slips in 3rd gear     │
│  Title      Clean                   · AC compressor noisy at idle        │
│                                                                          │
│  SELLER                             YOUR BID HISTORY (this vehicle)      │
│  King City Auto                     No bids placed yet.                  │
│  Toronto, ON                                                             │
└──────────────────────────────────────────────────────────────────────────┘
```

### Rationale

Two columns above the fold, left-heavy on image, right-heavy on signal — because a wholesale buyer who can't physically inspect needs the trust column to do the inspection's job. Condition grade sits at the top of the right column as a numeric hero (the badge) plus a one-word interpretation ("Above Average") so a buyer who doesn't have the grading rubric memorized can still parse it.

Directly beneath, the SVG body diagram with dot markers turns body-mappable damage notes into spatial information — this is the screen's signature move and the reason a buyer would prefer this over an interface that just lists damage as bullet text. Mechanical concerns get their own labeled panel because they're not spatial; trying to map "transmission slips" onto a body silhouette is dishonest design. The mechanical panel uses a count in the heading (`⚙ MECHANICAL CONCERNS (2)`) so absence reads as good news at a glance.

The bid panel is the third trust beat: it states the floor (`Starts at $14,500`) confidently even with no current bid because that's the 56% case, surfaces reserve transparently, and the AI summary translates raw data into a sentence a buyer can act on. The summary describes condition and points at reconditioning work without putting a dollar figure on it — naming a price would be the exact kind of representation that compliance teams flag in regulated dealer contexts. The CarFax Canada link is a small outbound chevron, not a button — it's the independent value-verification path, a sanity check, not a primary action.

Below the fold is where engineers and skeptics go: full specs, damage in textual detail (every body-mapped dot resolved to plain language), seller information, and the buyer's own bid history on this lot so they don't double-bid by accident.

---

## Screen 3: Bid Confirmation

```
        ┌──────────────────────────────────────────────────────────┐
        │  CONFIRM YOUR BID                                    [×] │
        ├──────────────────────────────────────────────────────────┤
        │                                                          │
        │  2019 Honda Civic LX · Lot #A4821                        │
        │  ─────────────────────────────────────────────────────── │
        │                                                          │
        │  Your bid                                  $15,200       │
        │  vs. starts at $14,500                     +$700 ↑       │
        │  Reserve $16,000                           Below reserve │
        │  Time remaining                            2h 12m        │
        │                                                          │
        │  ⚠ Worst note on this vehicle:                           │
        │     "Transmission slips in 3rd gear"                     │
        │                                                          │
        │  ─────────────────────────────────────────────────────── │
        │  By placing this bid you commit to purchase if you win.  │
        │                                                          │
        │              [  Cancel  ]    [  Confirm Bid  ]           │
        └──────────────────────────────────────────────────────────┘

Success state:                           Error state:
┌──────────────────────────────┐         ┌──────────────────────────────┐
│ ✓ Bid placed: $15,200        │         │ ✗ Bid not placed             │
│ You're the high bidder.      │         │ Someone bid $15,250 first.   │
│ Below reserve by $800.       │         │ Try $15,300 or higher.       │
│ [View bid] [Back to list]    │         │ [Adjust bid] [Cancel]        │
└──────────────────────────────┘         └──────────────────────────────┘
```

### Rationale

The pre-mortem lives in this modal — last chance to surface the things a buyer would regret missing. Bid amount restated against the floor (delta in dollars, not just the new number) because the human brain anchors on movement, not absolutes. Reserve status spelled out in plain English instead of a colored pill so it can't be skimmed past.

Time remaining is present because urgency cuts both ways — it pressures commitment, but a buyer with 8 minutes left should know that before clicking. The worst damage note resurfaces here, not all damage notes, because by this point the buyer has seen the diagram; what they need is the one sentence that might give a sober person pause. The commitment line is legally important and behaviorally important — auctions are binding, this isn't a shopping cart.

The success state confirms the position relative to reserve so the buyer knows whether they've actually won or just placed a marker. The error state assumes the most common failure (outbid in flight) and pre-fills a recovery path.

---

## Responsive behavior

Below ~900px, the inventory grid drops from three columns to two and finally to one. Filters collapse into a single sheet behind a `Filters (3)` button. On the detail page, the two-column triptych stacks vertically — gallery → condition + diagram → mechanical → bid panel — preserving the trust order. The body diagram stays a fixed-aspect SVG, not a horizontal scroller. The bid confirmation modal becomes a full-screen sheet on mobile with the same content order. No swipe stack anywhere, no card flips, no gesture-only actions — every primary action is a labeled button reachable by tab.

---

## The pixel decisions that make this feel intentional

- **Inventory list:** the conditional price copy — `Starts at $14,500` reading as a sentence instead of a bid placeholder is the thing that makes the empty-bid majority feel handled, not broken.
- **Vehicle detail page:** the SVG damage diagram with body-region dot markers — every other interface lists damage as bullets; spatial damage is what makes this page feel like an inspection report instead of a product listing.
- **Bid confirmation:** the `+$700 ↑` delta against the floor — that one expression, not the absolute amount, turns a confirmation modal into a decision moment.

Get those three right and the rest of the polish takes care of itself.
