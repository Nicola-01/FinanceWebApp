import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, within } from "@testing-library/react";
import { createRef } from "react";

// Mock the orchestration so no API is hit.
const createWalletFromDraft = vi.fn();
vi.mock("../../../modals/wallet/walletCreation", () => ({
  createWalletFromDraft: (...args: unknown[]) => createWalletFromDraft(...args),
}));

// Trivial doubles for the step leaves: each exposes a button that mutates its
// draft slice, so the container's gating/navigation can be driven directly.
type Obj = Record<string, unknown>;
vi.mock("../../../modals/wallet/wizardSteps/BasicsStep", () => ({
  BasicsStep: ({
    value,
    onChange,
  }: {
    value: Obj;
    onChange: (v: Obj) => void;
  }) => (
    <button onClick={() => onChange({ ...value, name: "My Wallet" })}>
      set-name
    </button>
  ),
}));
// Each factory is self-contained (vi.mock is hoisted above module scope).
vi.mock("../../../modals/wallet/wizardSteps/TagsStep", () => ({
  TagsStep: ({
    value,
    onChange,
  }: {
    value: unknown[];
    onChange: (v: unknown[]) => void;
  }) => <button onClick={() => onChange([...value, {}])}>add-tag</button>,
}));
vi.mock("../../../modals/wallet/wizardSteps/SubscriptionsStep", () => ({
  // Stage a subscription pointing at a tag that isn't in the (empty) draft, so
  // the container flags it as an unresolved-tag conflict.
  SubscriptionsStep: ({
    value,
    onChange,
  }: {
    value: unknown[];
    onChange: (v: unknown[]) => void;
  }) => (
    <button onClick={() => onChange([...value, { tag: "Unstaged" }])}>
      add-sub
    </button>
  ),
}));
vi.mock("../../../modals/wallet/wizardSteps/TransactionsStep", () => ({
  TransactionsStep: ({
    value,
    onChange,
  }: {
    value: unknown[];
    onChange: (v: unknown[]) => void;
  }) => <button onClick={() => onChange([...value, {}])}>add-tx</button>,
}));
vi.mock("../../../modals/wallet/wizardSteps/InvitesStep", () => ({
  InvitesStep: ({
    value,
    onChange,
  }: {
    value: unknown[];
    onChange: (v: unknown[]) => void;
  }) => <button onClick={() => onChange([...value, {}])}>add-invite</button>,
}));

import {
  CreateWalletWizard,
  type CreateWalletWizardHandle,
} from "../../../modals/wallet/CreateWalletWizard";

const open = (onSuccess = vi.fn()) => {
  const ref = createRef<CreateWalletWizardHandle>();
  render(<CreateWalletWizard ref={ref} onSuccess={onSuccess} />);
  act(() => ref.current!.openModal());
  return { onSuccess };
};

// The discard ConfirmModal renders through a native <dialog> portaled into
// #modal-root, which jsdom neither provides nor drives — set both up.
let modalRoot: HTMLDivElement;

beforeEach(() => {
  createWalletFromDraft.mockReset();
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
});

afterEach(() => modalRoot.remove());

// The confirm dialog is the only <dialog>; its `open` attribute is the source
// of truth for whether the discard prompt is showing.
const discardDialog = () => document.querySelector("dialog");
// The shell's header is the only `banner` landmark — scope to it so we hit the
// shell's X, not the ConfirmModal's own (always-mounted) close button.
const clickShellClose = () =>
  fireEvent.click(within(screen.getByRole("banner")).getByLabelText("Close"));

describe("CreateWalletWizard", () => {
  it("opens on the ref handle and gates the mandatory Basics step", () => {
    open();
    expect(screen.getByText("Create a new wallet")).toBeInTheDocument();
    expect(screen.getByTestId("wizard-next")).toBeDisabled();
    fireEvent.click(screen.getByText("set-name"));
    expect(screen.getByTestId("wizard-next")).toBeEnabled();
  });

  it("creates the wallet at the end and 'Go to wallet' reports the id", async () => {
    createWalletFromDraft.mockResolvedValue({
      walletId: "w1",
      outcomes: [],
      anyFailed: false,
    });
    const { onSuccess } = open();

    fireEvent.click(screen.getByText("set-name"));
    // Basics -> Tags -> Subscriptions -> Transactions -> Invite -> complete
    for (let i = 0; i < 5; i++) {
      fireEvent.click(screen.getByTestId("wizard-next"));
    }

    expect(createWalletFromDraft).toHaveBeenCalledTimes(1);
    await screen.findByText("Wallet ready");
    fireEvent.click(screen.getByText("Go to wallet"));
    expect(onSuccess).toHaveBeenCalledWith("w1");
  });

  it("shows a per-resource recap when some invites fail", async () => {
    // Data imports are atomic (a failure would have thrown), so a partial
    // outcome can only come from the best-effort invites.
    createWalletFromDraft.mockResolvedValue({
      walletId: "w1",
      outcomes: [
        { resource: "tags", ok: true, created: 3, updated: 0 },
        { resource: "invites", ok: false, sent: 1, failed: 1 },
      ],
      anyFailed: true,
    });
    open();
    fireEvent.click(screen.getByText("set-name"));
    for (let i = 0; i < 5; i++) {
      fireEvent.click(screen.getByTestId("wizard-next"));
    }
    await screen.findByText("Wallet created with some issues");
    expect(
      screen.getByText(
        "The wallet was created, but some invitations couldn't be sent.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("1/2 sent")).toBeInTheDocument();
    expect(screen.getByText("3 created")).toBeInTheDocument();
  });

  it("shows a blocking error when the atomic create fails (no wallet kept)", async () => {
    createWalletFromDraft.mockRejectedValue(
      new Error("Transactions: Row 3: bad"),
    );
    open();
    fireEvent.click(screen.getByText("set-name"));
    for (let i = 0; i < 5; i++) {
      fireEvent.click(screen.getByTestId("wizard-next"));
    }
    await screen.findByText("Couldn't create the wallet");
    expect(screen.getByText("Transactions: Row 3: bad")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Return to setup" }),
    ).toBeInTheDocument();
  });

  it("blocks Continue on Subscriptions while a subscription's tag is unresolved", () => {
    open();
    fireEvent.click(screen.getByText("set-name")); // Basics complete
    // Basics(0) -> Tags(1) -> Subscriptions(2)
    fireEvent.click(screen.getByTestId("wizard-next"));
    fireEvent.click(screen.getByTestId("wizard-next"));

    // No subscriptions yet — nothing to block.
    expect(screen.getByTestId("wizard-next")).toBeEnabled();

    // Stage one whose tag isn't in the draft → Continue is blocked with a reason.
    fireEvent.click(screen.getByText("add-sub"));
    expect(screen.getByTestId("wizard-next")).toBeDisabled();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("prompts on close even for an untouched draft, keeping the wizard open", () => {
    open();
    clickShellClose();
    expect(discardDialog()).toHaveAttribute("open");
    expect(screen.getByText("Discard wallet setup?")).toBeInTheDocument();
    // The wizard is still mounted behind the confirmation.
    expect(screen.getByText("Create a new wallet")).toBeInTheDocument();
  });

  it("declining the discard prompt returns to the wizard", () => {
    open();
    clickShellClose();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(discardDialog()).not.toHaveAttribute("open");
    expect(screen.getByText("Create a new wallet")).toBeInTheDocument();
  });

  it("confirming the discard closes the wizard", () => {
    open();
    clickShellClose();
    fireEvent.click(screen.getByRole("button", { name: "Discard" }));
    expect(screen.queryByText("Create a new wallet")).not.toBeInTheDocument();
  });
});
