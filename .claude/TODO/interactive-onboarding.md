# Interactive Onboarding (guided tour) — Implementation Plan / TODO

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task.
> Steps use checkbox (`- [ ]`) syntax for tracking.
> Spec: `docs/superpowers/specs/2026-07-11-interactive-onboarding-design.md` (read it first —
> it holds the confirmed decisions, UX acts, edge-case table and offline policy).
> Branch: `feat/interactive-onboarding` — **ask the user for the base branch before cutting it**
> (house rule: one branch per task, never commit to `release/*`/`main`; the user merges manually).
> Target release: v3.6.0+.

**Goal:** Replace the registration-time seeded "Demo Wallet" with a skippable, replayable,
learn-by-doing guided tour: the new user creates their first wallet through the existing
`CreateWalletWizard`, imports transactions from a CSV (our sample or their own bank export),
then follows coach-marks over the real dashboard; completion is a server-side per-user flag.

**Architecture:** Backend adds a `User.onboardingCompleted` boolean (notify\*-pattern), exposes
it in `AuthResponse` (all 4 builder sites) and a `GET/PUT /api/users/me/onboarding` resource,
and removes the demo seed from invite registration. Frontend adds a `src/tour/` feature module
(pure positioning math + pure step machine + data-driven step registry + provider/layer) and two
shared primitives (`SpotlightScrim`, `CoachMark`) at `z-[130]`. While the wallet wizard is open,
the tour switches from spotlight to non-blocking "hint" cards advancing on wizard events.
Welcome/completion reuse `ModalDialog` — **no new modal/overlay shell**.

**Tech Stack:** Spring Boot 3.5 / Java 21 / JPA (ddl-auto=update, no migrations); React 19 + TS +
Tailwind 4 + framer-motion ^12 (already in bundle — no new dependency, tour engine is
hand-rolled); Vitest + Testing Library.

## Global Constraints (apply to every task)

- **English only** — code, comments, UI copy.
- **All endpoints under `/api/...`**.
- Backend gates: `./gradlew test` green, **add tests for your change**, then
  `./gradlew spotlessApply` and keep `./gradlew check` (Spotless + **≥90% line coverage**)
  passing. No new entities are planned (no PK concerns); schema evolves via `ddl-auto=update` —
  **no migration files**.
- Frontend gates (from `frontend/`, same order as CI): `npm run lint` → `npm test` →
  `npm run build`. Tests under `src/__tests__/` mirroring the source tree. No path aliases —
  relative imports only. Extracted pure logic **must** ship with a Vitest test.
- **UI:** read `frontend/style.md` before any UI task. Reuse `components/ui/` primitives
  (`Button`, `Card`, `Badge`, `modals/common/ModalDialog`) — never hand-rolled
  `<button>`/`<input>`. Theme-aware `app-*` tokens only; radius via `--r-*`; **no colored
  glow/halos** (the spotlight ring is a neutral shadow/ring); brand gradient accent outside a
  wallet context, `wallet.color` inside.
- Components >~250 lines are split candidates along real responsibility boundaries.
- Do **not** kill the running Vite dev server between turns.
- Line numbers quoted below were verified on 2026-07-11 (`release/v3.4.0`); re-locate by content
  if they drifted.
- Commit at the end of every task (`feat(onboarding): ...` style).

---

## Phase A — Backend: flag, exposure, seed removal

### Task 1: `User.onboardingCompleted` + `AuthResponse` exposure (all 4 sites)

**Files:**
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/model/User.java` (after the
  notify\* block, lines ~51-65)
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/dto/AuthResponse.java`
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/controller/AuthController.java`
  (builders at ~:63 login and ~:121 refresh)
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/controller/DemoController.java`
  (user creation ~:50-58, builder ~:73)
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/controller/UserController.java`
  (username-change token re-issue builder ~:70)
- Test: extend `AuthControllerTest`, `DemoControllerTest`, `UserControllerTest`

**Interfaces (Produces):**
- `User.isOnboardingCompleted() : boolean` / `User.setOnboardingCompleted(boolean)` (Lombok).
- Every `AuthResponse` JSON now carries `"onboardingCompleted": boolean`.

- [ ] **Step 1: Add the column** — in `User.java`, directly after `notifyRecurringExecutions`,
  following the exact notify\* idiom (but defaulting **false**):

```java
  /** Whether the user has completed (or dismissed) the interactive onboarding tour. */
  @Column(nullable = false, columnDefinition = "boolean default false")
  @Builder.Default
  private boolean onboardingCompleted = false;
```

`ddl-auto=update` adds the column; the SQL default backfills existing rows to `false`
(intended — existing users become invitation-prompt candidates, see Task 14).

- [ ] **Step 2: Add the DTO field** — `AuthResponse.java` becomes:

```java
@Data
@Builder
public class AuthResponse {
  private String token;
  private String role;
  private boolean passwordMustChange;
  private boolean onboardingCompleted;
}
```

- [ ] **Step 3: Populate at all four builder sites** (a missed site silently defaults to
  `false` — that is why this list is exhaustive):
  - `AuthController` login (~:63) and refresh (~:121): add
    `.onboardingCompleted(user.isOnboardingCompleted())`.
  - `UserController` username-change re-issue (~:70): same line.
  - `DemoController`: build the demo user with `.onboardingCompleted(true)` (demo accounts get
    the seeded wallet — the tour must never run over it) and add
    `.onboardingCompleted(true)` to its `AuthResponse` builder (~:73).

- [ ] **Step 4: Extend the controller tests** — in `AuthControllerTest` (login + refresh),
  `DemoControllerTest`, `UserControllerTest`, extend the existing response-shape assertions:

```java
.andExpect(jsonPath("$.onboardingCompleted").value(false))   // login/refresh/username tests
.andExpect(jsonPath("$.onboardingCompleted").value(true))    // demo login test
```

Give the mocked/stubbed `User` an explicit `onboardingCompleted` value so the assertion is
meaningful, not a default-vs-default tautology.

- [ ] **Step 5: Verify + commit**

```bash
cd backend && ./gradlew test --tests '*AuthControllerTest*' --tests '*DemoControllerTest*' \
  --tests '*UserControllerTest*' && ./gradlew spotlessApply check
git add -A backend && git commit -m "feat(onboarding): onboardingCompleted flag on User, exposed in AuthResponse"
```

### Task 2: Remove the invite-registration demo seed

**Files:**
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/service/RegisterService.java`
  (field ~:29, call ~:82)
- Modify: `backend/src/test/java/dev/busato/FinanceWebApp/backend/service/RegisterServiceTest.java`
  (`@Mock DemoService` ~:35, `verify` ~:91)

**Interfaces:** none produced; `DemoService`, `DemoServiceTest`, `DemoController` visitor flow
and `DemoCleanupCronJob` are **untouched**.

- [ ] **Step 1: Invert the test first** — in `RegisterServiceTest`, delete the
  `@Mock private DemoService demoService;` field and replace the
  `verify(demoService).generateDemoWallet(any(UUID.class));` assertion with a regression guard
  (rename/keep the test so intent is explicit):

```java
  @Test
  void registerViaInvite_createsUserWithoutSeedingAnyWallet() {
    // ...existing arrange/act unchanged...
    verify(userRepository).save(any(User.class));
    verifyNoInteractions(walletRepository); // if the test class mocks it; otherwise rely on
    // the compile-level guarantee: RegisterService no longer has a DemoService dependency.
  }
```

Run: `./gradlew test --tests '*RegisterServiceTest*'` → expected **FAIL** (compile error or
unnecessary-stubbing), proving the test now demands the new behavior.

- [ ] **Step 2: Remove the seed** — in `RegisterService.java` delete the
  `private final DemoService demoService;` field and the
  `demoService.generateDemoWallet(newUser.getId());` line. Nothing else in the method changes
  (user save + invitation ACCEPTED flow stays).

- [ ] **Step 3: Verify + commit**

```bash
cd backend && ./gradlew test --tests '*RegisterServiceTest*' && ./gradlew spotlessApply check
git add -A backend && git commit -m "feat(onboarding): stop seeding a demo wallet at invite registration"
```

### Task 3: `GET/PUT /api/users/me/onboarding`

**Files:**
- Create: `backend/src/main/java/dev/busato/FinanceWebApp/backend/controller/OnboardingController.java`
- Create: `backend/src/main/java/dev/busato/FinanceWebApp/backend/service/OnboardingService.java`
- Create: `backend/src/main/java/dev/busato/FinanceWebApp/backend/dto/OnboardingStatusResponse.java`
- Create: `backend/src/main/java/dev/busato/FinanceWebApp/backend/dto/OnboardingStatusRequest.java`
- Test: `backend/src/test/java/dev/busato/FinanceWebApp/backend/controller/OnboardingControllerTest.java`
- Test: `backend/src/test/java/dev/busato/FinanceWebApp/backend/service/OnboardingServiceTest.java`

**Interfaces (Produces):**
- `GET /api/users/me/onboarding` → `200 {"completed": boolean}`.
- `PUT /api/users/me/onboarding` body `{"completed": boolean}` → `204`.
- `OnboardingService.getStatus(UUID userId) : OnboardingStatusResponse`,
  `OnboardingService.updateStatus(UUID userId, OnboardingStatusRequest)` — both throw
  `UserNotFoundException` (existing exception → RFC-7807 via `GlobalExceptionHandler`).

- [ ] **Step 1: Write the failing tests** — mirror `NotificationPreferencesControllerTest`
  (`@WebMvcTest(controllers = OnboardingController.class, excludeAutoConfiguration =
  SecurityAutoConfiguration.class)` extending `BaseWebMvcTest`) and a Mockito unit test for the
  service:

```java
// OnboardingServiceTest — core cases
@Test void getStatus_returnsFlagValue() { /* user with flag=true → response.completed()==true */ }
@Test void getStatus_freshUserDefaultsFalse() { /* User.builder()...build() → false */ }
@Test void updateStatus_persistsFlag() { /* request(completed=true) → user.setOnboardingCompleted(true) + save */ }
@Test void updateStatus_unknownUser_throws() { /* empty repo → UserNotFoundException */ }
```

```java
// OnboardingControllerTest — GET shape + PUT delegation
mockMvc.perform(get("/api/users/me/onboarding")) → 200, jsonPath("$.completed").value(false);
mockMvc.perform(put("/api/users/me/onboarding").contentType(APPLICATION_JSON)
    .content("{\"completed\":true}")) → 204; verify(onboardingService).updateStatus(eq(userId), any());
```

Run: `./gradlew test --tests '*Onboarding*'` → expected FAIL (classes missing).

- [ ] **Step 2: Implement** — DTOs are records-by-Lombok in house style:

```java
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class OnboardingStatusResponse { private boolean completed; }

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class OnboardingStatusRequest { private boolean completed; }
```

```java
/** Reads and writes the caller's interactive-onboarding completion flag. */
@Service
@RequiredArgsConstructor
public class OnboardingService {
  private final UserRepository userRepository;

  @Transactional(readOnly = true)
  public OnboardingStatusResponse getStatus(UUID userId) {
    User user = userRepository.findById(userId).orElseThrow(() -> new UserNotFoundException(userId));
    return OnboardingStatusResponse.builder().completed(user.isOnboardingCompleted()).build();
  }

  @Transactional
  public void updateStatus(UUID userId, OnboardingStatusRequest request) {
    User user = userRepository.findById(userId).orElseThrow(() -> new UserNotFoundException(userId));
    user.setOnboardingCompleted(request.isCompleted());
    userRepository.save(user);
  }
}
```

```java
/** The caller's interactive-onboarding completion state. */
@RestController
@RequestMapping("/api/users/me/onboarding")
@RequiredArgsConstructor
public class OnboardingController {
  private final OnboardingService onboardingService;

  @GetMapping
  public ResponseEntity<OnboardingStatusResponse> getStatus(@AuthenticationPrincipal User user) {
    return ResponseEntity.ok(onboardingService.getStatus(user.getId()));
  }

  @PutMapping
  public ResponseEntity<Void> updateStatus(
      @AuthenticationPrincipal User user, @RequestBody OnboardingStatusRequest request) {
    onboardingService.updateStatus(user.getId(), request);
    return ResponseEntity.noContent().build();
  }
}
```

- [ ] **Step 3: Verify + commit**

```bash
cd backend && ./gradlew test --tests '*Onboarding*' && ./gradlew spotlessApply check
git add -A backend && git commit -m "feat(onboarding): GET/PUT /api/users/me/onboarding"
```

**Phase A exit:** `./gradlew check` green. Optional live check with the `verify` skill:
register via an invite and confirm `GET /wallets` for the new user returns `[]`.

---

## Phase B — Tour engine (no product-visible change yet)

### Task 4: Pure positioning math

**Files:**
- Create: `frontend/src/tour/positioning.ts`
- Test: `frontend/src/__tests__/tour/positioning.test.ts`

**Interfaces (Produces):**

```ts
export interface Rect { x: number; y: number; width: number; height: number }
export type Placement = "top" | "bottom";
export interface CoachMarkPosition { x: number; y: number; placement: Placement; arrowX: number }

export function computeCoachMarkPosition(
  target: Rect, card: { width: number; height: number },
  viewport: { width: number; height: number },
  preferred: Placement = "bottom", margin = 12, gap = 10,
): CoachMarkPosition;

export function computeScrimRects(
  target: Rect, viewport: { width: number; height: number }, padding = 8,
): [Rect, Rect, Rect, Rect]; // top, bottom, left, right panels around the padded cutout
```

- [ ] **Step 1: Write the failing tests** — pure-function table tests, no DOM: prefers bottom;
  flips to top when the card would overflow the bottom edge; clamps x to
  `[margin, vw - cardW - margin]`; `arrowX` tracks the target center inside the clamped card;
  scrim rects tile the full viewport minus the padded cutout (assert union area = viewport −
  cutout); degenerate inputs (zero-size target, target taller than the viewport → falls back to
  the placement with more room, never negative sizes).
- [ ] **Step 2: Implement** — no dependencies:

```ts
export function computeCoachMarkPosition(
  target: Rect, card: { width: number; height: number },
  viewport: { width: number; height: number },
  preferred: Placement = "bottom", margin = 12, gap = 10,
): CoachMarkPosition {
  const roomBelow = viewport.height - (target.y + target.height) - gap - margin;
  const roomAbove = target.y - gap - margin;
  let placement: Placement =
    preferred === "bottom"
      ? roomBelow >= card.height || roomBelow >= roomAbove ? "bottom" : "top"
      : roomAbove >= card.height || roomAbove >= roomBelow ? "top" : "bottom";
  const y =
    placement === "bottom"
      ? Math.min(target.y + target.height + gap, viewport.height - card.height - margin)
      : Math.max(target.y - gap - card.height, margin);
  const idealX = target.x + target.width / 2 - card.width / 2;
  const x = Math.min(Math.max(idealX, margin), Math.max(viewport.width - card.width - margin, margin));
  const arrowX = Math.min(Math.max(target.x + target.width / 2 - x, 16), card.width - 16);
  return { x, y, placement, arrowX };
}

export function computeScrimRects(
  target: Rect, viewport: { width: number; height: number }, padding = 8,
): [Rect, Rect, Rect, Rect] {
  const cx = Math.max(target.x - padding, 0);
  const cy = Math.max(target.y - padding, 0);
  const cr = Math.min(target.x + target.width + padding, viewport.width);
  const cb = Math.min(target.y + target.height + padding, viewport.height);
  return [
    { x: 0, y: 0, width: viewport.width, height: cy },                          // top
    { x: 0, y: cb, width: viewport.width, height: viewport.height - cb },       // bottom
    { x: 0, y: cy, width: cx, height: cb - cy },                                // left
    { x: cr, y: cy, width: viewport.width - cr, height: cb - cy },              // right
  ];
}
```

Run `npx vitest run src/__tests__/tour/positioning.test.ts` → PASS.
- [ ] **Step 3: Commit** — `feat(onboarding): tour positioning math`.

### Task 5: DOM helpers (target resolution, tracking, dialog observer)

**Files:**
- Create: `frontend/src/tour/dom.ts`
- Test: `frontend/src/__tests__/tour/dom.test.ts`

**Interfaces (Produces):**

```ts
export function resolveVisibleTarget(selector: string): HTMLElement | null;
// querySelectorAll + first element with offsetParent !== null (handles the two AddWalletTiles)

export function waitForTarget(
  selector: string, opts?: { timeoutMs?: number; intervalMs?: number }, // 4000 / 150
): Promise<HTMLElement | null>; // null on timeout — caller advances/skips

export function trackRect(el: HTMLElement, cb: (r: DOMRect) => void): () => void;
// ResizeObserver on el + window "resize" + capture-phase document "scroll", rAF-throttled
// (capture-phase scroll catches the desktop right-pane scroll container, UserDashboard.tsx:156)

export function scrollTargetIntoView(el: HTMLElement): Promise<void>;
// scrollIntoView({block:"center"}) then resolve when two consecutive rAF rects are equal

export function observeOpenDialogs(cb: (anyOpen: boolean) => void): () => void;
// MutationObserver on document.body + #modal-root for `dialog[open]` presence
// (DeleteModal, ConfirmModal, CsvFormatModal, InviteModal are native dialogs → auto-pause)
```

- [ ] **Step 1: Failing tests** (jsdom + fake timers): `resolveVisibleTarget` picks the visible
  duplicate (stub `offsetParent`); `waitForTarget` resolves when the node appears late and
  resolves `null` after timeout; `observeOpenDialogs` fires on `open` attribute add/remove.
  Stub `ResizeObserver` (repo pattern — see existing DOM-heavy tests / `src/test/setup.ts`).
- [ ] **Step 2: Implement, run, PASS.**
- [ ] **Step 3: Commit** — `feat(onboarding): tour DOM helpers`.

### Task 6: Step registry types + pure step machine

**Files:**
- Create: `frontend/src/tour/types.ts`
- Create: `frontend/src/tour/stepMachine.ts`
- Test: `frontend/src/__tests__/tour/stepMachine.test.ts`

**Interfaces (Produces):**

```ts
// types.ts
import type { TabType } from "../dashboard/wallet/walletTabs";

export type TourBreakpoint = "mobile" | "desktop"; // desktop = matchMedia("(min-width: 1280px)") — the xl: switch
export type PerBp<T> = T | Partial<Record<TourBreakpoint, T>>;

export type TourEvent =
  | { type: "START"; ctx: TourRunContext }
  | { type: "NEXT" } | { type: "BACK" } | { type: "SKIP" }
  | { type: "TARGET_TIMEOUT" }
  | { type: "DIALOG_OPENED" } | { type: "DIALOG_CLOSED" }
  | { type: "WIZARD_OPENED" } | { type: "WIZARD_STEP"; index: number }
  | { type: "WALLET_CREATED"; walletId: string }
  | { type: "WIZARD_CLOSED"; created: boolean }
  | { type: "SAMPLE_LOADED" }
  | { type: "BREAKPOINT_CHANGED"; breakpoint: TourBreakpoint };

export type AdvanceRule =
  | { on: "next" }
  | { on: "event"; event: "wizard-opened" | "wallet-created" }
  | { on: "wizard-step"; index: number };

export interface TourRunContext {
  breakpoint: TourBreakpoint;
  hasWallets: boolean;   // true → creation act auto-skipped (existing users, replay)
  replay: boolean;
  sampleUsed: boolean;   // updated live by SAMPLE_LOADED / notes-scan fallback
  createdWalletId: string | null;
}

export interface TourStepDef {
  id: string;
  kind: "dialog" | "spotlight" | "hint";
  target?: PerBp<string>;         // data-tour CSS selector; dialogs and centered hints omit it
  title: string;
  body: PerBp<string>;
  tab?: TabType;                  // precondition: navigate ?tab= before resolving the target
  when?: (ctx: TourRunContext) => boolean;
  advance: AdvanceRule;
  optional?: boolean;             // TARGET_TIMEOUT → skip silently (e.g. budget pre-ship)
  padding?: number;               // scrim cutout padding override
  extra?: "sample-csv-actions" | "completion-cleanup"; // TourLayer slot key
}

export type TourStatus =
  | "idle" | "running" | "paused-dialog" | "paused-wizard" | "finished" | "skipped";

export interface TourState {
  status: TourStatus;
  ctx: TourRunContext;
  stepIndex: number;      // index into the ACTIVE steps (filtered by when(ctx) + breakpoint)
  wizardStep: number;     // last WIZARD_STEP index seen (-1 when closed)
}
```

```ts
// stepMachine.ts — pure, side-effect free
export function activeSteps(all: TourStepDef[], ctx: TourRunContext): TourStepDef[];
export function reduce(state: TourState, event: TourEvent, steps: TourStepDef[]): TourState;
export const initialState: TourState;
```

Transition rules (encode exactly; the test table mirrors them):
- `START` → running at step 0 of `activeSteps`.
- `NEXT`/`BACK` move within active steps; `NEXT` past the last → `finished`.
- `SKIP` from any non-idle state → `skipped` (caller persists the flag).
- `TARGET_TIMEOUT` → advance (same as NEXT); on `optional` steps no diagnostics, otherwise the
  caller may `console.warn` — the machine treats both as advance (never trap the user).
- `DIALOG_OPENED` → `paused-dialog` (remember prior status); `DIALOG_CLOSED` → restore.
- `WIZARD_OPENED` → if current step advances `{on:"event",event:"wizard-opened"}`, advance AND
  enter wizard-hint context (status stays `running`; `TourLayer` picks hint rendering from the
  step kind); set `wizardStep = 0`.
- `WIZARD_STEP(i)` → set `wizardStep = i`; while the current step's advance is
  `{on:"wizard-step", index}` and `i >= index`, advance (loop — a user can jump 2 steps).
- `WALLET_CREATED(id)` → `ctx.createdWalletId = id`, `ctx.hasWallets = true`; advances a step
  waiting on `{on:"event",event:"wallet-created"}`.
- `WIZARD_CLOSED{created:false}` → regress to the step with advance
  `{on:"event",event:"wizard-opened"}` (the create-wallet spotlight); `{created:true}` → no-op
  (WALLET_CREATED already advanced), `wizardStep = -1`.
- `SAMPLE_LOADED` → `ctx.sampleUsed = true`.
- `BREAKPOINT_CHANGED` → update ctx; recompute active steps; clamp `stepIndex`; current step id
  is preserved when it survives the filter, else nearest previous surviving step.

- [ ] **Step 1: Failing table tests** — cover every rule above plus: skip at every status;
  pause/resume roundtrip; wizard discard regression; double `WIZARD_STEP` jump (0→2 advances two
  hint steps); breakpoint flip mid-wizard; `START` with `hasWallets=true` lands directly on the
  first dashboard-act step.
- [ ] **Step 2: Implement, PASS, commit** — `feat(onboarding): tour step machine + types`.

### Task 7: `SpotlightScrim` + `CoachMark` primitives

**Files:**
- Create: `frontend/src/components/ui/SpotlightScrim.tsx`
- Create: `frontend/src/components/ui/CoachMark.tsx`
- Test: `frontend/src/__tests__/components/ui/CoachMark.test.tsx`
- Test: `frontend/src/__tests__/components/ui/SpotlightScrim.test.tsx`

**Interfaces (Produces):**

```ts
export interface SpotlightScrimProps {
  targetRect: DOMRect | null;  // null → full dim, no cutout
  padding?: number;            // default 8
  onScrimClick?: () => void;   // subtle feedback (shake), NOT skip
}

export interface CoachMarkProps {
  targetRect: DOMRect | null;  // null → centered near the bottom (hint fallback)
  title: string;
  body: React.ReactNode;
  stepIndex: number;
  stepCount: number;           // progress dots
  onNext?: () => void;         // hidden when the step advances on an event
  onBack?: () => void;
  onSkip: () => void;
  nextLabel?: string;          // default "Next"; last step "Finish"
  mode?: "spotlight" | "hint"; // hint = compact, no assumption of a scrim behind
  children?: React.ReactNode;  // extra slot (sample CSV buttons, completion actions)
}
```

- [ ] **Step 1: Failing render tests** — CoachMark: renders title/body, fires
  onNext/onBack/onSkip, hides Next when `onNext` undefined, dots = stepCount with `stepIndex`
  active, hint fallback positions with `targetRect: null`. SpotlightScrim: renders 4 panels
  with `targetRect`, 1 full panel with `null`.
- [ ] **Step 2: Implement** — both `fixed` at `z-[130]`, portal not required (rendered by
  `TourLayer` which portals once). Scrim panels `bg-black/55` + a neutral ring around the
  cutout (`ring-1 ring-white/25` — **no colored glow**); the cutout is a genuine hole (four
  separate divs), so the target stays clickable. CoachMark card: `bg-app-surface
  text-app-text border border-app-border rounded-[var(--r-card)] shadow-xl max-w-sm p-4`,
  CTAs `<Button size="sm">` (Next `variant="primary"`, Back `variant="secondary"`, Skip
  `variant="ghost"`), position via `computeCoachMarkPosition` (measure the card with a ref +
  `useLayoutEffect`), framer-motion fade/slide keyed by step, `useReducedMotion()` → no motion.
  Keep each file <~200 lines (dots as a tiny inline subcomponent).
- [ ] **Step 3: PASS + lint + commit** — `feat(onboarding): SpotlightScrim + CoachMark primitives`.

### Task 8: `TourContext` / `TourProvider` / `TourLayer` + App mount

**Files:**
- Create: `frontend/src/tour/TourContext.ts`
- Create: `frontend/src/tour/TourProvider.tsx`
- Create: `frontend/src/tour/TourLayer.tsx`
- Modify: `frontend/src/App.tsx` (provider stack, ~:60-104)
- Test: `frontend/src/__tests__/tour/TourProvider.test.tsx`

**Interfaces (Produces):**

```ts
// TourContext.ts — null-object default: all methods no-op, active=false
export interface TourApi {
  active: boolean;
  start: (opts?: { replay?: boolean }) => void;
  skip: () => void;                          // = mark completed + dismiss
  notify: (e: TourEvent) => void;            // wizard/CSV integration entry point
}
export const TourContext: React.Context<TourApi>;
export function useTour(): TourApi;          // safe outside the provider (null-object)
```

- [ ] **Step 1: Failing test** — provider renders children with an empty registry; `useTour()`
  outside the provider returns the inert no-op api (a component calling `notify` doesn't throw).
- [ ] **Step 2: Implement `TourProvider`** — owns `useReducer(reduce, initialState)`;
  `useMediaQuery("(min-width: 1280px)")` → breakpoint (+ dispatch `BREAKPOINT_CHANGED` on flip);
  `observeOpenDialogs` → `DIALOG_OPENED/CLOSED`; per-step effect: apply `tab` precondition via
  `useSearchParams` → `waitForTarget(selector)` → `scrollTargetIntoView` → `trackRect` into
  local `targetRect` state (timeout → dispatch `TARGET_TIMEOUT`); `start()` builds
  `TourRunContext` and dispatches `START`; terminal states (`finished`/`skipped`) call the
  persistence callback (wired in Task 13; until then a prop-injected stub).
  `TourLayer` (portaled to `#modal-root`'s sibling or `document.body`): switch on current step
  `kind` — `dialog` → `ModalDialog` (welcome/completion, Task 12/16), `spotlight` →
  `SpotlightScrim` + `CoachMark`, `hint` → `CoachMark mode="hint"` alone; renders nothing while
  `paused-*`. Resolve `PerBp` fields against the live breakpoint.
- [ ] **Step 3: Mount** — in `App.tsx`, inside `DeleteModalProvider`, wrap `<Routes>`:
  `<TourProvider steps={TOUR_STEPS}>` (steps imported from `tour/steps.ts`; until Task 12 lands
  mount with `steps={[]}`). Router context is required (uses `useSearchParams`/`useNavigate`).
- [ ] **Step 4: Gates + commit** — `npm run lint && npm test && npm run build`;
  `feat(onboarding): TourProvider/TourLayer engine`.

**Phase B exit:** a dummy 2-step registry drives spotlight → hint → finished in a Vitest
integration test; zero visible product change.

---

## Phase C — Content: anchors, wizard choreography, sample CSV, registry

### Task 9: `anchors.ts` + `data-tour` attributes

**Files:**
- Create: `frontend/src/tour/anchors.ts`
- Modify (attribute-only edits — **no markup/behavior changes**):
  `frontend/src/dashboard/wallet/WalletsBar.tsx` (AddWalletTile — both render slots — and the
  wallet scroller), `frontend/src/dashboard/transaction/TransactionsTable.tsx` (list container +
  FAB), `frontend/src/dashboard/transaction/TransactionsFilter.tsx`,
  `frontend/src/dashboard/wallet/WalletTabs.tsx` (per-tab buttons),
  `frontend/src/header/AppHeader.tsx` (sync badge wrapper, bell wrapper, user-menu trigger),
  `frontend/src/components/ui/Wizard.tsx` (footer Continue),
  `frontend/src/modals/wallet/wizardSteps/BasicsStep.tsx` (name field region),
  `frontend/src/modals/wallet/wizardSteps/TagsStep.tsx` (mode selector),
  `frontend/src/components/ui/CsvUploadField.tsx` (dropzone — it already has
  `data-testid="csv-dropzone"`).

**Interfaces (Produces):**

```ts
// anchors.ts — single source of truth; components import these constants for their
// data-tour values, and the registry test asserts every step target is in this set.
export const TOUR_ANCHORS = {
  addWallet: "add-wallet",
  walletsBar: "wallets-bar",
  transactionsList: "transactions-list",
  addTransaction: "add-transaction",
  filters: "filters",
  tabCategory: "tab-category",
  tabSubscription: "tab-subscription",
  tabBudget: "tab-budget",       // budgeting branch must add the attribute when the tab ships
  tabSettings: "tab-settings",
  syncCenter: "sync-center",
  notifications: "notifications",
  userMenu: "user-menu",
  wizardNext: "wizard-next",
  wizardBasics: "wizard-basics",
  wizardTagModes: "wizard-tag-modes",
  csvDropzone: "csv-dropzone",
} as const;
export const tourSelector = (a: string) => `[data-tour="${a}"]`;
```

- [ ] **Step 1:** Create `anchors.ts`; add `data-tour={TOUR_ANCHORS.x}` to each listed element.
  `WalletTabs` uses the dynamic form `data-tour={"tab-" + tab.id}` (tab ids are the `VALID_TABS`
  values: `transactions`, `subscription`, `category`, `statistics`, `budget`, `settings`, `data`).
- [ ] **Step 2: Gates + commit** — `npm run lint && npm test && npm run build` (attributes are
  inert; existing tests must pass unchanged); `feat(onboarding): tour anchors`.
- [ ] **Step 3:** Add a one-line note to the budgeting plan (`.claude/TODO/` budgeting file if
  still active) : the Budget tab button must carry `data-tour="tab-budget"`.

### Task 10: Wizard choreography

**Files:**
- Modify: `frontend/src/components/ui/Wizard.tsx` (new optional prop)
- Modify: `frontend/src/modals/wallet/CreateWalletWizard.tsx` (tour notifications)
- Test: `frontend/src/__tests__/components/ui/Wizard.test.tsx` (extend/create)
- Test: extend `frontend/src/__tests__/tour/stepMachine.test.ts` with the full wizard scenario

**Interfaces:**
- Consumes: `useTour().notify` (Task 8), `TourEvent` (Task 6).
- Produces: `Wizard` prop `onStepChange?: (index: number, name: string) => void` — fired once on
  mount (step 0) and on every step transition. Backwards-compatible (optional).

Verified wizard step order (CreateWalletWizard.tsx:245-336): **Basics(0), Tags(1),
Subscriptions(2), Transactions(3), Invite(4)**.

- [ ] **Step 1: Failing test** — Wizard fires `onStepChange(0, "Basics")` on mount and
  `(1, "Tags")` after Continue.
- [ ] **Step 2: Implement** — add the prop to `Wizard.tsx` (call in the existing step-change
  paths: next/back/goToStep + mount effect). In `CreateWalletWizard`: `const tour = useTour();`
  then `tour.notify({type:"WIZARD_OPENED"})` in `openModal()`;
  `onStepChange={(i) => tour.notify({type:"WIZARD_STEP", index: i})}`;
  `tour.notify({type:"WALLET_CREATED", walletId: result.walletId})` right after
  `createdWalletId.current = result.walletId` in `onComplete`;
  `tour.notify({type:"WIZARD_CLOSED", created: !!createdWalletId.current})` in both the
  finish path and the discard path.
- [ ] **Step 3:** Machine scenario test: `WIZARD_OPENED` → hints advance on `WIZARD_STEP 1..4`
  → `WALLET_CREATED` → `WIZARD_CLOSED{created:true}` → next step is the dashboard act;
  and the discard variant regresses to the create-wallet spotlight.
- [ ] **Step 4: Gates + commit** — `feat(onboarding): wizard tour choreography`.

### Task 11: Sample CSV — generator + wizard affordance

**Files:**
- Create: `frontend/src/tour/sampleCsv.ts`
- Test: `frontend/src/__tests__/tour/sampleCsv.test.ts`
- Modify: `frontend/src/components/ui/CsvUploadField.tsx` (optional `sample` prop)
- Modify: `frontend/src/modals/wallet/wizardSteps/TransactionsStep.tsx` (pass-through)
- Modify: `frontend/src/modals/wallet/CreateWalletWizard.tsx` (supply the prop only when
  `useTour().active`)
- Test: extend `frontend/src/__tests__/components/ui/CsvUploadField.test.tsx`

**Interfaces (Produces):**

```ts
// sampleCsv.ts
export const SAMPLE_NOTE = "Sample data (guided tour)";  // ground truth for detection + wipe
export function generateSampleTransactionsCsv(today?: Date): string;
// ~40-60 rows over ~3 months relative to `today`: salary on the 27th (INCOME), rent on the 1st,
// weekly groceries, fuel, Netflix/Spotify. Header EXACTLY the contract in
// dashboard/settings/csvImport.ts: Date,Name,Tag,Amount,Type,Notes,OriginalAmount,OriginalCurrency,ExchangeValue
// Every Tag value ∈ recommendedTags.ts names; every Notes value === SAMPLE_NOTE.
export function downloadSampleCsv(): void; // Blob + anchor, financeapp-sample-transactions.csv
```

```ts
// CsvUploadField — new optional prop; renders two ghost Buttons under the dropzone when present
sample?: { label: string; getText: () => string; onUsed?: () => void };
// "Use sample data" pipes getText() through the SAME parseAndValidateCsv ingest path as a file,
// then fires onUsed. "Download sample" calls downloadSampleCsv().
```

- [ ] **Step 1: Failing tests** —
  `parseAndValidateCsv("transactions", generateSampleTransactionsCsv()).rowErrors.length === 0`;
  every parsed tag ∈ recommended names (import both modules and compare sets); every note ===
  `SAMPLE_NOTE`; all dates ≤ today and ≥ today−100d. CsvUploadField: sample button stages rows
  and fires `onUsed`; prop absent → no extra buttons.
- [ ] **Step 2: Implement** (generator is a plain string builder — keep deterministic given
  `today`; no `Math.random`). Wire `TransactionsStep` pass-through and the tour-gated prop in
  `CreateWalletWizard` with `onUsed: () => tour.notify({type:"SAMPLE_LOADED"})`.
- [ ] **Step 3: Gates + commit** — `feat(onboarding): sample CSV + wizard affordance`.

### Task 12: Step registry (content + copy)

**Files:**
- Create: `frontend/src/tour/steps.ts`
- Test: `frontend/src/__tests__/tour/steps.test.ts`
- Modify: `frontend/src/App.tsx` (mount real `TOUR_STEPS`)

**Interfaces:** Produces `export const TOUR_STEPS: TourStepDef[]`. Copy is final English
(adjust freely at review, structure is binding). Sequence:

| id | kind | target / tab | advance | notes |
|---|---|---|---|---|
| `welcome` | dialog | — | next ("Take the tour" / skip "Skip for now") | body mentions replay from Settings → Help & Onboarding |
| `create-wallet` | spotlight | `add-wallet` | event `wizard-opened` | `when: !ctx.hasWallets` |
| `wizard-basics` | hint | `wizard-basics` | wizard-step 1 | "Pick a name (3–25 chars), color and currency — the color becomes this wallet's accent." |
| `wizard-tags` | hint | `wizard-tag-modes` | wizard-step 2 | "Categories group your spending. Try the Recommended groups — our sample transactions use them." |
| `wizard-subscriptions` | hint | `wizard-next` | wizard-step 3 | "Subscriptions are recurring templates — the app turns them into real transactions on their due date. Skippable." |
| `wizard-transactions` | hint | `csv-dropzone` | wizard-step 4 | `extra:"sample-csv-actions"`; "Upload your bank's CSV export, or use our sample data to explore." |
| `wizard-invites` | hint | `wizard-next` | event `wallet-created` | "Optionally invite someone as Editor or Viewer — you can always do it later." |
| `wallets-bar` | spotlight | `wallets-bar` | next | per-bp copy (rail vs row) |
| `transactions-list` | spotlight | `transactions-list`, tab `transactions` | next | resumes after wizard via waitForTarget (awaits data load) |
| `add-transaction` | spotlight | `add-transaction` | next | FAB |
| `filters` | spotlight | `filters` | next | search / date range / category filters |
| `categories` | spotlight | `tab-category` (the tab button) | next | mentions tag tree + budgets teaser |
| `budget` | spotlight | `tab-budget`, `optional: true` | next | auto-skips until the Budget tab ships |
| `subscriptions` | spotlight | `tab-subscription`, tab `subscription` | next | |
| `offline-sync` | hint (no target → centered) | — | next | offline-first: queued changes replay on reconnect; Sync Center appears in the header when something is queued or conflicted (the badge is not rendered when idle — hence no anchor) |
| `notifications` | spotlight | `notifications` | next | bell + push opt-in pointer to Settings |
| `user-menu` | spotlight | `user-menu` | next | theme, settings, sign-out |
| `shared-wallets` | spotlight | `tab-settings` | next | roles OWNER/EDITOR/VIEWER, invites from wallet Settings tab |
| `completion` | dialog | — | next ("Finish") | `extra:"completion-cleanup"` — variants per `ctx.sampleUsed` (Task 16) |

- [ ] **Step 1: Registry validation test** — unique ids; every `spotlight` step's targets (all
  breakpoint variants) ∈ `TOUR_ANCHORS` values; every `tab` ∈ `VALID_TABS`; every
  `{on:"wizard-step"}` index ∈ [1..4] and strictly increasing across wizard steps; exactly one
  step advances on `wizard-opened` and one on `wallet-created`.
- [ ] **Step 2: Write the registry**, mount in `App.tsx`, gates, commit —
  `feat(onboarding): tour step registry`.

**Phase C exit (manual):** with a dev-only trigger (temporary `window.__startTour?.()` hook or
the Task 15 replay button if landing early), run the full flow on desktop and mobile viewports
against the dev stack: welcome → wizard with sample CSV → dashboard act → completion.

---

## Phase D — Triggers, persistence client, replay

### Task 13: `onboardingStatus.ts` + login/logout wiring

**Files:**
- Create: `frontend/src/tour/onboardingStatus.ts`
- Test: `frontend/src/__tests__/tour/onboardingStatus.test.ts`
- Modify: `frontend/src/auth/LoginForm.tsx` (~:81-87 — store the flag next to `mustChangePWD`)
- Modify: `frontend/src/header/AppHeader.tsx` (~:42-44 logout) and
  `frontend/src/api/axiosConfig.ts` (~:100-102 and ~:140-142 refresh-failure paths) — clear the
  cache key alongside the existing auth cleanup
- Modify: `frontend/src/tour/TourProvider.tsx` — terminal states call `setOnboardingCompleted()`

**Interfaces (Produces):**

```ts
export const ONBOARDING_LS_KEY = "onboardingCompleted";
export function cacheOnboardingCompleted(v: boolean): void;      // localStorage, try/catch
export function getOnboardingCompleted(): Promise<boolean>;
// localStorage hit → return it; miss → GET /users/me/onboarding, cache, return
export async function setOnboardingCompleted(): Promise<void>;
// PUT {completed:true}; cache only on success. Fail-fast offline (NO queueing — decided
// policy): a failure just means the tour re-offers next session.
export function clearOnboardingCache(): void;
```

- [ ] **Step 1: Failing tests** (mock the axios `api` instance per existing repo pattern):
  cache hit skips the GET; miss GETs+caches; PUT failure leaves no cache write; clear removes.
- [ ] **Step 2: Implement + wire** — LoginForm stores
  `cacheOnboardingCompleted(response.data.onboardingCompleted)`; all three logout/refresh-failure
  paths call `clearOnboardingCache()`.
- [ ] **Step 3: Gates + commit** — `feat(onboarding): onboarding status client`.

### Task 14: Auto-start trigger + existing-user invitation

**Files:**
- Create: `frontend/src/tour/decideTourStart.ts` (pure) + `frontend/src/tour/useTourTrigger.ts`
- Create: `frontend/src/tour/TourInvitationPrompt.tsx`
- Test: `frontend/src/__tests__/tour/decideTourStart.test.ts`,
  `frontend/src/__tests__/tour/TourInvitationPrompt.test.tsx`
- Modify: `frontend/src/dashboard/UserDashboard.tsx` (one hook call + prompt render)

**Interfaces (Produces):**

```ts
export interface TourStartInput {
  tourActive: boolean; online: boolean; mustChangePWD: boolean;
  completed: boolean | null;   // null = status not yet known (still fetching)
  walletsLoading: boolean; walletCount: number;
}
export function decideTourStart(i: TourStartInput): "auto" | "invite" | "none";
// none: active, offline, mustChangePWD, completed !== false, walletsLoading
// auto: walletCount === 0        invite: walletCount > 0
```

- [ ] **Step 1: Failing table test** — full permutation matrix of the rules above.
- [ ] **Step 2: Implement** — `useTourTrigger({wallets, loading})` (called once from
  `UserDashboard`): reads `useOnlineStatus()`, `localStorage.mustChangePWD`,
  `getOnboardingCompleted()`; fires **once per session** (a ref guard); `auto` → `tour.start()`,
  `invite` → render `TourInvitationPrompt`.
  `TourInvitationPrompt`: dismissible `Card` (not a dialog), `fixed z-[110]` bottom-right on
  desktop / bottom above the FAB zone on mobile, brand-gradient accent, copy:
  *"New here? Take a 2-minute tour of the app."* — actions **Take the tour** (`tour.start()`;
  creation act auto-skips via `when: !hasWallets`) and **No thanks** (X) →
  `setOnboardingCompleted()` (one-time by design; copy mentions Settings → Help & Onboarding
  for later).
- [ ] **Step 3: Gates + commit** — `feat(onboarding): tour trigger + invitation prompt`.

### Task 15: Settings replay — "Help & Onboarding"

**Files:**
- Modify: `frontend/src/settings/sections.ts` (new entry before `about`)
- Modify: `frontend/src/settings/SettingsPage.tsx` (render branch, ~:136-146)
- Create: `frontend/src/settings/sections/HelpSection.tsx`
- Test: `frontend/src/__tests__/settings/sections/HelpSection.test.tsx`

- [ ] **Step 1:** Registry entry (auto-appears in nav, scroll-spy and the AppHeader dropdown):

```ts
{
  id: "help",
  label: "Help & Onboarding",
  icon: faCircleQuestion,
  description: "Guided tour and sample data",
},
```

- [ ] **Step 2:** `HelpSection` — a `Card` with: **Replay the guided tour** `<Button>` →
  `navigate("/dashboard")` + `tour.start({ replay: true })` (SettingsPage is inside
  `TourProvider`; disabled with a hint when `!useOnlineStatus()`), and **Download sample CSV**
  ghost button → `downloadSampleCsv()`. Replay does **not** reset the server flag.
- [ ] **Step 3: Failing→passing render test, gates, commit** —
  `feat(onboarding): settings Help & Onboarding section`.

**Phase D exit (manual matrix):** fresh user (flag false, 0 wallets) auto-starts; existing user
(flag false, wallets) sees the prompt once, dismissal survives reload (server flag); replay from
Settings works; no tour when offline or during forced password change.

---

## Phase E — Completion, cleanup, polish

### Task 16: Completion dialog + sample wipe / wallet delete

**Files:**
- Create: `frontend/src/tour/completionActions.ts`
- Test: `frontend/src/__tests__/tour/completionActions.test.ts`
- Modify: `frontend/src/tour/TourLayer.tsx` (completion-dialog `extra` slot)

**Interfaces (Produces):**

```ts
export async function detectSampleData(walletId: string): Promise<boolean>;
// fallback detector: GET /transactions/{walletId} (endpoint verified), any notes === SAMPLE_NOTE
export async function wipeSampleTransactions(walletId: string):
  Promise<{ removed: number; failed: number }>;
// fetch → filter notes === SAMPLE_NOTE → chunked walletOps.deleteTransaction (chunks of 5 via
// Promise.allSettled, queue-aware) → invalidate wallet cache → triggerToast summary
```

- [ ] **Step 1: Failing tests** — marker filtering (non-sample rows untouched), chunking (11
  rows → 3 chunks), partial-failure aggregation (`removed`/`failed` counts), detector
  true/false.
- [ ] **Step 2: Completion dialog variants** (rendered by `TourLayer` via `ModalDialog`):
  - `sampleUsed === false` → recap + **Finish**.
  - `sampleUsed === true` (event OR `detectSampleData` fallback on the created wallet) → recap +
    **Keep sample data** / **Wipe sample data** (runs `wipeSampleTransactions`, copy states it
    removes only the imported sample transactions — staged tags/subscriptions are the user's
    choices and stay) / **Delete this wallet** — only when `ctx.createdWalletId` is set; reuse
    the existing owner flow: `useDeleteModal()` → `deleteObject(wallet, "wallet", cb, 2)`
    (friction level 2 = type name + hold, house delete rules), then `navigate("/dashboard")`.
  - Every path ends with `setOnboardingCompleted()`.
- [ ] **Step 3: Gates + commit** — `feat(onboarding): completion cleanup actions`.

### Task 17: A11y + reduced motion

**Files:** Modify `CoachMark.tsx`, `SpotlightScrim.tsx`, `TourLayer.tsx`; extend their tests.

- [ ] CoachMark: `role="dialog"`, `aria-modal="false"`, `aria-label={title}`; focus moves to the
  card on step change and returns to `document.body` on unmount; **Esc** anywhere in the tour →
  skip (single confirm-free semantic — the welcome/completion `ModalDialog` already closes on
  Esc; wire its `onCancel` to `skip`).
- [ ] `useReducedMotion()` (framer-motion) disables scrim/card transitions.
- [ ] Gates + commit — `feat(onboarding): tour a11y + reduced motion`.

### Task 18: Docs, roadmap card, final gates, wrap-up

**Files:**
- Modify: `frontend/src/components/ToDoPage/todoData.ts` (~:341-349)
- Modify: `CLAUDE.md` (frontend architecture section)

- [ ] **Step 1: Roadmap card** — flip the "Interactive Onboarding" card `status: "EVALUATION"` →
  `"FINISHED"` and rewrite the subtasks to match reality ("Step-by-step guided tour", "Guided
  first-wallet creation with sample CSV import" — the old "Seeded example wallet (reusing
  demo-mode logic)" is now wrong).
- [ ] **Step 2: `CLAUDE.md`** — one bullet in *Frontend architecture*:

```markdown
- **Interactive onboarding (`src/tour/`):** hand-rolled coach-mark tour (data-driven step
  registry in `tour/steps.ts`, anchors in `tour/anchors.ts` imported by components as
  `data-tour` attributes; `SpotlightScrim`/`CoachMark` primitives at z-[130]). Completion is
  the server-side `User.onboardingCompleted` flag (`GET/PUT /api/users/me/onboarding`,
  also in `AuthResponse`); invite registration no longer seeds a demo wallet. Replay from
  Settings → Help & Onboarding. Tour auto-start requires online; the completion PUT fails
  fast offline.
```

- [ ] **Step 3: Full gates**

```bash
cd backend && ./gradlew spotlessApply check
cd ../frontend && npx prettier --write src/ && npm run lint && npm test && npm run build
```

- [ ] **Step 4: Manual QA checklist** (dev stack, desktop + mobile viewport, light + dark):
  1. Register a fresh invite user → login → empty dashboard → tour auto-starts.
  2. Full happy path with "Use sample data": wizard hints track the real steps; charts look
     alive; completion offers keep/wipe/delete; **wipe** removes exactly the sample rows;
     **delete** runs the type-and-hold modal and lands on the empty dashboard.
  3. Repeat with a downloaded-then-uploaded sample file → completion still detects sample data.
  4. Repeat with own CSV / manual rows → completion is recap-only.
  5. Skip at: welcome, mid-wizard (wizard stays usable), mid-dashboard → flag persists across
     reload and devices.
  6. Existing user with wallets: invitation card once; dismiss → never again; replay from
     Settings works and skips the creation act.
  7. Discard the wizard mid-tour → back at the create-wallet spotlight.
  8. Open the delete modal / CSV format dialog mid-tour → tour pauses, resumes on close.
  9. Resize desktop↔mobile mid-tour → step re-anchors; desktop right-pane scrolling keeps the
     spotlight glued while scrolling.
  10. Offline: no auto-start; wizard creation fails fast with its own error; completion PUT
      failure re-offers the tour next session.
  11. Demo login (`VITE_DEMO_ENABLED`): no tour, no invitation prompt.
  12. `prefers-reduced-motion`: no scrim/card animation.
- [ ] **Step 5: Refresh the knowledge graph**

```bash
graphify update .
```

- [ ] **Step 6: Wrap up** — move this file to `.claude/TODO/DONE/interactive-onboarding.md`,
  commit, and hand back to the user for the manual merge (house rule: the user merges).

```bash
git mv .claude/TODO/interactive-onboarding.md .claude/TODO/DONE/interactive-onboarding.md
git commit -m "chore(onboarding): mark interactive-onboarding plan as done"
```

---

## Decisions (locked 2026-07-11 — do not re-litigate during implementation)

- **No seeded example wallet**; invite registration stops seeding (visitor demo mode unchanged).
- Learn-by-doing tour over the existing `CreateWalletWizard`; transactions via CSV (our sample
  or the user's own); tags/subscriptions via the existing wizard steps.
- End-of-tour cleanup prompt **only when sample data was used**; wipe = client-side chunked
  deletes of `Notes === "Sample data (guided tour)"` rows; delete = existing friction-2 flow.
  No new backend bulk endpoint, no cleanup job, never `User.demo`.
- Server-side `User.onboardingCompleted`; demo users created with `true`; existing users
  backfill `false` and get the one-time invitation card (dismiss = completed, permanent).
- Hand-rolled engine (react-joyride v3 / driver.js evaluated and rejected — style.md primitives
  + deep integration needs); welcome/completion on `ModalDialog`; **no new modal shell**; hint
  mode (never the scrim) while a shell is open.
- Registry-driven steps = the E2EE preparation (future wallet-encryption steps are new entries;
  no E2EE content now).
- Offline: auto-start requires online; completion PUT fails fast (no queueing) — tour re-offers.
- Target v3.6.0+.

## Explicitly out of scope (do not build)

- E2EE/encrypted-wallet tour content (registry extensibility only).
- Backend bulk-delete endpoints, cleanup cron jobs, or any use of `User.demo`.
- Changes to the DEMO_ENABLED visitor demo mode or `DemoService` seeding internals.
- MCP server changes; admin-dashboard tour; tour usage analytics/telemetry.
- Visual redesign of any existing component (anchor edits are attribute-only; behavior-invariant).
