# Wallet Creation Wizard — Design Spec

**Date:** 2026-07-05
**Status:** Approved for planning
**Author:** Nicola (design via brainstorming + grilling)

## 1. Goal

Replace the current single-step "New Wallet" modal
(`frontend/src/modals/wallet/CreateWalletModal.tsx`) with a **multi-step wizard**
that guides the user through full wallet setup: basics, tags, subscriptions,
initial transactions, and member invitations.

The wizard's step/navigation/progress logic is delivered as a **generic, reusable
primitive** in `frontend/src/components/ui/` — not specific to the wallet flow. Step
*content* is injected by the consumer.

## 2. Scope & non-goals

**In scope**
- Generic `Wizard` primitive (`components/ui/Wizard.tsx`).
- Full-screen overlay shell that wraps the wizard for the wallet flow.
- `CreateWalletWizard` (5 configurable steps + external completion screen).
- Shared CSV upload + validation module, reused by the wizard **and** retrofitted
  into `dashboard/settings/DataTab.tsx`.
- One backend change: subscription bulk dedup key.
- Frontend tests (Vitest) + backend tests for the dedup change.

**Non-goals**
- No changes to any REST endpoint other than the subscription dedup semantics.
- No fix to the unrelated dead `/wallets/{id}/share` endpoint used by
  `ShareWalletModal` (noted below as a side finding, out of scope).
- No new bulk-invite endpoint (invites loop the existing single endpoint).

## 3. Codebase facts this design is built on

- **Wallet create:** `POST /api/wallets`, body `{ name, icon, color, currency }`
  (name length **3–25** enforced by `WalletService`). Returns `WalletResponse`
  (`id`, …). Today called inline from `CreateWalletModal`; success →
  `onSuccess(id)` → `WalletsBar.handleCreate` → `UserDashboard.fetchData` (full
  refetch of `GET /api/wallets`) + navigate.
- **Bulk endpoints are all-or-nothing (`@Transactional`).** One bad row → HTTP 409
  `"Row N: <reason>"`, whole batch rolled back. Success body =
  `{ created: [], updated: [], autoCreatedTags: [] }` (tags: no `autoCreatedTags`).
  There is **no per-row partial success** within a single call.
  - Tags: `POST /api/tags/{walletId}/bulk`, `List<TagRequest>{name,icon,colorHex,parentName}`.
    Dedup key = name (case-insensitive). Name length 2–25.
  - Transactions: `POST /api/transactions/{walletId}/bulk`,
    `List<TransactionRequest>`. Dedup key = name+tag+date. Missing tag auto-created.
  - Subscriptions: `POST /api/subscription/{walletId}/bulk` (singular path),
    `List<SubscriptionRequest>`. **Dedup key currently `tag+startDate` (name
    excluded)** — changed by this spec (§8).
- **Invites:** only `POST /api/invitations/{walletID}`, body
  `MemberRequest{ user, role }` (`user` = username **or** email). **No bulk
  endpoint.** Roles `VIEWER`/`EDITOR` (OWNER reserved for the creator).
  - Side finding (out of scope): `ShareWalletModal` posts to
    `/wallets/{id}/share`, which **has no backend mapping** (404). The real
    endpoint is `/api/invitations/{walletID}`.
- **Reusable primitives:** `Button`, `Input`, `CustomSelect`, `Selector`,
  `Checkbox`, `Toggle`, `Card`, `ResponsiveOverlay`, `IconColorSelector`,
  `CurrencySelector`, `TagBadge`, `ImportReviewModal`, `TagSelectorAddForm`.
  **No wizard/stepper exists** — built fresh.
- **CSV today:** `dashboard/settings/csvImport.ts` (parse + map, **no validation**),
  `csvDedup.ts` (overwrite detection), `DataTab.tsx` (orchestration: hidden file
  input → `buildJob` → `submitJob` → `ImportReviewModal`; POSTs the whole file,
  relies on the backend 409 to catch bad data). No CSV library (hand-rolled
  `parseCsv`). No column-mapping UI (fixed header order).

## 4. Generic `Wizard` primitive

`frontend/src/components/ui/Wizard.tsx` (+ small sub-parts as needed). **Shell-agnostic**:
renders only the stepper + current step content + Back/Continue footer, as a
self-contained block. The consumer supplies the container (full-screen modal here).

```ts
interface WizardStep {
  name: string;                  // shown under the stepper node
  mandatory: boolean;
  content: React.ReactNode;
  nextLabel: string;             // when isComplete === true  (e.g. "Continue")
  nextLabelIncomplete?: string;  // when isComplete === false; REQUIRED if !mandatory
                                 // (e.g. "Continue without tags") — never the word "skip"
  isComplete: boolean;           // parent-computed; gates mandatory Continue + picks label
}

interface WizardProps<TResult = unknown> {
  steps: WizardStep[];                              // configurable steps only (5 for wallet)
  onComplete: () => Promise<TResult>;               // fired after last step's Continue
  renderCompletion: (s: {
    status: "processing" | "done" | "error";
    result?: TResult;
    error?: unknown;
    goToStep: (index: number) => void;              // let the completion screen send the
                                                    // user back into the steps (e.g. step 1
                                                    // on a blocking wallet-create failure)
  }) => React.ReactNode;                            // the unique terminal screen
  onCancel?: () => void;
}
```

**Behavior**
- **Gating:** `mandatory && !isComplete` ⇒ Continue disabled, always shows `nextLabel`.
  `!mandatory` ⇒ Continue always enabled; shows `nextLabel` when `isComplete`, else
  `nextLabelIncomplete`.
- **Navigation:** Back hidden on step 1; visible on steps 2..N; **absent during
  processing and completion**. Stepper: visited/current dots clickable (jump *back*
  only); future dots disabled (no forward-jump past furthest reached). All step data
  is owned by the consumer, so back/forward **preserves state**.
- **Completion:** clicking Continue on the last step → internal `processing` phase →
  `onComplete()` → `renderCompletion({status,result,error})` rendered as the final
  stepper node. No Back/Continue there; the consumer's completion screen owns its CTAs.
- **Cancel:** `onCancel` invoked by the shell (X/backdrop); the shell owns the
  discard-confirm.

**Progress bar (style)** — horizontal stepper: current = numbered accent circle +
solid label; future = neutral (`app-*`) circle + muted label; completed = check.
Sober connectors, squared radii, **no glow/halo** (`style.md`). Accent = brand
gradient, switching to the picked wallet color once step 1 sets it.

## 5. Full-screen shell

New full-viewport overlay for the wallet flow (portal). Stepper across the top,
roomy scrollable content, sticky Back/Continue footer. Reuses `Button`. Naturally
full-screen on mobile. Exposes an imperative `openModal()` handle and closes itself;
owns the discard-confirm on close when a draft exists.

## 6. Wallet creation flow — `CreateWalletWizard`

Container component holding all draft state:

```ts
interface WalletDraft {
  basics: { name: string; icon: string; color: string; currency: string };
  tags: TagRequest[];
  subscriptions: SubscriptionRequest[];
  transactions: TransactionRequest[];
  invites: { user: string; role: "VIEWER" | "EDITOR" }[];
}
```

### Step 1 — Basics (`mandatory: true`)
Reuses `Input` (name), `IconColorSelector` (icon+color), `CurrencySelector` — same
building blocks as `CreateWalletModal`. `isComplete` = name length 3–25 (icon/color/
currency have defaults). **No API call**; stages `basics`.

### Step 2 — Tags (`mandatory: false`)
Four **entry methods** that all append into **one shared draft list** (chips with
remove); the user may **mix** methods. `isComplete` = ≥1 staged tag.
- **Custom** → reuse `TagSelectorAddForm` (name + icon/color + parent).
- **CSV** → shared `parseAndValidateCsv("tags", …)`.
- **Recommended** → static English constant (Food, Transport, Salary, Rent,
  Groceries, Entertainment, Health, Utilities…), checkbox multi-select.
- **Import from other wallets** → `GET /wallets` + each wallet's tags, grouped,
  multi-select. (Reads to populate pickers are allowed; only writes are deferred.)

> **Deferred to build time (TODO):** exact per-mode UI, and whether
> *import-from-other-wallets* ships in v1. Accumulate-into-one-list is the agreed
> model; details decided when building this step.

### Step 3 — Subscriptions (`mandatory: false`)
Curated suggestions (Netflix, Spotify, Gym, Rent…), each with **a distinct default
tag**, editable amount/frequency/type before staging; plus CSV upload via the shared
helper. `isComplete` = ≥1 staged subscription.

### Step 4 — Transactions (`mandatory: false`)
CSV upload only (shared helper). `isComplete` = ≥1 staged transaction.

### Step 5 — Invites (`mandatory: false`)
Add multiple `{ user (email/username), role }` entries to a list (VIEWER/EDITOR).
`isComplete` = ≥1 staged invite.

### Completion (external terminal screen)
`onComplete` orchestration:
1. `POST /wallets` (from `basics`). If this fails, `onComplete` throws a typed
   "wallet-not-created" error; the completion screen renders its **error** state
   (no wallet exists, no imports ran) with a single **"Return to setup"** CTA that
   calls `goToStep(0)` to drop the user back on step 1 with the message. The
   per-resource success recap is only shown when the wallet was actually created.
2. With the new `walletId`, fire **in parallel** (each only if its step staged data):
   - tags → `POST /tags/{id}/bulk`
   - subscriptions → `POST /subscription/{id}/bulk`
   - transactions → `POST /transactions/{id}/bulk`
   - invites → **loop** `POST /api/invitations/{id}` (per-item results)
3. Aggregate **per-resource** results.

**Recap granularity:** per-resource, not per-row (bulk is all-or-nothing). Invites,
being looped, show true `k/n`. Because §7 validates client-side first, server-side
failures at this stage should be rare.

**Recap screen:** per-resource status, e.g.
`Tags ✓ 8 created · Subscriptions ✓ 3 · Transactions ✓ 20 created · Invites 2/3 sent`.
On partial/whole failure of a resource, show the failed resource(s) with the
`Row N`/item reason and two CTAs:
- **Manage failed** — editable table to fix and retry the failed resource *(detailed
  design deferred to that phase — TODO)*.
- **Go to wallet** — `onSuccess(walletId)` → refetch + navigate. **Wallet is kept**
  on partial failure.

## 7. Shared CSV upload + validation module

New `dashboard/settings/csvValidation.ts`:
```ts
interface RowError { row: number; message: string }
validateTags(dtos: TagRequest[]): RowError[]
validateTransactions(dtos: TransactionRequest[]): RowError[]
validateSubscriptions(dtos: SubscriptionRequest[]): RowError[]
```
Rules mirror the backend so failures surface *before* any POST:
- **Tags:** name non-blank, length 2–25; `colorHex` present; `parentName` (if set)
  resolvable within batch.
- **Transactions:** name non-blank; `amount` numeric ≥ 0; `type` ∈ {INCOME,EXPENSE};
  `transactionDate` valid ISO.
- **Subscriptions:** amount ≥ 0; `type` ∈ {INCOME,EXPENSE}; `status` ∈
  {ACTIVE,PAUSED,COMPLETED}; `frequencyType` ∈ {DAILY,WEEKLY,MONTHLY,YEARLY};
  `duration` ∈ {FOREVER,TIMES,UNTIL}; `startDate` valid ISO; conditional fields
  (`durationTimes` when TIMES, `durationUntil` when UNTIL).

Extract the parse→validate front-half into one reusable helper
`parseAndValidateCsv(resource, text) → { dtos, rowErrors }` (+ optionally a small
`CsvUploadField` presentational component for the file button + inline error list).

**Consumers:**
- **`DataTab`** — adds a validation gate: on `rowErrors` it **shows them and does not
  POST** (new behavior); overwrite-confirm + immediate POST otherwise, unchanged.
- **Wizard steps** — same helper, but stash `dtos` in draft state instead of POSTing;
  `isComplete` = parsed with zero `rowErrors`.

> **TODO note:** this shared module is the "common reusable elements" the user asked
> for — build it once, wire both consumers.

## 8. Backend change — subscription dedup key

Change the subscription bulk dedup key from `tag + startDate` to
**`name + tag + startDate`** (aligns with the transaction key), removing the
silent-collapse footgun (differently-named subscriptions sharing a tag/date no
longer merge).

- Edit `SubscriptionService.createSubscriptionsBulk` key logic.
- Update `BulkImportIntegrationTest` + `SubscriptionService` unit tests to cover the
  new key; add a case proving two same-tag/date but differently-named subs both
  persist.
- `./gradlew spotlessApply`; keep ≥90% line coverage; `./gradlew test` green.
- Mirror the key in frontend `csvDedup.ts` `detectSubscriptionOverwrites` so DataTab
  overwrite detection stays consistent.

## 9. Integration & entry point

Swap `CreateWalletModal` → `CreateWalletWizard` at the `WalletsBar` trigger, keeping
the same imperative `openModal()` handle and `onSuccess(walletId: string)` prop, so
`WalletsBar`/`UserDashboard` wiring is unchanged. `CreateWalletModal` may then be
removed (or left unreferenced) — decided at build time.

## 10. Testing

**Frontend (Vitest, `src/__tests__/` mirroring source):**
- `Wizard`: back/forward nav; no forward-jump; mandatory disables Continue until
  `isComplete`; optional toggles `nextLabel`/`nextLabelIncomplete`;
  `onComplete`→`renderCompletion` transition.
- `csvValidation`: per-resource rules + `parseAndValidateCsv`.
- Wallet flow: mocked `api` — wallet create → parallel bulk + looped invites;
  per-resource partial-failure aggregation; per-step `isComplete` gating.

**Backend:** the dedup change tests in §8.

**Gates:** `npm run lint` + `npm run build` pass; `./gradlew test` green.

## 11. Style & copy constraints (`style.md`)

- English only (code, comments, UI copy).
- Reuse `components/ui/` primitives; no hand-rolled `<button>`/`<input>`.
- `app-*` tokens; radius scale (`--r-*`, squared CTAs); brand gradient
  (`--brand-1`→`--brand-2`); per-wallet accent via `wallet.color`.
- **No glow/halo**; neutral shadows only.
- Never the word **"skip"** — use "Continue without <thing>".

## 12. Implementation process

1. `TODO.md` at repo root with the full task checklist (this spec's sections).
2. Build the generic `Wizard` primitive (logic/structure only).
3. Build a **minimal visual mock** (placeholder step content) to validate the stepper
   look — progress bar, current/future colors, Back/Continue label behavior.
4. **STOP** for the user's sign-off on the mock before wiring the wallet flow.
5. After sign-off: steps 1–5 + shared CSV module + backend dedup change + integration
   + tests, updating `TODO.md` as we go.

### Deferred decisions captured as TODO notes
- Step 2 per-mode UI + whether import-from-other-wallets ships in v1.
- Completion "Manage failed" editable-table design.
- Exact recommended-tags and recommended-subscriptions seed constants.
