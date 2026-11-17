# Investments as a third flow — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A tag flag `investment` (inherited by the subtree) turns its transactions into an "Invested" flow, excluded from Income/Spent everywhere and shown apart.

**Architecture:** Raw `Tag.investment` boolean only; a pure subtree resolver on each side (Java `InvestmentTags`, TS `utils/investments.ts`, Python helper in the MCP server) feeds every aggregate. No transaction rewrites, no migration.

**Tech Stack:** Spring Boot 3.5 / Java 21 / JUnit 5 · React 19 + TS + Vitest · Python FastMCP (stdlib `unittest`).

**Spec:** `docs/superpowers/specs/2026-11-17-investments-design.md` (read it first; mocks in `docs/redesign-demos/i-investments-*.html`).

## Global Constraints

- Code, comments and UI copy in **English**.
- Definitions (verbatim from spec): Bought = EXPENSE on investment tags · Cashed out = INCOME on investment tags · Invested net = Bought − Cashed out · Income/Spent exclude investment tags · Net/Kept = Income − Spent · Savings rate = Kept / Income, "–" when Income ≤ 0 · Liquidity left = Income − Spent − Invested net · Balance = all transactions (unchanged).
- Investment tag = `tag.investment == true` or any ancestor flagged. No opt-out. The placeholder ("To categorise") tag is never an investment.
- Wire name of the flag is `investment` (boolean) in every DTO, TS type and MCP payload.
- Backend: `./gradlew spotlessApply`, `./gradlew test`, `./gradlew check` (90% line coverage). New entity fields use `@ColumnDefault("false") @Builder.Default` like `Tag.placeholder`.
- Frontend: use `ui/` primitives (`frontend/style.md`), tests under `src/__tests__/<same path>`, gates `npm run lint` → `npm test` → `npm run build`. Never edit `src/components/ui/charts/**`; new charts lazy-loaded (main chunk < 2 MiB PWA cap).
- Invest colour: Tailwind token `app-invest` (`--color-app-invest`), violet; mock value `#b39cf5` (dark). Add a light-mode value with ≥ 3:1 contrast on the light card.
- `TagService.java` contains a non-UTF-8 byte: use `grep -a` on it.
- **Subagents never commit.** The orchestrator commits once per wave on branch `feature/investments`, running `/verify` before any commit that includes backend code.

## Review Focus

1. **Cycle in the tag parent chain** (corrupt data) → resolvers terminate; a tag in a cycle is an investment only if some tag in the chain is flagged. Tests: T1 `isInvestment_cycleTerminates`, T2 `investmentTagNames handles a cycle`, T3 `test_cycle_terminates`.
2. **Child flagged under an unflagged parent** → only that child's subtree counts; siblings and parent stay normal. Tests in T1, T2, T3.
3. **A month/period where cashed out > bought** → Invested net is negative; tiles show a negative value, month-by-month stacks still render, liquidity left exceeds net. Tests: T2 `sumFlows negative invested net`, T10 row test.
4. **Whole-wallet budget where every expense is on investment tags** → spent 0, status OK (no negative spent). Test: T4 `walletBudget_allInvestment_spentZero`.
5. **Transaction without tag / amountPending** → treated exactly as today's sums treat them (no tag ⇒ not an investment). Test: T2 `sumFlows untagged tx is income/spent`.

---

## Wave 1 — foundations (T1, T2, T3 in parallel; disjoint files)

### Task 1: Backend tag flag + resolver + demo data

**Files:**
- Modify: `backend/.../model/Tag.java` (field), `dto/TagRequest.java`, `dto/TagResponse.java`, `mappers/TagMapper.java`, `service/TagService.java` (create ~L250, bulk upsert ~L187-205, update ~L298-340), `service/DemoService.java`
- Create: `backend/.../service/InvestmentTags.java`
- Test: `backend/src/test/.../service/InvestmentTagsTest.java`, extend `TagServiceTest`, `TagMapperTest` (if present), `DemoServiceTest`

**Interfaces — Produces:**
- `Tag.investment: boolean` (default false), `TagRequest.investment: Boolean` (null = unchanged on update / false on create), `TagResponse.investment: boolean`.
- `public final class InvestmentTags { static boolean isInvestment(Tag tag); static Set<UUID> investmentTagIds(Collection<Tag> walletTags); }` — `isInvestment` walks `getParent()` with a visited set; null tag ⇒ false; placeholder ⇒ false.

- [ ] **Step 1: Write failing tests** in `InvestmentTagsTest`: `isInvestment_null_false`, `isInvestment_flaggedSelf_true`, `isInvestment_inheritsFromGrandparent_true`, `isInvestment_childFlaggedParentNot_siblingFalse`, `isInvestment_placeholder_false`, `isInvestment_cycleTerminates`, `investmentTagIds_returnsSubtreesOnly` (tree: Investments✓{PAC, ETF}, Savings{Emergency, Pension✓} → {Investments, PAC, ETF, Pension}).
- [ ] **Step 2: Run** `cd backend && ./gradlew test --tests "*.InvestmentTagsTest"` → FAIL (class missing).
- [ ] **Step 3: Implement** field, DTOs, mapper, `InvestmentTags`.
- [ ] **Step 4: TagService tests then code:** `createTag_withInvestment_persists`, `updateTag_investmentNull_unchanged`, `updateTag_investmentFalse_clears`, `bulkUpsert_investmentCarried`. In update: `if (request.getInvestment() != null) tag.setInvestment(request.getInvestment())`; bulk upsert sets it only when non-null on existing tags.
- [ ] **Step 5: Demo data:** in `DemoService.createTags` add root `Investments` (icon `invest`, colour `#b39cf5`, `investment(true)`) with child `PAC`; in `generateTransactions` add a monthly EXPENSE "PAC instalment" 200 € on the 5th on `PAC`. Test: demo wallet has a flagged `Investments` tag and ≥ 1 PAC transaction.
- [ ] **Step 6: Run** `./gradlew spotlessApply test` → all green.

### Task 2: Frontend type, resolver, flow sums, colour token

**Files:**
- Modify: `frontend/src/types/domain.ts` (`Tag.investment?: boolean`), `frontend/src/index.css` (`--color-app-invest`), `frontend/src/theme-tokens.css` (`--v2-invest` light + dark, like `--v2-income` L162/L207)
- Create: `frontend/src/utils/investments.ts`, `frontend/src/dashboard/wallet/useInvestmentTags.ts`
- Test: `frontend/src/__tests__/utils/investments.test.ts`

**Interfaces — Produces:**
```ts
export function investmentTagNames(tags: Tag[]): Set<string>;          // exact tag names, subtree via parentName, cycle-safe
export function isInvestmentTx(tx: Transaction, invest: Set<string>): boolean; // tx.tag?.name in set
export interface Flows { income: number; spent: number; bought: number; cashedOut: number;
  investedNet: number; net: number; liquidityLeft: number; }
export function sumFlows(txs: Transaction[], invest: Set<string>): Flows;
export function useInvestmentTags(): Set<string>; // useMemo(investmentTagNames(tags)) from useWalletContext
```
The tag update op already forwards the whole payload (`api/walletOps.ts` `updateTag`), so `{ investment }` in the payload is queued offline with no change there; the overlay must keep `investment` when merging a pending tag update (check `sync/overlay.ts` and add a test if it whitelists fields).

- [ ] **Step 1: Failing tests:** same tree cases as T1 (`flags subtree`, `child flagged parent not`, `handles a cycle`, `placeholder never`), plus `sumFlows` with Income 2400 / Spent 1380 / bought 500 / cashed out 200 → `{income:2400, spent:1380, bought:500, cashedOut:200, investedNet:300, net:1020, liquidityLeft:720}`; `sumFlows negative invested net` (bought 0, cashed 500 → investedNet −500, liquidityLeft = net + 500); `sumFlows untagged tx is income/spent`.
- [ ] **Step 2: Run** `cd frontend && npx vitest run src/__tests__/utils/investments.test.ts` → FAIL.
- [ ] **Step 3: Implement** the module, hook and tokens.
- [ ] **Step 4: Run** `npm run lint && npm test && npm run build` → green.

### Task 3: MCP server

**Files:** Modify `mcp-server/mcp_server.py` (`create_tag` L643, `update_tag` L677, `get_tags` L613, `get_wallet_statistics` L409, `get_financial_timeseries` L1053); Create `mcp-server/test/test_investments.py` (stdlib `unittest`, style of `test_backend_request_paused.py`).

**Interfaces — Produces:** `def investment_tag_names(tags: list[dict]) -> set[str]` (uses `name`, `parentName`, `investment`; cycle-safe).

- [ ] **Step 1: Failing tests:** `test_subtree_flagged`, `test_child_flagged_parent_not`, `test_cycle_terminates`, and a statistics test with mocked `_backend_request` returning the T2 sample → `summary` has `totalIncome 2400, totalExpense 1380, invested 500, cashedOut 200, investedNet 300, liquidityLeft 720, difference 1020`.
- [ ] **Step 2: Run** `cd mcp-server && python3 -m unittest test.test_investments` → FAIL.
- [ ] **Step 3: Implement:** `create_tag`/`update_tag` accept `investment: bool | None` (description: "Mark the tag (and all its subtags) as an investment: its expenses count as invested, its incomes as cashed out."); `get_tags` returns it; statistics fetches `/tags/{walletId}`, excludes investment txs from income/expense categories and adds the four fields; timeseries buckets gain `invested`, `cashedOut` and `net` stays income − expense.
- [ ] **Step 4: Run** tests → PASS.

**Wave 1 gate (orchestrator):** review the three diffs, run backend `test`, frontend gates, MCP tests; `/verify`; commit "feat(investments): tag flag, resolvers, MCP split".

---

## Wave 2 — consumers (T4–T11 in parallel; disjoint files)

All consume: Java `InvestmentTags`, TS `useInvestmentTags()`, `isInvestmentTx`, `sumFlows`, `Flows`, token `app-invest`.

### Task 4: Budgets (backend)

**Files:** Modify `service/BudgetService.java`, `dto/BudgetStatusResponse.java`; Test: `BudgetServiceTest`, `BudgetAlertCronJobTest`.

**Produces:** `BudgetStatusResponse.goal: boolean`; status values `"OK" | "WARNING" | "EXCEEDED" | "GOAL_REACHED"`.

- Whole-wallet budget: spent = existing wallet EXPENSE sum − `sumAmountByWalletAndDateRangeAndTags(EXPENSE, investmentTagIds)` (skip the subtraction when the set is empty; no new query).
- Budget whose tag `InvestmentTags.isInvestment` ⇒ goal: `spent` = EXPENSE − INCOME over the subtree in the current period (invested net, may be < 0), rollover ignored, `remaining = limit − spent` ("to go"), `percentUsed` floored (min 0), `status = percentUsed >= 100 ? "GOAL_REACHED" : "OK"`, `crossedThresholds = []` (so `BudgetAlertCronJob` sends nothing).
- [ ] Tests first: `walletBudget_excludesInvestmentExpenses`, `walletBudget_allInvestment_spentZero`, `goalBudget_progressIsInvestedNet`, `goalBudget_reached`, `goalBudget_ignoresRollover`, `goalBudget_noAlerts` (cron job sends no email/push). Run `./gradlew test --tests "*Budget*"` → FAIL, implement, → PASS.

### Task 5: Reports (backend)

**Files:** Modify `report/PeriodTotals.java`, `report/ReportAggregator.java`, `report/ReportInsightsAggregator.java`, `report/ReportHtmlBuilder.java` (+ `ReportInsightsHtml.java` if it prints totals); Test: their existing tests.

**Produces:** `record PeriodTotals(BigDecimal income, BigDecimal expense, BigDecimal net, BigDecimal invested, BigDecimal cashedOut)` with `investedNet()` and `liquidityLeft()` methods.

- Every EXPENSE/INCOME sum, top category and insight in both aggregators skips `InvestmentTags.isInvestment(t.getTag())`; invested/cashedOut summed from the rest.
- HTML: after the totals add rows **"Invested"** (`<investedNet> (<invested> in · <cashedOut> out)`) and **"Liquidity left"**, only when invested or cashedOut ≠ 0.
- [ ] Tests first: `monthly_excludesInvestmentsFromExpense`, `monthly_totalsInvestedAndLiquidity` (T2 sample values), `html_showsInvestedRows_onlyWhenNonZero`, insights test that an investment tag never appears as a top spending category. Run → FAIL, implement, → PASS.

### Task 6: Tag flag UI (frontend)

**Files:** Modify `components/icon/IconPickerButton.tsx`, `dashboard/tag/CategoryParentRow.tsx`, `dashboard/tag/CategoryChildRow.tsx`, `dashboard/tag/useInlineTagEdit.ts`; Test: mirrored tests.

**Produces:** optional `IconPickerButton` props `investment?: { checked: boolean; inheritedFrom?: string; onChange: (v: boolean) => void }` — when present, the popover ends with a separator + switch row "Counts as investment" (sub-line: "Covers its subtags too"; when `inheritedFrom`: switch on + disabled, sub-line "Inherited from <name>"). Use an existing switch/toggle primitive from `components/ui/` if one exists, else a native checkbox styled as switch with `role="switch"`.
- Rows show a violet `↗` (`text-app-invest`, `aria-label="Investment"`) after the name when the tag resolves as investment. Toggling calls the existing tag update path with `{ investment }` (offline-queued). Hidden when `readOnly`.
- [ ] Tests first: switch toggles call update with `{investment:true}`; inherited child shows disabled switch + "Inherited from Investments"; ↗ rendered for flagged and inherited rows only; no switch when readOnly.

### Task 7: Transactions tab (frontend)

**Files:** Modify `dashboard/transaction/TransactionsHero.tsx`, `TransactionsTable.tsx` (day group ~L85-100), `TransactionRow.tsx`, `TransactionRowV2.tsx`; Test: mirrored tests.

- Hero: Net = `flows.net`. Tile grid becomes 2×2 on phone and the right column on desktop: Income, Spent (sub "% of income" uses `flows.spent`), **Invested** (`flows.investedNet`, sub `"<bought> in · <cashedOut> out"`, icon `CategoryIcon icon="invest"` coloured `var(--color-app-invest)`), **Liquidity left** (`flows.liquidityLeft`, sub "Net − Invested", wallet-ish icon e.g. `wallet`). The trend series stays `dailyNetSeries` over non-investment txs.
- Rows: investment txs show the amount in `text-app-invest` without +/− colour, plus a badge "Invested" (EXPENSE) / "Cashed out" (INCOME).
- Day total: income/expense via `sumFlows`; append `· <bought> invested` / `· <cashedOut> cashed out` in `text-app-invest` when non-zero.
- [ ] Tests first: hero renders four tiles with T2 sample values; investment row has badge and invest colour; day header excludes investments and appends the invested text.

### Task 8: Categories tab (frontend, v2)

**Files:** Modify `dashboard/tag/TransactionPieChart.tsx`, `dashboard/tag/categoryChartData.ts`, `dashboard/tag/TagsTab.tsx` (only if props must pass through); Test: mirrored.

- Pies, ranking, trend and heatmap exclude investment txs by default.
- Each pie card header gets a chip "↗ Investments" (`aria-pressed`), off by default, persisted per device in `localStorage` key `categories.showInvestments.<EXPENSE|INCOME>`. On: Expense pie includes investment EXPENSE txs, Income pie includes investment INCOME txs, as normal tree slices. Centre caption unchanged ("spent"/"earned"), no second line.
- [ ] Tests first: default excludes investment slices; chip on includes them and updates the centre total; state persisted.

### Task 9: Statistics v2 — summary, KPI, insights, v1 overview

**Files:** Modify `dashboard/statistics/summaryStats.ts`, `StatisticsSummaryV2.tsx`, `statisticsInsights.ts`, `useOverviewData.ts`, `chartData.ts`; Test: mirrored.

**Produces:** `summarizePeriod(txs, period, today, invest: Set<string>)` → `PeriodSummary` gains `invested: number; bought: number; cashedOut: number` (earned/spent exclude investments; `savingsRate` null when earned ≤ 0). `summarize(txs, invest)` likewise excludes.
- KPI: five tiles Earned, Spent, **Invested** (sub `"<bought> in · <cashedOut> out"`), Kept, Savings rate ("–" when null); phone 2+2+1 (last spans 2).
- [ ] Tests first: summarizePeriod with T2 sample; savingsRate null at earned 0; five tiles rendered; insights never cite an investment tag as spending.

### Task 10: Statistics v2 — Month by month

**Files:** Modify `dashboard/statistics/statsChartRows.ts`, `MonthByMonthChart.tsx`, `StatisticsV2.tsx` (pass `invest` to `monthByMonthRows`); Test: mirrored.

**Produces:** `monthByMonthRows(txs, period, today, invest)`; `MonthByMonthRow` gains `bought?: number; cashedOut?: number; liquidity?: number` (`income`/`expense`/`kept` exclude investments; `liquidity = income + cashedOut − expense − bought`, per month).
- Chip "↗ Investments" in the card header, off by default, persisted (`statistics.monthByMonth.showInvestments`). On: violet `cashedOut` stacked above Earned, `bought` stacked below Spent; Kept line unchanged; extra dashed line "Liquidity left" in the Kept colour; legend gains both entries. Use the existing chart lib's stacking; do not edit the vendored kit.
- [ ] Tests first: rows carry bought/cashedOut/liquidity for a month with cashed out > bought; chip toggles legend entries.

### Task 11: Statistics v2 — Investments widget + Sankey

**Files:** Create `dashboard/statistics/investmentsData.ts`, `dashboard/statistics/InvestmentsWidget.tsx` (lazy, like `LazyCashFlowSankey.tsx`); Modify `statisticsWidgets.tsx` (register after month-by-month: title "Investments", subtitle "What you put in, what came back, and where."), `sankeyData.ts`; Test: mirrored.

**Produces:** `investmentsSeries(txs, period, today, invest): { months: {date: Date; bought: number; cashedOut: number; cumulative: number}[]; byTag: {name: string; net: number}[]; bought: number; cashedOut: number; net: number }`.
- Widget: monthly bars (bought up, cashed out down, lighter), dashed cumulative line, facts row (bought / cashed out / invested net), per-tag bars sorted desc. Hidden (renders nothing) when there are no investment txs in the period.
- Sankey: income → expense categories, one **Invested** node (links to each investment tag), and **Liquidity left** node; investment INCOME appears as a "Cashed out" source.
- [ ] Tests first: investmentsSeries on a 3-month sample (cumulative, byTag order); sankey has Invested and Liquidity left nodes; widget empty state.

### Task 12: Budget + subscriptions UI (frontend)

**Files:** Modify `types/domain.ts` (`Budget.goal?: boolean`, status union + `"GOAL_REACHED"`), `dashboard/budget/BudgetCard.tsx`, `dashboard/budget/budgetLogic.ts`, `dashboard/budget/budgetUpcoming.ts`, `dashboard/subscription/subscriptionSummary.ts` + the component rendering "Recurring / month"; Test: mirrored.

> ⚠ `BudgetCard.tsx`, `BudgetTab.tsx` and `BudgetTabV2.test.tsx` had **uncommitted user changes** when this plan was written. The orchestrator settles them with Nicola before Wave 2.

- Goal card: hero `"<remaining> € to go"` (or `"Goal reached"` pill in income green when `GOAL_REACHED`), fill in `app-invest`, no threshold ticks.
- `upcomingSubscriptionSpend` skips subscriptions whose tag is an investment (needs `invest` from tags already passed in).
- `SubscriptionSummary` gains `monthlyInvested: number`; `monthlyCost` excludes investment subscriptions; UI shows a second line "Invested / month".
- [ ] Tests first: goal card copy both states; upcoming skips PAC subscription; summary splits 420 cost / 300 invested.

**Wave 2 gate (orchestrator):** per-task review; full backend `check`, frontend gates, MCP tests; `/verify`; commit "feat(investments): budgets, reports and UI".

---

## Wave 3 — close-out (orchestrator)

- [ ] Whole-branch review (`superpowers:requesting-code-review`), fix findings.
- [ ] Manual check in the app (`run` skill) on the demo wallet: flag/unflag, offline flag + reconnect, each surface vs mocks.
- [ ] Update `CLAUDE.md` (Overview / domain: investment tag flag) in one paragraph; `graphify update .`
- [ ] Move this file to `.claude/TODO/DONE/`.

## Backlog (not in this delivery)

- Investment flag in the wallet creation wizard (`modals/wallet/wizardSteps/StagedTagTree.tsx`, `tagModes/TagCreateMode.tsx`).
- Violet ↗ after flagged tag names in the tag pickers (`modals/transaction/TagPicker.tsx`).
