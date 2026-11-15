import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { BankConnection } from "../../../../api/bankApi";
import type { Wallet } from "../../../../types/domain";

const { ctxRef, bank } = vi.hoisted(() => ({
  ctxRef: {
    current: {} as { wallet: Wallet; fetchData: ReturnType<typeof vi.fn> },
  },
  bank: {
    syncConnection: vi.fn(),
    renewConnection: vi.fn(),
    deleteConnection: vi.fn(),
  },
}));
vi.mock("../../../../dashboard/wallet/WalletContext.tsx", () => ({
  useWalletContext: () => ctxRef.current,
}));
vi.mock("../../../../api/bankApi", () => bank);
vi.mock("../../../../components/ui/ToastNotification.tsx", () => ({
  triggerToast: vi.fn(),
}));
vi.mock("../../../../dashboard/settings/ConnectBankForm.tsx", () => ({
  ConnectBankForm: () => null,
}));

import { BankAccountsList } from "../../../../dashboard/settings/bank/BankAccountsList";

const wallet = (userRole: Wallet["userRole"]): Wallet =>
  ({
    id: "w1",
    name: "Main",
    color: "#8b5cf6",
    currency: "EUR",
    userRole,
  }) as Wallet;

const conn: BankConnection = {
  id: "c1",
  walletId: "w1",
  aspspName: "Revolut",
  status: "ACTIVE",
  validUntil: "2027-04-28T00:00:00Z",
  accounts: [
    {
      id: "a1",
      displayName: "Main",
      maskedIban: "IT60 **** 9923",
      lastSyncedAt: new Date(Date.now() - 14 * 60_000).toISOString(),
      importedCount: 4,
    },
  ],
};

const openMenu = async () =>
  userEvent.click(screen.getByRole("button", { name: "Actions for Revolut" }));

beforeEach(() => {
  vi.clearAllMocks();
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
});

describe("BankAccountsList", () => {
  it("shows the bank, its masked number, sync time and status", () => {
    render(<BankAccountsList connections={[conn]} reload={vi.fn()} />);
    expect(screen.getByText("Revolut")).toBeInTheDocument();
    expect(screen.getByText(/••9923/)).toHaveTextContent("synced 14 min ago");
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("offers link, sync, renew and unlink to the owner", async () => {
    render(<BankAccountsList connections={[conn]} reload={vi.fn()} />);
    expect(
      screen.getByRole("button", { name: /link account/i }),
    ).toBeInTheDocument();
    await openMenu();
    for (const name of [/sync now/i, /renew consent/i, /unlink/i]) {
      expect(screen.getByRole("menuitem", { name })).toBeInTheDocument();
    }
  });

  it("gives an editor sync only, and a viewer no menu at all", async () => {
    ctxRef.current = { wallet: wallet("EDITOR"), fetchData: vi.fn() };
    const { unmount } = render(
      <BankAccountsList connections={[conn]} reload={vi.fn()} />,
    );
    await openMenu();
    expect(screen.getByRole("menuitem", { name: /sync now/i })).toBeVisible();
    expect(screen.queryByRole("menuitem", { name: /unlink/i })).toBeNull();
    unmount();

    ctxRef.current = { wallet: wallet("VIEWER"), fetchData: vi.fn() };
    render(<BankAccountsList connections={[conn]} reload={vi.fn()} />);
    expect(
      screen.queryByRole("button", { name: "Actions for Revolut" }),
    ).toBeNull();
  });

  it("syncs from the menu and reloads", async () => {
    bank.syncConnection.mockResolvedValue({ imported: 0, status: "ACTIVE" });
    const reload = vi.fn().mockResolvedValue(undefined);
    render(<BankAccountsList connections={[conn]} reload={reload} />);
    await openMenu();
    await userEvent.click(screen.getByRole("menuitem", { name: /sync now/i }));
    await waitFor(() => expect(bank.syncConnection).toHaveBeenCalledWith("c1"));
    expect(reload).toHaveBeenCalled();
    expect(ctxRef.current.fetchData).toHaveBeenCalled();
  });

  it("unlink asks for confirmation before deleting", async () => {
    bank.deleteConnection.mockResolvedValue(undefined);
    const reload = vi.fn().mockResolvedValue(undefined);
    render(<BankAccountsList connections={[conn]} reload={reload} />);
    await openMenu();
    await userEvent.click(screen.getByRole("menuitem", { name: /unlink/i }));
    expect(bank.deleteConnection).not.toHaveBeenCalled();
    const modal = within(document.getElementById("modal-root")!);
    await userEvent.click(
      await modal.findByRole("button", { name: /^unlink$/i }),
    );
    await waitFor(() =>
      expect(bank.deleteConnection).toHaveBeenCalledWith("c1"),
    );
    expect(reload).toHaveBeenCalled();
  });

  it("says so when no account is linked", () => {
    render(<BankAccountsList connections={[]} reload={vi.fn()} />);
    expect(
      screen.getByText("No bank accounts linked yet."),
    ).toBeInTheDocument();
  });
});
