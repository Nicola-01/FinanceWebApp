import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { createRef } from "react";
import type { Transaction, Wallet } from "../../../types/domain";

const { deleteObject, fetchData, categoriseTransaction } = vi.hoisted(() => ({
  deleteObject: vi.fn(),
  fetchData: vi.fn(),
  categoriseTransaction: vi.fn(),
}));

vi.mock("../../../modals/transaction/TransactionView", () => ({
  TransactionView: ({ categorySlot }: { categorySlot?: React.ReactNode }) => (
    <div data-testid="tx-view">{categorySlot}</div>
  ),
}));
vi.mock("../../../modals/transaction/TagPicker.tsx", () => ({
  TagPicker: ({ onSelectTag }: { onSelectTag: (n: string) => void }) => (
    <button onClick={() => onSelectTag("Food")}>pick-tag</button>
  ),
}));
vi.mock("../../../dashboard/transaction/categoriseTransaction.ts", () => ({
  categoriseTransaction,
}));
vi.mock("../../../modals/common/DeleteModalContext", () => ({
  useDeleteModal: () => ({ current: { deleteObject } }),
}));
// Deps needed to render the REAL TransactionView in isolation (see the
// "Amount pending" test) — harmless to the other tests, which use the
// mocked TransactionView above and never touch these modules.
vi.mock("../../../dashboard/wallet/WalletContext.tsx", () => ({
  useWalletContext: () => ({ subscriptions: [], tags: [], fetchData }),
}));
vi.mock("../../../modals/subscription/SubscriptionModal.tsx", () => ({
  SubscriptionModal: () => null,
}));
vi.mock("../../../components/ui/TagBadge.tsx", () => ({
  TagBadge: () => <div data-testid="tag-badge" />,
}));
vi.mock("../../../modals/common/exchangeRate/ExchangeRateSection.tsx", () => ({
  ExchangeRateSection: () => <div data-testid="exchange" />,
}));

import {
  TransactionDetailsModal,
  type TransactionDetailsModalHandle,
} from "../../../modals/transaction/TransactionDetailsModal";

const wallet = (role: Wallet["userRole"] = "OWNER"): Wallet => ({
  id: "w1",
  name: "W1",
  icon: "wallet",
  color: "#8b5cf6",
  currency: "EUR",
  createdAt: "2026-01-01",
  userRole: role,
});

const tx = { id: "t1", name: "Coffee" } as unknown as Transaction;

function renderModal(role: Wallet["userRole"] = "OWNER") {
  const ref = createRef<TransactionDetailsModalHandle>();
  render(
    <TransactionDetailsModal
      ref={ref}
      wallet={wallet(role)}
      handleDeleteSuccess={() => {}}
      onEditRequest={() => {}}
    />,
  );
  return ref;
}

describe("TransactionDetailsModal", () => {
  beforeEach(() => vi.clearAllMocks());

  it("files a to-categorise transaction from the picker, without the edit form", async () => {
    categoriseTransaction.mockResolvedValue(true);
    const ref = renderModal("OWNER");
    const review = { ...tx, needsReview: true } as Transaction;
    act(() => ref.current!.openModal(review));
    await act(async () => fireEvent.click(screen.getByText("pick-tag")));
    expect(categoriseTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ id: "w1" }),
      review,
      "Food",
    );
    expect(fetchData).toHaveBeenCalled();
  });

  it("shows no picker for a categorised transaction or a viewer", () => {
    const ref = renderModal("VIEWER");
    act(() =>
      ref.current!.openModal({ ...tx, needsReview: true } as Transaction),
    );
    expect(screen.queryByText("pick-tag")).toBeNull();
    act(() => ref.current!.openModal(tx));
    expect(screen.queryByText("pick-tag")).toBeNull();
  });

  it("is closed initially", () => {
    renderModal();
    expect(screen.queryByTestId("tx-view")).not.toBeInTheDocument();
  });

  it("opens the view with edit + delete actions for an owner", () => {
    const ref = renderModal("OWNER");
    act(() => ref.current!.openModal(tx));
    expect(screen.getByTestId("tx-view")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  it("hides edit + delete for a VIEWER", () => {
    const ref = renderModal("VIEWER");
    act(() => ref.current!.openModal(tx));
    expect(screen.getByTestId("tx-view")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Edit" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Delete" }),
    ).not.toBeInTheDocument();
  });

  it("routes deletion through the DeleteModal", () => {
    const ref = renderModal("OWNER");
    act(() => ref.current!.openModal(tx));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(deleteObject).toHaveBeenCalledTimes(1);
    expect(deleteObject.mock.calls[0][1]).toBe("transaction");
  });

  // TransactionView is mocked at the module level for the tests above (they
  // assert on the "tx-view" placeholder), so we pull in the real component
  // here via importActual to verify its pending-amount rendering.
  it("shows 'Amount pending' for a pending transaction", async () => {
    const { TransactionView } = await vi.importActual<
      typeof import("../../../modals/transaction/TransactionView")
    >("../../../modals/transaction/TransactionView");
    render(
      <TransactionView
        tx={{ ...tx, amount: 0, amountPending: true } as unknown as Transaction}
        wallet={wallet()}
      />,
    );
    expect(screen.getByText("Amount pending")).toBeInTheDocument();
  });
});
