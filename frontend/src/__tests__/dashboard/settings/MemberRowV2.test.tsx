import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { faPen } from "@fortawesome/free-solid-svg-icons";
import type { WalletMember } from "../../../types/domain";
import { setUiVersion } from "../../../utils/uiVersion";

vi.mock("../../../utils/authHelper.ts", () => ({
  getUserAuth: () => null,
}));

import { MemberRow } from "../../../dashboard/settings/MemberRow";

const member: WalletMember = {
  userId: "m1",
  username: "Bob Editor",
  email: "bob@example.com",
  role: "EDITOR",
  status: "ACCEPTED",
  invitedAt: "2026-01-01",
};

const renderRow = (
  canManage: boolean,
  overrides: Partial<WalletMember> = {},
) => {
  const onRemove = vi.fn();
  const onChangeRole = vi.fn();
  render(
    <MemberRow
      member={{ ...member, ...overrides }}
      icon={faPen}
      iconColor="#ffffff"
      canManage={canManage}
      onRemove={onRemove}
      onChangeRole={onChangeRole}
    />,
  );
  return { onRemove, onChangeRole };
};

describe("MemberRow (v2)", () => {
  beforeEach(() => setUiVersion("v2"));
  afterEach(() => setUiVersion("v1"));

  it("shows an initial avatar and the role as a badge when read-only", () => {
    renderRow(false);
    expect(screen.getByText("B")).toBeInTheDocument();
    expect(screen.getByText("Editor")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Remove user" }),
    ).not.toBeInTheDocument();
  });

  it("owner can change the role (save stays disabled until it changes) and remove", () => {
    const { onRemove, onChangeRole } = renderRow(true);
    const save = screen.getByRole("button", { name: "Save role" });
    expect(save).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Remove user" }));
    expect(onRemove).toHaveBeenCalledWith("m1", "Bob Editor");
    expect(onChangeRole).not.toHaveBeenCalled();
  });

  it("owner row has no management controls", () => {
    renderRow(true, { role: "OWNER" });
    expect(screen.getByText("Owner")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Remove user" }),
    ).not.toBeInTheDocument();
  });
});
