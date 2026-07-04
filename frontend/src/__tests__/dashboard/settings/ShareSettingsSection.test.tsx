import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Wallet, WalletMember } from "../../../utils/types";

// --- Mocks -----------------------------------------------------------------
const { walletRef } = vi.hoisted(() => ({
  walletRef: { current: {} as Wallet },
}));

vi.mock("../../../dashboard/wallet/WalletContext.tsx", () => ({
  useWalletContext: () => ({ wallet: walletRef.current }),
}));
vi.mock("../../../api/axiosConfig", () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));
vi.mock("../../../components/ui/ToastNotification.tsx", () => ({
  triggerToast: vi.fn(),
}));

import { ShareSettingsSection } from "../../../dashboard/settings/ShareSettingsSection";
import api from "../../../api/axiosConfig";
import { triggerToast } from "../../../components/ui/ToastNotification.tsx";

const apiGet = (api as unknown as { get: ReturnType<typeof vi.fn> }).get;
const apiPost = (api as unknown as { post: ReturnType<typeof vi.fn> }).post;
const apiPut = (api as unknown as { put: ReturnType<typeof vi.fn> }).put;
const apiDelete = (api as unknown as { delete: ReturnType<typeof vi.fn> })
  .delete;
const toast = triggerToast as unknown as ReturnType<typeof vi.fn>;

const baseWallet: Wallet = {
  id: "w1",
  name: "Shared Wallet",
  icon: "wallet",
  color: "#8b5cf6",
  currency: "EUR",
  createdAt: "2026-01-01",
  userRole: "OWNER",
};

const members: WalletMember[] = [
  {
    userId: "u-owner",
    username: "Olivia Owner",
    email: "olivia@example.com",
    role: "OWNER",
    status: "ACCEPTED",
    invitedAt: "2026-01-01",
  },
  {
    userId: "u-editor",
    username: "Ed Editor",
    email: "ed@example.com",
    role: "EDITOR",
    status: "ACCEPTED",
    invitedAt: "2026-01-01",
  },
  {
    userId: "u-viewer",
    username: "Vera Viewer",
    email: "vera@example.com",
    role: "VIEWER",
    status: "ACCEPTED",
    invitedAt: "2026-01-01",
  },
  {
    userId: "u-pending",
    username: "Pat Pending",
    email: "pat@example.com",
    role: "EDITOR",
    status: "PENDING",
    invitedAt: "2026-01-01",
  },
];

// ConfirmModal renders via createPortal into #modal-root.
let modalRoot: HTMLDivElement;

const renderAs = (role: Wallet["userRole"]) => {
  walletRef.current = { ...baseWallet, userRole: role };
  return render(<ShareSettingsSection />);
};

describe("ShareSettingsSection", () => {
  beforeEach(() => {
    modalRoot = document.createElement("div");
    modalRoot.id = "modal-root";
    document.body.appendChild(modalRoot);

    // jsdom doesn't implement the <dialog> API; stub showModal/close.
    HTMLDialogElement.prototype.showModal ??= function () {
      this.setAttribute("open", "");
    };
    HTMLDialogElement.prototype.close ??= function () {
      this.removeAttribute("open");
    };

    apiGet.mockReset().mockResolvedValue({ data: members });
    apiPost.mockReset().mockResolvedValue({});
    apiPut.mockReset().mockResolvedValue({});
    apiDelete.mockReset().mockResolvedValue({});
    toast.mockReset();
  });

  afterEach(() => {
    modalRoot.remove();
    vi.restoreAllMocks();
  });

  it("fetches the members of the current wallet on mount", async () => {
    renderAs("OWNER");
    await screen.findByText("Ed Editor");
    expect(apiGet).toHaveBeenCalledWith("/invitations/w1");
  });

  it("RBAC: OWNER sees the invite section, all categories and pending invites", async () => {
    renderAs("OWNER");
    await screen.findByText("Ed Editor");

    // Invite section (owner-only)
    expect(
      screen.getByRole("textbox", { name: /username or email/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /send invite/i }),
    ).toBeInTheDocument();

    // Pending invites category (owner-only)
    expect(screen.getByText("Pending Invites")).toBeInTheDocument();
    expect(screen.getByText("Pat Pending")).toBeInTheDocument();

    // Management controls exist for accepted, non-owner members.
    expect(screen.getAllByTitle("Remove user").length).toBeGreaterThan(0);
  });

  // Helper: the invite input is only rendered when isOwner is true.
  const inviteInput = () =>
    screen.queryByRole("textbox", { name: /username or email/i });

  it("RBAC: VIEWER cannot see invite, pending list, or any management control", async () => {
    renderAs("VIEWER");
    await screen.findByText("Ed Editor");

    // Read-only view still lists members...
    expect(screen.getByText("Olivia Owner")).toBeInTheDocument();
    expect(screen.getByText("Vera Viewer")).toBeInTheDocument();

    // ...but every owner-only affordance is gone.
    expect(inviteInput()).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /send invite/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Pending Invites")).not.toBeInTheDocument();
    expect(screen.queryByText("Pat Pending")).not.toBeInTheDocument();
    expect(screen.queryAllByTitle("Remove user")).toHaveLength(0);
    expect(screen.queryAllByTitle("Cancel invite")).toHaveLength(0);
    expect(screen.queryAllByTitle("Save role")).toHaveLength(0);
  });

  it("RBAC: EDITOR is denied invite, pending list, and management controls", async () => {
    renderAs("EDITOR");
    await screen.findByText("Ed Editor");

    expect(inviteInput()).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /send invite/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Pending Invites")).not.toBeInTheDocument();
    expect(screen.queryAllByTitle("Remove user")).toHaveLength(0);
    expect(screen.queryAllByTitle("Save role")).toHaveLength(0);
  });

  it("OWNER removes a member after confirming, calling the delete endpoint", async () => {
    const user = userEvent.setup();
    renderAs("OWNER");
    await screen.findByText("Ed Editor");

    // Click the first "Remove user" button — opens the ConfirmModal.
    await user.click(screen.getAllByTitle("Remove user")[0]);

    // The ConfirmModal shows a "Remove" confirm button.
    const confirmBtn = await screen.findByRole("button", { name: "Remove" });
    await user.click(confirmBtn);

    expect(apiDelete).toHaveBeenCalledWith("/invitations/w1/u-editor");
    await waitFor(() =>
      expect(screen.queryByText("Ed Editor")).not.toBeInTheDocument(),
    );
    expect(toast).toHaveBeenCalledWith("Ed Editor removed successfully.", true);
  });

  it("OWNER remove is aborted when the confirmation is declined", async () => {
    const user = userEvent.setup();
    renderAs("OWNER");
    await screen.findByText("Ed Editor");

    // Open the confirm modal.
    await user.click(screen.getAllByTitle("Remove user")[0]);

    // Click the "Cancel" button in the ConfirmModal.
    const cancelBtn = await screen.findByRole("button", { name: "Cancel" });
    await user.click(cancelBtn);

    expect(apiDelete).not.toHaveBeenCalled();
    expect(screen.getByText("Ed Editor")).toBeInTheDocument();
  });

  it("OWNER sends an invite with the trimmed identifier and selected role", async () => {
    const user = userEvent.setup();
    renderAs("OWNER");
    await screen.findByText("Ed Editor");

    await user.type(
      screen.getByRole("textbox", { name: /username or email/i }),
      "newuser@example.com",
    );
    await user.click(screen.getByRole("button", { name: /send invite/i }));

    await waitFor(() =>
      expect(apiPost).toHaveBeenCalledWith("/invitations/w1", {
        user: "newuser@example.com",
        role: "VIEWER",
      }),
    );
    expect(toast).toHaveBeenCalledWith(
      "Invitation sent to newuser@example.com!",
      true,
    );
    // The list is refreshed after a successful invite.
    await waitFor(() => expect(apiGet).toHaveBeenCalledTimes(2));
  });
});
