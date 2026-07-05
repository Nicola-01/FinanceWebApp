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
    render(
      <InviteCard invite={invite} onAccept={vi.fn()} onReject={vi.fn()} />,
    );
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
