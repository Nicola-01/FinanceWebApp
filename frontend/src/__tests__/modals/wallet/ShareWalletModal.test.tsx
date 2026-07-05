import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useEffect, useRef } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError } from "axios";
import type { AxiosResponse } from "axios";
import type { Wallet } from "../../../utils/types";

vi.mock("../../../api/axiosConfig", () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));
vi.mock("../../../components/ui/ToastNotification.tsx", () => ({
  triggerToast: vi.fn(),
}));

import { ShareWalletModal } from "../../../modals/wallet/ShareWalletModal";
import type { ShareWalletModalHandle } from "../../../modals/wallet/ShareWalletModal";
import api from "../../../api/axiosConfig";
import { triggerToast } from "../../../components/ui/ToastNotification.tsx";

const apiPost = (api as unknown as { post: ReturnType<typeof vi.fn> }).post;
const toast = triggerToast as unknown as ReturnType<typeof vi.fn>;

// jsdom does not implement <dialog> showModal/close; provide light stubs.
HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
  this.open = true;
};
HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
  this.open = false;
};

const wallet: Wallet = {
  id: "w1",
  name: "My Wallet",
  icon: "wallet",
  color: "#8b5cf6",
  currency: "EUR",
  createdAt: "2026-01-01",
  userRole: "OWNER",
};

function Harness() {
  const ref = useRef<ShareWalletModalHandle>(null);
  useEffect(() => {
    ref.current?.openModal();
  }, []);
  return <ShareWalletModal ref={ref} wallet={wallet} />;
}

const identifierInput = () =>
  screen.getByPlaceholderText("e.g. mario.rossi@email.com");

// The confirm control is the footer CTA ("Share Wallet" / "Sharing…").
function submitButton(): HTMLButtonElement {
  return screen.getByRole("button", {
    name: /share wallet|sharing/i,
  }) as HTMLButtonElement;
}

describe("ShareWalletModal", () => {
  beforeEach(() => {
    const root = document.createElement("div");
    root.setAttribute("id", "modal-root");
    document.body.appendChild(root);
    apiPost.mockReset();
    toast.mockReset();
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    document.getElementById("modal-root")?.remove();
    vi.restoreAllMocks();
  });

  it("disables the submit control until a valid identifier is entered", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    expect(submitButton()).toBeDisabled();

    await user.type(identifierInput(), "ab"); // too short
    expect(submitButton()).toBeDisabled();

    await user.type(identifierInput(), "c"); // "abc"
    expect(submitButton()).not.toBeDisabled();
  });

  it("does not call the API when the identifier is too short", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(identifierInput(), "ab");
    await user.click(submitButton());

    expect(apiPost).not.toHaveBeenCalled();
  });

  it("shares the wallet with the entered identifier and default VIEWER role", async () => {
    const user = userEvent.setup();
    apiPost.mockResolvedValue({});
    render(<Harness />);

    await user.type(identifierInput(), "alice");
    await user.click(submitButton());

    await waitFor(() =>
      expect(apiPost).toHaveBeenCalledWith("/wallets/w1/share", {
        identifier: "alice",
        role: "VIEWER",
      }),
    );
    expect(toast).toHaveBeenCalledWith(
      "Wallet shared successfully with alice!",
      true,
    );
    // Dialog is closed on success.
    await waitFor(() =>
      expect(document.querySelector("dialog")?.open).toBe(false),
    );
  });

  it("shares with the EDITOR role once Editor is selected", async () => {
    const user = userEvent.setup();
    apiPost.mockResolvedValue({});
    render(<Harness />);

    await user.type(identifierInput(), "alice");
    await user.click(screen.getByRole("button", { name: /editor/i }));
    await user.click(submitButton());

    await waitFor(() =>
      expect(apiPost).toHaveBeenCalledWith("/wallets/w1/share", {
        identifier: "alice",
        role: "EDITOR",
      }),
    );
  });

  it("trims surrounding whitespace from the identifier before sharing", async () => {
    const user = userEvent.setup();
    apiPost.mockResolvedValue({});
    render(<Harness />);

    await user.type(identifierInput(), "  alice  ");
    await user.click(submitButton());

    await waitFor(() =>
      expect(apiPost).toHaveBeenCalledWith("/wallets/w1/share", {
        identifier: "alice",
        role: "VIEWER",
      }),
    );
  });

  it("surfaces an error toast when the API rejects", async () => {
    const user = userEvent.setup();
    const err = new AxiosError("bad", "ERR");
    err.response = {
      status: 404,
      data: { title: "User not found" },
    } as unknown as AxiosResponse;
    apiPost.mockRejectedValue(err);
    render(<Harness />);

    await user.type(identifierInput(), "ghost");
    await user.click(submitButton());

    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith("User not found", false),
    );
  });
});
