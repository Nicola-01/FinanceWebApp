import { describe, it, expect, vi } from "vitest";
import {
  render,
  screen,
  act,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import { createRef } from "react";
import { setUiVersion } from "../../../utils/uiVersion";
import type { CurrencyCode } from "../../../utils/currencies";
import type { Subscription, Wallet } from "../../../types/domain";

// Isolate from the heavy form children (shared with the transaction form).
vi.mock("../../../modals/transaction/TagPicker", () => ({
  TagPicker: () => <div />,
}));
vi.mock("../../../components/ui/AmountInput.tsx", () => ({
  AmountInput: () => <div />,
}));
vi.mock("../../../components/ui/TransactionTypeToggle", () => ({
  TransactionTypeToggle: () => <div />,
}));
vi.mock("../../../modals/common/exchangeRate/ExchangeRateSection", () => ({
  ExchangeRateSection: () => <div />,
}));
vi.mock("../../../components/datePicker/CustomDatePicker", () => ({
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
vi.mock("../../../api/bankApi", () => ({
  getWalletBank: vi.fn().mockResolvedValue({ enabled: false, connections: [] }),
  listBankRules: vi.fn().mockResolvedValue([]),
}));

import {
  SubscriptionModal,
  type SubscriptionModalHandle,
} from "../../../modals/subscription/SubscriptionModal";
import api from "../../../api/axiosConfig";
import { getWalletBank, listBankRules } from "../../../api/bankApi";

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

  it("round-trips startDate and durationUntil as zero-padded local YYYY-MM-DD", async () => {
    // Regression: startDate was built from toLocaleDateString() (locale-dependent,
    // unpadded) and durationUntil from toISOString() (UTC, a day early east of UTC).
    vi.mocked(api.put).mockClear();
    vi.mocked(api.put).mockResolvedValue({ data: {} });
    const ref = renderModal();
    const sub = {
      id: "sub-2",
      name: "Gym",
      type: "EXPENSE",
      amount: 30,
      startDate: "2026-09-10",
      duration: "UNTIL",
      durationUntil: "2026-10-09",
      tag: { name: "Fun", icon: "tag", colorHex: "#fff" },
    } as unknown as Subscription;
    act(() => ref.current!.openModal(sub));

    fireEvent.click(
      await screen.findByRole("button", { name: /save subscription/i }),
    );

    await waitFor(() => expect(api.put).toHaveBeenCalled());
    expect(vi.mocked(api.put).mock.calls[0][1]).toMatchObject({
      startDate: "2026-09-10",
      durationUntil: "2026-10-09",
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

  describe("Open Banking section", () => {
    const sub = {
      id: "s9",
      name: "Netflix",
      type: "EXPENSE",
      amount: 12.99,
      startDate: "2026-01-02",
      frequencyType: "WEEKLY",
      frequencyInterval: 2,
      tag: { name: "Fun", icon: "tag", colorHex: "#fff" },
      bankRuleId: "r1",
      bankRuleName: "Netflix",
      bankDriven: true,
    } as unknown as Subscription;

    const enableBank = () => {
      vi.mocked(getWalletBank).mockResolvedValue({
        enabled: true,
        connections: [],
      });
      vi.mocked(listBankRules).mockResolvedValue([
        {
          id: "r1",
          name: "Netflix",
          matchText: "NETFLIX",
          regex: false,
          ignoreCase: true,
          usedBy: ["Netflix"],
        },
      ]);
    };

    it("hides the section when open banking is disabled", async () => {
      vi.mocked(getWalletBank).mockResolvedValue({
        enabled: false,
        connections: [],
      });
      const ref = renderModal();
      act(() => ref.current!.openModal());
      await waitFor(() => expect(getWalletBank).toHaveBeenCalledWith("w1"));
      expect(screen.queryByText("Open Banking")).not.toBeInTheDocument();
      expect(listBankRules).not.toHaveBeenCalled();
    });

    it("loads the wallet's rules when open banking is enabled", async () => {
      enableBank();
      const ref = renderModal();
      act(() => ref.current!.openModal());
      await waitFor(() => expect(listBankRules).toHaveBeenCalledWith("w1"));
    });

    it("keeps the schedule and has no date-from-bank toggle", async () => {
      enableBank();
      const ref = renderModal();
      act(() => ref.current!.openModal(sub));
      expect(await screen.findByText("Open Banking")).toBeInTheDocument();
      expect(screen.getByText("Repeat Every")).toBeInTheDocument();
      expect(screen.getByText("Start Date")).toBeInTheDocument();
      expect(
        screen.queryByRole("switch", { name: "Date from bank" }),
      ).not.toBeInTheDocument();
    });

    it("sends the rule with the subscription's own schedule", async () => {
      enableBank();
      vi.mocked(api.put).mockClear();
      vi.mocked(api.put).mockResolvedValue({ data: {} });
      const ref = renderModal();
      act(() => ref.current!.openModal(sub));
      await screen.findByText("Open Banking");
      fireEvent.click(
        screen.getByRole("button", { name: /save subscription/i }),
      );

      await waitFor(() => expect(api.put).toHaveBeenCalled());
      const body = vi.mocked(api.put).mock.calls[0][1] as Record<
        string,
        unknown
      >;
      expect(body).toMatchObject({
        bankRuleId: "r1",
        bankDriven: false,
        frequencyType: "WEEKLY",
        frequencyInterval: 2,
      });
    });
  });
});

describe("SubscriptionModal — bank rule gating", () => {
  const linked = (connections: unknown[]) =>
    vi.mocked(getWalletBank).mockResolvedValue({
      enabled: true,
      connections,
    } as never);

  const ruleSub = {
    id: "s7",
    name: "Netflix",
    type: "EXPENSE",
    amount: 12.99,
    startDate: "2026-01-02",
    tag: { name: "Fun", icon: "tag", colorHex: "#fff" },
    bankRuleId: "r1",
  } as unknown as Subscription;

  beforeEach(() => {
    vi.mocked(listBankRules).mockResolvedValue([
      {
        id: "r1",
        name: "Netflix",
        matchText: "NETFLIX",
        regex: false,
        ignoreCase: true,
        usedBy: [],
      },
    ] as never);
  });

  it("hides the bank rule when the wallet has no linked account", async () => {
    linked([]);
    const ref = renderModal();
    act(() => ref.current!.openModal());
    await waitFor(() => expect(getWalletBank).toHaveBeenCalledWith("w1"));
    expect(screen.queryByText("Open Banking")).not.toBeInTheDocument();
  });

  it("shows the bank rule when the wallet has a linked account", async () => {
    linked([{ id: "c1" }]);
    const ref = renderModal();
    act(() => ref.current!.openModal());
    expect(await screen.findByText("Open Banking")).toBeInTheDocument();
  });

  it("still shows an existing bank rule in edit mode so it can be cleared", async () => {
    linked([]);
    const ref = renderModal();
    act(() => ref.current!.openModal(ruleSub));
    expect(await screen.findByText("Open Banking")).toBeInTheDocument();
  });
});

describe("SubscriptionModal — v2 compact form", () => {
  beforeEach(() => setUiVersion("v2"));
  afterEach(() => setUiVersion("v1"));

  it("lays out the schedule and name as form rows", () => {
    const ref = renderModal();
    act(() => ref.current!.openModal());
    for (const label of [
      "Category",
      "Start date",
      "Repeats",
      "Ends",
      "Status",
      "Name",
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(screen.getByText("Category").parentElement).toHaveTextContent("*");
  });

  it("groups the form into labelled cards", () => {
    const ref = renderModal();
    act(() => ref.current!.openModal());
    for (const label of ["Schedule", "Options"]) {
      expect(screen.getByText(label, { selector: "h3" })).toBeInTheDocument();
    }
    expect(screen.getByText("Status")).toBeInTheDocument();
  });

  it("puts the bank rule in its own group, outside More details", async () => {
    vi.mocked(getWalletBank).mockResolvedValue({
      enabled: true,
      connections: [{ id: "c1" }],
    } as never);
    vi.mocked(listBankRules).mockResolvedValue([
      {
        id: "r1",
        name: "Netflix",
        matchText: "NETFLIX",
        regex: false,
        ignoreCase: true,
        usedBy: [],
      },
    ] as never);
    const ref = renderModal();
    act(() =>
      ref.current!.openModal({
        id: "s7",
        name: "Netflix",
        type: "EXPENSE",
        amount: 12.99,
        startDate: "2026-01-02",
        tag: { name: "Fun", icon: "tag", colorHex: "#fff" },
        bankRuleId: "r1",
      } as unknown as Subscription),
    );
    const group = await screen.findByText("Open Banking", {
      selector: "h3",
    });
    expect(group.closest("details")).toBeNull();
    expect(screen.getByText("notes, currency")).toBeInTheDocument();
  });

  it("toggles the reminder from its row switch", () => {
    const ref = renderModal();
    act(() => ref.current!.openModal());
    const sw = screen.getByRole("switch", {
      name: "Reminder subscription (no fixed amount)",
    });
    expect(sw).toHaveAttribute("aria-checked", "false");
    fireEvent.click(sw);
    expect(sw).toHaveAttribute("aria-checked", "true");
  });

  it("keeps More details closed for a new subscription", () => {
    const ref = renderModal();
    act(() => ref.current!.openModal());
    const details = screen.getByText("More details").closest("details");
    expect(details).not.toHaveAttribute("open");
    expect(screen.getByText("notes, currency")).toBeInTheDocument();
  });

  it("opens More details in edit mode when the subscription has a description", () => {
    const ref = renderModal();
    act(() =>
      ref.current!.openModal({
        id: "s8",
        name: "Gym",
        type: "EXPENSE",
        amount: 30,
        startDate: "2026-01-02",
        notes: "Monthly pass",
        tag: { name: "Fun", icon: "tag", colorHex: "#fff" },
      } as unknown as Subscription),
    );
    const details = screen.getByText("More details").closest("details");
    expect(details).toHaveAttribute("open");
    expect(screen.getByDisplayValue("Monthly pass")).toBeInTheDocument();
  });
});
