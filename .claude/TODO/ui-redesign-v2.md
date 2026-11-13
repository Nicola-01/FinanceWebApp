# UI Redesign v2 — "Wallet card" — Implementation plan / TODO

> Created 2026-11-12. Design rules: [`ui-redesign-v2-style.md`](ui-redesign-v2-style.md).
> Mockups: `docs/redesign-demos/d-wallet-card.html` (A/B/C there are rejected directions).
> Predecessor: [`ui-redesign.md`](ui-redesign.md) (v1 "de-vibecode", mostly done).
> Kickoff prompt for the orchestrator chat: [`ui-redesign-v2-kickoff.md`](ui-redesign-v2-kickoff.md).

**Legend:** `[ ]` todo · `[~]` in progress · `[x]` done · **DECISION** = Nicola's call ·
**SEE-AT-THE-TIME** = no mockup yet: mock it first, get sign-off, then build.

## Ground rules

1. **Iterative.** Many parts are drafts. Each phase: mock (if needed) → sign-off → build →
   Nicola looks at it in the real app → iterate. Never sweep a pattern across the app
   before the first instance is approved.
2. **No feature loss.** The mockup simplifies; the app keeps everything it has today
   (widget grid + Edit layout, Sankey, heatmap, subscription calendar, past subscriptions,
   to-categorise, offline `syncState` flags, deep links, bank rules, CSV, notifications…).
3. **Old/new UI side by side until the end** (see §Dual UI). The old UI must keep working
   and keep its tests green at every commit.
4. **Primitives first** (style.md golden rule). A pattern used by ≥2 screens becomes a
   `components/ui/` primitive with a Vitest test before screens adopt it.
5. **Checks after every task:** `npm run lint` → `npm test` → `npm run build` (the Stop hook
   enforces it). Behaviour changes need tests; pure helpers always get a unit test.
6. **Git:** work on a branch (ask Nicola for the base — his standing rule; the tree had
   uncommitted ConnectBankForm/CustomSelect edits on `release/v4.2.1`). Commit only when he
   asks; one commit per approved increment.
7. Respect `frontend-restructure.md` conventions (placement, size, no path aliases, mirror
   tests under `src/__tests__/`), and the two modal shells only.
8. **Reuse ready-made components, third-party first** (Nicola, 2026-11-12): before hand-rolling
   any UI piece, use a component from an installed library — **`@mui/material`** is installed
   (e.g. phone wallet switcher = MUI `SwipeableDrawer anchor="bottom"`, bottom tab bar = MUI
   `BottomNavigation`, "More" = MUI `Menu`), styled with our tokens — or an existing project
   component. Build from scratch only when nothing fits, and say so in the task spec.

## Dual UI (temporary)

- `uiVersion: "v1" | "v2"` stored per device (localStorage, try/catch) + a toggle
  "New interface (beta)" in `/settings` → Appearance. Default `v1` until Phase 11.
  Optional later: persist on the user (backend) — **DECISION**, not needed to start.
- Root gets `data-ui="v2"`. **v2 tokens and fonts are scoped under `[data-ui="v2"]`**, so
  shared primitives (`Button`, `Input`, …) restyle automatically through CSS variables.
- Where the **structure** changes (wallet card, sidebar, tabs, Subscriptions summary…) build
  a new component next to the old one and switch at **one composition point**
  (`WalletDashboard`, each `*Tab`). Logic/hooks/context stay shared — never fork a hook.
- Naming: new files are plain names in their feature folder (e.g. `WalletHeroCard.tsx`);
  the switch is `ui === "v2" ? <New/> : <Old/>`. Mark every switch with
  `// ui-v2-switch` so Phase 11 can find and delete them all.
- If a screen's dual version gets too expensive, Nicola can choose to go v2-only for it.

## Phase 0 — Foundations  *(orchestrator-led, needs sign-off)*
- [x] 0.1 Branch `feat/ui-redesign-v2` from `release/v4.2.1` (D6). The uncommitted
      ConnectBankForm/CustomSelect edits travelled along in the working tree — Nicola's, not ours.
- [x] 0.2 **Light theme for v2** — static mock (`docs/redesign-demos/d-light.html`) of the
      Transactions screen; sign-off on light tokens. **DECISION** → D7
- [x] 0.3 **Brand accent outside wallets** (login, global settings, admin, empty dashboard):
      brand violet `#8b6cf6`, fox orange, or inverted neutral. **DECISION** → D8 (mock: `d-accent.html`)
- [x] 0.4 **Wallet colour policy:** keep free hex (contrast via `onColor`) or curate a
      swatch list (and map existing neon colours?). **DECISION** → D9
- [x] 0.5 `onColor(hex)` added to the existing `utils/color.ts` (+ tests in `color.test.ts`).
      No `tint()`: `hexToRgba` already exists and CSS `color-mix` covers the rest.
- [x] 0.6 `utils/uiVersion.ts` store + `hooks/useUiVersion.ts` + `applyUiVersion()` in `main.tsx`;
      new **Appearance** section in `/settings` (there was none — theme picker lives in the header)
      with the "New interface (beta)" switch; also appears in the header settings deep-links. Tests added.
      Known limit: with blocked storage the switch snaps back to off (beta toggle, accepted).
- [x] 0.7 Tokens: v2 dark + light under `[data-ui="v2"]`, mapped onto `app-*` names;
      `--wallet`/`--on-wallet` set as CSS vars on the wallet root (replace scattered
      inline `wallet.color` styles in v2 components only).
      Done in `theme-tokens.css` + new Tailwind aliases in `index.css` (`app-raised`, `app-faint`,
      `app-income`, `app-expense-mark`, `app-warn`, `app-danger`, `wallet`, `on-wallet`,
      `font-display`; v1 fallbacks to the nearest old colour). `--wallet` defaults to the D8
      neutral; setting it on wallet roots is Phase 2. Light hairline = `--box-ring`.
- [x] 0.8 Fonts: self-host Bricolage Grotesque + Instrument Sans woff2 (OFL) in
      `src/assets/fonts/`, `@font-face` in `theme-tokens.css`, applied under v2 only.
      Done: variable latin woff2 `bricolage-var.woff2` (500–800) + `instrument-sans-var.woff2` (400–600).
- [x] 0.9 Promote the style draft into `frontend/style.md` as a "v2" section (v1 rules stay
      until Phase 11); update CLAUDE.md pointer.

## Phase 1 — New primitives  *(parallel-friendly: one subagent per primitive)*
Each: component + Vitest test + both themes. Spec in style §4.
- [x] `CategoryIcon` · [x] `StatTile` · [x] `StatusPill` · [x] `ProgressBar` ·
      [x] `SplitBar` (pure logic in `utils/splitParts.ts`) · [x] `EmptyState` (fox) ·
      [x] `WalletMiniCard` · [x] `WalletHeroCard` — all in `components/ui/`, visual only
      (no routing/DnD; Phase 2 wraps them). `ProgressBar` pure logic in `utils/progressWidth.ts`.
- [x] Iteration 1 (Nicola's review): D10 active wallet + wallet icon on mini/hero card; D11 warn fill.
- [x] `Button` v2 look via `useUiVersion` (primary = `bg-wallet text-on-wallet`; `accentColor`
      sets `--wallet`/`--on-wallet` on the button; danger = solid `app-danger` + `text-app-bg`).
- [x] `Selector` v2 look (separate v2 render path; active = `bg-app-raised`, active icon
      `text-wallet` or `accentColor`; never filled).
- [x] Amount display: `formatAmount(v, { signed: true })` → "+" / "−" (U+2212); income colour
      is the caller's `text-app-income`. Note: it-IT doesn't group 4-digit numbers ("9016,73").
- Fix: `bg-wallet`/`text-on-wallet`/`text-wallet` come from `@theme inline` (emit `var(--wallet)`
  directly) — a normal `@theme` var is resolved once on `:root` and ignored local overrides.
  `--wallet`/`--on-wallet` default on `:root` (v1 = brand violet/white, v2 = D8 neutral).
- Dev preview (temporary, untracked, **delete before commit**): `frontend/v2-preview.html` +
  `src/v2Preview.tsx` → `localhost:5173/v2-preview.html` (`?light`, `&w=5b7cfa` wallet hex).

## Phase 2 — Dashboard shell (v2 switch in `UserDashboard` / `WalletsBar` / `WalletDashboard`)
- [x] Mock round 1+2 (`d-shell.html`, `d-shell2.html`) → D12–D16.
- [x] Shared logic: `utils/period.ts` (`shiftPeriod`, `periodLabel`, `isSteppable`, `sumByType`)
      + `shiftPeriod`/`periodVersion` in `useTransactionFilters` → context; the filter bar's date
      picker remounts on `periodVersion` (it keeps its own state). `walletVars()` in `utils/color.ts` (F3 done).
- [x] `header/HeaderActions.tsx` extracted from `AppHeader` (sync, bell, profile menu, notification
      center) — AppHeader unchanged; v2 renders one instance (phone top bar or desktop title row).
- [x] Sidebar (desktop ≥1024px): brand, "Wallets", `WalletCard` v2 (= `WalletMiniCard` inside the
      same link/DnD anchor), footer "Invitations (n)" toggle (`InvitesList`) + "New wallet".
- [x] Phones: "Switch wallet" pill + MUI `SwipeableDrawer` (invites, wallets with DnD, New wallet),
      header actions on the right.
- [x] Tabs: desktop `Selector`; phones MUI `BottomNavigation` (4 + "More" → MUI `Menu`).
- [x] Title row (icon chip + name + currency name) + `TransactionsHero` on Transactions only
      (`WalletHeroCard` without name, arrows → `shiftPeriod`, Income/Spent `StatTile`s).
- [x] No `DashboardBackground` / `AppHeader` under v2; wallet root sets `walletVars(wallet.color)`.
- [ ] Nicola's look in the real app (desktop + phone, dark + light) → iterate.
- [ ] Known gaps to check: filter bar (`TransactionsFilter`) still v1-styled and `sticky top-17`
      (Phase 3); members count not in the meta line (needs data, ask); drag-reorder inside the
      drawer vs the drawer's swipe-to-close gesture; `Menu` "More" has no shadow in dark.

### D17 — Component library: MUI (2026-11-12)
- shadcn trial compared side by side with MUI: visually ~identical, Nicola had no preference →
  **MUI** (already installed for charts, v2 pieces already built with it, no 5 extra deps).
  Trial removed (files, deps, `@/` alias, eslint override, token mapping). "No path aliases" stays.
- Process (Nicola): **all implementation via Haiku subagents** (token saving); orchestrator only
  specs, reviews diffs, runs checks/screenshots.
- Not committed yet (Phase 0–2 all uncommitted on `feat/ui-redesign-v2`). Delete `v2-preview.html`
  and `src/v2Preview.tsx` before committing.

## Scope note (Nicola, 2026-11-12): practically every component and screen changes
Census (Haiku, 2026-11-12): 272 UI `.tsx` files; most-imported primitives: Button 49, Input 16,
Badge 16, FieldLabel 15, Card 13, ToastNotification 12, Selector 7, Toggle 5. Strategy: restyle
shared primitives first (tokens, then `// ui-v2-switch` only where structure changes) so every
screen inherits v2; screen phases then handle layout only. Track each file below; tick when done.

## Phase 2.5 — Shared primitives v2  *(run in parallel with Phase 3, disjoint files)*
- [x] Forms batch 1 (2026-11-12): `Input`, `Textarea`, `NumberInput`, `SearchInput`, `FieldLabel`, `Checkbox`, `Toggle`.
- [x] Forms batch 2 (2026-11-12): `AmountInput` + `AmountMathToolbar`, `CustomSelect`, `BoxedSelect`, `RoleSelector`,
      `TransactionTypeToggle`, `modals/auth/PasswordInput`, `auth/PasswordVisibilityToggle`.
- [x] Surfaces (2026-11-12): `Card`, `SwitchableCard`, `Badge`, `TagBadge`, `Collapse`, `Menu`, `DropdownManageButton`,
      `AccentHoverButton`, `FloatingActionButton`, `ToastNotification`/`ToastHost`, `OfflineBanner`, `PWAPrompt`.
- [x] Overlays (2026-11-12): `ModalDialog` (+ `ModalDialogRightAction`), `ResponsiveOverlay`, `Wizard`/`WizardShell`/`WizardStepper`,
      `ConfirmModal`, `DeleteModal`, `modals/common/DetailRow`.
- [x] Date picker (2026-11-12; 9 files in `components/datePicker/`, legacy `theme-*` tokens).
- [x] Tags (2026-11-12): `TagFilter`, `TagPickerTrigger`, `TagRow`, `TagTreePicker`, `TagSelectorAddForm`, `TagDropdownPanel`.
- [x] Selectors/icons (2026-11-12, ColorSelector restyle only): `ColorSelector` (F1), `CurrencySelector` + rows/panel, `ThemeSelector`, `components/icon/*`.
- [x] `CsvUploadField`, `InviteComposer`, `components/pat/*` (2026-11-12).

- [x] Cleanup batch (F9, 2026-11-12): `useAmountInput.ts` should emit the v2 expense class itself (AmountInput does a
      `.replace("text-app-red", …)` workaround); `TagPickerTrigger` v2 still applies the inline `color`
      ring when open; `ThemeSelector` copy "App Theme" → sentence case (update test); `InviteComposer`
      v2 ignores `accentColor` (check callers); `Button size="icon"` for the hand-styled icon buttons (F8).

## Phase 3 — Transactions tab
- [x] Rows (`TransactionRowV2`, day boxes with net total, v2 skeleton + EmptyState CTA): `CategoryIcon`, title fallback to leaf category, sub = category path,
      amount colouring per style; day header with daily total.
- [x] "Awaiting amount" (pending reminder) panel restyle — needs-attention row.
- [x] To-categorise toggle (v2: `Button` in the toolbar, out of TagFilter's topSlot) + `ToCategoriseActions` restyle.
- [x] Search, filters, period navigation in the new toolbar (v2: not sticky, wraps); `syncState` flags visible.
- [x] "Coming up" side column (next 31 days of subscriptions) — D18: wide screens only (≥1280px).

## Phase 4 — Subscriptions tab
- [x] Summary box: recurring cost / month, over a year, recurring income, `SplitBar` by
      subscription with legend % (pure calc → `subscriptionSummary.ts` + test).
- [x] List grouped Due now / This month / Later (reuse `subscriptionGroups.ts`),
      overdue = danger + icon, soon = warn.
- [x] Calendar view + Past subscriptions restyled, unchanged behaviour.
- [x] Wide screens: cap list width or box it — **SEE-AT-THE-TIME**.

## Phase 5 — Categories tab
- [x] Keep widget grid / Edit layout / hidden tray. Restyle `ChartCard`, donut (D20: v2 keeps the v1 two-level pie with labels, restyled only — Nicola 2026-11-13)
      (`TransactionPieChart`: ring, gaps, centre total), `CategoryRanking` (icon + bar + %),
      trend + heatmap colours.
- [x] `CategoryManagerDrawer` rows with `CategoryIcon`.

## Phase 6 — Statistics tab
- [x] Year tiles, `chartTheme.ts` v2 (style §5), overview table vertical/mobile-friendly,
      Sankey kept and themed.

### Phase 6b — Statistics rework (D24, 2026-11-13) — v2 only
Execution plan (waves, Haiku task specs): [`statistics-v2.md`](statistics-v2.md); kickoff: [`statistics-v2-kickoff.md`](statistics-v2-kickoff.md).
Mock: `docs/redesign-demos/stats-proposals.html#p0` ("Chosen" view; A/B/C there are the
source proposals). Order top → bottom. Period selector in the header: one year at a time
(`2026 / 2025 / 2024 / All time`) — the page never squeezes every month into one chart.
- [ ] **Bug (current v2):** `MonthlySnapshotChartV2` anchors bars at the y-domain minimum
      (−10k, pulled down by the negative balance line) instead of 0, so every bar looks the
      same height; 24+ months crammed with 2 axis labels. Superseded by "Month by month",
      but don't ship the current chart in the meantime.
- [ ] **KPI tiles** (4): Earned, Spent, Kept, Savings rate — value + one-line comparison
      (vs previous year / per-month average) + kit `sparkline` of the year's months.
      Extend `StatisticsSummaryV2`/`summaryStats.ts` (+ tests for deltas & rate).
- [ ] **Month by month** — kit `ComposedChart`: income bar above 0, expense bar below 0,
      "kept" (net) line with dots; 12 months of the selected year, every month labelled,
      **baseline at 0**, symmetric domain; tooltip per bar/dot; legend.
- [ ] **Worth knowing** — 3–4 insights computed client-side (pure `statisticsInsights.ts`
      + unit tests): most expensive month (×average, its biggest transaction), best month
      (net + % kept), subscriptions' share of spending, income steadiness (min–max).
      Each insight: icon tile (status colour) + bold line + muted explanation. Skip an
      insight when the data doesn't support it (e.g. < 3 months).
- [ ] **How the year added up** — kit `waterfall`, full width: balance at 1 Jan →
      each month's net (green up / expense-mark down, dashed connectors) → "Now"; labels on
      start, end and outlier months only.
- [ ] **Fixed vs everyday** — kit `BarChart` stacked per month: spending from subscription-
      generated transactions (`transaction.subscription` set) vs the rest; cap outliers
      with a "10.0k ↑" label instead of flattening the other months.
- [ ] **Where you're heading** (projection, Nicola 2026-11-13) — kit `LineChart` +
      `<Band lowerKey upperKey>` (placed before the line) + `<ProjectionLine>` (ref
      shadcn.io/charts/line "Ranges and forecasts"). Solid balance history, dotted projection
      from the last point, shaded likely range, "Forecast" area tint. Horizon selector:
      End of year / 1 year / 3 years / 5 years (history: last 12 months for ≤1y, all for
      longer). Model in pure `balanceProjection.ts` (+ unit tests): pace = **median** monthly
      net of the last 12 months (one-off months don't skew it); band = ±1.28 × robust σ
      (MAD × 1.4826) × √k (≈80% range); needs ≥ 3 months of history, else hide the card.
      Sub-line spells it out: "At your usual pace of +408 € a month you'd have about 8,806 €
      by Oct 2027 (likely 8,144 € – 9,469 €)" + a footnote on how it's computed. Tooltip
      per month with estimate + range.
- [ ] **Show the numbers** — the existing `OverviewTableV2`, collapsed by default (native
      `<details>` or the `Collapse` primitive), labels Earned / Spent / Kept.
- [ ] Removed from the v2 page: the Monthly/Cumulative `SwitchableCard` charts (v1 keeps them).
- [ ] Not chosen (kept out unless Nicola asks): "Balance over time" area chart, everything
      from proposal C. Moved to reports: spending calendar, weekday spending, savings-rate
      ring → [`report-charts.md`](report-charts.md).

## Phase 7 — Budget tab
- [x] `BudgetCard` v2: icon, scope, `StatusPill`, `ProgressBar`, used % + left/passed date;
      dashed "New budget" card; `EmptyState`.

## Phase 8 — Wallet settings tab
- [x] General (name, currency, colour swatches + live `WalletHeroCard` preview), Members,
      Share, Notifications, Data (bank accounts, bank rules, CSV), Delete wallet.

## Phase 9 — Modals, drawers, wizard  *(SEE-AT-THE-TIME, one at a time)*
- [ ] Transaction / subscription modals + details views, TagPicker, invites, PAT,
      Create-wallet wizard (24 files in `modals/wallet/`), Sync Center, notifications bell panel,
      exchange-rate cards, scheduling rules / monthly rule picker, import review, calendar day panel.

## Phase 10 — Pages outside the wallet  *(SEE-AT-THE-TIME, mock first)*
- [ ] Auth (login/register/forgot/reset) — still always-dark? brand accent per 0.3.
- [ ] OAuth consent page (MCP flow) · BankCallback · global `/settings` · admin
      dashboard (18 files in `admin/`) · landing `/about` (15 files) · ToDo page · `/settings` sections
      (account, security, tokens, notifications, about) · `AppHeader` v1 removal.

## Phase 11 — Cut-over & cleanup
- [ ] Default `uiVersion` → v2, then remove the toggle, every `// ui-v2-switch`, old
      components, v1 tokens, Plus Jakarta / JetBrains Mono fonts, `DashboardBackground`.
- [ ] Legacy `theme-*` usages in touched files gone; style.md = v2 only; CLAUDE.md updated;
      `graphify update .`; move this file to `DONE/`.

## Findings (to handle in their phase)
- F6 (2026-11-12): `--box-ring` is now `0 0 0 0 transparent` in dark (was `none`, which broke shadow
  lists). Follow-ups: needs-attention rows (`PendingTransactionsPanel` uses `ring-1 ring-app-border`
  instead) and `Card` danger tone can use `shadow-[inset_3px_0_0_var(--color-app-warn|danger),var(--box-ring)]`.
- F7: v2 `Badge` blue/purple/pink tones fall back to neutral (no v2 token); `uppercase` prop ignored in v2.
  `PWAPrompt` v2 untested (`virtual:pwa-register/react` doesn't resolve in Vitest — needs a stub).
  `AccentHoverButton` `accentColor` unused in v2 (remove at cut-over).
- F10: Budget v2 header aside = calendar month + days left (misleading for weekly/custom budgets?).
  Subscriptions summary excludes reminders (amountPending) — confirm. Coming up excludes bank-driven subs.
- [x] F11 (2026-11-12, cleanup batch 2, done): chart palette read at render → re-read on theme change
  (`useChartPalette` must depend on resolved theme); widget titles still Title Case in copy
  ("Category Trend", "Top Expense Categories") → sentence case in v2; settings hero preview shows the
  currency symbol as big value; Sankey savings pattern still `--color-app-blue`; statistics year tiles
  show all-history totals (mock: selected year); FlowTypeToggle inactive Income label not green.
- F12: Sankey labels single-line (value under the name needs `sankeyData.ts`); no footer summary line.
- F13: main chunk 1.97 MB vs 2 MiB PWA precache cap — next big import breaks the build; consider lazy-loading more tabs/routes (admin, landing, settings) before Phase 9-10.
- F8: (header bar kept, D19) `WizardStepper` v2: current step looks like done steps.
  Icon-only close buttons / token actions / CSV info are hand-styled (Button has no square icon size) — add `size="icon"` to Button?
- F1 (D9): `components/selectors/ColorSelector.tsx` is shared by the wallet colour **and** tag/icon
  colours (`IconColorSelector`, `IconPickerButton`, wizard `BasicsStep`). Swapping presets must be
  scoped (prop or v2-only) — ask Nicola in Phase 8 whether tags get the soft presets too.
- F2 (D7): in light, a pale wallet colour (yellow) as the active-tab icon on `--raised` is weak;
  same `color-mix(…70%, #000)` darkening as category glyphs is the likely fix — check in Phase 2.

- F3: any element that sets `--wallet` must also set `--on-wallet` (else text falls back to the
  root default — e.g. white-ish on yellow in light). Phase 2: add a `walletVars(color)` helper
  in `utils/color.ts` and use it in the wallet root + the 3 primitives that inline it today.
- F4: `Button` ripple stays white in v2 — weak on light wallet colours; revisit with Phase 2 CTAs.
- F5: evaluate [boneyard](https://github.com/0xGF/boneyard) (`boneyard-js/react`: `<Skeleton name loading>`
  / `<BoneSuspense>`, skeletons captured from the real UI by a build-time CLI) to replace the
  hand-rolled skeletons (`WalletSkeleton`, `SkeletonAmount`, … — see frontend-restructure 4.5).
  Check: fits the offline-first Dexie loading states, CLI in the Vite build/CI, bundle size. Phase 2.

## Decisions log
| # | Decision | Answer |
|---|---|---|
| D1 | Theme | Dark sober, light must keep working |
| D2 | Wallet colour weight | Strong, as a solid surface in one place |
| D3 | Personality | Category icons, wallet colour, fox / playful display type |
| D4 | Subscriptions layout | Summary + list |
| D5 | Old/new UI | Side by side during migration, v1 removed at the end |
| D6 | Base branch | `feat/ui-redesign-v2` from `release/v4.2.1` (2026-11-12) |
| D7 | Light tokens | As in `d-light.html`: bg `#f4f3f1`, surface `#fff` **+ 1px `--line` ring on boxes/tiles/sidebar/inputs**, raised `#eeece8`, line `#e4e1dc`, text `#1c1a17`, muted `#6b665e`, faint `#9a958c`, income `#2f8f55`, warn `#a86a0c`, danger `#c4412f`; category glyphs `color-mix(cat 70%, #000)` in light |
| D8 | Accent outside wallets | **Inverted neutral**: fill `--text`, text `--bg` (no brand violet/magenta in v2) |
| D10 | Active wallet (sidebar) | Only the active wallet is a solid card; the others are neutral `app-raised` rows with a 4px colour edge on the left (mock `d-active.html` §1b, D4). No outline. Both cards show `wallet.icon` before the name |
| D11 | Warn colour | Dark unchanged `#f0b85a`. Light: text `#9a5f00`, fill `#f0a020` (`app-warn-fill`, used by bars and the pill tint) |
| D12 | Desktop header | No header bar (H1): brand at the top of the sidebar; sync/bell/profile on the right of the wallet title row. Sidebar card text vertically centred |
| D13 | Wallet title + tabs | T1 (`d-shell2.html`): every tab starts with the title row (wallet icon chip + name + meta, actions right), tabs under it. The Transactions card drops the name (net + month + fox only) |
| D14 | Hero card | Only on the Transactions tab, no period switcher (Nicola 2026-11-12: duplicate of the toolbar date picker, which stays). The hero shows "Net in <period>" from the filters |
| D15 | Phone layout | M3: wallet switcher pill on top (opens a bottom sheet), tabs in a bottom bar (4 + "More" for Statistics/Settings), floating "+" |
| D16 | Invitations on phones | I1 (switcher = MUI `SwipeableDrawer` bottom sheet): at the top of the wallet-switcher sheet, with a badge on the switcher when pending. The sheet also has "New wallet" and must sit **above** the bottom tab bar |
| D18 | "Coming up" column | Kept, wide screens only (≥1280px) (Nicola 2026-11-12) |
| D19 | `ResponsiveOverlay` wallet-colour header bar | Kept in v2 (Nicola 2026-11-12) |
| D21 | Charts look | shadcn-style restyle of MUI charts (no Recharts): Category trend capped bars / thin zoom, Sankey translucent links + rounded nodes (ref shadcn.io/charts/sankey) (Nicola 2026-11-13) |
| D22 | Budget progress | v2 budget card uses an MUI `Gauge` (3/4 arc, colour by status) like shadcn.io/charts/gauge, replacing the bar (Nicola 2026-11-13) |
| D23 | Chart library for gauge/Sankey | shadcn.io chart kit (bklit-ui on TanStack Charts, MIT) installed by Nicola via the CLI into `src/components/ui/charts/` (775 files, +17 deps); `@/` alias + shadcn base back; TS lib ES2024; kit lazy-loaded (2026-11-13). Supersedes D22's MUI Gauge and D21's MUI Sankey in v2 |
| D9 | Wallet colour | Free hex stays (contrast via `onColor`); replace the 12 neon presets with the 10 soft swatches of the mock (`#f2cc2f #f5a524 #ff7a59 #ff6b8a #e05bd0 #8b6cf6 #5b7cfa #2ec4d6 #4cd17a #b9b4ab`); wheel/hex stays as "advanced". No data migration |
| D24 | Statistics page (v2) | Rework from `stats-proposals.html`: A tiles + Month by month + Worth knowing + Show the numbers (collapsed), B waterfall + Fixed vs everyday, + "Where you're heading" projection (Band + ProjectionLine, median pace, 80% range, horizons EOY/1y/3y/5y); C discarded; calendar / weekday / savings-rate ring go to the monthly & yearly reports (`report-charts.md`) (Nicola 2026-11-13) |
