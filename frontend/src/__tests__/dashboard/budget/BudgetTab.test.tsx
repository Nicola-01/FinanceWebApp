import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Budget, Wallet } from "../../../utils/types";

const budgetsFixture: Budget[] = [
  {
    id: "b1",
    name: "Food budget",
    tagName: "Food",
    limitAmount: 300,
    periodType: "MONTHLY",
    startDate: "2026-07-01",
    endDate: null,
    rollover: false,
    alertThresholds: [80, 100],
    periodStart: "2026-07-01",
    periodEnd: "2026-07-31",
    spent: 250,
    effectiveLimit: 300,
    remaining: 50,
    percentUsed: 83,
    status: "WARNING",
    crossedThresholds: [80],
    active: true,
  },
];

const mockUseBudgets = vi.fn();
vi.mock("../../../dashboard/budget/useBudgets", () => ({
  useBudgets: (walletId: string) => mockUseBudgets(walletId),
}));

const wallet = {
  id: "w1",
  name: "Main",
  icon: "wallet",
  color: "#7c3aed",
  currency: "EUR",
  createdAt: "",
  userRole: "EDITOR",
} as Wallet;

const mockContext = vi.fn();
vi.mock("../../../dashboard/wallet/WalletContext.tsx", () => ({
  useWalletContext: () => mockContext(),
}));

vi.mock("../../../modals/common/DeleteModalContext.tsx", () => ({
  useDeleteModal: vi.fn(),
}));

import { BudgetTab } from "../../../dashboard/budget/BudgetTab";
import { useDeleteModal } from "../../../modals/common/DeleteModalContext.tsx";

const mockedDelete = useDeleteModal as unknown as ReturnType<typeof vi.fn>;

describe("BudgetTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockContext.mockReturnValue({ wallet, tags: [] });
    mockedDelete.mockReturnValue({ current: { deleteObject: vi.fn() } });
    mockUseBudgets.mockReturnValue({
      budgets: budgetsFixture,
      isLoading: false,
      refresh: vi.fn(),
      createBudget: vi.fn(),
      updateBudget: vi.fn(),
      deleteBudget: vi.fn(),
    });
  });

  it("renders a card per budget with its status", () => {
    render(<BudgetTab />);
    expect(screen.getByText("Food budget")).toBeInTheDocument();
    expect(screen.getByText("Near limit")).toBeInTheDocument();
    expect(screen.getByText("Monthly")).toBeInTheDocument();
  });

  it("shows the New budget button to editors", () => {
    render(<BudgetTab />);
    expect(
      screen.getByRole("button", { name: /new budget/i }),
    ).toBeInTheDocument();
  });

  it("hides the New budget button from viewers", () => {
    mockContext.mockReturnValue({
      wallet: { ...wallet, userRole: "VIEWER" },
      tags: [],
    });
    render(<BudgetTab />);
    expect(
      screen.queryByRole("button", { name: /new budget/i }),
    ).not.toBeInTheDocument();
  });

  it("renders the empty state when there are no budgets", () => {
    mockUseBudgets.mockReturnValue({
      budgets: [],
      isLoading: false,
      refresh: vi.fn(),
      createBudget: vi.fn(),
      updateBudget: vi.fn(),
      deleteBudget: vi.fn(),
    });
    render(<BudgetTab />);
    expect(screen.getByText(/no budgets yet/i)).toBeInTheDocument();
  });
});
