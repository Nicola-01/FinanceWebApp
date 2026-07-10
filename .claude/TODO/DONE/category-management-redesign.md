# Category Management — Redesign (planning only)

> **STATUS: NOT STARTED — evaluation only.** The user wants to **completely redo** the
> category-management UX/UI. This file only assesses the current state and lays out options
> to explore. **Do not implement anything here yet — a brainstorming session comes first.**
> _Drafted 2026-07-03._

## Scope

Redo **only the management of categories** (create / edit / organize tags). The **analytics
that the user likes stay**: the two pie charts (`TransactionPieChart` income/expense) and the
`CashFlowSankey`, plus `DateRangeBanner`. Those are keepers — this is about the *management*
surface, not the charts.

Related (already done, not part of this): the **`TagFilter` ↔ `TagPicker` unification** and
the **search-on-Transactions-only** behaviour. The redesign should stay consistent with that
unified tag language.

## Where it lives today

`src/dashboard/tag/`:
- `TagsTab.tsx` — the Categories tab. Renders: `DateRangeBanner` → 2 pie charts → `CashFlowSankey`
  → a **`Collapse` titled "Manage Categories"** (collapsed by default) containing "Add Main
  Category" + a **masonry grid** (`columns-1 md:columns-2 xl:columns-3`) of `TagCard`s.
- `TagCard.tsx` — one **parent** category: icon/color picker (`IconPickerButton`), name with
  hover-reveal inline edit/delete, a children list, and an inline "Add sub-category".
- `TagChildRow.tsx` — one **child** category: icon/color picker + hover-reveal inline edit/delete.

Data plumbing: `TagsTab` builds `organizedTags` (parent → direct children, **one level only**)
from `tags`; CRUD via context `handleAddTag` / `handleUpdateTag` / `handleDeleteTag`.

## What's wrong (why "hidden and not effective")

1. **Discoverability** — management is buried in a **collapsed** section *below* the charts;
   easy to miss entirely.
2. **Scannability** — a **masonry wall of cards** gets chaotic with many categories (same
   "incasinato" problem we just fixed on Subscriptions); no overview, no ordering.
3. **Shallow hierarchy** — only **parent → child (2 levels)** is surfaced/organizable, even
   though tags are conceptually hierarchical. No way to **reorder** or **reparent** (move a
   sub-category to another parent), no drag-and-drop.
4. **No context/insight** — management shows *structure only*: no per-category totals, counts,
   or % of period, so you can't see which categories actually matter while editing them.
5. **Editing model** — everything is **hover-reveal inline** (fiddly on touch); parent delete
   uses a raw **`window.confirm`** instead of the app's `DeleteModal` → inconsistent + risky.
6. **Consistency / tech debt** — doesn't use the new unified tag-row language; carries legacy
   `theme-*` classes (`theme-text-danger`, `theme-text-warning`, `theme-bg-danger-light`,
   `theme-text-inverse`, `theme-bg-transparent`, `theme-text-subtle`) across all three files;
   not aligned to `components/ui` primitives.
7. **Disconnected from the charts** — you can't act on a category from the pie/sankey it appears
   in (no "click a slice → edit that category").

## What to keep

- The **pie charts + Sankey** (+ `DateRangeBanner`) — user-approved analytics.
- Per-wallet **color accent** and the **icon+color picker** (`IconPickerButton`).
- **RBAC**: `VIEWER` stays read-only; `handleAddTag/UpdateTag/DeleteTag` contracts.
- Consistency with the unified **`TagPicker`/`TagFilter`** row/dropdown language.

## Options to explore in brainstorming (NOT decisions)

- **Placement**: (a) promote management out of the collapse into a first-class panel on the
  tab; (b) a dedicated **drawer/modal** ("Manage Categories") opened from a clear CTA;
  (c) a hybrid — quick inline edits + a full editor drawer.
- **Overview model**: a **category tree/list** (not masonry) with optional **per-category
  stats** (count, total, % of period from `filteredTransactions`), sortable — so management
  doubles as insight.
- **Hierarchy ops**: **drag-and-drop reorder + reparent** (dnd-kit is already used for
  `WalletsBar`); decide whether to support **>2 levels** or explicitly cap at 2 with clear UX.
- **Editing UX**: unify rows with the new `TagPicker` language; inline quick-rename + a
  **details editor** per category; replace `window.confirm` with the app **`DeleteModal`**;
  clarify what deleting a parent does to its children + linked transactions.
- **Chart ↔ management link**: click a pie slice / sankey node → jump to that category.
- **Empty / onboarding**: stronger empty state, maybe suggested starter categories.
- **Possible scope creep to flag (not commit)**: per-category **budgets**, **merge**
  categories, **archive/hide**, palette consistency.
- **Always-on cleanups** to fold in: migrate `theme-*` → `app-*`, reuse `Button`/`Input`/
  `Collapse` primitives, keep everything English.

## Open questions to resolve in the brainstorming (do not ask yet)

- Separate surface (drawer/route) vs stay on the tab?
- Structural-only vs analytical (show spend per category) management?
- How many hierarchy levels to support; is reparent/drag wanted?
- Should chart slices link into management?
- Tree/table vs cards for the overview?

## Definition of done (for when we DO start)

Discoverable, scannable management of the full tag hierarchy; consistent with the unified tag
language and `app-*` tokens; `DeleteModal` instead of `window.confirm`; charts kept; RBAC kept;
`npm run lint` + `npm run build` green.
