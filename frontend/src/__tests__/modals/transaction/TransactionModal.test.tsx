import { describe, it, expect, vi } from "vitest";
import {
  render,
  screen,
  act,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import { createRef } from "react";
import type { CurrencyCode } from "../../../utils/currencies";
import type { Transaction, Wallet } from "../../../types/domain";

// Isolate from the heavy form children (some are being refactored concurrently).
vi.mock("../../../modals/transaction/TagPicker.tsx", () => ({
  TagPicker: () => <div data-testid="tagpicker" />,
}));
vi.mock("../../../components/ui/AmountInput.tsx", () => ({
  AmountInput: () => <div />,
}));
vi.mock("../../../modals/common/exchangeRate/ExchangeRateSection.tsx", () => ({
  ExchangeRateSection: () => <div />,
}));
vi.mock("../../../components/ui/TransactionTypeToggle.tsx", () => ({
  TransactionTypeToggle: () => <div />,
}));
vi.mock("../../../modals/transaction/TransactionMetadataInputs.tsx", () => ({
  TransactionMetadataInputs: () => <div />,
}));
vi.mock("../../../components/datePicker/CustomDatePicker.tsx", () => ({
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
} from "../../../modals/transaction/TransactionModal";
import api from "../../../api/axiosConfig";

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

  it("sends transactionDate as zero-padded YYYY-MM-DD, independent of locale", async () => {
    // Regression: the date used to be built from toLocaleDateString(), so
    // 10 Sep 2026 went out as "2026-10-9" under en-US and the backend 500'd.
    vi.mocked(api.put).mockResolvedValue({ data: {} });
    const ref = renderModal();
    const tx = {
      id: "t1",
      name: "Coffee",
      type: "EXPENSE",
      amount: 3,
      transactionDate: "2026-09-10",
      tag: { name: "Food", icon: "tag", colorHex: "#fff" },
    } as unknown as Transaction;
    act(() => ref.current!.openModal(tx));

    fireEvent.click(screen.getByRole("button", { name: "Save transaction" }));

    await waitFor(() => expect(api.put).toHaveBeenCalled());
    expect(vi.mocked(api.put).mock.calls[0][1]).toMatchObject({
      transactionDate: "2026-09-10",
    });
  });
});
