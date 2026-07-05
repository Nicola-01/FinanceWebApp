# Invitations in the Wallet Sidebar — Design

- **Date:** 2026-07-05
- **Branch:** `feature/currency-selector-redesign`
- **Scope:** Frontend-only. Relocate the pending-invitations experience out of the (already retired) `AppHeader` dropdown into the wallet sidebar (`WalletsBar`).

## Summary

Users can see the wallets they've been invited to directly in the wallets area and
Accept (direct) or Reject (single-click confirm) each one. Pending invites render as
wallet-card-like tiles with a dashed border, the role they were granted, and
Accept/Reject actions. The backend endpoints already exist, so this is purely a
frontend build.

## Goals

- Surface **pending** wallet invitations inside the wallets area, adapting to the
  sidebar's orientation (vertical on desktop, horizontal on mobile).
- Accept / Reject inline.
- No changes to `WalletsBar`'s public props or to `UserDashboard`. No backend changes.

## Non-goals (YAGNI)

- Invitation **history** (accepted/rejected/left/revoked). The old
  `modals/invitations/InvitationsModal.tsx` (with its History tab) is **retired**.
- Sending invitations — that already lives in the wallet Share settings and is unchanged.

## Backend contract (already implemented — `MembersController` @ `/api/invitations`)

- `GET /api/invitations` → `List<WalletInviteResponse>` for the current user. The FE
  keeps only `status === "PENDING"`.
- `POST /api/invitations/{walletId}/accept` → 200, no body.
- `POST /api/invitations/{walletId}/reject` → 200, no body.
- Actions are keyed by **wallet id**. FE `Invitation` type:
  `{ walletOwner: string; role: string; status: "PENDING" | "ACCEPTED" | "REJECTED" | "LEFT" | "REVOKED"; invitedAt: string; wallet: Wallet }`.

## Components (all new files under `src/dashboard/wallet/`)

1. **`useInvitations.ts`** — data hook. Takes `onRefreshAll: () => void`.
   - On mount: `GET /invitations`, keep `PENDING`. State: `invites`, `loading`.
   - `accept(walletId)`: `POST .../accept` → remove the invite from local state **and**
     call `onRefreshAll()` (so the newly-joined wallet shows up in the list) → success
     toast. On error: error toast, keep the invite.
   - `reject(walletId)`: `POST .../reject` → remove the invite → toast. On error: keep + toast.

2. **`InviteCard.tsx`** — presentational tile for one pending invite. Reuses the visual
   language of `WalletCardUI`: **dashed border** in `wallet.color`, wallet icon (`ICONS`),
   name, an "Invited by *{walletOwner}* · **{ROLE}**" line (role as an uppercase pill),
   and two buttons — **Accept** (direct) and **Reject**. Not draggable, not selectable.

3. **`WalletInvites.tsx`** — exposes the placed subcomponents consumed by `WalletsBar`:
   - `InvitesBadge` — compact square count badge (mobile). Rendered as the **first child**
     of the horizontal scroller. Yellow when `count >= 1`, grey when `0`. `xl:hidden`.
   - `InvitesMobilePanel` — full-width list of `InviteCard`, rendered **below** the
     scroller, toggled by the badge. `xl:hidden`.
   - `InvitesDesktopSection` — collapsible section (`hidden xl:flex`): a clickable header
     (envelope icon + "Invitations" + count badge + chevron) that expands/collapses the
     list of `InviteCard`. Placed **above** the "Add New Wallet" button. Default collapsed.

   Because the mobile badge and its panel sit at different DOM positions, `WalletsBar`
   owns the shared state: it calls `useInvitations(onRefreshAll)` and holds the mobile
   `open` boolean, passing `invites` + `accept`/`reject` + open-state down to the placed
   subcomponents. `WalletsBar`'s external props are unchanged.

## Reject via DeleteModal level 0

Reject reuses the shared `DeleteModal` at **level 0** (single "Delete" click — no
press-and-hold, no typing) via `useDeleteModal()`:
`deleteModalRef.current?.deleteObject(inv.wallet, "invitation", () => reject(inv.wallet.id), 0)`.
The modal reads `inv.wallet.name` and shows "Delete invitation". Cancel → no API call.
Accept has no modal.

## Responsive layout

- **Desktop (≥ `xl`), vertical column:**
  `[Wallets header] → [wallet list] → [Invitations section (collapsible)] → [Add New Wallet]`.
- **Mobile (< `xl`), horizontal scroller:**
  `[Invites badge] [wallet cards…] [Add New Wallet]`; clicking the badge expands an
  inline full-width panel **below** the scroller.

## Count badge & empty state

- Colour threshold: **yellow when ≥ 1 pending invite, grey when 0** — consistent on
  desktop and mobile.
- The badge/section stays **visible at 0** (grey "0"). *(Trivially switchable to
  hide-entirely-at-0 if preferred.)*

## Files

- **New:** `dashboard/wallet/useInvitations.ts`, `dashboard/wallet/InviteCard.tsx`,
  `dashboard/wallet/WalletInvites.tsx`.
- **Modified:** `dashboard/wallet/WalletsBar.tsx` (mount the invites pieces; pass
  `onRefreshAll` into `useInvitations`).
- **Retired:** `modals/invitations/InvitationsModal.tsx` and
  `__tests__/modals/invitations/InvitationsModal.test.tsx` — only after confirming there
  are no remaining live imports (the header refactor already unmounted it).

## Testing (Vitest + Testing Library, under `src/__tests__/` mirroring the tree)

- `useInvitations`: GET filters to PENDING; `accept` hits the endpoint, removes the
  invite and calls `onRefreshAll`; `reject` removes the invite; errors keep the invite +
  toast.
- `InviteCard`: renders name/role/owner; Accept calls `onAccept`; Reject opens the
  DeleteModal with level 0.
- Badge: colour flips at the 0 → 1 boundary; mobile toggle reveals the panel.

## Edge cases

- GET error/offline → empty invites, no crash.
- Accept → wallet arrives via `onRefreshAll`; the invite is removed so there's no
  duplicate tile.
- Reject modal cancelled → no network call, invite stays.
