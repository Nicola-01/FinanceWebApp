# Settings tab — redesign plan

Scope: `frontend/src/dashboard/settings/*` + `frontend/src/components/settings/SettingsCard.tsx`.
Heavy redesign (not a token-only migration): every element gets rebuilt. Part of the
"de-vibecode" redesign (see [`ui-redesign.md`](./ui-redesign.md) §7 and
[`frontend/style.md`](../../frontend/style.md)). Method mirrors
[`statistics-redesign.md`](./statistics-redesign.md): one element at a time, graphic proposed
in chat + user OK before implementing, each increment ends green.

## Structure & RBAC (behaviour to preserve)

```
SettingsTab  (rendered by WalletDashboard when activeTab === "settings")
├─ General Settings   — name / icon / color   (hidden for VIEWER)
├─ Members & Sharing  — Invite (OWNER only) + Members list
├─ Data Management    — export CSV / import (placeholder)
└─ Danger Zone        — Delete Wallet (OWNER) / Quit Wallet (else)
```

| Section | VIEWER | EDITOR | OWNER |
|---|---|---|---|
| General (name/icon/color) | hidden | edit+save | edit+save |
| Members list | read-only | read-only | manage (role/remove/pending) |
| Invite People | — | — | ✅ |
| Data (export / import) | ✅ | ✅ | ✅ |
| Danger Zone | Quit | Quit | Delete |

Wiring to preserve: `handleUpdateWallet` (PUT `/wallets/:id`), `onWalletDelete`
(shared `DeleteModal` in `UserDashboard`), invitations API (POST/PUT/DELETE
`/invitations/:walletId[/:memberId]`), CSV export, import placeholder, toasts.

## Locked decisions (brainstorm 2026-07-03)

1. **Card backbone → extract a lean `Card` primitive** (`components/ui/Card.tsx`): glass
   surface + `--r-card` radius + neutral shadow, optional header slot (icon/title/subtitle),
   optional footer/action slot, `tone="danger"` variant. Rebuild every Settings section on
   it; the footer action becomes a real `<Button>` (kills the hand-rolled glow button). Pays
   down the `Card` TODO in `ui-redesign.md`.
2. **Order:** General → **Members & Sharing** → Data → Danger. (Only change vs. today:
   Members moves above Data.)
3. **Layout:** centered **`max-w-3xl`** single-column stack (no more edge-to-edge cards).
4. **Tokens:** migrate all `theme-*` → `app-*`. No colored glow / halos. Radii from `--r-*`.
5. **Primitives:** replace every hand-rolled `<button>`/`<input>` with `Button` / `Input` /
   `Selector` / `CustomSelect` / `SearchInput`. Accent inside the wallet = `wallet.color`.
6. **English only** — translate the Italian comments in ShareSettingsSection / InviteSection /
   MemberRow.
7. **Fix real bug** in `MemberRow` while rebuilding it: the Save-role button is
   `disabled={hasRoleChanged}` (inverted) → must be `!hasRoleChanged`.
8. **MUI license:** N/A here (Settings has no charts) — watermark hack untouched.

## Refinements (post-review)

- **Invite + Members merged** into one **"Members"** card. `InviteSection` is a **collapsed row
  shaped like a MemberRow**: one `bg-app-surface` bordered shell with a **borderless** username/
  email field (not the search-box `Input`) on the left, and a grouped `<div>` on the right with
  a small role `Selector` (`sm`, `h-8`) + an **icon-only** send button at the **same height**
  (`h-8 w-8`, à la MemberRow's action buttons). No labels/helper. Stacks below `sm`. → divider
  → members list.
- **Uniform CTA width** `w-full sm:w-48` on the card actions: Save / Send Invite / Delete·Quit.
  (DataTab's export buttons are `fullWidth` in their grid; member-row ✓/🗑 stay 32px icon
  buttons — not CTAs.)
- **Danger Zone matches the other cards**: title/subtitle left (no `headerCentered`), button
  bottom-right (default `footerAlign`), same width. Long blurb → `subtitle`.
- **General Settings spacing**: shortened the "Icon & Colour" label to "Icon" so its column
  hugs the picker well (killed the dead space between the well and the name field); tighter gap.
- **MemberRow delete icon** dimmed at rest (`opacity-40`) → full on row hover
  (`group-hover:opacity-100`); still visible on touch.

## TODO — CSV import (deferred, needs backend)

The client-side import was **removed/blocked**: it POST/PUT-ed **one request per row**, so a
400-row CSV meant 400+ requests — a self-inflicted DoS on the backend. Import buttons are now
disabled ("coming soon").

**Re-enable only with a bulk endpoint.** Design when picked up:
- New backend endpoints (e.g. `POST /api/wallets/:id/import/transactions` and
  `.../import/tags`) that accept the **whole array/CSV in one request** and do a **batched
  upsert** in a single transaction.
- Merge rules to implement server-side (were specced client-side):
  - **Tags:** same-name → **overwrite** (upsert by name); create parents before children.
  - **Transactions:** same **name + same day** → **overwrite**; a referenced tag that doesn't
    exist → **auto-create it as a main category** first.
- Response returns counts so the client can show the **recap `ConfirmModal`** *before* applying
  (parse/preview via a dry-run flag, or preview client-side then send one confirmed request):
  e.g. "400 transactions · 200 overwrite · 200 add · 10 new main tags · Proceed?".
- The CSV parser + classification + recap-modal UX were built and unit-verified (parser 7/7,
  classification 8/8) — recover from git history if useful.

## Resolved decisions

- **Member removal** → replaced `window.confirm` with `ConfirmModal` (simple, `tone="danger"`). ✅
- **"Quit Wallet" copy** → fixed (option b): role-branched in `UserDashboard.tsx`, non-owner
  gets a `ConfirmModal` quit flow. ✅
- **Accent CTA** → extended `Button` with an `accentColor` prop (solid fill, no glow); Save = green
  (user's call), Invite = `wallet.color`. ✅
- **Save-role bug** → fixed inverted `disabled` in `MemberRow`. ✅

## Status: ALL 7 increments done. Settings scope is 0 `theme-*`, no hand-rolled CTA/text
inputs (only tiny icon buttons + hidden file inputs remain, by design). `SettingsCard` deleted.
Full `npm run lint` + `tsc -b` + `vite build` green. Extra: Data Management export sorting +
real Transactions/Tags CSV import (parser + tag order unit-verified 7/7).

## Increments (one element at a time, user OK between each; each ends green)

- [x] **0 — `Card` primitive** (`components/ui/Card.tsx`) — DONE. Glass `bg-app-card/80`
  shell, `--r-card`, neutral shadow (no glow), icon-chip header, `description`/`footer` slots,
  `tone="danger"` (sober red border + `app-red/5` tint, halo removed). lint + tsc + build green.
- [x] **1 — SettingsTab shell** — DONE. Centered `max-w-3xl` column; order = General →
  Members → Data → Danger.
- [x] **2 — General Settings** — DONE. Rebuilt on `Card` (wallet.color icon chip), name →
  `Input`, icon/colour picker in a `bg-app-surface` well, labels restored, Save → `Button`
  with new **`accentColor`** prop (green, per user; solid fill, no glow), ripple. Danger Zone
  still on `SettingsCard` (element 6). lint + tsc + build green.
- [x] **3 — Invite People** (`InviteSection`) — DONE. On `Card`; `Input` (leading user icon) +
  role `Selector` migrated to `app-*` (neutral active, per user) + helper text; Send →
  `Button accentColor={wallet.color}`, ripple. 0 `theme-*`. lint + tsc + build green.
- [x] **4 — Wallet Members** — DONE. `Card` + grouped `MemberCategory`/`MemberRow`; rows →
  `bg-app-surface` (light-mode contrast), all `theme-*` → `app-*`, English comments. **Bug
  fixed** (`disabled={!hasRoleChanged}`). Remove is always-visible (touch) and routes through
  **`ConfirmModal`** (danger, pending/member copy) — `window.confirm` gone. `MemberCategory`
  left as-is (already clean). `dashboard/settings/` now 0 `theme-*`. lint + tsc + build green.
- [x] **5 — Data Management** (`DataTab`) — DONE (redesign + functional). On `Card`; wells →
  `bg-app-surface`; `text-app-sky` → `text-app-blue`. **Export:** transactions sorted
  chronologically; tags sorted alphabetical/parent-first (children grouped under parent).
  **Import (now real, was placeholder):** both **Transactions** and **Tags** CSV imports
  (`Button` + hidden file inputs), custom CSV parser, parents-before-children for tags
  (existing names skipped), `fetchData` refresh + summary toast, write-gated (no VIEWER).
  Pure logic (parser + tag sort) unit-verified 7/7. lint + tsc + build green.
  **Export stays; import is BLOCKED (see TODO below).** IMPORT panel now shows two **disabled**
  buttons ("coming soon"), aligned with the export row.
- [x] **6 — Danger Zone** — DONE. Both cards on `Card tone="danger"` + `Button variant="danger"`
  (ripple). **`SettingsCard.tsx` deleted** (empty `components/settings/` dir removed). **Quit
  copy fixed (option b):** `UserDashboard.onWalletDelete` now branches by role — OWNER → shared
  delete modal; non-owner → `ConfirmModal` ("Quit wallet" / "Remove your access…" / "You left
  the wallet" toast), same DELETE endpoint. Fixes both the Danger Zone and the ⋮ menu.
  lint + tsc + build green.

## Verify (after every increment)

```bash
cd frontend && npm run lint && npx tsc -b && npm run build
```

_Created 2026-07-03._
