import { describe, it, expect, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { createRef } from "react";
import type { CurrencyCode } from "../../../utils/currencies";
import type { Transaction, Wallet } from "../../../utils/types";

// Isolate from the heavy form children (some are being refactored concurrently).
vi.mock("../../../modals/TransactionModal/TagPicker/TagPicker.tsx", () => ({
  TagPicker: () => <div data-testid="tagpicker" />,
}));
vi.mock("../../../components/ui/AmountInput.tsx", () => ({
  AmountInput: () => <div />,
}));
vi.mock("../../../modals/TransactionModal/ExchangeRateSection.tsx", () => ({
  ExchangeRateSection: () => <div />,
}));
vi.mock("../../../modals/TransactionModal/TransactionTypeToggle.tsx", () => ({
  TransactionTypeToggle: () => <div />,
}));
vi.mock("../../../modals/TransactionModal/TransactionMetadataInputs.tsx", () => ({
  TransactionMetadataInputs: () => <div />,
}));
vi.mock("../../../components/DataPicker/CustomDatePicker.tsx", () => ({
  default: () => <div />,
}));
vi.mock("../../../api/axiosConfig", () => ({
  default: { post: vi.fn(), put: vi.fn() },
}));
vi.mock("../../../components/ui/ToastNotification.tsx", () => ({
  triggerToast: vi.fn(),
}));

import {
  TransactionModal,
  type TransactionModalHandle,
} from "../../../modals/TransactionModal/TransactionModal";

const wallet: Wallet = {
  id: "w1",
  name: "W1",
  icon: "wallet",
  color: "#8b5cf6",
  currency: "EUR",
  createdAt: "2026-01-01",
  userRole: "OWNER",
};

function renderModal() {
  const ref = createRef<TransactionModalHandle>();
  render(
    <TransactionModal
      ref={ref}
      wallet={wallet}
      tags={[]}
      baseCurrency={"EUR" as CurrencyCode}
      onSuccess={() => {}}
    />,
  );
  return ref;
}

describe("TransactionModal", () => {
  it("is closed initially", () => {
    renderModal();
    expect(screen.queryByText("New Transaction")).not.toBeInTheDocument();
  });

  it("opens as a create form via openModal()", () => {
    const ref = renderModal();
    act(() => ref.current!.openModal());
    expect(screen.getByText("New Transaction")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Save transaction" }),
    ).toBeInTheDocument();
  });

  it("opens as an edit form when given a transaction", () => {
    const ref = renderModal();
    const tx = {
      id: "t1",
      name: "Coffee",
      type: "EXPENSE",
      amount: 3,
      transactionDate: "2026-01-02",
      tag: { name: "Food", icon: "tag", colorHex: "#fff" },
    } as unknown as Transaction;
    act(() => ref.current!.openModal(tx));
    expect(screen.getByText("Edit Transaction")).toBeInTheDocument();
  });
});
