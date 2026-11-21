# Spacing audit + spec: UI v2

Scope: `frontend/src`, v2 path only (`data-ui="v2"`, `// ui-v2-switch` forks). Read-only audit.
Statistics and Budget are audited but marked **in progress elsewhere** (other agents fixing them); do not touch them in these batches.
Line numbers are from the tree at audit time.

## 1. Page shell

| Layer | File:line | Classes | Phone | Desktop |
|---|---|---|---|---|
| Sidebar + main | `dashboard/UserDashboard.tsx:116` | `main` `px-4 pb-28 pt-2 lg:px-10 lg:pb-12 lg:pt-6` | 16px x, 112px bottom (dock clearance), 8px top | 40px x, 48px bottom, 24px top |
| Content column | `dashboard/UserDashboard.tsx:118` | `mx-auto w-full max-w-[1180px]` | full | 1180px max |
| Wallet v2 root | `dashboard/wallet/WalletDashboard.tsx` `WalletBody` `bare` branch (ternary at `:121-127`, `bare` is set by the v2 return) | no padding, `flex flex-1 flex-col` | inherits main | inherits main |
| Wallet v1 body (not v2) | `WalletDashboard.tsx:125` | `max-w-350 px-2 sm:px-4 lg:px-8 pb-4 lg:pb-8` | 8px | 32px (v1 only, ignore) |
| v2 header (title row) | `WalletDashboard.tsx:44` | `relative z-[91] mb-3.5 hidden lg:flex gap-4`; h1 `text-[28px] leading-[1.1]` | hidden (title in WalletsBar actions) | 14px below |
| v2 tabs, desktop | `dashboard/wallet/WalletTabs.tsx:89` | `hidden md:block mb-6` (SegmentedControl) | hidden | 24px below |
| v2 tabs, phone | `WalletTabs.tsx:105-120` | `BottomNavigation` `md:hidden`, `fixed inset-x-0 bottom-0 z-10` (`components/shadcn/bottom-navigation.tsx:65`); list `min-h-14` | dock 56px + safe area | hidden |
| Filter bar (Tx + Categories) | `dashboard/transaction/TransactionsFilter.tsx:139` | `sticky top-17 z-80 mb-4 max-w-350 mx-auto px-4 lg:px-8` | **extra 16px on top of main's 16px** | **extra 32px on top of main's 40px**: filter is inset further than every other block |
| Tabs (v1 only) | `WalletTabs.tsx:202` | `mb-6 px-4 lg:px-8 pt-4 sticky top-0` | n/a v2 | n/a v2 |

Header → tabs → content in v2 desktop: title `mb-3.5` (14) → tabs `mb-6` (24) → tab content. Phone: dock only, content starts at main `pt-2` (8px).

Heights: `pb-28` (112px) on main already clears the 56px dock + safe-area. Tab-level bottom paddings stack on top (see §3).

## 2. Per-section inventory (v2)

### Transactions (`dashboard/transaction/*`)
- `TransactionsTab.tsx:43` grid `gap-3.5 min-[1280px]:grid-cols-[minmax(0,1fr)_320px]` (14px; Coming up is 320px column).
- `TransactionsHero.tsx:65` `grid gap-3.5 lg:grid-cols-[1.5fr_1fr] mb-6`; `:80` KPI grid `gap-3.5`.
- `TransactionsFilter.tsx:64` `mb-4 flex flex-wrap gap-2`; title h2 `text-[22px]` (`:67`).
- `TransactionsTable.tsx:100` panel `mb-3.5 rounded-[var(--r-card)] bg-app-card p-2`, header row `px-3 pb-2 pt-1 text-[13px]`.
- `TransactionsTable.tsx:168` scroller `pb-24` (v2, FAB clearance); `:185` empty block `mb-6`; `:205` empty `py-24`; `:233` day group `mb-6`; `:234` day header `mb-4 mt-2 gap-4` (h4 `text-xs uppercase`).
- `TransactionRowV2.tsx:57` row `px-3 py-2.5 gap-x-3 gap-y-1.5`; `:102` `pl-[52px] sm:pl-0`.
- `PendingTransactionsPanel.tsx:81` `mb-3.5 rounded-[var(--r-card)] p-3`; `:231` v2 list `mb-6`.
- `ComingUpColumn.tsx:19-35` h2 `mb-2.5 text-[19px]`; empty card `p-4`; list `px-3.5 py-1`; rows `gap-3 py-2.5`.
- Shared `ToCategorise` / loading skeletons: `TransactionsTable.tsx:54` `p-4`, `:66` `p-2`.

### Subscriptions (`dashboard/subscription/*`)
- `SubscriptionTab.tsx:79` `pb-24` (v2, FAB); `:83` header row `mb-6 gap-4 flex-wrap`; h2 `text-[22px]` (`:86`); `:95` `mb-6 w-full`; `:105` view toggle `mb-6`; `:111` grid `gap-4 pb-6` (loading).
- `SubscriptionListV2.tsx:55` `gap-8 pb-10`; section `gap-4` (`:65`); section label `px-1 text-[13px]` (`:22`, `:66`).
- `SubscriptionRowV2.tsx:61` row `px-4 py-3 gap-3`.
- `SubscriptionSummaryV2.tsx:43` `gap-3.5`; tile card `p-[18px]` (`:92`).
- `SubscriptionCalendar.tsx:73` `p-4 sm:p-6 md:p-8` (3 steps); `:80` `mb-3 sm:mb-6`; `:118` `gap-px sm:gap-1 md:gap-2`.
- `PastSubscriptionsSection.tsx:81` `gap-3`; `:160` `mt-4`.

### Categories (`dashboard/tag/*`)
- `TagsTab.tsx:63` `pb-10`; `:67`/`:76` `mb-4 mt-2`; h2 `text-2xl font-bold` (`:78`, 24px, not the 22px tab h2).
- `ChartCard.tsx:45` header `mb-4 gap-3`.
- `CategoryStrip.tsx:54` `gap-x-3 gap-y-2.5 px-4 py-3.5 rounded-[var(--r-card)] bg-app-card` (card padding 16/14, a 4th variant).
- `CategoryTreeList.tsx:51` `gap-1`; `:80` `ml-5 mt-1 gap-1 pl-2 pb-1`.
- Widget grid `dashboard/layout/WidgetGrid.tsx:74` `grid gap-8 xl:grid-cols-2` (32px, vs 14px everywhere else); `WidgetSlot.tsx:187` header `px-4 py-3`, body `p-3` (`:226`).

### Statistics (IN PROGRESS ELSEWHERE, audit only)
- `StatisticsV2.tsx:92` `gap-[14px] pb-10`; `:93` `mb-1`; `:144` grid `gap-[14px]`.
- `StatisticsSummaryV2.tsx:165` grid `gap-[14px]`.
- `StatisticsTab.tsx:110` `pb-10`; `:118` `mt-2`.

### Budget (IN PROGRESS ELSEWHERE, audit only)
- `BudgetTab.tsx:46` `gap-4`; header `gap-3`; h3 empty `text-lg`.
- `BudgetCard.tsx:73` legacy card `border border-app-border p-4 gap-3` (**v1 border in v2**); `:263` v2 card `gap-3 p-4 shadow-[var(--box-ring)]`.

### Wallet Settings (`dashboard/settings/**`)
- `SettingsTab.tsx:105` wrapper `mx-auto max-w-9xl pb-6`, `gap-3.5` (v2) / `gap-6` (v1). **`max-w-9xl` is not a Tailwind 4 class (not in `index.css` @theme), so it generates no CSS.**
- `SettingsBox.tsx:58` section `gap-4 rounded-[var(--r-card)] bg-app-card p-5 shadow-[var(--box-ring)] sm:p-6`; header `gap-1`; h3 `text-[17px]` (`:60`). Hand-rolled, does **not** use `Card`.
- `DataTab.tsx:131/148` close button `right-4 top-4 sm:right-5 sm:top-5`; grid `gap-4 sm:grid-cols-2` (`:183`).
- `BankAccountsSection.tsx:76` `flex flex-col` (v2, no gap); `BankRulesSection.tsx:106` row `py-3 first:pt-0`.
- `bank/BankEntryCard.tsx:33` `p-4 sm:p-5 gap-3.5`; `bank/BankOverlay.tsx:41` `gap-8`; `bank/BankRulesPanel.tsx:89` `gap-3`; `bank/BankAccountsList.tsx:65` `gap-3`, rows `px-3 py-2.5`.
- `ShareSettingsSection.tsx:133` `gap-5`; `:149` `gap-4`; `WalletNotificationsCard.tsx:60` `gap-4`.
- `MemberRow.tsx:53` `py-2.5`; `:128` `p-3` (member chip).
- `ConnectBankForm.tsx:62` `gap-4`.

### Global `/settings` (`src/settings/**`) — shared v1/v2 (only `AppearanceSection` has a v2 switch)
- `SettingsPage.tsx:65` `main` `mx-auto max-w-6xl px-4 pb-6 sm:px-6 lg:py-8`. **Phone x = 16px, sm+ = 24px.** Different from the wallet page (16 / 40 at lg).
- `SettingsPage.tsx:78` sticky nav `-mx-4 px-4 sm:-mx-6 sm:px-6 py-3`; `:98` sections `gap-10`; `:103` `scroll-mt-[170px]`; `:105` section header `mb-4`; `:122` `mt-1 text-sm`.
- `sections/AboutSection.tsx:51` `mt-5 space-y-3 rounded-xl border border-app-border bg-app-input p-4` (**v1 `rounded-xl` + `border`**), `:90` `mt-4`.
- `sections/NotificationsSection.tsx:146` `gap-6`; blocks `gap-3`; rows `py-3`; `:241` `mt-3 rounded-[var(--r-input)] border ... px-4 py-3`.
- `sections/SecuritySection.tsx:17` `gap-6`; `security/MfaMethods.tsx:50` `gap-3 rounded-[var(--r-input)] border bg-app-input p-4` (v1 `border`); `security/ChangePasswordCard.tsx:80` `mb-5 p-4`, `:106` `space-y-4`.
- `sections/TokensSection.tsx:83` `mb-4 px-3 py-2`; `:170` `space-y-3`; `:202` `mt-4`.
- `sections/AccountSection.tsx:45` `py-10`; `account/AccountRow.tsx:11` `gap-4 bg-app-input px-4 py-3`; `account/EmailChangeRow.tsx:52` `px-4 py-3`, `:53` `gap-3`.
- `sections/DeleteAccountSection.tsx:69` `gap-2`, `:101` `space-y-3`.
- `tokens/TokenFilterPills.tsx:16` `mb-4 gap-3`.

### Shared primitives
- `components/ui/Card.tsx:8` root `gap-4 sm:gap-5`, `:9` `PADDING.md = p-5 sm:p-6` (default), `sm = p-4`; header `gap-1` (`:12`), icon row `gap-3` (`:17`), chip `h-9 w-9` (`:21`), title `text-lg` (`font-display text-lg font-semibold` in v2, `:39`), subtitle `text-sm` (`:49`, `:59`). v1 adds `border`. v2 surface `bg-app-card shadow-[var(--box-ring)]`, radius `--r-card` (18px).
- `components/ui/StatTile.tsx:37` `gap-2`; header `gap-2.5 text-[13px]` (`:38`); sub `text-[13px]` (`:66`). Tile has no padding of its own: the caller provides it.
- `components/ui/EmptyState.tsx:19` `px-4 py-12`; icon `mb-3` (`:21`, `:25`).
- Section headers: no shared component. Ad hoc h2 `22px` (Filter, Subscription), `19px` (Coming up), `24px` (Tags), `28px` (wallet title), `17px` (SettingsBox h3), `18px` (Card title), `12-13px` labels in v2 lists.

## 3. Inconsistencies

1. **Filter bar is double-inset.** `TransactionsFilter.tsx:139` adds `px-4 lg:px-8` inside the already-padded main. Desktop: filter at 72px from the sidebar edge, every other block at 40px.
2. **Section gaps:** `gap-3.5` (14px), `gap-[14px]` (same value, different syntax in Statistics), `gap-4`, `gap-5`, `gap-6` (`/settings`, Budget header), `gap-8` (subscription list, WidgetGrid, BankOverlay). Between tab blocks: `mb-6` (24), `mb-4` (16), `mb-3.5` (14).
3. **Card padding (v2 surfaces):** 16 (`p-4`: Budget v2, ComingUp, BankEntry phone, MfaMethods, ChangePassword), 14 (`p-3`: PendingPanel, MemberRow), 18 (`p-[18px]`: SubscriptionSummary), 16/14 (`CategoryStrip px-4 py-3.5`), 8 (`p-2`: Tx table wrapper), 20/24 (`Card`, `SettingsBox`, `BankEntry sm:p-5`), 16/24/32 (Calendar).
4. **Title sizes:** 28 wallet h1, 24 Tags h2 (`text-2xl`), 22 Tx and Subscription h2, 19 Coming up h2, 18 Card title, 17 SettingsBox h3. Labels 12-13px in some lists, `text-xs uppercase` h4 on day groups.
5. **Phone edges:** Wallet pages get 16px from main, so not touching. `/settings` is `px-4` (16) on phone but `sm:px-6` (24), while the wallet uses `lg:px-10` (40). Pages do not share an edge rhythm, and `SettingsPage` sticky nav bleeds with `-mx-4`.
6. **Bottom clearance stacking:** main `pb-28` (112px) already clears the dock. Added on top: Tx table `pb-24` (`TransactionsTable.tsx:168`), Subscription `pb-24` (`SubscriptionTab.tsx:79`), Subscription list `pb-10` (`SubscriptionListV2.tsx:55`), Tags `pb-10`, Statistics `pb-10`, Settings `pb-6`. The FAB needs some clearance; the rest is redundant.
7. **v1 leftovers in v2:** `BudgetCard.tsx:73` (`border`, in progress elsewhere); `AboutSection.tsx:51` and `MfaMethods.tsx:50` (`border`, `rounded-xl`); `Card.tsx:8` `border` only in v1 (correct); `WalletTabs.tsx:202` `mb-6 sticky` is a v1-only branch (correct); `TransactionsTable.tsx:233` `mb-6` shared with v1 (fine). `SettingsTab` `gap-6` in v1 branch (fine). `NotificationsSection` and `SecuritySection` ignore v2 entirely (`gap-6`).
8. **Dead class:** `SettingsTab.tsx:105` `max-w-9xl` generates no CSS, so the wallet settings column is unbounded (only the 1180px outer cap applies).
9. **Primitive bypass:** `SettingsBox.tsx:58` reimplements `Card` (same tokens, `p-5 sm:p-6`, `gap-4`, `text-[17px]` title vs Card's `text-lg`). `BudgetCard` and `BankEntryCard` also hand-roll cards.
10. **Widget grid:** `WidgetGrid.tsx:74` uses `gap-8` while every other tab grid is 14px.

## 4. Proposed spec (v2)

Values taken from the most common existing usage: `Card` / `SettingsBox` (`p-5 sm:p-6`, `gap-4 sm:gap-5`), `gap-3.5` between grid cards, `mb-6` between tab blocks, `main` `px-4 lg:px-10`.

| Token | Value | Applies to |
|---|---|---|
| Page x | `px-4 lg:px-10` (16 / 40) | `UserDashboard.tsx:116`; `SettingsPage` should move to the same at lg |
| Page top | `pt-2 lg:pt-6` (keep) | `UserDashboard.tsx:116` |
| Bottom clearance | `pb-28` on main (phone), `lg:pb-12`; tab-level pb only where a FAB sits (`pb-24`) | remove `pb-10` in Tags/Statistics/SubscriptionListV2; keep FAB ones |
| Section gap (between tab blocks) | `mb-6` (24px) | Hero, Table day groups, Subscription header, Pending panel |
| Grid gap (sibling cards) | `gap-3.5` (14px) | Tx grid, Hero KPI grid, Summary tiles, Statistics `gap-[14px]` → `gap-3.5` |
| Card padding | phone `p-5`, sm+ `p-6` (`Card` md) | `Card` default; `SettingsBox`; `BankEntry`; `SubscriptionSummary` `p-[18px]`→`p-5 sm:p-6`? Keep 18 only if the compact tile needs it; `p-4` in `ComingUp`/Budget → `p-5 sm:p-6` |
| Card inner gap | `gap-4 sm:gap-5` (`Card`) | `SettingsBox` `gap-4` (match, drop `sm:`) |
| Card title | `font-display text-lg font-semibold` (18px) | `SettingsBox` h3 `text-[17px]` → `text-lg`; `ComingUp` h2 19 → Card title style |
| Tab title (h2) | `font-display text-[22px] font-semibold` | Filter h2, Subscription h2, Tags h2 (`text-2xl` → 22px) |
| Header → body | `gap-1` title block, `gap-4` to body | `Card` as-is |
| Radius/surface | `rounded-[var(--r-card)] bg-app-card shadow-[var(--box-ring)]`, no `border` | `AboutSection`, `MfaMethods`, `BudgetCard` |

Design tokens: **no spacing token exists.** `theme-tokens.css` has `--r-card`, `--r-input`, `--box-ring` (surface only), nothing for padding or gaps. Smallest approach: no new CSS variables. Apply the Tailwind classes above directly, and only `Card` and `SettingsBox` share code. If you want a single knob later, add `--page-x`, `--section-gap`, `--card-pad` under `:root[data-ui="v2"]` in `theme-tokens.css`; responsive pairs (`px-4 lg:px-10`) need a Tailwind arbitrary value or `@media` in CSS, so it is a larger change than the class edits.

Exceptions (intentionally different): compact KPI tiles and calendar cells keep their density; `BankEntryCard` uses `p-4` on phone to fit the row.

## 5. Batches (disjoint file sets)

Test check first: `frontend/src/__tests__/**` may assert classes (e.g. `Card.test.tsx`, `Button.test.tsx`). Run `npm test` after each batch. Build with `npm run build` at the end.

**Batch A: shell + shared primitives**
- `frontend/src/dashboard/UserDashboard.tsx`
- `frontend/src/dashboard/wallet/WalletDashboard.tsx`
- `frontend/src/dashboard/wallet/WalletTabs.tsx`
- `frontend/src/components/ui/Card.tsx`
- `frontend/src/components/ui/StatTile.tsx`
- `frontend/src/components/ui/EmptyState.tsx`
- `frontend/src/dashboard/transaction/TransactionsFilter.tsx` (double inset, see §3.1; assign here so the shell owns it)

**Batch B: Transactions**
- `frontend/src/dashboard/transaction/TransactionsTab.tsx`
- `frontend/src/dashboard/transaction/TransactionsHero.tsx`
- `frontend/src/dashboard/transaction/TransactionsTable.tsx`
- `frontend/src/dashboard/transaction/TransactionRowV2.tsx`
- `frontend/src/dashboard/transaction/PendingTransactionsPanel.tsx`
- `frontend/src/dashboard/transaction/ComingUpColumn.tsx`

**Batch C: Subscriptions + Categories**
- `frontend/src/dashboard/subscription/SubscriptionTab.tsx`
- `frontend/src/dashboard/subscription/SubscriptionListV2.tsx`
- `frontend/src/dashboard/subscription/SubscriptionRowV2.tsx`
- `frontend/src/dashboard/subscription/SubscriptionSummaryV2.tsx`
- `frontend/src/dashboard/subscription/SubscriptionCalendar.tsx`
- `frontend/src/dashboard/subscription/PastSubscriptionsSection.tsx`
- `frontend/src/dashboard/tag/TagsTab.tsx`
- `frontend/src/dashboard/tag/ChartCard.tsx`
- `frontend/src/dashboard/tag/CategoryStrip.tsx`
- `frontend/src/dashboard/tag/CategoryTreeList.tsx`
- `frontend/src/dashboard/layout/WidgetGrid.tsx`
- `frontend/src/dashboard/layout/WidgetSlot.tsx`

**Batch D: Wallet Settings + global /settings**
- `frontend/src/dashboard/settings/SettingsTab.tsx` (`max-w-9xl`, gaps)
- `frontend/src/dashboard/settings/SettingsBox.tsx` (reuse Card padding/title)
- `frontend/src/dashboard/settings/DataTab.tsx`
- `frontend/src/dashboard/settings/BankAccountsSection.tsx`
- `frontend/src/dashboard/settings/BankRulesSection.tsx`
- `frontend/src/dashboard/settings/ShareSettingsSection.tsx`
- `frontend/src/dashboard/settings/WalletNotificationsCard.tsx`
- `frontend/src/dashboard/settings/MemberRow.tsx`
- `frontend/src/dashboard/settings/ConnectBankForm.tsx`
- `frontend/src/dashboard/settings/bank/*.tsx` (BankEntryCard, BankOverlay, BankRulesPanel, BankAccountsList, BankRuleRow)
- `frontend/src/settings/SettingsPage.tsx`
- `frontend/src/settings/sections/*.tsx` (About, Notifications, Security, Tokens, Account, DeleteAccount)
- `frontend/src/settings/security/*.tsx`, `frontend/src/settings/account/*.tsx`, `frontend/src/settings/tokens/TokenFilterPills.tsx`

**Not batched (in progress elsewhere):** `dashboard/statistics/*`, `dashboard/budget/*`.

## APPROVED SPEC (Nicola, 2026-11-21) — v2 only, v1 untouched
- Page x padding: `px-4 lg:px-8` (16 / 32px). Only `main` in UserDashboard sets it; nothing inside adds its own page-level x padding (fix TransactionsFilter v2 inset). `/settings` page matches.
- Bottom: `main` `pb-28` is the only dock clearance; remove tab-level `pb-10`/`pb-24` stacking EXCEPT where a FAB covers the last row (keep exactly one FAB clearance there, `pb-24`, and drop main's duplicate only if needed — prefer keeping main's and removing tab ones if FAB is already cleared by 112px).
- Section gap (between blocks of a tab: title row, hero, toolbar, lists, cards): 24px — `gap-6` on the tab column or `mb-6`; no other ad-hoc vertical margins between sections.
- Sibling cards/tiles in a grid: `gap-3.5` (14px).
- Card padding: `p-5 sm:p-6` (20 / 24px). Card title `font-display text-lg font-semibold tracking-[-0.02em]`, subtitle `text-[13px] text-app-muted`, header→body gap `gap-4`.
- Tab title h2: `font-display text-[22px] font-semibold tracking-[-0.02em]`, same margin everywhere (part of the 24px section rhythm).
- Small tiles (StatTile) keep their own compact padding (`px-[18px] py-4`) — they're tiles, not cards.
