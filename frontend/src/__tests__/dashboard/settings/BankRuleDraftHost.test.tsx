import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type { Transaction } from "../../../types/domain";

const ctx = vi.hoisted(() => ({
  role: "OWNER",
  fetchData: vi.fn(),
  toCategorise: [] as Transaction[],
}));
const { bank, triggerToast } = vi.hoisted(() => ({
  bank: { createBankRule: vi.fn(), applyBankRules: vi.fn() },
  triggerToast: vi.fn(),
}));

vi.mock("../../../dashboard/wallet/WalletContext.tsx", () => ({
  useWalletContext: () => ({
    wallet: { id: "w1", color: "#8b5cf6", userRole: ctx.role },
    tags: [],
    toCategorise: ctx.toCategorise,
    fetchData: ctx.fetchData,
  }),
}));
vi.mock("../../../api/bankApi", () => bank);
vi.mock("../../../components/ui/ToastNotification.tsx", () => ({
  triggerToast,
}));
vi.mock("../../../modals/transaction/TagPicker", () => ({
  TagPicker: ({ selectedTagName }: { selectedTagName: string }) => (
    <input aria-label="Tag" value={selectedTagName} readOnly />
  ),
}));

import { BankRuleDraftHost } from "../../../dashboard/settings/BankRuleDraftHost";
import { openRuleDraft } from "../../../dashboard/settings/bankRuleDraft";

const tx = {
  id: "t1",
  name: "Renamed",
  notes: "Bank: UNIPOLMOVE; Recurring: Car (#3)",
} as Transaction;

beforeEach(() => {
  vi.clearAllMocks();
  ctx.role = "OWNER";
  ctx.toCategorise = [tx, { id: "t2", name: "UNIPOLMOVE 2" } as Transaction];
});

describe("BankRuleDraftHost", () => {
  it("opens the editor pre-filled from the import when a draft is requested", () => {
    render(<BankRuleDraftHost />);
    expect(screen.queryByLabelText("Rule name")).toBeNull();

    act(() => openRuleDraft(tx, "Car"));

    expect(screen.getByLabelText("Rule name")).toHaveValue("Unipolmove");
    expect(screen.getByLabelText("Trigger text")).toHaveValue("UNIPOLMOVE");
    expect(screen.getByLabelText("Tag")).toHaveValue("Car");
    expect(
      screen.getByText("Matches 2 transactions to categorise"),
    ).toBeInTheDocument();
  });

  it("applies the rules to the to-categorise imports after saving", async () => {
    bank.createBankRule.mockResolvedValue({ id: "r1" });
    bank.applyBankRules.mockResolvedValue({ updated: 2, collisions: 0 });
    render(<BankRuleDraftHost />);
    act(() => openRuleDraft(tx));

    fireEvent.click(screen.getByRole("button", { name: "Save rule" }));

    await waitFor(() => expect(bank.applyBankRules).toHaveBeenCalledWith("w1"));
    expect(bank.createBankRule).toHaveBeenCalledWith(
      "w1",
      expect.objectContaining({ name: "Unipolmove", matchText: "UNIPOLMOVE" }),
    );
    expect(triggerToast).toHaveBeenCalledWith("Updated 2 imports", true);
    expect(ctx.fetchData).toHaveBeenCalled();
  });

  it("renders nothing for a viewer", () => {
    ctx.role = "VIEWER";
    const { container } = render(<BankRuleDraftHost />);
    act(() => openRuleDraft(tx));
    expect(container).toBeEmptyDOMElement();
  });
});
