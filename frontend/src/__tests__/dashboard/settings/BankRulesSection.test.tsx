import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError, type AxiosResponse } from "axios";
import type { BankRule, Wallet } from "../../../types/domain";

const { ctxRef, bank } = vi.hoisted(() => ({
  ctxRef: { current: {} as { wallet: Wallet; tags: [] } },
  bank: {
    getWalletBank: vi.fn(),
    listBankRules: vi.fn(),
    deleteBankRule: vi.fn(),
    createBankRule: vi.fn(),
    updateBankRule: vi.fn(),
  },
}));
vi.mock("../../../dashboard/wallet/WalletContext.tsx", async () => {
  // TagBadge reads WalletContext directly, so it needs a real context object.
  const { createContext } = await import("react");
  return {
    useWalletContext: () => ctxRef.current,
    WalletContext: createContext(null),
  };
});
vi.mock("../../../api/bankApi", () => bank);
vi.mock("../../../components/ui/ToastNotification.tsx", () => ({
  triggerToast: vi.fn(),
}));
vi.mock("../../../dashboard/settings/BankRuleEditor.tsx", () => ({
  BankRuleEditor: () => null,
}));

import { triggerToast } from "../../../components/ui/ToastNotification.tsx";
import { BankRulesSection } from "../../../dashboard/settings/BankRulesSection";

const wallet = (userRole: Wallet["userRole"]): Wallet => ({
  id: "w1",
  name: "Main",
  icon: "wallet",
  color: "#8b5cf6",
  currency: "EUR",
  createdAt: "2026-01-01",
  userRole,
});

const rule: BankRule = {
  id: "r1",
  name: "Netflix",
  matchText: "NETFLIX",
  regex: true,
  ignoreCase: true,
  tag: {
    name: "Streaming",
    icon: "tag",
    colorHex: "#ff0000",
  } as BankRule["tag"],
  renameTo: "Netflix TV",
  reviewFirst: true,
  dateFromName: true,
  usedBy: ["Netflix"],
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
  ctxRef.current = { wallet: wallet("OWNER"), tags: [] };
  bank.getWalletBank.mockResolvedValue({ enabled: true, connections: [] });
  bank.listBankRules.mockResolvedValue([rule]);
});

describe("BankRulesSection", () => {
  it("renders nothing when open banking is disabled", async () => {
    bank.getWalletBank.mockResolvedValue({ enabled: false, connections: [] });
    const { container } = render(<BankRulesSection />);
    await waitFor(() => expect(bank.getWalletBank).toHaveBeenCalledWith("w1"));
    expect(container).toBeEmptyDOMElement();
    expect(bank.listBankRules).not.toHaveBeenCalled();
  });

  it("lists the rules with their usage", async () => {
    render(<BankRulesSection />);
    expect(await screen.findByText("Bank rules")).toBeInTheDocument();
    // The trigger text reads as code.
    expect(screen.getByText("NETFLIX").tagName).toBe("CODE");
    expect(screen.getByText("Review first")).toBeInTheDocument();
    expect(screen.getByText("Date from name")).toBeInTheDocument();
    expect(screen.getByText("Regex")).toBeInTheDocument();
    expect(screen.getByText("Used by Netflix")).toBeInTheDocument();
    expect(screen.getByText("Streaming")).toBeInTheDocument();
    expect(screen.getByText("Netflix TV")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Edit Netflix" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Add rule" }),
    ).toBeInTheDocument();
  });

  it("is read-only for viewers", async () => {
    ctxRef.current = { wallet: wallet("VIEWER"), tags: [] };
    render(<BankRulesSection />);
    await screen.findByText("NETFLIX");
    expect(
      screen.queryByRole("button", { name: "Add rule" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Delete Netflix" }),
    ).not.toBeInTheDocument();
  });

  it("shows the server's 'Used by' detail when a delete is refused", async () => {
    const err = new AxiosError("409");
    err.response = {
      data: { title: "Conflict", detail: "Used by: Netflix" },
      status: 409,
    } as AxiosResponse;
    bank.deleteBankRule.mockRejectedValue(err);
    render(<BankRulesSection />);
    await userEvent.click(
      await screen.findByRole("button", { name: "Delete Netflix" }),
    );
    await userEvent.click(
      await screen.findByRole("button", { name: "Delete rule" }),
    );
    await waitFor(() =>
      expect(triggerToast).toHaveBeenCalledWith("Used by: Netflix", false),
    );
  });
});
