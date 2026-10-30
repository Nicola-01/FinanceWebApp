import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("../../../dashboard/wallet/WalletContext.tsx", () => ({
  useWalletContext: () => ({ wallet: { id: "w1", color: "#8b5cf6" } }),
}));
vi.mock("../../../api/axiosConfig", () => ({
  default: { get: vi.fn(), put: vi.fn() },
}));
vi.mock("../../../components/ui/ToastNotification.tsx", () => ({
  triggerToast: vi.fn(),
}));

import api from "../../../api/axiosConfig";
import { triggerToast } from "../../../components/ui/ToastNotification.tsx";
import { WalletNotificationsCard } from "../../../dashboard/settings/WalletNotificationsCard";

const mockedGet = api.get as unknown as ReturnType<typeof vi.fn>;
const mockedPut = api.put as unknown as ReturnType<typeof vi.fn>;

const entry = (overrides = {}) => ({
  walletId: "w1",
  walletName: "Casa",
  muted: false,
  transactions: true,
  subscriptions: false,
  recurringExecutions: true,
  budgets: true,
  ...overrides,
});

describe("WalletNotificationsCard", () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedPut.mockReset();
    mockedPut.mockResolvedValue({});
  });

  it("renders nothing when the caller has no entry for this wallet", async () => {
    mockedGet.mockResolvedValue({ data: { wallets: [] } });
    const { container } = render(<WalletNotificationsCard />);
    await waitFor(() => expect(mockedGet).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it("an event toggle PUTs the updated preferences", async () => {
    mockedGet.mockResolvedValue({ data: { wallets: [entry()] } });
    render(<WalletNotificationsCard />);

    await userEvent.click(
      await screen.findByRole("switch", { name: "Subscriptions" }),
    );

    expect(mockedPut).toHaveBeenCalledWith(
      "/wallets/w1/notification-preferences",
      {
        muted: false,
        transactions: true,
        subscriptions: true,
        recurringExecutions: true,
        budgets: true,
      },
    );
  });

  it("re-enabling a muted wallet turns every event type on", async () => {
    mockedGet.mockResolvedValue({
      data: { wallets: [entry({ muted: true, transactions: false })] },
    });
    render(<WalletNotificationsCard />);

    expect(
      screen.queryByRole("switch", { name: "Transactions" }),
    ).not.toBeInTheDocument();
    await userEvent.click(
      await screen.findByRole("switch", {
        name: "Notify me about this wallet",
      }),
    );

    expect(mockedPut).toHaveBeenCalledWith(
      "/wallets/w1/notification-preferences",
      {
        muted: false,
        transactions: true,
        subscriptions: true,
        recurringExecutions: true,
        budgets: true,
      },
    );
    expect(screen.getByRole("switch", { name: "Transactions" })).toBeChecked();
  });

  it("reverts and toasts when saving fails", async () => {
    mockedGet.mockResolvedValue({ data: { wallets: [entry()] } });
    mockedPut.mockRejectedValue(new Error("boom"));
    render(<WalletNotificationsCard />);

    const toggle = await screen.findByRole("switch", { name: "Transactions" });
    await userEvent.click(toggle);

    await waitFor(() => expect(toggle).toBeChecked());
    expect(triggerToast).toHaveBeenCalledWith(
      "Could not update wallet notifications",
      false,
    );
  });
  it("the budget alerts toggle PUTs with budgets flipped", async () => {
    mockedGet.mockResolvedValue({ data: { wallets: [entry()] } });
    render(<WalletNotificationsCard />);

    await userEvent.click(
      await screen.findByRole("switch", { name: "Budget alerts" }),
    );

    expect(mockedPut).toHaveBeenCalledWith(
      "/wallets/w1/notification-preferences",
      expect.objectContaining({ budgets: false }),
    );
  });
});
