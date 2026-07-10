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
import type { Subscription, Wallet } from "../../../utils/types";

// Isolate from the heavy form children (shared with the transaction form).
vi.mock("../../../modals/TransactionModal/TagPicker/TagPicker", () => ({
  TagPicker: () => <div />,
}));
vi.mock("../../../components/ui/AmountInput.tsx", () => ({
  AmountInput: () => <div />,
}));
vi.mock("../../../modals/TransactionModal/TransactionTypeToggle", () => ({
  TransactionTypeToggle: () => <div />,
}));
vi.mock("../../../modals/TransactionModal/ExchangeRateSection", () => ({
  ExchangeRateSection: () => <div />,
}));
vi.mock("../../../components/DataPicker/CustomDatePicker", () => ({
  default: () => <div />,
}));
vi.mock("../../../components/ui/Selector.tsx", () => ({
  Selector: () => <div />,
}));
vi.mock("../../../components/ui/CustomSelect.tsx", () => ({
  CustomSelect: () => <div />,
}));
vi.mock("../../../api/axiosConfig", () => ({
  default: { post: vi.fn(), put: vi.fn() },
}));
vi.mock("../../../components/ui/ToastNotification.tsx", () => ({
  triggerToast: vi.fn(),
}));

import {
  SubscriptionModal,
  type SubscriptionModalHandle,
} from "../../../modals/subscription/SubscriptionModal";
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

  it("saves a reminder subscription without requiring an amount", async () => {
    vi.mocked(api.put).mockResolvedValue({ data: {} });
    const ref = renderModal();
    const reminderSub = {
      id: "sub-1",
      name: "",
      type: "EXPENSE",
      amount: 0,
      originalAmount: 0,
      amountPending: true,
      startDate: "2026-01-02",
      tag: { name: "Fun", icon: "tag", colorHex: "#fff" },
    } as unknown as Subscription;
    act(() => ref.current!.openModal(reminderSub));

    const save = await screen.findByRole("button", {
      name: /save subscription/i,
    });
    expect(save).toBeEnabled();
    fireEvent.click(save);

    await waitFor(() => expect(api.put).toHaveBeenCalled());
    expect(vi.mocked(api.put).mock.calls[0][1]).toMatchObject({
      amountPending: true,
      amount: 0,
      originalAmount: 0,
    });
  });

  it("shows the reminder toggle when creating a subscription", () => {
    const ref = renderModal();
    act(() => ref.current!.openModal());
    expect(
      screen.getByRole("switch", {
        name: "Reminder subscription (no fixed amount)",
      }),
    ).toBeInTheDocument();
  });
});
