# Invitations in the Wallet Sidebar — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move pending wallet invitations out of the retired AppHeader into the wallet sidebar, where each invite renders as a dashed wallet-style tile with Accept (direct) / Reject (single-click confirm).

**Architecture:** A `useInvitations` hook owns the invite data + accept/reject calls; presentational `InviteCard` renders one invite; `WalletInvites` exports the three placed pieces (mobile badge, mobile inline panel, desktop collapsible section). `WalletsBar` holds the shared state (the hook + mobile open flag + the DeleteModal-backed reject handler) and drops each piece into the right DOM position. Frontend-only — the backend endpoints already exist.

**Tech Stack:** React 19 + TypeScript, Tailwind CSS 4 (`app-*` tokens), FontAwesome, axios (`api`), dnd-kit (existing, untouched by invites), Vitest + Testing Library.

## Global Constraints

- **Frontend-only.** No backend changes; endpoints already exist on `MembersController` @ `/api/invitations`: `GET /` (list, all statuses), `POST /{walletId}/accept`, `POST /{walletId}/reject` — all keyed by **wallet id**.
- **English only** for all UI copy and comments.
- Reuse shared primitives (`Button`, `DeleteModal`, `ICONS`) — do not hand-roll `<button>`/`<input>`. Use `app-*` colour tokens.
- `Invitation` type (existing, `src/utils/types.ts`): `{ walletOwner: string; role: string; status: "PENDING" | "ACCEPTED" | "REJECTED" | "LEFT" | "REVOKED"; invitedAt: string; wallet: Wallet }`. `Wallet`: `{ id, name, icon, color, currency, createdAt, userRole }`.
- Toast: `triggerToast(message: string, success: boolean)`. Error text: `getApiErrorDetail(err, fallback)`.
- Reject reuses `DeleteModal` at **level 0** (single "Delete" click, no hold/typing) via `useDeleteModal()`. Accept has no modal.
- Count badge/section: **yellow when ≥ 1** pending invite, **grey at 0**; stays visible at 0.
- Tests live under `src/__tests__/` mirroring the source tree.

---

### Task 1: `useInvitations` hook

**Files:**
- Create: `src/dashboard/wallet/useInvitations.ts`
- Test: `src/__tests__/dashboard/wallet/useInvitations.test.tsx`

**Interfaces:**
- Consumes: `api` (`../../api/axiosConfig`), `triggerToast`, `getApiErrorDetail`, `Invitation` type.
- Produces: `useInvitations(onRefreshAll: () => void): { invites: Invitation[]; loading: boolean; accept: (walletId: string) => Promise<void>; reject: (walletId: string) => Promise<void> }`.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/dashboard/wallet/useInvitations.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";

vi.mock("../../../api/axiosConfig", () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));
vi.mock("../../../components/ui/ToastNotification.tsx", () => ({
  triggerToast: vi.fn(),
}));

import { useInvitations } from "../../../dashboard/wallet/useInvitations";
import api from "../../../api/axiosConfig";
import type { Invitation } from "../../../utils/types";

const apiGet = (api as unknown as { get: ReturnType<typeof vi.fn> }).get;
const apiPost = (api as unknown as { post: ReturnType<typeof vi.fn> }).post;

const makeInvite = (
  id: string,
  status: Invitation["status"] = "PENDING",
): Invitation => ({
  walletOwner: "Alice",
  role: "EDITOR",
  status,
  invitedAt: "2026-01-01",
  wallet: {
    id,
    name: "W " + id,
    icon: "wallet",
    color: "#8b5cf6",
    currency: "EUR",
    createdAt: "2026-01-01",
    userRole: "EDITOR",
  },
});

beforeEach(() => {
  apiGet.mockReset();
  apiPost.mockReset();
});

describe("useInvitations", () => {
  it("loads only PENDING invitations", async () => {
    apiGet.mockResolvedValue({
      data: [makeInvite("a"), makeInvite("b", "ACCEPTED")],
    });
    const { result } = renderHook(() => useInvitations(vi.fn()));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.invites.map((i) => i.wallet.id)).toEqual(["a"]);
  });

  it("accept posts, removes the invite and refreshes wallets", async () => {
    apiGet.mockResolvedValue({ data: [makeInvite("a")] });
    apiPost.mockResolvedValue({});
    const onRefreshAll = vi.fn();
    const { result } = renderHook(() => useInvitations(onRefreshAll));
    await waitFor(() => expect(result.current.invites).toHaveLength(1));
    await act(async () => {
      await result.current.accept("a");
    });
    expect(apiPost).toHaveBeenCalledWith("/invitations/a/accept");
    expect(result.current.invites).toHaveLength(0);
    expect(onRefreshAll).toHaveBeenCalledTimes(1);
  });

  it("reject posts and removes the invite without refreshing", async () => {
    apiGet.mockResolvedValue({ data: [makeInvite("a")] });
    apiPost.mockResolvedValue({});
    const onRefreshAll = vi.fn();
    const { result } = renderHook(() => useInvitations(onRefreshAll));
    await waitFor(() => expect(result.current.invites).toHaveLength(1));
    await act(async () => {
      await result.current.reject("a");
    });
    expect(apiPost).toHaveBeenCalledWith("/invitations/a/reject");
    expect(result.current.invites).toHaveLength(0);
    expect(onRefreshAll).not.toHaveBeenCalled();
  });

  it("keeps the invite when accept fails", async () => {
    apiGet.mockResolvedValue({ data: [makeInvite("a")] });
    apiPost.mockRejectedValue(new Error("boom"));
    const { result } = renderHook(() => useInvitations(vi.fn()));
    await waitFor(() => expect(result.current.invites).toHaveLength(1));
    await act(async () => {
      await result.current.accept("a");
    });
    expect(result.current.invites).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/dashboard/wallet/useInvitations.test.tsx`
Expected: FAIL — cannot resolve `../../../dashboard/wallet/useInvitations`.

- [ ] **Step 3: Write minimal implementation**

Create `src/dashboard/wallet/useInvitations.ts`:

```ts
import { useCallback, useEffect, useState } from "react";
import api from "../../api/axiosConfig";
import { triggerToast } from "../../components/ui/ToastNotification.tsx";
import { getApiErrorDetail } from "../../utils/apiError";
import type { Invitation } from "../../utils/types";

/**
 * Loads the current user's PENDING wallet invitations and exposes accept/reject.
 * `onRefreshAll` runs after a successful accept so the freshly-joined wallet
 * shows up in the wallet list.
 */
export function useInvitations(onRefreshAll: () => void) {
  const [invites, setInvites] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await api.get("/invitations");
        const pending = (res.data as Invitation[]).filter(
          (i) => i.status === "PENDING",
        );
        if (alive) setInvites(pending);
      } catch {
        if (alive) setInvites([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const accept = useCallback(
    async (walletId: string) => {
      try {
        await api.post(`/invitations/${walletId}/accept`);
        setInvites((prev) => prev.filter((i) => i.wallet.id !== walletId));
        triggerToast("Invitation accepted!", true);
        onRefreshAll();
      } catch (err: unknown) {
        triggerToast(
          getApiErrorDetail(err, "Could not accept invitation"),
          false,
        );
      }
    },
    [onRefreshAll],
  );

  const reject = useCallback(async (walletId: string) => {
    try {
      await api.post(`/invitations/${walletId}/reject`);
      setInvites((prev) => prev.filter((i) => i.wallet.id !== walletId));
      triggerToast("Invitation rejected", true);
    } catch (err: unknown) {
      triggerToast(getApiErrorDetail(err, "Could not reject invitation"), false);
    }
  }, []);

  return { invites, loading, accept, reject };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/dashboard/wallet/useInvitations.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/dashboard/wallet/useInvitations.ts src/__tests__/dashboard/wallet/useInvitations.test.tsx
git commit -m "feat(invites): add useInvitations hook (list/accept/reject)"
```

---

### Task 2: `InviteCard` presentational tile

**Files:**
- Create: `src/dashboard/wallet/InviteCard.tsx`
- Test: `src/__tests__/dashboard/wallet/InviteCard.test.tsx`

**Interfaces:**
- Consumes: `Invitation`, `ICONS`/`IconKey` (`../../utils/icons`), `Button` (`../../components/ui/Button`).
- Produces: `InviteCard: React.FC<{ invite: Invitation; onAccept: (walletId: string) => void; onReject: (invite: Invitation) => void }>`.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/dashboard/wallet/InviteCard.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InviteCard } from "../../../dashboard/wallet/InviteCard";
import type { Invitation } from "../../../utils/types";

const invite: Invitation = {
  walletOwner: "Alice",
  role: "EDITOR",
  status: "PENDING",
  invitedAt: "2026-01-01",
  wallet: {
    id: "w1",
    name: "Shared Budget",
    icon: "wallet",
    color: "#8b5cf6",
    currency: "EUR",
    createdAt: "2026-01-01",
    userRole: "EDITOR",
  },
};

describe("InviteCard", () => {
  it("shows wallet name, owner and role", () => {
    render(<InviteCard invite={invite} onAccept={vi.fn()} onReject={vi.fn()} />);
    expect(screen.getByText("Shared Budget")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("EDITOR")).toBeInTheDocument();
  });

  it("calls onAccept with the wallet id", async () => {
    const onAccept = vi.fn();
    render(
      <InviteCard invite={invite} onAccept={onAccept} onReject={vi.fn()} />,
    );
    await userEvent.click(screen.getByRole("button", { name: /accept/i }));
    expect(onAccept).toHaveBeenCalledWith("w1");
  });

  it("calls onReject with the invite", async () => {
    const onReject = vi.fn();
    render(
      <InviteCard invite={invite} onAccept={vi.fn()} onReject={onReject} />,
    );
    await userEvent.click(screen.getByRole("button", { name: /reject/i }));
    expect(onReject).toHaveBeenCalledWith(invite);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/dashboard/wallet/InviteCard.test.tsx`
Expected: FAIL — cannot resolve `../../../dashboard/wallet/InviteCard`.

- [ ] **Step 3: Write minimal implementation**

Create `src/dashboard/wallet/InviteCard.tsx`:

```tsx
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faXmark, faEnvelope } from "@fortawesome/free-solid-svg-icons";
import { type IconKey, ICONS } from "../../utils/icons";
import Button from "../../components/ui/Button";
import type { Invitation } from "../../utils/types";

interface InviteCardProps {
  invite: Invitation;
  onAccept: (walletId: string) => void;
  onReject: (invite: Invitation) => void;
}

/** Pending-invitation tile: reads like a wallet card but dashed, with role + actions. */
export const InviteCard: React.FC<InviteCardProps> = ({
  invite,
  onAccept,
  onReject,
}) => {
  const { wallet } = invite;
  return (
    <div
      className="flex w-[260px] shrink-0 flex-col gap-3 rounded-2xl border border-dashed p-4 xl:w-full"
      style={{
        borderColor: `${wallet.color}66`,
        backgroundColor: `${wallet.color}0d`,
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg"
          style={{ backgroundColor: `${wallet.color}26`, color: wallet.color }}
        >
          <FontAwesomeIcon icon={ICONS[wallet.icon as IconKey] || faEnvelope} />
        </div>
        <div className="min-w-0">
          <h4 className="truncate font-app-mono text-sm font-black tracking-tight text-app-text">
            {wallet.name}
          </h4>
          <p className="mt-0.5 text-[11px] text-app-muted">
            Invited by{" "}
            <span className="font-semibold text-app-text">
              {invite.walletOwner}
            </span>
            {" · "}
            <span className="rounded bg-app-surface px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-app-muted">
              {invite.role}
            </span>
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          fullWidth
          onClick={() => onReject(invite)}
        >
          <FontAwesomeIcon icon={faXmark} />
          Reject
        </Button>
        <Button
          accentColor={wallet.color}
          size="sm"
          fullWidth
          ripple
          onClick={() => onAccept(wallet.id)}
        >
          <FontAwesomeIcon icon={faCheck} />
          Accept
        </Button>
      </div>
    </div>
  );
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/dashboard/wallet/InviteCard.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/dashboard/wallet/InviteCard.tsx src/__tests__/dashboard/wallet/InviteCard.test.tsx
git commit -m "feat(invites): add InviteCard tile"
```

---

### Task 3: `WalletInvites` placed pieces (badge, mobile panel, desktop section)

**Files:**
- Create: `src/dashboard/wallet/WalletInvites.tsx`
- Test: `src/__tests__/dashboard/wallet/WalletInvites.test.tsx`

**Interfaces:**
- Consumes: `Invitation`, `InviteCard` (Task 2).
- Produces (all exported from `WalletInvites.tsx`):
  - `InvitesBadge: React.FC<{ count: number; open: boolean; onToggle: () => void }>`
  - `InvitesMobilePanel: React.FC<{ open: boolean; invites: Invitation[]; onAccept: (walletId: string) => void; onReject: (invite: Invitation) => void }>`
  - `InvitesDesktopSection: React.FC<{ invites: Invitation[]; onAccept: (walletId: string) => void; onReject: (invite: Invitation) => void }>`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/dashboard/wallet/WalletInvites.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  InvitesBadge,
  InvitesDesktopSection,
} from "../../../dashboard/wallet/WalletInvites";
import type { Invitation } from "../../../utils/types";

const makeInvite = (id: string): Invitation => ({
  walletOwner: "Alice",
  role: "EDITOR",
  status: "PENDING",
  invitedAt: "2026-01-01",
  wallet: {
    id,
    name: "W" + id,
    icon: "wallet",
    color: "#8b5cf6",
    currency: "EUR",
    createdAt: "2026-01-01",
    userRole: "EDITOR",
  },
});

describe("InvitesBadge", () => {
  it("is grey at zero and yellow at >=1", () => {
    const { rerender } = render(
      <InvitesBadge count={0} open={false} onToggle={vi.fn()} />,
    );
    expect(screen.getByRole("button").className).toContain("text-app-muted");
    rerender(<InvitesBadge count={2} open={false} onToggle={vi.fn()} />);
    expect(screen.getByRole("button").className).toContain("text-app-yellow");
  });

  it("fires onToggle on click", async () => {
    const onToggle = vi.fn();
    render(<InvitesBadge count={1} open={false} onToggle={onToggle} />);
    await userEvent.click(screen.getByRole("button"));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});

describe("InvitesDesktopSection", () => {
  it("reveals invite cards only after expanding", async () => {
    render(
      <InvitesDesktopSection
        invites={[makeInvite("a")]}
        onAccept={vi.fn()}
        onReject={vi.fn()}
      />,
    );
    expect(screen.queryByText("Wa")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /invitations/i }));
    expect(screen.getByText("Wa")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/dashboard/wallet/WalletInvites.test.tsx`
Expected: FAIL — cannot resolve `../../../dashboard/wallet/WalletInvites`.

- [ ] **Step 3: Write minimal implementation**

Create `src/dashboard/wallet/WalletInvites.tsx`:

```tsx
import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faChevronDown } from "@fortawesome/free-solid-svg-icons";
import type { Invitation } from "../../utils/types";
import { InviteCard } from "./InviteCard";

interface ListProps {
  invites: Invitation[];
  onAccept: (walletId: string) => void;
  onReject: (invite: Invitation) => void;
}

const InvitesList: React.FC<ListProps> = ({ invites, onAccept, onReject }) =>
  invites.length > 0 ? (
    <>
      {invites.map((inv) => (
        <InviteCard
          key={inv.wallet.id}
          invite={inv}
          onAccept={onAccept}
          onReject={onReject}
        />
      ))}
    </>
  ) : (
    <p className="py-4 text-center text-sm italic text-app-muted">
      No pending invitations.
    </p>
  );

/** Count pill — yellow when there's at least one pending invite, grey at zero. */
const CountPill: React.FC<{ count: number }> = ({ count }) => (
  <span
    className={`rounded-full px-2 py-0.5 font-app-mono text-[11px] font-bold tabular-nums ${
      count >= 1
        ? "bg-app-yellow/15 text-app-yellow"
        : "bg-app-input text-app-muted"
    }`}
  >
    {count}
  </span>
);

// ── Mobile: square badge (first item in the horizontal scroller) ──────────────
export const InvitesBadge: React.FC<{
  count: number;
  open: boolean;
  onToggle: () => void;
}> = ({ count, open, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    aria-expanded={open}
    aria-label={`Invitations (${count})`}
    className={`flex h-[68px] w-[68px] shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border transition-colors xl:hidden ${
      count >= 1
        ? "border-app-yellow/40 bg-app-yellow/10 text-app-yellow"
        : "border-app-border bg-app-input/60 text-app-muted"
    }`}
  >
    <FontAwesomeIcon icon={faEnvelope} />
    <span className="font-app-mono text-sm font-black tabular-nums">{count}</span>
  </button>
);

// ── Mobile: inline panel rendered below the scroller ──────────────────────────
export const InvitesMobilePanel: React.FC<ListProps & { open: boolean }> = ({
  open,
  invites,
  onAccept,
  onReject,
}) => {
  if (!open) return null;
  return (
    <div className="flex flex-col gap-3 px-4 pb-4 xl:hidden">
      <InvitesList invites={invites} onAccept={onAccept} onReject={onReject} />
    </div>
  );
};

// ── Desktop: collapsible section above "Add New Wallet" ───────────────────────
export const InvitesDesktopSection: React.FC<ListProps> = ({
  invites,
  onAccept,
  onReject,
}) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="hidden xl:block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 rounded-xl px-1 py-2 text-left"
      >
        <FontAwesomeIcon icon={faEnvelope} className="text-app-muted" />
        <span className="text-xs font-bold uppercase tracking-[0.18em] text-app-muted">
          Invitations
        </span>
        <CountPill count={invites.length} />
        <FontAwesomeIcon
          icon={faChevronDown}
          className={`ml-auto text-[10px] text-app-muted transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <div className="mt-2 flex flex-col gap-3">
          <InvitesList invites={invites} onAccept={onAccept} onReject={onReject} />
        </div>
      )}
    </div>
  );
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/dashboard/wallet/WalletInvites.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/dashboard/wallet/WalletInvites.tsx src/__tests__/dashboard/wallet/WalletInvites.test.tsx
git commit -m "feat(invites): add WalletInvites badge/panel/section pieces"
```

---

### Task 4: Wire into `WalletsBar` + retire the old `InvitationsModal`

**Files:**
- Modify: `src/dashboard/wallet/WalletsBar.tsx`
- Delete: `src/modals/invitations/InvitationsModal.tsx`
- Delete: `src/__tests__/modals/invitations/InvitationsModal.test.tsx`

**Interfaces:**
- Consumes: `useInvitations` (Task 1), `InvitesBadge`/`InvitesMobilePanel`/`InvitesDesktopSection` (Task 3), `useDeleteModal` (`../../modals/common/DeleteModalContext`), `Invitation` type.
- Produces: no new exports; `WalletsBar`'s props are unchanged.

- [ ] **Step 1: Confirm the old modal has no live imports**

Run: `grep -rn "InvitationsModal" src --include=*.tsx --include=*.ts | grep -v "__tests__" | grep -v "modals/invitations/InvitationsModal.tsx"`
Expected: no output (safe to delete).

- [ ] **Step 2: Add imports to `WalletsBar.tsx`**

At the top of `src/dashboard/wallet/WalletsBar.tsx`, add alongside the existing imports:

```tsx
import type { Invitation } from "../../utils/types.ts";
import { useDeleteModal } from "../../modals/common/DeleteModalContext";
import { useInvitations } from "./useInvitations";
import {
  InvitesBadge,
  InvitesMobilePanel,
  InvitesDesktopSection,
} from "./WalletInvites";
```

(Note: `Wallet` is already imported from `../../utils/types.ts` — extend that line or add this `Invitation` import next to it.)

- [ ] **Step 3: Add state + handlers inside the component**

In `WalletsBar`, just after `const [activeId, setActiveId] = useState<string | null>(null);`, add:

```tsx
  const deleteModalRef = useDeleteModal();
  const { invites, accept, reject } = useInvitations(onRefreshAll);
  const [invitesOpen, setInvitesOpen] = useState(false);

  // Reject reuses the shared DeleteModal at level 0 (single-click confirm).
  const handleReject = (invite: Invitation) => {
    deleteModalRef.current?.deleteObject(
      invite.wallet,
      "invitation",
      () => reject(invite.wallet.id),
      0,
    );
  };
```

- [ ] **Step 4: Place the mobile badge as the first scroller child**

In the scroller `<div>` (the one with `flex flex-row … xl:flex-col`), immediately inside it and **before** the `loading` ternary, add:

```tsx
          <InvitesBadge
            count={invites.length}
            open={invitesOpen}
            onToggle={() => setInvitesOpen((o) => !o)}
          />
```

- [ ] **Step 5: Place the desktop section before "Add New Wallet"**

Still inside the scroller `<div>`, immediately **before** the `{!loading && (` block that renders the "Add New Wallet" button, add:

```tsx
          <InvitesDesktopSection
            invites={invites}
            onAccept={accept}
            onReject={handleReject}
          />
```

- [ ] **Step 6: Place the mobile inline panel below the scroller**

Immediately **after** the scroller `<div>` closes (still inside `<aside>`), add:

```tsx
        <InvitesMobilePanel
          open={invitesOpen}
          invites={invites}
          onAccept={accept}
          onReject={handleReject}
        />
```

- [ ] **Step 7: Delete the retired modal and its test**

```bash
git rm src/modals/invitations/InvitationsModal.tsx src/__tests__/modals/invitations/InvitationsModal.test.tsx
```

- [ ] **Step 8: Type-check, lint, and run the invites tests**

Run: `npx tsc -b`
Expected: no errors from `dashboard/wallet/*` or `WalletsBar.tsx`. (Unrelated pre-existing WIP errors in other files, if any, are out of scope.)

Run: `npx eslint src/dashboard/wallet/WalletsBar.tsx src/dashboard/wallet/WalletInvites.tsx src/dashboard/wallet/InviteCard.tsx src/dashboard/wallet/useInvitations.ts`
Expected: clean.

Run: `npx vitest run src/__tests__/dashboard/wallet`
Expected: PASS (all invite tests).

- [ ] **Step 9: Commit**

```bash
git add src/dashboard/wallet/WalletsBar.tsx
git commit -m "feat(invites): wire invitations into WalletsBar; retire InvitationsModal"
```

---

## Self-Review

**Spec coverage:**
- Desktop layout (invites section above Add New Wallet, expandable, count badge) → Task 3 `InvitesDesktopSection` + Task 4 Step 5. ✅
- Mobile layout (badge first, inline panel below on click) → Task 3 `InvitesBadge`/`InvitesMobilePanel` + Task 4 Steps 4 & 6. ✅
- Dashed invited-wallet tile with role + accept/reject → Task 2 `InviteCard`. ✅
- Accept direct; reject = DeleteModal lv0 → Task 1 `accept`/`reject` + Task 4 `handleReject`. ✅
- Badge yellow ≥1 / grey 0, visible at 0 → Task 3 `CountPill`/`InvitesBadge`. ✅
- Retire old InvitationsModal → Task 4 Steps 1 & 7. ✅
- Data via `GET /invitations`, refresh on accept → Task 1. ✅

**Placeholder scan:** none — every step carries real code/commands.

**Type consistency:** `onAccept: (walletId: string) => void` and `onReject: (invite: Invitation) => void` are used identically across `InviteCard`, `WalletInvites`, and `WalletsBar`. Hook returns `accept`/`reject: (walletId: string) => Promise<void>`; `WalletsBar` passes `accept` directly as `onAccept` and wraps `reject` in `handleReject(invite)`. Consistent.

## Execution Handoff

Two execution options:
1. **Subagent-Driven (recommended)** — a fresh subagent per task with review between tasks.
2. **Inline Execution** — execute the tasks in this session with checkpoints.
