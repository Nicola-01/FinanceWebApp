import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { createRef } from "react";
import type { Transaction, Wallet } from "../../../utils/types";

const { deleteObject } = vi.hoisted(() => ({ deleteObject: vi.fn() }));

vi.mock("../../../modals/TransactionModal/TransactionView", () => ({
  TransactionView: () => <div data-testid="tx-view" />,
}));
vi.mock("../../../modals/common/DeleteModalContext", () => ({
  useDeleteModal: () => ({ current: { deleteObject } }),
}));

import {
  TransactionDetailsModal,
  type TransactionDetailsModalHandle,
} from "../../../modals/TransactionModal/TransactionDetailsModal";

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
  beforeEach(() => deleteObject.mockReset());

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
});
