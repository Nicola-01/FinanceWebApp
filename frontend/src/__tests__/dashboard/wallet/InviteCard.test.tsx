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
    render(<InviteCard invite={invite} onOpen={vi.fn()} />);
    expect(screen.getByText("Shared Budget")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("EDITOR")).toBeInTheDocument();
  });

  it("calls onOpen with the invite when the card is clicked", async () => {
    const onOpen = vi.fn();
    render(<InviteCard invite={invite} onOpen={onOpen} />);
    await userEvent.click(
      screen.getByRole("button", { name: /respond to invitation/i }),
    );
    expect(onOpen).toHaveBeenCalledWith(invite);
  });
});
