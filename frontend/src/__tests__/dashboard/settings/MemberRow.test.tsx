import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { faPen } from "@fortawesome/free-solid-svg-icons";
import type { WalletMember } from "../../../utils/types";

// getUserAuth decodes the JWT from storage; mock it so we can drive the
// "is this row the current user?" branch deterministically.
const { authMock } = vi.hoisted(() => ({
  authMock: { current: null as null | { userId: string } },
}));

vi.mock("../../../utils/authHelper.ts", () => ({
  getUserAuth: () => authMock.current,
}));

import { MemberRow } from "../../../dashboard/settings/MemberRow";

const baseMember: WalletMember = {
  userId: "m1",
  username: "Bob Editor",
  email: "bob@example.com",
  role: "EDITOR",
  status: "ACCEPTED",
  invitedAt: "2026-01-01",
};

interface RowOverrides {
  member?: Partial<WalletMember>;
  canManage?: boolean;
  onRemove?: ReturnType<typeof vi.fn>;
  onChangeRole?: ReturnType<typeof vi.fn>;
}

const renderRow = (o: RowOverrides = {}) => {
  const onRemove = o.onRemove ?? vi.fn();
  const onChangeRole = o.onChangeRole ?? vi.fn();
  const member = { ...baseMember, ...o.member };
  render(
    <MemberRow
      member={member}
      icon={faPen}
      iconColor="#ffffff"
      canManage={o.canManage ?? false}
      onRemove={onRemove}
      onChangeRole={onChangeRole}
    />,
  );
  return { onRemove, onChangeRole, member };
};

describe("MemberRow", () => {
  beforeEach(() => {
    authMock.current = null;
  });

  it("RBAC: renders no management controls when canManage is false (VIEWER/EDITOR)", () => {
    renderRow({ canManage: false });

    // The member is still visible (read-only)...
    expect(screen.getByText("Bob Editor")).toBeInTheDocument();
    expect(screen.getByText("bob@example.com")).toBeInTheDocument();

    // ...but none of the owner-only controls are rendered.
    expect(screen.queryByTitle("Remove user")).not.toBeInTheDocument();
    expect(screen.queryByTitle("Save role")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /viewer/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /editor/i }),
    ).not.toBeInTheDocument();
  });

  it("RBAC: renders role selector, save and remove controls when canManage (OWNER)", () => {
    renderRow({ canManage: true });

    expect(screen.getByRole("button", { name: /viewer/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /editor/i })).toBeInTheDocument();
    expect(screen.getByTitle("Save role")).toBeInTheDocument();
    expect(screen.getByTitle("Remove user")).toBeInTheDocument();
  });

  it("remove button invokes onRemove with the member id and username", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    renderRow({ canManage: true, onRemove });

    await user.click(screen.getByTitle("Remove user"));

    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onRemove).toHaveBeenCalledWith("m1", "Bob Editor");
  });

  it("RBAC: never renders controls for an OWNER member, even when canManage", () => {
    renderRow({ canManage: true, member: { role: "OWNER" } });

    expect(screen.queryByTitle("Remove user")).not.toBeInTheDocument();
    expect(screen.queryByTitle("Save role")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /viewer/i }),
    ).not.toBeInTheDocument();
  });

  it("RBAC: never renders controls for the current user, even when canManage", () => {
    authMock.current = { userId: "m1" }; // this row IS the logged-in user
    renderRow({ canManage: true });

    expect(screen.queryByTitle("Remove user")).not.toBeInTheDocument();
    expect(screen.queryByTitle("Save role")).not.toBeInTheDocument();
  });

  it("PENDING member shows only a cancel-invite control (no role editor)", () => {
    renderRow({ canManage: true, member: { status: "PENDING" } });

    // Remove control is repurposed as "Cancel Invite" for pending rows.
    expect(screen.getByTitle("Cancel invite")).toBeInTheDocument();
    // No role selector / save because the invite is not yet ACCEPTED.
    expect(screen.queryByTitle("Save role")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /viewer/i }),
    ).not.toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Role-change flow. (A previously inverted `disabled` on the Save button —
  // `disabled={hasRoleChanged}` instead of `disabled={!hasRoleChanged}` — meant a
  // role change could never be saved; the source has been fixed.)
  // ---------------------------------------------------------------------------
  it("keeps Save disabled while no role change is pending", () => {
    renderRow({ canManage: true });
    expect(screen.getByTitle("Save role")).toBeDisabled();
  });

  it("enables Save after picking a different role and persists the new role", async () => {
    const user = userEvent.setup();
    const onChangeRole = vi.fn();
    renderRow({ canManage: true, onChangeRole });

    await user.click(screen.getByRole("button", { name: /viewer/i }));

    const save = screen.getByTitle("Save role");
    expect(save).toBeEnabled();
    await user.click(save);
    expect(onChangeRole).toHaveBeenCalledWith("m1", "VIEWER");
  });
});
