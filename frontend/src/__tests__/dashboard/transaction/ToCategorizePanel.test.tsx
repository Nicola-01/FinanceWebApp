import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ToCategorizePanel } from "../../../dashboard/transaction/ToCategorizePanel";
import * as walletOps from "../../../api/walletOps";
import { DeleteModalContext } from "../../../modals/common/DeleteModalContext";
import type { Transaction, Wallet } from "../../../types/domain";

vi.mock("../../../api/walletOps", () => ({
  updateTransaction: vi.fn().mockResolvedValue({}),
  deleteTransaction: vi.fn().mockResolvedValue({}),
}));
vi.mock("../../../components/ui/ToastNotification.tsx", () => ({
  triggerToast: vi.fn(),
}));
vi.mock("../../../modals/transaction/TagPicker.tsx", () => ({
  TagPicker: ({ onSelectTag }: { onSelectTag: (n: string) => void }) => (
    <button onClick={() => onSelectTag("Food")}>pick-tag</button>
  ),
}));

const wallet: Wallet = {
  id: "w1",
  name: "Main",
  icon: "wallet",
  color: "#8b5cf6",
  currency: "EUR",
  createdAt: "2026-01-01",
  userRole: "EDITOR",
};

const tx = (id: string): Transaction => ({
  id,
  name: `Shop ${id}`,
  tag: { name: "To categorize", icon: "tag", colorHex: "#999999" },
  amount: 10,
  originalAmount: 10,
  originalCurrency: "EUR",
  type: "EXPENSE",
  transactionDate: "2026-06-27",
  needsReview: true,
  imported: true,
});

const renderPanel = (
  w: Wallet,
  list: Transaction[],
  deleteObject = vi.fn(),
  onRefresh = vi.fn(),
) =>
  render(
    <DeleteModalContext.Provider value={{ current: { deleteObject } }}>
      <ToCategorizePanel
        wallet={w}
        tags={[]}
        transactions={list}
        onRefresh={onRefresh}
        onOpenDetails={vi.fn()}
        onEdit={vi.fn()}
      />
    </DeleteModalContext.Provider>,
  );

describe("ToCategorizePanel", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders nothing for an empty list", () => {
    const { container } = renderPanel(wallet, []);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows tag, edit and delete controls for an editor", () => {
    renderPanel(wallet, [tx("1")]);
    expect(screen.getByText("pick-tag")).toBeInTheDocument();
    expect(screen.getByLabelText("Edit Shop 1")).toBeInTheDocument();
    expect(screen.getByLabelText("Delete Shop 1")).toBeInTheDocument();
  });

  it("shows no actions for a viewer", () => {
    renderPanel({ ...wallet, userRole: "VIEWER" }, [tx("1")]);
    expect(screen.queryByText("pick-tag")).toBeNull();
    expect(screen.queryByLabelText("Edit Shop 1")).toBeNull();
    expect(screen.queryByLabelText("Delete Shop 1")).toBeNull();
  });

  it("updates the transaction with the new tag name and refreshes", async () => {
    const onRefresh = vi.fn();
    renderPanel(wallet, [tx("1")], vi.fn(), onRefresh);
    fireEvent.click(screen.getByText("pick-tag"));
    await waitFor(() => expect(onRefresh).toHaveBeenCalled());
    expect(walletOps.updateTransaction).toHaveBeenCalledWith(
      "w1",
      "1",
      expect.objectContaining({ tag: "Food", name: "Shop 1" }),
      null,
    );
  });

  it("collapses to 5 rows and expands on Show all", () => {
    renderPanel(
      wallet,
      Array.from({ length: 7 }, (_, i) => tx(String(i))),
    );
    expect(screen.getAllByText("pick-tag")).toHaveLength(5);
    fireEvent.click(screen.getByText("Show all (7)"));
    expect(screen.getAllByText("pick-tag")).toHaveLength(7);
  });

  it("delete goes through the confirm modal then walletOps", async () => {
    const deleteObject = vi.fn((_o, _n, cb) => cb());
    renderPanel(wallet, [tx("1")], deleteObject);
    fireEvent.click(screen.getByLabelText("Delete Shop 1"));
    await waitFor(() =>
      expect(walletOps.deleteTransaction).toHaveBeenCalledWith("w1", "1", null),
    );
  });
});
