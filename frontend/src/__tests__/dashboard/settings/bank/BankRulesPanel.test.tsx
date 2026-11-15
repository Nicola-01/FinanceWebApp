import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createContext } from "react";
import type {
  BankRule,
  Tag,
  Transaction,
  Wallet,
} from "../../../../types/domain";

const { ctxRef, bank } = vi.hoisted(() => ({
  ctxRef: {
    current: {} as {
      wallet: Wallet;
      tags: Tag[];
      toCategorise: Transaction[];
      fetchData: ReturnType<typeof vi.fn>;
    },
  },
  bank: { deleteBankRule: vi.fn(), applyBankRules: vi.fn() },
}));
vi.mock("../../../../dashboard/wallet/WalletContext.tsx", () => ({
  useWalletContext: () => ctxRef.current,
  // TagBadge reads the context directly.
  WalletContext: createContext(null),
}));
vi.mock("../../../../api/bankApi", () => bank);
vi.mock("../../../../components/ui/ToastNotification.tsx", () => ({
  triggerToast: vi.fn(),
}));
// The real editor has its own suite; here it only reports what it was given.
vi.mock("../../../../dashboard/settings/BankRuleEditor.tsx", () => ({
  BankRuleEditor: (p: {
    open: boolean;
    rule: BankRule | null;
    draft?: { matchText?: string };
    onDelete?: () => void;
  }) =>
    p.open ? (
      <div role="dialog" aria-label="editor">
        <span>{p.rule ? `editing ${p.rule.name}` : "new"}</span>
        <span>draft:{p.draft?.matchText ?? ""}</span>
        {p.onDelete && <button onClick={p.onDelete}>Delete rule</button>}
      </div>
    ) : null,
}));

import { BankRulesPanel } from "../../../../dashboard/settings/bank/BankRulesPanel";

const tag = (name: string) =>
  ({ name, icon: "tag", colorHex: "#22c55e" }) as Tag;
const rule = (id: string, name: string, matchText: string, t?: string) =>
  ({
    id,
    name,
    matchText,
    regex: false,
    ignoreCase: true,
    tag: t ? tag(t) : null,
    usedBy: [],
    transactionCount: 0,
  }) as BankRule;

const threeRules = [
  rule("r1", "Netflix", "NETFLIX", "Streaming"),
  rule("r2", "Spotify", "SPOTIFY", "Streaming"),
  rule("r3", "Zurich", "ZURICH", "Pension"),
];

const wallet = (userRole: Wallet["userRole"]): Wallet =>
  ({
    id: "w1",
    name: "Main",
    color: "#8b5cf6",
    currency: "EUR",
    userRole,
  }) as Wallet;

const setup = (
  rules: BankRule[],
  opts: { role?: Wallet["userRole"]; toCategorise?: number } = {},
) => {
  const reload = vi.fn().mockResolvedValue(undefined);
  ctxRef.current = {
    wallet: wallet(opts.role ?? "OWNER"),
    tags: [],
    toCategorise: Array.from(
      { length: opts.toCategorise ?? 0 },
      (_, i) => ({ id: `t${i}` }) as Transaction,
    ),
    fetchData: vi.fn(),
  };
  render(<BankRulesPanel rules={rules} reload={reload} />);
  return { reload };
};

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
});

describe("BankRulesPanel", () => {
  it("shows the rule count and each rule", () => {
    setup(threeRules);
    expect(screen.getByText("Rules")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("Netflix")).toBeInTheDocument();
    expect(screen.getByText("Zurich")).toBeInTheDocument();
  });

  it("filters as you type and counts the matches", async () => {
    setup(threeRules);
    await userEvent.type(
      screen.getByPlaceholderText("Search by name, bank text or category"),
      "stream",
    );
    expect(screen.getByText("2 of 3")).toBeInTheDocument();
    expect(screen.queryByText("Zurich")).toBeNull();
  });

  it("says so when nothing matches, and Add pre-fills the query", async () => {
    setup(threeRules);
    await userEvent.type(
      screen.getByPlaceholderText("Search by name, bank text or category"),
      "unipol",
    );
    expect(screen.getByText("No rule matches")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /add rule/i }));
    expect(screen.getByRole("dialog", { name: "editor" })).toHaveTextContent(
      "draft:unipol",
    );
  });

  it("disables Apply when nothing is left to categorise", () => {
    setup(threeRules, { toCategorise: 0 });
    expect(screen.getByRole("button", { name: /apply/i })).toBeDisabled();
  });

  it("applies the rules and refreshes the wallet", async () => {
    bank.applyBankRules.mockResolvedValue({ updated: 2, collisions: 0 });
    const { reload } = setup(threeRules, { toCategorise: 2 });
    const apply = screen.getByRole("button", { name: /apply/i });
    expect(apply).toHaveTextContent("2");
    await userEvent.click(apply);
    await waitFor(() => expect(bank.applyBankRules).toHaveBeenCalledWith("w1"));
    expect(ctxRef.current.fetchData).toHaveBeenCalled();
    expect(reload).not.toHaveBeenCalled();
  });

  it("opens the editor for the rule that was clicked", async () => {
    setup(threeRules);
    await userEvent.click(screen.getByRole("button", { name: /spotify/i }));
    expect(screen.getByText("editing Spotify")).toBeInTheDocument();
  });

  it("deletes through the confirmation", async () => {
    bank.deleteBankRule.mockResolvedValue(undefined);
    const { reload } = setup(threeRules);
    await userEvent.click(screen.getByRole("button", { name: /netflix/i }));
    await userEvent.click(screen.getByRole("button", { name: "Delete rule" }));
    expect(bank.deleteBankRule).not.toHaveBeenCalled();
    const modal = within(document.getElementById("modal-root")!);
    await userEvent.click(
      await modal.findByRole("button", { name: "Delete rule" }),
    );
    await waitFor(() =>
      expect(bank.deleteBankRule).toHaveBeenCalledWith("w1", "r1"),
    );
    expect(reload).toHaveBeenCalled();
  });

  it("groups by category only above 15 rules", () => {
    const many = Array.from({ length: 16 }, (_, i) =>
      rule(`x${i}`, `Rule ${i}`, `TXT${i}`, i < 8 ? "Groceries" : undefined),
    );
    setup(many);
    expect(screen.getByText("No category")).toBeInTheDocument();
  });

  it("keeps the flat list at 15 rules", () => {
    const fifteen = Array.from({ length: 15 }, (_, i) =>
      rule(`x${i}`, `Rule ${i}`, `TXT${i}`, "Groceries"),
    );
    setup(fifteen);
    expect(screen.queryByText("No category")).toBeNull();
  });

  it("gives viewers a read-only list", () => {
    setup(threeRules, { role: "VIEWER" });
    expect(screen.queryByRole("button", { name: /add rule/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /apply/i })).toBeNull();
    expect(screen.getByRole("button", { name: /netflix/i })).toBeDisabled();
  });
});
