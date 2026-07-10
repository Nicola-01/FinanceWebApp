# Wallet Creation Wizard — Implementation Plan / TODO

> **For agentic workers:** implement task-by-task. Steps use checkbox (`- [ ]`) syntax.
> Spec: `docs/superpowers/specs/2026-07-05-wallet-creation-wizard-design.md`.
> Branch: `feat/wallet-creation-wizard` (off `feat/settings-page`).

**Goal:** Replace the single-step New Wallet modal with a multi-step wizard, built on a
new generic `Wizard` primitive, that sets up a wallet's basics + tags + subscriptions +
transactions + invites in one guided flow.

**Architecture:** A shell-agnostic generic `Wizard` primitive (stepper + Back/Continue +
external completion phase) rendered inside a full-screen overlay for the wallet flow.
Steps stage data into local draft state; a single final phase creates the wallet then
fires the bulk imports in parallel + loops invites, and reports a per-resource recap.

**Tech Stack:** React 19 + TypeScript + Tailwind 4; Vitest + Testing Library; existing
`components/ui/` primitives; existing `csvImport.ts`/`csvDedup.ts`; Spring Boot backend
(one dedup change).

## Global Constraints (apply to every task, verbatim from spec/CLAUDE.md)

- **English only** — code, comments, UI copy.
- **Never the word "skip"** — use "Continue without <thing>".
- **Reuse `components/ui/` primitives** — no hand-rolled `<button>`/`<input>`.
- **`app-*` colour tokens; radius scale (`--r-*`, squared CTAs); brand gradient
  (`--brand-1`→`--brand-2`); per-wallet accent = `wallet.color`. No glow/halo — neutral
  shadows only.**
- Name lengths: **wallet 3–25**, **tag 2–25** (backend-enforced).
- **Bulk endpoints are all-or-nothing** (409 `"Row N: …"` on any bad row); success body
  `{created,updated,autoCreatedTags}`. Validate client-side first.
- Frontend gates: **`npm run lint` + `npm run build` must pass.**
- Backend gate: **`./gradlew spotlessApply` + `./gradlew test` green + ≥90% coverage.**
- Tests live under `frontend/src/__tests__/` mirroring the source tree.
- Do **not** kill the running Vite dev server between turns.

---

## Phase 0 — Setup

- [x] Confirm on branch `feat/wallet-creation-wizard`; spec committed. (Done.)
- [x] This TODO file committed.

---

## Phase 1 — Generic `Wizard` primitive (logic/structure only)

**Files:**
- Create: `frontend/src/components/ui/Wizard.tsx`
- Test: `frontend/src/__tests__/components/ui/Wizard.test.tsx`

**Public interface (Produces — later phases depend on these exact names/types):**
```ts
export interface WizardStep {
  name: string;
  mandatory: boolean;
  content: React.ReactNode;
  nextLabel: string;
  nextLabelIncomplete?: string;   // required (by convention) if !mandatory
  isComplete: boolean;
}
export type WizardCompletionStatus = "processing" | "done" | "error";
export interface WizardCompletionState<TResult> {
  status: WizardCompletionStatus;
  result?: TResult;
  error?: unknown;
  goToStep: (index: number) => void;
}
export interface WizardProps<TResult = unknown> {
  steps: WizardStep[];
  onComplete: () => Promise<TResult>;
  renderCompletion: (s: WizardCompletionState<TResult>) => React.ReactNode;
  onCancel?: () => void;
  accentColor?: string;           // optional; falls back to brand gradient
}
export function Wizard<TResult>(props: WizardProps<TResult>): JSX.Element;
```

**Behaviour contract:**
- `current` (index), `furthest` (max reached), `phase: "steps" | "completion"`,
  `completion: { status, result?, error? }`.
- Continue on non-last step → `current+1`, bump `furthest`.
- Continue on last step → `phase="completion"`, `status="processing"`, `await onComplete()`
  → `status="done"` (or `"error"` on throw).
- Back → `current-1` (hidden on step 0, processing, completion).
- `goToStep(i)` → allowed only for `i <= furthest`; if called from completion, returns to
  `phase="steps"`, `current=i`.
- Continue disabled iff `mandatory && !isComplete`.
- Continue label: `mandatory ? nextLabel : (isComplete ? nextLabel : nextLabelIncomplete ?? nextLabel)`.
- Stepper: `i < current` → check; `i === current` → accent number; `i > current` → neutral
  number. Nodes clickable (back-nav) iff `i <= furthest && phase==="steps"`. No glow.

- [x] **Step 1.1: Write failing tests** — `Wizard.test.tsx` with a small controllable
  harness (parent holds a `complete` boolean array + `content` per step). Cases:
```tsx
// harness renders <Wizard steps=[...] onComplete renderCompletion /> with buttons
// inside step content to flip isComplete, so we drive real parent-controlled state.
test("hides Back on the first step", ...)
test("mandatory step disables Continue until isComplete, label stays nextLabel", ...)
test("optional step keeps Continue enabled; label = nextLabelIncomplete when incomplete, nextLabel when complete", ...)
test("Continue advances and Back returns, preserving step content/state", ...)
test("future stepper nodes are not clickable; a visited node click navigates back", ...)
test("last-step Continue calls onComplete and renders renderCompletion (processing→done)", ...)
test("onComplete rejection renders error; goToStep(0) returns to step 1", ...)
```
- [x] **Step 1.2: Run tests — verify they fail** (`npm test -- Wizard`). Expected: FAIL
  (module/exports missing).
- [x] **Step 1.3: Implement `Wizard.tsx`** — state machine + stepper + footer (reusing
  `Button`), matching the behaviour contract above. Accent via `accentColor` inline style,
  else brand-gradient classes. No glow; `--r-*` radii; `app-*` tokens.
- [x] **Step 1.4: Run tests — verify pass.** Expected: PASS.
- [x] **Step 1.5: `npm run lint` + `npm run build`.** Expected: clean.
- [x] **Step 1.6: Commit** — `feat(ui): add generic Wizard primitive`.

---

## Phase 2 — Full-screen shell + minimal visual mock  →  **STOP for sign-off**

**Files:**
- Create: `frontend/src/components/ui/WizardShell.tsx` (full-screen overlay; portal;
  sticky footer area is owned by `Wizard`, shell provides the surface + header + close +
  discard-confirm).
- Create: `frontend/src/modals/wallet/CreateWalletWizard.mock.tsx` (mock consumer with
  placeholder steps: "Step content here", toggle buttons to fake `isComplete`).
- Modify: `frontend/src/App.tsx` — add a **temporary** dev route `/wizard-mock` rendering
  the mock (removed after sign-off).

- [x] **Step 2.1: Build `WizardShell`** — full-viewport overlay, `app-bg` surface, centred
  max-width content column, header with title + close (X). Portal to `#modal-root` or
  `document.body`. Discard-confirm on close when a `dirty` prop is true.
- [x] **Step 2.2: Build the mock consumer** — 5 placeholder `WizardStep`s (Basics, Tags,
  Subscriptions, Transactions, Invite) + a `renderCompletion` showing a fake per-resource
  recap and a "Go to wallet" button. Wire `accentColor` to a hardcoded sample colour to
  preview the accent switch.
- [x] **Step 2.3: Add temp `/wizard-mock` route**, verify it renders in the running dev
  server (do not kill the server).
- [x] **Step 2.4: `npm run lint` + `npm run build`.**
- [x] **Step 2.5: Commit** — `feat(ui): wizard shell + visual mock (temp route)`.
- [x] **🛑 STOP — user signed off on the mock (stepper rebuilt: equidistant circles,
  progress-fill line, ring/filled states, per-step icons, all-done on completion).**

---

## Phase 3 — Shared CSV validation module + DataTab retrofit

> Fully specified; detail the TDD substeps when starting this phase.

**Files:**
- Create: `frontend/src/dashboard/settings/csvValidation.ts` — `RowError`,
  `validateTags/validateTransactions/validateSubscriptions`, `parseAndValidateCsv(resource,text)`.
- Create: `frontend/src/components/ui/CsvUploadField.tsx` — file button + inline `RowError` list (shared). **Deferred to Phase 5** (DataTab keeps its own buttons + hidden input; it reuses the shared `validate*` core, which is the part that matters).
- Modify: `frontend/src/dashboard/settings/DataTab.tsx` — gate `submitJob` behind
  validation; block + show errors on failure.
- Modify: `frontend/src/dashboard/settings/csvDedup.ts` — subscription key → `name+tag+startDate`.
- Test: `frontend/src/__tests__/dashboard/settings/csvValidation.test.ts`.

- [x] Validation rules per spec §7 (mirror backend). TDD: failing tests → implement → pass.
- [x] Retrofit DataTab to block on `rowErrors`; keep overwrite-confirm path unchanged.
- [x] Update `csvDedup` subscription key + its tests.
- [x] lint + build; commit (`ee18a1f`). Full suite 676 green.

---

## Phase 4 — Backend: subscription dedup key `name+tag+startDate`

> Only backend change. Triggers backend test discipline.

**Files:**
- Modify: `backend/.../service/SubscriptionService.java` (dedup key logic ~L94-159).
- Modify/Add: `backend/.../integration/BulkImportIntegrationTest.java` + `SubscriptionServiceTest`.

- [x] Change key to include name.
- [x] Add test proving two same-tag/same-startDate but differently-named subs both persist.
- [x] `./gradlew spotlessApply`; `./gradlew check` green; coverage ≥90%.
- [x] Commit (`a8ef534`). (Integration test had no subscription case; covered via unit tests.)

---

## Phase 5 — Wallet flow: `CreateWalletWizard` (steps 1, 3, 4, 5) + orchestration

**Files:**
- Create: `frontend/src/modals/wallet/CreateWalletWizard.tsx` (container: draft state,
  `openModal()` handle, `onSuccess(id)` prop, `onComplete` orchestration, completion screen).
- Create per-step content components under `frontend/src/modals/wallet/wizardSteps/`.
- Test: `frontend/src/__tests__/modals/wallet/CreateWalletWizard.test.tsx`.

- [x] **Step 1 (Basics):** reuse `Input`+`IconColorSelector`+`CurrencySelector`; `isComplete`=name 3–25.
- [x] **Step 3 (Subscriptions):** curated suggestions (distinct tags) + CSV via shared helper. *(subagent-built)*
- [x] **Step 4 (Transactions):** CSV via shared helper. *(subagent-built)*
- [x] **Step 5 (Invites):** list of `{user, role}` (VIEWER/EDITOR). *(subagent-built)*
- [x] **Completion orchestration** (`walletCreation.ts`): `POST /wallets` → parallel tags/subs/tx
  bulk (only if staged) + looped `POST /api/invitations/{id}` → per-resource recap. Wallet-create
  failure → error + `goToStep(0)`. Partial failure → recap + "Go to wallet".
- [x] Tests: mocked `api`, gating, parallel calls, partial-failure aggregation.
- [x] lint + build; commit (`44dda4c`). Full suite 718 green.

> **NOTE — carried to later phases:** TagsStep shipped **minimal** (recommended + CSV); Phase 6
> expands it to 4 modes + adds its test. The "Manage failed" **editable table** is not built yet —
> the recap surfaces failures + "Go to wallet" (re-import via Settings → Data); table is deferred.
> Default wallet colour is now brand violet `#8b5cf6` (was green).

---

## Phase 6 — Step 2 (Tags): 4 entry modes → one draft list

> **Deferred design** (per agreement): exact per-mode UI + whether import-from-other-wallets
> ships in v1. Decide when starting this phase.

**Files:**
- Create: `frontend/src/modals/wallet/wizardSteps/TagsStep.tsx` (+ mode sub-components).

- [x] **Recommended (categories)** — `recommendedTags.ts` seeded from `DemoService`
  (main category + sub-categories); whole-category selection accented in the category
  colour; `StagedTagTree` read-only echo of the drawer tree (non-draggable). CSV kept.
  Tests + lint + build green; commit `698530e`. *(User decided: import-from-wallet is IN v1.)*
- [x] **Mode switcher** — segmented `Selector` (Recommended · From wallet · CSV · Create).
  Recommended + CSV wired; From-wallet + Create show placeholders. Staged tree persists
  across modes. Commit `0005e1b`.
- [x] **Strike individual sub-tags** — child × → struck (line-through) + restore; partial
  category = dashed border + `aria-pressed=mixed`; de/re-select restores all; struck child
  keeps canonical position (no reorder); whole row toggles expand. Commit `40ba5c9`/`0005e1b`.
- [x] **From wallet** (UI, mock) — `TagCategoryPicker` extracted + reused; wallet-card grid
  → pick source → its categories as picker cards; whole-category stage + strike/restore work
  for imported categories (derivation spans presets + source wallets). Mock in
  `sourceWallets.ts`. Commit `f432df5`.
- [ ] **From wallet — BACKEND API (single request, avoid N+1 / rate limit):**
  ```
  GET /api/wallets/tag-sources          (auth: JWT/PAT; user's ACCEPTED wallets only)
  200 → [
    { "wallet": { "id": "uuid", "name": "...", "icon": "work", "color": "#0ea5e9",
                  "currency": "EUR" },
      "tags":  [ { "name": "Clients", "icon": "work", "colorHex": "#0ea5e9",
                   "parentName": null },
                 { "name": "Acme", "icon": "bank", "colorHex": "#38bdf8",
                   "parentName": "Clients" }, ... ] },
    ...
  ]
  ```
  One round-trip for ALL wallets+tags (a per-wallet fetch would be N calls → rate limit).
  Frontend groups flat `tags` into `RecommendedTagGroup[]` (parent + children) via a
  `groupTagRequests()` helper, then feeds `TagsStep`'s `sourceWallets` prop (replacing the
  mock). Exclude the wallet being created (it doesn't exist yet). Backend: new controller
  method joining `WalletAccess` (ACCEPTED) → wallets → tags; add service test + keep ≥90%.
- [ ] **Create** — reuse `TagSelectorAddForm` to add an ad-hoc tag/category to the draft.

---

## Phase 7 — Integration, "Manage failed", cleanup

**Files:**
- Modify: `frontend/src/dashboard/wallet/WalletsBar.tsx` — swap `CreateWalletModal` →
  `CreateWalletWizard` (same `openModal()`/`onSuccess`).
- Modify: `frontend/src/App.tsx` — remove temp `/wizard-mock` route.
- Remove/retire: `CreateWalletModal.tsx` (if unreferenced).

- [x] Wire the real wizard to the existing trigger — `WalletsBar` now mounts
  `CreateWalletWizard` (drop-in `openModal()`/`onSuccess`); temp `/wizard-mock` route +
  harness removed; old `CreateWalletModal` retired. Commit `176ae9d`. Build + 759 tests green.
- [ ] **Manage-failed editable table** — design + build (deferred detail).
- [ ] **Deferred by user (2026-07-06):** Subscriptions step polish; From-wallet **tag-sources
  API** (that tab still uses `sourceWallets.ts` mock — live users currently see the mock
  "Freelance"/"Travel 2026"; swap for the real endpoint or pass `sourceWallets={[]}`).
- [ ] (Note) `BasicsStep.tsx` still has a stale doc comment mentioning the deleted
  `CreateWalletModal`; harmless, tidy when convenient.

---

## Deferred decisions (captured, revisit at their phase)
- Phase 6: per-mode tag UI + import-from-other-wallets go/no-go for v1.
- Phase 5/7: "Manage failed" editable-table design.
- Phase 5/6: recommended-tags & recommended-subscriptions seed constants.
