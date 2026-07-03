import { describe, it, expect, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { createRef } from "react";
import type { CurrencyCode } from "../../utils/currencies";
import type { Subscription, Wallet } from "../../utils/types";

// Isolate from the heavy form children (shared with the transaction form).
vi.mock("../TransactionModal/TagPicker/TagPicker", () => ({
  TagPicker: () => <div />,
}));
vi.mock("../../components/ui/AmountInput.tsx", () => ({
  AmountInput: () => <div />,
}));
vi.mock("../TransactionModal/TransactionTypeToggle", () => ({
  TransactionTypeToggle: () => <div />,
}));
vi.mock("../TransactionModal/ExchangeRateSection", () => ({
  ExchangeRateSection: () => <div />,
}));
vi.mock("../../components/DataPicker/CustomDatePicker", () => ({
  default: () => <div />,
}));
vi.mock("../../components/ui/Selector.tsx", () => ({
  Selector: () => <div />,
}));
vi.mock("../../components/ui/CustomSelect.tsx", () => ({
  CustomSelect: () => <div />,
}));
vi.mock("../../api/axiosConfig", () => ({
  default: { post: vi.fn(), put: vi.fn() },
}));
vi.mock("../../components/ui/ToastNotification.tsx", () => ({
  triggerToast: vi.fn(),
}));

import {
  SubscriptionModal,
  type SubscriptionModalHandle,
} from "./SubscriptionModal";

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
  const ref = createRef<SubscriptionModalHandle>();
  render(
    <SubscriptionModal
      ref={ref}
      wallet={wallet}
      tags={[]}
      baseCurrency={"EUR" as CurrencyCode}
      onSuccess={() => {}}
    />,
  );
  return ref;
}

describe("SubscriptionModal", () => {
  it("is closed initially", () => {
    renderModal();
    expect(screen.queryByText("New Subscription")).not.toBeInTheDocument();
  });

  it("opens as a create form via openModal()", () => {
    const ref = renderModal();
    act(() => ref.current!.openModal());
    expect(screen.getByText("New Subscription")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Save subscription" }),
    ).toBeInTheDocument();
  });

  it("opens as an edit form when given a subscription", () => {
    const ref = renderModal();
    const sub = {
      id: "s1",
      name: "Netflix",
      type: "EXPENSE",
      amount: 10,
      startDate: "2026-01-02",
      tag: { name: "Fun", icon: "tag", colorHex: "#fff" },
    } as unknown as Subscription;
    act(() => ref.current!.openModal(sub));
    expect(screen.getByText("Edit Subscription")).toBeInTheDocument();
  });
});
