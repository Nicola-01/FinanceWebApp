import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { InviteModal } from "../../../modals/wallet/InviteModal";
import type { Invitation } from "../../../types/domain";
import { setUiVersion } from "../../../utils/uiVersion";

const invite: Invitation = {
  walletOwner: "Alice",
  role: "EDITOR",
  status: "PENDING",
  invitedAt: "2026-07-05",
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

let root: HTMLDivElement;

beforeEach(() => {
  setUiVersion("v2");
  root = document.createElement("div");
  root.id = "modal-root";
  document.body.appendChild(root);
  // jsdom lacks the <dialog> imperative API; reflect it via the `open` attribute.
  HTMLDialogElement.prototype.showModal = vi.fn(function (
    this: HTMLDialogElement,
  ) {
    this.setAttribute("open", "");
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute("open");
  });
});

afterEach(() => {
  root.remove();
  setUiVersion("v1");
});

const renderModal = (
  overrides: Partial<{
    onAccept: (id: string) => Promise<void>;
    onReject: (id: string) => Promise<void>;
  }> = {},
) => {
  const onAccept = overrides.onAccept ?? vi.fn().mockResolvedValue(undefined);
  const onReject = overrides.onReject ?? vi.fn().mockResolvedValue(undefined);
  const onClose = vi.fn();
  render(
    <InviteModal
      invite={invite}
      onAccept={onAccept}
      onReject={onReject}
      onClose={onClose}
    />,
  );
  return { onAccept, onReject, onClose };
};

describe("InviteModal (v2)", () => {
  it("renders the wallet and its facts as form rows", () => {
    renderModal();
    expect(screen.getByText("Shared Budget")).toHaveClass("font-display");
    expect(screen.getByText("Details")).toHaveClass("text-app-muted");
    expect(screen.getByText("Invited by")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toHaveClass("text-app-text");
    expect(screen.getByText("Invited on")).toBeInTheDocument();
    expect(screen.getByText("Role")).toBeInTheDocument();
    expect(screen.getByText("Editor")).toBeInTheDocument();
    expect(screen.getByText("Currency")).toBeInTheDocument();
    expect(screen.getByText("EUR")).toBeInTheDocument();
    expect(screen.getByText("Access")).toBeInTheDocument();
    expect(screen.getByText("Access").nextElementSibling).toHaveTextContent(
      "You can view and edit this wallet",
    );
  });

  it("calls onAccept with the wallet id", async () => {
    const { onAccept, onReject } = renderModal();
    fireEvent.click(screen.getByRole("button", { name: "Accept" }));
    await waitFor(() => expect(onAccept).toHaveBeenCalledWith("w1"));
    expect(onReject).not.toHaveBeenCalled();
  });

  it("calls onReject with the wallet id", async () => {
    const { onAccept, onReject } = renderModal();
    fireEvent.click(screen.getByRole("button", { name: "Reject" }));
    await waitFor(() => expect(onReject).toHaveBeenCalledWith("w1"));
    expect(onAccept).not.toHaveBeenCalled();
  });
});
