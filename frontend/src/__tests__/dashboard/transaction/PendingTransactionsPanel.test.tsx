import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { PendingTransactionsPanel } from "../../../dashboard/transaction/PendingTransactionsPanel";
import api from "../../../api/axiosConfig";
import type { Transaction, Wallet } from "../../../utils/types";

vi.mock("../../../api/axiosConfig", () => ({
  default: { put: vi.fn().mockResolvedValue({ data: {} }) },
}));
vi.mock("../../../components/ui/ToastNotification.tsx", () => ({
  triggerToast: vi.fn(),
}));

const wallet: Wallet = {
  id: "w1",
  name: "Main",
  icon: "wallet",
  color: "#8b5cf6",
  currency: "EUR",
  createdAt: "2026-01-01",
  userRole: "OWNER",
};

const pendingTx: Transaction = {
  id: "t1",
  subscriptionId: "s1",
  name: "Salary",
  tag: { name: "Job", icon: "tag", colorHex: "#22c55e" },
  amount: 0,
  amountPending: true,
  originalCurrency: "EUR",
  type: "INCOME",
  transactionDate: "2026-06-27",
};

describe("PendingTransactionsPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when there are no pending transactions", () => {
    const { container } = render(
      <PendingTransactionsPanel
        wallet={wallet}
        pendingTransactions={[]}
        onFilled={vi.fn()}
        onOpenDetails={vi.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("submits the amount to the fill endpoint and notifies the parent", async () => {
    const onFilled = vi.fn();
    render(
      <PendingTransactionsPanel
        wallet={wallet}
        pendingTransactions={[pendingTx]}
        onFilled={onFilled}
        onOpenDetails={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByLabelText("Amount for Salary"), {
      target: { value: "2450" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Confirm amount" }));
    await waitFor(() =>
      expect(api.put).toHaveBeenCalledWith("/transactions/w1/t1/amount", {
        originalAmount: 2450,
      }),
    );
    expect(onFilled).toHaveBeenCalled();
  });

  it("opens the details view when the row body is clicked", () => {
    const onOpenDetails = vi.fn();
    render(
      <PendingTransactionsPanel
        wallet={wallet}
        pendingTransactions={[pendingTx]}
        onFilled={vi.fn()}
        onOpenDetails={onOpenDetails}
      />,
    );
    fireEvent.click(screen.getByText("Salary"));
    expect(onOpenDetails).toHaveBeenCalledWith(pendingTx);
  });

  it("hides the inline input for viewers", () => {
    render(
      <PendingTransactionsPanel
        wallet={{ ...wallet, userRole: "VIEWER" }}
        pendingTransactions={[pendingTx]}
        onFilled={vi.fn()}
        onOpenDetails={vi.fn()}
      />,
    );
    expect(
      screen.queryByLabelText("Amount for Salary"),
    ).not.toBeInTheDocument();
  });
});
