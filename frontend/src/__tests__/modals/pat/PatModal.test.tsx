import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Wallet } from "../../../utils/types";

// The security-critical permission-payload construction and the one-time-secret
// clipboard copy both live in PatModal (PatFormView/PatShowTokenView are only
// presentational), so these behaviours are exercised through the real modal.

vi.mock("../../../api/axiosConfig", () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));
vi.mock("../../../components/ui/ToastNotification.tsx", () => ({
  triggerToast: vi.fn(),
}));

import { PatModal, type PatModalHandle } from "../../../modals/pat/PatModal";
import api from "../../../api/axiosConfig";

const get = (api as unknown as { get: ReturnType<typeof vi.fn> }).get;
const post = (api as unknown as { post: ReturnType<typeof vi.fn> }).post;

const wallets: Wallet[] = [
  {
    id: "wa",
    name: "Alpha",
    icon: "wallet",
    color: "#111111",
    currency: "EUR",
    createdAt: "2026-01-01T00:00:00Z",
    userRole: "OWNER",
  },
  {
    id: "wb",
    name: "Beta",
    icon: "wallet",
    color: "#222222",
    currency: "EUR",
    createdAt: "2026-01-01T00:00:00Z",
    userRole: "OWNER",
  },
];

const writeText = () =>
  navigator.clipboard.writeText as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML = '<div id="modal-root"></div>';

  // jsdom does not implement the <dialog> imperative API; stub it so opening the
  // modal reflects an "open" attribute (which ModalDialog observes).
  HTMLDialogElement.prototype.showModal = vi.fn(function (
    this: HTMLDialogElement,
  ) {
    this.setAttribute("open", "");
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute("open");
  });

  // Spy writeText on the exact clipboard object the component reaches. Replacing
  // the whole navigator.clipboard object does not stick in jsdom, so patch the
  // method in place (installing a stub first if the API is missing).
  if (
    !navigator.clipboard ||
    typeof navigator.clipboard.writeText !== "function"
  ) {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: () => Promise.resolve() },
      configurable: true,
      writable: true,
    });
  }
  vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined);

  get.mockImplementation((url: string) => {
    if (url === "/tokens") return Promise.resolve({ data: [] });
    if (url === "/wallets") return Promise.resolve({ data: wallets });
    return Promise.resolve({ data: [] });
  });
  post.mockResolvedValue({ data: { plainToken: "fin_pat_ONE_TIME_SECRET" } });
});

// Renders the modal, opens it, and navigates into the create form with the
// wallet rows loaded.
const openCreateForm = async () => {
  const ref = React.createRef<PatModalHandle>();
  const user = userEvent.setup();
  render(<PatModal ref={ref} />);
  await act(async () => {
    ref.current!.openModal();
  });
  await user.click(
    await screen.findByRole("button", { name: /create token/i }),
  );
  await screen.findByText("Alpha");
  return user;
};

describe("PatModal — permission payload (security)", () => {
  it("builds READ+WRITE for a write wallet and omits disabled wallets", async () => {
    const user = await openCreateForm();

    await user.type(screen.getByRole("textbox"), "CI Bot");
    // Grant WRITE on Alpha; leave Beta unauthorized.
    await user.click(screen.getAllByRole("button", { name: "Write" })[0]);
    await user.click(screen.getByRole("button", { name: /generate token/i }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith("/tokens", {
      name: "CI Bot",
      walletPermissions: [{ walletId: "wa", permissions: ["READ", "WRITE"] }],
    });
    // write implies read: WRITE never travels without READ.
    const payload = post.mock.calls[0][1] as {
      walletPermissions: { permissions: string[] }[];
    };
    payload.walletPermissions.forEach((p) => {
      if (p.permissions.includes("WRITE")) {
        expect(p.permissions).toContain("READ");
      }
    });
  });

  it("builds READ-only (never WRITE) for a read wallet", async () => {
    const user = await openCreateForm();

    await user.type(screen.getByRole("textbox"), "Reader");
    await user.click(screen.getAllByRole("button", { name: "Read" })[0]);
    await user.click(screen.getByRole("button", { name: /generate token/i }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith("/tokens", {
      name: "Reader",
      walletPermissions: [{ walletId: "wa", permissions: ["READ"] }],
    });
  });

  it("SECURITY: a wallet toggled back to Unauthorized is excluded from the payload", async () => {
    const user = await openCreateForm();

    await user.type(screen.getByRole("textbox"), "Mixed");
    // Alpha: escalate to write, then revoke back to unauthorized.
    await user.click(screen.getAllByRole("button", { name: "Write" })[0]);
    await user.click(
      screen.getAllByRole("button", { name: "Unauthorized" })[0],
    );
    // Beta: grant read.
    await user.click(screen.getAllByRole("button", { name: "Read" })[1]);
    await user.click(screen.getByRole("button", { name: /generate token/i }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith("/tokens", {
      name: "Mixed",
      walletPermissions: [{ walletId: "wb", permissions: ["READ"] }],
    });
  });
});

describe("PatModal — one-time secret", () => {
  it("shows the created token once and copies the exact secret to the clipboard", async () => {
    const user = await openCreateForm();

    await user.type(screen.getByRole("textbox"), "CI Bot");
    await user.click(screen.getAllByRole("button", { name: "Read" })[0]);
    await user.click(screen.getByRole("button", { name: /generate token/i }));

    // The plaintext secret is revealed exactly once, on the show-token view.
    const shown = await screen.findAllByText("fin_pat_ONE_TIME_SECRET");
    expect(shown).toHaveLength(1);

    await user.click(
      screen.getByRole("button", { name: /copy to clipboard/i }),
    );
    await waitFor(() =>
      expect(writeText()).toHaveBeenCalledWith("fin_pat_ONE_TIME_SECRET"),
    );
  });
});
