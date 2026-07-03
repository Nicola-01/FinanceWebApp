import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useEffect, useRef } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Invitation } from "../../../utils/types";

vi.mock("../../../api/axiosConfig", () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));
vi.mock("../../../components/ui/ToastNotification.tsx", () => ({
  triggerToast: vi.fn(),
}));

import { InvitationsModal } from "../../../modals/invitations/InvitationsModal";
import type { InvitationsModalHandle } from "../../../modals/invitations/InvitationsModal";
import api from "../../../api/axiosConfig";
import { triggerToast } from "../../../components/ui/ToastNotification.tsx";

const apiPost = (api as unknown as { post: ReturnType<typeof vi.fn> }).post;
const toast = triggerToast as unknown as ReturnType<typeof vi.fn>;

HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
  this.open = true;
};
HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
  this.open = false;
};

const pendingInvite: Invitation = {
  walletOwner: "Alice",
  role: "EDITOR",
  status: "PENDING",
  invitedAt: "2026-01-01",
  wallet: {
    id: "wp1",
    name: "Shared Budget",
    icon: "wallet",
    color: "#8b5cf6",
    currency: "EUR",
    createdAt: "2026-01-01",
    userRole: "EDITOR",
  },
};

const acceptedInvite: Invitation = {
  walletOwner: "Bob",
  role: "VIEWER",
  status: "ACCEPTED",
  invitedAt: "2026-01-02",
  wallet: {
    id: "wh1",
    name: "Old Wallet",
    icon: "car",
    color: "#22c55e",
    currency: "EUR",
    createdAt: "2026-01-01",
    userRole: "VIEWER",
  },
};

function Harness({ invites }: { invites: Invitation[] }) {
  const ref = useRef<InvitationsModalHandle>(null);
  useEffect(() => {
    ref.current?.openModal(invites);
  }, [invites]);
  return <InvitationsModal ref={ref} />;
}

describe("InvitationsModal", () => {
  beforeEach(() => {
    const root = document.createElement("div");
    root.setAttribute("id", "modal-root");
    document.body.appendChild(root);
    apiPost.mockReset();
    toast.mockReset();
  });

  afterEach(() => {
    document.getElementById("modal-root")?.remove();
    vi.restoreAllMocks();
  });

  it("renders an empty state when there are no pending invitations", async () => {
    render(<Harness invites={[]} />);
    expect(
      await screen.findByText("No pending invitations."),
    ).toBeInTheDocument();
  });

  it("lists pending invitations with wallet name, owner and role", async () => {
    render(<Harness invites={[pendingInvite]} />);

    expect(await screen.findByText("Shared Budget")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("EDITOR")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /accept/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reject/i })).toBeInTheDocument();
  });

  it("accepting an invitation posts to the accept endpoint", async () => {
    const user = userEvent.setup();
    apiPost.mockResolvedValue({});
    render(<Harness invites={[pendingInvite]} />);

    await user.click(await screen.findByRole("button", { name: /accept/i }));

    await waitFor(() =>
      expect(apiPost).toHaveBeenCalledWith("/invitations/wp1/accept"),
    );
    expect(toast).toHaveBeenCalledWith("Invitation accepted!", true);
  });

  it("rejecting an invitation posts to the reject endpoint", async () => {
    const user = userEvent.setup();
    apiPost.mockResolvedValue({});
    render(<Harness invites={[pendingInvite]} />);

    await user.click(await screen.findByRole("button", { name: /reject/i }));

    await waitFor(() =>
      expect(apiPost).toHaveBeenCalledWith("/invitations/wp1/reject"),
    );
    expect(toast).toHaveBeenCalledWith("Invitation rejected!", true);
  });

  it("surfaces an error toast when processing fails", async () => {
    const user = userEvent.setup();
    apiPost.mockRejectedValue(new Error("boom"));
    render(<Harness invites={[pendingInvite]} />);

    await user.click(await screen.findByRole("button", { name: /accept/i }));

    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith("Error processing invitation.", false),
    );
  });

  it("shows accepted/rejected invitations under the History tab", async () => {
    const user = userEvent.setup();
    render(<Harness invites={[acceptedInvite]} />);

    // Not shown while the Pending tab is active.
    expect(
      await screen.findByText("No pending invitations."),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /history/i }));

    expect(screen.getByText("Old Wallet")).toBeInTheDocument();
    expect(screen.getByText("ACCEPTED")).toBeInTheDocument();
  });

  it("shows an empty history state when there are no past invitations", async () => {
    const user = userEvent.setup();
    render(<Harness invites={[pendingInvite]} />);

    await screen.findByText("Shared Budget");
    await user.click(screen.getByRole("button", { name: /history/i }));

    expect(screen.getByText("No past invitations.")).toBeInTheDocument();
  });
});
