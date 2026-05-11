# STORIES.md

Sprint plan and story index for **The Block**. One epic, nine stories. Each story lives in its own file under [`stories/`](stories/) with the full spec, acceptance criteria, files touched, tests, commit message, and a "how to verify (UI)" section.

---

## Epic 1: Buyer-side vehicle browsing and bidding (MVP)

Scope: a working buyer experience — inventory browsing with search, filters, and an ending-soon surface; vehicle detail page anchored by the trust triptych; bid placement with persistence; AI-enriched condition summaries baked at build time. Frontend-only against the committed JSON; data layer shaped behind an interface so a real backend swaps in cleanly.

**Total estimate:** ~14.25 hours over 5 days.

## Story index

| # | Title | Estimate | File | Status |
|---|---|---|---|---|
| 1.0 | Scaffold and tooling | 75m | [stories/1.0-scaffold.md](stories/1.0-scaffold.md) | Ready |
| 1.0.5 | Docker setup (optional) | 45m | [stories/1.0.5-docker-setup.md](stories/1.0.5-docker-setup.md) | Ready |
| 1.1 | Data layer with first UI render | 105m | [stories/1.1-data-layer.md](stories/1.1-data-layer.md) | Ready |
| 1.2 | Inventory grid | 90m | [stories/1.2-inventory-grid.md](stories/1.2-inventory-grid.md) | Ready |
| 1.3 | Search, filters, sort, ending-soon | 105m | [stories/1.3-search-filters-sort.md](stories/1.3-search-filters-sort.md) | Ready |
| 1.4 | Vehicle Detail Page (trust triptych) | 120m | [stories/1.4-vehicle-detail-page.md](stories/1.4-vehicle-detail-page.md) | Ready |
| 1.5 | Bid placement flow | 105m | [stories/1.5-bid-placement-flow.md](stories/1.5-bid-placement-flow.md) | Ready |
| 1.6 | AI condition summary enrichment | 90m | [stories/1.6-ai-enrichment.md](stories/1.6-ai-enrichment.md) | Ready |
| 1.7 | Polish, accessibility, E2E, docs | 120m | [stories/1.7-polish-e2e-docs.md](stories/1.7-polish-e2e-docs.md) | Ready |

## Dependency graph

```
1.0 Scaffold
 ├─→ 1.0.5 Docker (optional, parallel)
 └─→ 1.1 Data layer with first UI render
      ├─→ 1.2 Inventory grid
      │    └─→ 1.3 Search + filters + sort + ending-soon
      └─→ 1.4 Vehicle Detail Page
           ├─→ 1.5 Bid placement flow
           └─→ 1.6 AI enrichment
                └─→ 1.7 Polish + E2E + docs
```

## Daily cadence

| Day | Stories | Hours |
|---|---|---|
| 1 | 1.0, 1.0.5 (optional), 1.1 | ~3.75h |
| 2 | 1.2, 1.3 | ~3.25h |
| 3 | 1.4 | ~2h |
| 4 | 1.5, 1.6 | ~3.25h |
| 5 | 1.7 | ~2h |

Buffer comes from breadth, not quality. If a day runs over, cut polish from the next day before touching the current story's scope.

## Every story is UI-testable

Every story file has a `## How to verify (UI)` section listing the manual browser steps that confirm the story works. Even foundational stories (scaffold, data layer, AI enrichment) produce a visible change in the running app — no story lands without something to look at.

## How to execute a story

Open a fresh Claude Code chat in this repo. `CLAUDE.md` loads automatically and gives the new session the project conventions. Then:

```
/bmad-dev-story stories/1.0-scaffold.md
```

Amelia (the dev agent) reads `CLAUDE.md` and the story file, implements end-to-end with the tests listed in the story, and ends with the commit. After it lands, run `npm run verify` locally to confirm green before pushing.

For a complete sequence: do each story in its own chat. Eight or nine separate chats across the week.

## Story authoring rules

- **Estimate in minutes, not points.** Honest about time, not abstract about velocity.
- **Numbered AC** (`AC1`, `AC2`, ...) so commits and tests can reference them precisely.
- **Tests listed by what they assert**, not what they're named.
- **One commit per story by default**; split only when a single message would need "and" twice.
- **Commit messages:** imperative mood, lowercase, conventional-commit prefix (`feat:`, `fix:`, `chore:`, `test:`, `docs:`, `style:`, `refactor:`).
- **A story ships when every AC is true** on `main` and `npm run verify` passes.
