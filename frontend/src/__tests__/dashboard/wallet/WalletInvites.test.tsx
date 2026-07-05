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
