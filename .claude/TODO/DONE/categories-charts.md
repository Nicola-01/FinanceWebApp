# Categories (Tags) tab — charts plan

Scope: `frontend/src/dashboard/tag/` (+ shared `statistics/CashFlowSankey`). Add three new
visualizations as **separate stacked cards** (no switcher) and keep the donut + Sankey the user
likes. All charts use `filteredTransactions` (respect the date-range + tag filter). English copy,
`app-*` tokens, category `colorHex` for series. Verify green after each.

## Locked decisions (2026-07-03)
- Keep the 2 nested **donuts** (`TransactionPieChart`) + the **Sankey** — user likes them.
- Add **all three**: Top Categories (bars) · Category over time · Treemap (Pro).
- Presentation: **separate stacked cards**, NOT a `SwitchableCard` switcher. No shared `Card`
  primitive extraction for now (inline).
- Card opacity unified inline: donut `/55` → `/20` (matches Sankey + Statistics `SwitchableCard`).

## Increments (propose design in chat → OK → implement → verify → next)
- [x] **0 — Card opacity fix.** `CategoryCharts` donut cards `bg-app-card/55` → `/20`.
- [x] **1 — Top Categories (horizontal bar ranking).** New `CategoryRanking.tsx` — TWO cards
  (Income + Expense, mirrors donuts) as CSS bar-lists (icon·name·bar·amount·%). Groups by MAIN
  category (parent via `tag.parent`, fallback first child), top-8 + "Other" bucket, category
  colours, respects the filter. Wired into `TagsTab` after the donuts, before the Sankey.
- [x] **Currency fix.** Ranking amounts now show the wallet currency symbol
  (`CURRENCY_META[wallet.currency].symbol`, muted) next to each value. Passed as a `currency`
  prop into `CategoryRanking` (and `CategoryTrendChart` tooltip). NOTE: donut centre + Sankey
  still hardcode EUR — pre-existing, unify to `wallet.currency` in a later pass.
- [x] **2 — Category over time.** New `CategoryTrendChart.tsx` — full-width card, Income/Expense
  toggle (`Selector`, default Expenses), per-month **stacked BarChart** (free `@mui/x-charts`),
  top-6 main categories + "Other", category colours, custom legend. Respects the filter. Wired
  after the ranking, before the Sankey. Defaults chosen: full-width single chart + toggle (a
  time-series is too wide for two side-by-side), top-6, stacked bars.
- [x] **3 — Heatmap (replaces the non-existent Treemap).** MUI X has no Treemap; user chose the
  Pro **Heatmap** instead. New `CategoryHeatmapChart.tsx` — categories (top-8 + "Other") rows ×
  months columns, intensity = amount, Income/Expense toggle. Pro `@mui/x-charts-pro` Heatmap with
  a `zAxis` continuous `colorMap` (soft red→ / green→ scale, matching the soft-tint preference).
  Horizontal scroll for many months, tooltip shows amount + currency. Wired after the trend,
  before the Sankey.

**Status: all 3 new charts + currency + card-opacity fix DONE. New Categories tab order:
DateRangeBanner → 2 donuts → 2 rankings → trend → heatmap → Sankey. lint + tsc + build green.**

## Follow-ups — DONE
- [x] **Currency unified.** Donut centre + Sankey now take a `currency` prop (donut = optional
  default EUR; Sankey = optional default EUR) and use `wallet.currency`; `TagsTab` passes the
  code. Landing `Features` keeps the EUR default. Also fixed the Italian "totale" → "total" in
  the Sankey tooltip.
- [x] **Dedup extracted.** New `categoryAgg.ts` (`mainCategoryName`, `buildMainCategoryMeta`,
  `OTHER_COLOR`); `CategoryRanking` / `CategoryTrendChart` / `CategoryHeatmapChart` now use it
  instead of each re-deriving the main-category colour/icon.

_All my files lint + type clean. (Note: a project-wide `tsc -b`/`build` is currently red only on
`settings/DataTab.tsx`, which is unrelated parallel work — a `(string|number)[]` vs `string[]`
CSV type mismatch — not touched here.)_

## Verify (after each)
```
cd frontend && npm run lint && npx tsc -b && npm run build
```

_Created 2026-07-03. Charts appreciated by user — augment, don't replace._
