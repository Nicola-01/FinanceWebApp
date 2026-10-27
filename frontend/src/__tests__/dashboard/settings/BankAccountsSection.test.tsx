import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Wallet } from "../../../types/domain";

const { ctxRef, bank } = vi.hoisted(() => ({
  ctxRef: { current: {} as { wallet: Wallet; fetchData: () => void } },
  bank: {
    getWalletBank: vi.fn(),
    syncConnection: vi.fn(),
    renewConnection: vi.fn(),
    deleteConnection: vi.fn(),
    listAspsps: vi.fn(),
    connectBank: vi.fn(),
  },
}));
vi.mock("../../../dashboard/wallet/WalletContext.tsx", () => ({
  useWalletContext: () => ctxRef.current,
}));
vi.mock("../../../api/bankApi", () => bank);
vi.mock("../../../components/ui/ToastNotification.tsx", () => ({
  triggerToast: vi.fn(),
}));

import { triggerToast } from "../../../components/ui/ToastNotification.tsx";
import { BankAccountsSection } from "../../../dashboard/settings/BankAccountsSection";

const wallet = (userRole: Wallet["userRole"]): Wallet => ({
  id: "w1",
  name: "Main",
  icon: "wallet",
  color: "#8b5cf6",
  currency: "EUR",
  createdAt: "2026-01-01",
  userRole,
});

const conn = {
  id: "c1",
  walletId: "w1",
  aspspName: "Intesa",
  status: "EXPIRED",
  validUntil: "2026-01-01T00:00:00Z",
  lastError: "consent expired",
  accounts: [
    {
      id: "a1",
      displayName: "Checking",
      maskedIban: "IT60 **** 1234",
      importedCount: 3,
    },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  // ConfirmModal portals into #modal-root; jsdom lacks the <dialog> API.
  document.getElementById("modal-root")?.remove();
  const root = document.createElement("div");
  root.id = "modal-root";
  document.body.appendChild(root);
  HTMLDialogElement.prototype.showModal ??= function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close ??= function () {
    this.removeAttribute("open");
  };
  ctxRef.current = { wallet: wallet("OWNER"), fetchData: vi.fn() };
  bank.getWalletBank.mockResolvedValue({ enabled: true, connections: [conn] });
});

describe("BankAccountsSection", () => {
  it("renders nothing when not enabled", async () => {
    bank.getWalletBank.mockResolvedValue({ enabled: false, connections: [] });
    const { container } = render(<BankAccountsSection />);
    await waitFor(() => expect(bank.getWalletBank).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it("OWNER sees link, renew, sync and unlink", async () => {
    render(<BankAccountsSection />);
    expect(await screen.findByText("Intesa")).toBeInTheDocument();
    expect(screen.getByText("IT60 **** 1234")).toBeInTheDocument();
    expect(screen.getByText("consent expired")).toBeInTheDocument();
    for (const name of [/link bank/i, /renew/i, /sync now/i, /unlink/i]) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }
  });

  it("EDITOR sees Sync now but not Link/Unlink/Renew", async () => {
    ctxRef.current = { wallet: wallet("EDITOR"), fetchData: vi.fn() };
    render(<BankAccountsSection />);
    await screen.findByText("Intesa");
    expect(
      screen.getByRole("button", { name: /sync now/i }),
    ).toBeInTheDocument();
    for (const name of [/link bank/i, /renew/i, /unlink/i]) {
      expect(screen.queryByRole("button", { name })).toBeNull();
    }
  });

  it("VIEWER has no actions", async () => {
    ctxRef.current = { wallet: wallet("VIEWER"), fetchData: vi.fn() };
    render(<BankAccountsSection />);
    await screen.findByText("Intesa");
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it.each([
    [{ imported: 2, status: "ACTIVE" }, "Imported 2 transactions", true],
    [{ imported: 1, status: "ACTIVE" }, "Imported 1 transaction", true],
    [{ imported: 0, status: "ACTIVE" }, "Nothing new", true],
    [
      { imported: 0, status: "ERROR" },
      "Sync stopped: connection is ERROR",
      false,
    ],
  ])("Sync now toasts the result %#", async (result, message, ok) => {
    bank.syncConnection.mockResolvedValue({ connectionId: "c1", ...result });
    render(<BankAccountsSection />);
    await userEvent.click(
      await screen.findByRole("button", { name: /sync now/i }),
    );
    await waitFor(() => expect(triggerToast).toHaveBeenCalledWith(message, ok));
  });

  it("Sync now calls the API and refreshes wallet data", async () => {
    bank.syncConnection.mockResolvedValue({ imported: 0, status: "ACTIVE" });
    render(<BankAccountsSection />);
    await userEvent.click(
      await screen.findByRole("button", { name: /sync now/i }),
    );
    await waitFor(() => expect(bank.syncConnection).toHaveBeenCalledWith("c1"));
    await waitFor(() => expect(ctxRef.current.fetchData).toHaveBeenCalled());
  });

  it("Unlink confirms, deletes and reloads the list", async () => {
    bank.deleteConnection.mockResolvedValue(undefined);
    render(<BankAccountsSection />);
    await userEvent.click(
      await screen.findByRole("button", { name: /^unlink$/i }),
    );
    expect(bank.deleteConnection).not.toHaveBeenCalled();
    const modal = within(document.getElementById("modal-root")!);
    await userEvent.click(
      await modal.findByRole("button", { name: /^unlink$/i }),
    );
    await waitFor(() =>
      expect(bank.deleteConnection).toHaveBeenCalledWith("c1"),
    );
    await waitFor(() => expect(bank.getWalletBank).toHaveBeenCalledTimes(2));
  });

  it("shows an inline message when loading fails", async () => {
    bank.getWalletBank.mockRejectedValue(new Error("x"));
    render(<BankAccountsSection />);
    expect(
      await screen.findByText(/could not load bank accounts/i),
    ).toBeInTheDocument();
  });
});
