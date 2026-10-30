import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ToCategoriseActions } from "../../../dashboard/transaction/ToCategoriseActions";
import * as walletOps from "../../../api/walletOps";
import { DeleteModalContext } from "../../../modals/common/DeleteModalContext";
import type { Transaction } from "../../../types/domain";

const ctx = vi.hoisted(() => ({
  role: "EDITOR",
  fetchData: vi.fn(),
  transactions: [] as Transaction[],
}));

vi.mock("../../../dashboard/wallet/WalletContext.tsx", () => ({
  useWalletContext: () => ({
    wallet: { id: "w1", currency: "EUR", userRole: ctx.role },
    tags: [],
    transactions: ctx.transactions,
    fetchData: ctx.fetchData,
  }),
}));
vi.mock("../../../api/walletOps", () => ({
  updateTransaction: vi.fn().mockResolvedValue({}),
  deleteTransaction: vi.fn().mockResolvedValue({}),
}));
vi.mock("../../../components/ui/ToastNotification.tsx", () => ({
  triggerToast: vi.fn(),
}));
vi.mock("../../../modals/transaction/TagPicker.tsx", () => ({
  TagPicker: ({
    onSelectTag,
    selectedTagName,
  }: {
    onSelectTag: (n: string) => void;
    selectedTagName: string;
  }) => (
    <button data-selected={selectedTagName} onClick={() => onSelectTag("Food")}>
      pick-tag
    </button>
  ),
}));

const tx = {
  id: "1",
  name: "OpenAI",
  tag: { name: "To categorise", icon: "bank", colorHex: "#999" },
  amount: 10,
  originalAmount: 10,
  originalCurrency: "EUR",
  type: "EXPENSE",
  transactionDate: "2026-06-27",
  needsReview: true,
} as Transaction;

const renderActions = (deleteObject = vi.fn()) =>
  render(
    <DeleteModalContext.Provider value={{ current: { deleteObject } }}>
      <ToCategoriseActions transaction={tx} />
    </DeleteModalContext.Provider>,
  );

describe("ToCategoriseActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ctx.role = "EDITOR";
    ctx.transactions = [];
  });

  it("pre-selects the tag of a past same-name transaction and confirms it with the tick", async () => {
    ctx.transactions = [
      {
        ...tx,
        id: "old",
        needsReview: false,
        tag: { name: "AI", icon: "x", colorHex: "#000" },
      } as Transaction,
    ];
    renderActions();
    expect(screen.getByText("pick-tag")).toHaveAttribute("data-selected", "AI");
    fireEvent.click(screen.getByLabelText("Confirm AI for OpenAI"));
    await waitFor(() => expect(ctx.fetchData).toHaveBeenCalled());
    expect(walletOps.updateTransaction).toHaveBeenCalledWith(
      "w1",
      "1",
      expect.objectContaining({ tag: "AI" }),
      null,
    );
  });

  it("shows no tick without a suggestion", () => {
    renderActions();
    expect(screen.queryByLabelText(/^Confirm/)).toBeNull();
  });

  it("files the transaction under the picked tag and refreshes", async () => {
    renderActions();
    fireEvent.click(screen.getByText("pick-tag"));
    await waitFor(() => expect(ctx.fetchData).toHaveBeenCalled());
    expect(walletOps.updateTransaction).toHaveBeenCalledWith(
      "w1",
      "1",
      expect.objectContaining({ tag: "Food", name: "OpenAI" }),
      null,
    );
  });

  it("deletes through the confirm modal", async () => {
    const deleteObject = vi.fn((_o, _n, cb) => cb());
    renderActions(deleteObject);
    fireEvent.click(screen.getByLabelText("Delete OpenAI"));
    await waitFor(() =>
      expect(walletOps.deleteTransaction).toHaveBeenCalledWith("w1", "1", null),
    );
  });

  it("renders nothing for a viewer", () => {
    ctx.role = "VIEWER";
    const { container } = renderActions();
    expect(container).toBeEmptyDOMElement();
  });
});
