# CLAUDE.md

Project rules for **The Block**. Every Claude Code session in this repo reads this file first. Keep it lean — anything that belongs in PRODUCT.md, ARCHITECTURE.md, or STORIES.md lives there, not here.

---

## Project at a glance

Buyer-side vehicle auction prototype. Frontend-only SPA against a committed 200-vehicle JSON dataset. The detail view is the product; the list is a funnel to it. Buyer is a wholesale dealer, desktop-anchored, deciding under uncertainty.

**Live URL:** *(set after first Vercel deploy)*

## Documentation map

| For what | Look here |
|---|---|
| Product scope, JTBD, business rules, assumptions, trade-offs | `PRODUCT.md` |
| Stack rationale, data model, state model, folder structure, bid flow | `ARCHITECTURE.md` |
| Wireframes and layout rationale for the three buyer-journey screens | `UX.md` |
| Epic, nine stories, AC, sequencing, daily cadence | `STORIES.md` (index) + per-story specs under `stories/` |

## Stack

React 19 · Vite · TypeScript strict · Tailwind 4 · React Router v7 · Fuse.js · `useSyncExternalStore` for external subscriptions · Vitest + React Testing Library · Playwright (smoke flows only) · Biome (lint + format) · GitHub Actions CI · Vercel deploy.

No global state library. No UI component library. No backend. No SSR.

## Code conventions

- **Named exports only.** No default exports anywhere. Import lists stay explicit; refactors and editor auto-import behave deterministically.
- **Strict TypeScript.** Zero `any`, zero `@ts-ignore`, zero `@ts-expect-error`. Narrow types at boundaries.
- **Function components with hooks.** No class components.
- **Co-located tests.** `Foo.tsx` lives next to `Foo.test.tsx`. Every component has a test file even if minimal.
- **Tailwind utility-first.** No CSS modules, no styled-components, no separate `.css` files except `index.css` for global resets and Tailwind imports.
- **`clsx` for conditional classes.** No string concatenation for class names.
- **One responsibility per file.** Split when a file does two things; combine when a file is a one-liner re-export.
- **Discriminated unions for errors.** Pattern-match on `error.type`, never parse strings.

## Architecture rules

- **All data access goes through `dataStore`** (`src/lib/dataStore.ts`). Never read `data/vehicles.json` directly outside the store. Never read or write `localStorage` directly outside the store.
- **All time-dependent UI goes through `useNow()`** (`src/hooks/useNow.ts`). Never own a `setInterval` in a component.
- **State buckets are fixed:**
  - URL search params: filters, sort, search
  - localStorage (via dataStore): bidder ID, bids
  - Component state: form drafts, modal open/closed, hover/focus
  - Derived (no storage): anything computable from the above
- **Derived state over stored state.** If you can compute it, do not store it. No `auctionStatus` field on a vehicle — compute from `auction_start + duration` against the clock.
- **`useSyncExternalStore` for every external subscription.** No ad-hoc subscription plumbing.

## Testing rules

- **TDD only on `validateBid`.** Red-green-refactor on the bid validation logic. Other logic gets tests after implementation.
- **Co-located unit tests.** Behavior-based (`getByRole`, `getByText`, user interactions). No snapshot tests.
- **Two Playwright E2E flows only:** browse-filter-bid happy path, and a 375px responsive viewport check.
- **`npm run verify` must pass before any commit.** Verify runs typecheck + lint + tests + build in sequence.

## Commit conventions

- **Conventional-commit prefix:** `feat:`, `fix:`, `chore:`, `test:`, `docs:`, `style:`, `refactor:`.
- **Imperative mood, lowercase.** `feat: add bid validation` — not `Added bid validation`.
- **One commit per story by default.** If a single commit message needs the word "and" twice, split.
- **Squash WIP locally** before pushing. The pushed history is the narrative, not the keystrokes.

## AI feature constraints

- **Build-time enrichment only.** `scripts/enrich.mjs` runs at build time, writes results into the committed JSON. No runtime Claude API calls from the client.
- **No API keys in client code.** `ANTHROPIC_API_KEY` is read from `process.env` in the script; never imported into anything in `src/`.
- **The enrichment prompt forbids:**
  - Dollar amounts of any kind
  - Repair-cost or reconditioning-cost estimates
  - Market-value or appraisal-adjacent claims
  - Resale or wholesale price predictions
- **CI gates on coverage.** Every vehicle must have an `ai_summary`. The script exits non-zero on missing coverage; CI fails.

## Don't do

- No Redux, Zustand, Jotai, MobX, or Context-as-store.
- No UI library (MUI, Chakra, Ant Design, shadcn's pre-built shell).
- No Node/Express backend in this slice.
- No Storybook, Nx, Lerna, or monorepo tooling.
- No `React.memo` until measured; trust the compiler.
- No `useEffect` for derived state — compute it.
- No gestures as the only input for any action.
- No `console.log` in committed code (use it freely while developing, strip before commit).
- No documentation that exists only to flag a decision to an external reader. State the decision; let it speak.

## Definition of Done (per story)

A story ships when:

1. Every numbered AC is true on `main`.
2. The story's tests pass locally and in CI.
3. `npm run verify` exits zero.
4. No `any`, `@ts-ignore`, or `console.log` in the diff.
5. The commit message follows convention and references the story.

## Key files

- `data/vehicles.json` — 200-vehicle dataset; mutated only by `scripts/enrich.mjs`.
- `src/types.ts` — `Vehicle`, `Bid`, `BidError`, `BidResult`, `FilterState`.
- `src/lib/constants.ts` — `MIN_BID_INCREMENT`, `MAX_BID`, `AUCTION_DURATION`, `ENDING_SOON_THRESHOLD`, `AWAY_THRESHOLD`.
- `src/lib/dataStore.ts` — single point of data access; localStorage-backed today, swap-target for a real backend.
- `src/lib/timestamps.ts` — median-anchor normalization and auction-status derivation.
- `src/lib/bids.ts` — pure `validateBid` function.
- `src/lib/damage.ts` — body-region vs mechanical classification for damage notes.
- `scripts/enrich.mjs` — build-time AI condition summary pipeline.

## Run commands

```bash
npm install          # first time
npm run dev          # local dev server
npm run verify       # typecheck + lint + test + build (must pass before commit)
npm run test:watch   # vitest watch mode
npm run test:e2e     # playwright smoke flows
npm run enrich       # rerun AI condition summary pipeline
```

## Working with this codebase

When adding a new feature, follow the seam pattern:

1. **Types first** in `src/types.ts` if the domain changes.
2. **Pure logic** in `src/lib/`. Unit-tested.
3. **Hooks** in `src/hooks/` if state or subscriptions are involved.
4. **Components** in `src/components/`. Co-located tests.
5. **Wire it in** at the page level in `src/pages/`.

Every layer is replaceable. Every layer has one job.
