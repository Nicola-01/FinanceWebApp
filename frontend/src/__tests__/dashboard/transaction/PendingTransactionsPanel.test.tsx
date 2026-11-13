import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { PendingTransactionsPanel } from "../../../dashboard/transaction/PendingTransactionsPanel";
import api from "../../../api/axiosConfig";
import type { Transaction, Wallet } from "../../../types/domain";
import { setUiVersion } from "../../../utils/uiVersion";

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

  it("focuses the amount input of the deep-linked row", () => {
    render(
      <PendingTransactionsPanel
        wallet={wallet}
        pendingTransactions={[pendingTx]}
        focusId="t1"
        onFilled={vi.fn()}
        onOpenDetails={vi.fn()}
      />,
    );
    expect(screen.getByLabelText("Amount for Salary")).toHaveFocus();
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
        type: "INCOME",
      }),
    );
    expect(onFilled).toHaveBeenCalled();
  });

  it("sends the chosen direction when the type is flipped to expense", async () => {
    render(
      <PendingTransactionsPanel
        wallet={wallet}
        pendingTransactions={[pendingTx]}
        onFilled={vi.fn()}
        onOpenDetails={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByLabelText("Amount for Salary"), {
      target: { value: "80" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Expense — money out" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Confirm amount" }));
    await waitFor(() =>
      expect(api.put).toHaveBeenCalledWith("/transactions/w1/t1/amount", {
        originalAmount: 80,
        type: "EXPENSE",
      }),
    );
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

describe("PendingTransactionsPanel (v2)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setUiVersion("v2");
  });

  afterEach(() => {
    setUiVersion("v1");
  });

  it("renders a needs-attention row with the title, due copy, amount input and Save", () => {
    render(
      <PendingTransactionsPanel
        wallet={wallet}
        pendingTransactions={[pendingTx]}
        onFilled={vi.fn()}
        onOpenDetails={vi.fn()}
      />,
    );
    expect(screen.getByText("Salary")).toBeInTheDocument();
    const row = screen.getByText("Salary").closest(".grid") as HTMLElement;
    expect(row).toHaveClass(
      "shadow-[inset_3px_0_0_var(--color-app-warn),var(--box-ring)]",
    );
    expect(row).not.toHaveClass("ring-1");
    expect(
      screen.getByText(/^Due .+, waiting for the amount$/),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Amount for Salary")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Confirm amount" }),
    ).toHaveTextContent("Save");
    expect(screen.queryByText("Awaiting amount")).not.toBeInTheDocument();
  });

  it("amount input uses tabular figures in the UI font, not monospace", () => {
    render(
      <PendingTransactionsPanel
        wallet={wallet}
        pendingTransactions={[pendingTx]}
        onFilled={vi.fn()}
        onOpenDetails={vi.fn()}
      />,
    );
    const input = screen.getByLabelText("Amount for Salary");
    expect(input).toHaveClass("tabular-nums", "text-right");
    expect(input).not.toHaveClass("font-app-mono");
  });

  it("Save submits through the same fill endpoint and notifies the parent", async () => {
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
        type: "INCOME",
      }),
    );
    expect(onFilled).toHaveBeenCalled();
  });

  it("hides the input and Save for viewers", () => {
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
    expect(screen.queryByRole("button", { name: "Confirm amount" })).toBeNull();
  });
});
