# Investments as a third flow (via a tag flag): kickoff prompt

> Paste this into a new chat. Talk in Italian with Nicola; write code, comments and UI copy in English.

## The problem

Financial investments are recorded today as **expenses**. For example: a monthly PAC instalment, a pension fund payment, buying ETFs. That made sense at first. Now the wallet's balance and net figures show red for money that hasn't been spent, only moved into investments. Nicola wants investments to become their **own flow**, next to Income and Expense, with their own charts and statistics.

## The decision already taken

Investments are **not** a third transaction type:

- `AmountInput` (`frontend/src/components/ui/AmountInput.tsx`) keeps the two-state EXPENSE/INCOME toggle. Don't add a third button.
- "Investment" is a **flag on the tag**. Nicola flags a root tag (e.g. "Investimenti") or only some subtags. Every transaction whose tag is flagged, or sits under a flagged tag, counts as an investment.
- Inheritance: a flag on a parent covers the whole subtree. The flag can also go on a single child whose parent isn't flagged. Open point to settle with Nicola: can a child of a flagged parent opt out?

## What to do in the new chat

1. **Brainstorm first** (`superpowers:brainstorming`). Settle the open questions below with Nicola one at a time before touching code.
2. **Mocks before code.** Use the design skills `frontend:frontend-design`, `ui-ux-pro-max` and `dataviz`, and read `frontend/style.md` §8 (UI v2).
   - Produce static HTML mocks in `docs/redesign-demos/` (e.g. `i-investments.html`). Copy the token, font and phone/desk frame setup from `docs/redesign-demos/f-bank.html` and `h-budget-card.html`.
   - Give 2–3 proposals per surface, one marked recommended, phone (375px) and desktop.
3. **Plan** (`superpowers:writing-plans`) in `.claude/TODO/investments.md`, split into waves. Implementation goes to **Haiku subagents** with disjoint file sets; the orchestrator writes specs, reviews and verifies. This is Nicola's standing rule, to save usage.

## Surfaces to mock

- **Tag flag UI:**
  - where to toggle it: the category manager drawer (`CategoryManagerDrawer`), the tag form, the wallet creation wizard?
  - how a flagged tag looks in pickers and rows (badge/icon);
  - what the inherited state looks like on subtags.
- **Transactions:**
  - the row and the day total: how an investment row reads (neither red nor green? its own colour?);
  - the hero / net card on the Transactions tab: Income − Expense, with Invested shown apart.
- **Categories tab:** pie and Sankey. Is investment a third root flow or a branch of income? Is there an Income/Expense/Investments toggle?
- **Statistics v2:**
  - KPI tiles (add "Invested"? does the savings rate count investments as kept?);
  - Month by month (a third series?), the waterfall, the balance projection;
  - a dedicated **Investments** section or widget: invested per month, cumulative invested, split by tag.
- **Budget:** are investment tags excluded from whole-wallet budgets? Can there be an investment target or budget?
- **Subscriptions:** a recurring PAC instalment is a subscription. Should the summary ("recurring cost / month") separate it?
- **Reports** (monthly/yearly emails, PDF, `backend/.../report/`) and the **MCP server** tools: they must report the new split.

## Questions to settle with Nicola (one at a time)

- **Balance:** does investing lower the wallet balance? (The money leaves the account, so yes for the balance.) And "net" or "kept": is investing saving? Probably Income − Expense, with Invested shown separately.
- **Selling or redeeming an investment** (money coming back): an INCOME transaction on a flagged tag? Show it as "Divested" and net it against the invested total?
- **Bank imports:** bank rules can set a flagged tag, and then the import counts as an investment automatically. Confirm.
- **Existing data:** nothing to migrate. Flagging the existing tag reclassifies its history. Confirm that's what Nicola wants.
- **Shared wallets and permissions:** who can flag (same as editing tags: OWNER/EDITOR)?
- **Offline queue:** tag update is already a queued op (`sync/opsQueue.ts`). The new field must go through it too.

## Technical anchors (verify, don't trust blindly)

- **Backend `Tag`** (`backend/.../model/Tag.java`) has `parent`, `placeholder` (`@ColumnDefault("false")`).
  - Add `boolean investment` the same way; schema evolves via `ddl-auto=update`, with no Flyway.
  - Update the DTOs and the manual mappers (`mappers/`), and the `TagService` create/update paths.
- **Backend aggregates that sum EXPENSE** need an "is investment" predicate with subtree resolution. `BudgetService` already resolves subtrees with `subtreeTagIds`, so reuse that pattern.
  - Affected: `WalletDashboardService`, `report/ReportAggregator` + `ReportInsightsAggregator`, `BudgetService`, the statistics endpoints, and any other sum of EXPENSE.
- **Frontend:**
  - `types/domain.ts` (`Tag`).
  - Tag tree helpers: `components/tags/useTagTree.ts`, `parentName` links. A pure `isInvestmentTag(tagName, tags)` with unit tests.
  - `utils/period.ts` `sumByType`, `dashboard/statistics/*` (`summaryStats.ts`, `statisticsInsights.ts`, `balanceProjection.ts`, sankey data), `dashboard/category/*` charts, `dashboard/budget/budgetUpcoming.ts`, the subscription summary, `TransactionsHero`.
- **MCP server** (`mcp-server/mcp_server.py`): tag tools must expose the flag, and analytics tools return the split.
- **Gates:**
  - backend `./gradlew test` + `check` (Spotless, 90% coverage);
  - frontend lint → vitest → build;
  - main chunk under the 2 MiB PWA precache cap; lazy-load new charts. The vendored chart kit `src/components/ui/charts/**` is never edited.

## Out of scope unless Nicola asks

- Investment portfolio valuation (prices, returns, P&L) and linking to brokers. This is only about *cash flows into investments*.
