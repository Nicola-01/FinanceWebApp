# Statistics tab — redesign plan

Scope: `frontend/src/dashboard/statistics/`. Restyle + one new summary row. No behavior
changes to the Overview table or the charts. Part of the "de-vibecode" redesign
(see [`ui-redesign.md`](./ui-redesign.md) §6 and [`frontend/style.md`](../../frontend/style.md)).

## Locked decisions (brainstorm 2026-07-03)

1. **MUI X Pro license → keep the CSS hack** (private/dev use). `@mui/x-charts-pro` stays;
   Sankey + zoom stay. **Do NOT touch** the watermark hack in `src/index.css` (~L148-155).
2. **Hierarchy:** summary row (new) → Overview table → chart card.
3. **Summary row:** 3 glass stat cards (Income / Expense / Net). Each shows the total
   (large, `font-app-mono`, `app-green`/`app-red`, Net value green/red by sign) **plus
   `avg … / mo` below** (muted, small). Accent icons: TrendingUp=green, TrendingDown=red,
   Scale=**blue** (matches the Overview table's icon column).
4. **Avg unit = per active month:** `total ÷ buildMonthlyBuckets(transactions).length`.
5. **Balance accent = semantic blue** (not wallet.color): chart net line + Net-card icon use
   `app-blue`. Income green, expense red.
6. **Data scope:** summary uses the wallet's **full** `transactions` set (same as the table
   and charts) — filter-independent, consistent across the tab.

## Scope corrections (from the TODO §6)

- `ChartRangeSelector.tsx` is misnamed — it's only the `buildMonthlyBuckets` helper, **no UI**.
- `DateRangeBanner.tsx` + `CashFlowSankey.tsx` render in the **Tags tab**, not Statistics —
  out of scope here (already tokenized / user likes the Sankey).

## Increments (one screen at a time, user OK between each; each ends green)

- [x] **1 — Summary row.** New `StatisticsSummary.tsx` (Income/Expense/Net, total + avg/mo).
  Wired into `StatisticsTab` above `OverviewTable`. Deleted orphaned
  `dashboard/transaction/PeriodStats.tsx` (role now served; category breakdown lives in Tags).
- [x] **2 — Overview table.** Migrated `OverviewTable`/`OverviewCell` value cells + icon
  column: `theme-text-success/danger/primary` → `text-app-green`/`text-app-red`/`text-app-blue`.
  Floating icon + totals columns, scroll-to-latest, Monthly/Yearly, year selector all kept.
  Italian comment in `OverviewRow.tsx` → English. Zero `theme-*` left in these files.
- [x] **3 — Charts theming.** `MonthlySnapshotChart` + `CumulativeChart`: kept the original
  soft tints (`#34d399`/`#f87171`/`#60a5fa`) — user preferred them over the semantic-500 tokens
  I first tried (reverted 2026-07-03). Each colour is now a single `INCOME/EXPENSE/BALANCE_COLOR`
  constant driving **both** the series and the legend swatch (legend uses `style={{backgroundColor}}`,
  NOT `theme-bg-*`), so legend always matches the plot and the legacy tokens stay gone. Zoom (Pro)
  kept. (MUI writes series colour as an SVG fill attribute → `var()` won't resolve, hence hex.)
- [x] **4 — SwitchableCard.** Migrated all 3 `theme-text-default` → `text-app-text`
  (title hover, chevron rotate, mobile dropdown hover). Behavior kept.

**Status: all 4 increments done. Statistics tab is free of `theme-*` (CashFlowSankey lives in
the Tags tab, out of scope). lint + tsc + build green.**

## Verify (after every increment)

```bash
cd frontend && npm run lint && npx tsc -b && npm run build
```

_Created 2026-07-03._
