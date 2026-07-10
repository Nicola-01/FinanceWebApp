# Responsive Overlay Pattern — Implementation TODO

> **STATUS: IMPLEMENTED (first round) — 2026-07-03.** ResponsiveOverlay primitive built;
> Transaction (form + details) and Subscription (form + details) migrated; Category manager
> re-pointed. All 4 rollout steps green (lint / tsc / build / vitest). Not committed (user commits).
> Deferred set (Wallet/Tag/PAT/Profile/Change-pw/Share) still on `ModalDialog` by design.
>
> _Original design below (approved via brainstorming)._

## Why

The `CategoryManagerDrawer` (right-side slide-over) is currently the **only** element in the
app with drawer behaviour — and the only one using a declarative `open/onClose` API. Every
other surface (~15) is a **centered `ModalDialog`** (native `<dialog>`) opened imperatively
(`ref.openModal()`), and none of them go full-screen on mobile (they stay centered cards).
That one-off feels inconsistent. Instead of reverting the drawer, we promote it into a
**deliberate second archetype** with clear rules.

## Decisions (from brainstorming)

- **Two archetypes, clear taxonomy:**
  - **Overlay-surface** = big forms / editors / managers → **right drawer on desktop, full-screen
    overlay on mobile**.
  - **Dialog** = quick confirms / alerts / short info & secondary forms → stay centered `ModalDialog`.
- **Scope of first round (Q1 "solo form/editor grandi" + Q3 "tutta la superficie insieme"):**
  migrate the **whole Transaction and Subscription surfaces** — both create/edit **and** details —
  plus the already-done Category manager. Small/secondary forms (Wallet, Tag, PAT, Profile,
  Change-password, Share/invite) **stay `ModalDialog` for now**, revisit later.
- **Mobile = full-screen OVERLAY, not a route (Q2):** `fixed inset-0`, no URL change, but wire the
  **history** so Android back / swipe closes it. No routing refactor.
- **Approach A:** one responsive primitive; migrated modals **swap their internal shell**
  (`ModalDialog` → `ResponsiveOverlay`) while **call sites stay imperative** (`ref.openModal(tx)`
  unchanged). Lowest churn, keeps the drawer look.
- **Keep pie/Sankey and all non-migrated modals untouched.** English only. Reuse `app-*` tokens.

## S1 — The `ResponsiveOverlay` primitive (evolve `components/ui/Drawer.tsx`)

Rename `Drawer` → **`ResponsiveOverlay`** (behaviour now exceeds "drawer"); update the 2 refs
(`CategoryManagerDrawer.tsx` import + its test). Single **declarative** component:

```ts
interface ResponsiveOverlayProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  accentColor?: string;                 // per-wallet accent bar; fallback --color-app-green
  headerActions?: React.ReactNode;      // right-aligned header slot (edit/delete/stop…)
  width?: number;                        // desktop drawer width, default 440
  children: React.ReactNode;
}
```

- **Desktop (≥ `md` / 768px):** right slide-over, `w-[width]` (default 440), `max-w-[92vw]`, dark
  backdrop, slide `x: 100% → 0` (framer-motion). Close on Esc / backdrop / header ✕.
- **Mobile (< `md`):** `fixed inset-0` full-screen, **no backdrop**, header shows a **back-arrow/✕**;
  enters with a push (slide from right).
- **Breakpoint:** small `useMediaQuery("(min-width: 768px)")` hook in `utils/` (standalone,
  `matchMedia`-based — do NOT pull in MUI's). Drives both layout + animation variant.
- **Back-button/history:** on open `history.pushState({overlay:true}, "")`; a `popstate` listener
  calls `onClose`; programmatic close does `history.back()` only if we pushed (guard against double
  pop). Net: Indietro/gesture closes the overlay without leaving the page.
- **Body scroll-lock** while open (already implemented). `role="dialog"`, `aria-modal`, basic focus
  management (focus panel on open, restore trigger focus on close). Keep the accent bar.
- **`headerActions` slot** mirrors `ModalDialogRightAction` ergonomics (1 action = icon button;
  2+ = kebab menu) so the details surfaces can carry edit/delete/stop into the overlay header.

## S2 — Trigger model (keep call sites imperative)

Migrated modals keep their `forwardRef` + `useImperativeHandle({ openModal })` **public API** so
call sites (`TransactionsTable`, `SubscriptionTab`, `SubscriptionCalendar`, dashboards) **don't
change**. Internally swap the native-dialog plumbing for state:

```ts
const [open, setOpen] = useState(false);
useImperativeHandle(ref, () => ({ openModal: (entity?, date?) => { setEntity(entity); setOpen(true); } }));
// ...
<ResponsiveOverlay open={open} onClose={() => setOpen(false)} …>{form/view}</ResponsiveOverlay>
```

`CategoryManagerDrawer` already uses the declarative primitive directly — leave it declarative.

## S3 — Per-surface migration

- **`TransactionModal`** (create/edit): shell → `ResponsiveOverlay`; title "New transaction" /
  "Edit transaction"; accent = wallet colour; body = existing form component, unchanged.
- **`TransactionDetailsModal`**: shell → `ResponsiveOverlay`; `headerActions` = **edit** (opens the
  form surface) + **delete** (→ existing `DeleteModal`). Body = `TransactionView`, unchanged.
- **`SubscriptionModal`** (create/edit): same as transaction form.
- **`SubscriptionDetailsModal`**: same as transaction details **plus** the **stop** action in
  `headerActions`. Body = `SubscriptionView`, unchanged.
- **One overlay at a time:** opening Edit from a details surface closes details then opens the form
  (mirror current behaviour); on desktop avoid two stacked right-drawers.
- **Risk — TagPicker/TagSelector inside a 440px drawer:** the category dropdown in the tx/sub form
  is a relative-positioned panel; verify it fits/scrolls and layers correctly inside the narrower
  drawer (may need it to portal or cap its height). Check during Transaction migration.

## S4 — What stays `ModalDialog` (unchanged)

DeleteModal (global confirm), LogoutModal, AboutAppModal, InvitationsModal, CalendarDayDetail,
ProfileModal, ChangePasswordModal, PatModal, CreateWalletModal, CreateTagModal, ShareWalletModal.
Rationale: quick confirms / info / secondary or short forms read better as centered dialogs. They
can adopt `ResponsiveOverlay` later if we choose to widen scope. `ModalDialog` is **not** removed.

## S5 — Rollout order & testing

**Order (each step independently green: lint + `tsc -b` + build + vitest):**
1. Build `ResponsiveOverlay` (evolve `Drawer`) + `useMediaQuery` hook. Rename + fix the 2
   Category-manager references. Verify the Category manager still works unchanged.
2. Migrate **Transaction** form + details (internal shell swap, call sites untouched). Resolve the
   TagPicker-in-drawer risk here.
3. Migrate **Subscription** form + details (incl. stop action).
4. Full sweep: confirm no other modal regressed; confirm confirm/info dialogs still centered.

**Tests (Vitest + Testing Library, mock `matchMedia` for breakpoint):**
- `ResponsiveOverlay`: renders drawer at ≥768 vs full-screen `inset-0` at <768; open/close;
  Esc closes (desktop); backdrop click closes (desktop); `popstate` (back) triggers `onClose`;
  `headerActions` render; body scroll-lock toggles.
- Transaction/Subscription modals: `ref.openModal(entity)` still opens; form/view content renders;
  header edit/delete/stop actions present on details; VIEWER/permission gating unchanged.
- Keep existing modal tests green.

## Definition of done

Transaction + Subscription (form + details) and Category manager all use the same
`ResponsiveOverlay` (drawer on desktop, full-screen on mobile, back-closes); confirm/info dialogs
unchanged; call sites untouched; `app-*` tokens; English; lint + build + vitest green.

## Open / defer

- Rename `Drawer` → `ResponsiveOverlay` (chosen) vs keep `Drawer` name (less churn) — **rename**.
- Mobile enter animation: slide-from-right (chosen) vs bottom-sheet — revisit if it feels off.
- Whether to later fold Wallet/Tag/PAT/Profile/Change-pw/Share into the pattern — **deferred**.
