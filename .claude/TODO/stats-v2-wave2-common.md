# Statistics v2 — Wave 2 common rules (components)

Frontend root: `/home/nicola/Desktop/FinanceWebApp/frontend` (React 19 / TS strict / Tailwind 4 / Vitest + Testing Library).
Also read `/home/nicola/Desktop/FinanceWebApp/.claude/TODO/ui-v2-agent-rules.md` (v2 look, reuse, code rules).
Look at the target mock if useful: `/tmp/statmock/p0.png` (dark, desktop; the grey "ComposedChart…" tags are mock-only — never render them).

## Shape of every component
- One colocated file in `src/dashboard/statistics/`, props-driven (rows / insights / numbers in), **no context access**
  except `useChartPalette()` for colours. v2-only component: no `useUiVersion` fork inside.
- Card box (same as `OverviewTableV2`): `bg-app-card rounded-[var(--r-card)] shadow-[var(--box-ring)] p-5 max-sm:p-4`.
  Title `font-display text-[17px] font-semibold tracking-[-0.02em] text-app-text`; sub-line `text-[13px] text-app-muted mt-0.5`.
  Sentence case copy, English only, `tabular-nums` for numbers. No hex colours in classes; chart colours come from
  `useChartPalette()` (`src/dashboard/statistics/useChartPalette.ts`) which returns resolved CSS colours:
  `{ income, expense, balance, grid, axis, warn, danger, subscription, neutral, isV2 }`.
- Legend: reuse `KitLegend` from `./KitChartShared.tsx` (`<KitLegend series={[{ key, label, color }]} />`); empty data → `KitNoData`.
- Tooltip amounts: `formatKitAmount(value, currencySymbol, signed?)` and axis ticks `compactAmount(v)` / month ticks
  `monthLabel(date)` from `./kitChartData.ts`. Components that show money take a `currencySymbol: string` prop.
- Reuse `src/components/ui/` primitives (Selector, StatTile, CategoryIcon, …) — never hand-roll buttons/inputs.
  Never edit `src/components/ui/charts/` (vendored kit).

## Kit (shadcn.io / bklit on TanStack Charts) — import from `"@/components/ui/charts"`
Verified APIs (don't guess others; if you need one not listed, read its type in `src/components/ui/charts/core/types/` first):
- `ComposedChart` props: `data` (rows; x value must be a `Date` under `xDataKey`, default `"date"`), `xDataKey`, `aspectRatio` ("5 / 2"),
  `margin` ({top,right,bottom,left}), `stacked?: boolean`, `yDomains?: Record<axisId, [min, max]>` (memoize it), `barGap`, `maxBarSize`,
  `ariaLabel`. Children: `Grid` (`horizontal`), `SeriesBar` (`dataKey`, `label`, `fill`, `radius`, `yAxisId` default "left"),
  `Line` (`dataKey`, `label`, `stroke`, `strokeWidth`, `curve`, `showMarkers`), `XAxis` (`numTicks`, `tickMode: "data"`, `formatValue(date)`,
  `labels?: string[]` one per row), `YAxis` (`yAxisId`, `numTicks`, `formatValue(n)`), `ChartTooltip` (`rows?: (point) => {color,label,value}[]`,
  `dateLabels?: string[]` one per row — header text instead of a date).
  ⚠ Non-stacked `SeriesBar`s grow from the **bottom of the y-domain**, not from 0. In `stacked` mode a bar grows from 0 when it is
  the only bar on its `yAxisId`.
- `LineChart`: same `data`/`xDataKey`/`margin`/`aspectRatio`/`yDomains`/`status?: "loading"` props; children `Grid`, `Line`, `XAxis`, `YAxis`,
  `ChartTooltip`, `Band` (`lowerKey`, `upperKey`, `fill`, `fillOpacity`, `label`, `showInTooltip`) and `ProjectionLine`
  (`data: {date: Date, value: number}[]` = anchor + end point, `stroke`, `strokeWidth`, `strokeDasharray` default "6,4").
  Render `Band` before the `Line`.
- `WaterfallChart` (`data`, `xDataKey` default "label", `aspectRatio`, `margin`, `ariaLabel`) with one child
  `Waterfall` (`dataKey`, `totalKey` default "total", `positiveFill`, `negativeFill`, `totalFill`, `showConnectors`, `showValues`,
  `formatValue(n)`, `radius`). Rows `{ label, value?, total?: true }`: a total row with a value sets the running total (opening balance),
  without a value it shows the running total.
- Sparklines: `AreaSparkline` / `LineSparkline` (`data` rows, `dataKey` field name or `(d, i) => number`, `color`, `height`, `width`,
  `strokeWidth`, `curve: "monotone"`, `fill: "gradient"` (area only), `interactive`, `ariaLabel`, `className`).

## Tests
- `src/__tests__/dashboard/statistics/<Component>.test.tsx`. Mock the kit like `src/__tests__/dashboard/statistics/KitCharts.test.tsx`
  does (`vi.mock("@/components/ui/charts", …)` recording props, rendering children) and assert on the props/rows you pass and
  on the visible copy. Wrap with `ThemeContext.Provider` as that test does when `useChartPalette` is used. NumberFlow is stubbed
  globally (see `src/test/numberFlowStub.tsx`).

## Rules
- Only touch the files your task lists. If something isn't specified, STOP and ask in your report — don't invent.
- Verify from `frontend/`: `npx vitest run <your test>` → `npx tsc -b` → `npx eslint <your files>` → `npx prettier --write <your files>`.
  Other agents add files in the same folder in parallel: ignore errors only in their files and mention them.
- Report: files changed (one line each), command results, anything unclear. Never commit.
