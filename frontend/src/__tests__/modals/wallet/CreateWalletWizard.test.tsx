import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
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
  SubscriptionsStep: ({
    value,
    onChange,
  }: {
    value: unknown[];
    onChange: (v: unknown[]) => void;
  }) => <button onClick={() => onChange([...value, {}])}>add-sub</button>,
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

beforeEach(() => createWalletFromDraft.mockReset());

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

  it("shows a per-resource recap when an import fails", async () => {
    createWalletFromDraft.mockResolvedValue({
      walletId: "w1",
      outcomes: [
        { resource: "tags", ok: true, created: 3, updated: 0 },
        { resource: "subscriptions", ok: false, error: "Row 2: bad" },
      ],
      anyFailed: true,
    });
    open();
    fireEvent.click(screen.getByText("set-name"));
    for (let i = 0; i < 5; i++) {
      fireEvent.click(screen.getByTestId("wizard-next"));
    }
    await screen.findByText("Wallet created with some issues");
    expect(screen.getByText("Row 2: bad")).toBeInTheDocument();
    expect(screen.getByText("3 created")).toBeInTheDocument();
  });
});
