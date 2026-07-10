# Frontend Restructure — Analysis & Execution Plan / TODO

> Authored 2026-07-07 from a 6-agent full read of `frontend/src` (~36k source lines,
> 197 `.tsx` + 52 `.ts`, 109 test files). **No code has been changed yet.**
> This plan is the single source of truth for the executing subagents: every task is
> self-contained (files, line refs, new-file names, acceptance criteria).
> Line refs are approximate (±5) — re-locate by content, not by number.

---

## Goal

Reorganize and correct the frontend structure and split large `.tsx` files into small,
understandable components — extracting reusable elements (hooks, pure helpers,
subcomponents) into their own files. **Not** a split-everything exercise: split only
along real responsibility boundaries; large-but-cohesive files stay whole.

## Assumptions (Nicola was AFK — he can veto any of these)

1. **Scope of "fix"** = structural + safe code-quality only (dead code, duplication,
   naming, English-only comments). **Zero behavior/visual changes.** Real bugs and
   style.md violations are *censused* in [Findings](#findings-census--decisions-for-nicola),
   not fixed.
2. **Git**: execute on a fresh branch off `main` **after** `feature/atomic-wallet-creation`
   merges. Confirm the base branch with Nicola at execution time (his standing rule).
   One branch per phase (or per area for Phase 5) — he merges manually.
3. **Folder naming**: lowercase for category folders, `PascalCase.tsx` for component
   files. Renames only where we already touch or where clearly wrong.
4. **Tests**: mirror-move with their sources (`src/__tests__/<same path>`); split a test
   file only when the source split makes it natural. Every extraction of pure logic MUST
   gain a unit test (repo hooks enforce test discipline anyway).

## Global constraints (apply to EVERY task, verbatim)

- **Behavior-invariant**: no user-visible change — no markup/classname redesign, no copy
  changes, no new features. Pure moves + extractions + deletions of dead code.
- **English only** for all comments and any strings you touch.
- **No path aliases exist** — all imports are relative. Every file move requires fixing
  relative imports in the moved file AND in all importers. Verify with `npm run build`.
- After every task: `npm run lint` → `npm test` → `npm run build` all green (the Stop
  hook runs these; CI gates in the same order). Prettier is auto-run by the hook.
- Moved sources take their mirrored test along; update test import paths.
- New pure modules (`*.ts` extracted logic) get a Vitest unit test.
- Do **not** touch: the MUI watermark CSS hack in `index.css`; `theme-colors.css`
  (generated); the animated `Sphere`/`AnimateBackground` components' behavior.
- After a session of changes, run `graphify update .` (repo convention).
- When a task says "adopt at call sites", change ONLY the listed call sites.

## In-flight file guard ⚠️

These files are **modified but uncommitted on `feature/atomic-wallet-creation`**
(snapshot 2026-07-07): `api/axiosConfig.ts`, `types/axios.ts`,
`modals/wallet/CreateWalletWizard.tsx`, `modals/wallet/walletCreation.ts` (+ their tests).
Any task touching `modals/wallet/**` or `api/axiosConfig.ts` lives in **Phase 6
(deferred)** and must re-check `git status` before starting.

## Execution protocol for subagents

- Phases 1→4 are sequential *as phases* (later phases consume earlier outputs), but
  tasks **within** a phase are independent and parallelizable unless marked otherwise.
- Phase 5 areas (5A–5I) are mutually independent → one subagent per area is safe,
  EXCEPT where a task consumes a Phase 4 shared module (noted per task).
- Each task = one commit (conventional message, e.g. `refactor(tag): split CategoryManagerDrawer`).
- If a task uncovers something not in this plan, append it to the Findings section —
  do not fix opportunistically.

---

## Phase 1 — Dead code removal (independent, low risk, do first)

- [ ] **1.1** Delete `register/Register_old.tsx` (285 lines, zero references; also the
  worst Italian-comment/hand-rolled-input offender). No test exists for it.
- [ ] **1.2** Delete `dashboard/wallet/WalletMenu.tsx` (64 lines, fully dead — only refs
  are a commented import at `WalletDashboard.tsx:8` and a doc mention in
  `components/ui/Menu.tsx:13`; clean both up).
- [ ] **1.3** `dashboard/transaction/TransactionsTab.tsx`: remove the hidden
  `TransactionModal` block (~L21–29) whose ref is never opened, plus the now-unused
  `transactionModalRef` and `TransactionModal`/`TransactionModalHandle`/`CurrencyCode`
  imports. (`TransactionsTable` renders its own modal + FAB.)
- [ ] **1.4** Delete `modals/TransactionModal/RecurringPaymentToggle.tsx` (dead: only
  ref is the commented block `TransactionModal.tsx` ~L240–246 — remove that too) and its
  test `__tests__/modals/TransactionModal/RecurringPaymentToggle.test.tsx`.
- [ ] **1.5** Remove dead commented blocks: `TransactionsTable.tsx` ~L104–107 (malformed
  `// @ ts-ignore` block), `header/AppHeader.tsx` ~L121–123, large commented icon groups
  in `utils/icons.ts` (~L62, 139–141, 344–348, 566, 598).
- [ ] **1.6** Delete `src/App.css` (dead Vite boilerplate — imported nowhere).
- [ ] **1.7** `dashboard/layout/useTabLayout.ts`: remove never-called interface methods
  `move`, `reorderSlot`, `pop` (+ impls) and the then-unused `moveSlot` import from
  `utils/tabLayout`. Keep `moveSlotToIndex`/`reorderSlotToIndex`/`popTo`.
- [ ] **1.8** Un-export internals: `flattenTree` in `utils/tagOrder.ts` (internal-only);
  `recentMonthsZoom` in `dashboard/tag/useRecentMonthsZoom.ts` (no external importer).
- [ ] **1.9** `header/AppHeader.tsx`: drop the unused `isAdmin?` prop after checking the
  call sites still compile.

## Phase 2 — Targeted moves & renames (do BEFORE splits so new files land in final homes)

Each move: `git mv`, fix relative imports in file + importers, mirror-move the test,
build green. One commit per bullet.

- [ ] **2.1** `register/Register.tsx` → `auth/Register.tsx`; move
  `__tests__/register/Register.test.tsx` → `__tests__/auth/`; update `App.tsx:14`;
  delete the now-empty `register/` folder.
- [ ] **2.2** `components/DataPicker/` → `components/datePicker/` (it is a DATE picker —
  fixes both the typo and the folder-case convention). Mirror `__tests__/components/DataPicker/`.
- [ ] **2.3** Normalize modal folder case: `modals/Calendar/` → `modals/calendar/`,
  `modals/TransactionModal/` → `modals/transaction/`. Flatten the over-nested
  `TagPicker/TagPicker.tsx` → `modals/transaction/TagPicker.tsx`. Mirror tests.
- [ ] **2.4** Normalize remaining `components/` case: `LandingPage/` → `landing/`,
  `TagFilter/` + `TagSelector/` → merge into `components/tags/` (they share
  `useTagTree`/`TagRow`/`TagDropdownPanel` already), `ToDoPage/` → `todo/`. Mirror tests.
- [ ] **2.5** `components/auth/` → `components/password/` (kills the confusing
  `components/auth` ↔ `src/auth` name clash; contents are password-rule UI shared by
  auth + register + settings).
- [ ] **2.6** `utils/types.ts` → `types/domain.ts` (real domain model next to the other
  `types/`; ~40 importers — mechanical sed + build). Update the re-export in
  `api/walletDataCache.ts`.
- [ ] **2.7** Shared-but-buried components to shared homes (import-fix only, no rewrite):
  - `dashboard/statistics/SwitchableCard.tsx` → `components/ui/SwitchableCard.tsx`
    (already imported cross-feature by `layout/WidgetSlot`).
  - `dashboard/statistics/DateRangeBanner.tsx` → `dashboard/DateRangeBanner.tsx`
    (used by both statistics and tag tabs).
  - `modals/transaction/TransactionTypeToggle.tsx` → `components/ui/TransactionTypeToggle.tsx`
    (used by subscription modal, views, wizard).
  - `modals/subscription/SchedulingRules.tsx` → `modals/common/SchedulingRules.tsx`
    (used by subscription modal + 2 wizard files).
  - (`ExchangeRateSection` moves in task 5F.1 together with its split.)
- [ ] **2.8** Rename `dashboard/tag/CategoryCharts.tsx` → `TransactionPieChart.tsx`
  (file exports only `TransactionPieChart`; importers: `categoriesWidgets.tsx`,
  `components/landing/Features.tsx`).
- [ ] **2.9** Move `SettingsSectionDef` type from `settings/SettingsNav.tsx:5-12` into
  `settings/sections.ts` (data owner) so the data file stops importing from a component.

## Phase 3 — English-only comment sweep (mechanical, zero behavior)

Translate Italian comments to English. No code changes in the same commit.

- [ ] **3.1** Dashboard: `WalletsBar` (L142–215 area), `WalletCard` (L176,188),
  `WalletTabs` (L18), `UserDashboard` (L65–84,144), `TransactionsTable`
  (L15,57,67,96,112,141,152), all `dashboard/subscription/*` (heavy), `AdminDashboard.tsx:77`.
- [ ] **3.2** Modals: `TransactionView.tsx` (L59–130, heaviest), `SubscriptionModal.tsx:271`.
- [ ] **3.3** Components: `ui/AmountInput.tsx` (~25 comments), `datePicker/CustomDatePicker.tsx`
  (~12), `CalendarContainer.tsx` (45,110), `YearSelector.tsx:29`, `icon/Icon.tsx` (6–8,16),
  `icon/IconPickerButton.tsx:109`.
- [ ] **3.4** Utils/root: `subscriptionHelper.ts` (~18, incl. typo "OOttiene"),
  `walletSlug.ts`, `ProtectedRoute.tsx`, `mathEvaluator.ts`, `runtime-env.d.ts`,
  `main.tsx:7`, `index.css` (L6,107,148 — comments only, do NOT touch the watermark rule
  itself), `App.tsx:6`. (`api/axiosConfig.ts` Italian comments → Phase 6, in-flight.)

## Phase 4 — Shared foundations (new utils / hooks / ui primitives)

These unblock Phase 5. Every new module ships with a unit test. "Adopt at call sites"
= mechanical replacement, identical behavior.

- [ ] **4.1** `utils/format.ts` — `formatAmount(value)` (the exact current
  `toLocaleString("it-IT", {min/max FractionDigits:2})` body, with the `0 → "—"` guard as
  an option). Adopt at the 7 identical copies: `statistics/OverviewCell:12`,
  `OverviewTable:35`, `StatisticsSummary:11`, `tag/CategoryHeatmapChart:26`,
  `CategoryRanking:15`, `CategoryTrendChart:29`, `TransactionPieChart` (inline ~L190).
  Keep `it-IT` for now (locale decision → Findings F8).
- [ ] **4.2** `utils/currencies.ts`: add `getCurrencySymbol(code)` =
  `CURRENCY_META[code]?.symbol ?? code`; adopt at the ~9 inline copies (SubscriptionCreateMode:67,
  SubscriptionsStep:65, SubscriptionView:72, SubscriptionModal:189, TransactionModal:134,
  TransactionView:67, SubscriptionCard:187, TagsTab:39, TransactionRow:90). Then split the
  file: `utils/currencies/meta.ts` (types + `CURRENCY_META` + `MAIN_CURRENCY_CODES` +
  `getCurrencySymbol`), `catalogue.ts` (Frankfurter fetch+cache), `preferred.ts`
  (preferred-FX prefs), barrel `index.ts` so importers don't churn.
- [ ] **4.3** `utils/months.ts` — `MONTH_LABELS` (Jan…Dec). Adopt at the 5 copies:
  `CategoryTrendChart:12`, `CategoryHeatmapChart:9`, `CumulativeChart:18`,
  `MonthlySnapshotChart:19`, `OverviewTable:13` (`MONTHS`).
- [ ] **4.4** Shared hooks (one commit each):
  - `hooks/useCopyToClipboard.ts` (`{copied, copy}`, 3 s reset) — adopt:
    `TokensSection:302–311`, `InvitesTable:49–52`, `modals/pat/PatModal:183` /
    `PatShowTokenView:54–69`.
  - `hooks/useHoldToConfirm.ts` (RAF press-and-hold + progress) — adopt:
    `common/DeleteModal:57–122`, `common/ConfirmModal:52–97`.
  - `hooks/useSelection.ts` (`Set<string>` toggleOne/toggleAll/clear) — adopt:
    `admin/Backups:227–245`, `settings/sections/TokensSection:246–258`.
  - `hooks/useOutsideClick.ts` (standardize; `react-use`'s `useClickAway` is already a
    dependency — pick ONE and use it everywhere) — adopt at the ~9 hand-rolled copies:
    `datePicker/CustomDatePicker`, `tags/useTagTree`, `ui/CustomSelect`, `ui/Menu`,
    `transaction/TransactionsSearch`, `modals/tags/CreateTagModal`, wizard `BasicsStep`
    (wizard file → defer that one to Phase 6), `icon/IconPickerButton`, `selectors/CurrencySelector`.
  - `hooks/useEscapeKey.ts` — adopt: `CurrencySelector:203`, `TagSelectorAddForm:97`,
    `ui/Menu:73`, `ui/ResponsiveOverlay:62`, `ui/WizardShell:31`, `tag/useInlineTagEdit:83`.
  - `hooks/useNow.ts` (1 s ticker) — adopt: `admin/InvitesTable:27–47`, `admin/SystemTab:436–439`.
  - `hooks/useDebounce.ts` — adopt the 2 hand-rolled debounces in `WalletProvider` (:57, :133).
  - Reconcile `hooks/useMediaQuery` vs `react-use` `useMedia` (SwitchableCard uses the
    latter) — standardize on the local `useMediaQuery`.
- [ ] **4.5** New `components/ui/` primitives (visual output must be pixel-identical to
  the copies they replace — copy the exact classes):
  - `IconButton.tsx` (size, tone, `spinning`, `danger`) — adopt: `Backups` RowAction
    (:101–118) + clear-✕ (:453–461), `AccountSection` IconAction (:69–91), `UserRow:35–42`,
    `InvitesTable:144–160`.
  - `BulkActionBar.tsx` (count/hint + actions slot) — adopt: `Backups:411–464`,
    `TokensSection:401–463` (pairs with `useSelection`).
  - `SectionHeader.tsx` — promote from `SubscriptionList:25–40`.
  - `Skeleton.tsx` set (`SkeletonLine/Row/Circle`) — unify the 3 reinventions:
    `WalletsBar:41–49`, `TransactionsTable:28–45`, `SubscriptionTab:72–94`.
  - `StatChip.tsx` — promote from `ImportReviewModal:57–79`.
  - `FieldLabel.tsx` (or exported class const) — the label class string duplicated in ≥9
    files (`SubscriptionCreateMode` already has `FIELD_LABEL` L24–25 as the model).
    Adopt only at non-wizard sites now; wizard sites in Phase 6.
  - `useRipple.ts` — dedupe the ripple between `WalletCardUI` (:25–57) and `Button.tsx`.
  - `AccentHoverButton.tsx` — the hover-accent inline-style button hand-rolled 3× :
    `CategoryManagerDrawer` AddCategoryButton (:115–177), `layout/HiddenTray` TrayChip
    (:15–48), drawer `ChildDropZone`. (Consumed by task 5A.1.)
- [ ] **4.6** `utils/walletOrder.ts` — `readWalletOrder / sortWalletsBySavedOrder /
  writeWalletOrder` (localStorage `wallet_order`); dedupe `UserDashboard:37–50` and
  `WalletsBar:143–184,215–233` (identical `console.error` included).
- [ ] **4.7** `utils/session.ts` — `clearSession()`; dedupe the localStorage/session
  teardown ×3: `SecuritySection` handleSignOutAll, `DeleteAccountSection:46–49`,
  `auth/Login.tsx:25–27`. THEN centralize token storage in `utils/authHelper.ts`
  (`getToken/setToken/clearToken`, `mustChangePWD` accessors) and adopt at the 13 files
  reading the `"jwtToken"` literal directly (grep for it; skip `api/axiosConfig.ts` —
  in-flight, Phase 6).
- [ ] **4.8** `utils/color.ts` — move `hexToRgba` from `tag/TransactionPieChart:10–15`
  and `toHex()` + `FALLBACK_HEX` from `selectors/ColorSelector:30–61`.
- [ ] **4.9** `utils/parseCsv.ts` — move the generic RFC-4180 `parseCsv` out of
  `dashboard/settings/csvImport.ts:118–193` (no domain knowledge in it).
- [ ] **4.10** Extend `utils/subscriptionHelper.ts` (already tested): move the 4 pure
  helpers from `SubscriptionCard:16–103` (`formatCompactFrequency`, `getDaysLeft`,
  `getDaysLeftColor`, `getDaysLeftText`); unify the second `getDaysLeft`
  (`SubscriptionList:73`); add `applyTransactionToSubscription(sub, tx)` deduping the
  merge written 3× (`SubscriptionCalendar:169–180`, `SubscriptionList:237–246, 271–280`).
- [ ] **4.11** `utils/recentMonthsZoom.ts` — unify the "recent 12 months" zoom math
  duplicated between `tag/useRecentMonthsZoom.ts` and `StatisticsTab:50–74`.
- [ ] **4.12** Split `utils/tabLayout.ts` (378) into `utils/tabLayout/{types,storage,mutations}.ts`
  + barrel `index.ts` (types L11–35; storage L37–167; the 11 pure mutations L176–378).
  Existing test file splits naturally along the same seams.

## Phase 5 — Feature-area splits (one subagent per area; 5A–5I independent)

### 5A — dashboard/tag

- [ ] **5A.1** Split `CategoryManagerDrawer.tsx` (704 — biggest file in the app) into:
  `categoryDnd.ts` (pure: `CONTAINER_PREFIX` :52, `nestedCollisionDetection` :71–83,
  `resolveTargetParent` :292–297), `useCategoryTreeDnd.ts` (drag state machine :222–231,
  :268–274, :299–456), `useCategoryTree.ts` (derived tree + sort + sync :195–277),
  `ChildDropZone.tsx` (:86–108), `CategoryDragOverlay.tsx` (:641–700),
  `CategoryTreeList.tsx` (:538–639); AddCategoryButton (:115–177) → consume
  `ui/AccentHoverButton` (4.5). Drawer shrinks to ~120-line shell. Unit-test `categoryDnd.ts`.
- [ ] **5A.2** Chart dedup (needs 4.1/4.3): new `tag/ChartCard.tsx` (bare/card shell +
  title + shared "No data available" empty state), `tag/ChartLegend.tsx` (swatch row),
  `tag/FlowTypeToggle.tsx` (Income/Expense `Selector` wrapper). Move the `buildTrend` /
  `buildHeatmap` / `buildRanking` data-shapers into `categoryAgg.ts` (or sibling
  `categoryChartData.ts`) with unit tests. `CategoryTrendChart` / `CategoryHeatmapChart` /
  `CategoryRanking` stay as single-chart files consuming the shared pieces (do NOT chop
  the charts themselves).

### 5B — dashboard/statistics

- [ ] **5B.1** `OverviewTable.tsx` (321): extract `useOverviewData.ts` (:52–161 — years,
  monthly buckets/totals, yearly columns, auto-scroll effect); make `OverviewCell` expose
  a wrapper-less `OverviewCellContent` and delete the duplicated `renderValueCell`
  (:163–194); optional `OverviewOverlayColumns.tsx` (:233–266).
- [ ] **5B.2** Unify `CumulativeChart.tsx` (217) + `MonthlySnapshotChart.tsx` (207) —
  ~80% identical: new `statistics/MonthlyChart.tsx` (shared surface/axis/tooltip/legend)
  + `statistics/chartTheme.ts` (the two MUI themes, tooltip `sx`, series colors). The two
  files collapse to ~40-line dataset-shapers. Highest-value statistics dedup.
- [ ] **5B.3** `CashFlowSankey.tsx` (312): move the pure node/link builder (:40–195) to
  `sankeyData.ts` + unit test; translate the 2 Italian comments (:129, :177). Chart JSX stays.
- [ ] **5B.4** `StatisticsTab.tsx`: consume `utils/recentMonthsZoom` (4.11).

### 5C — dashboard/layout

- [ ] **5C.1** `WidgetGrid.tsx` (436): extract `useWidgetGridDnd.ts` — ALL drag
  state/refs (:84–123), derivations (:125–153), handlers (:155–350). Grid becomes ~120
  lines of DndContext/grid/DragOverlay JSX. Do NOT fragment the JSX or the geometry
  modules (`slotPlacement`, `popPlacement`, `mergeAwareCollision` are already well-factored).
  Move pure `eventPointer` (:47–53) into `popPlacement.ts` or `layout/dndPointer.ts`.
- [ ] **5C.2** (optional) `WidgetSlot.tsx` (237): extract `GroupEditHeader.tsx`
  (:120–163) + `SlotEditOverlay.tsx` (:185–218) only if touched anyway.

### 5D — dashboard/settings (CSV)

- [ ] **5D.1** New `dashboard/settings/csvExport.ts` (pure, tested): `downloadCsv`
  (DataTab :102–118), `sortTagsForExport` (:87–100), the three inline export row-builders
  (:139–156, :168–174, :186–206), and `buildCsv`+`downloadSample` from
  `CsvFormatModal:152–172` — single source for cell-quoting + Blob download (currently
  duplicated across the two files).
- [ ] **5D.2** `DataTab.tsx` (454): extract `useCsvImport.ts` (review state + types
  :52–74, `toRecap` :77–81, `buildJob` :220–268, `submitJob` :272–288, `requestImport` /
  `handleFileSelected` :290–325 + file-input refs). DataTab becomes a ~140-line shell;
  optionally one `CsvActionPanel` for the near-identical Export/Import panels (:376–450).
- [ ] **5D.3** `CsvFormatModal.tsx` (398): extract `csvSamples.ts` (the `SAMPLES` data
  literal :22–149) and consume `csvExport.ts`. Component keeps the reference-sheet JSX.
- [ ] **5D.4** `csvImport.ts`: consume `utils/parseCsv` (4.9); keep the rest whole.
- [ ] **5D.5** (optional) `ShareSettingsSection.tsx` (217): extract `useWalletMembers.ts`
  (fetch/invite/remove/role :34–109) if touched.

### 5E — dashboard core (wallet / transaction / subscription / root)

- [ ] **5E.1** `WalletProvider.tsx` (292): split into `useWalletData.ts` (load/fetch/
  cache/abort :112–180), `useTransactionFilters.ts` (filter state + debounce via 4.4 +
  `filteredTransactions` :46–100), `useWalletMutations.ts` (tag/wallet CRUD handlers
  :182–260). Provider becomes a thin composer; `WalletContext.tsx` unchanged; existing
  provider test keeps passing.
- [ ] **5E.2** `WalletsBar.tsx` (354): extract `walletBarSkeletons.tsx` (WalletSkeleton
  :41–49 + AddWalletTile :52–69 → or consume `ui/Skeleton` from 4.5),
  `useWalletDragReorder.ts` (sensors, activeId, drag handlers, click-suppression
  :83–103/:200–213); consume `utils/walletOrder` (4.6). Bar stays as the shell.
- [ ] **5E.3** `UserDashboard.tsx` (218): extract `useWalletRouting.ts` (slug resolution
  + canonical redirects :73–96) and `useWalletDeletion.ts` (delete/quit + ConfirmModal
  wiring :100–125); consume `utils/walletOrder` (4.6).
- [ ] **5E.4** `TransactionsTable.tsx` (196): extract `groupTransactionsByDate.ts`
  (grouping/sorting/`formatDateHeader` :58–91, pure + tested) and consume `ui/Skeleton`.
- [ ] **5E.5** Subscriptions: `SubscriptionList.tsx` (350) → `useSubscriptionGroups.ts`
  (data prep :70–150) + `PastSubscriptionsSection.tsx` (:211–311) + consume
  `ui/SectionHeader` (4.5) + `subscriptionHelper` (4.10). `SubscriptionCard.tsx` (209) →
  helpers already moved by 4.10, card stays. `SubscriptionCalendar.tsx` (222) →
  `buildCalendarGrid.ts` (:56–77, pure + tested) + `CalendarDayCell.tsx` (:144–208,
  consume `applyTransactionToSubscription`). `SubscriptionTab.tsx` (163) → consume
  `ui/Skeleton` for :72–94.
- [ ] **5E.6** `WalletCard.tsx`: consume `ui/useRipple` (4.5); rest stays.

### 5F — modals (non-wizard)

- [ ] **5F.1** `ExchangeRateSection.tsx` (425, hottest modal file) — split AND move to
  `modals/common/exchangeRate/`: `useExchangeRate.ts` (fetch effect :95–126, auto-rate
  state, `restoreAutoRate` :181–189, 3-way binding handlers :154–178 — pure-ish, tested),
  `ExchangeRateConversionCard.tsx` (:215–334), `ForeignCurrencyToggleCard.tsx`
  (:342–424 + `handleToggleStar` :86–91). Update the 4 import sites (TransactionModal,
  SubscriptionModal, both Views; the wizard import updates in Phase 6). Remove the stray
  `console.error` :117.
- [ ] **5F.2** TransactionModal ↔ SubscriptionModal dedup (~70% identical — biggest
  modal win, HIGHER RISK, do after 5F.1): extract `modals/common/useAmountEntryForm.ts`
  (shared state block, `openModal` reset branches, `handleSave` payload build incl. the
  shared date-string logic, `currencySymbol`/`canSave`) and, if clean,
  `modals/common/AmountEntryFields.tsx` (AmountInput + type toggle + TagPicker/date grid
  + exchange section). `SubscriptionModal` = shared parts + `SchedulingRules` +
  name/notes + auto-FX; keep BOTH imperative `openModal` handles intact (consumed by
  refs elsewhere). Also extract the pure payload builder `subscriptionPayload.ts`
  (SubModal :138–166). Both existing modal test files must keep passing unchanged —
  they are the behavior spec for this task.
- [ ] **5F.3** `PatModal.tsx` (350): extract `usePatTokens.ts` (state :32–52 + all
  data/actions :69–226 incl. `setPermission`); modal becomes shell + view switch (~120).
  Hoist `setPermission` to `modals/pat/walletPerms.ts` — it is duplicated verbatim in
  `TokensSection:159–175` and `OAuthConsent:188–202` (consumed by 5I.2/5I.4).
- [ ] **5F.4** `ImportReviewModal.tsx` (251): split bodies `ImportReviewConfirmBody`
  (:172–205) / `ImportReviewRecapBody` (:206–246); consume `ui/StatChip` (4.5).
- [ ] **5F.5** `DeleteModal` + `ConfirmModal`: consume `useHoldToConfirm` (4.4).
- [ ] **5F.6** `calendar/CalendarDayDetailModal.tsx` (244): extract `useDayNavigation.ts`
  (prev/next/keyboard/swipe :85–126), `CalendarDayNavHeader.tsx` (:163–190),
  `CalendarDaySubscriptionList.tsx` (:204–238, consume `applyTransactionToSubscription`).
  Rename file to match its export (`CalendarDayDetailPanel`).
- [ ] **5F.7** `wallet/InviteModal.tsx` (209): extract pure `inviteCopy.ts`
  (`roleCapability` :25–64, `formatInvitedAt` :67–75) + unit test. (File is NOT in the
  in-flight set — safe.)
- [ ] **5F.8** `transaction/TransactionView.tsx` (155): lift the nested
  `SubscriptionModal` (:146–152) to the parent via an `onOpenSubscription` callback;
  extract shared `modals/common/DetailRow.tsx` used by both `TransactionView` and
  `SubscriptionView` (duplicated icon+label+value `divide-y` markup).

### 5G — components/ui hot spots

- [ ] **5G.1** `ui/AmountInput.tsx` (397): extract `utils/amountFormat.ts` (pure
  `hasOperators` :19–22 + `formatAmountString` :24–60 — pairs with `mathEvaluator`),
  `ui/useAmountInput.ts` (uncontrolled-sync effects :98–158, `updateAmountState`
  :161–218, resolve/key/blur/focus handlers :221–309, display state :78–83),
  `ui/AmountMathToolbar.tsx` (mobile operator toolbar :353–394). Shell drops to ~80 lines.
- [ ] **5G.2** `ui/Wizard.tsx` (316): extract `ui/WizardStepper.tsx` (rail :141–250 +
  `NODE_BASE` :54–56); optional `ui/WizardFooter.tsx` (:271–311 + :126–131). State
  machine stays in `Wizard.tsx`.
- [ ] **5G.3** Shared dropdown plumbing: `ui/useDismiss.ts` (outside-click + Esc,
  builds on 4.4) consumed by `CustomSelect` (:37–48), `Menu` (:66–81), `CurrencySelector`,
  `IconPickerButton`, `CustomDatePicker`, `useTagTree` (:26–38).

### 5H — components (pickers/selectors/landing/pat)

- [ ] **5H.1** `datePicker/CustomDatePicker.tsx` (438): extract `datePresets.ts`
  (`PresetType`/`DateRangeValue`/`DatePickerValue` + `mainPresets` — breaks the type
  back-import cycle from CalendarContainer/DayCell/MonthGrid), `useDatePicker.ts`
  (mobile detection :100–105, outside-click :78–90 → 4.4, dialog `showModal` :92–98,
  preset→range effect :121–161, auto-close :183–192), `DatePickerTrigger.tsx`
  (:194–295), `DatePickerSidebar.tsx` (:325–374), `DatePickerSurface.tsx` (:397–435).
- [ ] **5H.2** `selectors/CurrencySelector.tsx` (412): extract `useCurrencyList.ts`
  (hydration + memo lists :46–132), `useCurrencyDropdown.ts` (positioning/popover/
  keyboard :96–207), `CurrencyOptionRow.tsx` (:209–291), `CurrencyDropdownPanel.tsx`
  (:349–409). Trigger + composition stays.
- [ ] **5H.3** `selectors/ColorSelector.tsx` (246): consume `utils/color.toHex` (4.8);
  extract `colorPresets.ts` (:10–26); optional `ColorAdvancedPanel.tsx` (:191–243).
- [ ] **5H.4** `pat/TokenListItem.tsx` (236): extract `useLongPressSelect.ts` (:39–41,
  :68–109); optional `TokenPrefixReveal.tsx` (:163–208).
- [ ] **5H.5** `tags/TagTreePicker.tsx` (286): extract `TagPickerTrigger.tsx` (:206–275).
  (Its hand-rolled search input vs `SearchInput` → Findings F13, visual-risk.)
- [ ] **5H.6** `landing/Navbar.tsx` (237): extract `useActiveSection.ts` (:18–40 —
  generic scroll-spy; note `settings/useScrollSpy` exists, reuse if compatible) and
  `NavLinks.tsx` (:42–134).

### 5I — settings / admin / auth

- [ ] **5I.1** `admin/Backups.tsx` (666): split into `admin/backups/`:
  `backupFormat.ts` (pure :43–97 + unit test), `types.ts` (:29–39), `useBackups.ts`
  (load/run/upload/download/confirm/delete :176–322), `BackupsToolbar.tsx` (:344–409),
  `BackupsTable.tsx` + `BackupRow.tsx` (:466–606), `backupConfirmCopy.ts` (:608–661);
  consume `IconButton`/`useSelection`/`BulkActionBar` (4.4/4.5).
- [ ] **5I.2** `settings/sections/TokensSection.tsx` (579): split into `settings/tokens/`:
  `tokenHelpers.tsx` (types + `isMcpToken` + local Badge → rename `TokenTypeBadge`
  :27–46), `useTokens.ts` (fetch/CRUD/bulk :76–300), `TokenDialog.tsx` (:334–373,
  :531–560), `TokenFilterPills.tsx` (:378–397); consume `useSelection`/`BulkActionBar`/
  `useCopyToClipboard`/`walletPerms` (4.4/4.5/5F.3).
- [ ] **5I.3** `admin/SystemTab.tsx` (486): split into `admin/system/`: `types.ts`
  (:27–46), `jobSchedule.ts` (consts + pure helpers :48–119 + unit test), promote the
  local boxed `Select` (:123–135) → `components/ui/BoxedSelect.tsx`, `JobCard.tsx`
  (the 273-line inline component :139–411) + `useJobSchedule.ts` (:146–227) +
  `WeekdayPicker.tsx` (:304–326) + `JobRunHistory.tsx` (:369–408); consume `useNow` (4.4).
- [ ] **5I.4** `auth/OAuthConsent.tsx` (358): extract `auth/oauth/useOAuthParams.ts`,
  `useOAuthAuthorize.ts` (:80–186; keep the deliberate raw-axios call :147–164 isolated
  there — OAuth endpoints are not under `/api`), `OAuthErrorState.tsx` (:207–250, same
  layout ×2); consume `walletPerms` (5F.3).
- [ ] **5I.5** Auth-shell dedup (LoginForm/ForgotPassword/ResetPassword/Register are
  ~60% duplicated shell — the glass-card class string is byte-identical ×4):
  `auth/AuthCard.tsx` (card + shake prop), `auth/AuthBrandLockup.tsx`,
  `auth/useShake.ts`, `auth/PasswordVisibilityToggle.tsx` (already solved in
  `modals/auth/PasswordInput.tsx:39–47` — reuse/extract), `auth/useInviteToken.ts` +
  shared `InviteResponse` type (identical verify-on-mount flow Reset:45–68 /
  Register:48–73), `auth/AuthErrorCard.tsx` (Reset:130–145 / Register:146–163).
  Adopt in all four screens; all four existing test files must keep passing unchanged.
- [ ] **5I.6** `auth/ForgotPassword.tsx` (238): extract `ForgotPasswordSent.tsx`
  (:165–223) + `useCooldown.ts` (:32–38, :93–98).
- [ ] **5I.7** `settings/sections/AccountSection.tsx` (421): split into
  `settings/account/`: `AccountRow.tsx` (Row :51–91), `UsernameRow.tsx` (:97–146,
  :235–271), `EmailChangeRow.tsx` + `useEmailChange.ts` (double-OTP flow :102–224,
  :274–400), `OtpInput.tsx` (:338–364); `storeToken` → `utils/authHelper` (4.7);
  `formatDate` → consolidate with the copies in `AboutSection:8–19` / `UserRow:13–21`
  ONLY where output is identical (locale divergence → Findings F7); IconAction →
  `ui/IconButton`.
- [ ] **5I.8** `settings/sections/SecuritySection.tsx` (270): extract
  `settings/security/MfaMethods.tsx` (data-driven :36–83 + :214–238),
  `ChangePasswordCard.tsx` (:91–212), `SignOutEverywhereCard.tsx` (:121–132, :240–267 —
  consume `utils/session` 4.7).
- [ ] **5I.9** `admin/UserDirectory.tsx` (163): extract a generic `useTableSort.ts`
  (:32–75) if trivial; otherwise leave.

## Phase 6 — DEFERRED until `feature/atomic-wallet-creation` merges ⚠️

Re-check `git status` before starting any of these.

- [ ] **6.1** `api/axiosConfig.ts` (221): translate Italian comments; split into
  `api/interceptors/authRefresh.ts` (refresh queue + 401 branch :49–148) and
  `api/interceptors/offline.ts` (GET-cache + offline queue :73–91, :150–215), keeping
  instance + request interceptor in `axiosConfig.ts`. Reconcile with the branch diff first.
- [ ] **6.2** `modals/wallet/CreateWalletWizard.tsx` (390): extract
  `WalletCompletionScreen.tsx` (:82–181 + `outcomeSummary`/`RES_LABEL` :48–77);
  colocate `DEFAULT_DRAFT` with `walletCreation.ts`; optional `useWalletDraft()`
  (:232–244); remove commented `subtitle` :354.
- [ ] **6.3** `wizardSteps/TagsStep.tsx` (301): extract pure `tagsStepModel.ts`
  (`knownGroups`/`groupByParentKey` :70–79, `originOf` :83–93, `buildDisplayNodes`
  :166–202) + unit tests; remove the misleading `MOCK_SOURCE_WALLETS` default param
  (:53) and the `TEMP mock` export in `sourceWallets.ts:46–99` (real `fetchTagSources`
  exists and is passed by the wizard).
- [ ] **6.4** `wizardSteps/StagedTagTree.tsx` (242): `buildTree` :48–72 →
  `stagedTagTree.ts` (+ test); extract `StagedTagCategoryRow` / `StagedTagChildRow`
  (:120–175, :189–232); remove commented span :135–137 (in StagedSubscriptionRow).
- [ ] **6.5** `subscriptionModes/StagedSubscriptionRow.tsx` (369, most complex wizard
  file, ZERO tests): extract `StagedSubscriptionRowHeader.tsx` (:124–199),
  `StagedSubscriptionEditor.tsx` (:283–360), and a shared
  `wizardSteps/MissingTagResolver.tsx` — the amber reassign/create panel (:212–282) is
  near-verbatim duplicated with `MissingTransactionTags.tsx:107–167`. Hoist
  `toIsoDate`/`parseIsoDate` (re-declared in `SubscriptionCreateMode:18–22`) →
  `wizardSteps/wizardDates.ts`. ADD TESTS.
- [ ] **6.6** `SubscriptionCreateMode.tsx` (191): share the `SubscriptionRequest`
  builder with `recommendedSubscriptions.toSubscriptionRequest` and
  `subscriptionPayload.ts` (5F.2).
- [ ] **6.7** Wizard call-site adoptions skipped in Phases 4–5 (FieldLabel, useOutsideClick
  in `BasicsStep`, ExchangeRateSection new path in `SubscriptionCreateMode`).

## Phase 7 — Proposed follow-ups (OUT OF SCOPE unless Nicola opts in)

- **`api/domains/` layer** (`walletApi`, `transactionApi`, `authApi`, `patApi`,
  `adminApi`, `tagApi`, `subscriptionApi`): 30+ components currently call the raw `api`
  instance with inline endpoint strings. High value, big blast radius — separate initiative.
- **PAT module consolidation**: PAT UI straddles `components/pat/` (presentational) +
  `modals/pat/` (views) + `settings/tokens/`. Option: promote to a single `src/pat/`
  feature module. Defer — current split is documented and livable after 5I.2.
- **`App.tsx` split** (`AppProviders` + `routes.tsx`): only 97 lines — not worth it now.
- **`utils/tagOrder.ts` / `subscriptionHelper.ts` further splits**: optional; both are
  cohesive enough after 4.10.

---

## Findings census — decisions for Nicola (NOT to be fixed by subagents)

| # | Finding | Where | Why it needs your call |
|---|---|---|---|
| F1 | ~116 hand-rolled `<button>` in 66 files (18 `<input>`) vs style.md golden rule | app-wide | Progressive `Button`/`Input` adoption changes visuals slightly → needs sign-off + its own initiative |
| F2 | Legacy `theme-*` classes still used in 8 files; DataPicker threads an `isDark` prop chain with explicit dark/light branching instead of `app-*` tokens | `components/datePicker/*` worst | Token migration = visual risk; would also delete the `isDark` prop chain |
| F3 | `IconSelector.tsx` uses likely-undefined tokens `bg-app-background` / `ring-app-primary` (:55, :78, :106) | `components/icon/` | Latent styling bug — verify rendering, then fix |
| F4 | `csvDedup.ts:28–29` — comment says "null byte separator" but `SEP = " "` (space): latent dedup-key collision (`"a b"+"c"` ≡ `"a"+"b c"`) | dashboard/settings | Real correctness bug; fix changes dedup behavior |
| F5 | Invalid BCP-47 locale `"en-UK"` in `admin/UserRow.tsx:16` (falls back to browser default) | admin | Fixing to `en-GB` changes rendered dates |
| F6 | `DateRangeBanner.tsx` formats dates with the **Italian** date-fns locale in an English UI (:8, :25–26) | statistics | Probably a bug, but fixing changes visible text |
| F7 | Date formatting inconsistent across 19 files: `en-GB` / `en-US` / none / `it` | app-wide | Pick ONE canonical locale → then a `formatDate` util can absorb them all |
| F8 | Number formatting uses `it-IT` (dot thousands) everywhere in an English UI (8 sites, now centralized by 4.1) | app-wide | Intentional? If not, one-line change in `utils/format.ts` after 4.1 |
| F9 | `window.confirm` for invite-revoke in `AdminDashboard.tsx:93–98` while everything else uses `ConfirmModal`/`DeleteModal` | admin | UX change to align |
| F10 | `walletTabs.ts` `VALID_TABS` contains unreachable `"budget"` and `"data"` | dashboard/wallet | Aspirational or leftovers? Delete or build |
| F11 | `TokenListItem.tsx:30` comment claims its `onClick` variant is "dead-but-tested", but `PatListView` (a live consumer) still uses it | components/pat | Stale comment vs actually-dead path — confirm before removing |
| F12 | `OAuthConsent` uses raw `axios` (un-intercepted) for the OAuth completion call (:147–164) | auth | Looks intentional (OAuth is not under `/api`) — confirm & document |
| F13 | `TagTreePicker` and `IconSelector` hand-roll search inputs while `SearchInput` primitive exists; `ShareWalletModal:112–137` hand-rolls a role toggle while `RoleSelector` exists | components/modals | Swapping = small visual deltas → bundle with F1 |
| F14 | No shared numeric-input primitive: raw `<input type=number>` + duplicated spinner-hiding CSS ×3 (`ExchangeRateSection:51`, `SchedulingRules:74,123`) | modals | New primitive = design decision |
| F15 | `Login.tsx:122,127` ALL-CAPS demo copy vs sentence case everywhere; `ShareWalletModal:99` placeholder "mario.rossi@email.com" | auth/modals | Copy changes |
| F16 | `StatisticsTab` uses effect-based zoom init while the codebase convention is render-time reconciliation | statistics | Pattern alignment, minor behavior risk |
| F17 | No `components/ui/index.ts` barrel — every consumer deep-imports | components/ui | Adding one is easy but churns many imports; decide once |

## Test-coverage gaps (add opportunistically DURING the tasks above)

Zero-coverage areas that Phase 4/5 extractions unlock (pure modules are the cheap,
high-value targets — remember the frontend hook demands tests for changed files):

- **settings/**: 10 files, 0 tests (worst area) → `useTokens`, `useEmailChange`,
  `backupFormat`-style pure helpers first.
- **admin/**: only `StatCard` + `UserRow` covered → `backupFormat.ts`, `jobSchedule.ts`.
- **dashboard/subscription**: zero component tests → `useSubscriptionGroups`,
  `buildCalendarGrid`, `applyTransactionToSubscription`.
- **modals/common** (the shells!): `ModalDialog`, `ConfirmModal`, `DeleteModal`,
  `useHoldToConfirm`.
- **wizard subscriptionModes**: `StagedSubscriptionRow` (369 lines, 0 tests) — Phase 6.5.
- New utils from Phase 4: `format`, `months`, `walletOrder`, `session`, `color`,
  `parseCsv`, `recentMonthsZoom`, `amountFormat`, `groupTransactionsByDate`,
  `sankeyData`, `categoryDnd`, `tagsStepModel`, `inviteCopy`, `csvExport`.

## Explicitly LEFT ALONE (large but cohesive — do not split)

`utils/icons.ts` (621 — one icon map; only strip commented blocks, 1.5),
`dashboard/layout/mergeAwareCollision.ts` + geometry modules, `ui/Menu.tsx`,
`ui/ResponsiveOverlay.tsx`, `ui/CsvUploadField.tsx`, `landing/Features.tsx` +
`MockTransactionRow.tsx` (deliberate dashboard-decoupled copy — documented, do NOT
dedupe), `todo/todoData.ts` + `ToDoPage` (alive, routed at `/ToDo`),
`CategoryParentRow`/`CategoryChildRow` (near-twins but each is one cohesive row),
`DashboardBackground.tsx`, `chartData.ts`, `walletCreation.ts` (model module, cited as
the pattern to imitate), the tag-picking family architecture
(`useTagTree`/`TagRow`/`TagDropdownPanel` + thin wrappers — reference architecture).
