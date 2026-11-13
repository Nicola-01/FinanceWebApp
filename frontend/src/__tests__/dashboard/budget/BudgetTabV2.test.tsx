import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Budget, Wallet } from "../../../types/domain";
import { setUiVersion } from "../../../utils/uiVersion";

const makeBudget = (overrides: Partial<Budget>): Budget => ({
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
  periodEnd: "2099-07-31",
  spent: 250,
  effectiveLimit: 300,
  remaining: 50,
  percentUsed: 83,
  status: "WARNING",
  crossedThresholds: [80],
  active: true,
  ...overrides,
});

// jsdom cannot lay out the chart kit (it draws no svg); stub it with the props the card passes.
vi.mock("@/components/ui/charts", () => ({
  Gauge: (props: {
    ariaLabel: string;
    centerValue: number;
    suffix: string;
  }) => (
    <div role="img" aria-label={props.ariaLabel}>
      {`${props.centerValue}${props.suffix}`}
    </div>
  ),
}));

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
  useDeleteModal: vi.fn(() => ({ current: { deleteObject: vi.fn() } })),
}));

import { BudgetTab } from "../../../dashboard/budget/BudgetTab";

const setBudgets = (budgets: Budget[]) =>
  mockUseBudgets.mockReturnValue({
    budgets,
    isLoading: false,
    refresh: vi.fn(),
    createBudget: vi.fn(),
    updateBudget: vi.fn(),
    deleteBudget: vi.fn(),
  });

describe("BudgetTab (v2)", () => {
  beforeEach(() => {
    setUiVersion("v2");
    mockContext.mockReturnValue({ wallet, tags: [] });
    setBudgets([
      makeBudget({}),
      makeBudget({
        id: "b2",
        name: "Holiday",
        tagName: null,
        spent: 400,
        effectiveLimit: 300,
        remaining: -100,
        percentUsed: 133,
        status: "EXCEEDED",
      }),
    ]);
  });

  afterEach(() => {
    setUiVersion("v1");
  });

  it("renders the header, status pills and the dashed New budget card", () => {
    render(<BudgetTab />);
    expect(
      screen.getByRole("heading", { name: "Budgets" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Close to the limit")).toBeInTheDocument();
    expect(screen.getByText(/^Over by/)).toBeInTheDocument();
    expect(screen.getByText("Whole wallet")).toBeInTheDocument();
    // Header CTA plus the dashed card.
    expect(screen.getAllByRole("button", { name: /new budget/i })).toHaveLength(
      2,
    );
  });

  it("renders a labelled gauge with the real percentage, even over 100", () => {
    render(<BudgetTab />);
    expect(
      screen.getByRole("img", { name: "Budget used: 83%" }),
    ).toHaveTextContent("83%");
    expect(
      screen.getByRole("img", { name: "Budget used: 133%" }),
    ).toHaveTextContent("133%");
  });

  it("opens the form from the dashed card", () => {
    render(<BudgetTab />);
    fireEvent.click(screen.getAllByRole("button", { name: /new budget/i })[1]);
    expect(screen.getByText("Create budget")).toBeInTheDocument();
  });

  it("renders the empty state with a New budget action for editors", () => {
    setBudgets([]);
    render(<BudgetTab />);
    expect(screen.getByText("No budgets yet")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /new budget/i })).toHaveLength(
      2,
    );
  });

  it("hides New budget from viewers", () => {
    mockContext.mockReturnValue({
      wallet: { ...wallet, userRole: "VIEWER" },
      tags: [],
    });
    render(<BudgetTab />);
    expect(
      screen.queryByRole("button", { name: /new budget/i }),
    ).not.toBeInTheDocument();
  });
});
